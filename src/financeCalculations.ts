/**
 * Pure, testable calculation functions for Personal Finance SaaS
 */

export interface CompoundInterestInput {
  principal: number;              // Initial deposit
  monthlyContribution: number;    // Additional deposit each month
  annualRate: number;            // Annual interest rate as percentage (e.g. 7 for 7%)
  years: number;                 // Investment duration in years
  compoundingFrequency: "monthly" | "annually"; // Compounding intervals per year
}

export interface YearlyGrowthRecord {
  year: number;
  startingBalance: number;
  contributionsThisYear: number;
  totalContributions: number;
  interestEarnedThisYear: number;
  totalInterestEarned: number;
  endingBalance: number;
}

export interface CompoundInterestResult {
  finalBalance: number;
  totalContributed: number;
  totalInterestEarned: number;
  yearlyBreakdown: YearlyGrowthRecord[];
}

/**
 * Calculates compound interest with periodic monthly contributions and detailed breakdown
 */
export function calculateCompoundInterest(params: CompoundInterestInput): CompoundInterestResult {
  const {
    principal = 0,
    monthlyContribution = 0,
    annualRate = 0,
    years = 1,
    compoundingFrequency = "monthly"
  } = params;

  const r = Math.max(0, annualRate) / 100;
  const safeYears = Math.max(1, Math.min(100, Math.round(years)));

  const yearlyBreakdown: YearlyGrowthRecord[] = [];
  let currentBalance = Math.max(0, principal);
  let cumulativeContributions = Math.max(0, principal);
  let cumulativeInterest = 0;

  for (let year = 1; year <= safeYears; year++) {
    const startBal = currentBalance;
    let yearContributions = 0;
    let yearInterest = 0;

    if (compoundingFrequency === "monthly") {
      const monthlyRate = r / 12;
      for (let m = 1; m <= 12; m++) {
        currentBalance += monthlyContribution;
        yearContributions += monthlyContribution;
        cumulativeContributions += monthlyContribution;

        const monthlyInterest = currentBalance * monthlyRate;
        currentBalance += monthlyInterest;
        yearInterest += monthlyInterest;
        cumulativeInterest += monthlyInterest;
      }
    } else {
      const totalYearlyContribution = monthlyContribution * 12;
      yearContributions = totalYearlyContribution;
      cumulativeContributions += totalYearlyContribution;

      const interestOnStart = currentBalance * r;
      const interestOnNewMoney = totalYearlyContribution * (r / 2);
      yearInterest = interestOnStart + interestOnNewMoney;

      currentBalance = currentBalance + totalYearlyContribution + yearInterest;
      cumulativeInterest += yearInterest;
    }

    yearlyBreakdown.push({
      year,
      startingBalance: Math.round(startBal * 100) / 100,
      contributionsThisYear: Math.round(yearContributions * 100) / 100,
      totalContributions: Math.round(cumulativeContributions * 100) / 100,
      interestEarnedThisYear: Math.round(yearInterest * 100) / 100,
      totalInterestEarned: Math.round(cumulativeInterest * 100) / 100,
      endingBalance: Math.round(currentBalance * 100) / 100
    });
  }

  return {
    finalBalance: Math.round(currentBalance * 100) / 100,
    totalContributed: Math.round(cumulativeContributions * 100) / 100,
    totalInterestEarned: Math.round(cumulativeInterest * 100) / 100,
    yearlyBreakdown
  };
}

export interface FireCalculatorInput {
  monthlyIncome: number;       // Net after-tax monthly income
  monthlyExpenses: number;     // Monthly living expenses
  currentSavings: number;      // Current net investments / liquid net worth
  annualReturnRate: number;    // Expected investment real rate of return (%)
  safeWithdrawalRate?: number; // Safe withdrawal rate % (default: 4%)
}

export interface FireYearlyProjection {
  year: number;
  ageOffset: number;
  projectedPortfolio: number;
  fireTarget: number;
  isFireAchieved: boolean;
  totalSaved: number;
  growthFromReturns: number;
}

export interface FireCalculatorResult {
  monthlySavings: number;
  annualExpenses: number;
  savingsRatePercent: number;
  fireNumber: number; // 25x annual expenses (or 100 / safeWithdrawalRate * annualExpenses)
  yearsToFire: number; // Precise fractional years
  formattedYearsToFire: string;
  gaugeStatus: "danger" | "moderate" | "good" | "excellent"; // color-coded tier
  gaugeColor: string;
  gaugeBadgeText: string;
  projectedTimeline: FireYearlyProjection[];
}

