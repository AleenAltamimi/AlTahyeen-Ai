import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useListPredictions } from '@workspace/api-client-react';
import { RiskBadge } from '../components/RiskBadge';
import { Link } from 'wouter';
import { Calendar, FileText, CreditCard, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function History() {
  const { data: predictions, isLoading, isError } = useListPredictions({
    query: { queryKey: ['listPredictions'] }
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analysis History</h1>
        <p className="text-gray-500 mt-1">View all your past predictions and financial health reports.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading history...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-600">Failed to load prediction history.</div>
        ) : !predictions || predictions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Activity className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No history found</h3>
            <p className="text-gray-500 mt-1">Run an analysis to see your past reports here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Input Method</th>
                <th className="px-6 py-4">Fraud Risk</th>
                <th className="px-6 py-4">Budget Risk</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predictions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(p.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 capitalize">
                      {p.inputMethod === 'csv' ? <CreditCard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {p.inputMethod}
                      {p.rowCount && <span className="text-xs text-gray-400 ml-1">({p.rowCount} rows)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge risk={p.overallFraudRisk} />
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge risk={p.budgetRisk || 'low'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard?id=${p.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
