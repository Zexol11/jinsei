'use client';

import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { CalendarHeart, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Tag { id: number; name: string; }
interface Mood { id: number; label: string; emoji: string; value: number; }
interface Entry { id: number; entry_date: string; content: string; mood: Mood; tags: Tag[]; }

export default function OnThisDayCard() {
  const [memories, setMemories] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemories() {
      try {
        const res = await api.get('/memories/on-this-day', {
          headers: {
            'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        });
        setMemories(res.data);
        if (res.data.length > 0) {
          setExpandedDate(res.data[0].entry_date);
        }
      } catch (err) {
        console.error('Failed to fetch memories', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMemories();
  }, []);



  if (memories.length === 0) {
    return null;
  }

  // Group memories so we can show exactly how many years ago each was
  const currentYear = new Date().getFullYear();

  return (
    <div className="mb-8 overflow-hidden border border-blue-900/40 bg-gradient-to-b from-blue-950/40 to-zinc-950/20 rounded-2xl shadow-xl shadow-blue-900/5">
      <div className="px-6 py-4 border-b border-blue-900/30 flex items-center justify-between bg-blue-950/20">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-900/40 p-1.5 rounded-lg text-blue-500">
            <CalendarHeart size={18} />
          </div>
          <h2 className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
            On this day
          </h2>
        </div>
        <span className="text-xs font-medium text-blue-500/80 bg-blue-900/20 px-2 py-1 rounded-full">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
        </span>
      </div>

      <div className="divide-y divide-blue-900/20">
        {memories.map((entry) => {
          const entryDate = parseISO(entry.entry_date);
          const yearsAgo = currentYear - entryDate.getFullYear();
          const isExpanded = expandedDate === entry.entry_date;

          return (
            <div key={entry.id} className="p-6 transition-colors hover:bg-blue-950/10">
              <button
                onClick={() => setExpandedDate(isExpanded ? null : entry.entry_date)}
                className="w-full flex items-center justify-between focus:outline-none group text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-lg" title={entry.mood.label}>{entry.mood.emoji}</span>
                    <div>
                      <h3 className="text-zinc-200 font-medium group-hover:text-blue-300 transition-colors">
                        {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {format(entryDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-blue-700/50 group-hover:text-blue-500">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div 
                    className="prose prose-sm prose-invert prose-zinc max-w-none text-zinc-300 
                               prose-p:leading-relaxed prose-a:text-blue-400 border-l-2 border-blue-900/30 pl-4"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pl-4">
                      {entry.tags.map(tag => (
                        <span key={tag.id} className="text-[11px] font-medium text-blue-600/70 bg-blue-950/30 border border-blue-900/30 px-2 py-0.5 rounded-full">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pl-4">
                    <Link 
                      href={`/entry/${format(entryDate, 'yyyy-MM-dd')}`}
                      className="text-xs font-medium text-blue-500 hover:text-blue-400 transition"
                    >
                      View full entry →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
