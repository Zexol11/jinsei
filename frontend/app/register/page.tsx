'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterPage() {
  const user     = useAuthStore((s) => s.user);
  const register = useAuthStore((s) => s.register);
  const loading  = useAuthStore((s) => s.loading);
  const router   = useRouter();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [pwConf,   setPwConf]   = useState('');
  const [errors,   setErrors]   = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && user) router.replace('/'); }, [user, loading, router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(name, email, password, pwConf, () => router.push('/'));
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;
      if (apiErrors) setErrors(apiErrors);
    } finally {
      setSubmitting(false);
    }
  }

  const fe = (f: string) => errors[f]?.[0];

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
          microjournal
        </p>
        <p className="label-caps mt-1" style={{ color: 'var(--on-surface-dim)' }}>The Digital Vellum</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: 'var(--surface-container)' }}>
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>
          Begin your journal
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-dim)' }}>Create your account to start writing.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-caps block mb-1.5" htmlFor="name" style={{ color: 'var(--on-surface-dim)' }}>Full Name</label>
            <input id="name" type="text" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} className="vellum-input" placeholder="Your name" />
            {fe('name') && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{fe('name')}</p>}
          </div>
          <div>
            <label className="label-caps block mb-1.5" htmlFor="email" style={{ color: 'var(--on-surface-dim)' }}>Email Address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="vellum-input" placeholder="you@example.com" />
            {fe('email') && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{fe('email')}</p>}
          </div>
          <div>
            <label className="label-caps block mb-1.5" htmlFor="password" style={{ color: 'var(--on-surface-dim)' }}>Password</label>
            <input id="password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} className="vellum-input" placeholder="Min. 8 characters" />
            {fe('password') && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{fe('password')}</p>}
          </div>
          <div>
            <label className="label-caps block mb-1.5" htmlFor="password_confirmation" style={{ color: 'var(--on-surface-dim)' }}>Confirm Password</label>
            <input id="password_confirmation" type="password" autoComplete="new-password" required value={pwConf} onChange={e => setPwConf(e.target.value)} className="vellum-input" placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-sm mt-6" style={{ color: 'var(--on-surface-dim)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium transition" style={{ color: 'var(--primary)' }}>Sign in</Link>
      </p>
    </div>
  );
}
