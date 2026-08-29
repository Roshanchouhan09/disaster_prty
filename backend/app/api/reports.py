from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import Report, Incident, IncidentConflict, DisasterEvent, AuditLog
from app.schemas.schemas import ReportCreate, ReportResponse
from app.ai.classifier import AIClassifier
from app.ai.reliability import ReliabilityEngine
from app.ai.clustering import ReportClusteringEngine
from app.ai.conflict import ConflictDetector
from app.ai.priority import PriorityScorer
from app.ai.resource_optimizer import ResourceOptimizer
from app.websocket import manager

router = APIRouter(prefix="/reports", tags=["Report Ingestion"])

@router.get("", response_model=List[ReportResponse])
def list_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.timestamp.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=ReportResponse)
async def submit_report(
    report_in: ReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Offline Deduplication Check by Client UUID
    if report_in.client_uuid:
        existing = db.query(Report).filter(Report.client_uuid == report_in.client_uuid).first()
        if existing:
            return existing

    # 2. AI Text Classification & Entity Extraction
    cat, sev, base_conf = AIClassifier.classify_text(
        report_in.description,
        report_in.reported_damage,
        report_in.water_level
    )
    entities = AIClassifier.extract_entities(report_in.description)
    
    people_affected = max(report_in.estimated_people_affected, entities["estimated_people"])
    water_lvl = max(report_in.water_level, entities["extracted_water_level"])
    has_media = bool(report_in.media_urls and len(report_in.media_urls) > 0)

    # 3. Dynamic Source Reliability Calculation
    rel_dict = ReliabilityEngine.calculate_reliability(
        source_type=report_in.source_type,
        has_media=has_media,
        has_gps_coords=True
    )
    source_rel = rel_dict["final_reliability"]
    processed_conf = round((source_rel * 0.5) + (base_conf * 0.5), 2)

    # Count reports to construct report_code
    report_count = db.query(Report).count() + 1
    report_code = f"RPT-{report_count:05d}"

    new_report = Report(
        report_code=report_code,
        client_uuid=report_in.client_uuid,
        source_type=report_in.source_type,
        reporter_name=report_in.reporter_name or "Anonymous",
        timestamp=datetime.utcnow(),
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        location_name=report_in.location_name,
        description=report_in.description,
        media_urls=report_in.media_urls or [],
        estimated_people_affected=people_affected,
        reported_damage=report_in.reported_damage or cat,
        water_level=water_lvl,
        source_reliability=source_rel,
        processed_confidence=processed_conf,
        reliability_breakdown=rel_dict
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 4. Spatial-Temporal Clustering & Incident Fusion
    active_incidents = db.query(Incident).filter(Incident.verification_status != "REJECTED").all()
    inc_dicts = [
        {
            "id": inc.id,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "category": inc.category,
            "description_summary": inc.location_name
        } for inc in active_incidents
    ]

    matched_inc_dict = ReportClusteringEngine.find_matching_incident(
        {
            "latitude": new_report.latitude,
            "longitude": new_report.longitude,
            "category": cat,
            "description": new_report.description
        },
        inc_dicts
    )

    if matched_inc_dict:
        target_incident = db.query(Incident).filter(Incident.id == matched_inc_dict["id"]).first()
        new_report.incident_id = target_incident.id
        db.commit()
    else:
        # Create NEW Unified Incident
        active_event = db.query(DisasterEvent).filter(DisasterEvent.status == "ACTIVE").first()
        inc_num = db.query(Incident).count() + 1
        inc_code = f"INC-{inc_num:04d}"

        priority_score, priority_tier, is_high_mort, breakdown = PriorityScorer.calculate_priority(
            severity=sev,
            estimated_people_affected=people_affected,
            vulnerability_index=0.7,
            access_blocked=(entities["road_status"] == "BLOCKED"),
            confidence_score=processed_conf,
            category=cat
        )
        rec_resources, _ = ResourceOptimizer.recommend_resources(cat, sev, people_affected, water_lvl, entities["road_status"])

        target_incident = Incident(
            code=inc_code,
            event_id=active_event.id if active_event else None,
            category=cat,
            severity=sev,
            priority_score=priority_score,
            priority_tier=priority_tier,
            priority_breakdown=breakdown,
            latitude=new_report.latitude,
            longitude=new_report.longitude,
            location_name=new_report.location_name,
            estimated_affected=people_affected,
            required_resources=rec_resources,
            verification_status="UNVERIFIED",
            is_high_mortality_zone=is_high_mort
        )
        db.add(target_incident)
        db.commit()
        db.refresh(target_incident)
        new_report.incident_id = target_incident.id
        db.commit()

    # 5. Update Target Incident Stats & Recalculate Priority
    inc_reports = db.query(Report).filter(Report.incident_id == target_incident.id).all()
    total_affected = max([r.estimated_people_affected for r in inc_reports] + [target_incident.estimated_affected])
    max_water = max([r.water_level for r in inc_reports] + [0.0])
    avg_conf = sum([r.processed_confidence for r in inc_reports]) / len(inc_reports)

    new_p_score, new_p_tier, new_mort, new_breakdown = PriorityScorer.calculate_priority(
        severity=target_incident.severity,
        estimated_people_affected=total_affected,
        confidence_score=avg_conf,
        category=target_incident.category
    )
    new_rec_resources, _ = ResourceOptimizer.recommend_resources(
        target_incident.category,
        target_incident.severity,
        total_affected,
        max_water,
        report_count=len(inc_reports)
    )

    target_incident.estimated_affected = total_affected
    target_incident.priority_score = new_p_score
    target_incident.priority_tier = new_p_tier
    target_incident.priority_breakdown = new_breakdown
    target_incident.required_resources = new_rec_resources
    target_incident.is_high_mortality_zone = new_mort
    db.commit()

    # 6. Contradiction Detection Engine
    report_dicts = [
        {
            "id": r.id,
            "report_code": r.report_code,
            "source_type": r.source_type,
            "description": r.description,
            "water_level": r.water_level
        } for r in inc_reports
    ]
    detected_conflicts = ConflictDetector.detect_conflicts(report_dicts)

    for conflict_data in detected_conflicts:
        # Check if already exists
        c_exist = db.query(IncidentConflict).filter(
            IncidentConflict.incident_id == target_incident.id,
            IncidentConflict.report_a_id == conflict_data["report_a_id"],
            IncidentConflict.report_b_id == conflict_data["report_b_id"]
        ).first()
        if not c_exist:
            new_conflict = IncidentConflict(
                incident_id=target_incident.id,
                conflict_type=conflict_data["conflict_type"],
                report_a_id=conflict_data["report_a_id"],
                report_b_id=conflict_data["report_b_id"],
                claim_a=conflict_data["claim_a"],
                claim_b=conflict_data["claim_b"],
                status="OPEN",
                resolution_notes=conflict_data["description"]
            )
            db.add(new_conflict)
            target_incident.verification_status = "ESCALATED"
    db.commit()

    # 7. Audit Log & WebSocket Live Broadcast
    audit = AuditLog(
        user_name=f"Report Ingestion ({new_report.source_type})",
        action="INGEST_REPORT",
        target_type="REPORT",
        target_id=new_report.report_code,
        details={"incident_id": target_incident.code, "reliability": source_rel, "confidence": processed_conf}
    )
    db.add(audit)
    db.commit()

    # Broadcast real-time update event
    async def broadcast_event():
        await manager.broadcast({
            "type": "NEW_REPORT",
            "report": {
                "id": new_report.id,
                "code": new_report.report_code,
                "source": new_report.source_type,
                "description": new_report.description,
                "confidence": new_report.processed_confidence
            },
            "incident": {
                "id": target_incident.id,
                "code": target_incident.code,
                "severity": target_incident.severity,
                "priority": target_incident.priority_score
            }
        })
    background_tasks.add_task(broadcast_event)

    return new_report
