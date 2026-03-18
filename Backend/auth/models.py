from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    R_D_LEAD = "r_d_lead"
    PORTFOLIO_MANAGER = "portfolio_manager"
    CLINICAL_STRATEGIST = "clinical_strategist"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    department: str = "Research" # Default added to avoid validation errors if missing
    role: UserRole = UserRole.R_D_LEAD # Default role

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInDB
