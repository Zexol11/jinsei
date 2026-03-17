'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterPage() {
  const { user, register, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(name, email, password, passwordConfirmation);
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field: string) {
    return errors[field]?.[0];
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">MicroJournal</h1>
          <p className="text-zinc-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-white font-medium mb-6">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition"
                placeholder="Your name"
              />
              {fieldError('name') && (
                <p className="text-red-400 text-xs mt-1">{fieldError('name')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition"
                placeholder="you@example.com"
              />
              {fieldError('email') && (
                <p className="text-red-400 text-xs mt-1">{fieldError('email')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition"
                placeholder="Min. 8 characters"
              />
              {fieldError('password') && (
                <p className="text-red-400 text-xs mt-1">{fieldError('password')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5" htmlFor="password_confirmation">
                Confirm Password
              </label>
              <input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition"
                placeholder="Repeat password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white text-zinc-900 font-medium text-sm rounded-lg py-2.5 mt-2 hover:bg-zinc-100 disabled:opacity-50 transition"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
