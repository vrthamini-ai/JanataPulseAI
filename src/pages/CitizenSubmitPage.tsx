import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText as FileIcon, Languages as LangIcon, MapPin as MapPinIcon, Users as UsersIcon, UploadCloud as UploadIcon,
  Mic as MicIcon, MicOff as MicOffIcon, BrainCircuit as BrainIcon, CheckCircle2 as CheckIcon, AlertTriangle as AlertIcon,
  Sparkles as SparkleIcon, HelpCircle as HelpIcon, ArrowRight as ArrowRightIcon, Plus, Building2, Eye, ShieldAlert, CheckCircle, Flame
} from "lucide-react";
import { analyzeComplaint, createIssue } from "../api";

interface CitizenSubmitPageProps {
  onSuccess: (complaint: any) => void;
  onBackToLanding: () => void;
}

export default function CitizenSubmitPage({ onSuccess, onBackToLanding }: CitizenSubmitPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("English");
  const [complaintText, setComplaintText] = useState("");
  const [ward, setWard] = useState("Ward 42 (Sellur)");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Water Supply & Sewage");
  const [peopleAffected, setPeopleAffected] = useState(50);
  const [suggestedWork, setSuggestedWork] = useState("");
  
  // File upload simulation state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Voice input simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<any>(null);

  // AI Analysis Stage state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const wardsList = [
    "Ward 42 (Sellur)",
    "Ward 12 (Goripalayam)",
    "Ward 22 (K.Pudur)",
    "Ward 30 (Aarapalayam)",
    "Ward 18 (Simmakkal)",
    "Ward 15 (Mattuthavani)",
    "Ward 35 (Kalavasal)",
    "Ward 25 (Tallakulam)",
    "Ward 48 (Villapuram)",
    "Ward 14 (Teppakulam)",
    "Ward 55 (Thirunagar)"
  ];

  const categoriesList = [
    "Water Supply & Sewage",
    "Road Potholes & Transit",
    "Solid Waste & Drainage",
    "Streetlights & Safety",
    "Public Buildings & Schools",
    "Livelihood & Training"
  ];

  // Browser Speech-to-Text Support Check and Init
  const startSpeechRecognition = () => {
    setErrorMsg("");
    setSpeechError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not supported in this browser. Please type manually.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      // Map language inputs to browser recognition locales
      if (language === "Tamil") rec.lang = "ta-IN";
      else if (language === "Hindi") rec.lang = "hi-IN";
      else rec.lang = "en-IN";

      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setComplaintText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setSpeechError(`Could not capture audio: ${e.error || "No microphone permissions"}`);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      setSpeechError("Failed to initialize microphone services.");
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Step 1: Request AI Triage Analysis
  const handleRunAITriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      setErrorMsg("Please provide details of your local infrastructure need first.");
      return;
    }
    setErrorMsg("");
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await analyzeComplaint({
        complaint_text: complaintText,
        language,
        ward,
        location,
        people_affected: peopleAffected,
        suggested_development_work: suggestedWork
      });
      setAiResult(result);
    } catch (err: any) {
      setErrorMsg("Failed to process complaint details with AI. Please retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Confirm and Save to Database
  const handleFinalSubmit = async () => {
    if (!aiResult) return;
    setIsAnalyzing(true);

    try {
      const savedIssue = await createIssue({
        citizen_name: name.trim() || "Anonymous Citizen",
        phone: phone.trim(),
        language,
        complaint_text: complaintText,
        ward,
        manual_data: {
          ...aiResult,
          category // lock in selected category
        }
      });
      onSuccess(savedIssue);
    } catch (err) {
      setErrorMsg("Failed to file official complaint. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TEMPLATES = [
    {
      title: "செல்லூர் சாக்கடை (Sewer Overflow)",
      desc: "Tamil - Sewage Leak",
      name: "கார்த்திகேயன் எஸ்.",
      phone: "9845012345",
      language: "Tamil",
      ward: "Ward 42 (Sellur)",
      location: "செல்லூர் மெயின் ரோடு, மசூதி அருகே",
      category: "Water Supply & Sewage",
      text: "மழைக்காலத்துல செல்லூர் பகுதியில் சாக்கடை நீர் தெருவில் ஓடுகிறது. இதனால் கொசுத் தொல்லை அதிகமா இருக்கு. துர்நாற்றம் தாங்க முடியல, குழந்தைகள் நோய்வாய்ப்படுகிறார்கள். அவசரமாக சரி செய்யவும்.",
      affected: 350,
      work: "பழைய சாக்கடை கால்வாய்களை அகலப்படுத்தி புதிய சிமெண்ட் சாக்கடை அமைக்க வேண்டும்."
    },
    {
      title: "கோரிப்பாளையம் விளக்கு (Dark street)",
      desc: "English - Broken Light",
      name: "Meenakshi Sundaram",
      phone: "9841234567",
      language: "English",
      ward: "Ward 12 (Goripalayam)",
      location: "Goripalayam Junction near flyover pillar 12",
      category: "Streetlights & Safety",
      text: "The main road streetlights in Goripalayam near the junction have been completely broken and dark for 2 weeks. It is very dangerous for women at night and multiple chain snatching attempts happened in this pitch black zone.",
      affected: 800,
      work: "Install modern energy-efficient high-luminosity LED street lamps with remote monitoring sensors."
    },
    {
      title: "தல்லாகுளம் பள்ளி பழுது (School Leak)",
      desc: "Tamil - Infrastructure",
      name: "சரஸ்வதி எஸ்.",
      phone: "9123456789",
      language: "Tamil",
      ward: "Ward 25 (Tallakulam)",
      location: "தல்லாகுளம் அரசு பெண்கள் மேல்நிலைப் பள்ளி",
      category: "Public Buildings & Schools",
      text: "தல்லாகுளம் அரசு பள்ளி வகுப்பறை மேற்கூரை காரை பெயர்ந்து விழுகிறது. மழை பெய்யும்போது உள்ளே நீர் ஒழுகுகிறது. மாணவர்கள் அச்சத்தோடு அமர்ந்து படிக்கிறார்கள். பெரிய விபத்து நடக்கும் முன் புதிய கட்டிடம் கட்ட வேண்டும்.",
      affected: 450,
      work: "பள்ளி கட்டிட மேற்கூரை பழுது நீக்கி, கூடுதல் வகுப்பறைகள் கொண்ட புதிய இரண்டு அடுக்கு கட்டிடம் கட்ட நிதி ஒதுக்கீடு செய்ய வேண்டும்."
    },
    {
      title: "जलभराव और सड़क टूटना (Waterlogging & Pot-holes)",
      desc: "Hindi - Waterlogging",
      name: "राजेश कुमार सिंह",
      phone: "9876543210",
      language: "Hindi",
      ward: "Ward 12 (Goripalayam)",
      location: "गोरिपलायम मार्केट के पास मुख्य सड़क",
      category: "Road Potholes & Transit",
      text: "पिछले दो दिनों की बारिश से पूरी सड़क पर घुटनों तक पानी भर गया है। नालियां कचरे से जाम हैं और पानी निकलने का कोई रास्ता नहीं है। बड़े-बड़े गड्ढे दिखाई नहीं दे रहे हैं, जिससे कई मोटरसाइकिल चालक गिर चुके हैं। कृपया जल निकासी की व्यवस्था तुरंत करवाएं।",
      affected: 600,
      work: "सड़क का पुनर्निर्माण कंक्रीट क्योरिंग के साथ करें और नए ढके हुए ड्रेनेज आउटलेट्स का निर्माण करें।"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          &larr; Return to Main Menu
        </button>

        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold uppercase tracking-wider">
          Demo Session Active
        </span>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
          Report a Local Development Need
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">
          Submit details about broken utilities, road gaps, or educational needs in Tamil, Hindi, or English. JanataPulse AI processes dialect translation, impact scoring, and departments automatically.
        </p>
      </div>

      {/* Quick templates wrapper */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-2">
          <SparkleIcon className="w-4.5 h-4.5 text-blue-700 animate-pulse" />
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Frictionless Judge Quick-Fill: Multi-Dialect Indian Complaint Templates
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
          Click any pre-configured template below to populate the multi-step form instantly. Review the high-fidelity AI translation, automatic severity weight calculation, and Spam Risk metrics:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setName(tpl.name);
                setPhone(tpl.phone);
                setLanguage(tpl.language);
                setWard(tpl.ward);
                setLocation(tpl.location);
                setCategory(tpl.category);
                setComplaintText(tpl.text);
                setPeopleAffected(tpl.affected);
                setSuggestedWork(tpl.work);
                setErrorMsg("");
                setAiResult(null);
              }}
              className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-600 hover:shadow-xs active:scale-98 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-700 transition-colors">{tpl.title}</span>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">{tpl.desc}</span>
              </div>
              <span className="text-[10px] font-extrabold text-blue-800 uppercase mt-3.5 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Load Template &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Side: Submission Form (Cols 1-3) */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleRunAITriage} className="space-y-6">
            
            {/* STEP 1 CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 text-xs font-black flex items-center justify-center font-mono">1</span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Step 1: Your Ward & Locality Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Municipal Ward / Area Select
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select 
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40 appearance-none cursor-pointer"
                    >
                      {wardsList.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Precise Area Landmark / Street
                  </label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Near Sellur Mosque junction, water tank corner" 
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthikeyan S." 
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Citizen Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9845012345" 
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2 CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 text-xs font-black flex items-center justify-center font-mono">2</span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Step 2: Describe Development Need
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Filing Language
                  </label>
                  <div className="relative">
                    <LangIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40 appearance-none cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Proposal Sector Category
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40 appearance-none cursor-pointer"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text area and Voice trigger */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Detailed Complaint / Need Statement
                  </label>
                  <button
                    type="button"
                    onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {isRecording ? <MicOffIcon className="w-3 h-3" /> : <MicIcon className="w-3 h-3" />}
                    <span>{isRecording ? "Listening (Stop)" : `Record Speech (${language})`}</span>
                  </button>
                </div>

                {speechError && (
                  <p className="text-red-500 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertIcon className="w-3 h-3" />
                    {speechError}
                  </p>
                )}

                <textarea 
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  rows={4}
                  placeholder={
                    language === "Tamil"
                      ? "அரசுக்கு தெரிவிக்க வேண்டிய குறையை இங்கே விரிவாக எழுதவும் அல்லது பேசவும்..."
                      : language === "Hindi"
                      ? "अपनी समस्या का विवरण यहाँ लिखें या बोलें..."
                      : "Describe physical gaps like storm overflow, high-mast dark spots, drinking water contamination, broken school ceilings, youth job gaps..."
                  }
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-hidden bg-slate-50/10 leading-relaxed"
                  required
                ></textarea>
              </div>

              {/* Suggested physical development work */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Suggested Infrastructure Remedy / Development Work
                </label>
                <input 
                  type="text" 
                  value={suggestedWork}
                  onChange={(e) => setSuggestedWork(e.target.value)}
                  placeholder="e.g. Construct new reinforced concrete storm drain, install 10 high-mast LED lights" 
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-hidden bg-slate-50/40"
                  required
                />
              </div>

              {/* People Affected Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Impact Scale: Approximate Resident Headcount Affected
                  </label>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-100">
                    <UsersIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>~{peopleAffected} Citizens</span>
                  </span>
                </div>
                <input 
                  type="range" 
                  min={5}
                  max={2000}
                  step={5}
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider px-0.5">
                  <span>Household (&lt;15)</span>
                  <span>Street (50-200)</span>
                  <span>Sectors (200-1000)</span>
                  <span>Ward Wide (1000+)</span>
                </div>
              </div>
            </div>

            {/* STEP 3 CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 text-xs font-black flex items-center justify-center font-mono">3</span>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Step 3: Submit Evidentiary Witness Proof
                </h3>
              </div>

              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? "border-blue-600 bg-blue-50/40" 
                    : selectedFile 
                    ? "border-emerald-500 bg-emerald-50/10" 
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
                }`}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <CheckIcon className="w-8 h-8 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-800 truncate max-w-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Evidentiary Image Attached
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <UploadIcon className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">
                      Drag & Drop photo evidence, or <span className="text-blue-700 underline">browse device files</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Supports JPG, PNG (Max 5MB)
                    </p>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed flex items-start gap-1.5">
                <AlertIcon className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Note: Attaching geocoded physical site photos raises Civic Proof Reality levels significantly, aiding MP prioritize metrics.</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className={`w-full py-4 px-6 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAnalyzing 
                  ? "bg-slate-400 cursor-not-allowed animate-pulse" 
                  : "bg-blue-800 hover:bg-blue-700"
              }`}
            >
              <BrainIcon className="w-4.5 h-4.5 text-orange-400" />
              <span>{isAnalyzing ? "Processing NLP Triage..." : "Analyze with AI"}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Dynamic Guidance / AI Results Panel (Cols 4-5) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing-triage"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 h-96 flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-blue-500 opacity-20"></div>
                  <div className="rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400 animate-spin"></div>
                </div>
                <div className="space-y-1 px-4">
                  <p className="text-xs font-bold tracking-widest uppercase text-orange-400">Triage Active</p>
                  <p className="text-sm font-extrabold text-slate-100">
                    AI is analyzing citizen need, ward impact, and priority factors...
                  </p>
                </div>
              </motion.div>
            ) : aiResult ? (
              <motion.div
                key="ai-result-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <BrainIcon className="w-5 h-5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">AI Classification Digest</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Gemini Flash
                  </span>
                </div>

                {/* Summaries */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">English Translation Summary</span>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed font-medium italic">
                    "{aiResult.translated_summary}"
                  </div>
                </div>

                {/* Score weights */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                    <span className="text-slate-400 text-[10px] block font-bold mb-1 uppercase tracking-wider">Filing Sector</span>
                    <strong className="text-slate-100 font-extrabold block truncate">{category}</strong>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                    <span className="text-slate-400 text-[10px] block font-bold mb-1 uppercase tracking-wider">Recommended Agency</span>
                    <strong className="text-orange-400 font-extrabold block truncate">{aiResult.recommended_department || "PWD Office"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                    <span className="text-slate-400 text-[10px] block font-bold mb-1 uppercase tracking-wider">Algorithmic Severity</span>
                    <strong className="text-slate-100 font-extrabold font-mono block">
                      {aiResult.severity_score}/5
                    </strong>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30">
                    <span className="text-slate-400 text-[10px] block font-bold mb-1 uppercase tracking-wider">Timing Urgency</span>
                    <strong className="text-slate-100 font-extrabold font-mono block">
                      {aiResult.urgency_score}/5
                    </strong>
                  </div>
                </div>

                {/* Fraud Risk Indicator */}
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/30 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Spam / Bot Risk Penalty</span>
                    <strong className="text-slate-100 font-extrabold font-mono text-xs block">
                      {Math.round((aiResult.spam_or_fake_risk || 0) * 100)}% Risk
                    </strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    (aiResult.spam_or_fake_risk || 0) > 0.4 
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {(aiResult.spam_or_fake_risk || 0) > 0.4 ? "High Risk" : "Genuine Filing"}
                  </span>
                </div>

                {/* MP allocation info text */}
                <div className="bg-blue-950/40 border border-blue-900/40 p-3.5 rounded-xl text-[10px] text-blue-200 leading-normal font-semibold">
                  Note: A high-confidence triage abstract has been generated. Ward verifiers will cast confirmation votes to solidify these scores on the live dashboard.
                </div>

                {/* Confirm Action Button */}
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckIcon className="w-4 h-4 shrink-0" />
                  <span>Confirm & File Proposal</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="guidance-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <HelpIcon className="w-5 h-5 text-blue-800" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    How JanataPulse AI Works
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-600 leading-relaxed">
                  <p>
                    JanataPulse AI bridges the communication gap between citizens and Member of Parliament offices to guarantee objective constituency funding.
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 font-bold font-mono">1</div>
                      <p>
                        <strong className="text-slate-800 block">Write or Speak in Dialect</strong>
                        Use colloquial terms or native slangs (Tamil/Hindi). The Gemini NLP model abstracts exact physical needs.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-50 text-orange-800 flex items-center justify-center shrink-0 font-bold font-mono">2</div>
                      <p>
                        <strong className="text-slate-800 block">Civic Proof Formula</strong>
                        Priority calculations are made entirely via mathematical rules, preventing administrative bias.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold font-mono">3</div>
                      <p>
                        <strong className="text-slate-800 block">Ward Verifiers</strong>
                        Local verifiers certify site realities, raising transparency and lowering duplicate spoofing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Help Desk</span>
                  <span className="text-xs text-slate-700 block font-bold">Madurai MP Planning Office</span>
                  <span className="text-[10px] text-slate-500 block font-semibold">Toll-free grievance pipeline open 24/7.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
