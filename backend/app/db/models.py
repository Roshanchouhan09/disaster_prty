from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="field_officer") # admin, eoc, field_officer, rescue_team, analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    hazard_type = Column(String(50), nullable=False) # flood, earthquake, cyclone, multi_hazard
    status = Column(String(30), default="ACTIVE") # ACTIVE, CONTAINED, CLOSED
    region_name = Column(String(100), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    incidents = relationship("Incident", back_populates="event")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False) # e.g. INC-0001
    event_id = Column(Integer, ForeignKey("disaster_events.id"), nullable=True)
    
    category = Column(String(50), nullable=False) # flood, building_collapse, road_blockage, bridge_damage, fire, medical_emergency, trapped_persons, shelter_emergency, infrastructure_failure, unknown
    severity = Column(String(20), nullable=False, default="UNKNOWN") # CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN
    priority_score = Column(Float, default=0.0) # 0.0 to 100.0
    priority_tier = Column(String(20), default="LOW") # CRITICAL, HIGH, MEDIUM, LOW
    priority_breakdown = Column(JSON, nullable=True) # JSON weights breakdown
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200), nullable=False)
    estimated_affected = Column(Integer, default=0)
    required_resources = Column(JSON, nullable=True) # list or dict of recommended equipment
    
    verification_status = Column(String(30), default="UNVERIFIED") # UNVERIFIED, VERIFIED, REJECTED, ESCALATED
    is_high_mortality_zone = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    event = relationship("DisasterEvent", back_populates="incidents")
    reports = relationship("Report", back_populates="incident")
    conflicts = relationship("IncidentConflict", back_populates="incident")
    missions = relationship("RescueMission", back_populates="incident")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(30), unique=True, index=True, nullable=False) # RPT-00001
    client_uuid = Column(String(64), index=True, nullable=True) # for offline deduplication
    source_type = Column(String(30), nullable=False) # citizen, field_officer, social_media, satellite, emergency_comm, government, iot_sensor
    reporter_name = Column(String(100), default="Anonymous")
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    media_urls = Column(JSON, nullable=True)
    
    estimated_people_affected = Column(Integer, default=0)
    reported_damage = Column(String(100), default="unknown")
    water_level = Column(Float, default=0.0) # meters
    
    source_reliability = Column(Float, default=0.5) # 0 to 1
    processed_confidence = Column(Float, default=0.5) # 0 to 1
    reliability_breakdown = Column(JSON, nullable=True)
    
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_report_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="reports")


class IncidentConflict(Base):
    __tablename__ = "incident_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    conflict_type = Column(String(50), nullable=False) # road_status, water_level, casualty_count, damage_scale
    report_a_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    report_b_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    claim_a = Column(Text, nullable=False)
    claim_b = Column(Text, nullable=False)
    status = Column(String(30), default="OPEN") # OPEN, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="conflicts")
    report_a = relationship("Report", foreign_keys=[report_a_id])
    report_b = relationship("Report", foreign_keys=[report_b_id])


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False) # RES-0001
    name = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False) # boat, excavator, ambulance, medical_team, rescue_personnel, shelter_kit, food_water_unit
    status = Column(String(30), default="AVAILABLE") # AVAILABLE, DEPLOYED, MAINTENANCE
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    capacity = Column(Integer, default=1)
    assigned_mission_id = Column(Integer, ForeignKey("rescue_missions.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RescueMission(Base):
    __tablename__ = "rescue_missions"

    id = Column(Integer, primary_key=True, index=True)
    mission_code = Column(String(30), unique=True, index=True, nullable=False) # MIS-0001
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    title = Column(String(200), nullable=False)
    priority = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(30), default="PLANNED") # PLANNED, ASSIGNED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED
    assigned_team = Column(String(100), nullable=False)
    route_data = Column(JSON, nullable=True) # route path points & risk status
    eta_minutes = Column(Integer, default=30)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("Incident", back_populates="missions")
    resources = relationship("Resource", backref="assigned_mission", foreign_keys=[Resource.assigned_mission_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), default="System")
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    status = Column(String(30), default="SAFE") # SAFE, CAUTION, BLOCKED, UNKNOWN
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    condition_notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, default=500)
    current_occupancy = Column(Integer, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String(30), nullable=True)
    status = Column(String(30), default="OPERATIONAL") # OPERATIONAL, FULL, CLOSED


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    total_beds = Column(Integer, default=100)
    available_icu_beds = Column(Integer, default=10)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String(30), nullable=True)
    status = Column(String(30), default="OPERATIONAL") # OPERATIONAL, OVERWHELMED, INACCESSIBLE


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    sos_code = Column(String(30), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(100), default="Citizen")
    contact_phone = Column(String(30), nullable=False)
    emergency_type = Column(String(50), default="general") # medical, trapped, flood, structural_collapse, fire, general
    severity = Column(String(20), default="CRITICAL") # CRITICAL, HIGH, MEDIUM
    status = Column(String(30), default="PENDING") # PENDING, LOCATION_VERIFIED, DISPATCHED, ACTIVE, RESOLVED, CANCELLED
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200), nullable=False, default="Detected Coordinates")
    message = Column(Text, nullable=True)
    emergency_contacts = Column(JSON, nullable=True)
    dispatched_service = Column(String(100), nullable=True)
    dispatched_mission_id = Column(Integer, ForeignKey("rescue_missions.id"), nullable=True)
    dispatcher_notes = Column(Text, nullable=True)
    device_telemetry = Column(JSON, nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User")
    incident = relationship("Incident")
    mission = relationship("RescueMission")

