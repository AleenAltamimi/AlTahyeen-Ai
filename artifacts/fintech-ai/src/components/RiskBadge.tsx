import React from 'react';

export function RiskBadge({ risk }: { risk: string }) {
  const normalized = risk.toLowerCase();
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  if (normalized === 'critical') colorClass = 'bg-red-50 text-red-700 border-red-200';
  if (normalized === 'high') colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
  if (normalized === 'medium') colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (normalized === 'low') colorClass = 'bg-green-50 text-green-700 border-green-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colorClass}`}>
      {risk}
    </span>
  );
}
