from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db.models import IncidentConflict, Incident, AuditLog, User
from app.schemas.schemas import IncidentConflictResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/conflicts", tags=["Contradiction Resolution"])

class ConflictResolutionRequest(BaseModel):
    winning_report_id: Optional[int] = None
    resolution_notes: str

@router.post("/{id}/resolve", response_model=IncidentConflictResponse)
def resolve_conflict(
    id: int,
    req: ConflictResolutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conflict = db.query(IncidentConflict).filter(IncidentConflict.id == id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict record not found")

    conflict.status = "RESOLVED"
    conflict.resolution_notes = f"Resolved by {current_user.full_name}: {req.resolution_notes}"
    db.commit()
    db.refresh(conflict)

    # Check remaining open conflicts on this incident
    open_conflicts = db.query(IncidentConflict).filter(
        IncidentConflict.incident_id == conflict.incident_id,
        IncidentConflict.status == "OPEN"
    ).count()

    inc = db.query(Incident).filter(Incident.id == conflict.incident_id).first()
    if inc and open_conflicts == 0 and inc.verification_status == "ESCALATED":
        inc.verification_status = "VERIFIED"
        inc.verification_notes = f"All contradictory reports resolved by {current_user.full_name}"
        db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="RESOLVE_CONFLICT",
        target_type="INCIDENT_CONFLICT",
        target_id=str(conflict.id),
        details={"incident_id": conflict.incident_id, "resolution": req.resolution_notes}
    )
    db.add(audit)
    db.commit()

    return conflict
