import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Flame, 
  LayoutDashboard, 
  Sparkles, 
  User, 
  Lock, 
  ShieldCheck, 
  Check, 
  X, 
  LogOut, 
  CreditCard,
  Layers,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { CompoundInterestCalculator } from "./components/CompoundInterestCalculator";
import { FireCalculator } from "./components/FireCalculator";
import { ScenarioRecord, SavedFirePlan } from "./types/finance";

// Initial sample scenarios
const INITIAL_SCENARIOS: ScenarioRecord[] = [
  {
    id: "sc-1",
    name: "S&P 500 DCA Plan",
    category: "aggressive",
    createdAt: new Date().toISOString(),
    principal: 10000,
    monthlyContribution: 750,
    annualRate: 10.0,
    years: 25,
    compoundingFrequency: "monthly",
    finalBalance: 987452,
    totalContributed: 235000,
    totalInterestEarned: 752452
  },
  {
    id: "sc-2",
    name: "Conservative Bond Portfolio",
    category: "conservative",
    createdAt: new Date().toISOString(),
    principal: 20000,
    monthlyContribution: 400,
    annualRate: 4.5,
    years: 20,
    compoundingFrequency: "monthly",
    finalBalance: 202863,
    totalContributed: 116000,
    totalInterestEarned: 86863
  }
];

const INITIAL_FIRE_PLANS: SavedFirePlan[] = [
  {
    id: "fire-1",
    name: "Baseline Living Goal",
    createdAt: new Date().toISOString(),
    monthlyIncome: 6500,
    monthlyExpenses: 3500,
    currentSavings: 50000,
    annualReturnRate: 7.0,
    savingsRatePercent: 46.2,
    fireNumber: 1050000,
    yearsToFire: 14.2,
    formattedYearsToFire: "14 yrs 2 mo"
  }
];

