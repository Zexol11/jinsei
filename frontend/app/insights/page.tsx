'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Activity, Flame, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface MoodTrend {
  date: string;
  value: number | null;
  emoji: string | null;
  label: string | null;
}

interface InsightsData {
  total_entries: number;
  streak: number;
  max_streak: number;
  mood_distribution: Record<string, number>;
  mood_trend: MoodTrend[];
}

function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7_days');

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        const res = await api.get('/insights', { params: { period } });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch insights', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [period]);

  if (loading) {
    return (
      <AppLayout title="Insights">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-full mb-3" />
                <div className="w-24 h-5 bg-zinc-800/50 rounded mb-1" />
                <div className="w-16 h-9 bg-zinc-800/50 rounded" />
                <div className="w-20 h-4 bg-zinc-800/30 rounded mt-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="w-48 h-7 bg-zinc-800/50 rounded" />
                <div className="w-64 h-8 bg-zinc-800/50 rounded-lg hidden sm:block" />
              </div>
              <div className="w-full h-64 bg-zinc-800/30 rounded-xl" />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <div className="w-48 h-7 bg-zinc-800/50 rounded mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1 text-sm">
                       <div className="w-16 h-5 bg-zinc-800/50 rounded" />
                       <div className="w-12 h-5 bg-zinc-800/50 rounded" />
                    </div>
                    <div className="w-full h-2 bg-zinc-800/30 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </AppLayout>
    );
  }

  if (!data || data.total_entries === 0) {
    return (
      <AppLayout title="Insights">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-white mb-2">Not enough data</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Write your first journal entry to start seeing insights about your writing habits and mood trends.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Format trend data for Recharts
  const chartData = data.mood_trend.map(item => ({
    date: format(parseISO(item.date), 'MMM d'),
    value: item.value || 0, // Fallback to 0 if no entry so line drops, or filter out
    emoji: item.emoji,
    label: item.label
  }));

  // Calculate generic mood summary
  const totalValuedEntries = data.mood_trend.filter(i => i.value !== null).length;
  const avgMood = totalValuedEntries > 0 
    ? data.mood_trend.reduce((acc, curr) => acc + (curr.value || 0), 0) / totalValuedEntries
    : 0;

  let moodDescription = "Stable";
  if (avgMood >= 4) moodDescription = "Excellent";
  else if (avgMood >= 3) moodDescription = "Good";
  else if (avgMood > 0 && avgMood < 2.5) moodDescription = "Struggling";

  const periods = [
    { value: '7_days', label: '7 Days' },
    { value: '30_days', label: '30 Days' },
    { value: '1_year', label: '1 Year' },
    { value: 'all_time', label: 'All Time' },
  ];

  return (
    <AppLayout title="Insights">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-orange-500/10 text-orange-500 p-3 rounded-full mb-3">
              <Flame size={24} />
            </div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Current Streak</p>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              {data.streak} <span className="text-lg text-zinc-500 font-medium">days</span>
            </h3>
            {data.streak === data.max_streak && data.streak > 0 && (
              <p className="text-xs text-orange-400 mt-2 font-medium">Personal Best!</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full mb-3">
              <Activity size={24} />
            </div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Total Entries</p>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              {data.total_entries}
            </h3>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full mb-3">
              <TrendingUp size={24} />
            </div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Avg Weekly Mood</p>
            <h3 className="text-3xl font-bold tracking-tight text-white mb-1">
              {avgMood > 0 ? avgMood.toFixed(1) : '-'} <span className="text-lg text-zinc-500 font-medium">/ 5</span>
            </h3>
            <p className="text-xs text-emerald-400 font-medium">{moodDescription}</p>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Chart (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-zinc-400" />
                Mood Trend
              </h3>
              
              <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 overflow-x-auto no-scrollbar max-w-full sm:max-w-max">
                {periods.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${period === p.value ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#a1a1aa' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any, name: any, props: any) => {
                      if (value === 0) return ['No entry', 'Mood'];
                      return [`${value}/5 ${props.payload.emoji || ''}`, 'Mood'];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#18181b', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <PieChart size={18} className="text-zinc-400" />
              Mood Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(data.mood_distribution).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                const percentage = Math.round((count / data.total_entries) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-zinc-300 capitalize font-medium">{label}</span>
                      <span className="text-zinc-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default withAuth(InsightsPage);
