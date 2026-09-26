'use client';

import { useState } from 'react';
import { enrollStudent } from './enrollment-actions';
import { Loader2, UserCheck, X } from 'lucide-react';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  studentName: string;
  classes: { id: string; name: string; section: string; academic_year: string }[];
}

export function EnrollmentModal({ isOpen, onClose, onSuccess, studentId, studentName, classes }: EnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    class_id: classes[0]?.id || '',
    academic_year: classes[0]?.academic_year || '2026-2027',
    roll_number: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await enrollStudent({
      student_id: studentId,
      class_id: formData.class_id,
      academic_year: formData.academic_year,
      roll_number: formData.roll_number,
    });

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Student enrolled successfully!' });
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
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Enroll Student
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Enrolling Student:</p>
            <p className="font-medium text-zinc-900 dark:text-white">{studentName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Select Class *</label>
            <select
              required
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section} ({c.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Roll Number</label>
            <input
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 101"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
