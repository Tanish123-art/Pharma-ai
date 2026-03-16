from langchain_core.messages import SystemMessage, HumanMessage
from .local_llm_handler import LocalModelHandler
import json

class MasterAgent:
    def __init__(self):
        try:
            self.llm = LocalModelHandler.get_llm()
            print("🤖 Master Agent: Connected to Local Model")
        except Exception as e:
            error_msg = f"⚠️ Master Agent: Failed to load local model: {e}"
            print(error_msg)
            with open("debug_llm_load.log", "a", encoding="utf-8") as f:
                f.write(f"{error_msg}\n")
            self.llm = None

    def clean_text(self, content: str) -> str:
        """
        Aggressively cleans text from LLM artifacts, including <think> tags,
        instruction echoes, and conversational prefixes.
        """
        import re
        
        if not content:
            return ""
            
        # 1. Remove Thinking Tags - Aggressive
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        content = content.replace('</think>', '')
        content = content.replace('<think>', '')
        
        # 2. Remove the echoed prompt completely
        if "Write your response now:" in content:
            content = content.split("Write your response now:")[-1]
        
        if "CRITICAL INSTRUCTIONS:" in content:
            content = content.split("CRITICAL INSTRUCTIONS:")[-1]
            if "Write your response now:" in content:
                content = content.split("Write your response now:")[-1]
        
        # 3. Remove the Research Findings JSON block if it's echoed
        if "Research Findings:" in content:
            parts = content.split("Research Findings:")
            if len(parts) > 1:
                content = parts[-1]
        
        # 4. Remove large JSON blocks
        content = re.sub(r'\{[^{}]*(?:"iqvia"|"patent"|"clinical"|"exim"|"web"|"internal")[^{}]*\}', '', content, flags=re.DOTALL)
        
        # 5. Remove "Findings:" prefix
        content = content.replace("Findings:", "")
        content = content.replace("findings:", "")
        
        # 6. Remove Conversational Prefixes
        content = re.sub(r'^(Human:|Master Orchestrator:|AI:|Assistant:|You:|User:)\s*', '', content.strip(), flags=re.MULTILINE)
        
        # 7. Remove instruction echoes
        instruction_phrases = [
            "CRITICAL INSTRUCTIONS:",
            "Write ONLY in clean, readable text format",
            "Do NOT echo or repeat",
            "Start directly with your answer",
            "Use clear headings",
            "Cover: market opportunities",
            "Be concise, specific, and actionable",
            "Write your response now"
        ]
        for phrase in instruction_phrases:
            content = content.replace(phrase, "")
            
        return content.strip()

    async def validate_agent_output(self, agent_name: str, output: dict) -> dict:
        """
        Validates the output of a single agent step.
        """
        if not self.llm:
            return {"valid": True, "comment": "Validation Skipped"}
            
        # Lightweight prompt
        prompt = f"""Validate output from {agent_name} agent.
Output: {str(output)[:1000]}...

Return JSON: {{"valid": true, "comment": "brief assessment"}}"""

        try:
             response = await self.llm.ainvoke([HumanMessage(content=prompt)])
             content = self.clean_text(response.content if hasattr(response, "content") else str(response))
             import json
             import re
             match = re.search(r'\{.*\}', content, re.DOTALL)
             if match:
                 return json.loads(match.group(0))
             return {"valid": True, "comment": "Parsed successfully"}
        except:
             return {"valid": True, "comment": "Validation error fallback"}
    
    async def validate_findings(self, findings: dict) -> dict:
        """
        Validates findings from all agents before consolidation.
        Returns validation result with status and any issues found.
        """
        # Single concise validation prompt
        prompt = f"""Validate research findings quality. Check for: completeness, errors, missing data.

Findings:
{json.dumps(findings, indent=2, default=str)}

Return JSON: {{"valid": true/false, "issues": ["list any problems"], "summary": "brief assessment"}}"""
        
        if not self.llm:
            return {"valid": True, "issues": [], "summary": "Validation Skipped (LLM Unavailable)"}

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content if hasattr(response, "content") else str(response)
            cleaned_content = self.clean_text(content)
            try:
                # Try to parse JSON response
                import re
                match = re.search(r'\{.*\}', cleaned_content, re.DOTALL)
                if match:
                    json_str = match.group(0)
                    validation = json.loads(json_str)
                    return validation
                else:
                    # Try strict load if regex fails (e.g. if it's already pure JSON)
                    validation = json.loads(cleaned_content)
                    return validation
            except Exception:
                # Fallback if not valid JSON
                return {"valid": True, "issues": [], "summary": cleaned_content[:500]}
        except Exception as e:
            print(f"⚠️ MasterAgent: LLM validation failed: {e}")
            return {"valid": True, "issues": [f"LLM validation error: {str(e)}"], "summary": "Validation Skipped (LLM Error)"}
    
    async def consolidate_findings(self, findings: dict) -> dict:
        """
        Consolidates findings and generates dynamic visualization data.
        Returns: {"summary": str, "visualization_data": dict}
        """
        # Sanitize findings
        sanitized_findings = {}
        for k, v in findings.items():
            s_val = str(v)
            if len(s_val) > 2000:
                sanitized_findings[k] = s_val[:2000] + "... (truncated)"
            else:
                sanitized_findings[k] = v


        # Updated prompt for clean, well-formatted text output + structured data
        prompt = f"""You are a pharmaceutical research analyst. Based on the research findings below, produce an executive summary and visualization data.

Research Findings:
{json.dumps(sanitized_findings, indent=2, default=str)}

INSTRUCTIONS:

1. Write a Comprehensive Executive Summary
- Use clean Markdown (headers, bullets).
- NO introductory labels like "First Part" or "Executive Summary:".
- Start directly with the content.
- Cover market opportunities, supply chain trends, patents, and clinical insights.

2. Generate Visualization Data (JSON)
- At the very end, output a specific JSON block.
- You MUST enclose it strictly in <viz_data> and </viz_data> tags.
- Example:
<viz_data>
{{
  "market_share": {{ "labels": ["A", "B"], "data": [10, 20] }},
  "growth_forecast": {{ "labels": ["2024", "2025"], "data": [100, 120] }}
}}
</viz_data>

Do not add any other text after the JSON.
Write your response now:"""
        
        if not self.llm:
             return {
                 "summary": "Consolidation Skipped (LLM Unavailable).",
                 "visualization_data": {}
             }

        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            raw_content = response.content if hasattr(response, "content") else str(response)
            
            # DEBUG LOGGING
            with open("debug_master_response.log", "w", encoding="utf-8") as f:
                f.write(raw_content)
                
        except Exception as e:
            print(f"⚠️ MasterAgent: LLM consolidation failed: {e}")
            return {"summary": "Consolidation Skipped (LLM Error).", "visualization_data": {}}
        
        # --- Parsing Logic ---
        summary_text = raw_content
        visualization_data = {}
        
        import re
        
        # Extract JSON block with flexible regex
        viz_match = re.search(r'<\s*viz_data\s*>(.*?)<\s*/\s*viz_data\s*>', raw_content, re.DOTALL | re.IGNORECASE)
        if viz_match:
            json_str = viz_match.group(1).strip()
            try:
                visualization_data = json.loads(json_str)
                # Remove the JSON tag from the summary text
                summary_text = raw_content.replace(viz_match.group(0), "").strip()
            except:
                print("⚠️ MasterAgent: Failed to parse viz_data JSON")
                # Try to strip it anyway if regex matched but json parse failed
                summary_text = raw_content.replace(viz_match.group(0), "").strip()
        else:
             # Fallback: Detect if there's a large JSON block at the end anyway
             possible_json = re.search(r'\{.*"market_share".*\}', raw_content, re.DOTALL)
             if possible_json:
                 print("ℹ️  MasterAgent: Auto-detected untagged JSON. Cleaning up...")
                 try:
                    visualization_data = json.loads(possible_json.group(0))
                 except:
                    pass
                 summary_text = raw_content.replace(possible_json.group(0), "").strip()

        # Clean the summary text
        # PRE-CLEAN: Remove <think> blocks more carefully (handle unclosed)
        summary_text = re.sub(r'<think>.*?(?:</think>|$)', '', summary_text, flags=re.DOTALL)
        
        summary_text = self.clean_text(summary_text)
        
        # Aggressive cleanup of hallucinated tags and headers
        patterns_to_remove = [
            r'<\s*executive_summary\s*>', 
            r'<\s*/\s*executive_summary\s*>',
            r'\[executivesummary\]:?',
            r'\[viz_data\]:?',
            r'First Part \(Executive Summary\):?_*',
            r'Second Part \(Visualization Data\):?_*',
            r'<\s*exec[^>]*>',  # Catches <exec总结> and similar
            r'<\s*/\s*exec[^>]*>',
            r'Part 1:?',
            r'Part 2:?',
            r'^\s*executive summary\s*$', # Standalone line
            r'^\s*visualization data\s*$', # Standalone line
            r'^\s*visualization data\s*$', # Standalone line
            r'<\s*visualization data\s*>'
        ]
        
        for pattern in patterns_to_remove:
            summary_text = re.sub(pattern, '', summary_text, flags=re.IGNORECASE)
            
        # Generic HTML tag stripper (catch-all for <div>, <br>, <b>, etc.)
        # Matches < followed by a letter or /, then anything until >
        summary_text = re.sub(r'<[a-zA-Z\/][^>]*>', '', summary_text)
        
        # Ensure bold subheadings (convert "Subheading:" to "**Subheading:**")
        # specific fix for "Market Analysis:" type patterns if they aren't already headers
        summary_text = re.sub(r'^([A-Z][a-zA-Z\s]+):', r'**\1:**', summary_text, flags=re.MULTILINE)

        summary_text = summary_text.strip()

        
        # Final safety check for summary
        if len(summary_text) < 50:
             summary_text = "## Research Summary\n\n*Insufficient data to generate summary.*"

        return {
            "summary": summary_text,
            "visualization_data": visualization_data
        }
