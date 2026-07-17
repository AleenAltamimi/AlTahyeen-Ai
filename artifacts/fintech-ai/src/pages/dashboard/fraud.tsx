import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { usePrediction } from '../../contexts/PredictionContext';
import { RiskBadge } from '../../components/RiskBadge';
import { Redirect } from 'wouter';
import { AlertOctagon, Info, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function FraudDetail() {
  const { currentPrediction } = usePrediction();

  if (!currentPrediction) {
    return <Redirect href="/dashboard" />;
  }

  const { fraud } = currentPrediction;

  const breakdownData = fraud.riskBreakdown ? [
    { name: 'Critical', count: fraud.riskBreakdown.critical, fill: '#DC2626' },
    { name: 'High', count: fraud.riskBreakdown.high, fill: '#EA580C' },
    { name: 'Medium', count: fraud.riskBreakdown.medium, fill: '#CA8A04' },
    { name: 'Low', count: fraud.riskBreakdown.low, fill: '#16A34A' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fraud Analysis</h1>
          <p className="text-gray-500 mt-1">Deep dive into suspicious patterns and flagged transactions.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-gray-500">Overall Risk</span>
          <RiskBadge risk={fraud.overallRisk} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Risk Distribution</h3>
          {breakdownData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#4B5563" fontSize={13} fontWeight={600} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    {breakdownData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 font-medium">No distribution data available</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#F3F4F6" strokeWidth="12" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="#8B1A1A" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * fraud.fraudProbability)} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{(fraud.fraudProbability * 100).toFixed(0)}%</span>
            </div>
          </div>
          <h3 className="font-bold text-gray-900">Fraud Probability Score</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-[200px]">Based on historical patterns and anomaly detection models.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Suspicious Transactions</h3>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{fraud.suspiciousTransactions.length} Flagged</span>
        </div>
        
        {fraud.suspiciousTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Reason Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fraud.suspiciousTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{tx.merchant}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-right">${tx.amount.toFixed(2)}</td>
                    <td className="px-6 py-4"><RiskBadge risk={tx.riskLevel} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded text-xs font-medium">
                        <AlertOctagon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        {tx.reason}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-green-500 mb-4" />
            <h4 className="text-lg font-bold text-gray-900">No Suspicious Activity</h4>
            <p className="text-gray-500 text-sm mt-1">All transactions appear normal and align with your profile.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

