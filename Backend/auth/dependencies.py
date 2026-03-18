from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from auth.security import SECRET_KEY, ALGORITHM
from auth import database
from auth.models import UserInDB
from auth.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check database connection before accessing
    if database.users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not connected. Please try again later."
        )
    
    try:
        user = await database.users_collection.find_one({"email": email})
        if user is None:
            raise credentials_exception
    except AttributeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not connected. Please try again later."
        )
    
    return UserInDB(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        department=user.get("department", "Research"),
        role=user.get("role", "r_d_lead"),
        created_at=user.get("created_at"),
        last_login=user.get("last_login"),
        is_active=user.get("is_active", True)
    )

# Re-export key functions if needed by API
# authenticate_user logic is in UserService, create_access_token is in utils.
