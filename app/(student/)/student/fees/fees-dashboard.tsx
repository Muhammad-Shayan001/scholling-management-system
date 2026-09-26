'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Receipt, CheckCircle, Clock, Download, CreditCard } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  billing_period: string;
  due_date: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
}

export function StudentFeesDashboard() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, paid: 0, outstanding: 0 });

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Get current user's student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) return;

      // 2. Fetch Invoices
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false });

      // 3. Fetch Payments
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', 'invoices.id') // This is simplified; normally we join or filter by student_id via invoices
        // To properly get payments for a student, we join with invoices
        // In a real app, we'd use a view or a complex query
        // For this demo, let's assume a join or a stored procedure
        .select('*, invoices!inner(student_id)')
        .eq('invoices.student_id', student.id);

      if (invData) {
        setInvoices(invData);
        const total = invData.reduce((sum, inv) => sum + inv.amount, 0);
        const paid = invData.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
        setSummary({ total, paid, outstanding: total - paid });
      }

      if (payData) setPayments(payData);

    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Fees & Payments</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track your academic dues and payment history</p>
        </div>
        <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-medium">
          <Download className="w-4 h-4" />
          Download Statement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Billed</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm border-l-4 border-l-green-500">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.paid}</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm border-l-4 border-l-red-500">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Outstanding Balance</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.outstanding}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoices Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            My Invoices
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading billing data...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-200">{inv.billing_period}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{inv.amount}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{new Date(inv.due_date).toLocaleDateString()}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Payment History
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
            {payments.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((pay) => (
                  <div key={pay.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{pay.amount}</p>
                      <p className="text-xs text-zinc-500">{new Date(pay.payment_date).toLocaleDateString()} • {pay.payment_method}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>; }
