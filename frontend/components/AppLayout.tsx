import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LayoutDashboard, Calendar, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import api from '@/lib/api';

const MOOD_EMOJIS: Record<string, string> = {
  excellent: '🤩',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  terrible: '😫',
};

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
}

export default function AppLayout({ children, title, headerActions }: AppLayoutProps) {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Insights', href: '/insights', icon: TrendingUp },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const [miniInsights, setMiniInsights] = useState<{
    streak: number;
    total_entries: number;
    most_common_mood: string | null;
  } | null>(null);
  const [loadingMini, setLoadingMini] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchMiniInsights() {
      try {
        const res = await api.get('/insights', { params: { period: 'all_time' } });
        if (isMounted) {
          const data = res.data;
          
          let topMood = null;
          let maxCount = 0;
          if (data.mood_distribution) {
             Object.entries(data.mood_distribution).forEach(([mood, count]) => {
                if ((count as number) > maxCount) {
                   maxCount = count as number;
                   topMood = mood;
                }
             });
          }
          
          setMiniInsights({
            streak: data.streak || 0,
            total_entries: data.total_entries || 0,
            most_common_mood: topMood,
          });
        }
      } catch (err) {
        console.error('Failed to fetch mini insights', err);
      } finally {
        if (isMounted) setLoadingMini(false);
      }
    }
    fetchMiniInsights();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow shadow-blue-500/20">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight">microjournal</h1>
        </div>

        {/* Mini Insights Widget */}
        {(loadingMini || (miniInsights && miniInsights.total_entries > 0)) && (
          <div className="mb-6 px-1">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">Insights</h3>
            {loadingMini ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                  <div className="w-24 h-4 bg-zinc-800 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                  <div className="w-16 h-4 bg-zinc-800 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                  <div className="w-28 h-4 bg-zinc-800 rounded" />
                </div>
              </div>
            ) : miniInsights && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 text-sm text-zinc-100 font-medium">
                  <span className="text-xl">🔥</span> 
                  <span>{miniInsights.streak}-day streak</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-100 font-medium">
                  <span className="text-xl">📖</span> 
                  <span>{miniInsights.total_entries} {miniInsights.total_entries === 1 ? 'entry' : 'entries'}</span>
                </div>
                {miniInsights.most_common_mood && (
                  <div className="flex items-center gap-3 text-sm text-zinc-100 font-medium">
                    <span className="text-xl">{MOOD_EMOJIS[miniInsights.most_common_mood] || '😐'}</span> 
                    <span className="capitalize">Most common mood</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive 
                  ? 'bg-zinc-800 text-white font-medium shadow-sm border border-zinc-700' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-blue-500' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 mt-auto rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0 overflow-x-hidden relative">
        {(title || headerActions) && (
          <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-3">
              {headerActions}
            </div>
          </header>
        )}
        <div className="p-4 md:p-8 flex-1 max-w-4xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 pb-safe">
        <div className="flex justify-around items-center h-16 px-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition ${
                  isActive ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <item.icon size={20} className={isActive ? 'opacity-100' : 'opacity-80'} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
