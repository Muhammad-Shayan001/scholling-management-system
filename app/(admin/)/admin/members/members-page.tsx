'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InviteMemberModal } from './invite-member-modal';
import { UserPlus, Mail, Calendar, Trash2, Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  invited_role: string;
  expires_at: string;
  created_at: string;
}

export function MembersPage() {
  const supabase = createClient();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchInvitations() {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setInvitations(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Organization Members</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your team and invite new staff members</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Pending Invitations</h2>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No pending invitations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Email</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Role</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">Expires</th>
                  <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-200 font-medium">{inv.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700">
                        {inv.invited_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(inv.expires_at).toLocaleDateString()}
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

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInvitations}
      />
    </div>
  );
}
