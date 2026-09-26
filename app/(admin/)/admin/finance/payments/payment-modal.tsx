'use client';

import { useState } from 'react';
import { recordPayment } from './actions';
import { Loader2, X, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: { id: string; amount: number; student_name: string };
}

export function PaymentModal({ isOpen, onClose, onSuccess, invoice }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount_paid: invoice?.amount || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'online',
    transaction_id: '',
    notes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await recordPayment({
      ...formData,
      invoice_id: invoice.id,
    });

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Payment recorded successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Record Payment
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Student</p>
            <p className="font-medium text-zinc-900 dark:text-white">{invoice.student_name}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Invoice Amount: {invoice.amount}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount Paid</label>
              <input
                required
                type="number"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
              <input
                required
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Transaction ID / Ref</label>
            <input
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
