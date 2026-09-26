'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreateTeacherModal } from './create-teacher-modal';
import { UserPlus, Search, Filter, Loader2, Trash2, Edit3 } from 'lucide-react';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  employee_number: string;
  department: string;
  campus_id: string;
  created_at: string;
}

interface Campus {
  id: string;
  name: string;
}

export function TeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchData() {
    setLoading(true);

    const { data: campusesData } = await supabase.from('campuses').select('id, name');
    if (campusesData) setCampuses(campusesData);

    const { data: teachersData } = await supabase
      .from('teachers')
      .select('*, campuses(name)')
      .order('full_name');

    if (teachersData) {
      setTeachers(teachersData.map(t => ({
        ...t,
        campus_id: t.campuses?.name || 'Unknown'
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTeachers = teachers.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employee_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Teacher Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage academic staff and department assignments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, employee ID or department..."
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
            <p>Loading teachers...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p>No teachers found matching your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Teacher</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Employee #</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Department</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Campus</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-zinc-200 font-medium">{t.full_name}</span>
                        <span className="text-xs text-zinc-500">{t.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.employee_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.campus_id}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
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

      <CreateTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        campuses={campuses}
      />
    </div>
  );
}
