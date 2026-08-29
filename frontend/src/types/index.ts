export type UserRole = 'admin' | 'eoc' | 'field_officer' | 'rescue_team' | 'analyst';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type IncidentCategory = 
  | 'flood' 
  | 'building_collapse' 
  | 'road_blockage' 
  | 'bridge_damage' 
  | 'fire' 
  | 'medical_emergency' 
  | 'trapped_persons' 
  | 'shelter_emergency' 
  | 'infrastructure_failure' 
  | 'unknown';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'ESCALATED';

export interface Report {
  id: number;
  report_code: string;
  client_uuid?: string;
  source_type: 'citizen' | 'field_officer' | 'social_media' | 'satellite' | 'emergency_comm' | 'government' | 'iot_sensor';
  reporter_name: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  location_name: string;
  description: string;
  media_urls?: string[];
  estimated_people_affected: number;
  reported_damage: string;
  water_level: number;
  source_reliability: number;
  processed_confidence: number;
  reliability_breakdown?: {
    final_reliability: number;
    confidence_percentage: number;
    factors: Array<{ factor: string; delta: number; running_total: number }>;
  };
  incident_id?: number;
  is_duplicate: boolean;
  duplicate_of_report_id?: number;
  created_at: string;
}

export interface IncidentConflict {
  id: number;
  incident_id: number;
  conflict_type: string;
  report_a_id: number;
  report_b_id: number;
  claim_a: string;
  claim_b: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_notes?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  code: string;
  event_id?: number;
  category: IncidentCategory;
  severity: IncidentSeverity;
  priority_score: number;
  priority_tier: IncidentSeverity;
  priority_breakdown?: Record<string, any>;
  latitude: number;
  longitude: number;
  location_name: string;
  estimated_affected: number;
  required_resources?: Record<string, number>;
  verification_status: VerificationStatus;
  is_high_mortality_zone: boolean;
  verification_notes?: string;
  verified_by_user_id?: number;
  verified_at?: string;
  reports_count: number;
  conflicts_count: number;
  ai_reasoning?: string;
  reports?: Report[];
  conflicts?: IncidentConflict[];
  created_at: string;
  updated_at: string;
}

export type ResourceType = 'boat' | 'excavator' | 'ambulance' | 'medical_team' | 'rescue_personnel' | 'shelter_kit' | 'food_water_unit';
export type ResourceStatus = 'AVAILABLE' | 'DEPLOYED' | 'MAINTENANCE';

export interface Resource {
  id: number;
  code: string;
  name: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  location_lat: number;
  location_lng: number;
  capacity: number;
  assigned_mission_id?: number;
  updated_at: string;
}

export type MissionStatus = 'PLANNED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';

export interface RescueMission {
  id: number;
  mission_code: string;
  incident_id: number;
  title: string;
  priority: IncidentSeverity;
  status: MissionStatus;
  assigned_team: string;
  route_data?: {
    path?: Array<[number, number]>;
    hazard_warning?: string;
    road_condition?: string;
  };
  eta_minutes: number;
  notes?: string;
  resources?: Resource[];
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  active_events_count: number;
  total_reports_count: number;
  verified_incidents_count: number;
  unverified_incidents_count: number;
  critical_incidents_count: number;
  high_risk_zones_count: number;
  estimated_affected_population: number;
  missing_persons_count: number;
  active_missions_count: number;
  available_resources_count: number;
  deployed_resources_count: number;
  average_response_time_minutes: number;
  overall_confidence_score: number;
  false_report_rate: number;
  ai_human_agreement_rate: number;
  reports_over_time: Array<{ time: string; reports: number; verified: number }>;
  severity_distribution: Record<string, number>;
  resource_utilization: Record<string, { available: number; deployed: number }>;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SimulationStatus {
  is_running: boolean;
  current_time_step: string;
  speed_multiplier: number;
  scenario_name: string;
  reports_generated_count: number;
  incidents_active_count: number;
  messages: string[];
}
