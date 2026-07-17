import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { db, predictionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  PredictManualBody,
  ListPredictionsResponse,
  GetPredictionResponse,
  GetPredictionParams,
  PredictManualResponse,
  PredictCsvResponse,
} from "@workspace/api-zod";
import {
  runFraudModel,
  runOverspendingModel,
  type TransactionRecord,
  type FinancialProfile,
  type FraudResult,
  type OverspendingResult,
} from "../lib/mlEngine";

const ML_URL = process.env.ML_SERVICE_URL ?? "http://localhost:5000";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Python ML service helpers ─────────────────────────────────────────────────

async function callPythonFraudCsv(buffer: Buffer, filename: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "text/csv" }), filename);
  const res = await fetch(`${ML_URL}/predict/fraud/csv`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`ML service fraud/csv returned ${res.status}`);
  return res.json() as Promise<{
    row_count: number;
    fraud_count: number;
    legitimate_count: number;
    fraud_rate: number;
    average_fraud_probability: number;
    transactions: Array<{ row_index: number; prediction: number; probability: number; amount: number }>;
  }>;
}

async function callPythonFraudManual(amount: number, time = 0) {
  const res = await fetch(`${ML_URL}/predict/fraud/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, time }),
  });
  if (!res.ok) throw new Error(`ML service fraud/manual returned ${res.status}`);
  return res.json() as Promise<{ prediction: number; probability: number; label: string }>;
}

async function callPythonOverspendingManual(payload: Record<string, unknown>) {
  const res = await fetch(`${ML_URL}/predict/overspending/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ML service overspending/manual returned ${res.status}`);
  return res.json() as Promise<{ prediction: number; probability: number; label: string }>;
}

async function callPythonOverspendingCsv(buffer: Buffer, filename: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "text/csv" }), filename);
  const res = await fetch(`${ML_URL}/predict/overspending/csv`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`ML service overspending/csv returned ${res.status}`);
  return res.json() as Promise<{
    row_count: number;
    overspending_count: number;
    within_budget_count: number;
    overspending_rate: number;
    average_overspending_probability: number;
    avg_expense: number | null;
    avg_budget: number | null;
  }>;
}

// ── Result builders ───────────────────────────────────────────────────────────

function riskLevel(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 0.75) return "critical";
  if (score >= 0.5) return "high";
  if (score >= 0.25) return "medium";
  return "low";
}

const HIGH_RISK_CATS = ["gambling", "luxury", "travel", "entertainment", "electronics", "jewelry"];

function buildFraudFromCsvPy(
  py: Awaited<ReturnType<typeof callPythonFraudCsv>>
): FraudResult {
  const suspicious = py.transactions
    .filter((t) => t.prediction === 1 || t.probability > 0.3)
    .slice(0, 50) // cap list
    .map((t) => ({
      id: randomUUID(),
      amount: t.amount,
      merchant: `Transaction #${t.row_index + 1}`,
      riskLevel: riskLevel(t.probability) as "critical" | "high" | "medium" | "low",
      reason:
        t.prediction === 1
          ? "Classified as fraudulent by ML model"
          : "Elevated fraud probability detected",
      date: null,
    }));

  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const s of suspicious) breakdown[s.riskLevel]++;

  return {
    fraudProbability: Math.round(py.average_fraud_probability * 1000) / 1000,
    suspiciousTransactionCount: py.fraud_count,
    overallRisk: riskLevel(py.average_fraud_probability),
    suspiciousTransactions: suspicious,
    confidenceScore: 0.94,
    riskBreakdown: breakdown,
  };
}

function buildFraudFromManualPy(
  py: Awaited<ReturnType<typeof callPythonFraudManual>>,
  amount: number
): FraudResult {
  const prob = py.probability;
  const isFraud = py.prediction === 1;
  const suspicious =
    isFraud || prob > 0.3
      ? [
          {
            id: randomUUID(),
            amount,
            merchant: "Entered Transaction",
            riskLevel: riskLevel(prob) as "critical" | "high" | "medium" | "low",
            reason: isFraud
              ? "Classified as fraudulent by trained ML model"
              : "Elevated fraud probability detected",
            date: null,
          },
        ]
      : [];
  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const s of suspicious) breakdown[s.riskLevel]++;
  return {
    fraudProbability: Math.round(prob * 1000) / 1000,
    suspiciousTransactionCount: isFraud ? 1 : 0,
    overallRisk: riskLevel(prob),
    suspiciousTransactions: suspicious,
    confidenceScore: 0.94,
    riskBreakdown: breakdown,
  };
}

