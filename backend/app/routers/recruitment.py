from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
from uuid import uuid4

from ..config import settings
from ..database import get_db
from ..models import JobPosting, CVUpload, User
from ..schemas import JobPostingCreate, JobPostingResponse, CVUploadResponse
from ..routers.users import get_current_active_user, RoleChecker

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])

UPLOAD_DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads')
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/jobs", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    job_data: JobPostingCreate,
    current_user: User = Depends(RoleChecker(["hr_manager", "company_admin"])),
    db: Session = Depends(get_db)
):
    job = JobPosting(
        title=job_data.title,
        description=job_data.description,
        department=job_data.department,
        location=job_data.location,
        salary_range=job_data.salary_range,
        created_by_id=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/jobs", response_model=List[JobPostingResponse])
def list_job_postings(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    return jobs

@router.post("/upload-cv", response_model=CVUploadResponse)
def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["job_seeker", "hr_manager", "company_admin"])),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF files are accepted.")

    filename = f"{uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    cv_upload = CVUpload(user_id=current_user.id, filename=filename)
    db.add(cv_upload)
    db.commit()
    db.refresh(cv_upload)
    return cv_upload

@router.get("/me/cv-uploads", response_model=List[CVUploadResponse])
def list_my_cv_uploads(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    uploads = db.query(CVUpload).filter(CVUpload.user_id == current_user.id).order_by(CVUpload.created_at.desc()).all()
    return uploads
