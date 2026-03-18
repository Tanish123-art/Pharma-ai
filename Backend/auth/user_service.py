from datetime import datetime
from bson import ObjectId
from auth import database
from auth.models import UserCreate, UserInDB
from auth.security import get_password_hash, verify_password
from typing import Optional

class UserService:
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        try:
            print(f"🔍 [DB] Fetching user by email: {email}")
            import time
            db_start = time.time()
            res = await database.users_collection.find_one({"email": email})
            print(f"🏁 [DB] Query finished in {time.time() - db_start:.4f}s")
            return res
        except (AttributeError, Exception) as e:
            # Explicitly catch AttributeError (if users_collection is None) or other DB errors
            if "AttributeError" in str(type(e)) or "NoneType" in str(e):
                 raise Exception("Database not connected. Please ensure MongoDB connection is established.")
            raise Exception(f"Database error: {str(e)}")

    async def create_user(self, user_data: UserCreate) -> UserInDB:
        # No explicit check, rely on try/except block below
        user_dict = user_data.model_dump(mode='json')
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["is_active"] = True
        user_dict["last_login"] = None
        
        try:
            result = await database.users_collection.insert_one(user_dict)
        except AttributeError as e:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")
        
        return UserInDB(
            id=str(result.inserted_id),
            **user_data.model_dump(exclude={"password"}),
            created_at=user_dict["created_at"],
            is_active=True
        )

    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user["hashed_password"]):
            return None
        
        return UserInDB(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user["full_name"],
            department=user.get("department", "Research"),
            role=user.get("role", "r_d_lead"),
            created_at=user.get("created_at", datetime.utcnow()),
            last_login=user.get("last_login"),
            is_active=user.get("is_active", True)
        )

    async def update_last_login(self, email: str):
        try:
            await database.users_collection.update_one(
                {"email": email},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        except AttributeError as e:
            raise Exception("Database not connected. Please ensure MongoDB connection is established.")
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")
