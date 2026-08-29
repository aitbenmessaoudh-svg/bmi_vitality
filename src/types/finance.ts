export interface ScenarioRecord {
  id: string;
  name: string;
  category: "aggressive" | "moderate" | "conservative" | "custom";
  createdAt: string;
  principal: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
  compoundingFrequency: "monthly" | "annually";
  finalBalance: number;
  totalContributed: number;
  totalInterestEarned: number;
}

export interface SavedFirePlan {
  id: string;
  name: string;
  createdAt: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  annualReturnRate: number;
  savingsRatePercent: number;
  fireNumber: number;
  yearsToFire: number;
  formattedYearsToFire: string;
}
