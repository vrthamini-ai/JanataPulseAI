import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found. Running in fallback/mock mode.");
}

// Interfaces
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
  issue_priority_score: number;
  issue_priority_level: "Critical" | "High" | "Medium" | "Low";
  reality_percentage: number;
  reality_status: "Low Confidence" | "Needs More Verification" | "Likely Real" | "Strongly Verified";
  citizen_demand_score: number;
  infrastructure_gap_score: number;
  feasibility_score: number; // Default 70
  final_development_priority_score: number;
  final_priority_level: "Low" | "Medium" | "High" | "MP Priority";
  status: "Pending" | "In Review" | "Forwarded to Department" | "Resolved";
  cluster_key: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
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
  water_supply_gap: number; // %
  road_quality_score: number; // 0-100
  drainage_risk_score: number; // 0-100
  waste_collection_frequency: number; // days per week
  youth_unemployment_estimate: number; // %
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

const DB_FILE = path.join(process.cwd(), "data.json");

// Sample Madurai Wards (8 Wards)
const SEED_WARDS: WardData[] = [
  {
    id: "ward-12",
    ward_number: "12",
    ward_name: "Goripalayam",
    population: 48000,
    school_enrollment: 1450,
    distance_to_nearest_school_km: 1.8,
    distance_to_nearest_phc_km: 2.2,
    water_supply_gap: 15,
    road_quality_score: 42, // Poor road quality
    drainage_risk_score: 78, // High drainage flooding risk
    waste_collection_frequency: 4,
    youth_unemployment_estimate: 24,
    elderly_population: 5800,
    vulnerable_population_estimate: 7200,
    existing_projects: ["Main Junction Storm Drain Reconstruction", "Ward High-Mast LED Lights"],
    proposed_projects: ["Underground Water Pipeline Upgrades", "Goripalayam PHC Expansion"],
    latitude: 9.9328,
    longitude: 78.1311
  },
  {
    id: "ward-14",
    ward_number: "14",
    ward_name: "Teppakulam",
    population: 39000,
    school_enrollment: 920,
    distance_to_nearest_school_km: 2.4,
    distance_to_nearest_phc_km: 1.5,
    water_supply_gap: 32, // High water shortage
    road_quality_score: 68,
    drainage_risk_score: 45,
    waste_collection_frequency: 3,
    youth_unemployment_estimate: 19,
    elderly_population: 4300,
    vulnerable_population_estimate: 5100,
    existing_projects: ["Pond Water Desilting", "Temple Outer Ring Road Repaving"],
    proposed_projects: ["Smart Digital Learning Centre", "Sewerage Pump Upgrade"],
    latitude: 9.9175,
    longitude: 78.1512
  },
  {
    id: "ward-18",
    ward_number: "18",
    ward_name: "Simmakkal",
    population: 32000,
    school_enrollment: 710,
    distance_to_nearest_school_km: 0.8,
    distance_to_nearest_phc_km: 3.5, // Far from PHC
    water_supply_gap: 12,
    road_quality_score: 55,
    drainage_risk_score: 60,
    waste_collection_frequency: 5,
    youth_unemployment_estimate: 16,
    elderly_population: 3900,
    vulnerable_population_estimate: 4200,
    existing_projects: ["Simmakkal Market Garbage Compactor Hub"],
    proposed_projects: ["New Primary Health Sub-Centre", "Simmakkal Heritage Pathway Repair"],
    latitude: 9.9245,
    longitude: 78.1225
  },
  {
    id: "ward-22",
    ward_number: "22",
    ward_name: "K.Pudur",
    population: 55000,
    school_enrollment: 2400, // Very high student enrollment
    distance_to_nearest_school_km: 4.2, // Far from school
    distance_to_nearest_phc_km: 1.1,
    water_supply_gap: 40, // Huge water gap
    road_quality_score: 60,
    drainage_risk_score: 50,
    waste_collection_frequency: 4,
    youth_unemployment_estimate: 28, // High youth unemployment
    elderly_population: 6200,
    vulnerable_population_estimate: 8900,
    existing_projects: ["Pudur Industrial Area Sewage Network"],
    proposed_projects: ["New Anganwadi and Play School", "Pudur Vocational Training Institute"],
    latitude: 9.9495,
    longitude: 78.1412
  },
  {
    id: "ward-30",
    ward_number: "30",
    ward_name: "Aarapalayam",
    population: 51000,
    school_enrollment: 1300,
    distance_to_nearest_school_km: 1.2,
    distance_to_nearest_phc_km: 1.4,
    water_supply_gap: 20,
    road_quality_score: 52,
    drainage_risk_score: 72,
    waste_collection_frequency: 2, // Infrequent waste collection
    youth_unemployment_estimate: 21,
    elderly_population: 5500,
    vulnerable_population_estimate: 6800,
    existing_projects: ["Aarapalayam Bus Stand Shelter Repairs"],
    proposed_projects: ["Integrated Drainage and Canal Clearing", "Public Drinking Water Overhead Tank"],
    latitude: 9.9358,
    longitude: 78.1062
  },
  {
    id: "ward-42",
    ward_number: "42",
    ward_name: "Sellur",
    population: 46000,
    school_enrollment: 1100,
    distance_to_nearest_school_km: 2.8,
    distance_to_nearest_phc_km: 2.5,
    water_supply_gap: 28,
    road_quality_score: 35, // Extremely bad roads
    drainage_risk_score: 90, // Massive drainage flooding hazard
    waste_collection_frequency: 3,
    youth_unemployment_estimate: 25,
    elderly_population: 5000,
    vulnerable_population_estimate: 7900,
    existing_projects: ["Sellur Tank Bund Stabilization"],
    proposed_projects: ["Sellur Main Road Redevelopment", "Stormwater Overhaul Phase 2"],
    latitude: 9.9412,
    longitude: 78.1205
  },
  {
    id: "ward-48",
    ward_number: "48",
    ward_name: "Villapuram",
    population: 62000,
    school_enrollment: 1850,
    distance_to_nearest_school_km: 3.1,
    distance_to_nearest_phc_km: 1.9,
    water_supply_gap: 35,
    road_quality_score: 48,
    drainage_risk_score: 82,
    waste_collection_frequency: 3,
    youth_unemployment_estimate: 30, // High youth unemployment
    elderly_population: 7100,
    vulnerable_population_estimate: 9500,
    existing_projects: ["Villapuram Community Hall Refurbishing"],
    proposed_projects: ["Avanipuram-Villapuram Canal Silt Clearing", "Skill Development and Vocational Centre"],
    latitude: 9.8948,
    longitude: 78.1179
  },
  {
    id: "ward-55",
    ward_number: "55",
    ward_name: "Thirunagar",
    population: 41000,
    school_enrollment: 1250,
    distance_to_nearest_school_km: 1.6,
    distance_to_nearest_phc_km: 2.8,
    water_supply_gap: 10,
    road_quality_score: 78,
    drainage_risk_score: 35,
    waste_collection_frequency: 5,
    youth_unemployment_estimate: 15,
    elderly_population: 6100, // Large elderly population
    vulnerable_population_estimate: 4400,
    existing_projects: ["Thirunagar Phase 1 Substation Overhaul"],
    proposed_projects: ["Senior Citizen Walkway & Park", "Thirunagar Secondary PHC Sub-station"],
    latitude: 9.8778,
    longitude: 78.0745
  }
];

