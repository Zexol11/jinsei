'use client';

import JournalEditor from '@/components/JournalEditor';
import MoodSelector, { Mood } from '@/components/MoodSelector';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Check, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';

function EntryPage() {
  const params = useParams();
  const dateStr = params.date as string;
  const router = useRouter();

  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMoodId, setSelectedMoodId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');

  // Fetch moods and (optionally) the existing entry
  useEffect(() => {
    async function loadData() {
      try {
        const [moodsRes, entryRes] = await Promise.all([
          api.get('/moods'),
          api.get(`/entries/${dateStr}`).catch((e) => {
            if (e.response?.status === 404) return null;
            throw e;
          }),
        ]);

        setMoods(moodsRes.data);

        if (entryRes) {
          setIsExisting(true);
          setContent(entryRes.data.content);
          setSelectedMoodId(entryRes.data.mood.id);
        } else {
          // Default to the middle mood (likely 'neutral' / value 3)
          const neutralMode = moodsRes.data.find((m: Mood) => m.value === 3) || moodsRes.data[0];
          if (neutralMode) setSelectedMoodId(neutralMode.id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load entry details.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [dateStr]);

  async function handleSave() {
    if (!selectedMoodId || !content.trim()) {
      setError('Please select a mood and write your entry.');
      return;
    }
    
    setSaving(true);
    setError('');

    try {
      if (isExisting) {
        await api.patch(`/entries/${dateStr}`, {
          mood_id: selectedMoodId,
          content,
        });
      } else {
        await api.post('/entries', {
          entry_date: dateStr,
          mood_id: selectedMoodId,
          content,
        });
        setIsExisting(true);
      }
      
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/entries/${dateStr}`);
      router.push('/');
    } catch (err) {
      setError('Failed to delete entry.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  let formattedDate = 'Loading date...';
  try {
    if (dateStr) {
      // The dateStr might be URL encoded (e.g. 2026-03-16T00%3A00%3A00.000000Z)
      // Decode it first before passing to parseISO
      const decodedDate = decodeURIComponent(dateStr);
      formattedDate = format(parseISO(decodedDate), 'MMMM d, yyyy');
    }
  } catch (e) {
    formattedDate = decodeURIComponent(dateStr); // fallback if invalid
  }

  const headerActions = isExisting ? (
    <button
      onClick={() => setShowDeleteModal(true)}
      disabled={deleting}
      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition flex items-center gap-2 text-sm font-medium"
      title="Delete Entry"
    >
      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      <span className="hidden sm:inline">Delete</span>
    </button>
  ) : null;

  return (
    <AppLayout title={formattedDate} headerActions={headerActions}>
      <div className="space-y-6">


        {error && (
          <div className="px-4 py-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Mood Selector */}
        <MoodSelector 
          moods={moods} 
          selectedMoodId={selectedMoodId} 
          onSelect={setSelectedMoodId} 
        />

        {/* Editor */}
        <div className="space-y-4">
          <JournalEditor 
            content={content} 
            onChange={setContent} 
          />

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Entry
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-white mb-2">Delete Entry</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
            <div className="flex sm:flex-row flex-col-reverse gap-3 sm:justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(EntryPage);
