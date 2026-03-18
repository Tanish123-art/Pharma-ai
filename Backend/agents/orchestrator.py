from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Optional, Any
from agents.state import AgentState
from agents.master_agent import MasterAgent
from agents.iqvia_agent import IQVIAAgent
from agents.exim_agent import EXIMAgent
from agents.patent_agent import PatentAgent
from agents.clinical_agent import ClinicalAgent
from agents.web_agent import WebAgent
from agents.report_agent import ReportAgent
from agents.research_service import ResearchService
from datetime import datetime
import asyncio
from langchain_core.messages import HumanMessage

class AgentOrchestrator:
    def __init__(self, research_service: ResearchService = None):
        self.research_service = research_service or ResearchService()
        
        # Initialize all agents
        self.master_agent = MasterAgent()
        self.iqvia_agent = IQVIAAgent()
        self.exim_agent = EXIMAgent()
        self.patent_agent = PatentAgent()
        self.clinical_agent = ClinicalAgent()
        self.web_agent = WebAgent()
        self.report_agent = ReportAgent()
        
        self.workflow = self._build_workflow()
    
    def _build_workflow(self):
        workflow = StateGraph(AgentState)
        
        # Add Nodes
        workflow.add_node("planning", self.planning_node)
        workflow.add_node("iqvia", self.iqvia_node)
        workflow.add_node("exim", self.exim_node)
        workflow.add_node("patent", self.patent_node)
        workflow.add_node("clinical", self.clinical_node)
        workflow.add_node("web", self.web_node)
        workflow.add_node("synthesis", self.synthesis_node)
        workflow.add_node("reporting", self.reporting_node)
        
        # Define Edges
        workflow.set_entry_point("planning")
        
        # Normal Research Path
        workflow.add_edge("planning", "web")
        workflow.add_edge("planning", "iqvia")
        workflow.add_edge("planning", "exim")
        workflow.add_edge("planning", "patent")
        workflow.add_edge("planning", "clinical")
        
        # All agents converge to synthesis
        workflow.add_edge("web", "synthesis")
        workflow.add_edge("iqvia", "synthesis")
        workflow.add_edge("exim", "synthesis")
        workflow.add_edge("patent", "synthesis")
        workflow.add_edge("clinical", "synthesis")
        
        # End Paths
        workflow.add_edge("synthesis", "reporting")
        workflow.add_edge("reporting", END)
        
        return workflow.compile()

    # --- Node Implementations ---

    async def planning_node(self, state: AgentState):
        """
        STEP 1 — RAG: search user's uploaded Pinecone docs instantly.
        STEP 2 — Master LLM chooses which agents are needed using full descriptions.
        STEP 3 — Return plan + any RAG findings already collected.
        """
        print(f"\n" + "🔍 "*10)
        print(f"🧠 [LangGraph] Planning Node: RAG + Agent Selection...")
        print(f"📄 Query: {state['query'][:100]}...")

        query = state["query"]
        current_findings = state.get("findings", {})

        # ── STEP 1: RAG — Search user's uploaded documents in Pinecone ─────────
        print("📚 [Planning] Step 1: Searching user documents in vector DB...")
        try:
            import os
            from agents.local_embedding_handler import LocalEmbeddingHandler
            from langchain_pinecone import PineconeVectorStore

            api_key = os.getenv("PINECONE_API_KEY")
            index_name = os.getenv("PINECONE_INDEX_NAME", "thedefenders")
            user_id = state.get("user_id", "")
            quick_answer = ""

            if api_key and user_id:
                embeddings = LocalEmbeddingHandler.get_embeddings()
                if embeddings:
                    vs = PineconeVectorStore(
                        index_name=index_name,
                        embedding=embeddings,
                        pinecone_api_key=api_key,
                    )
                    session_id = state.get("session_id")
                    
                    # Search specifically for this session first
                    search_filter = {"user_id": user_id}
                    if session_id:
                        search_filter["session_id"] = session_id

                    rag_docs = vs.similarity_search(
                        query, k=4,
                        filter=search_filter
                    )
                    
                    # If no session docs, try global fallback
                    if not rag_docs and session_id:
                        rag_docs = vs.similarity_search(
                            query, k=4,
                            filter={"user_id": user_id, "session_id": "global"}
                        )
                    if rag_docs:
                        print("   🧠 RAG: Generating quick answer from documents...")
                        rag_context = "\n\n".join([d.page_content for d in rag_docs])
                        
                        quick_answer = f"**Raw Matches from your document:**\n\n{rag_context[:800]}..."
                        if self.master_agent.llm:
                            rag_prompt = f"""You are PharmaAI. Answer the user's question using ONLY the context from their uploaded documents.
Keep it concise (2-4 sentences). Make it clear this is from their documents.

Context:
{rag_context[:3000]}

Question: {query}

Brief Answer:"""
                            try:
                                resp = await self.master_agent.llm.ainvoke([HumanMessage(content=rag_prompt)])
                                raw_ans = resp.content if hasattr(resp, "content") else str(resp)
                                import re
                                quick_answer = re.sub(r'<think>.*?</think>', '', raw_ans, flags=re.DOTALL).strip()
                            except Exception as e:
                                print(f"   ⚠️ RAG quick answer failed: {e}")

                        current_findings["internal_rag"] = {
                            "source": "Your uploaded documents",
                            "chunks_found": len(rag_docs),
                            "quick_answer": quick_answer,
                        }
                        print(f"   ✅ RAG: Quick answer generated.")
                    else:
                        print("   ℹ️  RAG: No matching documents found for this query")
        except Exception as e:
            print(f"   ⚠️  RAG search skipped: {e}")

        # ── STEP 2: Check for manual agent selection ───────────────────────────
        manual_agents = state.get("manual_agents")
        if manual_agents and len(manual_agents) > 0:
            print(f"📋 [Planning] Using MANUAL agent choices: {manual_agents}")
            valid_keys = {"iqvia", "exim", "patent", "clinical", "web", "internal"}
            selected_agents = [k for k in manual_agents if k in valid_keys]
        else:
            # ── STEP 3: Master LLM selects agents using full descriptions ──────
            print(f"🤖 [Planning] Step 2: Master LLM selecting agents...")

            # Full descriptive prompt — gives LLM clear info about each agent
            agent_menu = """
AVAILABLE RESEARCH AGENTS (use exact short keys in your answer):

  "web"      → Web Search Agent: Finds latest news, general information, recent events, company announcements, and regulatory updates from the internet.
  "iqvia"    → IQVIA Market Intelligence Agent: Provides pharmaceutical market data, drug sales analytics, market size, revenue trends, competitive landscape, pricing, and commercial insights.
  "exim"     → Export-Import (EXIM) Trade Agent: Covers drug import/export data, global supply chain analysis, trade volumes, country-level shipment records, and logistics intelligence.
  "patent"   → Patent & IP Search Agent: Searches intellectual property databases for drug patents, patent expiry dates, patent landscapes, freedom-to-operate analysis, and prior art.
  "clinical" → Clinical Trials Intelligence Agent: Retrieves information on ongoing and completed clinical trials, phases (I/II/III/IV), trial sponsors, endpoints, and results from ClinicalTrials.gov.
  "internal" → Internal Documents Agent: Searches proprietary documents and company-specific knowledge uploaded by the user via the RAG pipeline.
"""

            try:
                if self.master_agent.llm:
                    prompt = f"""You are a pharmaceutical research orchestrator.
Given the user's research query below, decide which specialized agents are needed.
Only select agents that are DIRECTLY relevant — do NOT select all if not needed.
Always include "web" as a baseline for context.

{agent_menu}

User Query: "{query}"

RAG Analysis:
{f"I found information in the user's uploaded document: {quick_answer[:1000]}" if current_findings.get("internal_rag") else "No relevant information found in user documents."}

Instructions:
- Think about what data is most relevant to this query given what was already found in the PDF.
- Select ONLY relevant agents (2-4 max for speed)
- If the PDF (RAG Analysis) already completely answers the user, you can just select ["internal"] to synthesize the final answer.
- Always include "web" unless the query is purely about documents.
- Respond with ONLY a JSON array of agent keys

Example response: ["web", "iqvia", "clinical"]

Your selection (JSON only):"""

                    print("   ⏳ Master LLM generating agent plan...")
                    response = await self.master_agent.llm.ainvoke([HumanMessage(content=prompt)])
                    print("   ✅ Plan generated")

                    plan_text = response.content if hasattr(response, "content") else str(response)
                    plan_text = self.master_agent.clean_text(plan_text)

                    import json, re
                    # Strip any <think> tags
                    plan_text = re.sub(r'<think>.*?</think>', '', plan_text, flags=re.DOTALL).strip()

                    try:
                        start = plan_text.find("[")
                        end = plan_text.rfind("]") + 1
                        if start != -1 and end > start:
                            selected_agents = json.loads(plan_text[start:end])
                            valid_keys = {"iqvia", "exim", "patent", "clinical", "web", "internal"}
                            selected_agents = [k for k in selected_agents if k in valid_keys]
                            if not selected_agents:
                                selected_agents = ["web", "iqvia"]
                        else:
                            selected_agents = ["web", "iqvia", "clinical"]
                    except Exception:
                        selected_agents = ["web", "iqvia", "clinical"]
                else:
                    print("⚠️ Planning: LLM unavailable, using default agents.")
                    selected_agents = ["web", "iqvia", "clinical"]
            except Exception as e:
                print(f"⚠️ Planning Error: {e}, using default agents.")
                selected_agents = ["web", "iqvia"]

            # Always ensure web is included
            if "web" not in selected_agents:
                selected_agents.append("web")

        print(f"📋 [Planning] Final Agent Plan: {selected_agents}")
        await self._update_status(
            state["session_id"], "running",
            agent_name="master",
            input_data=f"Planning for: {query[:80]}",
            output_data=f"Selected agents: {selected_agents}"
        )

        current_findings["_plan"] = selected_agents
        return {"findings": current_findings}


    async def web_node(self, state: AgentState):
        plan = state.get("findings", {}).get("_plan", [])
        if plan and "web" not in plan:
             print(f"⏭️ [LangGraph] Skipping Web Agent (Not in Plan)")
             return {"findings": {}}

        print(f"🌐 [LangGraph] Web Agent Running...")
        try:
            result = await self.web_agent.search(state["query"])
            
            # Step Validation
            print(f"🔍 [LangGraph] Validating Web Agent Output...")
            validation = await self.master_agent.validate_agent_output("web", result)
            print(f"   Validation: {validation.get('comment', 'OK')}")
            
            print(f"✅ [LangGraph] Web Agent Completed")
            await self._update_status(state["session_id"], "running", agent_statuses={"web": "completed"}, agent_name="web", input_data=state["query"], output_data=str(result))
            return {"findings": {"web": result}}
        except Exception as e:
            print(f"❌ [LangGraph] Web Agent Failed: {e}")
            await self._update_status(state["session_id"], "running", agent_statuses={"web": "failed"}, agent_name="web", input_data=state["query"], output_data=f"Error: {str(e)}")
            return {"findings": {"web": {"error": str(e)}}}

    async def iqvia_node(self, state: AgentState):
        plan = state.get("findings", {}).get("_plan", [])
        if plan and "iqvia" not in plan:
             print(f"⏭️ [LangGraph] Skipping IQVIA Agent (Not in Plan)")
             return {"findings": {}} 

        print(f"💊 [LangGraph] IQVIA Agent Running...")
        try:
            result = await self.iqvia_agent.analyze(state["query"])
            
            # Step Validation
            print(f"🔍 [LangGraph] Validating IQVIA Agent Output...")
            validation = await self.master_agent.validate_agent_output("iqvia", result)
            
            print(f"✅ [LangGraph] IQVIA Agent Completed")
            await self._update_status(state["session_id"], "running", agent_statuses={"iqvia": "completed"}, agent_name="iqvia", input_data=state["query"], output_data=str(result))
            return {"findings": {"iqvia": result}}
        except Exception as e:
            print(f"❌ [LangGraph] IQVIA Agent Failed: {e}")
            await self._update_status(state["session_id"], "running", agent_statuses={"iqvia": "failed"}, agent_name="iqvia", input_data=state["query"], output_data=f"Error: {str(e)}")
            return {"findings": {"iqvia": {"error": str(e)}}}

    async def exim_node(self, state: AgentState):
        plan = state.get("findings", {}).get("_plan", [])
        if plan and "exim" not in plan:
             print(f"⏭️ [LangGraph] Skipping EXIM Agent (Not in Plan)")
             return {"findings": {}}

        print(f"🌍 [LangGraph] EXIM Agent Running...")
        try:
            result = await self.exim_agent.analyze(state["query"])
            
            # Step Validation
            print(f"🔍 [LangGraph] Validating EXIM Agent Output...")
            validation = await self.master_agent.validate_agent_output("exim", result)

            print(f"✅ [LangGraph] EXIM Agent Completed")
            await self._update_status(state["session_id"], "running", agent_statuses={"exim": "completed"}, agent_name="exim", input_data=state["query"], output_data=str(result))
            return {"findings": {"exim": result}}
        except Exception as e:
            print(f"❌ [LangGraph] EXIM Agent Failed: {e}")
            await self._update_status(state["session_id"], "running", agent_statuses={"exim": "failed"}, agent_name="exim", input_data=state["query"], output_data=f"Error: {str(e)}")
            return {"findings": {"exim": {"error": str(e)}}}

    async def patent_node(self, state: AgentState):
        plan = state.get("findings", {}).get("_plan", [])
        if plan and "patent" not in plan:
             print(f"⏭️ [LangGraph] Skipping Patent Agent (Not in Plan)")
             return {"findings": {}}

        print(f"📜 [LangGraph] Patent Agent Running...")
        try:
            result = await self.patent_agent.search_patents(state["query"])
            
            # Step Validation
            print(f"🔍 [LangGraph] Validating Patent Agent Output...")
            validation = await self.master_agent.validate_agent_output("patent", result)

            print(f"✅ [LangGraph] Patent Agent Completed")
            await self._update_status(state["session_id"], "running", agent_statuses={"patent": "completed"}, agent_name="patent", input_data=state["query"], output_data=str(result))
            return {"findings": {"patent": result}}
        except Exception as e:
            print(f"❌ [LangGraph] Patent Agent Failed: {e}")
            await self._update_status(state["session_id"], "running", agent_statuses={"patent": "failed"}, agent_name="patent", input_data=state["query"], output_data=f"Error: {str(e)}")
            return {"findings": {"patent": {"error": str(e)}}}

    async def clinical_node(self, state: AgentState):
        plan = state.get("findings", {}).get("_plan", [])
        if plan and "clinical" not in plan:
             print(f"⏭️ [LangGraph] Skipping Clinical Agent (Not in Plan)")
             return {"findings": {}}

        print(f"🏥 [LangGraph] Clinical Agent Running...")
        try:
            result = await self.clinical_agent.search_trials(state["query"])
            
            # Step Validation
            print(f"🔍 [LangGraph] Validating Clinical Agent Output...")
            validation = await self.master_agent.validate_agent_output("clinical", result)

            print(f"✅ [LangGraph] Clinical Agent Completed")
            await self._update_status(state["session_id"], "running", agent_statuses={"clinical": "completed"}, agent_name="clinical", input_data=state["query"], output_data=str(result))
            return {"findings": {"clinical": result}}
        except Exception as e:
            print(f"❌ [LangGraph] Clinical Agent Failed: {e}")
            await self._update_status(state["session_id"], "running", agent_statuses={"clinical": "failed"}, agent_name="clinical", input_data=state["query"], output_data=f"Error: {str(e)}")
            return {"findings": {"clinical": {"error": str(e)}}}


    async def synthesis_node(self, state: AgentState):
        """Master agent validates and consolidates all findings."""
        print(f"🧠 [LangGraph] Master Agent Validating Findings...")
        
        # Validate findings first
        validation = await self.master_agent.validate_findings(state.get("findings", {}))
        print(f"📋 [LangGraph] Validation Result: {validation.get('summary', 'Validated')}")
        
        if not validation.get("valid", True):
            print(f"⚠️ [LangGraph] Validation Issues Found: {validation.get('issues', [])}")
        
        print(f"🧠 [LangGraph] Master Agent Synthesizing...")
        consolidation_result = await self.master_agent.consolidate_findings(state.get("findings", {}))
        
        summary = consolidation_result.get("summary", "")
        visualization_data = consolidation_result.get("visualization_data", {})
        
        print(f"✅ [LangGraph] Synthesis Complete")
        
        await self._update_status(
            state["session_id"], 
            "running", 
            agent_statuses={"master": "completed"}, 
            agent_name="master", 
            input_data=f"Validation: {validation.get('summary', 'OK')} | Findings Consolidation", 
            output_data=summary
        )
        
        return {
            "findings": {
                "summary": summary, 
                "validation": validation,
                "visualization_data": visualization_data
            }
        }

    async def reporting_node(self, state: AgentState):
        """Generates PDF report."""
        print(f"📄 [LangGraph] Generating Report...")
        
        # Copy findings so we don't mutate upstream state inadvertently
        findings = dict(state.get("findings", {}))
        summary = findings.get("summary", "No summary available.")

        # Provide a plain-text report body for the UI to render immediately
        # (frontend expects `findings.final_report`)
        findings["final_report"] = summary
        
        report_result = await self.report_agent.generate_report(state["session_id"], summary, findings)
        
        # Log to reports collection if success
        if report_result.get("status") == "generated":
             await self.research_service.log_report(
                 session_id=state["session_id"],
                 molecule=state.get("query", "Unknown"),
                 report_path=report_result.get("report_path")
             )

        await self._update_status(state["session_id"], "completed", 
                                  agent_statuses={"report": "completed", "master": "completed", "synthesis": "completed"},
                                  agent_name="report", 
                                  input_data="Generate PDF", 
                                  output_data=str(report_result),
                                  findings=findings) # Save final findings too
        return {"findings": {"report": report_result, "final_report": summary}}

    # --- Helpers ---
    async def _update_status(self, session_id: str, status: str, findings: dict = None, agent_statuses: dict = None, agent_name: str = None, input_data: str = None, output_data: str = None):
        log_entry = None
        if agent_name:
            log_entry = {
                "agent": agent_name,
                "called_at": datetime.utcnow(),
                "status": "success" if status != "failed" else "failed",
                "input": input_data,
                "output": str(output_data)[:200] if output_data else None # Truncate output log
            }
            
        if self.research_service:
            await self.research_service.update_session_status(session_id, status, findings, agent_statuses, log_entry=log_entry)

    async def execute_research_workflow(self, session_id: str, query: str, user_id: str = "", manual_agents: List[str] = None):
        try:
            initial_state = AgentState(
                session_id=session_id,
                user_id=user_id,
                query=query,
                messages=[],
                findings={},
                agent_statuses={},
                manual_agents=manual_agents
            )
            
            # Run the graph
            # check point logic if needed, else invoke
            final_state = await self.workflow.ainvoke(initial_state)
            return final_state
        except Exception as e:
            print(f"CRITICAL WORKFLOW ERROR: {e}")
            await self._update_status(session_id, "failed", findings={"error": str(e)})
            return None
