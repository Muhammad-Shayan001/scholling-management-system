'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PaymentModal } from '../payments/payment-modal';
import { Loader2, Receipt, Filter, Search, CheckCircle, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  billing_period: string;
  due_date: string;
  student: { full_name: string };
}

export function InvoicesPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, students(full_name)')
      .order('due_date', { ascending: true });

    if (!error && data) {
      setInvoices(data.map(i => ({
        ...i,
        student: i.students
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = invoices.filter(i =>
    i.student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.billing_period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Invoice Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track student billing and payment status</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by student name or billing period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Student</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Period</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Amount</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Due Date</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Status</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                      {inv.student?.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {inv.billing_period}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                      {inv.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 w-fit ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                      }`}>
                        {inv.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'unpaid' && (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors border border-indigo-100 dark:border-indigo-900/30"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSuccess={fetchData}
        invoice={selectedInvoice ? {
          id: selectedInvoice.id,
          amount: selectedInvoice.amount,
          student_name: selectedInvoice.student?.full_name || 'Unknown Student'
        } : null as any}
      />
    </div>
  );
}
