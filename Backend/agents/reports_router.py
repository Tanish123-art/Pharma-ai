from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from auth.dependencies import get_current_user
from auth.models import UserInDB
import os
from pathlib import Path

router = APIRouter(prefix="/reports", tags=["reports"])

# Get reports directory
REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"

@router.get("/")
async def get_reports(current_user: UserInDB = Depends(get_current_user)):
    """Get list of all generated reports"""
    if not REPORTS_DIR.exists():
        return {"reports": []}
    
    reports = []
    for file in REPORTS_DIR.glob("*.pdf"):
        reports.append({
            "filename": file.name,
            "path": str(file),
            "size": file.stat().st_size,
            "created": file.stat().st_mtime
        })
    
    return {"reports": reports}

@router.get("/download/{filename}")
async def download_report(
    filename: str,
):
    """Download a specific PDF report"""
    file_path = REPORTS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not file_path.suffix == ".pdf":
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/session/{session_id}")
async def get_session_report(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get report for a specific session"""
    if not REPORTS_DIR.exists():
        raise HTTPException(status_code=404, detail="No reports found")
    
    # Find report matching session ID
    for file in REPORTS_DIR.glob(f"Report_{session_id}_*.pdf"):
        return {
            "filename": file.name,
            "download_url": f"/reports/download/{file.name}",
            "size": file.stat().st_size
        }
    
    raise HTTPException(status_code=404, detail="Report not found for this session")

@router.get("/{session_id}/download")
async def download_session_report(session_id: str):
    """Direct download of report by session ID"""
    if not REPORTS_DIR.exists():
        raise HTTPException(status_code=404, detail="Reports directory not found")
        
    # Find latest report for session
    matches = list(REPORTS_DIR.glob(f"Report_{session_id}_*.pdf"))
    if not matches:
        raise HTTPException(status_code=404, detail="Report not generated yet")
        
    # Sort by modification time, newest first
    latest_report = sorted(matches, key=lambda p: p.stat().st_mtime, reverse=True)[0]
    
    return FileResponse(
        path=latest_report,
        media_type="application/pdf",
        filename=latest_report.name,
        headers={"Content-Disposition": f"attachment; filename={latest_report.name}"}
    )
