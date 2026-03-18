from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from auth import database
from agents.models import ResearchSession, ResearchQuery, ResearchStatus
import uuid

class ResearchService:
    def _check_database_connection(self):
        """Check if database is connected and collections are initialized"""
        if database.sessions_collection is None:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        if database.client is None:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
    
    async def create_research_session(self, user_id: str, query: ResearchQuery) -> ResearchSession:
        self._check_database_connection()
        session_id = str(uuid.uuid4())
        
        # Use provided title or fallback to query truncation
        title = query.title if query.title else (query.query[:50] + "..." if len(query.query) > 50 else query.query)
        
        session_data = {
            "id": session_id,
            "user_id": user_id,
            "title": title,
            "query": query.dict(),
            "status": ResearchStatus.PENDING,
            "confidence_score": 0.0,
            "created_at": datetime.utcnow(),
            "completed_at": None,
            "findings": {},
            "agent_workflow": [],
            "compliance_audit_trail": True,
            "final_report_path": None
        }
        
        try:
            await database.sessions_collection.insert_one(session_data)
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        return ResearchSession(**session_data)

    async def get_user_sessions(self, user_id: str, skip: int = 0, limit: int = 20) -> List[ResearchSession]:
        self._check_database_connection()
        try:
            cursor = database.sessions_collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
            sessions = []
            async for doc in cursor:
                # Handle potential ObjectId issues if mixed, but we inserted string ID
                if "_id" in doc: 
                    doc.pop("_id") # Pydantic model doesn't need _id if we have 'id'
                sessions.append(ResearchSession(**doc))
            return sessions
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")

    async def get_session(self, session_id: str) -> ResearchSession:
        self._check_database_connection()
        try:
            doc = await database.sessions_collection.find_one({"id": session_id})
            if not doc:
                raise Exception("Session not found")
            if "_id" in doc:
                doc.pop("_id")
            return ResearchSession(**doc)
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")

    async def clear_user_sessions(self, user_id: str):
        self._check_database_connection()
        try:
            await database.sessions_collection.delete_many({"user_id": user_id})
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
            
    async def delete_session(self, session_id: str):
        self._check_database_connection()
        try:
            result = await database.sessions_collection.delete_one({"id": session_id})
            if result.deleted_count == 0:
                # Optionally check if session existed but user mismatch? 
                # For now just silent or False is fine, but exception is clearer for 404
                # We'll return boolean or let caller handle generic "delete" semantics
                pass 
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        
    async def reset_session(self, session_id: str):
        self._check_database_connection()
        try:
            await database.sessions_collection.update_one(
                {"id": session_id},
                {
                    "$set": {
                        "status": ResearchStatus.PENDING,
                        "completed_at": None,
                        "findings": {},
                        "agent_statuses": {
                            "master": "pending",
                            "patent": "pending",
                            "clinical": "pending",
                            "market": "pending",
                            "synthesis": "pending"
                        }
                    }
                }
            )
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")

    # Helper update methods for agents
    # Helper update methods for agents
    async def update_session_status(self, session_id: str, status: str, findings: dict = None, agent_statuses: dict = None, log_entry: dict = None):
        """
        Updates session status and appends to audit trail.
        log_entry should be a dict matching AgentWorkflowLog model.
        """
        self._check_database_connection()
        update_data = {"$set": {"status": status}}
        push_data = {}
        
        if findings:
            for k, v in findings.items():
                update_data["$set"][f"findings.{k}"] = v
        
        if agent_statuses:
            for k, v in agent_statuses.items():
                update_data["$set"][f"agent_statuses.{k}"] = v

        if log_entry:
            push_data["agent_workflow"] = log_entry
            
        if status in [ResearchStatus.COMPLETED, ResearchStatus.FAILED]:
            update_data["$set"]["completed_at"] = datetime.utcnow()
            
        ops = update_data
        if push_data:
            ops["$push"] = push_data

        try:
            await database.sessions_collection.update_one(
                {"id": session_id},
                ops
            )
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")

    async def log_report(self, session_id: str, molecule: str, report_path: str, shared_with: List[str] = []):
        self._check_database_connection()
        if database.reports_collection is None:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        
        report_data = {
            "session_id": session_id,
            "molecule": molecule,
            "indication": "N/A", # Can be extracted if available
            "generated_at": datetime.utcnow(),
            "download_count": 0,
            "shared_with": shared_with,
            "file_path": report_path
        }
        try:
            await database.reports_collection.insert_one(report_data)
            
            # Update session with report path
            await database.sessions_collection.update_one(
                {"id": session_id},
                {"$set": {"final_report_path": report_path}}
            )
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
    async def update_session(self, session_id: str, update_data: dict) -> ResearchSession:
        self._check_database_connection()
        
        # Build update query
        update_fields = {}
        if "title" in update_data:
            update_fields["title"] = update_data["title"]
        if "status" in update_data:
            update_fields["status"] = update_data["status"]
        if "findings" in update_data:
             # Note: This replaces findings if passed. To merge, we'd need dot notation or logic
             update_fields["findings"] = update_data["findings"]
        if "progress" in update_data:
            update_fields["progress"] = update_data["progress"]
            
        update_fields["updated_at"] = datetime.utcnow()
        
        try:
            result = await database.sessions_collection.update_one(
                {"id": session_id},
                {"$set": update_fields}
            )
            if result.matched_count == 0:
                 raise Exception("Session not found")
                 
            # Return updated session
            return await self.get_session(session_id)
        except AttributeError:
             raise Exception("Database not connected. Please ensure MongoDB connection is established.")

    async def add_chat_to_session(self, session_id: str, history: List[dict]):
        self._check_database_connection()
        try:
            await database.sessions_collection.update_one(
                {"id": session_id},
                {"$push": {"chat_history": {"$each": history}}}
            )
        except AttributeError:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
