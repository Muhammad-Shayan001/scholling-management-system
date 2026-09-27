'use client';

import { useState, useEffect } from 'react';
import { createCourse, createModule, createAssignment, CourseInput, ModuleInput, AssignmentInput } from '@/lib/lms/actions';
import {
  BookOpen,
  Plus,
  FolderPlus,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';

export function TeacherLMSDashboard() {
  const [activeTab, setActiveTab] = useState<'courses' | 'modules' | 'assignments'>('courses');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Course Form State
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    organization_id: '',
    campus_id: '',
    teacher_id: '',
  });

  // Module Form State
  const [moduleForm, setModuleForm] = useState({
    course_id: '',
    title: '',
    content: '',
    order: 1,
  });

  // Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    course_id: '',
    title: '',
    description: '',
    max_marks: 100,
    deadline: '',
    attachment_url: '',
  });

  async function handleCreateCourse() {
    setLoading(true);
    setMessage(null);
    const res = await createCourse(courseForm);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setCourseForm({ name: '', description: '', organization_id: '', campus_id: '', teacher_id: '' });
    }
    setLoading(false);
  }

  async function handleCreateModule() {
    setLoading(true);
    setMessage(null);
    const res = await createModule(moduleForm);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Module added successfully!' });
      setModuleForm({ course_id: '', title: '', content: '', order: 1 });
    }
    setLoading(false);
  }

  async function handleCreateAssignment() {
    setLoading(true);
    setMessage(null);
    const res = await createAssignment(assignmentForm);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Assignment posted successfully!' });
      setAssignmentForm({ course_id: '', title: '', description: '', max_marks: 100, deadline: '', attachment_url: '' });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">LMS Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Design your curriculum, organize modules, and manage student assignments.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800">
        {(['courses', 'modules', 'assignments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Save className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            {activeTab === 'courses' && <BookOpen className="w-5 h-5 text-indigo-500" />}
            {activeTab === 'modules' && <FolderPlus className="w-5 h-5 text-indigo-500" />}
            {activeTab === 'assignments' && <FileText className="w-5 h-5 text-indigo-500" />}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).slice(0, -1)}
            </h2>
          </div>

          <div className="space-y-4">
            {activeTab === 'courses' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Course Name</label>
                  <input
                    value={courseForm.name}
                    onChange={e => setCourseForm({...courseForm, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    placeholder="e.g. Advanced Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm h-24"
                    placeholder="Course objectives and summary..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Org ID</label>
                    <input
                      value={courseForm.organization_id}
                      onChange={e => setCourseForm({...courseForm, organization_id: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Campus ID</label>
                    <input
                      value={courseForm.campus_id}
                      onChange={e => setCourseForm({...courseForm, campus_id: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Teacher ID</label>
                  <input
                    value={courseForm.teacher_id}
                    onChange={e => setCourseForm({...courseForm, teacher_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                  />
                </div>
                <button
                  onClick={handleCreateCourse}
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Plus className="w-4 h-4" /> Create Course
                </button>
              </>
            )}

            {activeTab === 'modules' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Course ID</label>
                  <input
                    value={moduleForm.course_id}
                    onChange={e => setModuleForm({...moduleForm, course_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Module Title</label>
                  <input
                    value={moduleForm.title}
                    onChange={e => setModuleForm({...moduleForm, title: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    placeholder="e.g. Introduction to Calculus"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Content</label>
                  <textarea
                    value={moduleForm.content}
                    onChange={e => setModuleForm({...moduleForm, content: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm h-32"
                    placeholder="Lesson content or links to materials..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Order</label>
                  <input
                    type="number"
                    value={moduleForm.order}
                    onChange={e => setModuleForm({...moduleForm, order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                  />
                </div>
                <button
                  onClick={handleCreateModule}
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <FolderPlus className="w-4 h-4" /> Add Module
                </button>
              </>
            )}

            {activeTab === 'assignments' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Course ID</label>
                  <input
                    value={assignmentForm.course_id}
                    onChange={e => setAssignmentForm({...assignmentForm, course_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Assignment Title</label>
                  <input
                    value={assignmentForm.title}
                    onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    placeholder="e.g. Mid-term Project"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Description</label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm h-24"
                    placeholder="Instructions for students..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Max Marks</label>
                    <input
                      type="number"
                      value={assignmentForm.max_marks}
                      onChange={e => setAssignmentForm({...assignmentForm, max_marks: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Deadline</label>
                    <input
                      type="datetime-local"
                      value={assignmentForm.deadline}
                      onChange={e => setAssignmentForm({...assignmentForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Attachment URL (Optional)</label>
                  <input
                    value={assignmentForm.attachment_url}
                    onChange={e => setAssignmentForm({...assignmentForm, attachment_url: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                    placeholder="https://..."
                  />
                </div>
                <button
                  onClick={handleCreateAssignment}
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <FileText className="w-4 h-4" /> Post Assignment
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {activeTab === 'courses' ? 'Your Courses' : activeTab === 'modules' ? 'Course Modules' : 'Active Assignments'}
              </h2>
              <div className="text-xs text-zinc-400 italic">
                Showing latest records
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Placeholder for data list - will be implemented with fetch */}
              <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium">No records found. Start by creating one using the form on the left.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
