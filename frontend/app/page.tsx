'use client';

import AppLayout from '@/components/AppLayout';
import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { format, isToday, parseISO } from 'date-fns';
import { PenLine, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Tag {
  id: number;
  name: string;
  slug: string;
}
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
  tags: Tag[];
}

function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const hasEntryToday = entries.some(entry => isToday(parseISO(entry.entry_date)));

  useEffect(() => {
    async function fetchData() {
      if (!loading) setIsFiltering(true);
      try {
        const [entriesRes, tagsRes] = await Promise.all([
          api.get('/entries', { 
            params: activeTagIds.length > 0 ? { 'tags[]': activeTagIds } : {} 
          }),
          api.get('/tags'),
        ]);
        setEntries(entriesRes.data.data || entriesRes.data);
        setAllTags(tagsRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    }
    fetchData();
  }, [activeTagIds]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTag(id: number) {
    if (activeTagIds.includes(id)) {
      setActiveTagIds(activeTagIds.filter(t => t !== id));
    } else {
      setActiveTagIds([...activeTagIds, id]);
    }
  }

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

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTagIds([])}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              activeTagIds.length === 0
                ? 'bg-white text-zinc-950 border-white'
                : 'text-zinc-400 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            All
          </button>
          {allTags.map(tag => {
            const isActive = activeTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  isActive
                    ? 'bg-zinc-200 text-zinc-900 border-zinc-200'
                    : 'text-zinc-400 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
          {activeTagIds.length > 0 && (
            <button onClick={() => setActiveTagIds([])} className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-xs ml-1">
             Clear <X size={12} /> 
            </button>
          )}
        </div>
      )}

      {/* Entries List */}
      {(loading || isFiltering) ? (
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
          <h2 className="text-lg font-medium text-white mb-2">
            {activeTagIds.length > 0 ? 'No entries match these tags' : 'No entries yet'}
          </h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
            {activeTagIds.length > 0
              ? 'Try different combinations or clear the filters to see all entries.'
              : "You haven't written anything yet. Start your journaling journey by creating your first entry today."}
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
                  className="prose prose-sm prose-invert prose-zinc max-w-none line-clamp-3 text-zinc-300 mb-4"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />

                {/* Tag chips */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(Dashboard);
