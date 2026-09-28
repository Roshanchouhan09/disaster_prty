import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import (
    User, DisasterEvent, Report, Incident, IncidentConflict, Resource, RescueMission,
    AuditLog, RoadSegment, Shelter, Hospital, SOSAlert
)
from app.services.auth_service import get_password_hash
from app.ai.classifier import AIClassifier
from app.ai.reliability import ReliabilityEngine
from app.ai.clustering import ReportClusteringEngine
from app.ai.conflict import ConflictDetector
from app.ai.priority import PriorityScorer
from app.ai.resource_optimizer import ResourceOptimizer

# Demo Region Center: North River District (Lat: 26.12, Lng: 85.45)
LAT_BASE = 26.1200
LNG_BASE = 85.4500

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    print("Seeding DISASTERFOG AI Database with realistic production-grade demo data...")

    # 1. Create Users
    hashed_pwd = get_password_hash("password123")
    users = [
        User(username="admin", email="admin@disasterfog.ai", hashed_password=hashed_pwd, full_name="System Administrator", role="admin"),
        User(username="eoc_operator", email="eoc@disasterfog.ai", hashed_password=hashed_pwd, full_name="EOC Lead Controller", role="eoc"),
        User(username="field_officer", email="field1@disasterfog.ai", hashed_password=hashed_pwd, full_name="Captain Rahul Singh (Field)", role="field_officer"),
        User(username="rescue_leader", email="rescue1@disasterfog.ai", hashed_password=hashed_pwd, full_name="Inspector Vikram Vance", role="rescue_team"),
        User(username="analyst_user", email="analyst@disasterfog.ai", hashed_password=hashed_pwd, full_name="Dr. Anita Sharma", role="analyst")
    ]
    db.add_all(users)
    db.commit()

    # 2. Create Active Disaster Event
    event = DisasterEvent(
        name="North River Multi-Hazard Flash Flood & Structural Collapse",
        hazard_type="multi_hazard",
        status="ACTIVE",
        region_name="North River Administrative District",
        center_lat=LAT_BASE,
        center_lng=LNG_BASE,
        created_at=datetime.utcnow() - timedelta(hours=4)
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 3. Create Hospitals & Shelters
    hospitals = [
        Hospital(name="District Central Hospital", total_beds=350, available_icu_beds=18, latitude=LAT_BASE + 0.015, longitude=LNG_BASE - 0.020, contact_number="+91 98765 43210", status="OPERATIONAL"),
        Hospital(name="Apex Emergency & Trauma Center", total_beds=180, available_icu_beds=4, latitude=LAT_BASE - 0.025, longitude=LNG_BASE + 0.010, contact_number="+91 98765 43211", status="OVERWHELMED")
    ]
    shelters = [
        Shelter(name="Government Higher Secondary Relief Camp", capacity=800, current_occupancy=420, latitude=LAT_BASE + 0.030, longitude=LNG_BASE + 0.025, contact_number="+91 98765 43220", status="OPERATIONAL"),
        Shelter(name="Community Indoor Sports Stadium", capacity=1200, current_occupancy=650, latitude=LAT_BASE - 0.010, longitude=LNG_BASE - 0.035, contact_number="+91 98765 43221", status="OPERATIONAL")
    ]
    roads = [
        RoadSegment(name="North District Main Expressway", status="SAFE", start_lat=LAT_BASE - 0.05, start_lng=LNG_BASE - 0.05, end_lat=LAT_BASE + 0.02, end_lng=LNG_BASE - 0.01, condition_notes="Normal movement"),
        RoadSegment(name="Riverbank Overpass Bridge", status="BLOCKED", start_lat=LAT_BASE + 0.01, start_lng=LNG_BASE + 0.01, end_lat=LAT_BASE + 0.015, end_lng=LNG_BASE + 0.02, condition_notes="Structural fissure reported; flood water touching deck level.")
    ]
    db.add_all(hospitals + shelters + roads)
    db.commit()

    # 4. Create Resources
    resources = [
        Resource(code="RES-001", name="NDRF Inflatable Motor Boat #1", resource_type="boat", status="AVAILABLE", location_lat=LAT_BASE - 0.015, location_lng=LNG_BASE - 0.010, capacity=8),
        Resource(code="RES-002", name="NDRF Inflatable Motor Boat #2", resource_type="boat", status="AVAILABLE", location_lat=LAT_BASE - 0.015, location_lng=LNG_BASE - 0.010, capacity=8),
        Resource(code="RES-003", name="Heavy Crawler Excavator EX-200", resource_type="excavator", status="AVAILABLE", location_lat=LAT_BASE + 0.020, location_lng=LNG_BASE - 0.030, capacity=1),
        Resource(code="RES-004", name="Advanced Life Support Ambulance AM-01", resource_type="ambulance", status="AVAILABLE", location_lat=LAT_BASE + 0.015, location_lng=LNG_BASE - 0.020, capacity=2),
        Resource(code="RES-005", name="Advanced Life Support Ambulance AM-02", resource_type="ambulance", status="AVAILABLE", location_lat=LAT_BASE + 0.015, location_lng=LNG_BASE - 0.020, capacity=2),
        Resource(code="RES-006", name="Rapid Tactical Trauma Medical Unit #1", resource_type="medical_team", status="AVAILABLE", location_lat=LAT_BASE - 0.025, location_lng=LNG_BASE + 0.010, capacity=6),
        Resource(code="RES-007", name="Disaster Relief Food & Clean Water Unit", resource_type="food_water_unit", status="AVAILABLE", location_lat=LAT_BASE + 0.030, location_lng=LNG_BASE + 0.025, capacity=500),
        Resource(code="RES-008", name="Emergency Waterproof Shelter Kits (50x)", resource_type="shelter_kit", status="AVAILABLE", location_lat=LAT_BASE + 0.030, location_lng=LNG_BASE + 0.025, capacity=50)
    ]
    db.add_all(resources)
    db.commit()

    # 5. Create Incidents & Multi-Source Reports
    # Incident 1: Critical Flood & Trapped Civilians at Government School
    inc1_lat = LAT_BASE + 0.0120
    inc1_lng = LNG_BASE + 0.0150
    cat1, sev1, conf1 = AIClassifier.classify_text("School submerged in flood water, children and teachers trapped on roof, water level 2.4m rising fast", "flood", 2.4)
    priority1, tier1, mort1, break1 = PriorityScorer.calculate_priority(sev1, 320, 0.8, True, conf1, 45, cat1)
    rec1, exp1 = ResourceOptimizer.recommend_resources(cat1, sev1, 320, 2.4, "BLOCKED", 4)

    inc1 = Incident(
        code="INC-0001",
        event_id=event.id,
        category="trapped_persons",
        severity="CRITICAL",
        priority_score=94.5,
        priority_tier="CRITICAL",
        priority_breakdown=break1,
        latitude=inc1_lat,
        longitude=inc1_lng,
        location_name="St. Jude Model School & Surrounding Colony",
        estimated_affected=320,
        required_resources=rec1,
        verification_status="VERIFIED",
        is_high_mortality_zone=True,
        verification_notes="Field Officer Rahul confirmed 300+ people trapped on roof. Road access blocked by bridge fissure.",
        verified_by_user_id=users[2].id,
        verified_at=datetime.utcnow() - timedelta(minutes=20)
    )
    db.add(inc1)
    db.commit()
    db.refresh(inc1)

    # Reports for Incident 1
    r1 = Report(
        report_code="RPT-00001",
        source_type="citizen",
        reporter_name="Sunil Kumar",
        timestamp=datetime.utcnow() - timedelta(minutes=45),
        latitude=inc1_lat + 0.0005,
        longitude=inc1_lng - 0.0002,
        location_name="Near St. Jude School",
        description="Water level suddenly reached roof height! Over 300 children and residents marooned. Please send rescue boats immediately!",
        reported_damage="flood",
        water_level=2.4,
        estimated_people_affected=300,
        source_reliability=0.65,
        processed_confidence=0.91,
        incident_id=inc1.id
    )
    r2 = Report(
        report_code="RPT-00002",
        source_type="field_officer",
        reporter_name="Capt. Rahul Singh",
        timestamp=datetime.utcnow() - timedelta(minutes=30),
        latitude=inc1_lat,
        longitude=inc1_lng,
        location_name="St. Jude School Sector 4",
        description="Confirmed. Riverbank breach flooded entire school campus. Ground floor completely underwater. 320 civilians trapped on top terrace. Road impassable.",
        reported_damage="flood",
        water_level=2.5,
        estimated_people_affected=320,
        source_reliability=0.92,
        processed_confidence=0.96,
        incident_id=inc1.id
    )
    r3 = Report(
        report_code="RPT-00003",
        source_type="social_media",
        reporter_name="@SOS_NorthRiver",
        timestamp=datetime.utcnow() - timedelta(minutes=25),
        latitude=inc1_lat - 0.0008,
        longitude=inc1_lng + 0.0004,
        location_name="School Rd",
        description="URGENT: St Jude school inundated! SOS SOS send help water level 8 feet!",
        reported_damage="flood",
        water_level=2.4,
        estimated_people_affected=250,
        source_reliability=0.48,
        processed_confidence=0.85,
        incident_id=inc1.id
    )
    db.add_all([r1, r2, r3])
    db.commit()

    # Incident 2: Building Collapse & Rubble Trapped at Market Complex
    inc2_lat = LAT_BASE - 0.0180
    inc2_lng = LNG_BASE - 0.0120
    inc2 = Incident(
        code="INC-0002",
        event_id=event.id,
        category="building_collapse",
        severity="HIGH",
        priority_score=78.2,
        priority_tier="HIGH",
        priority_breakdown=break1,
        latitude=inc2_lat,
        longitude=inc2_lng,
        location_name="Central Commercial Arcade Market",
        estimated_affected=65,
        required_resources={"excavator": 1, "medical_team": 1, "ambulance": 2, "rescue_personnel": 10},
        verification_status="UNVERIFIED",
        is_high_mortality_zone=True,
        verification_notes="Awaiting structural team verification.",
        created_at=datetime.utcnow() - timedelta(minutes=35)
    )
    db.add(inc2)
    db.commit()
    db.refresh(inc2)

    r4 = Report(
        report_code="RPT-00004",
        source_type="emergency_comm",
        reporter_name="Control Room Call #402",
        timestamp=datetime.utcnow() - timedelta(minutes=35),
        latitude=inc2_lat,
        longitude=inc2_lng,
        location_name="Central Market Arcade",
        description="3-story commercial block collapsed following earthquake tremor. 60-70 shoppers trapped under concrete slab rubble.",
        reported_damage="building_collapse",
        water_level=0.0,
        estimated_people_affected=65,
        source_reliability=0.88,
        processed_confidence=0.89,
        incident_id=inc2.id
    )
    db.add(r4)
    db.commit()

    # Incident 3: CONFLICTED Incident - River Bridge Passability Contradiction
    inc3_lat = LAT_BASE + 0.0110
    inc3_lng = LNG_BASE + 0.0180
    inc3 = Incident(
        code="INC-0003",
        event_id=event.id,
        category="bridge_damage",
        severity="HIGH",
        priority_score=68.0,
        priority_tier="HIGH",
        priority_breakdown=break1,
        latitude=inc3_lat,
        longitude=inc3_lng,
        location_name="North District River Overpass",
        estimated_affected=150,
        required_resources={"rescue_personnel": 5, "excavator": 1},
        verification_status="ESCALATED",
        is_high_mortality_zone=False,
        verification_notes="Conflicting report regarding bridge collapse status.",
        created_at=datetime.utcnow() - timedelta(minutes=15)
    )
    db.add(inc3)
    db.commit()
    db.refresh(inc3)

    r5_claim_a = Report(
        report_code="RPT-00005",
        source_type="social_media",
        reporter_name="@RiverValleyNews",
        timestamp=datetime.utcnow() - timedelta(minutes=18),
        latitude=inc3_lat,
        longitude=inc3_lng,
        location_name="River Overpass Bridge",
        description="ALERT: Main river bridge completely collapsed! Road cut off, no vehicles can pass!",
        reported_damage="bridge_damage",
        water_level=0.0,
        estimated_people_affected=150,
        source_reliability=0.45,
        processed_confidence=0.60,
        incident_id=inc3.id
    )
    r6_claim_b = Report(
        report_code="RPT-00006",
        source_type="field_officer",
        reporter_name="Officer Ramesh",
        timestamp=datetime.utcnow() - timedelta(minutes=10),
        latitude=inc3_lat + 0.0001,
        longitude=inc3_lng - 0.0001,
        location_name="River Overpass Checkpoint",
        description="Correction: Bridge is NOT collapsed. Minor railing damage and water on deck, but light rescue vehicles are crossing slowly.",
        reported_damage="bridge_damage",
        water_level=0.2,
        estimated_people_affected=50,
        source_reliability=0.91,
        processed_confidence=0.94,
        incident_id=inc3.id
    )
    db.add_all([r5_claim_a, r6_claim_b])
    db.commit()

    # Create Conflict record for Incident 3
    conflict = IncidentConflict(
        incident_id=inc3.id,
        conflict_type="road_status",
        report_a_id=r5_claim_a.id,
        report_b_id=r6_claim_b.id,
        claim_a="Social Media (@RiverValleyNews): 'Main river bridge completely collapsed! Road cut off!'",
        claim_b="Field Officer Ramesh (Baseline 0.91): 'Bridge is NOT collapsed. Light rescue vehicles are crossing slowly.'",
        status="OPEN",
        resolution_notes="System flagged severe contradiction between unverified social post and high-reliability field report."
    )
    db.add(conflict)
    db.commit()

    # 6. Rescue Mission for Incident 1
    mission1 = RescueMission(
        mission_code="MIS-0001",
        incident_id=inc1.id,
        title="Operation School Rescue - Amphibious & Medical Evacuation",
        priority="CRITICAL",
        status="IN_PROGRESS",
        assigned_team="NDRF Battalion 4 & Trauma Response Alpha",
        route_data={"path": [[inc1_lat - 0.01, inc1_lng - 0.01], [inc1_lat, inc1_lng]], "hazard_warning": "Transit via North Expressway; avoid River Overpass."},
        eta_minutes=12,
        notes="Deploying 2 motor boats and 1 trauma ambulance. Primary target: rooftop evacuation of children.",
        created_at=datetime.utcnow() - timedelta(minutes=15)
    )
    db.add(mission1)
    db.commit()
    db.refresh(mission1)

    # Assign resources to mission 1
    resources[0].status = "DEPLOYED"
    resources[0].assigned_mission_id = mission1.id
    resources[1].status = "DEPLOYED"
    resources[1].assigned_mission_id = mission1.id
    resources[3].status = "DEPLOYED"
    resources[3].assigned_mission_id = mission1.id
    db.commit()

    # 7. Audit Log Seed Entries
    audit1 = AuditLog(
        user_id=users[1].id,
        user_name=users[1].full_name,
        action="VERIFY_INCIDENT",
        target_type="INCIDENT",
        target_id="INC-0001",
        details={"verified_severity": "CRITICAL", "priority": 94.5, "reason": "Confirmed by Field Officer Rahul"},
        timestamp=datetime.utcnow() - timedelta(minutes=20)
    )
    audit2 = AuditLog(
        user_id=users[1].id,
        user_name=users[1].full_name,
        action="CREATE_MISSION",
        target_type="RESCUE_MISSION",
        target_id="MIS-0001",
        details={"resources_assigned": ["RES-001", "RES-002", "RES-004"], "team": "NDRF Battalion 4"},
        timestamp=datetime.utcnow() - timedelta(minutes=15)
    )
    db.add_all([audit1, audit2])
    db.commit()

    # 8. SOS Alerts Seed Entries
    sos1 = SOSAlert(
        sos_code="SOS-2026-00001",
        user_id=users[2].id,
        reporter_name="Capt. Rahul Singh",
        contact_phone="+91 98765 11001",
        emergency_type="flood",
        severity="CRITICAL",
        status="ACTIVE",
        latitude=LAT_BASE + 0.005,
        longitude=LNG_BASE + 0.008,
        location_name="Brahmaputra Lowland Causeway",
        message="Flash flood breached secondary bund. 6 villagers stranded with livestock.",
        emergency_contacts=[{"name": "EOC Dispatch", "phone": "+91 112", "relation": "Authority", "notified": True}],
        dispatched_service="SDRF Flood Rescue Inflatable Boat Unit",
        created_at=datetime.utcnow() - timedelta(minutes=45),
        updated_at=datetime.utcnow() - timedelta(minutes=10)
    )
    sos2 = SOSAlert(
        sos_code="SOS-2026-00002",
        reporter_name="Pooja Sen (Citizen)",
        contact_phone="+91 98112 44332",
        emergency_type="medical",
        severity="HIGH",
        status="DISPATCHED",
        latitude=LAT_BASE - 0.012,
        longitude=LNG_BASE + 0.015,
        location_name="Residential Complex B, Sector 9",
        message="Elderly patient with oxygen dependency requires emergency evacuation before power cuts out.",
        emergency_contacts=[{"name": "Son", "phone": "+91 98112 44333", "relation": "Family", "notified": True}],
        dispatched_service="Emergency Medical Services (EMS) - Ambulance Rapid Unit",
        created_at=datetime.utcnow() - timedelta(minutes=25),
        updated_at=datetime.utcnow() - timedelta(minutes=5)
    )
    db.add_all([sos1, sos2])
    db.commit()

    print("Seeding completed successfully! DISASTERFOG AI is fully prepped with production-grade data.")
