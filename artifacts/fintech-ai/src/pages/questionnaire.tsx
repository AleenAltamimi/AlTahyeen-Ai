import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { usePredictManual, ManualInput } from '@workspace/api-client-react';
import { usePrediction } from '../contexts/PredictionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

const STEPS = [
  { id: 'tx', title: 'Transaction' },
  { id: 'fin', title: 'Finances' },
  { id: 'bhv', title: 'Behavior' },
  { id: 'rev', title: 'Review' },
];

const inputCls =
  'w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

export default function QuestionnairePage() {
  const [, setLocation] = useLocation();
  const { setCurrentPrediction } = usePrediction();
  const predictManualMutation = usePredictManual();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ManualInput> & Record<string, unknown>>({
    transactionAmount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    merchantCategory: 'Groceries',
    paymentMethod: 'credit_card',
    monthlyIncome: 0,
    monthlyBudget: 0,
    monthlySavingsGoal: 0,
    averageMonthlySpending: 0,
    numberOfMonthlyTransactions: 0,
    averageTransactionAmount: 0,
    // Overspending model fields
    financialScenario: 'stable',
    incomeType: 'Salary',
    cashFlowStatus: 'Positive',
    financialStressLevel: 'Low',
    creditScore: 650,
    loanPayment: 0,
    discretionarySpending: 0,
    essentialSpending: 0,
    rentOrMortgage: 0,
    investmentAmount: 0,
    subscriptionServices: 2,
    emergencyFund: 0,
    actualSavings: 0,
  });

  const up = (updates: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    predictManualMutation.mutate(
      { data: formData as ManualInput },
      {
        onSuccess: (result) => {
          setCurrentPrediction(result);
          setLocation('/dashboard');
        },
      }
    );
  };

  const renderStep = () => {
    switch (step) {
      /* ── Step 0: Transaction Details ─────────────────────────────────────── */
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Transaction Amount ($)</label>
              <input
                type="number"
                min={0}
                value={formData.transactionAmount || ''}
                onChange={(e) => up({ transactionAmount: Number(e.target.value) })}
                className={inputCls}
                placeholder="e.g. 150.00"
              />
            </div>
            <div>
              <label className={labelCls}>Transaction Date</label>
              <input
                type="date"
                value={formData.transactionDate || ''}
                onChange={(e) => up({ transactionDate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Merchant Category</label>
              <select
                value={(formData.merchantCategory as string) || 'Groceries'}
                onChange={(e) => up({ merchantCategory: e.target.value })}
                className={inputCls}
              >
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining & Restaurants</option>
                <option value="Travel">Travel & Transport</option>
                <option value="Shopping">Retail & Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Investments">Investments</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Method</label>
              <select
                value={(formData.paymentMethod as string) || 'credit_card'}
                onChange={(e) => up({ paymentMethod: e.target.value })}
                className={inputCls}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="digital_wallet">Digital Wallet</option>
              </select>
            </div>
          </div>
        );

      /* ── Step 1: Financial Information ───────────────────────────────────── */
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monthly Income ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyIncome || ''}
                  onChange={(e) => up({ monthlyIncome: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="5000"
                />
              </div>
              <div>
                <label className={labelCls}>Monthly Budget ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyBudget || ''}
                  onChange={(e) => up({ monthlyBudget: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="3500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Avg Monthly Spending ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.averageMonthlySpending || ''}
                  onChange={(e) => up({ averageMonthlySpending: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="3200"
                />
              </div>
              <div>
                <label className={labelCls}>Savings Goal ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlySavingsGoal || ''}
                  onChange={(e) => up({ monthlySavingsGoal: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Rent / Mortgage ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.rentOrMortgage as number) || ''}
                  onChange={(e) => up({ rentOrMortgage: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="1500"
                />
              </div>
              <div>
                <label className={labelCls}>Loan Payment ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.loanPayment as number) || ''}
                  onChange={(e) => up({ loanPayment: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Income Type</label>
                <select
                  value={(formData.incomeType as string) || 'Salary'}
                  onChange={(e) => up({ incomeType: e.target.value })}
                  className={inputCls}
                >
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Business">Business</option>
                  <option value="Investment">Investment</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Financial Scenario</label>
                <select
                  value={(formData.financialScenario as string) || 'stable'}
                  onChange={(e) => up({ financialScenario: e.target.value })}
                  className={inputCls}
                >
                  <option value="stable">Stable</option>
                  <option value="inflation">Inflation</option>
                  <option value="recession">Recession</option>
                  <option value="growth">Growth</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Credit Score (optional)</label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  value={(formData.creditScore as number) || ''}
                  onChange={(e) => up({ creditScore: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="700"
                />
              </div>
              <div>
                <label className={labelCls}>Investment Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.investmentAmount as number) || ''}
                  onChange={(e) => up({ investmentAmount: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );

      /* ── Step 2: Behavior Information ────────────────────────────────────── */
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monthly Transactions</label>
                <input
                  type="number"
                  min={0}
                  value={formData.numberOfMonthlyTransactions || ''}
                  onChange={(e) => up({ numberOfMonthlyTransactions: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="30"
                />
              </div>
              <div>
                <label className={labelCls}>Avg Transaction ($)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.averageTransactionAmount || ''}
                  onChange={(e) => up({ averageTransactionAmount: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Discretionary Spending ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.discretionarySpending as number) || ''}
                  onChange={(e) => up({ discretionarySpending: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="800"
                />
              </div>
              <div>
                <label className={labelCls}>Essential Spending ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.essentialSpending as number) || ''}
                  onChange={(e) => up({ essentialSpending: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="2400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cash Flow Status</label>
                <select
                  value={(formData.cashFlowStatus as string) || 'Positive'}
                  onChange={(e) => up({ cashFlowStatus: e.target.value })}
                  className={inputCls}
                >
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Financial Stress Level</label>
                <select
                  value={(formData.financialStressLevel as string) || 'Low'}
                  onChange={(e) => up({ financialStressLevel: e.target.value })}
                  className={inputCls}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Subscriptions (count)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.subscriptionServices as number) || ''}
                  onChange={(e) => up({ subscriptionServices: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="3"
                />
              </div>
              <div>
                <label className={labelCls}>Emergency Fund ($)</label>
                <input
                  type="number"
                  min={0}
                  value={(formData.emergencyFund as number) || ''}
                  onChange={(e) => up({ emergencyFund: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="5000"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Actual Savings This Month ($)</label>
              <input
                type="number"
                min={0}
                value={(formData.actualSavings as number) || ''}
                onChange={(e) => up({ actualSavings: Number(e.target.value) })}
                className={inputCls}
                placeholder="300"
              />
            </div>
          </div>
        );

      /* ── Step 3: Review & Submit ──────────────────────────────────────────── */
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Data Summary
              </h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                {[
                  ['Transaction Amount', `$${formData.transactionAmount}`],
                  ['Merchant Category', formData.merchantCategory as string],
                  ['Monthly Income', `$${formData.monthlyIncome}`],
                  ['Monthly Budget', `$${formData.monthlyBudget}`],
                  ['Avg Monthly Spending', `$${formData.averageMonthlySpending}`],
                  ['Income Type', formData.incomeType as string],
                  ['Financial Scenario', formData.financialScenario as string],
                  ['Cash Flow', formData.cashFlowStatus as string],
                  ['Stress Level', formData.financialStressLevel as string],
                  ['Monthly Transactions', String(formData.numberOfMonthlyTransactions)],
                ].map(([label, value]) => (
                  <React.Fragment key={label}>
                    <div className="text-gray-500">{label}</div>
                    <div className="font-semibold text-right capitalize">{value}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            {predictManualMutation.isError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 font-medium">
                Analysis Failed: {String((predictManualMutation.error as any)?.error ?? 'Unknown error')}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-xl overflow-hidden flex flex-col min-h-[540px]">
          {/* Progress header */}
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-col gap-4">
            <h2 className="text-xl font-black text-gray-900">Manual Assessment</h2>
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div
                      className={`h-1.5 rounded-full w-full transition-colors duration-300 ${
                        i <= step ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        i <= step ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-2" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 0 || predictManualMutation.isPending}
              className="px-5 py-2.5 rounded-md font-bold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-5 py-2.5 rounded-md font-bold text-sm text-white bg-primary shadow-sm shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={predictManualMutation.isPending}
                className="px-5 py-2.5 rounded-md font-bold text-sm text-white bg-primary shadow-sm shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {predictManualMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Analysis
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
