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
        
        # Parallel Execution: Planning -> All Workers
        # Sequential Execution: Planning -> Web -> IQVIA -> EXIM -> Patent -> Clinical -> Synthesis
        workflow.add_edge("planning", "web")
        workflow.add_edge("web", "iqvia")
        workflow.add_edge("iqvia", "exim")
        workflow.add_edge("exim", "patent")
        workflow.add_edge("patent", "clinical")
        workflow.add_edge("clinical", "synthesis")
        
        # Synthesis -> Reporting -> End
        workflow.add_edge("synthesis", "reporting")
        workflow.add_edge("reporting", END)
        
        return workflow.compile()

    # --- Node Implementations ---
    
    async def planning_node(self, state: AgentState):
        """
        Determines which agents to run based on the query or manual selection.
        """
        print(f"🧠 [LangGraph] Planning Node Running...")
        
        # Check for manual agent selection
        manual_agents = state.get("manual_agents")
        if manual_agents and len(manual_agents) > 0:
             print(f"📋 [LangGraph] Using Manual Agent Selection: {manual_agents}")
             selected_agents = manual_agents
             
             # Fallback: Validation to ensure we don't crash if bad keys passed
             valid_keys = {"iqvia", "exim", "patent", "clinical", "web", "internal"}
             selected_agents = [k for k in selected_agents if k in valid_keys]
             
        else:
            # --- Auto-Planning (LLM) ---
            query = state["query"]
            
            # If Master Agent LLM is available, use it to plan. 
            # Otherwise, fallback to all.
            try:
                if self.master_agent.llm:
                    prompt = f"""You are a Research Planner. Analyze the query and select relevant agents.
Available Agents:
- iqvia: Market analysis, drug details, business intelligence.
- exim: Export/Import, supply chain, trade data.
- patent: Patent search, IP risks.
- clinical: Clinical trials status.
- web: General web search for news/articles.
- internal: Internal documents and vector DB.

Query: {query}

Return ONLY a JSON list of agent keys to run. Example: ["iqvia", "patent"]
If unsure, return all."""
                    
                    print("   ⏳ Generating plan with Local Model (this may take time)...")
                    response = await self.master_agent.llm.ainvoke([HumanMessage(content=prompt)])
                    print("   ✅ Plan Generation Complete")
                    
                    # Handle both object with .content and raw string
                    if hasattr(response, "content"):
                        plan_text = response.content
                    else:
                        plan_text = str(response)

                    # Aggressively clean plan text
                    plan_text = self.master_agent.clean_text(plan_text)
                    
                    # Naive JSON extraction
                    import json
                    try:
                        # Finds first [ and last ]
                        start = plan_text.find("[")
                        end = plan_text.rfind("]") + 1
                        if start != -1 and end != -1:
                            selected_agents = json.loads(plan_text[start:end])
                            # Filter valid keys
                            valid_keys = {"iqvia", "exim", "patent", "clinical", "web", "internal"}
                            selected_agents = [k for k in selected_agents if k in valid_keys]
                            if not selected_agents:
                                 selected_agents = ["iqvia", "web"] # Minimal fallback
                        else:
                            selected_agents = ["iqvia", "exim", "patent", "clinical", "web", "internal"] # Fallback to all
                    except:
                         selected_agents = ["iqvia", "exim", "patent", "clinical", "web", "internal"]
                else:
                     print("⚠️ Planning: LLM unavailable, selecting ALL agents.")
                     selected_agents = ["iqvia", "exim", "patent", "clinical", "web", "internal"]
                     
            except Exception as e:
                print(f"⚠️ Planning Error: {e}, selecting ALL agents.")
                selected_agents = ["iqvia", "exim", "patent", "clinical", "web"]
                
            # For Auto-Select, force 'web' unless filtered out by LLM extreme confidence (unlikely) or logic
            if "web" not in selected_agents:
                selected_agents.append("web")
            
        print(f"📋 [LangGraph] Final Selected Agents: {selected_agents}")
        
        await self._update_status(state["session_id"], "running", agent_name="master", input_data="Planning", output_data=str(selected_agents))
        
        # Merge existing findings with plan
        current_findings = state.get("findings", {})
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

    async def execute_research_workflow(self, session_id: str, query: str, manual_agents: List[str] = None):
        try:
            initial_state = AgentState(
                session_id=session_id,
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
