'use client';

import { useState, useEffect } from 'react';
import { getFinancialMetrics, getCampusRevenue } from './actions';
import { Loader2, TrendingUp, AlertCircle, Wallet, PieChart } from 'lucide-react';

export function FinancialReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [campusData, setCampusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, campusRes] = await Promise.all([
        getFinancialMetrics(),
        getCampusRevenue()
      ]);

      if (metricsRes.error) throw new Error(metricsRes.error);
      if (campusRes.error) throw new Error(campusRes.error);

      setMetrics(metricsRes.metrics);
      setCampusData(campusRes.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p>Generating financial reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Financial Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Revenue tracking and collection metrics</p>
        </div>
        <button
          onClick={loadReports}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Billed</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics?.totalBilled}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Collected</p>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics?.totalCollected}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Outstanding</p>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{metrics?.totalOutstanding}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <PieChart className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Collection Rate</p>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics?.collectionRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Analysis */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Overdue Attention
          </h2>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue Invoices</p>
              <p className="text-xs text-red-500/70">Requires immediate follow-up</p>
            </div>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{metrics?.overdueCount}</p>
          </div>
        </div>

        {/* Campus Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Revenue by Campus
          </h2>
          <div className="space-y-4">
            {Object.entries(campusData || {}).map(([campusId, amount]: [string, any]) => (
              <div key={campusId} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Campus ID: {campusId}</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{amount}</span>
              </div>
            ))}
            {Object.keys(campusData || {}).length === 0 && (
              <p className="text-center text-sm text-zinc-500 py-8 italic">No campus data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>; }