// Seed Submissions (At least 15 sample submissions representing various ward issues)
const SEED_ISSUES: Partial<Issue>[] = [
  {
    id: "issue-1",
    citizen_name: "Karthikeyan S.",
    phone: "9845123011",
    language: "Tamil",
    complaint_text: "மழைக்காலத்துல செல்லூர் பகுதியில் சாக்கடை நீர் தெருவில் ஓடுகிறது. இதனால் கொசுத் தொல்லை அதிகமா இருக்கு. குழந்தைகள் நோய்வாய்ப்படுகிறார்கள்.",
    translated_summary: "During the rainy season, sewage overflows onto the streets of Sellur. This causes severe mosquito breeding, leading to several children in the neighborhood falling sick with viral fevers.",
    development_need_title: "Sellur Ward Primary Sewer & Drainage Reconstruction",
    category: "Drainage",
    sub_category: "Sewage Overflow",
    location: "Sellur Ward Main Road Near Government Primary School",
    ward: "Ward 42 (Sellur)",
    people_affected: 350,
    severity_score: 5,
    urgency_score: 5,
    recommended_department: "Madurai Corporation - Public Health and Sanitation Wing",
    suggested_development_work: "Re-lay of high-capacity underground concrete drainage lines to stop seasonal water overflow.",
    suggested_action: "Silt clearing, concrete pipeline expansion, and anti-larval chemical spraying.",
    evidence_needed: "Resident video proof of stagnant black sewage blocking school access.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.05,
    ai_confidence: 0.92,
    status: "Pending",
    latitude: 9.9412,
    longitude: 78.1205,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-2",
    citizen_name: "Meenakshi Sundaram",
    phone: "9123456789",
    language: "English",
    complaint_text: "The main road streetlights in Goripalayam near the junction have been completely broken and dark for 2 weeks. It is very dangerous for women at night and multiple chain snatching attempts happened.",
    translated_summary: "Broken streetlights at Goripalayam junction have left the main transit road in pitch darkness for over two weeks, endangering women's safety and enabling minor crime like chain snatching.",
    development_need_title: "Goripalayam Junction High-Power LED Grid Installation",
    category: "Streetlights",
    sub_category: "Non-functional Streetlights",
    location: "Goripalayam Junction Main Road",
    ward: "Ward 12 (Goripalayam)",
    people_affected: 800,
    severity_score: 4,
    urgency_score: 4,
    recommended_department: "TNEB & Municipal Electrical Division",
    suggested_development_work: "Replacement of fused halogen lamps with high-power LED grids and underground cable layout.",
    suggested_action: "Install 4 automated high-mast LED structures at junction corners.",
    evidence_needed: "Nighttime photographs showing unlit streets near public stops.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.02,
    ai_confidence: 0.95,
    status: "In Review",
    latitude: 9.9328,
    longitude: 78.1311,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-3",
    citizen_name: "Ramesh Kumar",
    phone: "9442109843",
    language: "Hindi",
    complaint_text: "गोरीपालम रोड पर बहुत गहरे गड्ढे हैं। कल एक बाइक सवार यहाँ गिर गया और उसे चोटें आईं। कृपया इस सड़क की मरम्मत जल्द करें।",
    translated_summary: "Very deep, unsafe potholes have formed on Goripalayam Road. Yesterday, a motorcyclist fell and sustained fractures. Immediate road restoration and asphalt patching is requested.",
    development_need_title: "Goripalayam Road Asphalt Restoration and Pothole Repair",
    category: "Road Damage",
    sub_category: "Potholes and Cracked Surfaces",
    location: "Goripalayam Main Road Near Mosque",
    ward: "Ward 12 (Goripalayam)",
    people_affected: 1500,
    severity_score: 4,
    urgency_score: 5,
    recommended_department: "Highways & Public Works Department (PWD)",
    suggested_development_work: "Full-scale cold-mix bituminous repaving on damaged road lengths to ensure safe transit.",
    suggested_action: "Excavate loose soil and patch craters using thick industrial asphalt mix.",
    evidence_needed: "Citizen smartphone photographs with measurable pothole depths.",
    vulnerable_groups_affected: false,
    spam_or_fake_risk: 0.08,
    ai_confidence: 0.88,
    status: "Forwarded to Department",
    latitude: 9.9315,
    longitude: 78.1295,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-4",
    citizen_name: "Anitha Rajan",
    phone: "9789043211",
    language: "Tamil",
    complaint_text: "K.Pudur area-ல drinking water ரொம்ப கலங்கலா வருது. வாடை அடிக்குது. குடிக்கவே முடியல. இதனால் குழந்தைகளுக்கு வயிற்றுப்போக்கு வருகிறது.",
    translated_summary: "Municipal tap water in K. Pudur is coming extremely muddy and foul-smelling. Children in the colony are contracting diarrhea. Urgently need clean water supply line inspection.",
    development_need_title: "K.Pudur Clean Drinking Water Pipeline Layout & Filtering",
    category: "Drinking Water",
    sub_category: "Contaminated Water Supply",
    location: "K.Pudur Housing Board Colony Block 4",
    ward: "Ward 22 (K.Pudur)",
    people_affected: 450,
    severity_score: 5,
    urgency_score: 5,
    recommended_department: "TWAD Board & Corporation Water Supply Wing",
    suggested_development_work: "Laying new corrosion-proof drinking water pipelines separate from drainage pathways.",
    suggested_action: "Locate leak points where sewage leaks into water line, repair, and flush overhead tank.",
    evidence_needed: "Sample bottles showing brown turbid tap water.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.01,
    ai_confidence: 0.97,
    status: "Pending",
    latitude: 9.9495,
    longitude: 78.1412,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-5",
    citizen_name: "Subramanian V.",
    phone: "9865011223",
    language: "English",
    complaint_text: "Solid waste is being dumped on Aarapalayam street corners. Corporation trucks have not visited for 6 days. Stray dogs are scattering garbage and attacking school children walking on the street.",
    translated_summary: "Rotting solid waste has piled up on Aarapalayam street corners for 6 days without clearance. Stray dogs are scattering trash and charging at school children passing by.",
    development_need_title: "Aarapalayam Waste Collection Optimization and Closed Bin Grid",
    category: "Waste Collection",
    sub_category: "No Waste Clearance / Dumpyard Issues",
    location: "Aarapalayam Bus Stand Road Corner",
    ward: "Ward 30 (Aarapalayam)",
    people_affected: 600,
    severity_score: 4,
    urgency_score: 3,
    recommended_department: "Municipal Corporation - Solid Waste Management",
    suggested_development_work: "Establishment of static closed-lid large community bin stations and fixed daily garbage collection routes.",
    suggested_action: "Deploy waste trucks for emergency clearance and set up permanent metal bins.",
    evidence_needed: "Photos showing uncollected open garbage dumps obstructing sidewalks.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.04,
    ai_confidence: 0.91,
    status: "Pending",
    latitude: 9.9358,
    longitude: 78.1062,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-6",
    citizen_name: "Dr. Selvakumar",
    phone: "9940122334",
    language: "English",
    complaint_text: "The primary health centre (PHC) in Simmakkal has no doctor available during morning hours. Pregnant mothers are waiting for 4 hours in heat without fan or drinking water. Staff are rude.",
    translated_summary: "The primary health centre (PHC) at Simmakkal lacks morning doctor coverage. Pregnant women are waiting in high heat without water or functioning fans.",
    development_need_title: "Simmakkal Primary Health Centre Facility and Staff Expansion",
    category: "Healthcare",
    sub_category: "Primary Health Center Deficiencies",
    location: "Simmakkal Municipal Dispensary",
    ward: "Ward 18 (Simmakkal)",
    people_affected: 200,
    severity_score: 4,
    urgency_score: 3,
    recommended_department: "District Medical Officer & Municipal Health Wing",
    suggested_development_work: "Deployment of additional medical staff, medical stock optimization, and basic infrastructure upgradation of wait rooms.",
    suggested_action: "Appoint standard rotation doctor, repair fans, install clean water dispenser.",
    evidence_needed: "Photographs of waiting patient crowds and empty duty cabins.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.03,
    ai_confidence: 0.89,
    status: "Pending",
    latitude: 9.9245,
    longitude: 78.1225,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-7",
    citizen_name: "Meera Krishnan",
    phone: "9876543200",
    language: "Tamil",
    complaint_text: "ஆரப்பாளையம் பகுதியில் பெண்களுக்கு தையல் மற்றும் வேலைவாய்ப்பு பயிற்சி மையம் வேண்டும். பல பெண்கள் வேலை இல்லாமல் வீட்டில் இருக்கிறார்கள்.",
    translated_summary: "Women in Aarapalayam area need vocational training and tailoring centers. Many young girls and married women remain unemployed due to lack of local skills programs.",
    development_need_title: "Aarapalayam Women Skill Development & Vocational Centre",
    category: "Employment / Vocational Centre",
    sub_category: "Unemployment / Livelihood Support",
    location: "Aarapalayam Community Centre Building",
    ward: "Ward 30 (Aarapalayam)",
    people_affected: 400,
    severity_score: 2,
    urgency_score: 2,
    recommended_department: "Department of Employment and Training & MP LADS",
    suggested_development_work: "Sponsoring skill infrastructure under MP Local Area Development funds to operate a free training centre.",
    suggested_action: "Allocate space in local ward halls and supply training equipment/sewing kits.",
    evidence_needed: "Ward list of registered unemployed youth and local requests.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.02,
    ai_confidence: 0.94,
    status: "Pending",
    latitude: 9.9345,
    longitude: 78.1025,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-8",
    citizen_name: "Selvam M.",
    phone: "9345228800",
    language: "Tamil",
    complaint_text: "புதுர் பகுதியில் புதிய மேல்நிலைப்பள்ளி தேவை. குழந்தைகள் 4 கிமீ தூரம் செல்லவேண்டியுள்ளது. பேருந்துகள் கிடைப்பதில்லை.",
    translated_summary: "A new government high school is requested in Pudur. Local school-going children travel over 4 km, which is difficult due to highly unreliable public bus service.",
    development_need_title: "K.Pudur Government Secondary High School Construction",
    category: "School Infrastructure",
    sub_category: "School Accessibility / Travel Gaps",
    location: "K.Pudur Panchayat Grounds",
    ward: "Ward 22 (K.Pudur)",
    people_affected: 950,
    severity_score: 3,
    urgency_score: 2,
    recommended_department: "School Education Department & Public Works",
    suggested_development_work: "New government secondary school construction to accommodate high local student enrollment and eliminate long commutes.",
    suggested_action: "Acquire government land and include inside upcoming state education budget.",
    evidence_needed: "Distance and enrollment records showing commute hardships.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.04,
    ai_confidence: 0.91,
    status: "Pending",
    latitude: 9.9512,
    longitude: 78.1455,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-9",
    citizen_name: "Vaidyanathan",
    phone: "9500122440",
    language: "English",
    complaint_text: "Thirunagar area roads are filled with gravel and stones. It's slippery and elderly residents are falling while walking. Street lighting is also poor.",
    translated_summary: "Thirunagar roads are heavily broken with loose gravel, causing slips and injuries to senior citizens. Poor street illumination multiplies the risk at night.",
    development_need_title: "Thirunagar Safe Senior Walkways & Road Repaving",
    category: "Road Damage",
    sub_category: "Broken Gravel & Pedestrian Risks",
    location: "Thirunagar Phase 1 Lane 3",
    ward: "Ward 55 (Thirunagar)",
    people_affected: 300,
    severity_score: 3,
    urgency_score: 3,
    recommended_department: "Municipal Highways and Streetlights Wing",
    suggested_development_work: "Anti-slip pedestrian paver walkways and paving damaged asphalt grids with high-lumen streetlights.",
    suggested_action: "Deploy repair workers to resurface loose stones and install bright LED posts.",
    evidence_needed: "Resident photos of broken lane stones and unlit spaces.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.05,
    ai_confidence: 0.88,
    status: "In Review",
    latitude: 9.8782,
    longitude: 78.0755,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-10",
    citizen_name: "Ganesan P.",
    phone: "9443311223",
    language: "Tamil",
    complaint_text: "தேப்பக்குளம் பகுதியில் சுற்றுலா பயணிகள் குப்பை வீசுகிறார்கள். குப்பை தொட்டிகள் இல்லை. குப்பை நாற்றமடிக்கிறது.",
    translated_summary: "Tourists litter heavily around Teppakulam temple tank due to zero public dustbin installations, causing rotten odors. Need proper tourist waste management.",
    development_need_title: "Teppakulam Heritage Zone Waste Clean-up & Tourist Bin Grid",
    category: "Waste Collection",
    sub_category: "Littering and Lack of Dustbins",
    location: "Teppakulam Water Tank Outer Ring Pathway",
    ward: "Ward 14 (Teppakulam)",
    people_affected: 2000,
    severity_score: 3,
    urgency_score: 3,
    recommended_department: "Municipal Sanitary & Parks Division",
    suggested_development_work: "Setting up closed heritage-style heavy plastic dustbins at 100-meter intervals and sign boards.",
    suggested_action: "Install tourist waste bins and coordinate daily cleaning shifts.",
    evidence_needed: "Photos showing tourist litter on heritage walking paths.",
    vulnerable_groups_affected: false,
    spam_or_fake_risk: 0.06,
    ai_confidence: 0.92,
    status: "Pending",
    latitude: 9.9175,
    longitude: 78.1512,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-11",
    citizen_name: "Anonymous Citizen",
    phone: "",
    language: "English",
    complaint_text: "Need toilet upgrade in K.Pudur Municipal School. Standard is very unhygienic, students are refusing to use it. Girl students suffer the most.",
    translated_summary: "Toilets in Pudur Municipal School are extremely dirty and lack water connection. Female students are suffering immensely and staying absent.",
    development_need_title: "K.Pudur Municipal School Sanitation & Toilet Upgrade",
    category: "School Infrastructure",
    sub_category: "School Toilet Upgrade",
    location: "K.Pudur Government Higher Secondary School",
    ward: "Ward 22 (K.Pudur)",
    people_affected: 450,
    severity_score: 4,
    urgency_score: 4,
    recommended_department: "Corporation Education Wing & Swachh Bharat Cell",
    suggested_development_work: "Complete overhaul of sanitation pipelines, running water supply, and new toilet blocks.",
    suggested_action: "Urgent toilet plumbing repairs, building separate female cubicles, and hiring a cleaner.",
    evidence_needed: "School representation letter and site sanitation photos.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.02,
    ai_confidence: 0.96,
    status: "Pending",
    latitude: 9.9482,
    longitude: 78.1405,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-12",
    citizen_name: "Vignesh A.",
    phone: "9944331100",
    language: "English",
    complaint_text: "My area is bad. Everything is not working. Roads, lights all bad. Please fix everything fast.",
    translated_summary: "The resident states vaguely that everything in their area is broken, referencing road, light, and general utility deficiencies without locating specific spots.",
    development_need_title: "General Ward Infrastructure Review",
    category: "Road Damage",
    sub_category: "General Maintenance",
    location: "Unspecified Area",
    ward: "Ward 12 (Goripalayam)",
    people_affected: 10,
    severity_score: 1,
    urgency_score: 1,
    recommended_department: "Ward Councillor Ward Office",
    suggested_development_work: "Conduct general ward-level assessment to identify actual broken spots.",
    suggested_action: "Register for inspection but prioritize detailed complaints first.",
    evidence_needed: "Specific locations or clear photographs.",
    vulnerable_groups_affected: false,
    spam_or_fake_risk: 0.85, // High spam / vague risk!
    ai_confidence: 0.60,
    status: "Pending",
    latitude: 9.9328,
    longitude: 78.1311,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-13",
    citizen_name: "Palanivel S.",
    phone: "9442111199",
    language: "Tamil",
    complaint_text: "செல்லூர் பகுதியில் கழிவுநீர் வாய்க்கால் மூடி இல்லாமல் திறந்த நிலையில் கிடக்கிறது. குழந்தைகள் மற்றும் கால்நடைகள் விழுந்து விபத்து நடக்கிறது.",
    translated_summary: "An open, concrete stormwater drain channel in Sellur has no safety cover slabs. Local children and stray animals frequently fall in, risking fatal accidents.",
    development_need_title: "Sellur Open Storm Drain Cover Slab Installation",
    category: "Drainage",
    sub_category: "Open Drain Hazard",
    location: "Sellur Colony Lane 4 Near Park",
    ward: "Ward 42 (Sellur)",
    people_affected: 600,
    severity_score: 4,
    urgency_score: 4,
    recommended_department: "Corporation Public Works Department",
    suggested_development_work: "Manufacturing and installing pre-cast concrete safety cover slabs on all exposed stormwater channels.",
    suggested_action: "Fabricate and lay thick concrete slabs immediately over the exposed drainage paths.",
    evidence_needed: "Resident photos showing children leaping across open black drains.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.03,
    ai_confidence: 0.93,
    status: "Pending",
    latitude: 9.9405,
    longitude: 78.1189,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-14",
    citizen_name: "Dr. Abraham",
    phone: "9150112288",
    language: "English",
    complaint_text: "Urgent medicine stock needed in Goripalayam PHC. Diabetic tablets and paracetamol syrup are out of stock for 1 month.",
    translated_summary: "Goripalayam Primary Health Centre has faced a severe medicine stock-out of essential diabetic pills and pediatric paracetamol syrups for 4 weeks.",
    development_need_title: "Goripalayam PHC Essential Medical Stock Allocation",
    category: "Healthcare",
    sub_category: "Primary Health Center Deficiencies",
    location: "Goripalayam PHC Subcenter",
    ward: "Ward 12 (Goripalayam)",
    people_affected: 750,
    severity_score: 4,
    urgency_score: 4,
    recommended_department: "Directorate of Public Health & Drug Supply Board",
    suggested_development_work: "Systemic replenishment of essential medicine supplies and medical inventory digital tracker implementation.",
    suggested_action: "Expedite delivery of critical medicines from central warehouses.",
    evidence_needed: "PHC stock ledger logs or pharmacist acknowledgment.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.02,
    ai_confidence: 0.94,
    status: "Pending",
    latitude: 9.9328,
    longitude: 78.1311,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "issue-15",
    citizen_name: "Senthil Nathan",
    phone: "9843212345",
    language: "Tamil",
    complaint_text: "வில்லாபுரம் சாக்கடை கால்வாய் நிரம்பி தெருக்களில் கழிவுநீர் குளம் போல் தேங்கியுள்ளது. இதனால் மக்கள் நடக்க முடிவதில்லை. தொற்றுநோய் அபாயம்.",
    translated_summary: "The main concrete sewer outlet in Villapuram has overflowed, stagnant black water has pooled in front of residences, risking severe infectious outbreaks.",
    development_need_title: "Villapuram Ward Sewage Block Clearance & Channel Desilting",
    category: "Drainage",
    sub_category: "Sewage Blockage / Overflow",
    location: "Villapuram Housing Board Area Road 3",
    ward: "Ward 48 (Villapuram)",
    people_affected: 500,
    severity_score: 5,
    urgency_score: 4,
    recommended_department: "Metro Water & Sewerage Board",
    suggested_development_work: "Thorough vacuum desilting and replacement of collapsed underground pipeline pipelines.",
    suggested_action: "Deploy super-sucker desilting machines to clear blocks in sewage outlets.",
    evidence_needed: "Photographs showing children wading through dark sewage water.",
    vulnerable_groups_affected: true,
    spam_or_fake_risk: 0.02,
    ai_confidence: 0.95,
    status: "Forwarded to Department",
    latitude: 9.8948,
    longitude: 78.1179,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Seed 30+ Verifications
const SEED_VERIFICATIONS: Verification[] = [
  // issue-1 (Sellur Drainage - high confirmation)
  { id: "v-1", issue_id: "issue-1", verifier_name: "Ramakrishnan", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "Absolutely true. The sewage water is leaking into school compound as well.", has_photo: true, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-2", issue_id: "issue-1", verifier_name: "Saranya", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "Kids cannot cross the street without step in gutter water. Highly dangerous.", has_photo: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-3", issue_id: "issue-1", verifier_name: "Sundaram", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "We complained many times to ward office, no use. Thanks for adding this here.", has_photo: true, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-4", issue_id: "issue-1", verifier_name: "Gopal P.", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "Mosquitoes are everywhere, fever is spreading in our street.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-5", issue_id: "issue-1", verifier_name: "Murugan S.", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "Fully verified. Open drainage has made life hell here.", has_photo: false, created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },

  // issue-2 (Goripalayam Lights)
  { id: "v-6", issue_id: "issue-2", verifier_name: "Alagar", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "The corner near mosque is completely dark, girls are scared to walk after 7 PM.", has_photo: false, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-7", issue_id: "issue-2", verifier_name: "Mariyam", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "Yes, lights are off for 2 weeks. There are wire joints hanging open.", has_photo: true, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-8", issue_id: "issue-2", verifier_name: "John Paul", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Partially True", comment: "Only 3 lights are broken, rest work but wire lines are damaged.", has_photo: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-3 (Goripalayam Roads)
  { id: "v-9", issue_id: "issue-3", verifier_name: "Rahman", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "Potholes are very deep. Bike skidding is common daily occurrence.", has_photo: true, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-10", issue_id: "issue-3", verifier_name: "Chinnadurai", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "Heavy vehicles damage it more. Urgent patch needed.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-11", issue_id: "issue-3", verifier_name: "Selvi R.", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "I fell down last Tuesday while riding scooter. Road is absolute hazard.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-4 (K Pudur Contaminated Water)
  { id: "v-12", issue_id: "issue-4", verifier_name: "Kannan K.", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "Water has yellow color and sewage smell. Total cholera risk.", has_photo: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-13", issue_id: "issue-4", verifier_name: "Lakshmi M.", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "Even after boiling, smell doesn't go away. We are buying canned water.", has_photo: false, created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
  { id: "v-14", issue_id: "issue-4", verifier_name: "Anand S.", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "We can clearly see sewer mixing spot near main tank.", has_photo: false, created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },

  // issue-5 (Aarapalayam Waste Collection)
  { id: "v-15", issue_id: "issue-5", verifier_name: "Gurunathan", verifier_ward: "Ward 30 (Aarapalayam)", vote_type: "Confirm Real", comment: "The bin is overflowing and dogs are biting pedestrians. Extremely bad smell.", has_photo: true, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-16", issue_id: "issue-5", verifier_name: "Aisha", verifier_ward: "Ward 30 (Aarapalayam)", vote_type: "Confirm Real", comment: "Nobody comes to clean. The municipal workers say truck is broken.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-6 (Simmakkal Medical PHC)
  { id: "v-17", issue_id: "issue-6", verifier_name: "Thangaraj", verifier_ward: "Ward 18 (Simmakkal)", vote_type: "Confirm Real", comment: "Doctor only comes after 11:30 AM. Patients wait from 7 AM.", has_photo: false, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-18", issue_id: "issue-6", verifier_name: "Revathi S.", verifier_ward: "Ward 18 (Simmakkal)", vote_type: "Partially True", comment: "Nurses are present, but no MBBS doctor is on duty. Waiting room is like furnace.", has_photo: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-7 (Aarapalayam Women Skills)
  { id: "v-19", issue_id: "issue-7", verifier_name: "Sumathi", verifier_ward: "Ward 30 (Aarapalayam)", vote_type: "Confirm Real", comment: "All girls here want to study tailoring, but private cost is very high. Free MP center will save us.", has_photo: false, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-20", issue_id: "issue-7", verifier_name: "Kalaivani", verifier_ward: "Ward 30 (Aarapalayam)", vote_type: "Confirm Real", comment: "Our self-help group has 60 women ready to join right now.", has_photo: false, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-8 (K Pudur High School Accessibility)
  { id: "v-21", issue_id: "issue-8", verifier_name: "Arunachalam", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "Our kids are walking 4km or hanging on bus footboards. Building local high school is top priority.", has_photo: false, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-22", issue_id: "issue-8", verifier_name: "Pandiyammal", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "Yes, we need government high school. Private schools charge huge fees.", has_photo: false, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-9 (Thirunagar Road Gravel)
  { id: "v-23", issue_id: "issue-9", verifier_name: "Sankaran S.", verifier_ward: "Ward 55 (Thirunagar)", vote_type: "Confirm Real", comment: "My father fell down last week, had leg bandage. Heavy blue metals are scattered.", has_photo: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-24", issue_id: "issue-9", verifier_name: "Padma S.", verifier_ward: "Ward 55 (Thirunagar)", vote_type: "Partially True", comment: "Some patching work started but stopped mid-way, leaving gravel.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-10 (Teppakulam Litter)
  { id: "v-25", issue_id: "issue-10", verifier_name: "Muthupandi", verifier_ward: "Ward 14 (Teppakulam)", vote_type: "Confirm Real", comment: "Tourists throw water bottles and chips packets everywhere. Bin capacity is too small.", has_photo: false, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-11 (K Pudur School Toilet)
  { id: "v-26", issue_id: "issue-11", verifier_name: "Githa", verifier_ward: "Ward 22 (K.Pudur)", vote_type: "Confirm Real", comment: "Disgraceful toilet state. No water supply. Girls are falling sick and absent.", has_photo: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-12 (Vague complaint) - dispute votes!
  { id: "v-27", issue_id: "issue-12", verifier_name: "Rajesh", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Not Seen", comment: "Where is this area? Complete false, our lane roads were laid last year.", has_photo: false, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "v-28", issue_id: "issue-12", verifier_name: "Velu", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Needs More Info", comment: "Vague, what exactly is bad? Vague complaint.", has_photo: false, created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },

  // issue-13 (Open drain Sellur)
  { id: "v-29", issue_id: "issue-13", verifier_name: "Ulaganathan", verifier_ward: "Ward 42 (Sellur)", vote_type: "Confirm Real", comment: "Yes, open sewage canals here are 4 feet deep. Serious risk during rains.", has_photo: false, created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },

  // issue-14 (Goripalayam PHC Medicine shortage)
  { id: "v-30", issue_id: "issue-14", verifier_name: "Subha", verifier_ward: "Ward 12 (Goripalayam)", vote_type: "Confirm Real", comment: "Went yesterday, got zero tablets. They ask us to buy from private medical shop.", has_photo: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

// Calculation Functions (Code-Based Scoring, NOT decided directly by Gemini)

export function calculatePriorityScore(issue: Partial<Issue>): { score: number; level: "Critical" | "High" | "Medium" | "Low" } {
  const severity = Math.round(Number(issue.severity_score ?? 1));
  const urgency = Math.round(Number(issue.urgency_score ?? 1));
  const people = Math.round(Number(issue.people_affected ?? 1));
  const vulnerable = Boolean(issue.vulnerable_groups_affected ?? false);
  const spam_risk = Number(issue.spam_or_fake_risk ?? 0.0);
  
  // Calculate duplicates dynamically
  const duplicate_count = Math.round(Number(issue.duplicate_count ?? 1));

  const has_location = Boolean(issue.location && issue.location !== "Unspecified Area");
  const has_evidence = Boolean(
    (issue as any).photo_url || 
    (issue as any).has_photo || 
    (issue.complaint_text && issue.complaint_text.length > 20)
  );

  let score = 0;

  // 1. Severity Score (Max 25 pts)
  score += severity * 5;

  // 2. Urgency Score (Max 20 pts)
  score += urgency * 4;

  // 3. People Affected (Max 18 pts)
  if (people >= 500) score += 18;
  else if (people >= 200) score += 15;
  else if (people >= 100) score += 12;
  else if (people >= 50) score += 9;
  else if (people >= 10) score += 6;
  else if (people >= 2) score += 3;

  // 4. Duplicity Booster (Max 12 pts)
  if (duplicate_count >= 20) score += 12;
  else if (duplicate_count >= 10) score += 9;
  else if (duplicate_count >= 5) score += 6;
  else if (duplicate_count >= 2) score += 3;

  // 5. Social Equity/Vulnerability Boost (+8)
  if (vulnerable) score += 8;

  // 6. Evidence Strength Booster (+7)
  if (has_evidence) score += 7;

  // 7. Location Confidence Factor (+5 if verified, -10 if missing)
  if (has_location) {
    score += 5;
  } else {
    score -= 10;
  }

  // 8. Spam Risk Deduction (Penalty: -20 * risk)
  score -= Math.round(spam_risk * 20);

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let level: "Critical" | "High" | "Medium" | "Low";
  if (finalScore >= 90) level = "Critical";
  else if (finalScore >= 70) level = "High";
  else if (finalScore >= 40) level = "Medium";
  else level = "Low";

  return { score: finalScore, level };
}

export function calculateRealityPercentage(
  issue: Partial<Issue>, 
  votes: Verification[], 
  duplicateCount: number
): { score: number; status: Issue["reality_status"] } {
  const confirmVotes = votes.filter(v => v.vote_type === "Confirm Real").length;
  const partialVotes = votes.filter(v => v.vote_type === "Partially True").length;
  const disputeVotes = votes.filter(v => v.vote_type === "Not Seen" || v.vote_type === "Needs More Info").length;

  const confirmed_votes_score = Math.min(40, confirmVotes * 8);
  const partial_votes_score = Math.min(20, partialVotes * 4);
  const dispute_votes_score = Math.max(-30, disputeVotes * -8);

  const photo_evidence_score = ((issue as any).photo_url || (issue as any).has_photo || votes.some(v => v.has_photo)) ? 15 : 0;
  const duplicate_reports_score = duplicateCount >= 5 ? 10 : (duplicateCount >= 2 ? 5 : 0);
  const location_match_score = (issue.location && issue.location !== "Unspecified Area") ? 10 : 0;
  
  const ai_confidence = issue.ai_confidence ?? 0.8;
  const ai_confidence_score = ai_confidence * 10;
  
  const spam_risk_score = (issue.spam_or_fake_risk ?? 0.05) * 20;

  let score = confirmed_votes_score + 
              partial_votes_score + 
              photo_evidence_score + 
              duplicate_reports_score + 
              location_match_score + 
              ai_confidence_score + 
              dispute_votes_score - 
              spam_risk_score;

  const finalScore = Math.round(Math.max(0, Math.min(score, 100)));

  let status: Issue["reality_status"];
  if (finalScore >= 80) {
    status = "Strongly Verified";
  } else if (finalScore >= 60) {
    status = "Likely Real";
  } else if (finalScore >= 30) {
    status = "Needs More Verification";
  } else {
    status = "Low Confidence";
  }

  return { score: finalScore, status };
}

export function calculateInfrastructureGapScore(category: string, ward: WardData | undefined): number {
  if (!ward) return 50;
  const cat = category.toLowerCase();
  let score = 50;

  if (cat.includes("school") || cat.includes("education")) {
    const enrollmentFactor = Math.min(30, (ward.school_enrollment / 2000) * 30);
    const distanceFactor = Math.min(40, (ward.distance_to_nearest_school_km / 5) * 40);
    const vulnerableFactor = Math.min(30, (ward.vulnerable_population_estimate / 10000) * 30);
    score = enrollmentFactor + distanceFactor + vulnerableFactor;
  } else if (cat.includes("health") || cat.includes("medical") || cat.includes("phc")) {
    const phcFactor = Math.min(40, (ward.distance_to_nearest_phc_km / 4) * 40);
    const elderlyFactor = Math.min(30, (ward.elderly_population / 8000) * 30);
    const vulnerableFactor = Math.min(30, (ward.vulnerable_population_estimate / 10000) * 30);
    score = phcFactor + elderlyFactor + vulnerableFactor;
  } else if (cat.includes("road") || cat.includes("pothole") || cat.includes("surface") || cat.includes("street")) {
    const roadFactor = 100 - ward.road_quality_score; // Lower quality = higher gap
    const popFactor = Math.min(30, (ward.population / 80000) * 30);
    score = roadFactor * 0.7 + popFactor;
  } else if (cat.includes("drain") || cat.includes("sewage") || cat.includes("water stagnant")) {
    const drainageFactor = ward.drainage_risk_score;
    const popFactor = Math.min(30, (ward.population / 80000) * 30);
    score = drainageFactor * 0.7 + popFactor;
  } else if (cat.includes("water") || cat.includes("drinking") || cat.includes("pipeline")) {
    const waterFactor = ward.water_supply_gap; // %
    const popFactor = Math.min(40, (ward.population / 80000) * 40);
    score = waterFactor * 2.0 + popFactor;
  } else if (cat.includes("waste") || cat.includes("garbage") || cat.includes("clean")) {
    const wasteFactor = (7 - ward.waste_collection_frequency) * 14.2; // Max 100
    const popFactor = Math.min(30, (ward.population / 80000) * 30);
    score = wasteFactor * 0.7 + popFactor;
  } else if (cat.includes("employment") || cat.includes("vocational") || cat.includes("unemployment") || cat.includes("training") || cat.includes("livelihood")) {
    const unemployFactor = ward.youth_unemployment_estimate * 2.5; // Max 75
    const popFactor = Math.min(30, (ward.population / 80000) * 30);
    score = unemployFactor * 0.7 + popFactor;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCitizenDemandScore(issue: Partial<Issue>, allIssues: Issue[], verifications: Verification[]): number {
  const clusterIssues = allIssues.filter(i => i.cluster_key === issue.cluster_key);
  const totalReports = clusterIssues.length;
  
  // 1. Similar submissions count (Max 40 pts)
  const submissionsPoints = Math.min(40, totalReports * 8);

  // 2. Verification volume (Max 30 pts)
  const clusterIssueIds = clusterIssues.map(i => i.id);
  const clusterVerifications = verifications.filter(v => clusterIssueIds.includes(v.issue_id));
  const verificationPoints = Math.min(30, clusterVerifications.length * 5);

  // 3. People affected (Max 30 pts)
  const totalPeople = clusterIssues.reduce((sum, i) => sum + (i.people_affected || 0), 0);
  let peoplePoints = 5;
  if (totalPeople >= 1000) peoplePoints = 30;
  else if (totalPeople >= 500) peoplePoints = 25;
  else if (totalPeople >= 200) peoplePoints = 20;
  else if (totalPeople >= 100) peoplePoints = 15;
  else if (totalPeople >= 50) peoplePoints = 10;

  return Math.max(0, Math.min(100, submissionsPoints + verificationPoints + peoplePoints));
}

export function calculateFinalDevelopmentPriorityScore(
  issue_priority_score: number,
  reality_percentage: number,
  citizen_demand_score: number,
  infrastructure_gap_score: number,
  feasibility_score: number = 70
): { score: number; level: Issue["final_priority_level"] } {
  const score = (issue_priority_score * 0.35) +
                (reality_percentage * 0.25) +
                (citizen_demand_score * 0.20) +
                (infrastructure_gap_score * 0.15) +
                (feasibility_score * 0.05);
  
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let level: Issue["final_priority_level"];
  if (finalScore >= 80) level = "MP Priority";
  else if (finalScore >= 60) level = "High";
  else if (finalScore >= 40) level = "Medium";
  else level = "Low";

  return { score: finalScore, level };
}

// Helper DB manager storing JSON structured data
class DBManager {
  private issues: Issue[] = [];
  private verifications: Verification[] = [];
  private wardData: WardData[] = [];
  private users: User[] = [];

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);

        // Check if DB is in legacy format (just an array of issues)
        if (Array.isArray(parsed)) {
          this.issues = parsed;
          this.verifications = [...SEED_VERIFICATIONS];
          this.wardData = [...SEED_WARDS];
          this.users = [];
        } else {
          this.issues = parsed.issues || [];
          this.verifications = parsed.verifications || [...SEED_VERIFICATIONS];
          this.wardData = parsed.wardData || [...SEED_WARDS];
          this.users = parsed.users || [];
        }
        console.log(`Loaded database successfully: ${this.issues.length} issues, ${this.verifications.length} verifications.`);
      } else {
        console.log("No data.json found. Creating initial database seed...");
        this.issues = SEED_ISSUES.map(issue => {
          return {
            ...issue,
            duplicate_count: 1,
            cluster_key: "",
            issue_priority_score: 0,
            issue_priority_level: "Low",
            reality_percentage: 50,
            reality_status: "Needs More Verification",
            citizen_demand_score: 50,
            infrastructure_gap_score: 50,
            feasibility_score: 70,
            final_development_priority_score: 0,
            final_priority_level: "Low",
          } as Issue;
        });
        this.verifications = [...SEED_VERIFICATIONS];
        this.wardData = [...SEED_WARDS];
        this.users = [];
      }

      // Perform complete dynamic recluster, priority calculations, and save back to JSON
      this.reclusterDatabase();
      this.saveDatabase();
    } catch (error) {
      console.error("Database loading or seeding failed:", error);
      // Fail-safe default arrays
      this.issues = [];
      this.verifications = [...SEED_VERIFICATIONS];
      this.wardData = [...SEED_WARDS];
      this.users = [];
      this.reclusterDatabase();
      this.saveDatabase();
    }
  }

  public saveDatabase() {
    try {
      const dataToSave = {
        issues: this.issues,
        verifications: this.verifications,
        wardData: this.wardData,
        users: this.users
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (error) {
      console.error("Database saving failed:", error);
    }
  }

  public getIssues(): Issue[] {
    return this.issues;
  }

  public getIssueById(id: string): Issue | undefined {
    return this.issues.find((issue) => issue.id === id);
  }

  public getVerificationsForIssue(issue_id: string): Verification[] {
    return this.verifications.filter(v => v.issue_id === issue_id);
  }

  public addIssue(issue: Issue) {
    this.issues.unshift(issue);
    this.reclusterDatabase();
    this.saveDatabase();
  }

  public addVerification(v: Verification) {
    // Check if duplicate verification for the same user on the same issue
    const duplicate = this.verifications.find(
      ex => ex.issue_id === v.issue_id && ex.verifier_name.trim().toLowerCase() === v.verifier_name.trim().toLowerCase()
    );
    if (!duplicate) {
      this.verifications.push(v);
    } else {
      // Update existing vote
      duplicate.vote_type = v.vote_type;
      duplicate.comment = v.comment;
      duplicate.has_photo = v.has_photo;
      duplicate.created_at = v.created_at;
    }
    
    this.reclusterDatabase();
    this.saveDatabase();
  }

  public updateIssueStatus(id: string, status: Issue["status"]) {
    const issue = this.issues.find((i) => i.id === id);
    if (issue) {
      issue.status = status;
      issue.updated_at = new Date().toISOString();
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getWardData(): WardData[] {
    return this.wardData;
  }

  public getWardDataByNumber(ward_number: string): WardData | undefined {
    return this.wardData.find(w => w.ward_number === ward_number);
  }

  // Heavy dynamic calculation to compute cluster keys, duplicate counts, priority levels, reality scores, gaps, demand, and final MP dev score
  public reclusterDatabase() {
    // 1. Group issues by ward and category to determine cluster counts on the fly
    const keyGroups: { [key: string]: Issue[] } = {};
    for (const issue of this.issues) {
      const categoryPart = (issue.category || "General").toLowerCase().replace(/\s+/g, "_");
      const wardPart = (issue.ward || "General").toLowerCase().replace(/\s+/g, "_");
      const key = `${categoryPart}-${wardPart}`;
      issue.cluster_key = key;

      if (!keyGroups[key]) {
        keyGroups[key] = [];
      }
      keyGroups[key].push(issue);
    }

    // 2. Loop through all issues and apply custom Civic Proof and Priority mathematical models
    for (const issue of this.issues) {
      const clusterIssues = keyGroups[issue.cluster_key] || [];
      const duplicateCount = clusterIssues.length;
      issue.duplicate_count = duplicateCount; // backward-compat utility

      // Clean up ward names to fetch ward statistics
      const wardCleanNum = issue.ward.match(/Ward\s+(\d+)/)?.[1] || "";
      const wardDataset = this.wardData.find(w => w.ward_number === wardCleanNum);

      // A. Reality Percentage and Reality Status Badging
      const issueVotes = this.verifications.filter(v => v.issue_id === issue.id);
      const realityCalc = calculateRealityPercentage(issue, issueVotes, duplicateCount);
      issue.reality_percentage = realityCalc.score;
      issue.reality_status = realityCalc.status;

      // B. Infrastructure Gap Score Calculation
      issue.infrastructure_gap_score = calculateInfrastructureGapScore(issue.category, wardDataset);

      // C. Core Issue Priority Score (0-100)
      const issuePriorityCalc = calculatePriorityScore(issue);
      issue.issue_priority_score = issuePriorityCalc.score;
      issue.issue_priority_level = issuePriorityCalc.level;

      // Backward compatibility variables
      issue.priority_score = issuePriorityCalc.score;
      issue.priority_level = issuePriorityCalc.level;

      // D. Citizen Demand Score Calculation
      issue.citizen_demand_score = calculateCitizenDemandScore(issue, this.issues, this.verifications);

      // E. Final MP Development Priority Score (0-100)
      const finalPriorityCalc = calculateFinalDevelopmentPriorityScore(
        issue.issue_priority_score,
        issue.reality_percentage,
        issue.citizen_demand_score,
        issue.infrastructure_gap_score,
        issue.feasibility_score ?? 70
      );
      issue.final_development_priority_score = finalPriorityCalc.score;
      issue.final_priority_level = finalPriorityCalc.level;
    }
  }

  public getClusters(): Cluster[] {
    const keyGroupsMap: { [key: string]: Issue[] } = {};
    this.issues.forEach(i => {
      const key = i.cluster_key || `${(i.category || "General").toLowerCase()}-${(i.ward || "General").toLowerCase()}`;
      if (!keyGroupsMap[key]) keyGroupsMap[key] = [];
      keyGroupsMap[key].push(i);
    });

    const clustersMap: { [key: string]: Cluster } = {};

    this.issues.forEach((issue) => {
      const key = issue.cluster_key || `${(issue.category || "General").toLowerCase()}-${(issue.ward || "General").toLowerCase()}`;
      
      if (!clustersMap[key]) {
        clustersMap[key] = {
          id: `cluster-${key}`,
          cluster_key: key,
          ward: issue.ward || "General Ward",
          category: issue.category || "General",
          title: `Reported ${issue.category || "General"} in ${issue.ward ? (issue.ward.includes(" (") ? issue.ward.split(" (")[0] : issue.ward) : "General"}`,
          total_reports: 0,
          total_confirmations: 0,
          average_reality_percentage: 0,
          average_priority_score: 0,
          final_recommendation_score: 0,
          status: "Pending"
        };
      }

      const cluster = clustersMap[key];
      cluster.total_reports += 1;
      
      // Calculate confirmations count (Confirm Real votes)
      const votes = this.getVerificationsForIssue(issue.id);
      cluster.total_confirmations += votes.filter(v => v.vote_type === "Confirm Real").length;

      // Average Reality and Priority
      cluster.average_reality_percentage = Math.round(
        (cluster.average_reality_percentage * (cluster.total_reports - 1) + issue.reality_percentage) / cluster.total_reports
      );
      cluster.average_priority_score = Math.round(
        (cluster.average_priority_score * (cluster.total_reports - 1) + issue.issue_priority_score) / cluster.total_reports
      );
      cluster.final_recommendation_score = Math.round(
        (cluster.final_recommendation_score * (cluster.total_reports - 1) + issue.final_development_priority_score) / cluster.total_reports
      );

      // Status aggregation cascade
      const statuses = (keyGroupsMap[key] || []).map(i => i.status);
      if (statuses.every(s => s === "Resolved")) {
        cluster.status = "Resolved";
      } else if (statuses.some(s => s === "Forwarded to Department")) {
        cluster.status = "Forwarded to Department";
      } else if (statuses.some(s => s === "In Review")) {
        cluster.status = "In Review";
      } else {
        cluster.status = "Pending";
      }
    });

    return Object.values(clustersMap).sort((a, b) => b.final_recommendation_score - a.final_recommendation_score);
  }

  public getStats() {
    const total = this.issues.length;
    const verifiedDemands = this.issues.filter(i => i.reality_percentage >= 60).length;
    const lowConfidence = this.issues.filter(i => i.reality_percentage < 30).length;
    const pendingVerification = this.issues.filter(i => i.reality_percentage >= 30 && i.reality_percentage < 60).length;

    let totalReality = 0;
    let totalDevPriority = 0;
    let totalSeverity = 0;

    const wardMap: { [key: string]: number } = {};
    const categoryMap: { [key: string]: number } = {};

    this.issues.forEach((i) => {
      totalReality += i.reality_percentage || 0;
      totalDevPriority += i.final_development_priority_score || 0;
      totalSeverity += i.severity_score || 0;
      const wName = i.ward || "General Ward";
      const cName = i.category || "General";
      wardMap[wName] = (wardMap[wName] || 0) + 1;
      categoryMap[cName] = (categoryMap[cName] || 0) + 1;
    });

    const averageRealityPercentage = total > 0 ? Math.round(totalReality / total) : 0;
    const averageDevelopmentPriorityScore = total > 0 ? Math.round(totalDevPriority / total) : 0;
    const averageSeverity = total > 0 ? Math.round((totalSeverity / total) * 10) / 10 : 0;

    const topCategories = Object.keys(categoryMap)
      .map(cat => ({ category: cat, count: categoryMap[cat] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topWards = Object.keys(wardMap)
      .map(w => ({ ward: w, count: wardMap[w] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const critical = this.issues.filter(i => (i.priority_level === "Critical" || i.issue_priority_level === "Critical")).length;
    const high = this.issues.filter(i => (i.priority_level === "High" || i.issue_priority_level === "High")).length;
    const resolved = this.issues.filter(i => i.status === "Resolved").length;
    const mostAffectedWard = topWards.length > 0 ? topWards[0].ward : "General Ward";
    const topCategory = topCategories.length > 0 ? topCategories[0].category : "General";

    // Get 5 most recent submissions
    const recentActivity = this.issues
      .slice(0, 5)
      .map(i => {
        let timeText = "Just now";
        try {
          const diffMs = Date.now() - new Date(i.created_at).getTime();
          const diffMins = Math.floor(diffMs / (60 * 1000));
          const diffHrs = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHrs / 24);
          if (diffDays > 0) timeText = `${diffDays}d ago`;
          else if (diffHrs > 0) timeText = `${diffHrs}h ago`;
          else if (diffMins > 0) timeText = `${diffMins}m ago`;
        } catch (_) {}

        return {
          id: i.id,
          title: i.development_need_title || i.complaint_text.slice(0, 30) + "...",
          ward: i.ward,
          time: timeText,
          type: "Submission"
        };
      });

    return {
      total,
      verifiedDemands,
      lowConfidence,
      pendingVerification,
      averageRealityPercentage,
      averageDevelopmentPriorityScore,
      topCategories,
      topWards,
      recentActivity,
      critical,
      high,
      resolved,
      mostAffectedWard,
      topCategory,
      averageSeverity,
      wardIssues: topWards
    };
  }
}

const db = new DBManager();

// Fallback Mock AI Response Generator
function getMockAIAnalysis(text: string, language: string, manualLocation?: string, manualPeople?: number, suggestedWork?: string): any {
  const words = text.toLowerCase();
  let category = "General Infrastructure";
  let sub_category = "General Ward Requirement";
  let recommended_department = "District Collector Office";
  let suggested_action = "Inspect the ward and allocate necessary engineering department resources.";
  let suggested_development_work = suggestedWork || "Public ward infrastructure upgrade and renovation.";
  let development_need_title = "Ward Public Infrastructure Repair Work";
  let severity_score = 3;
  let urgency_score = 3;

  if (words.includes("water stagnant") || words.includes("drain") || words.includes("sewage") || words.includes("சாக்கடை") || words.includes("नाला") || words.includes("gutter")) {
    category = "Drainage";
    sub_category = words.includes("open") ? "Open Drain Hazard" : "Sewage Blockage / Overflow";
    recommended_department = "Madurai Municipal Corporation - Sanitation Division";
    suggested_action = "Deploy vacuum trucks to clear deep sewage blockages and silt.";
    suggested_development_work = suggestedWork || "Reconstruct underground concrete stormwater sewer line.";
    development_need_title = "Primary Sewer Conduit & Drain Reconstruction";
    severity_score = 4;
    urgency_score = 4;
  } else if (words.includes("water") || words.includes("தண்ணீர்") || words.includes("पानी") || words.includes("drinking") || words.includes("pipeline") || words.includes("contaminated")) {
    category = "Drinking Water";
    sub_category = words.includes("muddy") || words.includes("smell") || words.includes("contaminated") ? "Contaminated Water Supply" : "Pipeline Burst/Leak";
    recommended_department = "TWAD Board & Corporation Water Supply Wing";
    suggested_action = "Locate leakage points near drainage crossings, seal lines, and sanitize overhead reservoirs.";
    suggested_development_work = suggestedWork || "Lay corrosion-proof drinking water pipeline networks.";
    development_need_title = "Clean Drinking Water Supply Infrastructure Layout";
    severity_score = 5;
    urgency_score = 5;
  } else if (words.includes("road") || words.includes("pothole") || words.includes("சாலை") || words.includes("सड़क") || words.includes("गड्ढे") || words.includes("broken")) {
    category = "Road Damage";
    sub_category = "Potholes and Cracked Surfaces";
    recommended_department = "Highways & Public Works Department (PWD)";
    suggested_action = "Conduct immediate bituminous asphalt patch-work over loose road craters.";
    suggested_development_work = suggestedWork || "Complete bituminous road milling and resurfacing.";
    development_need_title = "Main Ward Road Bitumen Repaving & Safety Work";
    severity_score = 4;
    urgency_score = 3;
  } else if (words.includes("light") || words.includes("dark") || words.includes("விளக்கு") || words.includes("बिजली") || words.includes("streetlights")) {
    category = "Streetlights";
    sub_category = "Non-functional Streetlights";
    recommended_department = "TNEB & Municipal Electrical Department";
    suggested_action = "Inspect overhead lines, replace fused sodium bulbs, and reset timers.";
    suggested_development_work = suggestedWork || "Replace fluorescent lights with modern smart solar LED structures.";
    development_need_title = "Ward Public Lighting High-Mast LED Conversion Grid";
    severity_score = 3;
    urgency_score = 4;
  } else if (words.includes("garbage") || words.includes("waste") || words.includes("குப்பை") || words.includes("कचरा") || words.includes("dump") || words.includes("litter")) {
    category = "Waste Collection";
    sub_category = "Uncontrolled Dump / Collection Failure";
    recommended_department = "Municipal Corporation - Solid Waste Management";
    suggested_action = "Deploy hydraulic loader dumpers to lift uncollected piles.";
    suggested_development_work = suggestedWork || "Set up static closed-lid stainless community trash stations.";
    development_need_title = "Heritage Zone Solid Waste Management & Bins Deployment";
    severity_score = 3;
    urgency_score = 3;
  } else if (words.includes("school") || words.includes("toilet") || words.includes("education") || words.includes("பள்ளி") || words.includes("स्कूल") || words.includes("classroom") || words.includes("anganwadi")) {
    category = "School Infrastructure";
    sub_category = words.includes("toilet") ? "School Toilet Upgrade" : "Classroom Building Repairs";
    recommended_department = "Education Department & Corporation Works Wing";
    suggested_action = "Carry out plumbing overhauls, install secondary water pumps, and repair damaged ceilings.";
    suggested_development_work = suggestedWork || "Construct new school toilet blocks, classrooms, and Anganwadi rooms.";
    development_need_title = "Government School Infrastructure & Sanitation Upgrade";
    severity_score = 4;
    urgency_score = 4;
  } else if (words.includes("health") || words.includes("phc") || words.includes("doctor") || words.includes("medicine") || words.includes("மருத்துவ")) {
    category = "Healthcare";
    sub_category = "Primary Health Center Deficiencies";
    recommended_department = "District Health Officer & Municipal Health Wing";
    suggested_action = "Draft emergency medical stock replacement and rotate staff morning duties.";
    suggested_development_work = suggestedWork || "Establish secondary PHC subcenters and stock tracking dashboards.";
    development_need_title = "Primary Health Sub-centre Facility & Medical Stocks Stabilization";
    severity_score = 4;
    urgency_score = 4;
  } else if (words.includes("unemployment") || words.includes("employment") || words.includes("vocational") || words.includes("skills") || words.includes("training")) {
    category = "Employment / Vocational Centre";
    sub_category = "Unemployment Support Services";
    recommended_department = "Directorate of Employment and Training & MP LADS";
    suggested_action = "Allocate vacant municipality ward rooms for local training classes.";
    suggested_development_work = suggestedWork || "Fund a smart vocational training institute with computer and tailoring machinery.";
    development_need_title = "Livelihood & Women Self-Help Vocational Center";
    severity_score = 2;
    urgency_score = 2;
  }

  // Vague checking
  if (text.length < 25 && !words.includes("water") && !words.includes("road") && !words.includes("drain") && !words.includes("light")) {
    development_need_title = "General Ward Infrastructure Request";
    category = "Road Damage";
    sub_category = "General Maintenance";
    severity_score = 1;
    urgency_score = 1;
    suggested_action = "Flag for general area inspection by field team.";
  }

  const peopleAffected = manualPeople || (words.includes("many") || words.includes("hundreds") || words.includes("everyone") ? 500 : 50);

  return {
    translated_summary: `[Fallback translation] Resident submitted in ${language}: "${text}". The request relates to ${category} issues in the locality.`,
    development_need_title,
    category,
    sub_category,
    severity_score,
    urgency_score,
    people_affected_estimate: peopleAffected,
    location_detected: manualLocation || "Madurai Constituency Area",
    recommended_department,
    suggested_development_work,
    suggested_action,
    evidence_needed: "Resident GPS-stamped photo proof showing site status.",
    vulnerable_groups_affected: words.includes("child") || words.includes("school") || words.includes("pregnant") || words.includes("old") || words.includes("elderly") || words.includes("women"),
    spam_or_fake_risk: text.length < 20 ? 0.75 : 0.04,
    ai_confidence: 0.85,
    priority_reason: "Derived via multi-factor rule checks on citizen density and safety hazards.",
    estimated_resolution_time: "5-7 Working Days"
  };
}

// Fallback Mock Brief Generator
function getMockBrief(issue: Issue): string {
  return `## MP OFFICIAL DEVELOPMENT ACTION BRIEF
**Constituency Development Planning Initiative**

### 1. Development Need Summary
An urgent constituency request has been filed regarding **${issue.category}** (**${issue.sub_category}**) at **${issue.location}** in **${issue.ward}**. The local community demands: 
> *"${issue.suggested_development_work}"*
The citizen's core complaint highlights: "${issue.translated_summary}".

### 2. Why This Is a Priority
This development proposal has achieved a **Final Development Priority Score of ${issue.final_development_priority_score}/100** (Level: **${issue.final_priority_level}**) based on the JanataPulse AI Civic Engine:
* **Citizen Demand**: Ranked **${issue.citizen_demand_score}/100** representing repeated submissions and substantial citizen density.
* **Infrastructure Gap**: **${issue.infrastructure_gap_score}/100** matching severe gaps in current public ward records.
* **Safety & Severity**: Classified as **${issue.issue_priority_level}** Priority (Score: ${issue.issue_priority_score}/100).

### 3. Citizen Demand Evidence
* **Total Submissions**: A cluster of similar requests in this ward category.
* **Public Verification**: **${issue.reality_status}** status with a high reality percentage of **${issue.reality_percentage}%** backed by verified resident voting logs.

### 4. Reality Verification Status
* **Verification Status**: **${issue.reality_status}** (${issue.reality_percentage}%)
* **Citizen Feedback**: Consistent testimonies detailing high disruption to daily student commutes, local transit, or public health safety.

### 5. Ward Data / Infrastructure Gap
* **Local Statistics**: The ward has high vulnerability factors with considerable distance to essential utilities.
* **Gap Severity**: The lack of structural ${issue.category} facilities forces children and senior citizens to endure extreme hardship.

### 6. Department to Contact
**${issue.recommended_department}**
*To: Chief Engineer / Assistant Commissioner (Madurai Zone Operations)*

### 7. Recommended 3-Step Action Plan
1. **Immediate Inspection & Safety Despatch**: Direct the Zonal Assistant Engineer to verify coordinates and secure site hazards.
2. **Administrative Approval & Fund Allocation**: Allocate necessary capital from the MP LADS (Local Area Development Scheme) or municipal civic budgets to fund "${issue.suggested_development_work}".
3. **Execution & Audit**: Commission contractors with a 60-day deadline, backed by ward citizen verifiers logging construction milestones.

### 8. Draft Official Message
\`\`\`text
Office of the Member of Parliament
Madurai Constituency Planner

To:
The Commissioner / Superintending Engineer
${issue.recommended_department}

Subject: REQUISITION FOR IMMEDIATE DEVELOPMENT WORK - ${issue.development_need_title} (Ward ${issue.ward})

Dear Commissioner,

I wish to bring to your immediate attention a highly verified, top-priority constituency development demand logged by the citizens of ${issue.ward}.

The residents at ${issue.location} are suffering severely due to ${issue.translated_summary}. The JanataPulse AI Civic Engine has validated this proposal with a Development Score of ${issue.final_development_priority_score}/100, indicating high public demand and acute infrastructure gaps.

I request you to immediately approve the proposed project: "${issue.suggested_development_work}" and deploy emergency field staff to initiate the initial 3-step action layout within 48 hours.

Kindly submit a formal status report to my constituency office upon completion.

Yours sincerely,
[Member of Parliament, Madurai Constituency]
\`\`\`

### 9. Expected Impact
* Restoration of public hygiene, transport safety, or utility access for approximately **${issue.people_affected}+ residents**.
* Elimination of severe waterborne hazards and accident zones.
* Drastic reduction of daily commute delays for school-going kids.

### 10. Follow-up Timeline
* **T+24 Hours**: Official dispatch sent and registered.
* **T+3 Days**: Site visit and feasibility check logged by municipal engineers.
* **T+15 Days**: Technical blueprints approved and initial fund release.
* **T+45 Days**: Citizens vote on completion verification in Ward Planner.`;
}

// ==========================================
// EXPRESS SERVER SETUP
// ==========================================
const app = express();
app.use(express.json());

// API ENDPOINTS

// GET /api/issues - Table of issues
app.get("/api/issues", (req, res) => {
  res.json(db.getIssues());
});

// GET /api/issues/:id - Retrieve specific issue details
app.get("/api/issues/:id", (req, res) => {
  const issue = db.getIssueById(req.params.id);
  if (issue) {
    res.json(issue);
  } else {
    res.status(404).json({ error: "Grievance or suggestion not found" });
  }
});

// PATCH /api/issues/:id/status - Update issue status
app.patch("/api/issues/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status field is required" });
  }
  const success = db.updateIssueStatus(req.params.id, status);
  if (success) {
    res.json(db.getIssueById(req.params.id));
  } else {
    res.status(404).json({ error: "Suggestion not found" });
  }
});

// GET /api/issues/:id/verifications - Get all votes
app.get("/api/issues/:id/verifications", (req, res) => {
  res.json(db.getVerificationsForIssue(req.params.id));
});

// POST /api/verify/:issue_id - Submit citizen verification vote
app.post("/api/verify/:issue_id", (req, res) => {
  const { verifier_name, verifier_phone, verifier_ward, vote_type, comment, has_photo } = req.body;
  
  if (!verifier_name || !verifier_ward || !vote_type) {
    return res.status(400).json({ error: "Verifier name, ward, and vote type are required" });
  }

  const issue = db.getIssueById(req.params.issue_id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newV: Verification = {
    id: `v-${Date.now()}`,
    issue_id: req.params.issue_id,
    verifier_name,
    verifier_phone: verifier_phone || "",
    verifier_ward,
    vote_type: vote_type as any,
    comment: comment || "",
    has_photo: !!has_photo,
    created_at: new Date().toISOString()
  };

  db.addVerification(newV);

  // Return the updated issue with updated scores
  res.status(201).json(db.getIssueById(req.params.issue_id));
});

// GET /api/ward/:ward_number/issues - Get issues from same ward
app.get("/api/ward/:ward_number/issues", (req, res) => {
  const wardNum = req.params.ward_number;
  const filtered = db.getIssues().filter(i => {
    // extract ward number e.g. "Ward 12 (Goripalayam)" -> "12"
    const match = i.ward.match(/Ward\s+(\d+)/);
    return match ? match[1] === wardNum : false;
  });
  res.json(filtered);
});

// GET /api/ward-data - Get all ward datasets
app.get("/api/ward-data", (req, res) => {
  res.json(db.getWardData());
});

// GET /api/ward-data/:ward_number - Get detailed ward data
app.get("/api/ward-data/:ward_number", (req, res) => {
  const ward = db.getWardDataByNumber(req.params.ward_number);
  if (ward) {
    res.json(ward);
  } else {
    res.status(404).json({ error: "Ward data not found" });
  }
});

// GET /api/dashboard/stats - Advanced platform stats
app.get("/api/dashboard/stats", (req, res) => {
  res.json(db.getStats());
});

// GET /api/priorities - Active priority clusters
app.get("/api/priorities", (req, res) => {
  res.json(db.getClusters());
});

// GET /api/development-plan - MP Development plan ranked works
app.get("/api/development-plan", (req, res) => {
  // Return all issues sorted descending by final development priority score
  const issues = [...db.getIssues()].sort((a, b) => b.final_development_priority_score - a.final_development_priority_score);
  res.json(issues);
});

// GET /api/hotspots - Map hotspots data
app.get("/api/hotspots", (req, res) => {
  // Groups issues by ward and returns lat/lng, ward, top issue name, total counts, averages
  const wardsData = db.getWardData();
  const issues = db.getIssues();
  
  const hotspots = wardsData.map(ward => {
    const wardIssues = issues.filter(i => {
      const num = i.ward.match(/Ward\s+(\d+)/)?.[1] || "";
      return num === ward.ward_number;
    });

    if (wardIssues.length === 0) {
      return {
        ward_number: ward.ward_number,
        ward_name: ward.ward_name,
        latitude: ward.latitude,
        longitude: ward.longitude,
        top_issue: "No reported issues",
        reports_count: 0,
        average_reality: 0,
        average_dev_score: 0,
        top_recommended_work: "None"
      };
    }

    // Sort to find top development score issue
    const sorted = [...wardIssues].sort((a, b) => b.final_development_priority_score - a.final_development_priority_score);
    const topIssue = sorted[0];

    const sumReality = wardIssues.reduce((sum, i) => sum + i.reality_percentage, 0);
    const sumDev = wardIssues.reduce((sum, i) => sum + i.final_development_priority_score, 0);

    return {
      ward_number: ward.ward_number,
      ward_name: ward.ward_name,
      latitude: ward.latitude,
      longitude: ward.longitude,
      top_issue: topIssue.development_need_title || topIssue.complaint_text.slice(0, 30) + "...",
      reports_count: wardIssues.length,
      average_reality: Math.round(sumReality / wardIssues.length),
      average_dev_score: Math.round(sumDev / wardIssues.length),
      top_recommended_work: topIssue.suggested_development_work
    };
  });

  res.json(hotspots);
});

// POST /api/analyze-complaint - Process citizen input with strict rules
app.post("/api/analyze-complaint", async (req, res) => {
  const { complaint_text, language, ward, location, people_affected, suggested_development_work } = req.body;

  if (!complaint_text) {
    return res.status(400).json({ error: "Complaint / suggestion text is required" });
  }

  const selectedWard = ward || "Ward 42 (Sellur)";
  const selectedLocation = location || "Unspecified Area";
  const numPeople = parseInt(people_affected) || 50;

  if (!ai) {
    console.log("Gemini API key is missing. Using local rule-based mock analyzer...");
    const mock = getMockAIAnalysis(complaint_text, language || "English", selectedLocation, numPeople, suggested_development_work);
    return res.json(mock);
  }

  try {
    const prompt = `Analyze the citizen development suggestion / complaint and return only valid JSON according to the responseSchema. Do not include markdown. Do not include any explanations outside of JSON.
Language: ${language || "English"}
User Complaint/Suggestion: ${complaint_text}
Selected Ward: ${selectedWard}
Selected Location: ${selectedLocation}
Estimated Impact Size: ${numPeople}
Suggested Development Work by Citizen: ${suggested_development_work || "None provided"}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI governance triage agent for an Indian MP constituency planning dashboard. Analyze citizen submissions and return only valid JSON. Do not include markdown. Do not decide final priority score. Return only analysis factors. Be realistic, strict, and practical. Most normal issues should be moderate unless there is clear health, safety, public infrastructure, vulnerable population, or large-scale impact. Return a realistic 'spam_or_fake_risk' and 'ai_confidence'. Ensure you also provide a 'suggested_development_work' if the citizen did not specify a practical one.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated_summary: {
              type: Type.STRING,
              description: "Translated or simplified clean summary of the request in English, maximum 2 sentences."
            },
            development_need_title: {
              type: Type.STRING,
              description: "Short descriptive development title in English suitable for MP planning. E.g. 'Sellur Primary School Classroom Reconstruction'."
            },
            category: {
              type: Type.STRING,
              description: "Must classify strictly into one of: Drainage, Streetlights, Road Damage, Drinking Water, Waste Collection, Healthcare, School Infrastructure, Employment / Vocational Centre, Public Transport."
            },
            sub_category: {
              type: Type.STRING,
              description: "Precise sub-issue name, e.g., Sewage Overflow, School Toilet Upgrade, Broken Streetlights."
            },
            severity_score: {
              type: Type.INTEGER,
              description: "Strict Severity (1 = small inconvenience, 2 = minor local issue, 3 = moderate public issue, 4 = serious infrastructure, 5 = emergency / safety danger)."
            },
            urgency_score: {
              type: Type.INTEGER,
              description: "Strict Urgency (1 = weeks, 2 = several days, 3 = this week, 4 = 2-3 days, 5 = 24-48 hours)."
            },
            people_affected_estimate: {
              type: Type.INTEGER,
              description: "Deduce or fallback to the provided impact count."
            },
            location_detected: {
              type: Type.STRING,
              description: "Inferred street corner or locality, or fallback to the selected Location."
            },
            recommended_department: {
              type: Type.STRING,
              description: "Specific Indian government department responsible for this, e.g. Corporation Sanitation Division, Public Works Department (PWD)."
            },
            suggested_development_work: {
              type: Type.STRING,
              description: "A solid, physical development work project that can solve the citizen complaint long-term."
            },
            suggested_action: {
              type: Type.STRING,
              description: "Immediate step to execute first."
            },
            evidence_needed: {
              type: Type.STRING,
              description: "Evidence required, e.g. Resident photos of open sewage holes."
            },
            vulnerable_groups_affected: {
              type: Type.BOOLEAN,
              description: "Are children, women, elderly, disabled, or sick residents heavily affected?"
            },
            spam_or_fake_risk: {
              type: Type.NUMBER,
              description: "Spam/Fake risk score (0.0 to 1.0). High for short, meaningless inputs (e.g. 'My area is bad')."
            },
            ai_confidence: {
              type: Type.NUMBER,
              description: "AI confidence score (0.0 to 1.0) in extracting data."
            },
            priority_reason: {
              type: Type.STRING,
              description: "Brief justification for the scoring."
            },
            estimated_resolution_time: {
              type: Type.STRING,
              description: "E.g. 15-30 days."
            }
          },
          required: [
            "translated_summary",
            "development_need_title",
            "category",
            "sub_category",
            "severity_score",
            "urgency_score",
            "people_affected_estimate",
            "location_detected",
            "recommended_department",
            "suggested_development_work",
            "suggested_action",
            "evidence_needed",
            "vulnerable_groups_affected",
            "spam_or_fake_risk",
            "ai_confidence",
            "priority_reason",
            "estimated_resolution_time"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    const analysis = JSON.parse(resultText);
    res.json(analysis);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    const mock = getMockAIAnalysis(complaint_text, language || "English", selectedLocation, numPeople, suggested_development_work);
    res.json(mock);
  }
});

// POST /api/issues - Submit new development suggestion
app.post("/api/issues", (req, res) => {
  const { citizen_name, phone, language, complaint_text, ward, manual_data } = req.body;

  if (!complaint_text) {
    return res.status(400).json({ error: "Suggestion details are required" });
  }

  const data = manual_data || getMockAIAnalysis(complaint_text, language || "English");

  const newId = `issue-${Date.now()}`;
  
  // Stagger coords around Madurai center slightly
  const offsetLat = (Math.random() - 0.5) * 0.05;
  const offsetLng = (Math.random() - 0.5) * 0.05;

  const newIssue: Issue = {
    id: newId,
    citizen_name: citizen_name || "Anonymous Citizen",
    phone: phone || "",
    language: language || "English",
    complaint_text,
    translated_summary: data.translated_summary || complaint_text,
    development_need_title: data.development_need_title || "New Development Proposal",
    category: data.category || "General Infrastructure",
    sub_category: data.sub_category || "General Issue",
    location: data.location_detected || "Unspecified Area",
    ward: ward || "Ward 42 (Sellur)",
    people_affected: data.people_affected_estimate || 50,
    severity_score: data.severity_score || 3,
    urgency_score: data.urgency_score || 3,
    recommended_department: data.recommended_department || "District General Administration",
    suggested_development_work: data.suggested_development_work || "General municipal renovation.",
    suggested_action: data.suggested_action || "Investigate request.",
    evidence_needed: data.evidence_needed || "Citizen photos.",
    vulnerable_groups_affected: !!data.vulnerable_groups_affected,
    spam_or_fake_risk: data.spam_or_fake_risk || 0.05,
    ai_confidence: data.ai_confidence || 0.85,
    status: "Pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cluster_key: "",
    latitude: 9.9252 + offsetLat,
    longitude: 78.1198 + offsetLng,
    // Calculated scores default (will be computed live in recluster)
    issue_priority_score: 0,
    issue_priority_level: "Low",
    reality_percentage: 50,
    reality_status: "Needs More Verification",
    citizen_demand_score: 50,
    infrastructure_gap_score: 50,
    feasibility_score: 70,
    final_development_priority_score: 0,
    final_priority_level: "Low"
  };

  db.addIssue(newIssue);
  
  const finalState = db.getIssueById(newId);
  res.status(201).json(finalState);
});

// POST /api/generate-brief/:id - Create MP Official Brief with Gemini or mock
app.post("/api/generate-brief/:id", async (req, res) => {
  const issue = db.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Grievance not found" });
  }

  if (!ai) {
    console.log("Gemini API key missing. Using mock brief generator...");
    const briefText = getMockBrief(issue);
    return res.json({ brief: briefText });
  }

  try {
    const prompt = `You are preparing an official development action brief for a Member of Parliament. Create a practical, evidence-based development action note from this issue and verification data. Format your output strictly in Markdown using the 10 headers below:

1. Development Need Summary
2. Why This Is a Priority
3. Citizen Demand Evidence
4. Reality Verification Status
5. Ward Data / Infrastructure Gap
6. Department to Contact
7. Recommended 3-Step Action Plan
8. Draft Official Message
9. Expected Impact
10. Follow-up Timeline

Here is the data:
Issue ID: ${issue.id}
Title: ${issue.development_need_title}
Ward: ${issue.ward}
Category: ${issue.category} (${issue.sub_category})
Summary: ${issue.translated_summary}
Location: ${issue.location}
People Affected: ${issue.people_affected}
Citizen Demand Score: ${issue.citizen_demand_score}/100
Infrastructure Gap Score: ${issue.infrastructure_gap_score}/100
Reality Percentage: ${issue.reality_percentage}% (${issue.reality_status})
Issue Priority Score: ${issue.issue_priority_score}/100 (${issue.issue_priority_level})
Final MP Dev Score: ${issue.final_development_priority_score}/100 (${issue.final_priority_level})
Proposed Physical Project: ${issue.suggested_development_work}
Department POC: ${issue.recommended_department}
Immediate Mitigation: ${issue.suggested_action}
Target Verification Material: ${issue.evidence_needed}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert civic policy advisor preparing a formal, commanding, action-oriented executive briefing note for an Indian Member of Parliament (MP). Keep it highly detailed, clear, and perfectly suited for direct municipal or state department engagement."
      }
    });

    const briefText = response.text || "Failed to generate MP briefing note.";
    res.json({ brief: briefText });
  } catch (error) {
    console.error("Gemini brief generation failed:", error);
    const mockBrief = getMockBrief(issue);
    res.json({ brief: mockBrief });
  }
});

// POST /api/admin/login - Authenticate admin credentials with real backend check
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    res.json({ success: true, token: "admin_jwt_token_placeholder_secret_12345" });
  } else {
    res.status(401).json({ error: "Invalid administrative credentials. Use admin / admin123." });
  }
});

// ==========================================
// PORT BINDING AND SERVER BOOT
// ==========================================
async function startServer() {
  const PORT = 3000;

  // Mount Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
