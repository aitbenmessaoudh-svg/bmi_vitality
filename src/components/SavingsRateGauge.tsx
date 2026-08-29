import React from "react";
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface SavingsRateGaugeProps {
  savingsRate: number;
  gaugeStatus: "danger" | "moderate" | "good" | "excellent";
  gaugeBadgeText: string;
}

export const SavingsRateGauge: React.FC<SavingsRateGaugeProps> = ({
  savingsRate,
  gaugeStatus,
  gaugeBadgeText,
}) => {
  const clampedRate = Math.min(100, Math.max(0, savingsRate));
  const needleRotation = (clampedRate / 100) * 180 - 90;

  const tierConfig = {
    danger: {
      color: "#ef4444",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      desc: "Less than 10% of monthly income is saved. Retiring could take 50+ years without expense adjustments.",
      icon: AlertCircle,
    },
    moderate: {
      color: "#f59e0b",
      bgClass: "bg-amber-50 text-amber-700 border-amber-200",
      desc: "Standard 10-24% savings rate. Consistent path to conventional retirement in ~30-40 years.",
      icon: TrendingUp,
    },
    good: {
      color: "#22c55e",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      desc: "Strong 25-49% savings rate. Cuts working timeline in half down to 15-25 years.",
      icon: CheckCircle2,
    },
    excellent: {
      color: "#10b981",
      bgClass: "bg-teal-50 text-teal-800 border-teal-200",
      desc: "Elite 50%+ savings rate. Financial Independence is achievable in 10-15 years or less.",
      icon: Sparkles,
    },
  };

  const currentTier = tierConfig[gaugeStatus] || tierConfig.moderate;
  const IconComponent = currentTier.icon;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Savings Velocity Gauge
        </span>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentTier.bgClass} flex items-center gap-1`}>
          <IconComponent size={12} />
          {gaugeBadgeText}
        </span>
      </div>

      <div className="relative w-64 h-36 mt-2 flex items-center justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 36 68"
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-80"
          />
          <path
            d="M 36 68 A 80 80 0 0 1 75 28"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
            className="opacity-80"
          />
          <path
            d="M 75 28 A 80 80 0 0 1 125 28"
            fill="none"
            stroke="#22c55e"
            strokeWidth="16"
            className="opacity-80"
          />
          <path
            d="M 125 28 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-90"
          />
          <circle cx="100" cy="100" r="7" fill="#1e293b" />
          <circle cx="100" cy="100" r="3" fill="#ffffff" />
          <g
            style={{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <polygon points="97,100 100,22 103,100" fill="#0f172a" />
            <circle cx="100" cy="22" r="3" fill="#6366f1" />
          </g>
        </svg>

        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
            {savingsRate}%
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Savings Rate
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs flex justify-between text-[10px] font-mono text-slate-400 px-2 mt-1">
        <span className="text-red-500 font-medium">0%</span>
        <span className="text-amber-500 font-medium">10%</span>
        <span className="text-emerald-600 font-medium">25%</span>
        <span className="text-teal-600 font-medium">50%+</span>
      </div>

      <p className="text-xs text-slate-500 mt-3 max-w-sm leading-relaxed">
        {currentTier.desc}
      </p>
    </div>
  );
};
