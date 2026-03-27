'use client';

import JournalEditor, { extractPublicIds } from '@/components/JournalEditor';
import MoodSelector, { Mood } from '@/components/MoodSelector';
import TagInput, { Tag } from '@/components/TagInput';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Check, Loader2, Trash2 } from 'lucide-react';
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

  // Tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // Cloudinary tracking
  const [trackedPublicIds, setTrackedPublicIds] = useState<string[]>([]);

  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [moodsRes, tagsRes, entryRes] = await Promise.all([
          api.get('/moods'),
          api.get('/tags'),
          api.get(`/entries/${dateStr}`).catch((e) => {
            if (e.response?.status === 404) return null;
            throw e;
          }),
        ]);

        setMoods(moodsRes.data);
        setAllTags(tagsRes.data);

        if (entryRes) {
          setIsExisting(true);
          setContent(entryRes.data.content);
          setSelectedMoodId(entryRes.data.mood.id);
          setSelectedTags(entryRes.data.tags ?? []);
        } else {
          const neutral = moodsRes.data.find((m: Mood) => m.value === 3) || moodsRes.data[0];
          if (neutral) setSelectedMoodId(neutral.id);
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

  /** Before saving, create any brand-new tags (id === -1) via the API. */
  async function resolveTagIds(): Promise<number[]> {
    const resolvedIds: number[] = [];
    for (const tag of selectedTags) {
      if (tag.id === -1) {
        // New tag — create it first
        const res = await api.post('/tags', { name: tag.name });
        setAllTags(prev => [...prev.filter(t => t.name !== tag.name), res.data]);
        resolvedIds.push(res.data.id);
      } else {
        resolvedIds.push(tag.id);
      }
    }
    return resolvedIds;
  }

  async function handleSave() {
    if (!selectedMoodId || !content.trim()) {
      setError('Please select a mood and write your entry.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tagIds = await resolveTagIds();

      // Compute which images were removed from the draft
      const currentPublicIds = extractPublicIds(content);
      const imagesToDelete = trackedPublicIds.filter(id => !currentPublicIds.includes(id));

      if (isExisting) {
        await api.patch(`/entries/${dateStr}`, {
          mood_id: selectedMoodId,
          content,
          tag_ids: tagIds,
          images_to_delete: imagesToDelete,
        });
      } else {
        await api.post('/entries', {
          entry_date: dateStr,
          mood_id: selectedMoodId,
          content,
          tag_ids: tagIds,
          images_to_delete: imagesToDelete,
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
      const decodedDate = decodeURIComponent(dateStr);
      formattedDate = format(parseISO(decodedDate), 'MMMM d, yyyy');
    }
  } catch (e) {
    formattedDate = decodeURIComponent(dateStr);
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
            onPublicIdsTracked={setTrackedPublicIds}
          />

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Tags</label>
            <TagInput
              allTags={allTags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          <div className="flex justify-end pt-2">
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
              This entry will be moved to Trash. You can restore it later.
            </p>
            <div className="flex sm:flex-row flex-col-reverse gap-3 sm:justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(EntryPage);
