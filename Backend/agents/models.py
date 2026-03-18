from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum

class ResearchStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ResearchQuery(BaseModel):
    query: str
    title: Optional[str] = None
    molecule: Optional[str] = None
    indication: Optional[str] = None
    priority: str = "normal"
    agents: Optional[List[str]] = []

class AgentWorkflowLog(BaseModel):
    agent: str
    called_at: datetime
    status: str
    input: Optional[str] = None
    output: Optional[str] = None

class ResearchSession(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    query: ResearchQuery
    status: ResearchStatus
    confidence_score: float = 0.0
    created_at: datetime
    completed_at: Optional[datetime] = None
    findings: Dict = {}
    chat_history: List[Dict[str, Any]] = []
    
    # Audit & Compliance
    agent_statuses: Dict[str, str] = {}
    agent_workflow: List[AgentWorkflowLog] = []
    final_report_path: Optional[str] = None
    compliance_audit_trail: bool = True

