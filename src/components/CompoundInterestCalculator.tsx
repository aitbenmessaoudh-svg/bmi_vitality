import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Repeat, 
  BookmarkPlus, 
  Trash2, 
  Layers, 
  BarChart3,
  Table as TableIcon,
  Sparkles,
  Lock,
  ArrowRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  AreaChart,
  Legend 
} from "recharts";
import { 
  calculateCompoundInterest, 
  CompoundInterestResult 
} from "../financeCalculations";
import { ScenarioRecord } from "../types/finance";

interface CompoundInterestCalculatorProps {
  isPro: boolean;
  onOpenUpgradeModal: (reason?: string) => void;
  savedScenarios: ScenarioRecord[];
  onSaveScenario: (scenario: Omit<ScenarioRecord, "id" | "createdAt">) => void;
  onDeleteScenario: (id: string) => void;
  onSelectScenario: (scenario: ScenarioRecord) => void;
  userEmail?: string | null;
}

export const CompoundInterestCalculator: React.FC<CompoundInterestCalculatorProps> = ({
  isPro,
  onOpenUpgradeModal,
  savedScenarios,
  onSaveScenario,
  onDeleteScenario,
  onSelectScenario,
}) => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(8.0);
  const [years, setYears] = useState<number>(20);
  const [compoundingFrequency, setCompoundingFrequency] = useState<"monthly" | "annually">("monthly");
  
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [scenarioName, setScenarioName] = useState<string>("");
  const [scenarioCategory, setScenarioCategory] = useState<"aggressive" | "moderate" | "conservative" | "custom">("moderate");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [comparedScenarioIds, setComparedScenarioIds] = useState<string[]>([]);

  const calculationResult: CompoundInterestResult = useMemo(() => {
    return calculateCompoundInterest({
      principal,
      monthlyContribution,
      annualRate,
      years,
      compoundingFrequency,
    });
  }, [principal, monthlyContribution, annualRate, years, compoundingFrequency]);

  const chartData = useMemo(() => {
    return calculationResult.yearlyBreakdown.map((row) => ({
      year: `Yr ${row.year}`,
      totalBalance: row.endingBalance,
      contributions: row.totalContributions,
      interestEarned: row.totalInterestEarned,
    }));
  }, [calculationResult]);

  const loadPreset = (type: "aggressive" | "moderate" | "conservative") => {
    if (type === "aggressive") {
      setPrincipal(15000);
      setMonthlyContribution(1000);
      setAnnualRate(10.5);
      setYears(25);
      setCompoundingFrequency("monthly");
    } else if (type === "moderate") {
      setPrincipal(10000);
      setMonthlyContribution(500);
      setAnnualRate(7.5);
      setYears(20);
      setCompoundingFrequency("monthly");
    } else {
      setPrincipal(5000);
      setMonthlyContribution(250);
      setAnnualRate(4.5);
      setYears(15);
      setCompoundingFrequency("monthly");
    }
  };

  const handleSaveCurrentScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    onSaveScenario({
      name: scenarioName.trim(),
      category: scenarioCategory,
      principal,
      monthlyContribution,
      annualRate,
      years,
      compoundingFrequency,
      finalBalance: calculationResult.finalBalance,
      totalContributed: calculationResult.totalContributed,
      totalInterestEarned: calculationResult.totalInterestEarned,
    });

    setScenarioName("");
    setShowSaveModal(false);
  };

  const toggleCompareScenario = (id: string) => {
    if (comparedScenarioIds.includes(id)) {
      setComparedScenarioIds(comparedScenarioIds.filter(item => item !== id));
    } else {
      if (comparedScenarioIds.length >= 3) {
        setComparedScenarioIds([...comparedScenarioIds.slice(1), id]);
      } else {
        setComparedScenarioIds([...comparedScenarioIds, id]);
      }
    }
  };

  const comparedScenarios = useMemo(() => {
    return savedScenarios.filter(s => comparedScenarioIds.includes(s.id));
  }, [savedScenarios, comparedScenarioIds]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <TrendingUp size={13} className="text-indigo-400" />
            Flagship Wealth Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            Compound Interest & Growth Forecaster
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Model how your money compounds over time with monthly contributions and interest reinvestment. Save and compare aggressive vs. conservative portfolios.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            <button
              onClick={() => loadPreset("conservative")}
              className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Conservative (4.5%)
            </button>
            <button
              onClick={() => loadPreset("moderate")}
              className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              Balanced Index (7.5%)
            </button>
            <button
              onClick={() => loadPreset("aggressive")}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-400/40 transition-colors cursor-pointer"
            >
              Aggressive Growth (10.5%)
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Inputs vs Real-Time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-600" />
                Portfolio Parameters
              </h2>
              <span className="text-xs text-slate-400 font-mono">Real-Time</span>
            </div>

            {/* Initial Principal */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="principal-input">Initial Principal</label>
                <span className="font-mono text-indigo-600 text-sm font-bold">
                  ${principal.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">$</span>
                <input
                  id="principal-input"
                  type="number"
                  min="0"
                  step="500"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="monthly-contribution">Monthly Contribution</label>
                <span className="font-mono text-indigo-600 text-sm font-bold">
                  ${monthlyContribution.toLocaleString()}/mo
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">$</span>
                <input
                  id="monthly-contribution"
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Annual Interest Rate (%) */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="annual-rate">Annual Expected Return Rate</label>
                <span className="font-mono text-indigo-600 text-sm font-bold">
                  {annualRate}%
                </span>
              </div>
              <div className="relative">
                <input
                  id="annual-rate"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 text-sm font-bold">%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.25"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Investment Duration (Years) */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="years-slider">Investment Horizon</label>
                <span className="font-mono text-indigo-600 text-sm font-bold">
                  {years} Years
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="years-slider"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center"
                />
              </div>
            </div>

            {/* Compounding Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Compounding Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCompoundingFrequency("monthly")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    compoundingFrequency === "monthly"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Repeat size={13} /> Monthly (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setCompoundingFrequency("annually")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    compoundingFrequency === "annually"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Calendar size={13} /> Annually
                </button>
              </div>
            </div>

            {/* Save Scenario Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookmarkPlus size={15} />
                Save Scenario to Account
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & Visualizations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block font-mono">
                Projected Balance
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1 block">
                ${calculationResult.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-300 mt-2 block">
                After {years} years at {annualRate}% APY
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                Total Contributed
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-800 mt-1 block">
                ${calculationResult.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-2 block">
                ${principal.toLocaleString()} base + ${(monthlyContribution * 12 * years).toLocaleString()} added
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block font-mono">
                Total Interest Earned
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                +${calculationResult.totalInterestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-2 block">
                {Math.round((calculationResult.totalInterestEarned / (calculationResult.finalBalance || 1)) * 100)}% of total portfolio
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Growth Trajectory & Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  See how compound interest overtakes principal contributions
                </p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("chart")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "chart"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 size={13} /> Line Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TableIcon size={13} /> Yearly Table
                </button>
              </div>
            </div>

            {viewMode === "chart" && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="year" 
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
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalBalance" 
                      name="Total Balance" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#balanceGrad)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="contributions" 
                      name="Total Contributed" 
                      stroke="#64748b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#contribGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {viewMode === "table" && (
              <div className="overflow-x-auto max-h-80 border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">Year</th>
                      <th className="py-2.5 px-3">Start Balance</th>
                      <th className="py-2.5 px-3">Annual Added</th>
                      <th className="py-2.5 px-3 text-emerald-600">Interest Earned</th>
                      <th className="py-2.5 px-3 text-right font-mono">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {calculationResult.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-800">Year {row.year}</td>
                        <td className="py-2 px-3 text-slate-600">${row.startingBalance.toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-600">+${row.contributionsThisYear.toLocaleString()}</td>
                        <td className="py-2 px-3 text-emerald-600 font-medium">+${row.interestEarnedThisYear.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">${row.endingBalance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Manager & Side-by-Side Comparison (Pro Feature) */}
      {isPro ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Scenario Comparison Dashboard
                </h2>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Pro Multi-Scenario
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select scenarios below to compare side by side and evaluate risk vs return profiles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkPlus size={14} /> + Add Scenario
            </button>
          </div>

          {savedScenarios.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Layers size={32} className="text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Saved Scenarios Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Save your current calculation as "Aggressive", "Balanced", or "Conservative" to track and compare growth models.
              </p>
              <button
                onClick={() => setShowSaveModal(true)}
                className="mt-4 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Save Current Calculation
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedScenarios.map((scenario) => {
                  const isSelectedForCompare = comparedScenarioIds.includes(scenario.id);
                  return (
                    <div
                      key={scenario.id}
                      className={`rounded-2xl p-5 border transition-all relative ${
                        isSelectedForCompare
                          ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            scenario.category === "aggressive" 
                              ? "bg-rose-100 text-rose-700" 
                              : scenario.category === "conservative" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {scenario.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                            {scenario.name}
                          </h4>
                        </div>

                        <button
                          onClick={() => onDeleteScenario(scenario.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Delete Scenario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Principal:</span>
                          <span>${scenario.principal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Monthly:</span>
                          <span>${scenario.monthlyContribution.toLocaleString()}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rate / Years:</span>
                          <span>{scenario.annualRate}% for {scenario.years} yrs</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                          <span>Final Balance:</span>
                          <span className="text-indigo-600">${scenario.finalBalance.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPrincipal(scenario.principal);
                            setMonthlyContribution(scenario.monthlyContribution);
                            setAnnualRate(scenario.annualRate);
                            setYears(scenario.years);
                            setCompoundingFrequency(scenario.compoundingFrequency);
                            onSelectScenario(scenario);
                          }}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer text-center"
                        >
                          Load Inputs
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompareScenario(scenario.id)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                            isSelectedForCompare
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                          }`}
                        >
                          {isSelectedForCompare ? "Comparing ✓" : "Compare"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {comparedScenarios.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" />
                      Side-by-Side Comparison ({comparedScenarios.length} Scenarios)
                    </h3>
                    <button
                      onClick={() => setComparedScenarioIds([])}
                      className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                    >
                      Clear Comparison
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="py-3 px-4">Metric</th>
                          {comparedScenarios.map((s) => (
                            <th key={s.id} className="py-3 px-4 font-bold">
                              {s.name} ({s.category})
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Initial Principal</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4">${s.principal.toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Monthly Contribution</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4">${s.monthlyContribution.toLocaleString()}/mo</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Interest Rate</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4 text-indigo-600 font-bold">{s.annualRate}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Horizon</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4">{s.years} years</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Total Out-of-Pocket</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4">${s.totalContributed.toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 font-sans">Interest Earned</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-2.5 px-4 text-emerald-600 font-bold">+${s.totalInterestEarned.toLocaleString()}</td>
                          ))}
                        </tr>
                        <tr className="bg-indigo-50/60 font-bold">
                          <td className="py-3 px-4 text-slate-900 font-sans">Final Portfolio Balance</td>
                          {comparedScenarios.map((s) => (
                            <td key={s.id} className="py-3 px-4 text-indigo-700 text-sm">
                              ${s.finalBalance.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-indigo-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">
                    Scenario Comparison Dashboard
                  </h2>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Pro Exclusive
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Save multiple strategies (Aggressive Growth vs. Conservative vs. Balanced Index) and compare final balances side-by-side.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenUpgradeModal("Scenario Comparison Dashboard")}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <Lock size={13} className="text-amber-300" /> Unlock with Pro ($2/mo)
              </button>
            </div>

            {/* Blurred Mockup Preview with Locked Callout */}
            <div className="relative rounded-2xl overflow-hidden border border-indigo-800/40 bg-slate-950/60 p-6">
              <div className="filter blur-[4px] opacity-30 select-none pointer-events-none space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-800 rounded-xl">
                    <span className="text-xs text-rose-400 font-bold">AGGRESSIVE GROWTH</span>
                    <div className="text-lg font-bold text-white mt-1">$1,420,500</div>
                    <div className="text-xs text-slate-400">10.5% APY • 25 Years</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl">
                    <span className="text-xs text-emerald-400 font-bold">BALANCED INDEX</span>
                    <div className="text-lg font-bold text-white mt-1">$845,200</div>
                    <div className="text-xs text-slate-400">7.5% APY • 25 Years</div>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl">
                    <span className="text-xs text-blue-400 font-bold">CONSERVATIVE</span>
                    <div className="text-lg font-bold text-white mt-1">$490,100</div>
                    <div className="text-xs text-slate-400">4.5% APY • 25 Years</div>
                  </div>
                </div>
                <div className="h-24 bg-slate-800/50 rounded-xl"></div>
              </div>

              {/* Centered Lock Callout Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950/75 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center mb-3 text-indigo-300">
                  <Lock size={20} className="text-amber-300" />
                </div>
                <h3 className="text-base font-bold text-white">Scenario Comparison is a Pro Exclusive Feature</h3>
                <p className="text-xs text-slate-300 max-w-md mt-1.5 leading-relaxed">
                  Upgrade to WealthPulse Pro for $2.00/month to save unlimited custom scenarios, model asset allocation differences, and run side-by-side portfolio comparisons.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal("Scenario Comparison Dashboard")}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>Upgrade to Pro to Compare Scenarios</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {showSaveModal && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSaveModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookmarkPlus size={18} className="text-indigo-600" />
              Save Portfolio Scenario
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Give this investment calculation a descriptive label to compare later.
            </p>

            <form onSubmit={handleSaveCurrentScenario} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S&P 500 DCA Plan, Real Estate Cashflow..."
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Category
                </label>
                <select
                  value={scenarioCategory}
                  onChange={(e: any) => setScenarioCategory(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="aggressive">Aggressive Growth (High Equities)</option>
                  <option value="moderate">Moderate / Balanced Index</option>
                  <option value="conservative">Conservative (Bonds / Fixed Income)</option>
                  <option value="custom">Custom Strategy</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-600 space-y-1">
                <div>Principal: ${principal.toLocaleString()} | Monthly: ${monthlyContribution.toLocaleString()}</div>
                <div>Rate: {annualRate}% | Horizon: {years} yrs</div>
                <div className="font-bold text-indigo-600">Ending Balance: ${calculationResult.finalBalance.toLocaleString()}</div>
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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
