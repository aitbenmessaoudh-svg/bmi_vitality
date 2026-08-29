import React, { useState, useMemo } from "react";
import { 
  Flame, 
  PiggyBank, 
  TrendingUp, 
  Share2, 
  BookmarkPlus, 
  Info
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from "recharts";
import { calculateFireMetrics, FireCalculatorResult } from "../financeCalculations";
import { SavingsRateGauge } from "./SavingsRateGauge";
import { SavedFirePlan } from "../types/finance";

interface FireCalculatorProps {
  isPro: boolean;
  onOpenUpgradeModal: () => void;
  savedFirePlans: SavedFirePlan[];
  onSaveFirePlan: (plan: Omit<SavedFirePlan, "id" | "createdAt">) => void;
  onDeleteFirePlan: (id: string) => void;
  onSelectFirePlan: (plan: SavedFirePlan) => void;
}

export const FireCalculator: React.FC<FireCalculatorProps> = ({
  savedFirePlans,
  onSaveFirePlan,
  onDeleteFirePlan,
  onSelectFirePlan,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(6500);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(3800);
  const [currentSavings, setCurrentSavings] = useState<number>(45000);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(7.0);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState<number>(4.0);

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>("");

  const fireMetrics: FireCalculatorResult = useMemo(() => {
    return calculateFireMetrics({
      monthlyIncome,
      monthlyExpenses,
      currentSavings,
      annualReturnRate,
      safeWithdrawalRate,
    });
  }, [monthlyIncome, monthlyExpenses, currentSavings, annualReturnRate, safeWithdrawalRate]);

  const chartData = useMemo(() => {
    return fireMetrics.projectedTimeline.map((item) => ({
      yearLabel: `Yr ${item.year}`,
      portfolioValue: item.projectedPortfolio,
      fireTarget: item.fireTarget,
      totalSaved: item.totalSaved,
    }));
  }, [fireMetrics]);

  const handleShareResult = () => {
    const textToCopy = `My Savings Rate is ${fireMetrics.savingsRatePercent}% with a FIRE Target of $${fireMetrics.fireNumber.toLocaleString()} (${fireMetrics.formattedYearsToFire} to Financial Freedom) — Modeled on WealthPulse!`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    onSaveFirePlan({
      name: planName.trim(),
      monthlyIncome,
      monthlyExpenses,
      currentSavings,
      annualReturnRate,
      savingsRatePercent: fireMetrics.savingsRatePercent,
      fireNumber: fireMetrics.fireNumber,
      yearsToFire: fireMetrics.yearsToFire,
      formattedYearsToFire: fireMetrics.formattedYearsToFire,
    });

    setPlanName("");
    setShowSaveModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame size={13} className="text-amber-400" />
            Financial Independence & Early Retirement
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            Savings Rate & FIRE Calculator
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Calculate your exact savings velocity, 25x annual expense target (4% rule), and how many years until work becomes 100% optional.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleShareResult}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
            >
              <Share2 size={13} />
              {copiedLink ? "Copied Stats to Clipboard! ✓" : "Share My Savings Score"}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <BookmarkPlus size={13} />
              Save Plan to Account
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid: Inputs, Gauge, and Output Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Budget & Net Worth Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PiggyBank size={18} className="text-amber-600" />
                Monthly Cash Flow & Assets
              </h2>
              <span className="text-xs text-slate-400 font-mono">After-Tax</span>
            </div>

            {/* Monthly Take-Home Income */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="fire-income">Monthly Net Income (After Tax)</label>
                <span className="font-mono text-emerald-600 text-sm font-bold">
                  ${monthlyIncome.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">$</span>
                <input
                  id="fire-income"
                  type="number"
                  min="0"
                  step="250"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <input
                type="range"
                min="1000"
                max="30000"
                step="250"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Monthly Expenses */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="fire-expenses">Monthly Living Expenses</label>
                <span className="font-mono text-amber-600 text-sm font-bold">
                  ${monthlyExpenses.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">$</span>
                <input
                  id="fire-expenses"
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="100"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="w-full mt-2 accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Current Net Investments */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="fire-savings">Current Investments / Net Worth</label>
                <span className="font-mono text-slate-900 text-sm font-bold">
                  ${currentSavings.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">$</span>
                <input
                  id="fire-savings"
                  type="number"
                  min="0"
                  step="1000"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="5000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="w-full mt-2 accent-slate-800 cursor-pointer"
              />
            </div>

            {/* Return Rate and SWR Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Return
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={annualReturnRate}
                    onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
                    className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Safe Withdrawal
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.25"
                    value={safeWithdrawalRate}
                    onChange={(e) => setSafeWithdrawalRate(Number(e.target.value))}
                    className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>The 25x Rule:</strong> Having 25 times your annual expenses invested enables a safe 4% inflation-adjusted withdrawal rate forever without depleting your principal.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Gauge & FIRE Milestones */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SavingsRateGauge 
              savingsRate={fireMetrics.savingsRatePercent}
              gaugeStatus={fireMetrics.gaugeStatus}
              gaugeBadgeText={fireMetrics.gaugeBadgeText}
            />

            <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    FIRE Target Number
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-slate-300">
                    25x Expenses
                  </span>
                </div>
                <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
                  ${fireMetrics.fireNumber.toLocaleString()}
                </span>
                <span className="text-xs text-slate-300 mt-1 block">
                  Required to generate ${fireMetrics.annualExpenses.toLocaleString()}/year perpetually
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                  Time to Financial Freedom
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {fireMetrics.formattedYearsToFire}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Saving ${fireMetrics.monthlySavings.toLocaleString()}/month
                </span>
              </div>
            </div>
          </div>

          {/* Net Worth Timeline Projection Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-amber-600" />
                  Projected Net Worth Timeline to FIRE
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Portfolio balance compounding towards the ${fireMetrics.fireNumber.toLocaleString()} freedom crossover
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Portfolio
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Target Line
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="firePortfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="yearLabel" 
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                  />
                  <ReferenceLine 
                    y={fireMetrics.fireNumber} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ value: `FIRE Target $${(fireMetrics.fireNumber/1000).toFixed(0)}k`, fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    name="Projected Net Worth" 
                    stroke="#d97706" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#firePortfolioGrad)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalSaved" 
                    name="Contributions Only" 
                    stroke="#94a3b8" 
                    strokeWidth={1.5}
                    strokeDasharray="3 3" 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Saved FIRE Plans */}
      {savedFirePlans.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookmarkPlus size={18} className="text-amber-600" />
            Your Saved FIRE Milestones ({savedFirePlans.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {savedFirePlans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-800">{plan.name}</h4>
                    <button
                      onClick={() => onDeleteFirePlan(plan.id)}
                      className="text-slate-400 hover:text-red-600 text-xs p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Savings Rate:</span>
                    <span className="font-bold text-emerald-600">{plan.savingsRatePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target (25x):</span>
                    <span className="font-bold text-slate-800">${plan.fireNumber.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timeline:</span>
                    <span className="font-bold text-amber-600">{plan.formattedYearsToFire}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMonthlyIncome(plan.monthlyIncome);
                    setMonthlyExpenses(plan.monthlyExpenses);
                    setCurrentSavings(plan.currentSavings);
                    setAnnualReturnRate(plan.annualReturnRate);
                    onSelectFirePlan(plan);
                  }}
                  className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  Load Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Plan Modal */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSaveModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookmarkPlus size={18} className="text-amber-600" />
              Save FIRE Plan to Dashboard
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Store your current income, expense, and savings rate profile.
            </p>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lean FIRE Budget, Post-Promotion Goal..."
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-600 space-y-1">
                <div>Income: ${monthlyIncome.toLocaleString()} | Expenses: ${monthlyExpenses.toLocaleString()}</div>
                <div>Savings Rate: {fireMetrics.savingsRatePercent}%</div>
                <div className="font-bold text-amber-600">FIRE Target: ${fireMetrics.fireNumber.toLocaleString()} ({fireMetrics.formattedYearsToFire})</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
