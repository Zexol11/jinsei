'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const user       = useAuthStore((s) => s.user);
  const login      = useAuthStore((s) => s.login);
  const loading    = useAuthStore((s) => s.loading);
  const router     = useRouter();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { if (!loading && user) router.replace('/'); }, [user, loading, router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password, () => router.push('/'));
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--surface)' }}
    >
      {/* Wordmark */}
      <div className="mb-10 text-center">
        <p
          className="text-2xl italic font-semibold"
          style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif", letterSpacing: '-0.01em' }}
        >
          jinsei
        </p>
        <p className="label-caps mt-1" style={{ color: 'var(--on-surface-dim)' }}>your life journal</p>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--surface-container)' }}
      >
        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
        >
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-dim)' }}>
          Sign in to continue writing.
        </p>

        {error && (
          <div className="vellum-error-box mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-inter">
          <div>
            <label className="label-caps block mb-1.5" htmlFor="email" style={{ color: 'var(--on-surface-dim)' }}>
              Email
            </label>
            <input
              id="email" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="vellum-input" placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label-caps block mb-1.5" htmlFor="password" style={{ color: 'var(--on-surface-dim)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="vellum-input pr-10" placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--on-surface-dim)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-sm mt-6" style={{ color: 'var(--on-surface-dim)' }}>
        No account?{' '}
        <Link href="/register" className="font-medium transition" style={{ color: 'var(--primary)' }}>
          Create one
        </Link>
      </p>
    </div>
  );
}
