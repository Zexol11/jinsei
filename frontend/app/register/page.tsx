'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from '@/components/auth.module.css';
import NatureBackground from '@/components/NatureBackground';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPwConf,   setShowPwConf]   = useState(false);

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
    <NatureBackground>
      <div className={styles.formWrapper}>
        {/* Wordmark */}
        <div className="text-center">
          <p className={styles.wordmark}>jinsei</p>
          <p className={styles.tagline}>your life journal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input 
              id="name" type="text" autoComplete="name" required 
              value={name} onChange={e => setName(e.target.value)} 
              className={styles.input} placeholder="Full Name" 
            />
            {fe('name') && <div className={styles.errorBox}>{fe('name')}</div>}
          </div>

          <div className={styles.inputWrapper}>
            <input 
              id="email" type="email" autoComplete="email" required 
              value={email} onChange={e => setEmail(e.target.value)} 
              className={styles.input} placeholder="Email" 
            />
            {fe('email') && <div className={styles.errorBox}>{fe('email')}</div>}
          </div>

          <div className={styles.inputWrapper}>
            <input 
              id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required 
              value={password} onChange={e => setPassword(e.target.value)} 
              className={`${styles.input} pr-10`} placeholder="Password" 
            />
            <button 
              type="button" onClick={() => setShowPassword(!showPassword)} 
              className={styles.eyeBtn}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {fe('password') && <div className={styles.errorBox}>{fe('password')}</div>}
          </div>

          <div className={styles.inputWrapper}>
            <input 
              id="password_confirmation" type={showPwConf ? 'text' : 'password'} autoComplete="new-password" required 
              value={pwConf} onChange={e => setPwConf(e.target.value)} 
              className={`${styles.input} pr-10`} placeholder="Confirm Password" 
            />
            <button 
              type="button" onClick={() => setShowPwConf(!showPwConf)} 
              className={styles.eyeBtn}
            >
              {showPwConf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={submitting} className={styles.signInBtn}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.signUpText}>
          Already have an account?{' '}
          <Link href="/login" className={styles.signUpLink}>Sign in</Link>
        </p>
      </div>
    </NatureBackground>
  );
}
