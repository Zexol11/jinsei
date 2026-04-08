'use client';

import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { RotateCcw, X, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Mood { id: number; label: string; emoji: string; }
interface TrashedEntry { id: number; entry_date: string; title: string | null; content: string; mood: Mood; deleted_at: string; }

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function TrashPage() {
  const [entries,       setEntries]       = useState<TrashedEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error,         setError]         = useState('');
  const [confirmDate,   setConfirmDate]   = useState<string | null>(null);
  const [confirmTitle,  setConfirmTitle]  = useState('');
  const [confirmEmpty,  setConfirmEmpty]  = useState(false);

  async function fetchTrash() {
    try {
      const res = await api.get('/trash');
      setEntries(res.data);
    } catch { setError('Failed to load trash.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchTrash(); }, []);

  async function handleRestore(date: string) {
    setActionLoading(`restore-${date}`);
    setError('');
    try {
      await api.post(`/trash/${date}/restore`);
      setEntries(prev => prev.filter(e => format(parseISO(e.entry_date), 'yyyy-MM-dd') !== date));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restore entry.');
    } finally { setActionLoading(null); }
  }

  async function handleForceDelete() {
    if (!confirmDate) return;
    const date = confirmDate;
    setConfirmDate(null);
    setActionLoading(`delete-${date}`);
    setError('');
    try {
      await api.delete(`/trash/${date}`);
      setEntries(prev => prev.filter(e => format(parseISO(e.entry_date), 'yyyy-MM-dd') !== date));
    } catch { setError('Failed to permanently delete entry.'); }
    finally { setActionLoading(null); }
  }

  async function handleEmptyTrash() {
    setConfirmEmpty(false);
    setActionLoading('empty-trash');
    setError('');
    try {
      await api.delete('/trash');
      setEntries([]);
    } catch { setError('Failed to empty trash.'); }
    finally { setActionLoading(null); }
  }

  return (
    <AppLayout>
      <div className="px-6 md:px-10 lg:px-16 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1
              className="text-4xl font-semibold"
              style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
            >
              Trash
            </h1>
            <p className="text-sm mt-1 font-inter" style={{ color: 'var(--on-surface-dim)' }}>
              Manage your deleted reflections.
            </p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={() => setConfirmEmpty(true)}
              className="flex items-center justify-center gap-2 label-caps font-inter px-5 py-2.5 rounded-full transition-all hover:brightness-110 active:scale-95 shadow-lg"
              style={{ background: '#b3261e', color: '#fff' }}
            >
              <AlertTriangle size={14} />
              Empty Trash
            </button>
          )}
        </div>

        {error && (
          <div className="vellum-error-box mb-6">
            {error}
          </div>
        )}

        {loading && entries.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--surface-container-low)' }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center text-center py-32">
            <BookOpen className="w-14 h-14 mb-4" style={{ color: 'var(--outline-variant)' }} />
            <p className="text-base font-medium" style={{ color: 'var(--on-surface-dim)' }}>Trash is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const dateStr    = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
              const dayOfWeek  = format(parseISO(entry.entry_date), 'EEEE');
              const monthDay   = format(parseISO(entry.entry_date), 'MMM d, yyyy').toUpperCase();
              const timeDeleted = format(parseISO(entry.deleted_at), 'h:mm a');
              const isRestoring = actionLoading === `restore-${dateStr}`;
              const isDeleting  = actionLoading === `delete-${dateStr}`;
              const excerpt     = stripHtml(entry.content).slice(0, 200);

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl p-6 border border-[var(--outline-variant)]/30 transition-all hover:border-[var(--outline-variant)]/60"
                  style={{ background: 'var(--surface-container-low)' }}
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-14">
                    {/* Left: date */}
                    <div className="w-full md:w-28 shrink-0">
                      <p className="label-caps mb-1 opacity-60" style={{ fontSize: '0.65rem' }}>{monthDay}</p>
                      <p
                        className="text-2xl md:text-xl font-medium"
                        style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
                      >
                        {dayOfWeek}
                      </p>
                      <p className="text-xs mt-1 opacity-60">{timeDeleted}</p>
                    </div>

                    {/* Right: content + actions */}
                    <div className="flex-1 min-w-0">
                      {entry.title && (
                        <h2
                          className="text-lg font-medium mb-1"
                          style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
                        >
                          {entry.title}
                        </h2>
                      )}
                      <p
                        className="text-sm leading-relaxed line-clamp-3 mb-6"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {excerpt || '(empty entry)'}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 font-inter">
                        <button
                          onClick={() => handleRestore(dateStr)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 label-caps px-4 py-2 rounded-xl transition bg-[var(--primary-container)] text-[var(--primary)] hover:opacity-80 disabled:opacity-40"
                        >
                          {isRestoring
                            ? <Loader2 size={14} className="animate-spin" />
                            : <RotateCcw size={14} />}
                          Restore
                        </button>
                        <button
                          onClick={() => { setConfirmDate(dateStr); setConfirmTitle(entry.title || dayOfWeek); }}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 label-caps px-4 py-2 rounded-xl transition border border-[var(--outline-variant)] text-[var(--on-surface-dim)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                        >
                          {isDeleting
                            ? <Loader2 size={14} className="animate-spin" />
                            : <X size={14} />}
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirm Delete Modal ───────────────────────────────────────────── */}
      {confirmDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setConfirmDate(null)}
          />
          <div
            className="relative rounded-2xl p-7 shadow-2xl w-full max-w-sm animate-in"
            style={{ background: 'var(--surface-container)' }}
          >
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#b3261e', fontFamily: "'Noto Serif', serif" }}>
              Delete Permanently?
            </h3>
            <p className="text-sm mb-1" style={{ color: 'var(--on-surface-variant)' }}>
              You are about to permanently delete:
            </p>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--on-surface)' }}>"{confirmTitle}"</p>
            <p className="text-xs mb-6" style={{ color: 'var(--on-surface-dim)' }}>
              This action is <span style={{ color: 'var(--error)', fontWeight: 600 }}>irreversible</span>. The entry and all uploaded images will be removed forever.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDate(null)}
                className="px-4 py-2 rounded-full text-sm transition hover:opacity-80"
                style={{ color: 'var(--on-surface-variant)', background: 'var(--surface-container-high)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleForceDelete}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition hover:brightness-110 shadow-md"
                style={{ background: '#b3261e', color: '#fff' }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Empty Trash Modal ──── */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setConfirmEmpty(false)}
          />
          <div
            className="relative rounded-2xl p-7 shadow-2xl w-full max-w-sm animate-in"
            style={{ background: 'var(--surface-container)' }}
          >
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#b3261e', fontFamily: "'Noto Serif', serif" }}>
              Empty Trash?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
              Are you sure you want to permanently delete all items in the trash? This action is <span style={{ color: 'var(--error)', fontWeight: 600 }}>irreversible</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="px-4 py-2 rounded-full text-sm transition hover:opacity-80"
                style={{ color: 'var(--on-surface-variant)', background: 'var(--surface-container-high)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition hover:brightness-110 shadow-md"
                style={{ background: '#b3261e', color: '#fff' }}
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(TrashPage);
