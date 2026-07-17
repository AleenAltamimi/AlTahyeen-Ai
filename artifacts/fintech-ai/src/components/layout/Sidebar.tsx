import React from 'react';
import { Shield, LayoutDashboard, AlertTriangle, PieChart, History, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/fraud', label: 'Fraud Detection', icon: AlertTriangle },
    { href: '/dashboard/budget', label: 'Budget Forecast', icon: PieChart },
    { href: '/history', label: 'History', icon: History },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
          <Shield className="w-6 h-6 fill-primary text-primary" />
          <span>AlTahyeen AI</span>
        </Link>
      </div>
      
      <div className="p-4 flex-1 flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