/**
 * Calculates Savings Rate and FIRE (Financial Independence, Retire Early) Timeline
 */
export function calculateFireMetrics(params: FireCalculatorInput): FireCalculatorResult {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    currentSavings = 0,
    annualReturnRate = 7,
    safeWithdrawalRate = 4
  } = params;

  const income = Math.max(0, monthlyIncome);
  const expenses = Math.max(0, monthlyExpenses);
  const startingNetWorth = Math.max(0, currentSavings);
  const r = Math.max(0.001, annualReturnRate) / 100;
  const swr = safeWithdrawalRate > 0 ? safeWithdrawalRate / 100 : 0.04;

  const monthlySavings = Math.max(0, income - expenses);
  const annualExpenses = expenses * 12;
  const fireNumber = Math.round(annualExpenses / swr);

  // Savings rate calculation
  const savingsRatePercent = income > 0 
    ? Math.round(((income - expenses) / income) * 1000) / 10 
    : 0;

  // Determine Gauge Tier
  let gaugeStatus: "danger" | "moderate" | "good" | "excellent" = "danger";
  let gaugeColor = "#ef4444";
  let gaugeBadgeText = "Needs Optimization (<10%)";

  if (savingsRatePercent >= 50) {
    gaugeStatus = "excellent";
    gaugeColor = "#10b981";
    gaugeBadgeText = "Supercharged FI (50%+)";
  } else if (savingsRatePercent >= 25) {
    gaugeStatus = "good";
    gaugeColor = "#22c55e";
    gaugeBadgeText = "Strong Path to FI (25–49%)";
  } else if (savingsRatePercent >= 10) {
    gaugeStatus = "moderate";
    gaugeColor = "#f59e0b";
    gaugeBadgeText = "Moderate (10–24%)";
  }

  // Calculate Years to FIRE
  let yearsToFire = 0;
  let formattedYearsToFire = "Immediate (Target Met)";

  if (startingNetWorth >= fireNumber && fireNumber > 0) {
    yearsToFire = 0;
    formattedYearsToFire = "0 years (FI Achieved!)";
  } else if (monthlySavings <= 0) {
    yearsToFire = Infinity;
    formattedYearsToFire = "Indefinite (Expenses ≥ Income)";
  } else {
    let balance = startingNetWorth;
    const monthlyR = r / 12;
    let months = 0;
    const maxMonths = 1200;

    while (balance < fireNumber && months < maxMonths) {
      balance += monthlySavings;
      balance += balance * monthlyR;
      months++;
    }

    if (months >= maxMonths) {
      yearsToFire = 100;
      formattedYearsToFire = "> 100 years";
    } else {
      yearsToFire = Math.round((months / 12) * 10) / 10;
      const fullYears = Math.floor(months / 12);
      const remainingMonths = months % 12;
      formattedYearsToFire = `${fullYears} yr${fullYears === 1 ? '' : 's'}${remainingMonths > 0 ? ` ${remainingMonths} mo` : ''}`;
    }
  }

  const horizonYears = Math.min(40, Math.max(15, Math.ceil(Number.isFinite(yearsToFire) ? yearsToFire + 5 : 30)));
  const projectedTimeline: FireYearlyProjection[] = [];
  let runningBalance = startingNetWorth;
  let runningSavings = startingNetWorth;
  let runningReturns = 0;
  const monthlyR = r / 12;

  for (let yr = 0; yr <= horizonYears; yr++) {
    const isAchieved = runningBalance >= fireNumber;
    projectedTimeline.push({
      year: yr,
      ageOffset: yr,
      projectedPortfolio: Math.round(runningBalance),
      fireTarget: fireNumber,
      isFireAchieved: isAchieved,
      totalSaved: Math.round(runningSavings),
      growthFromReturns: Math.round(runningReturns)
    });

    for (let m = 0; m < 12; m++) {
      runningBalance += monthlySavings;
      runningSavings += monthlySavings;
      const interest = runningBalance * monthlyR;
      runningBalance += interest;
      runningReturns += interest;
    }
  }

  return {
    monthlySavings,
    annualExpenses,
    savingsRatePercent,
    fireNumber,
    yearsToFire,
    formattedYearsToFire,
    gaugeStatus,
    gaugeColor,
    gaugeBadgeText,
    projectedTimeline
  };
}
