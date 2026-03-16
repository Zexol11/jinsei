'use client';

import JournalEditor from '@/components/JournalEditor';
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <h1 className="text-2xl font-semibold tracking-tight">MicroJournal</h1>
          
          {!loading && !hasEntryToday && (
            <Link 
              href={`/entry/${format(new Date(), 'yyyy-MM-dd')}`}
              className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition"
            >
              <Plus size={16} />
              Write Today's Entry
            </Link>
          )}
        </header>

        {/* Entries List */}
        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading your journal...</div>
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
            {entries.map(entry => (
              <Link 
                key={entry.id} 
                href={`/entry/${entry.entry_date}`}
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
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default withAuth(Dashboard);
