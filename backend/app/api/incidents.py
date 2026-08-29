from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.config import settings
from app.db.database import get_db
from app.db.models import Incident, Report, IncidentConflict, AuditLog, User, DisasterEvent
from app.schemas.schemas import IncidentResponse, IncidentDetailResponse, IncidentVerificationRequest
from app.services.auth_service import get_current_user
from app.ai.priority import PriorityScorer
from app.ai.resource_optimizer import ResourceOptimizer
from app.ai.llm_service import GeminiLLMService
from app.websocket import manager

router = APIRouter(prefix="/incidents", tags=["Incidents & Decision Support"])

class PriorityWeightsRequest(BaseModel):
    weight_severity: float = 0.30
    weight_people_at_risk: float = 0.25
    weight_vulnerability: float = 0.15
    weight_access_difficulty: float = 0.10
    weight_confidence: float = 0.10
    weight_time_criticality: float = 0.10

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    high_mortality_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.verification_status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if high_mortality_only:
        query = query.filter(Incident.is_high_mortality_zone == True)
        
    incidents = query.order_by(Incident.priority_score.desc()).all()
    
    result = []
    for inc in incidents:
        reports_cnt = db.query(Report).filter(Report.incident_id == inc.id).count()
        conflicts_cnt = db.query(IncidentConflict).filter(IncidentConflict.incident_id == inc.id).count()
        
        _, ai_exp = ResourceOptimizer.recommend_resources(
            inc.category, inc.severity, inc.estimated_affected, report_count=reports_cnt
        )
        
        inc_res = IncidentResponse.model_validate(inc)
        inc_res.reports_count = reports_cnt
        inc_res.conflicts_count = conflicts_cnt
        inc_res.ai_reasoning = ai_exp
        result.append(inc_res)
        
    return result

@router.get("/{id}", response_model=IncidentDetailResponse)
def get_incident_detail(id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    reports = db.query(Report).filter(Report.incident_id == inc.id).all()
    conflicts = db.query(IncidentConflict).filter(IncidentConflict.incident_id == inc.id).all()
    
    _, ai_exp = ResourceOptimizer.recommend_resources(
        inc.category, inc.severity, inc.estimated_affected, report_count=len(reports)
    )
    
    detail = IncidentDetailResponse.model_validate(inc)
    detail.reports_count = len(reports)
    detail.conflicts_count = len(conflicts)
    detail.ai_reasoning = ai_exp
    detail.reports = reports
    detail.conflicts = conflicts
    return detail

@router.post("/{id}/verify", response_model=IncidentResponse)
async def verify_incident(
    id: int,
    req: IncidentVerificationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc.verification_status = "VERIFIED"
    inc.verification_notes = req.notes or "Verified by EOC Controller"
    inc.verified_by_user_id = current_user.id
    inc.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="VERIFY_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.code,
        details={"status": "VERIFIED", "notes": req.notes}
    )
    db.add(audit)
    db.commit()

    async def broadcast_verification():
        await manager.broadcast({
            "type": "INCIDENT_VERIFIED",
            "incident": {"id": inc.id, "code": inc.code, "status": "VERIFIED", "user": current_user.full_name}
        })
    background_tasks.add_task(broadcast_verification)

    inc_res = IncidentResponse.model_validate(inc)
    inc_res.reports_count = db.query(Report).filter(Report.incident_id == inc.id).count()
    inc_res.conflicts_count = db.query(IncidentConflict).filter(IncidentConflict.incident_id == inc.id).count()
    return inc_res

@router.post("/{id}/reject", response_model=IncidentResponse)
def reject_incident(
    id: int,
    req: IncidentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc.verification_status = "REJECTED"
    inc.verification_notes = req.notes or "Rejected after field check"
    inc.verified_by_user_id = current_user.id
    inc.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="REJECT_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.code,
        details={"status": "REJECTED", "notes": req.notes}
    )
    db.add(audit)
    db.commit()
    
    inc_res = IncidentResponse.model_validate(inc)
    return inc_res

@router.post("/{id}/escalate", response_model=IncidentResponse)
def escalate_incident(
    id: int,
    req: IncidentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc.verification_status = "ESCALATED"
    inc.verification_notes = req.notes or "Escalated for immediate senior command review"
    inc.verified_by_user_id = current_user.id
    inc.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="ESCALATE_INCIDENT",
        target_type="INCIDENT",
        target_id=inc.code,
        details={"status": "ESCALATED", "notes": req.notes}
    )
    db.add(audit)
    db.commit()
    
    inc_res = IncidentResponse.model_validate(inc)
    return inc_res

@router.post("/recalculate-priority")
def recalculate_priority_weights(
    weights: PriorityWeightsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Dynamically update settings weights
    settings.WEIGHT_SEVERITY = weights.weight_severity
    settings.WEIGHT_PEOPLE_AT_RISK = weights.weight_people_at_risk
    settings.WEIGHT_VULNERABILITY = weights.weight_vulnerability
    settings.WEIGHT_ACCESS_DIFFICULTY = weights.weight_access_difficulty
    settings.WEIGHT_CONFIDENCE = weights.weight_confidence
    settings.WEIGHT_TIME_CRITICALITY = weights.weight_time_criticality

    incidents = db.query(Incident).all()
    recalculated_count = 0
    for inc in incidents:
        p_score, p_tier, mort, breakdown = PriorityScorer.calculate_priority(
            severity=inc.severity,
            estimated_people_affected=inc.estimated_affected,
            category=inc.category
        )
        inc.priority_score = p_score
        inc.priority_tier = p_tier
        inc.priority_breakdown = breakdown
        inc.is_high_mortality_zone = mort
        recalculated_count += 1

    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="RECALCULATE_PRIORITY_WEIGHTS",
        target_type="SETTINGS",
        target_id="PRIORITY_FORMULA",
        details={"weights": weights.model_dump(), "recalculated_incidents": recalculated_count}
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "recalculated_incidents": recalculated_count}

@router.post("/generate-briefing")
def generate_situational_briefing(
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    db: Session = Depends(get_db)
):
    event = db.query(DisasterEvent).filter(DisasterEvent.status == "ACTIVE").first()
    event_name = event.name if event else "North River Multi-Hazard Disaster"
    total_r = db.query(Report).count()
    ver_i = db.query(Incident).filter(Incident.verification_status == "VERIFIED").count()
    crit_z = db.query(Incident).filter(Incident.is_high_mortality_zone == True).count()
    
    from sqlalchemy import func
    affected_pop = db.query(func.sum(Incident.estimated_affected)).scalar() or 850

    briefing_markdown = GeminiLLMService.generate_executive_briefing(
        active_event_name=event_name,
        total_reports=total_r,
        verified_incidents=ver_i,
        critical_zones=crit_z,
        affected_pop=int(affected_pop),
        custom_key=x_gemini_api_key
    )

    return {"briefing": briefing_markdown}
