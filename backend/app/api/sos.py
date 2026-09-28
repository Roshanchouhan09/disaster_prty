from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.config import settings
from app.db.database import get_db
from app.db import models
from app.schemas.schemas import (
    SOSCreateRequest, SOSUpdateRequest, SOSResponse
)
from app.services.emergency_dispatch import EmergencyDispatchService
from app.websocket import manager
from jose import jwt, JWTError

router = APIRouter(prefix="/sos", tags=["SOS Emergency Operations"])

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username:
            return db.query(models.User).filter(models.User.username == username).first()
    except JWTError:
        return None
    return None

@router.post("", response_model=SOSResponse, status_code=status.HTTP_201_CREATED)
async def activate_sos(
    sos_in: SOSCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    """
    Activate SOS Emergency Request.
    Validates coordinates, checks for active duplicates, dispatches emergency services,
    and alerts all command centers in real time.
    """
    # 1. Coordinate Validation
    if not (-90.0 <= sos_in.latitude <= 90.0) or not (-180.0 <= sos_in.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid GPS latitude/longitude coordinates provided."
        )

    # 2. Duplicate SOS Prevention
    duplicate = EmergencyDispatchService.check_duplicate_active_sos(
        db=db,
        contact_phone=sos_in.contact_phone,
        latitude=sos_in.latitude,
        longitude=sos_in.longitude,
        window_minutes=5
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "An active SOS alert was already submitted recently from this phone/location.",
                "existing_sos_code": duplicate.sos_code,
                "status": duplicate.status,
                "dispatched_service": duplicate.dispatched_service,
                "created_at": duplicate.created_at.isoformat() if duplicate.created_at else None
            }
        )

    # 3. Generate unique SOS Code
    count = db.query(models.SOSAlert).count() + 1
    sos_code = f"SOS-{datetime.utcnow().year}-{count:05d}"

    # 4. Format emergency contacts
    contacts_json = []
    if sos_in.emergency_contacts:
        for c in sos_in.emergency_contacts:
            contacts_json.append(c.model_dump())

    # 5. Create Database Record
    reporter_name = sos_in.reporter_name
    if current_user and current_user.full_name:
        reporter_name = current_user.full_name

    new_alert = models.SOSAlert(
        sos_code=sos_code,
        user_id=current_user.id if current_user else None,
        reporter_name=reporter_name or "Citizen in Distress",
        contact_phone=sos_in.contact_phone,
        emergency_type=sos_in.emergency_type,
        severity=sos_in.severity,
        status="PENDING",
        latitude=sos_in.latitude,
        longitude=sos_in.longitude,
        location_name=sos_in.location_name or "Detected GPS Location",
        message=sos_in.message,
        emergency_contacts=contacts_json,
        device_telemetry=sos_in.device_telemetry,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_alert)
    db.flush()

    # 6. Dispatch Emergency Services (SMS / Webhook / Tactical Units)
    dispatch_info = EmergencyDispatchService.dispatch_alert(new_alert, db)

    # 7. Auto-link to or spawn high-priority Incident
    try:
        # Search for nearby active incident within ~1.5 km
        nearby_incident = db.query(models.Incident).filter(
            models.Incident.latitude.between(sos_in.latitude - 0.015, sos_in.latitude + 0.015),
            models.Incident.longitude.between(sos_in.longitude - 0.015, sos_in.longitude + 0.015)
        ).first()

        if nearby_incident:
            new_alert.incident_id = nearby_incident.id
            nearby_incident.priority_score = min(100.0, nearby_incident.priority_score + 10.0)
            nearby_incident.priority_tier = "CRITICAL"
        else:
            inc_count = db.query(models.Incident).count() + 1
            new_incident = models.Incident(
                code=f"INC-{inc_count:04d}",
                category=sos_in.emergency_type if sos_in.emergency_type != "general" else "medical_emergency",
                severity="CRITICAL",
                priority_score=95.0,
                priority_tier="CRITICAL",
                latitude=sos_in.latitude,
                longitude=sos_in.longitude,
                location_name=new_alert.location_name,
                estimated_affected=1,
                verification_status="VERIFIED",
                is_high_mortality_zone=True,
                verification_notes=f"Auto-generated from high-priority SOS alert {sos_code}.",
                created_at=datetime.utcnow()
            )
            db.add(new_incident)
            db.flush()
            new_alert.incident_id = new_incident.id
    except Exception as e:
        # Non-blocking incident linkage
        pass

    # 8. Audit Log Record
    audit = models.AuditLog(
        user_id=current_user.id if current_user else None,
        user_name=current_user.username if current_user else "Citizen",
        action="SOS_ACTIVATED",
        target_type="SOSAlert",
        target_id=sos_code,
        details={
            "phone": sos_in.contact_phone,
            "emergency_type": sos_in.emergency_type,
            "dispatched_service": new_alert.dispatched_service,
            "coordinates": [sos_in.latitude, sos_in.longitude]
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(new_alert)

    # 9. Broadcast over WebSocket
    try:
        await manager.broadcast({
            "type": "NEW_SOS_ALERT",
            "sos_code": new_alert.sos_code,
            "emergency_type": new_alert.emergency_type,
            "severity": new_alert.severity,
            "status": new_alert.status,
            "location_name": new_alert.location_name,
            "latitude": new_alert.latitude,
            "longitude": new_alert.longitude,
            "dispatched_service": new_alert.dispatched_service,
            "timestamp": new_alert.created_at.isoformat()
        })
    except Exception:
        pass

    return new_alert

@router.get("", response_model=List[SOSResponse])
def list_sos_alerts(
    status: Optional[str] = None,
    emergency_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(models.SOSAlert)
    if status:
        query = query.filter(models.SOSAlert.status == status)
    if emergency_type:
        query = query.filter(models.SOSAlert.emergency_type == emergency_type)
    return query.order_by(models.SOSAlert.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/history", response_model=List[SOSResponse])
def get_sos_history(
    phone: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    query = db.query(models.SOSAlert)
    if current_user and current_user.role not in ["admin", "eoc"]:
        query = query.filter(models.SOSAlert.user_id == current_user.id)
    elif phone:
        query = query.filter(models.SOSAlert.contact_phone == phone)
    return query.order_by(models.SOSAlert.created_at.desc()).limit(limit).all()

@router.get("/{sos_id}", response_model=SOSResponse)
def get_sos_detail(sos_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == sos_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="SOS Alert not found")
    return alert

@router.patch("/{sos_id}", response_model=SOSResponse)
async def update_sos_status(
    sos_id: int,
    update_data: SOSUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == sos_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="SOS Alert not found")

    if update_data.status:
        alert.status = update_data.status
        if update_data.status == "RESOLVED":
            alert.resolved_at = datetime.utcnow()
    if update_data.dispatcher_notes:
        existing = alert.dispatcher_notes or ""
        timestamp = datetime.utcnow().strftime("%H:%M")
        alert.dispatcher_notes = f"{existing}\n[{timestamp}] {update_data.dispatcher_notes}".strip()
    if update_data.dispatched_service:
        alert.dispatched_service = update_data.dispatched_service

    alert.updated_at = datetime.utcnow()

    # Log action
    audit = models.AuditLog(
        user_id=current_user.id if current_user else None,
        user_name=current_user.username if current_user else "Operator",
        action="SOS_UPDATED",
        target_type="SOSAlert",
        target_id=alert.sos_code,
        details={"status": alert.status, "notes": update_data.dispatcher_notes},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    try:
        await manager.broadcast({
            "type": "SOS_STATUS_UPDATED",
            "sos_id": alert.id,
            "sos_code": alert.sos_code,
            "status": alert.status,
            "dispatched_service": alert.dispatched_service,
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
        })
    except Exception:
        pass

    return alert

@router.post("/{sos_id}/cancel", response_model=SOSResponse)
async def cancel_sos(
    sos_id: int,
    reason: Optional[str] = Query("Cancelled by user"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == sos_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="SOS Alert not found")

    if alert.status in ["RESOLVED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"SOS is already {alert.status}")

    alert.status = "CANCELLED"
    alert.resolved_at = datetime.utcnow()
    alert.dispatcher_notes = (alert.dispatcher_notes or "") + f"\nCancelled: {reason}"
    alert.updated_at = datetime.utcnow()

    audit = models.AuditLog(
        user_id=current_user.id if current_user else None,
        user_name=current_user.username if current_user else "Citizen",
        action="SOS_CANCELLED",
        target_type="SOSAlert",
        target_id=alert.sos_code,
        details={"reason": reason},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)

    try:
        await manager.broadcast({
            "type": "SOS_STATUS_UPDATED",
            "sos_id": alert.id,
            "sos_code": alert.sos_code,
            "status": "CANCELLED"
        })
    except Exception:
        pass

    return alert
