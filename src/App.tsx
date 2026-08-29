/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  Activity, 
  Heart, 
  TrendingUp, 
  History, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Lock, 
  Unlock, 
  Scale, 
  User, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Flame, 
  Apple, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  Info,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { UnitSystem, BmiRecord, Product } from "./types";

// Seed data for the history chart to make the premium experience shine instantly
const DEFAULT_HISTORY_RECORDS: BmiRecord[] = [
  { id: "h1", date: "2026-03-10", weight: 82, height: 178, unitSystem: "metric", bmi: 25.9, category: "Overweight" },
  { id: "h2", date: "2026-04-12", weight: 79.5, height: 178, unitSystem: "metric", bmi: 25.1, category: "Overweight" },
  { id: "h3", date: "2026-05-15", weight: 77, height: 178, unitSystem: "metric", bmi: 24.3, category: "Normal Weight" },
  { id: "h4", date: "2026-06-13", weight: 76.2, height: 178, unitSystem: "metric", bmi: 24.0, category: "Normal Weight" }
];

export default function App() {
  // Input form state
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [weight, setWeight] = useState<number>(75); // kg or lbs
  const [height, setHeight] = useState<number>(178); // cm or inches
  
  // Custom height separate states for Imperial (Feet and Inches)
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(10);

  // Demographics details for personalized value
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<string>("male");
  const [activityLevel, setActivityLevel] = useState<string>("moderately_active");
  const [goal, setGoal] = useState<string>("maintain");
  const [dietaryPreference, setDietaryPreference] = useState<string>("none");

  // Premium / Monetization States
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bmi_service_pro");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  
  // PayPal checkout integration states
  const [isSimulatingPayPal, setIsSimulatingPayPal] = useState<boolean>(false);
  const [payPalStep, setPayPalStep] = useState<"login" | "pay" | "processing" | "success">("login");
  const [payPalEmail, setPayPalEmail] = useState("aitbenmesszakaria-buyer@paypal.com");
  const [payPalPassword, setPayPalPassword] = useState("password123");
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // User account DB structure
  interface UserAccount {
    name: string;
    email: string;
    password?: string;
    isPro: boolean;
    history: BmiRecord[];
    recommendations?: { mealPlan: string; exercisePlan: string } | null;
  }

  // Simulated authentication database
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem("bmi_accounts");
      if (saved) return JSON.parse(saved);
      
      const seedAccounts: UserAccount[] = [
        {
          name: "Zachary Ait Benmess",
          email: "aitbenmesszakaria@gmail.com",
          password: "password123",
          isPro: false,
          history: []
        },
        {
          name: "Demo Subscriber",
          email: "demo@bmivitality.com",
          password: "demo",
          isPro: true,
          history: DEFAULT_HISTORY_RECORDS
        }
      ];
      localStorage.setItem("bmi_accounts", JSON.stringify(seedAccounts));
      return seedAccounts;
    } catch {
      return [];
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bmi_service_logged_in");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem("bmi_service_email") || "";
    } catch {
      return "";
    }
  });
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Navigation track
  const [activeTab, setActiveTab] = useState<"calculator" | "recommendations" | "history" | "gear">("calculator");

  // History logs state
  const [history, setHistory] = useState<BmiRecord[]>(() => {
    try {
      const saved = localStorage.getItem("bmi_service_history");
      if (saved) return JSON.parse(saved);
      return DEFAULT_HISTORY_RECORDS;
    } catch {
      return DEFAULT_HISTORY_RECORDS;
    }
  });

  // Dynamic affiliate products state
  const [trackers, setTrackers] = useState<Product[]>([]);
  const [supplements, setSupplements] = useState<Product[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);

  // Gemini recommended diet & workout plans state
  const [recommendations, setRecommendations] = useState<{ mealPlan: string; exercisePlan: string } | null>(() => {
    try {
      const saved = localStorage.getItem("bmi_service_recommendations");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Log calculation trigger helper
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  // Standardize height state based on unit conversions
  useEffect(() => {
    if (unitSystem === "metric") {
      // Convert imperial back to metric
      const totalInches = (heightFeet * 12) + heightInches;
      const calculatedCm = Math.round(totalInches * 2.54);
      setHeight(calculatedCm || 178);
      
      const calculatedKg = Math.round(weight * 0.45359237);
      setWeight(calculatedKg || 75);
    } else {
      // Convert metric to imperial
      const totalInches = height / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inc = Math.round(totalInches % 12);
      setHeightFeet(ft || 5);
      setHeightInches(inc || 10);

      const calculatedLbs = Math.round(weight / 0.45359237);
      setWeight(calculatedLbs || 165);
    }
  }, [unitSystem]);

  // Sync state modifications with localStorage
  useEffect(() => {
    localStorage.setItem("bmi_service_pro", JSON.stringify(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem("bmi_service_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (recommendations) {
      localStorage.setItem("bmi_service_recommendations", JSON.stringify(recommendations));
    }
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem("bmi_service_logged_in", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("bmi_service_email", userEmail);
  }, [userEmail]);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    const targetEmail = signInEmail.trim();
    const targetPassword = signInPassword.trim();
    
    if (!targetEmail) {
      triggerFeedback("Please provide an email address.");
      return;
    }

    const matchedAccount = accounts.find(
      acc => acc.email.toLowerCase() === targetEmail.toLowerCase()
    );
    
    if (!matchedAccount) {
      triggerFeedback("Account not found. Please register a new account!");
      setAuthMode("signup");
      setSignUpEmail(signInEmail);
      return;
    }
    
    if (matchedAccount.password !== targetPassword) {
      triggerFeedback("Incorrect password. Please try again.");
      return;
    }
    
    setIsLoggedIn(true);
    setUserEmail(matchedAccount.email);
    setIsPro(matchedAccount.isPro);
    setHistory(matchedAccount.history && matchedAccount.history.length > 0 ? matchedAccount.history : []);
    setRecommendations(matchedAccount.recommendations || null);
    setShowSignInModal(false);
    triggerFeedback(`Welcome back, ${matchedAccount.name || matchedAccount.email}! Profile synced successfully.`);
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    const targetEmail = signUpEmail.trim();
    const targetPassword = signUpPassword.trim();
    const targetName = signUpName.trim();
    
    if (!targetEmail || !targetPassword || !targetName) {
      triggerFeedback("Please fill out all required fields.");
      return;
    }
    
    if (accounts.some(acc => acc.email.toLowerCase() === targetEmail.toLowerCase())) {
      triggerFeedback("An account with this email already exists. Please sign in.");
      setAuthMode("signin");
      setSignInEmail(signUpEmail);
      return;
    }
    
    const newAccount: UserAccount = {
      name: targetName,
      email: targetEmail,
      password: targetPassword,
      isPro: false,
      history: [],
      recommendations: null
    };
    
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem("bmi_accounts", JSON.stringify(updatedAccounts));
    
    setIsLoggedIn(true);
    setUserEmail(targetEmail);
    setIsPro(false);
    setHistory([]);
    setRecommendations(null);
    setShowSignInModal(false);
    
    triggerFeedback(`Welcome, ${targetName}! Your personal profile is active.`);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setIsPro(false);
    setHistory(DEFAULT_HISTORY_RECORDS);
    setRecommendations(null);
    triggerFeedback("Signed out successfully. Switched to guest profile.");
  };

  // Automatically sync profile changes back to our accounts database
  useEffect(() => {
    if (isLoggedIn && userEmail) {
      setAccounts(prev => {
        const index = prev.findIndex(acc => acc.email.toLowerCase() === userEmail.toLowerCase());
        if (index === -1) return prev;
        
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          isPro: isPro,
          history: history,
          recommendations: recommendations
        };
        localStorage.setItem("bmi_accounts", JSON.stringify(updated));
        return updated;
      });
    }
  }, [history, isPro, recommendations, isLoggedIn, userEmail]);

  // Fetch Affiliate Insights from node backend on start
  useEffect(() => {
    async function loadInsights() {
      setIsLoadingInsights(true);
      try {
        const res = await fetch("/api/health-insights");
        if (res.ok) {
          const data = await res.json();
          setTrackers(data.trackers || []);
          setSupplements(data.supplements || []);
        }
      } catch (err) {
        console.error("Error loading marketplace updates", err);
      } finally {
        setIsLoadingInsights(false);
      }
    }
    loadInsights();
  }, []);

  // Compute calculated BMI score
  const calculateBmi = (): number => {
    let actualHeightMeters = 0;
    let actualWeightKg = 0;

    if (unitSystem === "metric") {
      actualHeightMeters = height / 100;
      actualWeightKg = weight;
    } else {
      const totalInches = (heightFeet * 12) + heightInches;
      actualHeightMeters = (totalInches * 2.54) / 100;
      actualWeightKg = weight * 0.45359237;
    }

    if (actualHeightMeters <= 0 || actualWeightKg <= 0) return 0;
    const rawBmi = actualWeightKg / (actualHeightMeters * actualHeightMeters);
    return Math.round(rawBmi * 10) / 10;
  };

  const bmiScore = calculateBmi();

  // Get classification details
  interface Classification {
    category: "Underweight" | "Normal Weight" | "Overweight" | "Obese";
    colorClass: string;
    bgClass: string;
    borderClass: string;
    indicatorLeft: string; // spacing percentage on custom health spectrum
    description: string;
    healthTargetAdvice: string;
  }

  const getBmiClassification = (score: number): Classification => {
    if (score < 18.5) {
      return {
        category: "Underweight",
        colorClass: "text-amber-500",
        bgClass: "bg-amber-50/70",
        borderClass: "border-amber-200",
        indicatorLeft: `${(score / 40) * 100}%`,
        description: "Your BMI score indicates you are below the recommended healthy boundary. Increasing calorie intake with nutrient-dense meals and mild resistance training is suggested.",
        healthTargetAdvice: "Focus on gentle calorie surplus with clean lean proteins, heart-healthy fats, and full grain complex carbohydrates."
      };
    } else if (score >= 18.5 && score < 25.0) {
      return {
        category: "Normal Weight",
        colorClass: "text-emerald-600",
        bgClass: "bg-emerald-50/70",
        borderClass: "border-emerald-200",
        indicatorLeft: `${(score / 40) * 100}%`,
        description: "Excellent work! Your BMI sits comfortably in the optimal medical parameters. Retain your baseline habits with dynamic nutrition and physical activity.",
        healthTargetAdvice: "Perfect maintenance! Emphasize dietary variety, quality sleep patterns, and consistent fitness activities."
      };
    } else if (score >= 25.0 && score < 30.0) {
      return {
        category: "Overweight",
        colorClass: "text-orange-500",
        bgClass: "bg-orange-50/70",
        borderClass: "border-orange-200",
        indicatorLeft: `${(score / 40) * 100}%`,
        description: "Your BMI is slightly elevated. A balanced calorie deficit, combined with active cardiovascular cardio exercises, can efficiently assist weight management goals.",
        healthTargetAdvice: "A mild daily energy deficit (300-500 kcal) integrated with structural physical resistance and aerobic activity."
      };
    } else {
      return {
        category: "Obese",
        colorClass: "text-rose-600",
        bgClass: "bg-rose-50/70",
        borderClass: "border-rose-200",
        indicatorLeft: `${Math.min((score / 40) * 100, 95)}%`,
        description: "Your health indicators reveal obesity levels. Taking active measures for sustained health such as personalized diet adjustments can lower risks of health complexities.",
        healthTargetAdvice: "Strategic lifestyle changes, persistent strength patterns, caloric control, and regular tracking."
      };
    }
  };

  const status = getBmiClassification(bmiScore);

  // Ideal weight brackets for their height
  const getIdealWeightRange = () => {
    let heightMeter = 0;
    if (unitSystem === "metric") {
      heightMeter = height / 100;
    } else {
      const inches = (heightFeet * 12) + heightInches;
      heightMeter = (inches * 2.54) / 100;
    }

    const minWeightKg = 18.5 * (heightMeter * heightMeter);
    const maxWeightKg = 24.9 * (heightMeter * heightMeter);

    if (unitSystem === "metric") {
      return {
        min: `${Math.round(minWeightKg)} kg`,
        max: `${Math.round(maxWeightKg)} kg`,
        unit: "kg",
        text: `Your medically optimal weight spectrum is between ${Math.round(minWeightKg)} kg and ${Math.round(maxWeightKg)} kg.`
      };
    } else {
      const minLbs = minWeightKg / 0.45359237;
      const maxLbs = maxWeightKg / 0.45359237;
      return {
        min: `${Math.round(minLbs)} lbs`,
        max: `${Math.round(maxLbs)} lbs`,
        unit: "lbs",
        text: `Your medically optimal weight spectrum is between ${Math.round(minLbs)} lbs and ${Math.round(maxLbs)} lbs.`
      };
    }
  };

  const idealWeight = getIdealWeightRange();

  // Save current record to progress logs (Pro state only, or alert trigger)
  const handleSaveRecord = () => {
    if (!isPro) {
      setIsUpgrading(true);
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];
    const newRecord: BmiRecord = {
      id: Math.random().toString(36).substring(2, 9),
      date: todayString,
      weight: weight,
      height: unitSystem === "metric" ? height : (heightFeet * 12) + heightInches,
      unitSystem: unitSystem,
      bmi: bmiScore,
      category: status.category,
      age: age,
      gender: gender,
      goal: goal
    };

    setHistory(prev => [newRecord, ...prev]);
    triggerFeedback("Record saved to weight progression tracker successfully!");
  };

  // Delete logged item
  const handleDeleteRecord = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
    triggerFeedback("Activity report deleted.");
  };

  // Helper trigger action notification
  const triggerFeedback = (msg: string) => {
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4500);
  };

  // Trigger simulated PayPal portal
  const handleTriggerSimulatedPayPal = () => {
    setPayPalStep("login");
    setIsSimulatingPayPal(true);
  };

  const handleSimulatedPayPalSuccess = () => {
    setIsPro(true);
    setIsUpgrading(false);
    setIsSimulatingPayPal(false);
    triggerFeedback("Premium Health Pro Unlocked! Thank you for subscribing.");
    if (history.length === 0) {
      setHistory(DEFAULT_HISTORY_RECORDS);
    }
    setActiveTab("recommendations");
  };

  // Load official PayPal script
  useEffect(() => {
    if (!isUpgrading) return;

    // Check if script is already present
    const existingScript = document.getElementById("paypal-sdk-script");
    if (existingScript) {
      setSdkLoaded(true);
      renderPayPalButtons();
      return;
    }

    const clientId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || "test";
    const script = document.createElement("script");
    script.id = "paypal-sdk-script";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
      renderPayPalButtons();
    };
    script.onerror = () => {
      console.warn("Failed to load PayPal JS SDK. Using robust in-app sandbox gateway.");
      setSdkLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up buttons container on unmount/close
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
    };
  }, [isUpgrading]);

  const renderPayPalButtons = () => {
    // Wait for the container to become available in DOM
    setTimeout(() => {
      const container = document.getElementById("paypal-button-container");
      if (!container) return;
      container.innerHTML = ""; // Clear existing

      const win = window as any;
      if (win.paypal && win.paypal.Buttons) {
        try {
          win.paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: "USD",
                    value: "2.00"
                  },
                  description: "Vitality Pro Biometric Subscription ($2/mo)"
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              const details = await actions.order.capture();
              const payerName = details.payer?.name?.given_name || "Subscriber";
              
              setIsPro(true);
              setIsUpgrading(false);
              triggerFeedback(`Welcome ${payerName}! Premium Health Pro is fully active via PayPal.`);
              if (history.length === 0) {
                setHistory(DEFAULT_HISTORY_RECORDS);
              }
              setActiveTab("recommendations");
            },
            onError: (err: any) => {
              console.error("PayPal Smart Button Error:", err);
              triggerFeedback("PayPal payment was interrupted. Try Sandbox Quick Pass for instant access.");
            }
          }).render("#paypal-button-container");
        } catch (err) {
          console.error("PayPal Buttons Render Error:", err);
        }
      }
    }, 150);
  };

  // Mock form submission fallback
  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleTriggerSimulatedPayPal();
  };

  // Call Gemini API dynamically to fetch professional advice
  const handleGenerateAIRecommendations = async () => {
    if (!isPro) {
      setIsUpgrading(true);
      return;
    }

    setIsGenerating(true);
    setRecommendationError(null);

    try {
      const preciseHeight = unitSystem === "metric" ? height : (heightFeet * 12) + heightInches;
      const parsedGoalText = 
        goal === "lose" ? "Healthy weight loss" : 
        goal === "gain" ? "Lean muscle mass gain" : "Caloric maintenance and core fitness";

      const bodyData = {
        bmi: bmiScore,
        category: status.category,
        height: preciseHeight,
        weight: weight,
        unitSystem: unitSystem,
        age: age,
        gender: gender,
        activityLevel: activityLevel.replace("_", " "),
        goal: parsedGoalText,
        dietaryPreference: dietaryPreference || "None"
      };

      const res = await fetch("/api/generate-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        throw new Error("Could not initialize request. Please verify connection and retry.");
      }

      const data = await res.json();
      setRecommendations({
        mealPlan: data.mealPlan || "Error parsing nutrition guideline.",
        exercisePlan: data.exercisePlan || "Error parsing structural workout calendar."
      });
      triggerFeedback("A.I. Health plans successfully calibrated!");
    } catch (err: any) {
      console.error(err);
      setRecommendationError(err.message || "Something went wrong while connecting with Gemini API services.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Lightweight Parser for Markdown text components
  const renderFormattedMarkdown = (markdown: string) => {
    if (!markdown) return null;
    const lines = markdown.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Header H3
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-base font-semibold text-slate-800 font-display mt-4 mb-2 flex items-center gap-1.5 border-b pb-1">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-sm inline-block"></span>
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      // Header H2
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-slate-900 font-display mt-5 mb-2.5">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      // Header H1
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-xl font-bold text-slate-950 font-display mt-6 mb-3 border-l-4 border-indigo-600 pl-3">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }
      // Bullet items
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const textOnly = trimmed.replace(/^[\s*-*]+/, "").trim();
        // Parse bold segments
        return (
          <li key={idx} className="ml-5 list-disc text-slate-600 mb-1 leading-relaxed text-sm">
            {parseBoldMarkers(textOnly)}
          </li>
        );
      }
      // Number items
      if (/^\s*\d+\./.test(trimmed)) {
        const textOnly = trimmed.replace(/^\s*\d+\.\s*/, "").trim();
        return (
          <li key={idx} className="ml-5 list-decimal text-slate-600 mb-1 leading-relaxed text-sm">
            {parseBoldMarkers(textOnly)}
          </li>
        );
      }

      // Ordinary paragraphs
      return (
        <p key={idx} className="text-slate-600 text-sm leading-relaxed mb-2.5">
          {parseBoldMarkers(trimmed)}
        </p>
      );
    });
  };

  // Supporting dynamic **bolding** inside custom renderer
  const parseBoldMarkers = (sentence: string) => {
    const segments = sentence.split(/\*\*(.*?)\*\*/g);
    return segments.map((seg, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold text-slate-950">{seg}</strong>;
      }
      return seg;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Toast Feedback Notification */}
      {successNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 border border-slate-700/50 max-w-sm animate-bounce" id="toast-success">
          <div className="p-1 bg-emerald-500 rounded-full text-slate-900">
            <Check size={16} strokeWidth={3} />
          </div>
          <p className="text-xs font-medium text-slate-200">{successNotification}</p>
        </div>
      )}

      {/* Fully Functional Account Access (Sign In / Sign Up) Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="signin-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative">
            <button 
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition-colors font-semibold z-10"
              aria-label="Close dialog"
            >
              ✕
            </button>

            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6 text-white relative">
              <div className="absolute top-4 left-6 px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700 text-[10px] font-mono tracking-wider flex items-center gap-1 font-semibold uppercase">
                <User size={10} className="text-indigo-400" /> Account Access
              </div>
              <h3 className="text-xl font-bold font-display mt-4">
                {authMode === "signin" ? "Welcome Back to Vitality" : "Create Your Health Profile"}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {authMode === "signin" 
                  ? "Log in to synchronize your weight progress tracker logs, custom health routines, and premium benefits seamlessly." 
                  : "Register a free account to log weight targets, map BMI indicators, and back up your bio-metrics securely."
                }
              </p>

              {/* Tab Selector */}
              <div className="flex gap-2 mt-4 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    authMode === "signin" 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    authMode === "signup" 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {authMode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. demo@bmivitality.com" 
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-800 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Info size={12} /> Subscriber Information:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-indigo-700">
                      <li>Use <strong className="font-mono text-indigo-900">demo@bmivitality.com</strong> (password: <strong className="font-mono text-indigo-900">demo</strong>) to restore $2/mo Pro status!</li>
                      <li>Use your email <strong className="font-mono text-indigo-900">aitbenmesszakaria@gmail.com</strong> (password: <strong className="font-mono text-indigo-900">password123</strong>) to access your user workspace!</li>
                    </ul>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md mt-2 cursor-pointer"
                  >
                    <Unlock size={14} /> Synchronize Profile
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Zachary Ait Benmess" 
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. yourname@example.com" 
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <input 
                      type="password" 
                      placeholder="Create security password" 
                      required
                      minLength={4}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md mt-2 cursor-pointer"
                  >
                    <Check size={14} /> Register & Sign In
                  </button>
                </form>
              )}

              <div className="text-center pt-1 border-t border-slate-100 mt-2">
                {authMode === "signin" ? (
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Don't have an account? <span className="underline">Create one for free</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode("signin")}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Already registered? <span className="underline">Sign in here</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {isUpgrading && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="upgrade-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative">
            <button 
              onClick={() => setIsUpgrading(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <Trash2 size={16} className="rotate-45" /> {/* Close cross utility */}
            </button>

            {/* Modal Heading Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 text-white relative">
              <div className="absolute top-4 left-6 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-[10px] font-mono tracking-wider flex items-center gap-1 font-semibold uppercase">
                <Sparkle size={10} className="text-indigo-400" /> Premium Access
              </div>
              <h3 className="text-xl font-bold font-display mt-4">Elevate Your Health Journey</h3>
              <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                Supercharge your physical wellness metrics with doctor-formulated intelligence and progress history graphs.
              </p>
              
              <div className="mt-4 flex items-baseline gap-2 bg-indigo-950/60 p-3 rounded-lg border border-indigo-900/50">
                <span className="text-3xl font-bold text-white font-mono">$2</span>
                <span className="text-xs text-indigo-300">/ month</span>
                <span className="ml-auto text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Benefit bullet lists */}
            <div className="p-6 space-y-4">
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="p-0.5 bg-emerald-50 text-emerald-600 rounded-full mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span><strong>AI meal and workout plans</strong> calibrated specifically to your age, goal, gender, activity levels, and dietary habits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="p-0.5 bg-emerald-50 text-emerald-600 rounded-full mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span><strong>Unlimited lifestyle trend charting</strong> using multi-dimensional timeline graphs and history logs to track exact biological changes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="p-0.5 bg-emerald-50 text-emerald-600 rounded-full mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Priority access to customized macronutrient balances and supplement checklists.</span>
                </li>
              </ul>

              {/* Real PayPal Buttons & Sandbox Fallback */}
              <div className="mt-4 border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                    Secure PayPal Checkout
                  </h4>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold border border-indigo-100 flex items-center gap-1 font-mono">
                    🔒 $2.00 USD
                  </span>
                </div>

                {/* PayPal Container for official buttons */}
                <div className="space-y-3">
                  <div id="paypal-button-container" className="w-full min-h-[44px] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                    <p className="text-[11px] text-slate-400 font-medium">Loading PayPal Smart Buttons...</p>
                  </div>

                  {/* Sandbox Developer Bypass */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono uppercase font-semibold">Or sandbox pass</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerSimulatedPayPal}
                    className="w-full bg-[#ffc439] hover:bg-[#f4b31a] text-[#003087] rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm border border-[#eed082] cursor-pointer"
                  >
                    <span className="font-mono italic tracking-tight font-extrabold text-[14px]">PayPal</span>
                    <span className="text-[11px] font-semibold bg-white/40 px-2 py-0.5 rounded text-[#003087]">Sandbox Quick Pass</span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 mt-3 leading-relaxed">
                🔒 Fully functional PayPal checkout. Set <code className="font-mono bg-slate-100 px-1 rounded text-slate-600">VITE_PAYPAL_CLIENT_ID</code> in environment variables to link your live merchant account. If inside an iframe sandbox, use <strong>Quick Pass</strong> for immediate completion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulated PayPal Sandbox Gateway Modal Overlay */}
      {isSimulatingPayPal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="paypal-sandbox-modal">
          <div className="bg-[#f5f7fa] rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative font-sans">
            
            {/* Header branding */}
            <div className="bg-[#003087] p-5 text-white flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <span className="font-mono italic font-black text-2xl tracking-tight text-white select-none">
                  PayPal <span className="text-[#009cde]">Sandbox</span>
                </span>
              </div>
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Secure Connection
              </div>
              
              <button 
                onClick={() => setIsSimulatingPayPal(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Cancel PayPal Session"
              >
                ✕
              </button>
            </div>

            {/* Merchant Details Bar */}
            <div className="bg-[#eef2f7] px-6 py-3 border-b border-slate-200 flex justify-between items-center text-xs text-slate-700">
              <span className="font-semibold flex items-center gap-1.5">
                <Scale size={13} className="text-indigo-600" /> BMI Vitality Service
              </span>
              <span className="font-mono text-slate-900 font-bold">$2.00 USD</span>
            </div>

            <div className="p-6">
              {/* Step 1: PayPal Login */}
              {payPalStep === "login" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-slate-800">Pay with PayPal</h4>
                    <p className="text-xs text-slate-500 mt-1">Enter your sandbox account credentials to approve the subscription</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPayPalStep("processing");
                      setTimeout(() => setPayPalStep("pay"), 1200);
                    }} 
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sandbox Buyer Email</label>
                      <input 
                        type="email" 
                        required
                        value={payPalEmail}
                        onChange={(e) => setPayPalEmail(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0070ba] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={payPalPassword}
                        onChange={(e) => setPayPalPassword(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#0070ba] font-mono"
                      />
                    </div>

                    <div className="p-2.5 bg-[#fff9e6] rounded-lg border border-[#f5e0a0] text-[10px] text-amber-800 leading-relaxed flex gap-2">
                      <span className="text-amber-600 font-bold">ℹ</span>
                      <span>This is a pre-configured buyer profile with a sandbox balance of <strong>$150.00 USD</strong>. Click below to continue.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
                    >
                      Log In to PayPal Account
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Payment Review & Approval */}
              {payPalStep === "pay" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase font-mono">Review Your Subscription</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-800 font-semibold">Vitality Pro Monthly Biometrics</span>
                      <span className="text-xs font-mono font-bold text-slate-900">$2.00 USD / mo</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Paying From:</span>
                      <span className="font-semibold text-slate-800">PayPal Wallet Balance</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Available Balance:</span>
                      <span className="font-mono text-emerald-600 font-bold">$150.00 USD</span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t pt-2">
                      <span>Recipient:</span>
                      <span className="font-semibold text-slate-800">BMI Vitality LLC</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-bold text-sm border-t border-dashed border-slate-200 pt-2.5">
                      <span>Total Due Today:</span>
                      <span className="font-mono text-[#003087]">$2.00 USD</span>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-2.5 rounded-lg text-[10px] text-slate-500 leading-relaxed">
                    By clicking "Complete Purchase", you authorize a recurring sandbox payment of $2.00 USD each month to BMI Vitality. You can cancel this test plan at any time.
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPayPalStep("login")}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayPalStep("processing");
                        setTimeout(() => setPayPalStep("success"), 1500);
                      }}
                      className="flex-2 bg-[#ffc439] hover:bg-[#f4b31a] text-[#003087] py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Complete Purchase
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Processing loading state */}
              {payPalStep === "processing" && (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Processing PayPal Authorization</h4>
                    <p className="text-xs text-slate-500 mt-1">Securing token and logging sandbox transaction receipt...</p>
                  </div>
                </div>
              )}

              {/* Step 4: Success confirmation screen */}
              {payPalStep === "success" && (
                <div className="py-2 text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border-2 border-emerald-500/20">
                    <Check size={32} strokeWidth={3} className="animate-pulse" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-800">Payment Approved!</h4>
                    <p className="text-xs text-slate-500 mt-1">Your sandbox account was charged successfully.</p>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1.5 text-left font-mono text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Status:</span>
                      <span className="text-emerald-600 font-bold uppercase">COMPLETED</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Trans ID:</span>
                      <span className="text-slate-700 font-semibold">TX-PAYPAL-{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Charge:</span>
                      <span className="text-slate-800 font-bold">$2.00 USD</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatedPayPalSuccess}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Return to Vitality Pro & Unlock Plans
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-xs shadow-indigo-500/20">
                <Scale size={20} className="animate-pulse" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 font-display tracking-tight flex items-center gap-1.5">
                  BMI Vitality
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">Clinical Grade Metrics</span>
              </div>
            </div>

            {/* Centered Tab Links (Responsive) */}
            <nav className="hidden md:flex space-x-1" aria-label="Main Navigation">
              <button 
                onClick={() => setActiveTab("calculator")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "calculator" 
                    ? "bg-slate-100/80 text-slate-900 font-semibold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Activity size={14} /> Calculator
              </button>
              <button 
                onClick={() => setActiveTab("recommendations")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "recommendations" 
                    ? "bg-slate-100/80 text-slate-900 font-semibold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Sparkles size={14} /> AI Health Planner
                {!isPro && <Lock size={10} className="text-slate-400 inline" />}
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "history" 
                    ? "bg-slate-100/80 text-slate-900 font-semibold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <History size={14} /> Progress Chart
                {!isPro && <Lock size={10} className="text-slate-400 inline" />}
              </button>
              <button 
                onClick={() => setActiveTab("gear")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "gear" 
                    ? "bg-slate-100/80 text-slate-900 font-semibold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <ShoppingBag size={14} /> Recommended Gear
              </button>
            </nav>

            {/* Premium Membership Status Badges / CTA */}
            <div className="flex items-center gap-2">
              {/* Account sign-in indicators */}
              {isLoggedIn ? (
                <div className="hidden lg:flex items-center gap-2 mr-1">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Signed in as <span className="font-semibold text-slate-800">{userEmail}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    id="btn-sign-out"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-nav-sign-in"
                >
                  <User size={13} className="text-slate-500" />
                  <span>Sign In</span>
                </button>
              )}

              {isPro ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                  <Sparkles size={12} className="text-emerald-600 fill-emerald-200" />
                  <span>Pro Member</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsUpgrading(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  id="btn-upgrade-nav"
                >
                  <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                  <span>Upgrade to Pro</span>
                </button>
              )}

              {/* Dev simulation utility toggle */}
              <button 
                onClick={() => {
                  setIsPro(!isPro);
                  triggerFeedback(isPro ? "Reverted back to free testing mode." : "Simulated Pro License unlock!");
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1 font-mono text-slate-500 rounded-sm cursor-pointer"
                title="Simulation Toggle (Pro / Free) for testing purposes"
                id="dev-toggle-pro"
              >
                {isPro ? "Reset Free" : "Sim Pro"}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Subnavigation bar for mobile view only */}
      <div className="md:hidden bg-white border-b border-slate-200 flex overflow-x-auto justify-start py-2.5 px-4 gap-1.5" aria-label="Mobile Navigation">
        <button 
          onClick={() => setActiveTab("calculator")}
          className={`flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "calculator" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Calculator
        </button>
        <button 
          onClick={() => setActiveTab("recommendations")}
          className={`flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === "recommendations" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          AI Health Planner {!isPro && <Lock size={10} className="text-slate-400" />}
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === "history" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Progress Chart {!isPro && <Lock size={10} className="text-slate-400" />}
        </button>
        <button 
          onClick={() => setActiveTab("gear")}
          className={`flex-none text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "gear" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Gear Store
        </button>
      </div>

      {/* Mobile Account Details */}
      {isLoggedIn ? (
        <div className="md:hidden bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xs text-slate-600" id="mobile-signed-info">
          <span className="truncate">👤 Signed in: <strong className="text-slate-800 font-semibold">{userEmail}</strong></span>
          <button
            onClick={handleSignOut}
            className="text-[10px] text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-100 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="md:hidden bg-indigo-50/50 border-b border-indigo-100 px-4 py-2 flex justify-between items-center text-xs" id="mobile-anonymous-info">
          <span className="text-slate-500">Already a subscriber?</span>
          <button
            onClick={() => setShowSignInModal(true)}
            className="text-xs text-indigo-600 font-bold hover:underline py-0.5 cursor-pointer"
          >
            Sign In here
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* FREE PROMO BANNER IF UNIPRO */}
        {!isPro && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-indigo-400/20 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none transform translate-x-1/4 select-none">
              <Scale size={240} className="text-indigo-200" />
            </div>
            <div className="z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/35 px-2.5 py-0.5 rounded-full text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
                <Sparkle size={10} className="fill-amber-300" /> Value Offer
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display leading-tight">Unlock AI Meal & Workout Routines + Save History</h2>
              <p className="text-xs text-indigo-100 leading-relaxed mt-1">
                Upgrade for just <strong className="text-white">$2/month</strong> to record continuous BMI health changes over time, view trend comparisons, and generate custom diet programs mapped to your daily habits.
              </p>
            </div>
            <button
              onClick={() => setIsUpgrading(true)}
              className="z-10 bg-white text-indigo-900 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-lg flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              Sign Up For $2/mo <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Dynamic Inner Tab Rendering */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="calc-layout-grid">
            
            {/* Input fields column */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
              
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <Scale size={18} className="text-indigo-600 font-semibold" /> Personal Assessment
                </h2>
                
                {/* Metric / Imperial toggle */}
                <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200" role="group" aria-label="Unit System Settings">
                  <button
                    onClick={() => setUnitSystem("metric")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      unitSystem === "metric" ? "bg-white text-slate-800 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Metric (cm/kg)
                  </button>
                  <button
                    onClick={() => setUnitSystem("imperial")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      unitSystem === "imperial" ? "bg-white text-slate-800 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Imperial (in/lbs)
                  </button>
                </div>
              </div>

              {/* Weight inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">Body Weight</label>
                  <div className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                    {weight} {unitSystem === "metric" ? "kg" : "lbs"}
                  </div>
                </div>
                
                <input 
                  type="range" 
                  min={unitSystem === "metric" ? "30" : "66"}
                  max={unitSystem === "metric" ? "180" : "400"}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-fullaccent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />

                {/* Direct text input alternative */}
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="1"
                    value={weight || ""}
                    onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 pr-10 focus:outline-hidden focus:border-indigo-500"
                    placeholder="Enter explicit weight"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold uppercase">
                    {unitSystem === "metric" ? "kg" : "lbs"}
                  </span>
                </div>
              </div>

              {/* Height Inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">Height</label>
                  <div className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                    {unitSystem === "metric" 
                      ? `${height} cm` 
                      : `${heightFeet} ft ${heightInches} in`
                    }
                  </div>
                </div>

                {unitSystem === "metric" ? (
                  <>
                    <input 
                      type="range" 
                      min="100" 
                      max="220" 
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                    />
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="1"
                        value={height || ""}
                        onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 pr-10 focus:outline-hidden focus:border-indigo-500"
                        placeholder="Enter explicit HEIGHT"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold text-mono">cm</span>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Feet</label>
                      <select 
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                      >
                        {[3, 4, 5, 6, 7, 8].map(ft => (
                          <option key={ft} value={ft}>{ft} ft</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Inches</label>
                      <select 
                        value={heightInches}
                        onChange={(e) => setHeightInches(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                      >
                        {Array.from({ length: 12 }).map((_, inIdx) => (
                          <option key={inIdx} value={inIdx}>{inIdx} in</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced metrics section for value-add suggestions */}
              <div className="border-t border-slate-100/80 pt-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Advanced Parameters (AI Calibrators)</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={age} 
                      onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weekly Fitness Goal</label>
                  <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="lose">Calorie Deficit (Weight Loss)</option>
                    <option value="maintain">Baseline Balance (Maintain Weight)</option>
                    <option value="gain">Calorie Surplus (Lean Weight Gain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Activity Tier</label>
                  <select 
                    value={activityLevel} 
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="sedentary">Sedentary (No formal workout, desk job)</option>
                    <option value="lightly_active">Light Active (1-2 days mild walks)</option>
                    <option value="moderately_active">Moderately Active (3-5 days gym workout)</option>
                    <option value="very_active">Highly Athletic (Daily intense training)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diet Preference</label>
                  <select 
                    value={dietaryPreference} 
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="none">Standard Mixed Diet</option>
                    <option value="vegan">Vegan / Strict Plant-Based</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="keto">Ketogenic (High Fat, Low Carb)</option>
                    <option value="gluten_free">Gluten Restricted</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Calculations Result Output */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* BMI score display card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  
                  {/* Score gauge circle component */}
                  <div className="relative flex-shrink-0 w-36 h-36 border-4 border-slate-100 rounded-full flex flex-col justify-center items-center shadow-inner">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">My Score</p>
                    <p className="text-4xl font-extrabold text-slate-900 font-mono mt-0.5 leading-none">{bmiScore}</p>
                    <div className="absolute inset-0 bg-indigo-500/3 rounded-full animate-pulse pointer-events-none"></div>
                  </div>

                  {/* Interpretation metadata content */}
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-bold font-mono">
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        bmiScore < 18.5 ? "bg-amber-400" : 
                        bmiScore < 25.0 ? "bg-emerald-500" : 
                        bmiScore < 30.0 ? "bg-orange-500" : "bg-rose-600"
                      }`} />
                      <span className={status.colorClass}>{status.category}</span>
                    </div>

                    <h3 className="text-lg font-bold font-display text-slate-900 leading-tight">Instant Assessment</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {status.description}
                    </p>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nutritional Goal Formulation</p>
                      <p className="text-xs text-slate-700 italic font-medium">{status.healthTargetAdvice}</p>
                    </div>
                  </div>

                </div>

                {/* Custom Spectrum horizontal visual progress bar slider */}
                <div className="mt-8 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                    <span>Underweight (15)</span>
                    <span>Healthy (18.5 - 24.9)</span>
                    <span>Overweight (25 - 29.9)</span>
                    <span>Obese (30+)</span>
                  </div>
                  
                  <div className="h-2.5 bg-slate-100 rounded-full relative overflow-visible flex">
                    <div className="h-full bg-amber-400/80 w-[25%] rounded-l-full" title="Underweight boundary" />
                    <div className="h-full bg-emerald-500/80 w-[30%]" title="Optimal baseline weight" />
                    <div className="h-full bg-orange-500/85 w-[20%]" title="Overweight risk factor" />
                    <div className="h-full bg-rose-600/85 w-[25%] rounded-r-full" title="Sustained Obesity category" />
                    
                    {/* The pointer pin specifying calculate relative position */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-950 border-2 border-white rounded-full shadow-md transition-all duration-300"
                      style={{ left: status.indicatorLeft }}
                      title={`Current Score Position: ${bmiScore}`}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>BMI &lt; 18.5</span>
                    <span>BMI 18.5 - 24.9</span>
                    <span>BMI 25 - 29.9</span>
                    <span>BMI 30+</span>
                  </div>
                </div>

              </div>

              {/* Perfect Weight Metrics Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">Target Body Weight Calibrator</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Calculated based on index heights of {unitSystem === "metric" ? `${height} cm` : `${heightFeet} ft ${heightInches} in`}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-emerald-100">
                    <Scale size={13} /> {idealWeight.min} - {idealWeight.max}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/40">
                  {idealWeight.text} Staying within these targets clinically decreases risks of type II diabetes and complex cardiac instances.
                </p>

                {/* Grid Comparison targets */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                    <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider font-mono block">Minimum Weight</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">{idealWeight.min}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(BMI 18.5)</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider font-mono block">Median Target</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                      {unitSystem === "metric" 
                        ? `${Math.round((parseInt(idealWeight.min) + parseInt(idealWeight.max)) / 2)} kg`
                        : `${Math.round((parseInt(idealWeight.min) + parseInt(idealWeight.max)) / 2)} lbs`
                      }
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(BMI 21.7)</span>
                  </div>
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-center">
                    <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wider font-mono block">Upper Limit</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-1">{idealWeight.max}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(BMI 24.9)</span>
                  </div>
                </div>

                {/* Free Action - Save current Assessment */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t">
                  <button 
                    onClick={handleSaveRecord}
                    className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl py-2 px-4 text-xs hover:bg-indigo-100/70 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} /> Log Metric to History
                  </button>
                  <button 
                    onClick={() => {
                      if (!isPro) {
                        setIsUpgrading(true);
                      } else {
                        setActiveTab("recommendations");
                        handleGenerateAIRecommendations();
                      }
                    }}
                    className="flex-1 bg-indigo-600 border border-indigo-500 text-white font-semibold rounded-xl py-2 px-4 text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Sparkles size={14} /> {isPro ? "Go Generate AI Meals" : "Unlock AI Diet Planner ($2)"}
                  </button>
                </div>
              </div>

            </div>

             {/* COMPREHENSIVE BIOMETRIC BLUEPRINT COMPARISON MODULE */}
             <div className="col-span-1 lg:col-span-12 mt-8 bg-white rounded-3xl border border-slate-250 shadow-xs overflow-hidden" id="subscription-comparison-block">
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/35 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                      <Sparkles size={12} className="text-amber-400 fill-amber-400" /> Subscription Tier Breakdown
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Unlock Your Full Biological Potential</h2>
                    <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
                      Upgrade to Pro for just <strong className="text-white">$2 / month</strong> to integrate custom clinician-formulated diet regimens, workout calendars, and continuous weight progressions.
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 flex items-baseline gap-2.5 self-stretch md:self-auto justify-center">
                    <span className="text-4xl font-extrabold text-white font-mono">$2</span>
                    <span className="text-xs text-slate-400">/ month</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Unlocks All Features
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  {/* Grid of detailed specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Free Card list */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-250">
                          <h3 className="text-base font-bold text-slate-800 font-display">Standard Free Tier</h3>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">Included</span>
                        </div>
                        <p className="text-xs text-slate-500 my-3 leading-relaxed">Essential calculated metrics to understand your baseline BMI parameters instantaneously.</p>
                        
                        <ul className="space-y-3 pt-1">
                          <li className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Calculated BMI Index:</strong> Instantly check current obesity/underweight categories.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Medically Optimal Target Bracket:</strong> View baseline healthy target weight limits for your height.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="p-0.5 bg-slate-200 text-slate-500 rounded-full mt-0.5 flex-shrink-0">
                              ✕
                            </span>
                            <span className="line-through">AI Diet blueprints and workout calendars tailored to you.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="p-0.5 bg-slate-200 text-slate-500 rounded-full mt-0.5 flex-shrink-0">
                              ✕
                            </span>
                            <span className="line-through">Multi-dimensional progression timeline charting and log tracking.</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] text-center text-slate-400 block pt-4 font-mono">No credit card required for free tools</span>
                    </div>

                    {/* Pro Card list */}
                    <div className="bg-indigo-50/45 rounded-2xl p-6 border border-indigo-150 flex flex-col justify-between space-y-4 relative">
                      {isPro && (
                        <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Check size={11} strokeWidth={3} /> Active Pro Plan
                        </span>
                      )}
                      <div>
                        <div className="flex justify-between items-center pb-3 border-b border-indigo-150">
                          <h3 className="text-base font-bold text-indigo-950 font-display flex items-center gap-1.5">
                            <Sparkles size={16} className="text-indigo-600" /> Biometric Pro Vitality
                          </h3>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">$2/mo</span>
                        </div>
                        <p className="text-xs text-indigo-900/70 my-3 leading-relaxed font-semibold">Doctor-formulated AI diet and health tracking to assist continuous weight loss or muscle building.</p>
                        
                        <ul className="space-y-3 pt-1">
                          <li className="flex items-start gap-2 text-xs text-indigo-950">
                            <span className="p-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Custom Gemini Diet routines:</strong> Tailored breakfast, midday, and dinner guides matching user's demographic criteria.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-indigo-950">
                            <span className="p-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Structured Exercise Planners:</strong> Cardio, strength, and dynamic active recovery schedules.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-indigo-950">
                            <span className="p-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Time-series Trend Tracking:</strong> Recharts line/area charts visualizing weight metrics sequentially.</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-indigo-950">
                            <span className="p-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-0.5 flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span><strong>Advanced Demographics Integration:</strong> Customized filters: Diet preferences (Vegan, Keto, Vegetarian, Gluten-Free) & Gym levels.</span>
                          </li>
                        </ul>
                      </div>
                      
                      {!isPro ? (
                        <button
                          onClick={() => setIsUpgrading(true)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-4 text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                        >
                          Unlock Pro Subscription ($2 / month)
                        </button>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1 mt-4">
                          <Check size={14} strokeWidth={3} /> Your active premium plan is loaded
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Specification Table Comparison */}
                  <div className="pt-6 border-t border-slate-100/90" id="plans-table-comparison">
                    <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider mb-4 text-center">Plan Capabilities Ledger</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 text-slate-600 font-semibold">Features Included</th>
                            <th className="p-3 text-slate-600 font-semibold text-center w-36">Standard Free</th>
                            <th className="p-3 text-slate-600 font-semibold text-center w-36 bg-indigo-50/25">Pro Premium ($2/mo)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Classic BMI score calculation and classification spectrum</td>
                            <td className="p-3 text-center text-emerald-600 font-semibold">✓ Included</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Included</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Medically optimal height-to-weight target reference borders</td>
                            <td className="p-3 text-center text-emerald-600 font-semibold">✓ Included</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Included</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Custom weight deficit guidance & caloric target updates</td>
                            <td className="p-3 text-center text-emerald-600 font-semibold">✓ Included</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Included</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">A.I. generated breakfast, lunch, and dinner meal schedules via Gemini</td>
                            <td className="p-3 text-center text-slate-400">✕ Locked</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Fully Enabled</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Dedicated weight fluctuation time-series area charts</td>
                            <td className="p-3 text-center text-slate-400">✕ Locked</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Fully Enabled</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Custom nutrition diets criteria (Vegan, Keto, Vegetarian, Gluten-Free)</td>
                            <td className="p-3 text-center text-slate-400">✕ Locked</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Fully Enabled</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-800">Durable cloud account backup and cross-device synchronize</td>
                            <td className="p-3 text-center text-slate-400">✕ Locked</td>
                            <td className="p-3 text-center text-indigo-600 bg-indigo-50/25 font-bold">✓ Fully Enabled</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-center pt-8">
                      {!isPro ? (
                        <div className="space-y-3">
                          <button
                            onClick={() => setIsUpgrading(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-8 text-xs font-bold transition-all shadow-md shadow-indigo-600/15 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            Activate Pro Membership Now - $2/mo <ArrowRight size={14} />
                          </button>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Already purchased? <button onClick={() => setShowSignInModal(true)} className="text-indigo-600 font-bold underline cursor-pointer">Sign In here</button> to restore your profile.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 inline-block text-xs text-emerald-800 font-semibold" id="subscriber-greetings">
                          🎉 Thank you for subscribing! Your active Pro Vitality features are fully unlocked across this device.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
        )}

        {/* Tab - Recommendations Content */}
        {activeTab === "recommendations" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6" id="recommendations-container">
            
            {/* Nav Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase">
                    Premium Integration
                  </div>
                  <span className="text-[11px] text-emerald-500 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> Gemini AI Calibrated
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display mt-1.5 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-600" /> Customized Diet & Action Plan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">High precision athletic schedules and nutritional balances calculated dynamically.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAIRecommendations}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isGenerating ? "Synthesizing Plan..." : recommendations ? "Recalibrate AI Blueprint" : "Generate Custom Routines"}
                  <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Error handling */}
            {recommendationError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Generation Constraint</p>
                  <p>{recommendationError}</p>
                </div>
              </div>
            )}

            {/* Free vs Pro conditional rendering */}
            {!isPro ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-4 max-w-xl mx-auto">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Lock size={22} className="stroke-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 font-display">Personalized Advisor Blocked</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    A.I. generated meal plans and workout regiments require an upgraded membership. Purchase subscription for only $2/month to continue.
                  </p>
                </div>
                <button
                  onClick={() => setIsUpgrading(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  Upgrade to Premium ($2) <Unlock size={14} />
                </button>
              </div>
            ) : isGenerating ? (
              <div className="space-y-6 py-12 text-center" id="ai-loading">
                <div className="relative inline-block">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Sparkles size={20} className="text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Calibrating Gemini Engine...</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Analyzing weight logs ({weight} {unitSystem === "metric" ? "kg" : "lbs"}), age ({age}), activity parameters, and medical goals to generate exact portioning guides.
                  </p>
                </div>
              </div>
            ) : recommendations ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="plans-rendered-columns">
                
                {/* Meal & Nutrition plan column */}
                <div className="bg-emerald-50/15 border border-emerald-500/10 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-500/10">
                    <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
                      <Apple size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-emerald-900">1. Personalized Meal Plan</h3>
                      <p className="text-[11px] text-emerald-600 font-medium">Daily macronutrient ratio targets based on age {age}</p>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none text-xs">
                    {renderFormattedMarkdown(recommendations.mealPlan)}
                  </div>
                </div>

                {/* Workout & Fitness Routine plan column */}
                <div className="bg-indigo-50/15 border border-indigo-500/10 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-500/10">
                    <div className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-indigo-900">2. Workout & Action Strategy</h3>
                      <p className="text-[11px] text-indigo-600/90 font-medium">Calibrated for {activityLevel.replace("_", " ")} routine</p>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none text-xs">
                    {renderFormattedMarkdown(recommendations.exercisePlan)}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 max-w-md mx-auto space-y-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-indigo-100">
                  <Sparkles size={24} className="animate-spin-slow" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 font-display">Generate Fresh Plans</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Prepare custom nutrition cards and specific exercise regimens mapped directly with your calculated parameters of {weight} {unitSystem === "metric" ? "kg" : "lbs"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAIRecommendations}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  Create Custom routines <Sparkles size={14} />
                </button>
              </div>
            )}

            {/* Medical warning / informational footers */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
              <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p>
                ⚠️ <strong>Clinical Disclaimer:</strong> The nutritional charts, portions, and advice formulated here are simulated indicators. A.I. outputs should be verified against registered healthcare consultants prior to engaging in strenuous training routines.
              </p>
            </div>

          </div>
        )}

        {/* Tab - Historical progression graphing */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6" id="history-dashboard-container">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" /> Bio-Metric Progression Chart
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Sustained tracking of weight coordinates and calculated classifications.</p>
              </div>

              {!isPro && (
                <span className="bg-indigo-50 border border-indigo-100 font-mono text-indigo-700 font-bold text-[10px] uppercase py-1 px-2.5 rounded-lg flex items-center gap-1 flex-shrink-0 animate-pulse">
                  <Lock size={10} /> Saved History Preview
                </span>
              )}
            </div>

            {/* Free Lock preview overlay */}
            {!isPro ? (
              <div className="relative">
                {/* Locked blur wall */}
                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 space-y-4">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-11 h-11 flex items-center justify-center mx-auto">
                      <Lock size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 font-display">Analytics Dashboard Locked</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        To save consecutive BMI metrics, draw trends, and assess monthly weight volatility, unlock Pro features today.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsUpgrading(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-semibold transition-colors shadow-md cursor-pointer"
                    >
                      Activate Pro for $2/mo
                    </button>
                  </div>
                </div>

                {/* Dummy background chart purely for preview illustration */}
                <div className="opacity-20 pointer-events-none space-y-4 filter blur-xs">
                  <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
                    [Preview Chart Area]
                  </div>
                  <div className="h-20 bg-slate-50 rounded-xl flex items-center justify-center">
                    [Preview Records Table]
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Chart Box via Recharts */}
                <div className="p-4 border-slate-100 border rounded-xl" id="weight-trend-canvas">
                  <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider mb-4">Baseline Trend Report</h3>
                  
                  {history.length === 0 ? (
                    <div className="h-64 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                      <Activity size={32} strokeWidth={1.5} className="animate-spin-slow" />
                      <p className="text-xs">No progression records registered yet. Generate a test metric above and hit "Log Metric to History" to seed chart parameters.</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={[...history].reverse()} // order earliest date first
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <YAxis 
                            domain={['dataMin - 5', 'dataMax + 5']} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                            itemStyle={{ color: '#818cf8' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="weight" 
                            name="Weight Registered" 
                            stroke="#4f46e5" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorBmi)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-center text-slate-400 leading-relaxed">
                    📈 The time-series chart traces body weight coordinates. Steady progressive decrements are healthier than hyper-rapid structural caloric loss.
                  </div>
                </div>

                {/* Tabular Lists for editing deleting */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Historical Logs ({history.length})</h3>
                  
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-200/40 text-center">Empty ledger logs.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead className="text-[10px] uppercase bg-slate-50/70 border border-slate-100 text-slate-500 font-mono tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Date Registered</th>
                            <th className="py-2.5 px-3">Weight Coord</th>
                            <th className="py-2.5 px-3">BMI Index</th>
                            <th className="py-2.5 px-3">Med Classification</th>
                            <th className="py-2.5 px-3 text-right">Utility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-semibold text-slate-900 font-mono">{record.date}</td>
                              <td className="py-3 px-3 font-medium text-slate-700">
                                {record.weight} {record.unitSystem === "metric" ? "kg" : "lbs"}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-800 font-mono">{record.bmi}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  record.bmi < 18.5 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                  record.bmi < 25.0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                  record.bmi < 30.0 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                                  "bg-rose-100 text-rose-700 border border-rose-200"
                                }`}>
                                  {record.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove metric logged"
                                  id={`remove-log-${record.id}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* Tab - Healthy Marketplace Gear supplements */}
        {activeTab === "gear" && (
          <div className="space-y-6" id="marketplace-hub">
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-2">
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-600" /> Healthy Living Affiliate Storefront
              </h2>
              <p className="text-xs text-slate-500">
                Enhance calibration accuracy with top-performing synchronized smart scales or premium muscle recovery nutritional packs.
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md inline-block font-mono">
                ℹ️ Fully authorized verified health affiliate partners. Purchases provide immediate ecosystem commissions keeping services free.
              </div>
            </div>

            {isLoadingInsights ? (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Synchronizing Marketplace Inventory...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Render fitness trackers */}
                {trackers.map((track) => (
                  <div key={track.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-md transition-shadow group" id={`product-${track.id}`}>
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex-shrink-0">
                      <img 
                        src={track.image} 
                        alt={track.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      {track.badge && (
                        <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {track.badge}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{track.name}</h3>
                          <span className="text-xs font-bold text-indigo-700 font-mono flex-shrink-0">{track.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {track.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-500 font-bold font-mono">★ {track.rating}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">(Verified Customer Satisfaction)</span>
                        </div>
                        <a
                          href={track.affiliateUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            triggerFeedback(`Redirecting to affiliate partner program for: ${track.name}`);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Show Best Offer <ChevronRight size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Render supplements */}
                {supplements.map((supp) => (
                  <div key={supp.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-md transition-shadow group" id={`product-${supp.id}`}>
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex-shrink-0">
                      <img 
                        src={supp.image} 
                        alt={supp.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{supp.name}</h3>
                          <span className="text-xs font-bold text-indigo-700 font-mono flex-shrink-0">{supp.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {supp.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-500 font-bold font-mono">★ {supp.rating}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">(Clinically Tested)</span>
                        </div>
                        <a
                          href={supp.affiliateUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            triggerFeedback(`Redirecting to affiliate partner program for: ${supp.name}`);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Show Best Offer <ChevronRight size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}

            {/* General fitness value indicators */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden" id="marketplace-banner">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none transform translate-x-1/12 rotate-12 select-none">
                <Activity size={180} />
              </div>
              <div className="max-w-xl z-10 space-y-2 relative">
                <span className="px-2 py-0.5 bg-white/10 text-white border border-white/25 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">Essential Health Knowledge</span>
                <h3 className="text-lg font-bold font-display leading-tight">Sync Body Stats Automatically</h3>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Most smart scales link directly with cellular smart applications, sharing raw weight coordinates instantly to our history graph via secure health synchronization bridges. Check back soon for mobile app companion updates!
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Structured Minimal Footnotes */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-center text-slate-400" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 font-display">BMI Calculator Service Platform</p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-400">
            <span>Free Tier Assessment</span>
            <span>•</span>
            <span>Premium Diet Plans</span>
            <span>•</span>
            <span>Affiliate Wellness</span>
          </div>
          <p className="text-[10px] leading-relaxed max-w-md mx-auto">
            © 2026 BMI Vitality Services. Clinical metrics are calculated strictly with official index parameters. Consult medical professionals before initiating calorie adjustments or vigorous training.
          </p>
        </div>
      </footer>

    </div>
  );
}
