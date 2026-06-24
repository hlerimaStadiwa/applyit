from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from typing import List

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import UserResponse
from ..security import decode_token

router = APIRouter(prefix="/users", tags=["Users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{current_user.role}' is not authorized. Allowed: {self.allowed_roles}"
            )
        return current_user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Demo routes to verify role-based middleware/dependencies
@router.get("/admin-only", response_model=UserResponse)
def admin_only_endpoint(current_user: User = Depends(RoleChecker(["company_admin"]))):
    return current_user

@router.get("/hr-only", response_model=UserResponse)
def hr_only_endpoint(current_user: User = Depends(RoleChecker(["hr_manager", "company_admin"]))):
    return current_user

@router.get("/seeker-only", response_model=UserResponse)
def seeker_only_endpoint(current_user: User = Depends(RoleChecker(["job_seeker", "company_admin"]))):
    return current_user
