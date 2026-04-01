'use client';

import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format, isToday, parseISO } from 'date-fns';
import OnThisDayCard from '@/components/OnThisDayCard';
import { PenLine, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Tag    { id: number; name: string; slug: string; }
interface Mood   { id: number; label: string; emoji: string; value: number; }
interface Entry  { id: number; entry_date: string; content: string; title: string | null; mood: Mood; tags: Tag[]; cover_image_url?: string | null; }

const PROMPTS = [
  "What's occupying your quiet moments today?",
  "What are you grateful for right now?",
  "What's one thing you want to remember about today?",
  "How does the air feel where you are?",
  "What would make today feel complete?",
  "What small thing brought you joy this week?",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Inter font style shorthand ─────────────────────────────
const inter = (size: string, weight: number = 400, color?: string): React.CSSProperties => ({
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: size,
  fontWeight: weight,
  ...(color ? { color } : {}),
});

function getMoodStyle(label: string) {
  const lbl = (label || '').toLowerCase();
  if (lbl.includes('inspired') || lbl.includes('excited') || lbl.includes('happy') || lbl.includes('great')) {
    return { bg: '#fdf6ed', dot: '#8f6844', text: '#5c4632' };
  }
  if (lbl.includes('calm') || lbl.includes('focused') || lbl.includes('good') || lbl.includes('okay')) {
    return { bg: '#eef2ec', dot: '#8a9a86', text: '#4a5747' };
  }
  if (lbl.includes('sad') || lbl.includes('tired') || lbl.includes('terrible') || lbl.includes('low')) {
    return { bg: '#f2ecee', dot: '#a8868c', text: '#5e484c' };
  }
  return { bg: 'var(--surface-container-high)', dot: 'var(--primary)', text: 'var(--on-surface)' };
}

function Dashboard() {
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const prompt    = PROMPTS[new Date().getDate() % PROMPTS.length];

  const [entries,      setEntries]      = useState<Entry[]>([]);
  const [allTags,      setAllTags]      = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<number[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isFiltering,  setIsFiltering]  = useState(false);
  const [streak,       setStreak]       = useState(0);
  const [wordCount,    setWordCount]    = useState(0);
  const [sortOrder,    setSortOrder]    = useState<'recent' | 'oldest'>('recent');

  const todayEntry    = entries.find(e => isToday(parseISO(e.entry_date)));
  const hasEntryToday = !!todayEntry;

  useEffect(() => {
    async function fetchData() {
      if (!loading) setIsFiltering(true);
      try {
        const [entriesRes, tagsRes, insightsRes] = await Promise.all([
          api.get('/entries', { params: activeTagIds.length > 0 ? { 'tags[]': activeTagIds } : {} }),
          api.get('/tags'),
          api.get('/insights', { params: { period: '7_days' } }),
        ]);
        const list: Entry[] = entriesRes.data.data || entriesRes.data;
        setEntries(list);
        setAllTags(tagsRes.data);
        setStreak(insightsRes.data.streak || 0);
        const words = list
          .slice(0, 7)
          .reduce((acc, e) => acc + stripHtml(e.content).split(' ').filter(Boolean).length, 0);
        setWordCount(words);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    }
    fetchData();
  }, [activeTagIds]); // eslint-disable-line

  function toggleTag(id: number) {
    setActiveTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  // ── Sort entries client-side ──────────────────────────────
  const sortedEntries = [...entries].sort((a, b) => {
    const da = new Date(a.entry_date).getTime();
    const db = new Date(b.entry_date).getTime();
    return sortOrder === 'recent' ? db - da : da - db;
  });

  return (
    <AppLayout>
      {/* ── Greeting Top Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 md:px-10 lg:px-16 pt-8">
        <p style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.05rem', fontWeight: 400, color: 'var(--on-surface)' }}>
          {getGreeting()}, {firstName}.
        </p>
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition hover:opacity-80"
          style={{ background: 'var(--primary-container)', color: 'var(--primary)' }}
        >
          {firstName.charAt(0).toUpperCase()}
        </Link>
      </div>

      {/* Dashboard gets its own right-side breathing room */}
      <div className="px-6 md:px-10 lg:px-16 lg:pr-[400px] py-8 pt-6">

        {/* ── Hero + stats row ──────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          {/* Current Thought / Today's Entry card */}
          {loading ? (
            <div
              className="flex-1 rounded-2xl p-6 flex flex-col justify-between"
              style={{ background: 'var(--primary-container)', minHeight: '160px' }}
            >
              <div>
                <p style={{ ...inter('0.6rem', 600), letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-dim)', marginBottom: '10px' }}>
                  Current Thought
                </p>
                <div className="animate-pulse space-y-3 mt-2">
                  <div style={{ height: '1.25rem', width: '85%', background: 'var(--primary-dim)', opacity: 0.25, borderRadius: '6px' }} />
                  <div style={{ height: '1.25rem', width: '60%', background: 'var(--primary-dim)', opacity: 0.25, borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          ) : todayEntry ? (
            <Link
              href={`/entry/${format(parseISO(todayEntry.entry_date), 'yyyy-MM-dd')}`}
              className="flex-1 rounded-2xl p-6 flex flex-col justify-between transition group hover:opacity-80"
              style={{ background: '#d1e6d3', minHeight: '160px' }}
            >
              <div>
                <p style={{ ...inter('0.6rem', 600), letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3d6645', marginBottom: '4px' }}>
                  Today's Entry
                </p>
                <span className="text-xl inline-block mb-3">{todayEntry.mood.emoji}</span>
                <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.25rem', fontWeight: 500, color: '#1c1c1a', lineHeight: 1.4 }}>
                  <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {stripHtml(todayEntry.content) || '(Empty)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                 <span style={{ ...inter('0.75rem', 500), color: '#4a4845' }}>View Entry →</span>
              </div>
            </Link>
          ) : (
            <div
              className="flex-1 rounded-2xl p-6 flex flex-col justify-between"
              style={{ background: '#d1e6d3', minHeight: '160px' }}
            >
              <div>
                <p style={{ ...inter('0.6rem', 600), letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3d6645', marginBottom: '10px' }}>
                  Current Thought
                </p>
                <p style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.35rem', fontWeight: 500, color: '#1c1c1a', lineHeight: 1.35, maxWidth: '28ch' }}>
                  {prompt}
                </p>
              </div>
              <Link href={`/entry/${format(new Date(), 'yyyy-MM-dd')}`} className="btn-primary self-start mt-5 text-sm">
                + New Entry
              </Link>
            </div>
          )}

          <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48 shrink-0">

            <div className="rounded-2xl p-5 flex-1" style={{ background: '#f0e6c8' }}>
              <p style={{ ...inter('0.6rem', 600), letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7a52', marginBottom: '8px' }}>
                Mood Streak
              </p>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div style={{ height: '2rem', width: '60%', background: '#d9c898', borderRadius: '6px' }} />
                  <div style={{ height: '0.7rem', width: '80%', background: '#d9c898', borderRadius: '4px' }} />
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: "'Noto Serif', serif", fontSize: '2.2rem', fontWeight: 700, color: '#3d3520', lineHeight: 1 }}>
                    {streak}
                    <span className='font-inter' style={{ fontSize: '1rem', fontWeight: 400, marginLeft: '4px', color: '#7a6c42' }}>Days</span>
                  </p>
                  <p style={{ ...inter('0.7rem'), color: '#8a7a52', marginTop: '4px' }}>Calm &amp; Focused</p>
                </>
              )}
            </div>

            <div className="rounded-2xl p-5 flex-1" style={{ background: '#c8d8ec' }}>
              <p style={{ ...inter('0.6rem', 600), letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '8px' }}>
                Reflections
              </p>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div style={{ height: '2rem', width: '50%', background: '#a4bcda', borderRadius: '6px' }} />
                  <div style={{ height: '0.7rem', width: '75%', background: '#a4bcda', borderRadius: '4px' }} />
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: "'Noto Serif', serif", fontSize: '2.2rem', fontWeight: 700, color: '#1e2d3d', lineHeight: 1 }}>
                    {wordCount}
                  </p>
                  <p style={{ ...inter('0.7rem'), color: '#4a6080', marginTop: '4px' }}>Total Words this week</p>
                </>
              )}
            </div>
          </div>
        </div>

        <OnThisDayCard />

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span style={{ ...inter('0.72rem', 500), color: 'var(--on-surface-dim)', alignSelf: 'center', marginRight: '4px' }}>
              Filter:
            </span>
            <button
              onClick={() => setActiveTagIds([])}
              className="px-3 py-1.5 rounded-full transition"
              style={{
                ...inter('0.72rem', 600),
                background: activeTagIds.length === 0 ? 'var(--primary)' : 'var(--surface-container-high)',
                color: activeTagIds.length === 0 ? 'var(--on-primary)' : 'var(--on-surface-dim)',
              }}
            >All</button>
            {allTags.map(tag => {
              const isActive = activeTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="px-3 py-1.5 rounded-full transition-all"
                  style={{
                    ...inter('0.72rem', isActive ? 600 : 400),
                    background: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
                    color: isActive ? 'var(--on-primary)' : 'var(--on-surface-dim)',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--on-surface)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container-high)'; (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-dim)'; } }}
                >
                  #{tag.name}
                </button>
              );
            })}
            {activeTagIds.length > 0 && (
              <button
                onClick={() => setActiveTagIds([])}
                className="flex items-center gap-1 transition"
                style={{ ...inter('0.72rem'), color: 'var(--on-surface-dim)' }}
              >
                Clear <X size={11} />
              </button>
            )}
          </div>
        )}

        <div
          className="flex items-center justify-between mb-4"
          style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '12px' }}
        >
          <span style={{ ...inter('0.7rem', 500), letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-dim)' }}>
            Recent Entries
          </span>

          <button
            onClick={() => setSortOrder(s => s === 'recent' ? 'oldest' : 'recent')}
            className="flex items-center gap-1 transition"
            style={{ ...inter('0.7rem', 500), letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-dim)' }}
          >
            Sort by {sortOrder === 'recent' ? 'Recent' : 'Oldest'}
            <ChevronDown
              size={12}
              style={{ transform: sortOrder === 'oldest' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
        </div>

        {loading || isFiltering ? (
          <div className="space-y-10 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-14">
                <div className="w-28 shrink-0 space-y-2">
                  <div className="h-3 rounded" style={{ background: 'var(--surface-container-high)', width: '70%' }} />
                  <div className="h-4 rounded" style={{ background: 'var(--surface-container-high)', width: '90%' }} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-7 rounded" style={{ background: 'var(--surface-container-high)', width: '55%' }} />
                  <div className="h-4 rounded" style={{ background: 'var(--surface-container-high)', width: '100%' }} />
                  <div className="h-4 rounded" style={{ background: 'var(--surface-container-high)', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1.5px dashed var(--outline-variant)' }}>
            <PenLine className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--outline-variant)' }} />
            <p style={{ ...inter('1rem', 500), color: 'var(--on-surface)', marginBottom: '4px' }}>
              {activeTagIds.length > 0 ? 'No entries match these tags' : 'No entries yet'}
            </p>
            <p style={{ ...inter('0.875rem'), color: 'var(--on-surface-variant)' }}>
              {activeTagIds.length > 0
                ? 'Try different combinations or clear the filters.'
                : 'Start your journaling journey by creating your first entry today.'}
            </p>
          </div>
        ) : (
          <div>
            {sortedEntries.map((entry, idx) => {
              const dateParam = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
              const dayName   = format(parseISO(entry.entry_date), 'EEE').toUpperCase();
              const dayNum    = format(parseISO(entry.entry_date), 'd');
              const monthYear = format(parseISO(entry.entry_date), 'MMM yyyy').toUpperCase();
              const timeLabel = isToday(parseISO(entry.entry_date)) ? 'Today' : format(parseISO(entry.entry_date), 'EEEE');
              const excerpt   = stripHtml(entry.content).slice(0, 280);
              const isLast    = idx === sortedEntries.length - 1;

              return (
                <Link
                  key={entry.id}
                  href={`/entry/${dateParam}`}
                  className="flex gap-8 md:gap-14 group py-8"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid color-mix(in srgb, var(--outline-variant) 40%, transparent)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div className="w-32 md:w-40 shrink-0 flex flex-col pt-1">
                    <p style={{ ...inter('0.9rem', 500), letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface)', marginBottom: '5px' }}>
                      {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                    </p>
                    <p style={{ ...inter('0.75rem'), color: 'var(--on-surface-dim)', marginBottom: '16px' }}>
                      {format(parseISO(entry.entry_date), 'EEEE')}
                    </p>
                    
                    {(() => {
                      const st = getMoodStyle(entry.mood?.label);
                      return (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md max-w-max" style={{ background: st.bg }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                          <span style={{ ...inter('0.75rem', 500), color: st.text, textTransform: 'capitalize' }}>
                            {entry.mood?.label || 'Calm'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {entry.cover_image_url && (
                      <div className="relative w-full h-[240px] md:h-[320px] mb-5 overflow-hidden rounded-xl bg-gray-100">
                        <Image
                          src={entry.cover_image_url}
                          alt="Cover Photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h2 style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.25rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: '8px' }}>
                      {entry.title || timeLabel}
                    </h2>
                    <p style={{ ...inter('0.85rem'), lineHeight: 1.75, color: 'var(--on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {excerpt || '(empty entry)'}
                    </p>
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {entry.tags.map(tag => (
                          <span key={tag.id} style={{ ...inter('0.6rem', 500), letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--on-surface-dim)', opacity: 0.7 }}>
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default withAuth(Dashboard);
