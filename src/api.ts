import { Issue, Cluster, DashboardStats, Verification, WardData } from "./types";

export async function getIssues(): Promise<Issue[]> {
  const response = await fetch("/api/issues");
  if (!response.ok) throw new Error("Failed to fetch complaints");
  return response.json();
}

export async function getIssueById(id: string): Promise<Issue> {
  const response = await fetch(`/api/issues/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch complaint with ID ${id}`);
  return response.json();
}

export async function updateIssueStatus(id: string, status: Issue["status"]): Promise<Issue> {
  const response = await fetch(`/api/issues/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update complaint status");
  return response.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to fetch dashboard statistics");
  return response.json();
}

export async function getPriorities(): Promise<Cluster[]> {
  const response = await fetch("/api/priorities");
  if (!response.ok) throw new Error("Failed to fetch priority clusters");
  return response.json();
}

export async function analyzeComplaint(payload: {
  complaint_text: string;
  language: string;
  ward?: string;
  location?: string;
  people_affected?: number;
  suggested_development_work?: string;
}): Promise<any> {
  const response = await fetch("/api/analyze-complaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("AI analysis of complaint failed");
  return response.json();
}

export async function createIssue(payload: {
  citizen_name?: string;
  phone?: string;
  language: string;
  complaint_text: string;
  ward: string;
  manual_data?: any;
}): Promise<Issue> {
  const response = await fetch("/api/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to file official complaint");
  return response.json();
}

export async function generateBrief(id: string): Promise<{ brief: string }> {
  const response = await fetch(`/api/generate-brief/${id}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to generate MP official brief");
  return response.json();
}

// Verification Module
export async function submitVerification(
  issue_id: string,
  payload: {
    verifier_name: string;
    verifier_phone?: string;
    verifier_ward: string;
    vote_type: string;
    comment: string;
    has_photo: boolean;
  }
): Promise<Issue> {
  const response = await fetch(`/api/verify/${issue_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to submit verification vote");
  return response.json();
}

export async function getVerifications(issue_id: string): Promise<Verification[]> {
  const response = await fetch(`/api/issues/${issue_id}/verifications`);
  if (!response.ok) throw new Error("Failed to fetch verifications");
  return response.json();
}

// Ward Data and Issues
export async function getIssuesByWard(ward_number: string): Promise<Issue[]> {
  const response = await fetch(`/api/ward/${ward_number}/issues`);
  if (!response.ok) throw new Error("Failed to fetch issues for this ward");
  return response.json();
}

export async function getWardData(): Promise<WardData[]> {
  const response = await fetch("/api/ward-data");
  if (!response.ok) throw new Error("Failed to fetch ward datasets");
  return response.json();
}

export async function getWardDataByNumber(ward_number: string): Promise<WardData> {
  const response = await fetch(`/api/ward-data/${ward_number}`);
  if (!response.ok) throw new Error("Failed to fetch ward data details");
  return response.json();
}

// Development Plans & Hotspots
export async function getDevelopmentPlan(): Promise<Issue[]> {
  const response = await fetch("/api/development-plan");
  if (!response.ok) throw new Error("Failed to fetch development plan recommendations");
  return response.json();
}

export async function getHotspots(): Promise<any[]> {
  const response = await fetch("/api/hotspots");
  if (!response.ok) throw new Error("Failed to fetch hotspots data");
  return response.json();
}

export async function adminLogin(username: string, password: string): Promise<boolean> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Invalid administrative credentials");
  }
  const data = await response.json();
  if (data.success && data.token) {
    localStorage.setItem("admin_token", data.token);
    return true;
  }
  return false;
}

