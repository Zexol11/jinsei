'use client';

import JournalEditor, { extractPublicIds } from '@/components/JournalEditor';
import MoodSelector, { Mood } from '@/components/MoodSelector';
import TagInput, { Tag } from '@/components/TagInput';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import CoverImageUpload from '@/components/CoverImageUpload';

// ── word count helper ──────────────────────────
function countWords(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

// ── Format time as "HH:MM AM/PM" ──────────────
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function EntryPage() {
  const params  = useParams();
  const dateStr = params.date as string;
  const router  = useRouter();

  const [moods,          setMoods]          = useState<Mood[]>([]);
  const [selectedMoodId, setSelectedMoodId] = useState<number | null>(null);
  const [title,          setTitle]          = useState('');
  const [content,        setContent]        = useState('');
  const [allTags,        setAllTags]        = useState<Tag[]>([]);
  const [selectedTags,   setSelectedTags]   = useState<Tag[]>([]);
  const [trackedIds,     setTrackedIds]     = useState<string[]>([]);

  const [isExisting, setIsExisting] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error,      setError]      = useState('');

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageCaption, setCoverImageCaption] = useState('');

  // Draft state
  const [draftSavedAt,   setDraftSavedAt]   = useState<string | null>(null);
  const [isDraftDirty,   setIsDraftDirty]   = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load entry ─────────────────────────────────────────────────────────────
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
          setTitle(entryRes.data.title || '');
          setContent(entryRes.data.content);
          setSelectedMoodId(entryRes.data.mood.id);
          setSelectedTags(entryRes.data.tags ?? []);
          setCoverImageUrl(entryRes.data.cover_image_url ?? null);
          setCoverImageCaption(entryRes.data.cover_image_caption ?? '');
        } else {
          // Check for a local draft
          const draft = localStorage.getItem(`draft-${dateStr}`);
          if (draft) {
            const parsed = JSON.parse(draft);
            setTitle(parsed.title || '');
            setContent(parsed.content || '');
            if (parsed.moodId) setSelectedMoodId(parsed.moodId);
            if (parsed.coverImageUrl) setCoverImageUrl(parsed.coverImageUrl);
            if (parsed.coverImageCaption) setCoverImageCaption(parsed.coverImageCaption);
            setDraftSavedAt(parsed.savedAt || null);
          } else {
            const neutral = moodsRes.data.find((m: Mood) => m.value === 3) || moodsRes.data[0];
            if (neutral) setSelectedMoodId(neutral.id);
          }
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

  // ── Auto-save draft every 30 s ─────────────────────────────────────────────
  const scheduleDraft = useCallback(() => {
    if (isExisting) return; // only draft new entries
    setIsDraftDirty(true);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      const now = fmtTime(new Date());
      localStorage.setItem(`draft-${dateStr}`, JSON.stringify({
        title, content, moodId: selectedMoodId, coverImageUrl, coverImageCaption, savedAt: now,
      }));
      setDraftSavedAt(now);
      setIsDraftDirty(false);
    }, 30_000);
  }, [dateStr, title, content, selectedMoodId, coverImageUrl, coverImageCaption, isExisting]);

  useEffect(() => {
    if (!loading && !isExisting && (title || content || coverImageUrl)) scheduleDraft();
  }, [title, content, selectedMoodId, coverImageUrl, coverImageCaption]); // eslint-disable-line

  // ── Resolve tags ───────────────────────────────────────────────────────────
  async function resolveTagIds(): Promise<number[]> {
    const resolved: number[] = [];
    for (const tag of selectedTags) {
      if (tag.id === -1) {
        const res = await api.post('/tags', { name: tag.name });
        setAllTags(prev => [...prev.filter(t => t.name !== tag.name), res.data]);
        resolved.push(res.data.id);
      } else {
        resolved.push(tag.id);
      }
    }
    return resolved;
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedMoodId) { setError('Please select a mood.'); return; }
    setSaving(true);
    setError('');
    try {
      const tagIds       = await resolveTagIds();
      const currentIds   = extractPublicIds(content);
      if (coverImageUrl) currentIds.push(...extractPublicIds(coverImageUrl));
      const imagesToDel  = trackedIds.filter(id => !currentIds.includes(id));

      const payload = {
        mood_id: selectedMoodId, 
        title, 
        content, 
        tag_ids: tagIds, 
        cover_image_url: coverImageUrl,
        cover_image_caption: coverImageCaption,
        images_to_delete: imagesToDel,
      };

      if (isExisting) {
        await api.patch(`/entries/${dateStr}`, payload);
      } else {
        await api.post('/entries', { entry_date: dateStr, ...payload });
        // Clear draft on successful save
        localStorage.removeItem(`draft-${dateStr}`);
        setIsExisting(true);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/entries/${dateStr}`);
      router.push('/');
    } catch {
      setError('Failed to delete entry.');
      setDeleting(false);
      setShowDelete(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--on-surface-dim)' }} />
      </div>
    );
  }

  // ── Formatted date header ──────────────────────────────────────────────────
  let dateLabel = '';
  try {
    dateLabel = format(parseISO(decodeURIComponent(dateStr)), 'MMMM d, yyyy').toUpperCase();
  } catch {
    dateLabel = dateStr;
  }

  const words = countWords(content);

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">

        <div
          className="flex items-center justify-between px-8 md:px-14 py-4"
          style={{ borderBottom: '1px solid var(--outline-variant)' }}
        >
          <p className="label-caps font-inter" style={{ color: 'var(--on-surface-dim)' }}>{dateLabel}</p>
          <div className="flex items-center gap-3 font-inter">
            {isExisting && (
              <button
                onClick={() => setShowDelete(true)}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm transition"
                style={{ color: 'var(--error)' }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span className="hidden sm:inline label-caps" style={{ color: 'var(--error)' }}>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 px-8 md:px-14 pt-8 pb-28">

          {error && (
            <div className="vellum-error-box mb-6">
              {error}
            </div>
          )}

          {/* Header Layout */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-6">
            <div className="flex-1 min-w-0 pt-4">
              {/* Mood selector */}
              <MoodSelector moods={moods} selectedMoodId={selectedMoodId} onSelect={setSelectedMoodId} />

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of your entry…"
                className="w-full bg-transparent outline-none mt-8 pb-3 transition-colors border-b border-transparent focus:border-[color:var(--outline-variant)]"
                style={{
                  fontFamily: "'Noto Serif', serif",
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: 'var(--on-surface)',
                  lineHeight: 1.2,
                }}
              />
            </div>
            
            <div className="lg:shrink-0">
              <CoverImageUpload
                imageUrl={coverImageUrl}
                caption={coverImageCaption}
                onImageChange={(url) => {
                  setCoverImageUrl(url);
                  if (url) setTrackedIds(prev => [...prev, ...extractPublicIds(url)]);
                }}
                onCaptionChange={setCoverImageCaption}
              />
            </div>
          </div>

          {/* Editor */}
          <JournalEditor
            content={content}
            onChange={setContent}
            onPublicIdsTracked={setTrackedIds}
          />

          {/* Tags */}
          <div className="mt-6 mb-12">
            <p className="label-caps mb-2 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Tags</p>
            <TagInput allTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
          </div>
        </div>

        {/* ── Sticky bottom bar ─────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 right-0 flex items-center justify-between px-8 md:px-14 py-4"
          style={{
            left: '224px', // sidebar width (w-56)
            background: 'var(--surface-container-low)',
            borderTop: '1px solid var(--outline-variant)',
            zIndex: 20,
          }}
        >
          {/* Left: word count + draft status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary-dim)' }} />
              <span className="label-caps font-inter" style={{ color: 'var(--on-surface-dim)' }}>{words} Words</span>
            </div>
            {!isExisting && draftSavedAt && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDraftDirty ? 'var(--outline)' : 'var(--primary-dim)' }} />
                <span className="label-caps font-inter" style={{ color: 'var(--on-surface-dim)' }}>
                  Draft saved at {draftSavedAt}
                </span>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push('/')}
              className="label-caps font-inter px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--on-surface-dim)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container-high)'; (e.currentTarget as HTMLElement).style.color = 'var(--on-surface)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-dim)'; }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedMoodId}
              className="btn-primary"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Saving…' : isExisting ? 'Save Entry' : 'Finish Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setShowDelete(false)}
          />
          <div
            className="relative rounded-2xl p-7 shadow-2xl w-full max-w-sm animate-in"
            style={{ background: 'var(--surface-container)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>
              Move to Trash?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
              This entry will be moved to trash. You can restore it later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 rounded-full text-sm transition"
                style={{ color: 'var(--on-surface-variant)', background: 'var(--surface-container-high)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50"
                style={{ background: 'var(--error)', color: '#fff' }}
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
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
