import { pgTable, text, timestamp, integer, real, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  inputMethod: text("input_method").notNull(), // 'csv' | 'manual'
  rowCount: integer("row_count"),
  detectedColumns: text("detected_columns").array(),

  // Fraud detection results
  fraudProbability: real("fraud_probability").notNull(),
  suspiciousTransactionCount: integer("suspicious_transaction_count").notNull(),
  overallFraudRisk: text("overall_fraud_risk").notNull(), // 'critical' | 'high' | 'medium' | 'low'
  suspiciousTransactions: jsonb("suspicious_transactions").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  riskBreakdown: jsonb("risk_breakdown").notNull(),

  // Overspending results
  overspendingPredicted: boolean("overspending_predicted").notNull(),
  budgetRisk: text("budget_risk").notNull(),
  projectedOverspend: real("projected_overspend"),
  daysUntilBudgetExceeded: integer("days_until_budget_exceeded"),
  spendingTrends: jsonb("spending_trends").notNull(),
  spendingCategories: jsonb("spending_categories").notNull(),
  highRiskCategories: text("high_risk_categories").array().notNull(),
  recommendations: text("recommendations").array().notNull(),

  // Raw input (for reference)
  inputData: jsonb("input_data"),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
