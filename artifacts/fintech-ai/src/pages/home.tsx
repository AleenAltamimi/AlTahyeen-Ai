import React from 'react';
import { Shield, ArrowRight, Activity, UploadCloud, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="h-20 border-b border-gray-100 flex items-center px-12 justify-between">
        <div className="flex items-center gap-2 text-primary font-black text-xl tracking-tight">
          <Shield className="w-7 h-7 fill-primary text-primary" />
          <span>AlTahyeen AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/history" className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
            History
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/upload" className="bg-primary text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
            Analyze Data
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-12 gap-16 max-w-7xl mx-auto w-full py-12">
        <div className="flex-1 flex flex-col gap-8 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-primary font-bold tracking-wider text-sm uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Financial Intelligence Platform
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black text-gray-900 leading-[1.1] tracking-tight"
          >
            Predict. Protect. Prevent.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 leading-relaxed max-w-lg"
          >
            Your 24/7 personal fraud analyst and budget advisor. Upload your transactions or complete a financial profile to instantly reveal hidden risks, predict overspending, and secure your financial future.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 mt-4"
          >
            <Link href="/upload" className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-lg text-base font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:bg-primary/90 transition-all hover:-translate-y-0.5">
              <UploadCloud className="w-5 h-5" />
              Upload CSV
            </Link>
            <Link href="/questionnaire" className="flex items-center gap-2 bg-white text-gray-900 border-2 border-gray-200 px-6 py-4 rounded-lg text-base font-bold hover:border-gray-300 hover:bg-gray-50 transition-all">
              <FileText className="w-5 h-5 text-gray-500" />
              Manual Input
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex-1 w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden shadow-gray-200/50">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary fill-primary" />
                <span className="text-white font-bold text-sm">LIVE SIGNAL</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                ACTIVE
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Total Tx Analyzed</p>
                  <p className="text-3xl font-black text-gray-900">1,248,930</p>
                </div>
                <Activity className="w-8 h-8 text-primary mb-1 opacity-20" />
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-600 text-sm">Model Precision</span>
                  <span className="font-bold text-primary text-lg">99.9%</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-600 text-sm">Avg Decision Time</span>
                  <span className="font-bold text-gray-900 text-lg">47ms</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
