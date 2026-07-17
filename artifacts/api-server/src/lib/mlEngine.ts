/**
 * ML Engine — placeholder heuristic models.
 * Replace runFraudModel and runOverspendingModel with calls to real trained
 * ML models (Python FastAPI, ONNX, etc.) when models are available.
 */

import { randomUUID } from "crypto";

export interface TransactionRecord {
  amount: number;
  merchant?: string | null;
  merchantCategory?: string | null;
  paymentMethod?: string | null;
  isOnline?: boolean | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  device?: string | null;
  currency?: string | null;
}

export interface FinancialProfile {
  monthlyIncome: number;
  monthlyBudget: number;
  monthlySavingsGoal: number;
  currentBalance?: number | null;
  averageMonthlySpending: number;
  numberOfMonthlyTransactions: number;
  averageTransactionAmount: number;
  largestPurchase?: number | null;
  shoppingFrequency?: string | null;
  preferredPaymentMethod?: string | null;
}

export interface SuspiciousTransaction {
  id: string;
  amount: number;
  merchant: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  reason: string;
  date: string | null;
}

export interface FraudResult {
  fraudProbability: number;
  suspiciousTransactionCount: number;
  overallRisk: "critical" | "high" | "medium" | "low";
  suspiciousTransactions: SuspiciousTransaction[];
  confidenceScore: number;
  riskBreakdown: { critical: number; high: number; medium: number; low: number };
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  isHighRisk: boolean;
}

export interface SpendingTrendPoint {
  period: string;
  amount: number;
  budget: number | null;
}

export interface OverspendingResult {
  overspendingPredicted: boolean;
  budgetRisk: "critical" | "high" | "medium" | "low";
  projectedOverspend: number | null;
  daysUntilBudgetExceeded: number | null;
  spendingTrends: SpendingTrendPoint[];
  spendingCategories: SpendingCategory[];
  highRiskCategories: string[];
  recommendations: string[];
}

const HIGH_RISK_CATEGORIES = ["gambling", "luxury", "travel", "entertainment", "electronics", "jewelry"];
const SUSPICIOUS_KEYWORDS = ["unknown", "foreign", "international", "crypto", "atm", "cash advance"];

function riskLevel(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 0.75) return "critical";
  if (score >= 0.5) return "high";
  if (score >= 0.25) return "medium";
  return "low";
}

/**
 * Heuristic fraud detection.
 * Swap this function body for a real ML model call (e.g. POST to Python FastAPI).
 */
export function runFraudModel(
  transactions: TransactionRecord[],
  profile: FinancialProfile
): FraudResult {
  const suspicious: SuspiciousTransaction[] = [];

  for (const tx of transactions) {
    let score = 0;
    const reasons: string[] = [];

    // High amount relative to average
    if (tx.amount > profile.averageTransactionAmount * 4) {
      score += 0.4;
      reasons.push("Unusually large transaction amount");
    } else if (tx.amount > profile.averageTransactionAmount * 2.5) {
      score += 0.2;
      reasons.push("Above-average transaction amount");
    }

    // Large single purchase
    if (profile.largestPurchase && tx.amount > profile.largestPurchase * 1.5) {
      score += 0.2;
      reasons.push("Exceeds historical largest purchase");
    }

    // Suspicious merchant keywords
    const merchantLower = (tx.merchant ?? "").toLowerCase();
    const categoryLower = (tx.merchantCategory ?? "").toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (merchantLower.includes(kw) || categoryLower.includes(kw)) {
        score += 0.3;
        reasons.push(`Suspicious merchant/category: ${kw}`);
        break;
      }
    }

    // Online transaction in suspicious hours (if time provided)
    if (tx.isOnline && tx.time) {
      const hour = parseInt(tx.time.split(":")[0] ?? "12", 10);
      if (hour >= 1 && hour <= 5) {
        score += 0.25;
        reasons.push("Online transaction in unusual hours (1am-5am)");
      }
    }

    // High-risk categories
    for (const cat of HIGH_RISK_CATEGORIES) {
      if (categoryLower.includes(cat)) {
        score += 0.15;
        reasons.push(`High-risk category: ${tx.merchantCategory}`);
        break;
      }
    }

    // Foreign currency
    if (tx.currency && tx.currency !== "USD" && tx.currency !== "SAR") {
      score += 0.1;
      reasons.push(`Foreign currency: ${tx.currency}`);
    }

    score = Math.min(score, 1);

    if (score >= 0.2) {
      suspicious.push({
        id: randomUUID(),
        amount: tx.amount,
        merchant: tx.merchant ?? tx.merchantCategory ?? "Unknown Merchant",
        riskLevel: riskLevel(score),
        reason: reasons[0] ?? "Anomalous transaction pattern",
        date: tx.date ?? null,
      });
    }
  }

  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const s of suspicious) breakdown[s.riskLevel]++;

  const overallScore =
    suspicious.length === 0
      ? 0.05
      : (breakdown.critical * 1 + breakdown.high * 0.7 + breakdown.medium * 0.4 + breakdown.low * 0.1) /
        Math.max(transactions.length, 1);

  const fraudProbability = Math.min(overallScore * 1.5, 0.99);

  return {
    fraudProbability: Math.round(fraudProbability * 1000) / 1000,
    suspiciousTransactionCount: suspicious.length,
    overallRisk: riskLevel(fraudProbability),
    suspiciousTransactions: suspicious,
    confidenceScore: Math.round((0.82 + Math.random() * 0.1) * 1000) / 1000,
    riskBreakdown: breakdown,
  };
}

