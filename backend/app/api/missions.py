from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import RescueMission, Resource, Incident, AuditLog, User
from app.schemas.schemas import RescueMissionCreate, RescueMissionUpdateStatus, RescueMissionResponse
from app.services.auth_service import get_current_user
from app.websocket import manager

router = APIRouter(prefix="/missions", tags=["Rescue Missions"])

@router.get("", response_model=List[RescueMissionResponse])
def list_missions(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RescueMission)
    if status:
        query = query.filter(RescueMission.status == status)
    return query.order_by(RescueMission.created_at.desc()).all()

@router.post("", response_model=RescueMissionResponse)
async def create_mission(
    mission_in: RescueMissionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == mission_in.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    m_count = db.query(RescueMission).count() + 1
    m_code = f"MIS-{m_count:04d}"

    route_sim = {
        "path": [
            [inc.latitude - 0.015, inc.longitude - 0.015],
            [inc.latitude - 0.005, inc.longitude - 0.005],
            [inc.latitude, inc.longitude]
        ],
        "hazard_warning": "Caution: Route passes near Riverbank Overpass; monitor flood levels.",
        "road_condition": "CAUTION"
    }

    new_mission = RescueMission(
        mission_code=m_code,
        incident_id=inc.id,
        title=mission_in.title,
        priority=mission_in.priority,
        status="PLANNED",
        assigned_team=mission_in.assigned_team,
        route_data=route_sim,
        eta_minutes=25,
        notes=mission_in.notes
    )
    db.add(new_mission)
    db.commit()
    db.refresh(new_mission)

    # Assign resources
    if mission_in.resource_ids:
        resources = db.query(Resource).filter(Resource.id.in_(mission_in.resource_ids)).all()
        for r in resources:
            r.status = "DEPLOYED"
            r.assigned_mission_id = new_mission.id
        db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="CREATE_RESCUE_MISSION",
        target_type="RESCUE_MISSION",
        target_id=new_mission.mission_code,
        details={"incident": inc.code, "team": mission_in.assigned_team, "resources_count": len(mission_in.resource_ids)}
    )
    db.add(audit)
    db.commit()

    async def broadcast_mission():
        await manager.broadcast({
            "type": "MISSION_CREATED",
            "mission": {"id": new_mission.id, "code": new_mission.mission_code, "title": new_mission.title, "team": new_mission.assigned_team}
        })
    background_tasks.add_task(broadcast_mission)

    return new_mission

@router.patch("/{id}", response_model=RescueMissionResponse)
async def update_mission_status(
    id: int,
    upd: RescueMissionUpdateStatus,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mission = db.query(RescueMission).filter(RescueMission.id == id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    old_status = mission.status
    mission.status = upd.status
    if upd.notes:
        mission.notes = (mission.notes or "") + f"\n[{datetime.utcnow().strftime('%H:%M')}] Status updated to {upd.status}: {upd.notes}"
    mission.updated_at = datetime.utcnow()

    # If completed, release assigned resources back to AVAILABLE
    if upd.status == "COMPLETED":
        resources = db.query(Resource).filter(Resource.assigned_mission_id == mission.id).all()
        for r in resources:
            r.status = "AVAILABLE"
            r.assigned_mission_id = None

    db.commit()
    db.refresh(mission)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="UPDATE_MISSION_STATUS",
        target_type="RESCUE_MISSION",
        target_id=mission.mission_code,
        details={"from": old_status, "to": upd.status}
    )
    db.add(audit)
    db.commit()

    async def broadcast_update():
        await manager.broadcast({
            "type": "MISSION_STATUS_UPDATED",
            "mission": {"id": mission.id, "code": mission.mission_code, "status": mission.status}
        })
    background_tasks.add_task(broadcast_update)

    return mission
