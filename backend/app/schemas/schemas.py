from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- AUTH & USER ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "field_officer"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- REPORTS ---
class ReportCreate(BaseModel):
    client_uuid: Optional[str] = None
    source_type: str = "citizen" # citizen, field_officer, social_media, satellite, emergency_comm, government, iot_sensor
    reporter_name: Optional[str] = "Anonymous"
    latitude: float
    longitude: float
    location_name: str
    description: str
    media_urls: Optional[List[str]] = []
    estimated_people_affected: int = 0
    reported_damage: str = "unknown"
    water_level: float = 0.0

class ReportResponse(ReportCreate):
    id: int
    report_code: str
    timestamp: datetime
    source_reliability: float
    processed_confidence: float
    reliability_breakdown: Optional[Dict[str, Any]] = None
    incident_id: Optional[int] = None
    is_duplicate: bool = False
    duplicate_of_report_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- INCIDENTS ---
class IncidentVerificationRequest(BaseModel):
    status: str # VERIFIED, REJECTED, ESCALATED
    notes: Optional[str] = None

class IncidentConflictResponse(BaseModel):
    id: int
    incident_id: int
    conflict_type: str
    report_a_id: int
    report_b_id: int
    claim_a: str
    claim_b: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentResponse(BaseModel):
    id: int
    code: str
    event_id: Optional[int] = None
    category: str
    severity: str
    priority_score: float
    priority_tier: str
    priority_breakdown: Optional[Dict[str, Any]] = None
    latitude: float
    longitude: float
    location_name: str
    estimated_affected: int
    required_resources: Optional[Dict[str, Any]] = None
    verification_status: str
    is_high_mortality_zone: bool
    verification_notes: Optional[str] = None
    verified_by_user_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    reports_count: int = 0
    conflicts_count: int = 0
    ai_reasoning: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentDetailResponse(IncidentResponse):
    reports: List[ReportResponse] = []
    conflicts: List[IncidentConflictResponse] = []

# --- RESOURCES ---
class ResourceCreate(BaseModel):
    code: str
    name: str
    resource_type: str # boat, excavator, ambulance, medical_team, rescue_personnel, shelter_kit, food_water_unit
    status: str = "AVAILABLE" # AVAILABLE, DEPLOYED, MAINTENANCE
    location_lat: float
    location_lng: float
    capacity: int = 1

class ResourceResponse(ResourceCreate):
    id: int
    assigned_mission_id: Optional[int] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- RESCUE MISSIONS ---
class RescueMissionCreate(BaseModel):
    incident_id: int
    title: str
    priority: str = "HIGH" # CRITICAL, HIGH, MEDIUM, LOW
    assigned_team: str
    resource_ids: List[int] = []
    notes: Optional[str] = None

class RescueMissionUpdateStatus(BaseModel):
    status: str # PLANNED, ASSIGNED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED
    notes: Optional[str] = None

class RescueMissionResponse(BaseModel):
    id: int
    mission_code: str
    incident_id: int
    title: str
    priority: str
    status: str
    assigned_team: str
    route_data: Optional[Dict[str, Any]] = None
    eta_minutes: int
    notes: Optional[str] = None
    resources: List[ResourceResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- ANALYTICS & AUDIT ---
class AnalyticsSummary(BaseModel):
    active_events_count: int
    total_reports_count: int
    verified_incidents_count: int
    unverified_incidents_count: int
    critical_incidents_count: int
    high_risk_zones_count: int
    estimated_affected_population: int
    missing_persons_count: int
    active_missions_count: int
    available_resources_count: int
    deployed_resources_count: int
    average_response_time_minutes: float
    overall_confidence_score: float
    false_report_rate: float
    ai_human_agreement_rate: float
    reports_over_time: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]
    resource_utilization: Dict[str, Any]

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- SIMULATION ---
class SimulationStatus(BaseModel):
    is_running: bool
    current_time_step: str
    speed_multiplier: int
    scenario_name: str
    reports_generated_count: int
    incidents_active_count: int
    messages: List[str]
