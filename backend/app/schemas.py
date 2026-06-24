from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(default="job_seeker", description="Must be one of: job_seeker, hr_manager, company_admin")

class UserCreate(UserBase):
    password: str = Field(min_length=6, description="Password must be at least 6 characters long")

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class JobPostingBase(BaseModel):
    title: str
    description: str
    department: str
    location: str = "Remote"
    salary_range: Optional[str] = None

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingResponse(JobPostingBase):
    id: int
    created_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    resume_filename: Optional[str] = None
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True

class CVUploadResponse(BaseModel):
    id: int
    filename: str
    parsed_skills: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
