import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { usePrediction } from '../../contexts/PredictionContext';
import { RiskBadge } from '../../components/RiskBadge';
import { Redirect } from 'wouter';
import { AlertCircle, Target, TrendingUp, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function BudgetDetail() {
  const { currentPrediction } = usePrediction();

  if (!currentPrediction) {
    return <Redirect href="/dashboard" />;
  }

  const { overspending } = currentPrediction;

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Budget Forecast</h1>
          <p className="text-gray-500 mt-1">Predictive analysis of your spending trajectory and budget health.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-gray-500">Budget Risk</span>
          <RiskBadge risk={overspending.budgetRisk} />
        </div>
      </div>

      {overspending.overspendingPredicted && (
        <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl flex items-start gap-4 mb-8">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-orange-900 font-bold text-lg">Overspending Alert</h3>
            <p className="text-orange-800 text-sm mt-1">
              You are projected to exceed your budget by <strong>${overspending.projectedOverspend?.toLocaleString()}</strong> in <strong>{overspending.daysUntilBudgetExceeded} days</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Spending Trajectory</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overspending.spendingTrends} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1A1A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8B1A1A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#8B1A1A" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                <Line type="step" dataKey="budget" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" /> AI Recommendations
          </h3>
          <ul className="space-y-4 flex-1">
            {overspending.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">{i+1}</span>
                <span className="text-gray-700 leading-relaxed pt-0.5">{rec}</span>
              </li>
            ))}
            {overspending.recommendations.length === 0 && (
              <p className="text-gray-500 text-sm text-center my-auto">Looking good. No specific recommendations at this time.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Category Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {overspending.spendingCategories.map((cat, i) => (
            <div key={i} className={`border rounded-lg p-4 ${cat.isHighRisk ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-gray-900 capitalize">{cat.category}</h4>
                {cat.isHighRisk && <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded">High Risk</span>}
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-black text-gray-900">${cat.amount.toLocaleString()}</span>
                <span className="text-sm font-semibold text-gray-500 mb-1">{cat.percentage}% of total</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${cat.isHighRisk ? 'bg-orange-500' : 'bg-primary'}`} 
                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
