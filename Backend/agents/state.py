from typing import TypedDict, List, Dict, Optional, Any, Annotated
import operator

def merge_dicts(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    return {**a, **b}

class AgentState(TypedDict):
    session_id: str
    query: str
    messages: List[Any]
    findings: Annotated[Dict[str, Any], merge_dicts]
    agent_statuses: Dict[str, str]
    manual_agents: Optional[List[str]]
