'use client';

import JournalEditor from '@/components/JournalEditor';
import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, isToday, parseISO } from 'date-fns';
import { PenLine, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Mood {
  id: number;
  label: string;
  emoji: string;
  value: number;
}

interface Entry {
  id: number;
  entry_date: string;
  content: string;
  mood: Mood;
}

function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // To verify if there's an entry today
  const hasEntryToday = entries.some(entry => isToday(parseISO(entry.entry_date)));

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await api.get('/entries');
        setEntries(res.data.data || res.data);
      } catch (err) {
        console.error('Failed to fetch entries', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  const headerActions = !loading && !hasEntryToday ? (
    <Link 
      href={`/entry/${format(new Date(), 'yyyy-MM-dd')}`}
      className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition"
    >
      <Plus size={16} />
      Write Today
    </Link>
  ) : null;

  return (
    <AppLayout title="Dashboard" headerActions={headerActions}>
      {/* Entries List */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          
          <div className="flex justify-center py-4 mb-4">
            <div className="bg-zinc-800/50 p-4 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <PenLine className="w-6 h-6 text-zinc-500" />
            </div>
          </div>

          {[1, 2, 3].map(i => (
            <div key={i} className="block bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 h-[170px]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-32 h-5 bg-zinc-800/60 rounded" />
                <div className="w-10 h-8 bg-zinc-800/60 rounded-full" />
              </div>
              <div className="space-y-3 mt-6">
                <div className="w-full h-4 bg-zinc-800/40 rounded" />
                <div className="w-5/6 h-4 bg-zinc-800/40 rounded" />
                <div className="w-2/3 h-4 bg-zinc-800/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <PenLine className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">No entries yet</h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
            You haven't written anything yet. Start your journaling journey by creating your first entry today.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map(entry => {
            const dateParam = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
            return (
              <Link 
                key={entry.id} 
                href={`/entry/${dateParam}`}
                className="block group bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 text-sm font-medium">
                    {format(parseISO(entry.entry_date), 'MMMM d, yyyy')}
                  </span>
                  <span 
                    className="text-xl px-3 py-1 bg-zinc-800 rounded-full" 
                    title={entry.mood.label}
                  >
                    {entry.mood.emoji}
                  </span>
                </div>
                
                <div 
                  className="prose prose-sm prose-invert prose-zinc max-w-none line-clamp-3 text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(Dashboard);
