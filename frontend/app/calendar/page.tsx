'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';

interface CalendarMood {
  id: number;
  emoji: string;
  label: string;
  value: number; // 1-5
}

interface CalendarEntry {
  id: number;
  mood: CalendarMood;
}

type MonthlyEntries = Record<string, CalendarEntry>;

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<MonthlyEntries>({});
  const [loading, setLoading] = useState(true);

  // When month changes, fetch the entries
  useEffect(() => {
    async function fetchCalendarData() {
      setLoading(true);
      try {
        const monthQuery = format(currentDate, 'yyyy-MM');
        const res = await api.get(`/entries/calendar?month=${monthQuery}`);
        setEntries(res.data);
      } catch (err) {
        console.error('Failed to fetch calendar data', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCalendarData();
  }, [currentDate]);

  function handlePrevMonth() {
    setCurrentDate((prev) => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prev) => addMonths(prev, 1));
  }

  // Calendar Grid Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = 'd';
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [hasEntryToday, setHasEntryToday] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);

  // Check if today has an entry
  useEffect(() => {
    async function checkToday() {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        await api.get(`/entries/${todayStr}`);
        setHasEntryToday(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasEntryToday(false);
        }
      } finally {
        setCheckingToday(false);
      }
    }
    checkToday();
  }, []);

  const headerActions = !checkingToday && !hasEntryToday ? (
    <Link 
      href={`/entry/${format(new Date(), 'yyyy-MM-dd')}`}
      className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition"
    >
      <Plus size={16} />
      Write Entry
    </Link>
  ) : null;

  return (
    <AppLayout title="Calendar History" headerActions={headerActions}>
        {/* Calendar Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={handlePrevMonth}
              className="p-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-medium tracking-tight">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition text-right"
              disabled={format(currentDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
            >
              <ChevronRight size={20} className={format(currentDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM') ? 'opacity-30' : ''} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 transition-opacity duration-200">
            {loading ? (
              Array.from({ length: 35 }).map((_, i) => (
                <div key={`skel-${i}`} className="aspect-square w-full h-full flex flex-col items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 animate-pulse">
                  <div className="w-6 h-6 bg-zinc-800/50 rounded-full mb-1" />
                  <div className="w-4 h-3 bg-zinc-800/50 rounded" />
                </div>
              ))
            ) : calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const entry = entries[dateKey];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);
              const isFuture = day > new Date();

              return (
                <div key={day.toString()} className="aspect-square">
                  {!isFuture ? (
                    <Link
                      href={`/entry/${dateKey}`}
                      className={`
                        w-full h-full flex flex-col items-center justify-center rounded-xl border relative transition-all group
                        ${!isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}
                        ${isTodayDate && !entry ? 'bg-zinc-800/50 border-zinc-600' : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800'}
                        ${entry && entry.mood.value >= 4 ? 'ring-1 ring-emerald-500/50' : ''}
                        ${entry && entry.mood.value <= 2 ? 'ring-1 ring-rose-500/50' : ''}
                      `}
                    >
                      <span className={`text-base sm:text-lg mb-1 ${!entry ? 'opacity-0 group-hover:opacity-10 text-white' : ''}`}>
                        {entry ? entry.mood.emoji : <Plus size={20} />}
                      </span>
                      <span className={`text-xs ${isTodayDate ? 'font-bold text-white' : 'text-zinc-500 font-medium'}`}>
                        {format(day, dateFormat)}
                      </span>
                    </Link>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center rounded-xl bg-zinc-950/20 border-zinc-800/30 border ${isCurrentMonth ? '' : 'opacity-0'}`}>
                      <span className="text-zinc-700/50 text-xs">{format(day, dateFormat)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

    </AppLayout>
  );
}

export default withAuth(CalendarPage);
