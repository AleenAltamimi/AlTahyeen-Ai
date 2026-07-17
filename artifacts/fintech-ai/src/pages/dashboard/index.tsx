import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { usePrediction } from '../../contexts/PredictionContext';
import { RiskBadge } from '../../components/RiskBadge';
import { AlertTriangle, TrendingDown, Target, ShieldCheck, CreditCard, ChevronRight, FileText } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useGetPrediction } from '@workspace/api-client-react';

export default function Dashboard() {
  const { currentPrediction } = usePrediction();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const idFromUrl = searchParams.get('id');

  const { data: fetchedPrediction, isLoading } = useGetPrediction(idFromUrl || '', {
    query: { enabled: !!idFromUrl, queryKey: ['getPrediction', idFromUrl || ''] }
  });

  const prediction = idFromUrl ? fetchedPrediction : currentPrediction;

  if (!prediction && !isLoading && !idFromUrl) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Prediction</h2>
          <p className="text-gray-500 mb-6 max-w-md">Run an analysis by uploading your transaction data or filling out the manual questionnaire.</p>
          <div className="flex gap-4">
            <Link href="/upload" className="bg-primary text-white px-5 py-2 rounded font-bold text-sm shadow hover:bg-primary/90">Upload CSV</Link>
            <Link href="/questionnaire" className="bg-white border border-gray-200 text-gray-800 px-5 py-2 rounded font-bold text-sm shadow-sm hover:bg-gray-50">Manual Input</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading && idFromUrl) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!prediction) return null;

  const { fraud, overspending } = prediction;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Overview</h1>
        <p className="text-gray-500 mt-1">Generated {new Date(prediction.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fraud Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 opacity-50"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Fraud Detection</h2>
            </div>
            <RiskBadge risk={fraud.overallRisk} />
          </div>

          <div className="flex-1">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-gray-900">{(fraud.fraudProbability * 100).toFixed(1)}%</span>
              <span className="text-sm font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Probability</span>
            </div>
            <p className="text-sm text-gray-600">
              Found <strong className="text-gray-900">{fraud.suspiciousTransactionCount}</strong> suspicious transactions requiring review.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/dashboard/fraud" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View Detailed Fraud Report <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Budget Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Budget Forecast</h2>
            </div>
            <RiskBadge risk={overspending.budgetRisk} />
          </div>

          <div className="flex-1">
            <div className="flex items-end gap-3 mb-2">
              {overspending.overspendingPredicted ? (
                <>
                  <span className="text-4xl font-black text-orange-600">${overspending.projectedOverspend?.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Projected Overspend</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black text-green-600">On Track</span>
                  <span className="text-sm font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {overspending.daysUntilBudgetExceeded 
                ? `Budget will be exceeded in ${overspending.daysUntilBudgetExceeded} days at current rate.` 
                : 'Spending is within healthy limits.'}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/dashboard/budget" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View Detailed Budget Forecast <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Meta info strip */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-wrap items-center gap-8 justify-between">
        <div className="flex gap-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Input Method</p>
            <p className="text-sm font-bold text-gray-900 capitalize flex items-center gap-2">
              {prediction.inputMethod === 'csv' ? <CreditCard className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
              {prediction.inputMethod}
            </p>
          </div>
          {prediction.rowCount && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rows Analyzed</p>
              <p className="text-sm font-bold text-gray-900">{prediction.rowCount.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence Score</p>
            <p className="text-sm font-bold text-gray-900">{(prediction.fraud.confidenceScore * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

