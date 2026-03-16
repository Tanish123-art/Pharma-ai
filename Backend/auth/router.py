from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from auth.dependencies import get_current_user
from auth.security import create_access_token
from auth.models import UserCreate, UserInDB, Token
from auth.user_service import UserService

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate, user_service: UserService = Depends()):
    try:
        """Register new pharmaceutical user"""
        # Check if user exists
        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create user with hashed password
        try:
            new_user = await user_service.create_user(user_data)
        except Exception as e:
            print(f"ERROR: Failed to create user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
        
        # Create access token (24 hours) - Enable auto-login
        try:
            # Ensure role is serializable
            role_val = new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role)
            
            access_token = create_access_token(
                data={"sub": new_user.email, "role": role_val},
                expires_delta=timedelta(hours=24)
            )
        except Exception as e:
            print(f"ERROR: Failed to create token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate authentication token"
            )
        
        return Token(
            access_token=access_token,
            user=new_user
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in signup endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: UserService = Depends()
):
    """Authenticate user and return JWT token"""
    user = await user_service.authenticate_user(
        email=form_data.username,
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token (24 hours)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(hours=24)
    )
    
    # Update last login
    await user_service.update_last_login(user.email)
    
    return Token(
        access_token=access_token,
        user=user
    )

@router.get("/me", response_model=UserInDB)
async def get_current_user_info(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user information"""
    return current_user
