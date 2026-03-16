from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

class Notification(BaseModel):
    id: str
    title: str
    message: str
    type: str # alert, update, completion
    created_at: str
    is_read: bool

class CreateNotification(BaseModel):
    title: str
    message: str
    type: str

# In-memory store for demo
NOTIFICATIONS_STORE = [
    {
        "id": "1",
        "title": "Welcome to PharmaAI",
        "message": "Your research platform is ready. Start a new session to begin.",
        "type": "update",
        "created_at": datetime.now().isoformat(),
        "is_read": False
    }
]

@router.post("/", response_model=Notification)
async def create_notification(note: CreateNotification):
    new_note = {
        "id": str(uuid.uuid4()),
        "title": note.title,
        "message": note.message,
        "type": note.type,
        "created_at": datetime.now().isoformat(),
        "is_read": False
    }
    NOTIFICATIONS_STORE.insert(0, new_note)
    return new_note

@router.get("/", response_model=List[Notification])
async def get_notifications():
    return NOTIFICATIONS_STORE

@router.put("/{notification_id}/read")
async def mark_read(notification_id: str):
    for n in NOTIFICATIONS_STORE:
        if n["id"] == notification_id:
            n["is_read"] = True
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Notification not found")

@router.put("/read-all")
async def mark_all_read():
    for n in NOTIFICATIONS_STORE:
        n["is_read"] = True
    return {"status": "success"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    global NOTIFICATIONS_STORE
    NOTIFICATIONS_STORE = [n for n in NOTIFICATIONS_STORE if n["id"] != notification_id]
    return {"status": "success"}
