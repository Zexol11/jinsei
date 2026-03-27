'use client';

import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Trash2, RotateCcw, Loader2, PackageOpen, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Mood {
  id: number;
  label: string;
  emoji: string;
}

interface TrashedEntry {
  id: number;
  entry_date: string;
  mood: Mood;
  deleted_at: string;
}

function TrashPage() {
  const [entries, setEntries] = useState<TrashedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Modal state
  const [confirmDate, setConfirmDate] = useState<string | null>(null);
  const [confirmDisplay, setConfirmDisplay] = useState('');

  async function fetchTrash() {
    try {
      const res = await api.get('/trash');
      setEntries(res.data);
    } catch {
      setError('Failed to load trash.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrash();
  }, []);

  async function handleRestore(date: string) {
    setActionLoading(`restore-${date}`);
    setError('');
    try {
      await api.post(`/trash/${date}/restore`);
      setEntries(prev => prev.filter(e => {
        const d = format(parseISO(e.entry_date), 'yyyy-MM-dd');
        return d !== date;
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restore entry.');
    } finally {
      setActionLoading(null);
    }
  }

  function openDeleteModal(date: string, displayDate: string) {
    setConfirmDate(date);
    setConfirmDisplay(displayDate);
  }

  function closeDeleteModal() {
    setConfirmDate(null);
    setConfirmDisplay('');
  }

  async function handleForceDelete() {
    if (!confirmDate) return;
    const date = confirmDate;
    closeDeleteModal();
    setActionLoading(`delete-${date}`);
    setError('');
    try {
      await api.delete(`/trash/${date}`);
      setEntries(prev => prev.filter(e => {
        const d = format(parseISO(e.entry_date), 'yyyy-MM-dd');
        return d !== date;
      }));
    } catch {
      setError('Failed to permanently delete entry.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AppLayout title="Trash">
      <div className="space-y-4">

        {/* Info banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400">
          <Trash2 size={16} className="shrink-0" />
          <span>Deleted entries are kept here. Restore them or delete permanently.</span>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-950 border border-red-800 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Skeleton loading */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <PackageOpen className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-white mb-1">Trash is empty</h2>
            <p className="text-zinc-500 text-sm">Deleted journal entries will appear here.</p>
          </div>
        ) : (
          /* Entry list */
          <div className="space-y-3">
            {entries.map(entry => {
              const dateStr = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
              const displayDate = format(parseISO(entry.entry_date), 'MMMM d, yyyy');
              const deletedDate = format(parseISO(entry.deleted_at), 'MMM d, yyyy');
              const isRestoring = actionLoading === `restore-${dateStr}`;
              const isDeleting = actionLoading === `delete-${dateStr}`;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl shrink-0">{entry.mood.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{displayDate}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Deleted on {deletedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Restore */}
                    <button
                      onClick={() => handleRestore(dateStr)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition disabled:opacity-50"
                    >
                      {isRestoring ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      Restore
                    </button>

                    {/* Delete forever */}
                    <button
                      onClick={() => openDeleteModal(dateStr, displayDate)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete Forever
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {confirmDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Warning icon */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Delete Permanently?</h3>
            <p className="text-sm text-zinc-400 mb-1">
              You are about to permanently delete the entry for
            </p>
            <p className="text-sm font-medium text-white mb-5">{confirmDisplay}</p>
            <p className="text-xs text-zinc-500 mb-6">
              This action is <span className="text-red-400 font-medium">irreversible</span>. The entry and any uploaded images will be removed forever.
            </p>
            <div className="flex sm:flex-row flex-col-reverse gap-3 sm:justify-end">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleForceDelete}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
              >
                <Trash2 size={14} />
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(TrashPage);
