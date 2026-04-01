'use client';

import { useAuthStore } from '@/store/authStore';
import { BookOpen, Calendar, BarChart2, Settings, Trash2, LogOut, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: 'Journal',   href: '/',          icon: BookOpen },
  { label: 'Calendar',  href: '/calendar',   icon: Calendar },
  { label: 'Insights',  href: '/insights',   icon: BarChart2 },
  { label: 'Trash',     href: '/trash',      icon: Trash2 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--surface)' }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-screen py-7 px-5"
        style={{ background: 'var(--surface-container-low)' }}
      >
        {/* Wordmark */}
        <div className="mb-10">
          <p
            className="text-base font-semibold italic tracking-tight leading-none"
            style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
          >
            microjournal
          </p>
          <p
            className="label-caps mt-1"
            style={{ color: 'var(--on-surface-dim)' }}
          >
            The Digital Vellum
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--surface-variant)]"
                style={{
                  background: isActive ? 'var(--surface-container-high)' : undefined,
                  color: isActive ? 'var(--on-surface)' : 'var(--on-surface-dim)',
                }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-dim)' }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '0.875rem', /* 14px */
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.01em',
                    color: isActive ? 'var(--on-surface)' : 'var(--on-surface-dim)',
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="space-y-2 mt-auto">
          {/* Settings link */}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--surface-variant)]"
            style={{
              background: pathname === '/settings' ? 'var(--surface-container-high)' : undefined,
              color: pathname === '/settings' ? 'var(--on-surface)' : 'var(--on-surface-dim)',
            }}
          >
            <Settings size={14} style={{ color: pathname === '/settings' ? 'var(--primary)' : 'var(--on-surface-dim)' }} />
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.875rem', /* 14px */
                fontWeight: pathname === '/settings' ? 600 : 400,
                letterSpacing: '0.01em',
                color: pathname === '/settings' ? 'var(--on-surface)' : 'var(--on-surface-dim)',
              }}
            >Settings</span>
          </Link>

         
         
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-14 px-2"
        style={{ background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}
      >
        {[...NAV_ITEMS, { label: 'Settings', href: '/settings', icon: Settings }].map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
              style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-dim)' }}
            >
              <Icon size={18} />
              <span className="label-caps" style={{ fontSize: '0.5rem' }}>{label}</span>
            </Link>
          );
        })}

        {/* Logout on mobile */}
        <button
          onClick={() => logout(() => router.push('/login'))}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
          style={{ color: 'var(--on-surface-dim)' }}
        >
          <LogOut size={18} />
          <span className="label-caps" style={{ fontSize: '0.5rem' }}>Logout</span>
        </button>
      </nav>

    </div>
  );
}
