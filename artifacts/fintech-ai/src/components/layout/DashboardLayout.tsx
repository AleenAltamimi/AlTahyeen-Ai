import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopNav />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