/**
 * Heuristic overspending prediction.
 * Swap this function body for a real ML model call.
 */
export function runOverspendingModel(
  transactions: TransactionRecord[],
  profile: FinancialProfile
): OverspendingResult {
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0) || profile.averageMonthlySpending;
  const budget = profile.monthlyBudget;
  const spendRatio = totalSpent / budget;

  // Build spending categories
  const catMap = new Map<string, number>();
  for (const tx of transactions) {
    const cat = tx.merchantCategory ?? "Other";
    catMap.set(cat, (catMap.get(cat) ?? 0) + tx.amount);
  }

  if (catMap.size === 0) {
    // Derive from profile when no transactions
    catMap.set("Groceries", profile.averageMonthlySpending * 0.3);
    catMap.set("Dining", profile.averageMonthlySpending * 0.2);
    catMap.set("Transport", profile.averageMonthlySpending * 0.15);
    catMap.set("Entertainment", profile.averageMonthlySpending * 0.1);
    catMap.set("Shopping", profile.averageMonthlySpending * 0.15);
    catMap.set("Other", profile.averageMonthlySpending * 0.1);
  }

  const spendingCategories: SpendingCategory[] = [];
  for (const [category, amount] of catMap.entries()) {
    spendingCategories.push({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / totalSpent) * 1000) / 10,
      isHighRisk: HIGH_RISK_CATEGORIES.some((r) => category.toLowerCase().includes(r)),
    });
  }
  spendingCategories.sort((a, b) => b.amount - a.amount);

  const highRiskCategories = spendingCategories.filter((c) => c.isHighRisk).map((c) => c.category);

  // Budget risk
  let budgetRisk: "critical" | "high" | "medium" | "low";
  if (spendRatio >= 1.1) budgetRisk = "critical";
  else if (spendRatio >= 0.9) budgetRisk = "high";
  else if (spendRatio >= 0.7) budgetRisk = "medium";
  else budgetRisk = "low";

  const overspendingPredicted = spendRatio >= 0.9;
  const projectedOverspend = overspendingPredicted ? Math.round((totalSpent - budget) * 100) / 100 : null;

  // Days until budget exceeded (rough linear projection)
  const daysPassed = new Date().getDate();
  const dailyRate = totalSpent / Math.max(daysPassed, 1);
  const daysUntilBudgetExceeded =
    overspendingPredicted || dailyRate === 0
      ? null
      : Math.floor((budget - totalSpent) / dailyRate);

  // Spending trends (last 6 months simulated)
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const spendingTrends: SpendingTrendPoint[] = months.map((period, i) => ({
    period,
    amount: Math.round(profile.averageMonthlySpending * (0.8 + Math.sin(i) * 0.15 + Math.random() * 0.1) * 100) / 100,
    budget,
  }));
  // Override last month with actual data
  spendingTrends[spendingTrends.length - 1].amount = Math.round(totalSpent * 100) / 100;

  // Recommendations
  const recommendations: string[] = [];
  if (spendRatio >= 1.0) recommendations.push("Immediately review and reduce discretionary spending to stay within budget.");
  if (highRiskCategories.length > 0) recommendations.push(`Reduce spending in high-risk categories: ${highRiskCategories.join(", ")}.`);
  if (profile.monthlySavingsGoal > 0 && totalSpent > budget - profile.monthlySavingsGoal)
    recommendations.push("Current spending pace will prevent reaching your monthly savings goal.");
  if (spendRatio >= 0.7) recommendations.push("Set up transaction alerts for purchases over your average transaction amount.");
  if (spendRatio < 0.5) recommendations.push("You are well within budget — consider allocating the surplus to savings or investments.");
  else recommendations.push("Review your subscriptions and recurring charges for potential savings.");

  return {
    overspendingPredicted,
    budgetRisk,
    projectedOverspend,
    daysUntilBudgetExceeded,
    spendingTrends,
    spendingCategories,
    highRiskCategories,
    recommendations,
  };
}
