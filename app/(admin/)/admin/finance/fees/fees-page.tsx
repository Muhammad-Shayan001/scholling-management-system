'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeeStructureModal } from './fee-structure-modal';
import { CreditCard, Plus, Loader2, Trash2 } from 'lucide-react';

interface FeeStructure {
  id: string;
  fee_category: string;
  amount: number;
  billing_cycle: string;
  class_id: string;
  class: { name: string; section: string };
}

export function FeesPage() {
  const supabase = createClient();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const [classesRes, structuresRes] = await Promise.all([
      supabase.from('classes').select('id, name, section'),
      supabase.from('fee_structures').select('*, classes(name, section)')
    ]);

    if (classesRes.data) setClasses(classesRes.data);
    if (structuresRes.data) {
      setStructures(structuresRes.data.map(s => ({
        ...s,
        class: s.classes
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Fee Structures</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Define billing categories and amounts for each grade</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Fee Category
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Loading fee structures...</p>
          </div>
        ) : structures.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No fee structures defined yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Category</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Applicable Class</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Amount</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Cycle</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">{s.fee_category}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {s.class?.name} - {s.class?.section}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                      {s.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700">
                        {s.billing_cycle}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeeStructureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        classes={classes}
      />
    </div>
  );
}
