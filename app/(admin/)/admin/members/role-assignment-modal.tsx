'use client';

import { useState } from 'react';
import { assignRole, revokeRole } from './role-actions';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
  availableRoles: { id: string; name: string }[];
  currentRoles: string[];
}

export function RoleAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userName,
  availableRoles,
  currentRoles,
}: RoleAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  async function handleAssign(roleId: string) {
    setLoading(true);
    setMessage(null);

    const result = await assignRole(userId, roleId);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Role assigned successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
    setLoading(false);
  }

  async function handleRevoke(roleId: string) {
    setLoading(true);
    setMessage(null);

    const result = await revokeRole(userId, roleId);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Role revoked successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Manage Permissions</h3>
            <p className="text-sm text-zinc-500">{userName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <XIcon className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Assign New Role</h4>
            <div className="grid grid-cols-1 gap-2">
              {availableRoles.map((role) => (
                <button
                  key={role.id}
                  disabled={loading || currentRoles.includes(role.id)}
                  onClick={() => handleAssign(role.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    currentRoles.includes(role.id)
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  <span className="text-sm font-medium">{role.name}</span>
                  {currentRoles.includes(role.id) ? (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <UserPlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Roles</h4>
            <div className="flex flex-wrap gap-2">
              {currentRoles.length === 0 && (
                <p className="text-sm text-zinc-500 italic">No roles assigned</p>
              )}
              {currentRoles.map((roleId) => {
                const role = availableRoles.find(r => r.id === roleId);
                return (
                  <div key={roleId} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-900/30">
                    {role?.name || 'Unknown Role'}
                    <button
                      onClick={() => handleRevoke(roleId)}
                      disabled={loading}
                      className="hover:text-red-500 transition-colors"
                    >
                      <ShieldOff className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
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
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper components to avoid importing from missing files
function XIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
function UserPlusIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>; }
