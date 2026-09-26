'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreateClassModal } from './create-class-modal';
import { School, Plus, Loader2, Trash2, BookOpen } from 'lucide-react';

interface ClassRecord {
  id: string;
  name: string;
  section: string;
  academic_year: string;
  campus: { name: string };
  class_teacher: { full_name: string } | null;
}

export function AcademicPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);

    const [campusesRes, teachersRes, classesRes] = await Promise.all([
      supabase.from('campuses').select('id, name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
      supabase.from('classes').select('*, campuses(name), profiles(full_name)').order('name')
    ]);

    if (campusesRes.data) setCampuses(campusesRes.data);
    if (teachersRes.data) setTeachers(teachersRes.data);
    if (classesRes.data) {
      setClasses(classesRes.data.map(c => ({
        id: c.id,
        name: c.name,
        section: c.section,
        academic_year: c.academic_year,
        campus: c.campuses,
        class_teacher: c.profiles,
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Academic Structure</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Define grades, sections, and assign class teachers</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
              <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Current Classes</h2>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading academic structure...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <School className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No classes defined yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Class & Section</th>
                      <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Campus</th>
                      <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Class Teacher</th>
                      <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {classes.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-zinc-900 dark:text-zinc-200 font-medium">
                              {c.name} - {c.section}
                            </span>
                            <span className="text-xs text-zinc-500">{c.academic_year}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {c.campus?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {c.class_teacher?.full_name || 'Not Assigned'}
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
        </div>

        {/* Subjects Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Quick Subject Add
              </h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Define subjects that can be assigned to classes.
            </p>
            {/* Subject Form would go here */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
              <p className="text-xs text-zinc-400 italic">Subject management module coming in the next step</p>
            </div>
          </div>
        </div>
      </div>

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        campuses={campuses}
        teachers={teachers}
      />
    </div>
  );
}

function Edit3(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>; }
function Trash2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>; }
