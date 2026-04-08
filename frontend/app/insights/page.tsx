'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface MoodTrend { date: string; value: number | null; emoji: string | null; label: string | null; }
interface InsightsData {
  total_entries: number; streak: number; max_streak: number;
  mood_distribution: Record<string, number>; mood_trend: MoodTrend[];
}

const PERIODS = [
  { value: '7_days',   label: '7 Days' },
  { value: '30_days',  label: '30 Days' },
  { value: '1_year',   label: '1 Year' },
];

function InsightsPage() {
  const [data,    setData]    = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('7_days');

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      try {
        const res = await api.get('/insights', { params: { period } });
        setData(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [period]);

  const chartData = (data?.mood_trend ?? []).map(i => ({
    date: format(parseISO(i.date), 'EEE'),
    value: i.value ?? 0,
    emoji: i.emoji,
    label: i.label,
  }));

  const totalEntries  = data?.total_entries ?? 0;
  const streak        = data?.streak        ?? 0;

  const topMood = data?.mood_distribution
    ? Object.entries(data.mood_distribution).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <AppLayout>
      <div className="px-6 md:px-10 lg:px-16 py-8">

        {/* Page heading */}
        <div className="mb-10">
          <h1
            className="text-3xl font-semibold"
            style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
          >
            Reflective Insights
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-dim)' }}>
            Tracing the rhythm of your inner world.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl p-5" style={{ background: 'var(--surface-container)' }}>
                  <div className="h-3 w-1/3 rounded mb-4" style={{ background: 'var(--surface-container-high)' }} />
                  <div className="h-8 w-1/2 rounded mb-2" style={{ background: 'var(--surface-container-high)' }} />
                  <div className="h-2 w-1/4 rounded" style={{ background: 'var(--surface-container-high)' }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 rounded-2xl h-80" style={{ background: 'var(--surface-container)' }} />
              <div className="lg:col-span-2 rounded-2xl h-80" style={{ background: 'var(--surface-container)' }} />
            </div>
          </div>
        ) : !data || data.total_entries === 0 ? (
          <div className="text-center py-24" style={{ color: 'var(--on-surface-dim)' }}>
            <p className="text-base">Write your first entry to see insights.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-inter">
              {[
                { label: 'Current Streak',  value: streak,       unit: 'Days',     sub: `↑ Best: ${data.max_streak} days`, icon: '🔥' },
                { label: 'Total Entries',   value: totalEntries, unit: 'Thoughts', sub: '',                                icon: '📖' },
                { label: 'Weekly Mood',     value: topMood ?? '–', unit: '',        sub: 'Consistent over last 7 days',   icon: '📈' },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--surface-container)' }}
                >
                  <p className="label-caps mb-3" style={{ color: 'var(--on-surface-dim)' }}>{card.label}</p>
                  <p
                    className="font-semibold leading-none capitalize"
                    style={{ fontSize: '2rem', color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
                  >
                    {typeof card.value === 'string' ? card.value.toLowerCase() : card.value}
                    {card.unit && (
                      <span className="text-xl font-inter ml-2" style={{ color: 'var(--on-surface-dim)' }}>
                        {card.unit}
                      </span>
                    )}
                  </p>
                  {card.sub && (
                    <p className="text-xs mt-2" style={{ color: 'var(--primary-dim)' }}>{card.sub}</p>
                  )}
                </div>
              ))}
            </div>

            {/* ── Chart + distribution ───*/}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

              {/* Mood Trend */}
              <div
                className="lg:col-span-3 rounded-2xl p-6"
                style={{ background: '#2d3c2f' }}
              >
                <div className="flex items-center justify-between mb-4 ">
                  <h2 className="text-base font-medium font-inter" style={{ color: '#e1e7df'}}>
                    Mood Trend
                  </h2>
                  <div className="flex gap-1 font-inter">
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className="label-caps px-3 py-1.5 rounded-full transition"
                        style={{
                          background: period === p.value ? 'rgba(167,209,165,0.2)' : 'transparent',
                          color: period === p.value ? '#a7d1a5' : '#6b716a',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64 mt-6 font-inter">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                      <XAxis dataKey="date" stroke="#6b716a" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b716a" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} ticks={[1,2,3,4,5]} />
                      <Tooltip
                        contentStyle={{ background: '#1c211d', border: 'none', borderRadius: '8px', color: '#e1e7df' }}
                        itemStyle={{ color: '#a7ada5' }}
                        formatter={(v: any, _: any, p: any) => v === 0 ? ['No entry', ''] : [`${v}/5 ${p.payload.emoji ?? ''}`, '']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#a7d1a5" strokeWidth={2.5}
                        dot={{ fill: '#2d3c2f', stroke: '#a7d1a5', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#a7d1a5' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mood Distribution */}
              <div
                className="lg:col-span-2 rounded-2xl p-6"
                style={{ background: '#2d3c2f' }}
              >
                <h2 className="text-base font-medium mb-4 font-inter" style={{ color: '#e1e7df'}}>
                  Mood Distribution
                </h2>
                <div className="space-y-3 font-inter">
                  {Object.entries(data.mood_distribution).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                    const pct = Math.round((count / data.total_entries) * 100);
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="label-caps" style={{ color: '#a7ada5' }}>{label}</span>
                          <span className="label-caps" style={{ color: '#6b716a' }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#a7d1a5' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Reflective Summary ──*/}
            <div
              className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: 'var(--surface-container-high)' }}
            >
              <div
                className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-5 select-none"
                
              >
                ✦
              </div>
              <p className="label-caps mb-3" style={{ color: 'var(--on-surface-dim)' }}>✦ AI Reflective Summary</p>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>
                Reflective Summary
              </h2>
              <p className="text-sm italic leading-relaxed mb-5" style={{ color: 'var(--on-surface-variant)', maxWidth: '50ch' }}>
                "You tend to feel most creative on Wednesday mornings after short journal entries. Your mood has shown a 12% increase in 'Calm' since you started the daily streak."
              </p>
              <button
                className="label-caps px-4 py-2 rounded-full border transition font-inter"
                style={{ borderColor: 'var(--primary-dim)', color: 'var(--primary)', background: 'transparent' }}
              >
                Deep Dive Analysis
              </button>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default withAuth(InsightsPage);
