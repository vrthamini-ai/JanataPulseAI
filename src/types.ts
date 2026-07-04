export interface User {
  id: string;
  name: string;
  phone?: string;
  ward: string;
  area?: string;
  role: "Ward Citizen Verifier" | "Admin" | "MP";
  created_at: string;
}

export interface Issue {
  id: string;
  citizen_name?: string;
  phone?: string;
  language: string; // "English" | "Tamil" | "Hindi"
  complaint_text: string;
  translated_summary: string;
  development_need_title: string;
  category: string;
  sub_category: string;
  location: string;
  ward: string;
  people_affected: number;
  severity_score: number; // 1 to 5
  urgency_score: number; // 1 to 5
  recommended_department: string;
  suggested_development_work: string;
  suggested_action: string;
  evidence_needed: string;
  vulnerable_groups_affected: boolean;
  spam_or_fake_risk: number; // 0.0 to 1.0
  ai_confidence: number; // 0.0 to 1.0
  issue_priority_score: number; // calculated by backend
  issue_priority_level: "Critical" | "High" | "Medium" | "Low";
  reality_percentage: number; // calculated by backend
  reality_status: "Low Confidence" | "Needs More Verification" | "Likely Real" | "Strongly Verified";
  citizen_demand_score: number; // calculated by backend
  infrastructure_gap_score: number; // calculated by backend
  feasibility_score: number; // default 70 or calculated
  final_development_priority_score: number; // calculated by backend
  final_priority_level: "Low" | "Medium" | "High" | "MP Priority";
  status: "Pending" | "In Review" | "Forwarded to Department" | "Resolved";
  cluster_key: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  // Temporary or backward compatibility fields
  priority_score?: number; 
  priority_level?: string;
  duplicate_count?: number;
}

export interface Verification {
  id: string;
  issue_id: string;
  verifier_name: string;
  verifier_phone?: string;
  verifier_ward: string;
  vote_type: "Confirm Real" | "Partially True" | "Not Seen" | "Needs More Info";
  comment: string;
  has_photo: boolean;
  created_at: string;
}

export interface WardData {
  id: string;
  ward_number: string;
  ward_name: string;
  population: number;
  school_enrollment: number;
  distance_to_nearest_school_km: number;
  distance_to_nearest_phc_km: number;
  water_supply_gap: number; // percentage
  road_quality_score: number; // 0 to 100 (lower means worse road)
  drainage_risk_score: number; // 0 to 100 (higher means more risk)
  waste_collection_frequency: number; // days per week
  youth_unemployment_estimate: number; // percentage
  elderly_population: number;
  vulnerable_population_estimate: number;
  existing_projects: string[];
  proposed_projects: string[];
  latitude: number;
  longitude: number;
}

export interface Cluster {
  id: string;
  cluster_key: string;
  ward: string;
  category: string;
  title: string;
  total_reports: number;
  total_confirmations: number;
  average_reality_percentage: number;
  average_priority_score: number;
  final_recommendation_score: number;
  status: "Pending" | "In Review" | "Forwarded to Department" | "Resolved";
}

export interface DashboardStats {
  total: number;
  verifiedDemands: number; // reality_percentage >= 60
  lowConfidence: number; // reality_percentage < 30
  pendingVerification: number; // reality_percentage >= 30 and < 60
  averageRealityPercentage: number;
  averageDevelopmentPriorityScore: number;
  topCategories: { category: string; count: number }[];
  topWards: { ward: string; count: number }[];
  recentActivity: { id: string; title: string; ward: string; time: string; type: string }[];
  critical: number;
  high: number;
  resolved: number;
  mostAffectedWard: string;
  topCategory: string;
  averageSeverity: number;
  wardIssues: { ward: string; count: number }[];
}

