import os
import json
import re
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from auth.dependencies import get_current_user
from auth.models import UserInDB
from .local_llm_handler import LocalModelHandler
from .local_embedding_handler import LocalEmbeddingHandler
from langchain_pinecone import PineconeVectorStore
from langchain_core.messages import HumanMessage
from .research_service import ResearchService

router = APIRouter(prefix="/chat", tags=["chat"])

# ── Request / Response models ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[dict]] = []
    mode: str = "fast"

class ChatResponse(BaseModel):
    response: str
    source: str   # "documents" | "agents" | "llm"
    docs_found: int = 0

# ── Pinecone search helper ─────────────────────────────────────────────────────
async def _search_user_docs(query: str, user_id: str, session_id: str = None, top_k: int = 4):
    """Return relevant chunks from the user's uploaded docs in Pinecone."""
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "thedefenders")
    if not api_key:
        return []
    try:
        embeddings = LocalEmbeddingHandler.get_embeddings()
        if embeddings is None:
            return []
        vs = PineconeVectorStore(
            index_name=index_name,
            embedding=embeddings,
            pinecone_api_key=api_key,
        )
        search_filter = {"user_id": user_id}
        if session_id:
            search_filter["session_id"] = session_id

        results = vs.similarity_search(
            query,
            k=top_k,
            filter=search_filter,
        )

        if not results and session_id:
             results = vs.similarity_search(
                query,
                k=top_k,
                filter={"user_id": user_id, "session_id": "global"},
            )
        return results
    except Exception as e:
        print(f"⚠️ ChatRouter: Pinecone search failed: {e}")
        return []

# ── Agent query decompose + dispatch ──────────────────────────────────────────
async def _run_agents_for_chat(query: str, llm) -> str:
    """
    Step 1 – Master LLM decomposes query into agent tasks (JSON).
    Step 2 – Run selected agents.
    Step 3 – Synthesize with LLM into a short conversational answer.
    """
    # ── Step 1: Query decomposition ───────────────────────────────────────────
    decompose_prompt = f"""You are a pharmaceutical AI assistant dispatcher.
Given a user query, decide which specialized agents to call.

Available agents:
- web       : General web search, latest news
- iqvia     : Pharma market data, sales analytics
- exim      : Drug import/export, supply chain
- patent    : Intellectual property, patent search
- clinical  : Clinical trials data

Respond ONLY with a JSON array like:
[{{"agent": "web", "task": "search for recent news on X"}}, {{"agent": "clinical", "task": "find phase 3 trials for Y"}}]

User query: "{query}"
JSON:"""

    agent_plan = []
    try:
        resp = await llm.ainvoke([HumanMessage(content=decompose_prompt)])
        raw = resp.content if hasattr(resp, "content") else str(resp)
        # Strip think tags
        raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start != -1 and end > start:
            agent_plan = json.loads(raw[start:end])
    except Exception as e:
        print(f"⚠️ ChatRouter: decompose failed: {e}")
        agent_plan = [{"agent": "web", "task": query}]

    print(f"🗂️ [ChatRouter] Agent plan: {agent_plan}")

    # ── Step 2: Run agents ─────────────────────────────────────────────────────
    findings: dict = {}
    for item in agent_plan[:3]:  # cap at 3 for speed
        agent_name = item.get("agent", "web")
        task = item.get("task", query)
        try:
            if agent_name == "web":
                from .web_agent import WebAgent
                findings["web"] = await WebAgent().search(task)
            elif agent_name == "iqvia":
                from .iqvia_agent import IQVIAAgent
                findings["iqvia"] = await IQVIAAgent().analyze(task)
            elif agent_name == "exim":
                from .exim_agent import EXIMAgent
                findings["exim"] = await EXIMAgent().analyze(task)
            elif agent_name == "patent":
                from .patent_agent import PatentAgent
                findings["patent"] = await PatentAgent().search_patents(task)
            elif agent_name == "clinical":
                from .clinical_agent import ClinicalAgent
                findings["clinical"] = await ClinicalAgent().search_trials(task)
        except Exception as e:
            findings[agent_name] = {"error": str(e)}
            print(f"⚠️ ChatRouter: {agent_name} agent error: {e}")

    # ── Step 3: Synthesize findings ────────────────────────────────────────────
    findings_str = json.dumps(findings, indent=2, default=str)[:3000]
    synthesis_prompt = f"""You are PharmaAI, a concise pharmaceutical research assistant.
Based on the research findings below, write a clear, helpful, conversational answer (3-6 sentences max).
Do NOT include raw JSON. Write in plain English with key facts highlighted.

User asked: "{query}"

Research Findings:
{findings_str}

Your concise answer:"""
    try:
        resp = await llm.ainvoke([HumanMessage(content=synthesis_prompt)])
        answer = resp.content if hasattr(resp, "content") else str(resp)
        answer = re.sub(r'<think>.*?</think>', '', answer, flags=re.DOTALL).strip()
        return answer
    except Exception as e:
        return f"Research data gathered but could not synthesize: {e}"


# ── Main Chat Endpoint ─────────────────────────────────────────────────────────
@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Smart chat endpoint:
    1. Search user's uploaded Pinecone docs first.
    2. If relevant docs found → answer from them using local LLM.
    3. Otherwise → decompose query, dispatch agents, synthesize answer.
    """
    llm = LocalModelHandler.get_llm()
    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Local LLM not ready yet. The model may still be loading. Please try again in a moment."
        )

    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty message")

    # ── Phase 1: Check user's uploaded documents ───────────────────────────────
    print(f"💬 [ChatRouter] Query: {query[:80]}...")
    docs = await _search_user_docs(query, current_user.id, session_id=req.session_id)

    if docs:
        print(f"📚 [ChatRouter] Found {len(docs)} relevant doc chunks → answering from docs")
        context = "\n\n---\n\n".join([d.page_content for d in docs])
        doc_prompt = f"""You are PharmaAI, a pharmaceutical research assistant.
