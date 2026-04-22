'use client';

import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import LandingPage from '@/components/LandingPage';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format, isToday, parseISO } from 'date-fns';
import OnThisDayCard from '@/components/OnThisDayCard';
import { PenLine, X, ChevronDown, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router    = useRouter();
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

  const [currentPage,        setCurrentPage]        = useState(1);
  const [hasMore,            setHasMore]            = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const [isProfileOpen,      setIsProfileOpen]      = useState(false);
  const { logout } = useAuthStore();

  // 1. Initial dashboard core data (insights, tags)
  useEffect(() => {
    async function fetchCore() {
      try {
        const [tagsRes, insightsRes] = await Promise.all([
          api.get('/tags'),
          api.get('/insights', { params: { period: '7_days' } }),
        ]);
        setAllTags(tagsRes.data);
        setStreak(insightsRes.data.streak || 0);
      } catch (err) { console.error(err); }
    }
    fetchCore();
  }, []);

  // 2. Fetch Entries (handles both initial and load more)
  const fetchEntriesBatch = async (page: number, replace: boolean = false) => {
    if (page > 1) setIsFetchingNextPage(true);
    else setLoading(true);

    try {
      const res = await api.get('/entries', { 
        params: { 
          'tags[]': activeTagIds, 
          page, 
          per_page: 5,
          sort: sortOrder === 'recent' ? 'desc' : 'asc'
        } 
      });
      const batch: Entry[] = res.data.data;

      if (replace) {
        setEntries(batch);
        // Restore word count calculation for the "Reflections" card (first few entries summary)
        const words = batch
          .slice(0, 7)
          .reduce((acc, e) => acc + stripHtml(e.content).split(' ').filter(Boolean).length, 0);
        setWordCount(words);
      } else {
        setEntries(prev => [...prev, ...batch]);
      }

      setHasMore(res.data.current_page < res.data.last_page);
      setCurrentPage(res.data.current_page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFiltering(false);
      setIsFetchingNextPage(false);
    }
  };

  // Trigger initial list on tag or sort change
  useEffect(() => {
    setIsFiltering(true);
    fetchEntriesBatch(1, true);
  }, [activeTagIds, sortOrder]); // eslint-disable-line

  // 3. Infinite Scroll Intersection Observer
  useEffect(() => {
    if (loading || !hasMore || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchEntriesBatch(currentPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [currentPage, hasMore, loading, isFetchingNextPage]);

  function toggleTag(id: number) {
    setActiveTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  // ── Client-side Sort removed in favor of Server-side sorting ─────
  const sortedEntries = entries;

  return (
    <AppLayout>
      {/* ── Greeting Top Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pl-6 md:pl-10 lg:pl-16 pr-6 pt-8 relative">
        <p style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.05rem', fontWeight: 400, color: 'var(--on-surface)' }}>
          {getGreeting()}, {firstName}.
        </p>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 group transition focus:outline-none"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition group-hover:opacity-80 active:scale-95"
              style={{ background: 'var(--primary-container)', color: 'var(--primary)' }}
            >
              {firstName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-300 opacity-40 group-hover:opacity-70 ${isProfileOpen ? 'rotate-180' : ''}`} 
              style={{ color: 'var(--on-surface)' }} 
            />
          </button>

          {/* ── Dropdown ────────────────────────────────────────────────── */}
          {isProfileOpen && (
            <>
              {/* Click-away backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              />
              
              <div 
                className="absolute right-0 mt-3 w-64 rounded-2xl p-5 z-50 shadow-2xl border animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ 
                  background: 'var(--surface-container-high)', 
                  borderColor: 'var(--outline-variant)',
                  boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25)'
                }}
              >
                <div className="pb-4 border-b mb-3" style={{ borderColor: 'var(--outline-variant)' }}>
                  <p className="text-[10px] font-bold tracking-[0.12em] opacity-40 mb-2 uppercase" style={{ color: 'var(--on-surface)' }}>Account</p>
                  <p className="text-xl font-medium leading-tight" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>
                    {user?.name || 'Journalist'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-4 px-2 py-2.5 rounded-xl transition-colors hover:bg-[var(--surface-variant)] active:opacity-70"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings size={18} className="opacity-60" style={{ color: 'var(--on-surface)' }} />
                    <span style={inter('0.925rem', 400, 'var(--on-surface)')}>Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout(() => router.push('/login'));
                    }}
                    className="w-full flex items-center gap-4 px-2 py-2.5 rounded-xl transition-colors hover:bg-[var(--surface-variant)] active:opacity-70 group text-left"
                  >
                    <LogOut size={18} className="opacity-60" style={{ color: 'var(--on-surface)' }} />
                    <span style={inter('0.925rem', 400, 'var(--on-surface)')}>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-48 shrink-0">

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
                  <p style={{ ...inter('0.7rem'), color: '#8a7a52', marginTop: '4px', wordBreak: 'break-word', textWrap: 'balance' }}>Calm &amp; Focused</p>
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
                  <p style={{ ...inter('0.7rem'), color: '#4a6080', marginTop: '4px', wordBreak: 'break-word', textWrap: 'balance' }}>Total Words this week</p>
                </>
              )}
            </div>
          </div>
        </div>

        <OnThisDayCard />

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span style={{ ...inter('0.72rem', 500), color: 'var(--on-surface-dim)', alignSelf: 'center', marginRight: '4px' }}>
              Tag Filter:
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
                          alt={entry.title ? `Cover photo for entry: ${entry.title}` : `Cover photo from ${format(parseISO(entry.entry_date), 'MMMM d, yyyy')}`}
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

        {/* Infinite Scroll Sentinel & Footer State */}
        <div id="infinite-scroll-sentinel" className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-3 py-6" style={{ color: 'var(--on-surface-dim)' }}>
              <div className="w-4 h-4 rounded-full border-2 border-primary-dim border-t-transparent animate-spin" />
              <span className="text-xs font-inter tracking-wide uppercase font-medium">
                {sortOrder === 'recent' ? 'Fetching older thoughts...' : 'Fetching newer thoughts...'}
              </span>
            </div>
          )}
          {!hasMore && entries.length > 5 && (
            <p className="text-xs font-inter uppercase tracking-widest py-10" style={{ color: 'var(--outline-variant)' }}>
              {sortOrder === 'recent' 
                ? "You've reached the beginning of your journey" 
                : "You've caught up with the present"}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function DashboardWithAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface)]">
        <span className="text-[var(--on-surface)] opacity-50 text-sm animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

export default DashboardWithAuth;