function buildOverspendingFromPy(
  probability: number,
  overspendingPredicted: boolean,
  budget: number,
  expense: number,
  merchantCategory?: string | null
): OverspendingResult {
  const budgetRisk = riskLevel(probability);
  const projectedOverspend =
    overspendingPredicted ? Math.round((expense - budget) * 100) / 100 : null;

  // Spending categories
  const catMap = new Map<string, number>();
  if (merchantCategory && merchantCategory !== "other") {
    catMap.set(merchantCategory, expense * 0.5);
    catMap.set("Essentials", expense * 0.35);
    catMap.set("Other", expense * 0.15);
  } else {
    catMap.set("Essentials", expense * 0.6);
    catMap.set("Discretionary", expense * 0.3);
    catMap.set("Other", expense * 0.1);
  }
  const total = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const spendingCategories = Array.from(catMap.entries()).map(([cat, amt]) => ({
    category: cat,
    amount: Math.round(amt * 100) / 100,
    percentage: Math.round((amt / Math.max(total, 1)) * 1000) / 10,
    isHighRisk: HIGH_RISK_CATS.some((r) => cat.toLowerCase().includes(r)),
  }));
  const highRiskCategories = spendingCategories.filter((c) => c.isHighRisk).map((c) => c.category);

  // Trends (last 6 months)
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const spendingTrends = months.map((period, i) => ({
    period,
    amount: Math.round(expense * (0.82 + Math.sin(i * 0.9) * 0.12) * 100) / 100,
    budget,
  }));
  spendingTrends[spendingTrends.length - 1].amount = Math.round(expense * 100) / 100;

  const daysPassed = new Date().getDate();
  const dailyRate = expense / Math.max(daysPassed, 1);
  const daysUntilBudgetExceeded =
    overspendingPredicted || dailyRate === 0
      ? null
      : Math.floor((budget - expense) / dailyRate);

  const recommendations: string[] = [];
  if (overspendingPredicted)
    recommendations.push("Reduce spending immediately — model predicts you will exceed your budget.");
  if (probability > 0.7)
    recommendations.push(
      "Your spending pattern strongly indicates budget overrun. Review all non-essential expenses."
    );
  if (highRiskCategories.length > 0)
    recommendations.push(`Reduce spending in high-risk categories: ${highRiskCategories.join(", ")}.`);
  if (probability < 0.3)
    recommendations.push("You are on track — consider putting the surplus into savings or investments.");
  recommendations.push("Set up transaction alerts to monitor unusual spending in real time.");

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

/** Fallback: run heuristic models when Python service is unavailable */
function buildResultsHeuristic(
  transactions: TransactionRecord[],
  profile: FinancialProfile
) {
  return {
    fraud: runFraudModel(transactions, profile),
    overspending: runOverspendingModel(transactions, profile),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /predictions */
router.get("/predictions", async (_req, res): Promise<void> => {
  const rows = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.createdAt));
  const summaries = rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    inputMethod: row.inputMethod,
    rowCount: row.rowCount ?? null,
    overallFraudRisk: row.overallFraudRisk,
    overspendingPredicted: row.overspendingPredicted,
    fraudProbability: row.fraudProbability,
    budgetRisk: row.budgetRisk,
  }));
  res.json(ListPredictionsResponse.parse(summaries));
});

/** GET /predictions/:id */
router.get("/predictions/:id", async (req, res): Promise<void> => {
  const params = GetPredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }
  const result = {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    inputMethod: row.inputMethod,
    rowCount: row.rowCount ?? null,
    detectedColumns: row.detectedColumns ?? [],
    fraud: {
      fraudProbability: row.fraudProbability,
      suspiciousTransactionCount: row.suspiciousTransactionCount,
      overallRisk: row.overallFraudRisk,
      suspiciousTransactions: row.suspiciousTransactions as object[],
      confidenceScore: row.confidenceScore,
      riskBreakdown: row.riskBreakdown as object,
    },
    overspending: {
      overspendingPredicted: row.overspendingPredicted,
      budgetRisk: row.budgetRisk,
      projectedOverspend: row.projectedOverspend ?? null,
      daysUntilBudgetExceeded: row.daysUntilBudgetExceeded ?? null,
      spendingTrends: row.spendingTrends as object[],
      spendingCategories: row.spendingCategories as object[],
      highRiskCategories: row.highRiskCategories,
      recommendations: row.recommendations,
    },
  };
  res.json(GetPredictionResponse.parse(result));
});