Answer the user's question using ONLY the document context below.
Be concise and conversational (3-6 sentences). If the context doesn't fully answer, say so.

Document Context:
{context[:2500]}

User Question: {query}

Your answer:"""
        try:
            resp = await llm.ainvoke([HumanMessage(content=doc_prompt)])
            answer = resp.content if hasattr(resp, "content") else str(resp)
            answer = re.sub(r'<think>.*?</think>', '', answer, flags=re.DOTALL).strip()
            
            if "not found" in answer.lower() or "no information" in answer.lower() or "context does not" in answer.lower():
                print(f"📚 [ChatRouter] RAG response indicated insufficient info, falling back to agents...")
            else:
                return ChatResponse(response=answer, source="documents", docs_found=len(docs))
        except Exception as e:
            print(f"⚠️ ChatRouter: Doc-based LLM call failed: {e}")
            # Fall through to agent pipeline

    # ── Phase 2: Agent pipeline ────────────────────────────────────────────────
    print(f"🤖 [ChatRouter] No docs found → running agent pipeline...")
    answer = await _run_agents_for_chat(query, llm)
    
    if req.session_id:
        try:
            await ResearchService().add_chat_to_session(req.session_id, [
                {"role": "user", "content": query},
                {"role": "ai", "content": answer, "source": "agents"}
            ])
        except Exception as save_err:
            print(f"⚠️ ChatRouter: Failed to save chat history: {save_err}")
            
    return ChatResponse(response=answer, source="agents", docs_found=0)

import asyncio
from fastapi.responses import StreamingResponse

@router.post("/stream")
async def chat_stream(
    req: ChatRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Streaming chat endpoint.
    Fast mode: web_search + RAG in parallel
    Thinking mode: web_search + RAG + agents in parallel
    """
    llm = LocalModelHandler.get_llm()
    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Local LLM not ready yet. The model may still be loading."
        )

    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty message")

    async def stream_generator():
        start_time = time.time()
        yield f"data: {json.dumps({'type': 'status', 'content': f'Gathering intelligence ({req.mode} mode)...'})}\n\n"
        
        # Gather data
        docs_task = _search_user_docs(query, current_user.id, session_id=req.session_id)
        from .web_agent import WebAgent
        
        if req.mode == "fast":
            docs, web_res = await asyncio.gather(docs_task, WebAgent().search(query))
            findings = {"web": web_res}
        else:
            # Thinking mode runs all agents
            from .iqvia_agent import IQVIAAgent
            from .patent_agent import PatentAgent
            from .clinical_agent import ClinicalAgent
            from .exim_agent import EXIMAgent
            
            # Using asyncio.gather for parallel execution
            results = await asyncio.gather(
                docs_task,
                WebAgent().search(query),
                IQVIAAgent().analyze(query),
                PatentAgent().search_patents(query),
                ClinicalAgent().search_trials(query),
                return_exceptions=True
            )
            docs = results[0] if not isinstance(results[0], Exception) else []
            findings = {
                "web": results[1] if not isinstance(results[1], Exception) else str(results[1]),
                "iqvia": results[2] if not isinstance(results[2], Exception) else str(results[2]),
                "patent": results[3] if not isinstance(results[3], Exception) else str(results[3]),
                "clinical": results[4] if not isinstance(results[4], Exception) else str(results[4]),
            }
        
        context_str = ""
        if docs:
            context_str += "Document Context:\n" + "\n".join([d.page_content for d in docs]) + "\n\n"
        context_str += "Web & Agent Findings:\n" + json.dumps(findings, indent=2, default=str)[:4000]
        
        yield f"data: {json.dumps({'type': 'status', 'content': 'Synthesizing response...'})}\n\n"
        
        doc_prompt = f"""You are PharmaAI, a pharmaceutical research assistant.

INSTRUCTIONS:
1. PRIORITY 1: Use the 'Document Context' (Internal Proprietary Data) to answer the question. If the answer is here, focus on it.
2. PRIORITY 2: If the Document Context is insufficient, use the 'Web & Agent Findings' (External Research) to provide a complete answer.
3. If neither contains the answer, explain what you searched and why it was not found.
4. Be conversational, professional, and concise (3-6 sentences).
5. Do NOT output raw JSON. Support your answer with citations if provided in the context.

Context:
{context_str[:6000]}

User Question: {query}

Your answer:"""
        
        full_answer = ""
        try:
            # Send chunks
            async for chunk in llm.astream([HumanMessage(content=doc_prompt)]):
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                
                # strip out inline thinking tags on the fly if needed
                if "<think>" in content or "</think>" in content:
                    continue  # simplified handling for now
                    
                full_answer += content
                yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
        except Exception as e:
            print(f"⚠️ Stream LLM Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': 'Model stream interrupted.'})}\n\n"
            
        full_answer = re.sub(r'<think>.*?</think>', '', full_answer, flags=re.DOTALL).strip()
        latency = int((time.time() - start_time) * 1000)
        
        # Save to DB
        if req.session_id:
            try:
                await ResearchService().add_chat_to_session(req.session_id, [
                    {"role": "user", "content": query, "timestamp": str(start_time)},
                    {"role": "ai", "content": full_answer, "source": req.mode, "responseTimeMs": latency}
                ])
            except Exception as e:
                print(f"⚠️ ChatRouter: Failed to save trace: {e}")
                
        yield f"data: {json.dumps({'type': 'done', 'responseTimeMs': latency})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
