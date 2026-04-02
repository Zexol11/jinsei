'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday, parseISO,
  startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';

interface CalendarMood  { id: number; emoji: string; label: string; value: number; }
interface CalendarEntry { id: number; mood: CalendarMood; title: string | null; }
type MonthlyEntries = Record<string, CalendarEntry>;

interface InsightsSummary {
  streak: number;
  total_entries: number;
  mood_distribution: Record<string, number>;
}

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries,     setEntries]     = useState<MonthlyEntries>({});
  const [loading,     setLoading]     = useState(true);
  const [insights,    setInsights]    = useState<InsightsSummary | null>(null);
  const [topTags,     setTopTags]     = useState<{ name: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const monthQuery = format(currentDate, 'yyyy-MM');
        const [calRes, insRes, tagsRes] = await Promise.all([
          api.get(`/entries/calendar?month=${monthQuery}`),
          api.get('/insights', { params: { period: 'all_time' } }),
          api.get('/tags'),
        ]);
        setEntries(calRes.data);
        setInsights(insRes.data);
        setTopTags((tagsRes.data as { name: string }[]).slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentDate]);

  const monthStart   = startOfMonth(currentDate);
  const monthEnd     = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  const weekDays     = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Dominant mood from distribution
  const dominantMood = insights?.mood_distribution
    ? Object.entries(insights.mood_distribution).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <AppLayout>
      <div className="flex min-h-screen">

        {/* ── Main calendar area ──────────────────────────────────────── */}
        <div className="flex-1 px-4 md:px-10 lg:px-20 py-8 md:py-12 min-w-0">

          {/* Month nav */}
          <div className="flex items-center gap-5 mb-10">
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="p-1 transition" style={{ color: 'var(--on-surface-dim)' }}>
              <ChevronLeft size={18} />
            </button>
            <h1
              className="text-2xl md:text-4xl font-semibold"
              style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
            >
              {format(currentDate, 'MMMM yyyy')}
            </h1>
            <button
              onClick={() => setCurrentDate(d => addMonths(d, 1))}
              disabled={format(currentDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
              className="p-1 transition disabled:opacity-30"
              style={{ color: 'var(--on-surface-dim)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Calendar Card */}
          <div 
            className="rounded-2xl overflow-hidden mt-6" 
            style={{ border: '1px solid color-mix(in srgb, var(--outline-variant) 30%, transparent)' }}
          >
            {/* Day headers */}
            <div className="grid grid-cols-7" style={{ borderBottom: '1px solid color-mix(in srgb, var(--outline-variant) 30%, transparent)', background: 'var(--surface-container)' }}>
              {weekDays.map(d => (
                <div key={d} className="text-center label-caps py-4 font-inter" style={{ color: 'var(--on-surface-dim)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7" style={{ background: 'var(--surface-container)' }}>
              {loading 
                ? Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className={`min-h-[120px] p-3 flex flex-col justify-between transition-colors duration-200 ${(i + 1) % 7 === 0 ? '' : 'border-r'} border-b animate-pulse`}
                      style={{ 
                        borderColor: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)',
                        background: 'var(--surface-container-low)'
                      }}
                    >
                      <div className="h-4 w-6 rounded" style={{ background: 'var(--surface-container-high)' }} />
                      <div className="h-4 w-12 rounded mt-auto flex justify-center w-full" style={{ background: 'var(--surface-container-high)' }} />
                    </div>
                  ))
                : calendarDays.map((day, i) => {
                const dateKey  = format(day, 'yyyy-MM-dd');
                const entry    = entries[dateKey];
                const inMonth  = isSameMonth(day, monthStart);
                const today    = isToday(day);
                const isFuture = day > new Date();

                const isLastCol = (i + 1) % 7 === 0;

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[120px] p-3 flex flex-col justify-between transition-colors duration-200 ${isLastCol ? '' : 'border-r'} border-b ${inMonth ? 'hover:bg-[var(--surface-variant)]' : ''}`}
                    style={{ 
                      borderColor: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)',
                      ...(inMonth ? {} : { background: 'var(--surface-container-low)' }),
                    }}
                  >
                    {!isFuture && inMonth ? (
                      <Link
                        href={`/entry/${dateKey}`}
                        className="flex-1 h-full flex flex-col justify-between group"
                      >
                        {/* Top Left: Date */}
                        <span
                          className="text-sm font-inter"
                          style={{
                            color: today ? 'var(--primary)' : 'var(--on-surface)',
                            fontWeight: today ? 700 : 500,
                          }}
                        >
                          {format(day, 'd')}
                        </span>
                        
                        {/* Bottom Left: Event Emoji */}
                        <div className="mt-auto">
                          {entry && (
                            <span className="text-lg leading-none" title={entry.mood.label}>
                              {entry.mood.emoji}
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex-1 h-full flex flex-col justify-between">
                        <span className="text-sm font-inter" style={{ color: 'var(--outline-variant)' }}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside
          className="hidden xl:flex flex-col w-96 shrink-0 py-8 px-8 gap-5"
          style={{ borderLeft: '1px solid var(--outline-variant)' }}
        >
          <p className="label-caps mb-2" style={{ color: 'var(--on-surface-dim)' }}>Monthly Insights</p>

          {/* Dominant mood */}
          <div className="rounded-2xl p-5 min-h-[110px]" style={{ background: '#2d3c2f' }}>
            <p className="label-caps mb-2" style={{ color: '#e1e7df' }}>Dominant Mood</p>
            {loading ? (
              <div className="animate-pulse space-y-3 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: '60%' }} />
                </div>
                <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#a7d1a5' }} />
                  <p className="text-base font-medium capitalize" style={{ color: '#e1e7df', fontFamily: "'Noto Serif', serif" }}>
                    {dominantMood ?? 'Calm & Centered'}
                  </p>
                </div>
                <p className="text-xs italic leading-relaxed" style={{ color: '#a7ada5' }}>
                  "12 days marked by serene reflections and steady focus."
                </p>
              </>
            )}
          </div>

          {/* Writing streak */}
          <div className="rounded-2xl p-5 min-h-[96px]" style={{ background: '#2d3c2f' }}>
            <p className="label-caps mb-2" style={{ color: '#e1e7df' }}>Writing Streak</p>
            {loading ? (
              <div className="animate-pulse mt-2 h-8 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: '40%' }} />
            ) : (
              <p
                className="text-4xl font-semibold"
                style={{ color: 'white', fontFamily: "'Noto Serif', serif", lineHeight: 1 }}
              >
                {insights?.streak ?? '—'}
                <span className="text-xl font-normal ml-1 font-inter" style={{ color: '#a7ada5' }}>Days</span>
              </p>
            )}
          </div>

          {/* Tags */}
          {topTags.length > 0 && (
            <div>
              <p className="label-caps mb-3" style={{ color: 'var(--on-surface-dim)' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {topTags.map(tag => (
                  <span
                    key={tag.name}
                    className="label-caps px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--surface-container-high)', color: 'var(--primary-dim)' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zenith Reflection (static placeholder) */}
          <div
            className="rounded-2xl p-5 mt-auto"
            style={{ background: 'var(--surface-container-high)' }}
          >
            <Sparkles size={16} className="mb-2" style={{ color: 'var(--primary-dim)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>
              Zenith Reflection
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              Your entries suggest a shift toward mindful productivity this week.
            </p>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}

export default withAuth(CalendarPage);