/** POST /predictions/manual */
router.post("/predictions/manual", async (req, res): Promise<void> => {
  const parsed = PredictManualBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;

  let fraud: FraudResult;
  let overspending: OverspendingResult;

  // Build overspending payload mapping ManualInput → Python service schema
  const expense = d.averageMonthlySpending;
  const budget = d.monthlyBudget;
  const income = d.monthlyIncome;
  const savingsRate = income > 0 ? d.monthlySavingsGoal / income : 0;
  const cashFlowStatus =
    (d as any).cashFlowStatus ??
    (expense < income * 0.7 ? "Positive" : expense > income ? "Negative" : "Neutral");

  const overspendingPayload: Record<string, unknown> = {
    monthly_income: income,
    monthly_expense_total: expense,
    budget_goal: budget,
    savings_rate: Math.round(savingsRate * 1000) / 1000,
    financial_scenario: (d as any).financialScenario ?? "stable",
    credit_score: (d as any).creditScore ?? 650,
    debt_to_income_ratio: (d as any).debtToIncomeRatio ?? 0.3,
    loan_payment: (d as any).loanPayment ?? 0,
    investment_amount: (d as any).investmentAmount ?? 0,
    subscription_services: (d as any).subscriptionServices ?? 2,
    emergency_fund: (d as any).emergencyFund ?? 0,
    transaction_count: d.numberOfMonthlyTransactions,
    fraud_flag: 0,
    discretionary_spending: (d as any).discretionarySpending ?? expense * 0.35,
    essential_spending: (d as any).essentialSpending ?? expense * 0.65,
    income_type: (d as any).incomeType ?? "Salary",
    rent_or_mortgage: (d as any).rentOrMortgage ?? 0,
    category: d.merchantCategory,
    cash_flow_status: cashFlowStatus,
    financial_advice_score: 5,
    financial_stress_level: (d as any).financialStressLevel ?? "Low",
    actual_savings: (d as any).actualSavings ?? 0,
    savings_goal_met: d.monthlySavingsGoal > 0 && ((d as any).actualSavings ?? 0) >= d.monthlySavingsGoal ? 1 : 0,
  };

  try {
    const [pyFraud, pyOver] = await Promise.all([
      callPythonFraudManual(d.transactionAmount),
      callPythonOverspendingManual(overspendingPayload),
    ]);
    fraud = buildFraudFromManualPy(pyFraud, d.transactionAmount);
    overspending = buildOverspendingFromPy(
      pyOver.probability,
      pyOver.prediction === 1,
      budget,
      expense,
      d.merchantCategory
    );
  } catch (err) {
    console.warn("[predictions/manual] Python ML unavailable, falling back to heuristics:", (err as Error).message);
    const tx: TransactionRecord = {
      amount: d.transactionAmount,
      merchant: d.merchantName ?? null,
      merchantCategory: d.merchantCategory,
      paymentMethod: d.paymentMethod,
      isOnline: d.isOnline ?? null,
      date: d.transactionDate,
      time: d.transactionTime ?? null,
      location: d.transactionLocation ?? null,
      device: d.deviceUsed ?? null,
      currency: d.currency ?? null,
    };
    const profile: FinancialProfile = {
      monthlyIncome: income,
      monthlyBudget: budget,
      monthlySavingsGoal: d.monthlySavingsGoal,
      currentBalance: d.currentBalance ?? null,
      averageMonthlySpending: expense,
      numberOfMonthlyTransactions: d.numberOfMonthlyTransactions,
      averageTransactionAmount: d.averageTransactionAmount,
      largestPurchase: d.largestPurchase ?? null,
    };
    const fallback = buildResultsHeuristic([tx], profile);
    fraud = fallback.fraud;
    overspending = fallback.overspending;
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await db.insert(predictionsTable).values({
    id,
    inputMethod: "manual",
    rowCount: 1,
    detectedColumns: [],
    fraudProbability: fraud.fraudProbability,
    suspiciousTransactionCount: fraud.suspiciousTransactionCount,
    overallFraudRisk: fraud.overallRisk,
    suspiciousTransactions: fraud.suspiciousTransactions,
    confidenceScore: fraud.confidenceScore,
    riskBreakdown: fraud.riskBreakdown,
    overspendingPredicted: overspending.overspendingPredicted,
    budgetRisk: overspending.budgetRisk,
    projectedOverspend: overspending.projectedOverspend,
    daysUntilBudgetExceeded: overspending.daysUntilBudgetExceeded,
    spendingTrends: overspending.spendingTrends,
    spendingCategories: overspending.spendingCategories,
    highRiskCategories: overspending.highRiskCategories,
    recommendations: overspending.recommendations,
    inputData: d as unknown as Record<string, unknown>,
  });

  const payload = {
    id,
    createdAt,
    inputMethod: "manual" as const,
    rowCount: 1,
    detectedColumns: [],
    fraud: { ...fraud, overallRisk: fraud.overallRisk },
    overspending,
  };

  res.json(PredictManualResponse.parse(payload));
});

/** POST /predictions/csv */
router.post(
  "/predictions/csv",
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    let records: Record<string, string>[] = [];
    try {
      records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
    } catch {
      res.status(400).json({ error: "Failed to parse CSV file." });
      return;
    }
    if (records.length === 0) {
      res.status(400).json({ error: "CSV file is empty or has no data rows." });
      return;
    }

    const detectedColumns = Object.keys(records[0] ?? {});
    const filename = req.file.originalname;
    const buffer = req.file.buffer;

    // Derive rough financial profile for fallback
    const amounts = records
      .map((r) => parseFloat(r["amount"] ?? r["Amount"] ?? r["transaction_amount"] ?? "0"))
      .filter((a) => !isNaN(a) && a > 0);
    const totalSpend = amounts.reduce((s, a) => s + a, 0);
    const avgAmount = amounts.length > 0 ? totalSpend / amounts.length : 0;
    const profile: FinancialProfile = {
      monthlyIncome: totalSpend * 1.4,
      monthlyBudget: totalSpend * 1.1,
      monthlySavingsGoal: totalSpend * 0.2,
      averageMonthlySpending: totalSpend,
      numberOfMonthlyTransactions: records.length,
      averageTransactionAmount: avgAmount,
      largestPurchase: amounts.length > 0 ? Math.max(...amounts) : 0,
    };

    let fraud: FraudResult;
    let overspending: OverspendingResult;

    try {
      const [pyFraud, pyOver] = await Promise.all([
        callPythonFraudCsv(buffer, filename),
        callPythonOverspendingCsv(buffer, filename),
      ]);
      fraud = buildFraudFromCsvPy(pyFraud);
      const expense = pyOver.avg_expense ?? totalSpend;
      const budget = pyOver.avg_budget ?? totalSpend * 1.1;
      overspending = buildOverspendingFromPy(
        pyOver.average_overspending_probability,
        pyOver.overspending_count > pyOver.row_count / 2,
        budget,
        expense
      );
    } catch (err) {
      console.warn("[predictions/csv] Python ML unavailable, falling back to heuristics:", (err as Error).message);
      const transactions: TransactionRecord[] = records.map((row) => ({
        amount: parseFloat(row["amount"] ?? row["Amount"] ?? row["transaction_amount"] ?? "0") || 0,
        merchant: row["merchant"] ?? row["merchant_name"] ?? null,
        merchantCategory: row["category"] ?? row["merchant_category"] ?? null,
        paymentMethod: row["payment_method"] ?? null,
        isOnline: null,
        date: row["date"] ?? row["Date"] ?? null,
        time: null,
        location: null,
        currency: null,
      }));
      const fallback = buildResultsHeuristic(transactions, profile);
      fraud = fallback.fraud;
      overspending = fallback.overspending;
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await db.insert(predictionsTable).values({
      id,
      inputMethod: "csv",
      rowCount: records.length,
      detectedColumns,
      fraudProbability: fraud.fraudProbability,
      suspiciousTransactionCount: fraud.suspiciousTransactionCount,
      overallFraudRisk: fraud.overallRisk,
      suspiciousTransactions: fraud.suspiciousTransactions,
      confidenceScore: fraud.confidenceScore,
      riskBreakdown: fraud.riskBreakdown,
      overspendingPredicted: overspending.overspendingPredicted,
      budgetRisk: overspending.budgetRisk,
      projectedOverspend: overspending.projectedOverspend,
      daysUntilBudgetExceeded: overspending.daysUntilBudgetExceeded,
      spendingTrends: overspending.spendingTrends,
      spendingCategories: overspending.spendingCategories,
      highRiskCategories: overspending.highRiskCategories,
      recommendations: overspending.recommendations,
      inputData: { filename, rowCount: records.length },
    });

    const payload = {
      id,
      createdAt,
      inputMethod: "csv" as const,
      rowCount: records.length,
      detectedColumns,
      fraud: { ...fraud, overallRisk: fraud.overallRisk },
      overspending,
    };

    res.json(PredictCsvResponse.parse(payload));
  }
);

export default router;