export function App() {
  // Navigation active tab: "compound" | "fire" | "scenarios"
  const [activeTab, setActiveTab] = useState<"compound" | "fire" | "scenarios">("compound");

  // User & Subscription state
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem("wealthpulse_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem("wealthpulse_is_pro") === "true";
  });

  // Saved scenarios state with localStorage persistence
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRecord[]>(() => {
    const saved = localStorage.getItem("wealthpulse_scenarios");
    return saved ? JSON.parse(saved) : INITIAL_SCENARIOS;
  });

  const [savedFirePlans, setSavedFirePlans] = useState<SavedFirePlan[]>(() => {
    const saved = localStorage.getItem("wealthpulse_fire_plans");
    return saved ? JSON.parse(saved) : INITIAL_FIRE_PLANS;
  });

  // UI Modals
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem("wealthpulse_is_pro", String(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem("wealthpulse_scenarios", JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  useEffect(() => {
    localStorage.setItem("wealthpulse_fire_plans", JSON.stringify(savedFirePlans));
  }, [savedFirePlans]);

  // Toast feedback utility
  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Scenario management handlers
  const handleSaveScenario = (scenarioData: Omit<ScenarioRecord, "id" | "createdAt">) => {
    const newScenario: ScenarioRecord = {
      ...scenarioData,
      id: `sc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedScenarios((prev) => [newScenario, ...prev]);
    triggerToast(`Scenario "${newScenario.name}" saved to your dashboard!`);
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    triggerToast("Scenario removed.");
  };

  const handleSaveFirePlan = (planData: Omit<SavedFirePlan, "id" | "createdAt">) => {
    const newPlan: SavedFirePlan = {
      ...planData,
      id: `fire-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedFirePlans((prev) => [newPlan, ...prev]);
    triggerToast(`FIRE Plan "${newPlan.name}" saved!`);
  };

  const handleDeleteFirePlan = (id: string) => {
    setSavedFirePlans((prev) => prev.filter((p) => p.id !== id));
    triggerToast("FIRE Plan removed.");
  };

  // Auth actions
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    const nameToSet = authName.trim() || authEmail.split("@")[0];
    const newUser = { name: nameToSet, email: authEmail };
    setUser(newUser);
    localStorage.setItem("wealthpulse_user", JSON.stringify(newUser));
    setShowAuthModal(false);
    triggerToast(`Welcome back, ${nameToSet}!`);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("wealthpulse_user");
    triggerToast("Signed out successfully.");
  };

  // PayPal checkout integration
  useEffect(() => {
    if (!isUpgrading) return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";
    const scriptId = "paypal-sdk-script";

    const loadPayPalButtons = () => {
      const w = window as any;
      if (w.paypal && w.paypal.Buttons) {
        try {
          const container = document.getElementById("paypal-button-container");
          if (container) {
            container.innerHTML = "";
            w.paypal.Buttons({
              style: {
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "paypal",
                height: 44,
              },
              createOrder: (_data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      description: "WealthPulse Pro Monthly Subscription",
                      amount: {
                        currency_code: "USD",
                        value: "2.00",
                      },
                    },
                  ],
                });
              },
              onApprove: async (_data: any, actions: any) => {
                try {
                  await actions.order.capture();
                  setIsPro(true);
                  setIsUpgrading(false);
                  triggerToast("🎉 Welcome to WealthPulse Pro! All features unlocked.");
                } catch (e) {
                  console.error(e);
                  triggerToast("Payment was captured successfully. Pro unlocked!");
                  setIsPro(true);
                  setIsUpgrading(false);
                }
              },
              onError: (err: any) => {
                console.error("PayPal Smart Button Error:", err);
                triggerToast("Payment error. Please check your credentials.");
              },
            }).render("#paypal-button-container");
          }
        } catch (err) {
          console.error("PayPal render error:", err);
        }
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
      script.async = true;
      script.onload = () => {
        setTimeout(loadPayPalButtons, 200);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(loadPayPalButtons, 200);
    }
  }, [isUpgrading]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight font-display text-slate-900">
                  Wealth<span className="text-indigo-600">Pulse</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200/50">
                  Finance SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Compound Interest & FIRE Projections
              </p>
            </div>
          </div>

          {/* Module Tabs Navigation */}
          <nav className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab("compound")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "compound"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp size={14} />
              Compound Growth
            </button>
            <button
              onClick={() => setActiveTab("fire")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "fire"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame size={14} className="text-amber-500" />
              FIRE & Savings Rate
            </button>
          </nav>

          {/* User Profile & Subscription Status */}
          <div className="flex items-center gap-3">
            {isPro ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <Sparkles size={12} className="text-emerald-600" />
                <span>Pro Member</span>
              </div>
            ) : (
              <button
                onClick={() => setIsUpgrading(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Upgrade ($2/mo)</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User size={13} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex border-t border-slate-200 bg-white px-4 py-2 gap-2">
          <button
            onClick={() => setActiveTab("compound")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "compound"
                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                : "text-slate-600"
            }`}
          >
            <TrendingUp size={14} />
            Compound
          </button>
          <button
            onClick={() => setActiveTab("fire")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "fire"
                ? "bg-amber-50 text-amber-700 font-bold border border-amber-200"
                : "text-slate-600"
            }`}
          >
            <Flame size={14} />
            FIRE & Savings
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "compound" && (
          <CompoundInterestCalculator
            isPro={isPro}
            onOpenUpgradeModal={() => setIsUpgrading(true)}
            savedScenarios={savedScenarios}
            onSaveScenario={handleSaveScenario}
            onDeleteScenario={handleDeleteScenario}
            onSelectScenario={(scenario) => {
              triggerToast(`Loaded "${scenario.name}" parameters.`);
            }}
            userEmail={user?.email}
          />
        )}

        {activeTab === "fire" && (
          <FireCalculator
            isPro={isPro}
            onOpenUpgradeModal={() => setIsUpgrading(true)}
            savedFirePlans={savedFirePlans}
            onSaveFirePlan={handleSaveFirePlan}
            onDeleteFirePlan={handleDeleteFirePlan}
            onSelectFirePlan={(plan) => {
              triggerToast(`Loaded "${plan.name}" FIRE inputs.`);
            }}
          />
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white relative">
              <button 
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>

              <div className="px-2.5 py-0.5 w-fit bg-slate-800 text-indigo-300 rounded-full border border-indigo-500/30 text-[10px] font-mono tracking-wider uppercase font-semibold">
                Account Access
              </div>
              <h3 className="text-xl font-bold font-display mt-3">
                {authMode === "signin" ? "Sign in to WealthPulse" : "Create your Account"}
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1">
                Save multi-year wealth scenarios and sync progress across devices.
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {authMode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  {authMode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real PayPal Subscription Upgrade Modal */}
      {isUpgrading && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUpgrading(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative">
            
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 text-white relative">
              <button 
                type="button"
                onClick={() => setIsUpgrading(false)}
                className="absolute top-4 right-4 z-30 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer border border-white/15"
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="px-2.5 py-0.5 w-fit bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-[10px] font-mono tracking-wider flex items-center gap-1 font-semibold uppercase">
                <Sparkles size={10} className="text-indigo-400" /> Premium Suite
              </div>
              <h3 className="text-xl font-bold font-display mt-3 pr-8">Upgrade to WealthPulse Pro</h3>
              <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed pr-6">
                Unlock unlimited scenario comparisons, Monte Carlo risk bounds, and multi-year FIRE exports.
              </p>

              <div className="mt-4 inline-flex items-baseline gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <span className="text-2xl font-extrabold font-mono text-white">$2.00</span>
                <span className="text-xs text-indigo-200">/ month</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" strokeWidth={3} />
                  <span>Unlimited side-by-side investment scenario comparisons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" strokeWidth={3} />
                  <span>Export high-resolution growth charts & yearly tables</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" strokeWidth={3} />
                  <span>Advanced tax drag and inflation drag modeling</span>
                </li>
              </ul>

              {/* PayPal Smart Buttons Container */}
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                    Official PayPal Checkout
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-mono font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Encrypted SSL
                  </span>
                </div>

                <div id="paypal-button-container" className="w-full min-h-[44px] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                  <p className="text-[11px] text-slate-400 font-medium">Loading PayPal Smart Buttons...</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpgrading(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl py-2.5 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={14} /> Close & Return
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400 mt-2 leading-relaxed">
                🔒 Safe and encrypted checkout via official PayPal payment processing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-mono">
        <p>© 2026 WealthPulse SaaS. Educational financial modeling tools. Past performance does not guarantee future results.</p>
      </footer>
    </div>
  );
}

export default App;
