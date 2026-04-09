'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from '@/components/auth.module.css';
import NatureBackground from '@/components/NatureBackground';

export default function LoginPage() {
  const user       = useAuthStore((s) => s.user);
  const login      = useAuthStore((s) => s.login);
  const loading    = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);
  const router     = useRouter();
  
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => { if (!loading && user) router.replace('/'); }, [user, loading, router]);

  if (loading || user) {
    return (
      <NatureBackground>
        <div className="flex h-screen w-full items-center justify-center">
          <span style={{ color: '#4E6952', fontWeight: 500 }} className="animate-pulse">
            {user ? 'Redirecting...' : 'Loading...'}
          </span>
        </div>
      </NatureBackground>
    );
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password, () => router.push('/'));
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NatureBackground>
      <div className={styles.formWrapper}>
        <div className="text-center">
          <p className={styles.wordmark}>jinsei</p>
          <p className={styles.tagline}>your life journal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input 
              id="email" type="email" autoComplete="email" required 
              value={email} onChange={e => setEmail(e.target.value)} 
              className={styles.input} placeholder="Email" 
            />
          </div>

          <div className={styles.inputWrapper}>
            <input 
              id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required 
              value={password} onChange={e => setPassword(e.target.value)} 
              className={`${styles.input} pr-10`} placeholder="Password" 
            />
            <button 
              type="button" onClick={() => setShowPassword(!showPassword)} 
              className={styles.eyeBtn}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" disabled={submitting} className={styles.signInBtn}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.signUpText}>
          Don’t have an account?{' '}
          <Link href="/register" className={styles.signUpLink}>Create one</Link>
        </p>
      </div>
    </NatureBackground>
  );
}