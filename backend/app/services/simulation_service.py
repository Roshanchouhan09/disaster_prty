import asyncio
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Report, Incident, DisasterEvent, AuditLog
from app.ai.classifier import AIClassifier
from app.ai.reliability import ReliabilityEngine
from app.ai.priority import PriorityScorer
from app.ai.resource_optimizer import ResourceOptimizer
from app.websocket import manager

class DisasterSimulationState:
    def __init__(self):
        self.is_running = False
        self.current_step = 0
        self.speed_multiplier = 5 # 1x, 5x, 10x
        self.scenario_name = "North River District Multi-Hazard Flash Flood & Earthquake"
        self.reports_generated = 0
        self.incidents_active = 0
        self.messages: List[str] = [
            "Simulation Engine Ready. Click 'START SIMULATION' to demonstrate 24-hour disaster sequence."
        ]

simulation_state = DisasterSimulationState()

SIMULATION_TIMELINE_EVENTS = [
    {
        "step_name": "T+00 min: Initial 6.4 Magnitude Earthquake Tremor",
        "message": "T+00m: Earthquake detected in North River District. Seismic sensors trigger automated infrastructure alert.",
        "report_data": {
            "source_type": "iot_sensor",
            "reporter_name": "Seismic Node #04",
            "latitude": 26.120,
            "longitude": 85.450,
            "location_name": "North District Seismic Station",
            "description": "MAG 6.4 tremor detected. Peak Ground Acceleration 0.35g. Structural inspection recommended.",
            "reported_damage": "infrastructure_failure",
            "water_level": 0.0,
            "estimated_people_affected": 0
        }
    },
    {
        "step_name": "T+10 min: Initial Damage Reports Arrive",
        "message": "T+10m: Unverified citizen & emergency calls flood in from Commercial Arcade.",
        "report_data": {
            "source_type": "citizen",
            "reporter_name": "Local Shopkeeper",
            "latitude": 26.102,
            "longitude": 85.438,
            "location_name": "Central Arcade Market",
            "description": "Commercial building façade collapsed! Several shoppers trapped under rubble slab!",
            "reported_damage": "building_collapse",
            "water_level": 0.0,
            "estimated_people_affected": 45
        }
    },
    {
        "step_name": "T+30 min: River Dam Overflow & Flash Flood Inundation",
        "message": "T+30m: Upstream river embankment breaches! Water level rises 2.4 meters near St. Jude Model School.",
        "report_data": {
            "source_type": "field_officer",
            "reporter_name": "Field Officer Capt. Rahul",
            "latitude": 26.132,
            "longitude": 85.465,
            "location_name": "St. Jude Model School Sector",
            "description": "URGENT: Embankment breached. Ground floor flooded. 300+ children and staff marooned on roof!",
            "reported_damage": "flood",
            "water_level": 2.4,
            "estimated_people_affected": 320
        }
    },
    {
        "step_name": "T+60 min: Social Media Noise & Contradiction Flagged",
        "message": "T+60m: Conflicting reports detected regarding River Bridge collapse.",
        "report_data": {
            "source_type": "social_media",
            "reporter_name": "@LocalPanicNews",
            "latitude": 26.131,
            "longitude": 85.468,
            "location_name": "River Bridge Checkpoint",
            "description": "CRITICAL ALERT: River bridge completely destroyed! Road entirely blocked!",
            "reported_damage": "bridge_damage",
            "water_level": 0.5,
            "estimated_people_affected": 100
        }
    },
    {
        "step_name": "T+90 min: High Mortality Risk Zone Identified & AI Resource Match",
        "message": "T+90m: DisasterFog AI flags High Mortality Risk Zone INC-0001 (Priority 94.5). Recommends 2 Motorized Boats & Trauma Ambulance.",
        "report_data": {
            "source_type": "satellite",
            "reporter_name": "Sentinel-2 Disaster Feed",
            "latitude": 26.133,
            "longitude": 85.466,
            "location_name": "School Inundation Zone",
            "description": "Satellite SAR imagery confirms 2.5m standing water extending 1.2km across St. Jude campus.",
            "reported_damage": "flood",
            "water_level": 2.5,
            "estimated_people_affected": 350
        }
    }
]

async def step_simulation():
    """Executes next step in disaster simulation sequence."""
    if not simulation_state.is_running:
        return

    if simulation_state.current_step >= len(SIMULATION_TIMELINE_EVENTS):
        simulation_state.is_running = False
        simulation_state.messages.append("Simulation sequence completed end-to-end. All high-risk zones processed.")
        await manager.broadcast({"type": "SIMULATION_COMPLETE", "status": get_simulation_status()})
        return

    event_data = SIMULATION_TIMELINE_EVENTS[simulation_state.current_step]
    simulation_state.current_step += 1
    simulation_state.messages.append(event_data["message"])

    # Process simulation report into DB
    db: Session = SessionLocal()
    try:
        r = event_data["report_data"]
        rpt_cnt = db.query(Report).count() + 1
        
        rel_dict = ReliabilityEngine.calculate_reliability(r["source_type"], has_media=True)
        
        new_rpt = Report(
            report_code=f"RPT-SIM{rpt_cnt:04d}",
            source_type=r["source_type"],
            reporter_name=r["reporter_name"],
            timestamp=datetime.utcnow(),
            latitude=r["latitude"],
            longitude=r["longitude"],
            location_name=r["location_name"],
            description=r["description"],
            reported_damage=r["reported_damage"],
            water_level=r["water_level"],
            estimated_people_affected=r["estimated_people_affected"],
            source_reliability=rel_dict["final_reliability"],
            processed_confidence=0.92
        )
        db.add(new_rpt)
        db.commit()

        simulation_state.reports_generated = db.query(Report).count()
        simulation_state.incidents_active = db.query(Incident).count()

        audit = AuditLog(
            user_name="Simulation Engine",
            action="SIMULATION_STEP",
            target_type="TIMELINE_STEP",
            target_id=event_data["step_name"],
            details={"message": event_data["message"]}
        )
        db.add(audit)
        db.commit()

    finally:
        db.close()

    await manager.broadcast({
        "type": "SIMULATION_TICK",
        "step": event_data["step_name"],
        "message": event_data["message"],
        "status": get_simulation_status()
    })

def get_simulation_status() -> Dict[str, Any]:
    step_desc = SIMULATION_TIMELINE_EVENTS[min(simulation_state.current_step, len(SIMULATION_TIMELINE_EVENTS)-1)]["step_name"] if simulation_state.current_step > 0 else "Initial State"
    return {
        "is_running": simulation_state.is_running,
        "current_time_step": step_desc,
        "speed_multiplier": simulation_state.speed_multiplier,
        "scenario_name": simulation_state.scenario_name,
        "reports_generated_count": simulation_state.reports_generated,
        "incidents_active_count": simulation_state.incidents_active,
        "messages": simulation_state.messages[-10:] # last 10 log messages
    }
