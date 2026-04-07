'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useTheme } from 'next-themes';

const Row = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:gap-16 py-10" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
    <div className="md:w-56 shrink-0 mb-4 md:mb-0">
      <p className="text-base font-medium" style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}>{label}</p>
      {description && <p className="text-sm mt-1 leading-relaxed font-inter" style={{ color: 'var(--on-surface-dim)' }}>{description}</p>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

function SettingsPage() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name,     setName]     = useState(user?.name  || '');
  const [email,    setEmail]    = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [pwConf,   setPwConf]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAcc,   setDeletingAcc]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPwConf,   setShowPwConf]   = useState(false);
  
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const { theme, setTheme } = useTheme();

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const payload: Record<string, string> = { name, email };
      if (password) {
        if (password !== pwConf) { setError('Passwords do not match'); setSaving(false); return; }
        payload.password = password;
        payload.password_confirmation = pwConf;
      }
      const res = await api.patch('/auth/me', payload);
      setUser(res.data);
      setSuccess('Preferences saved.');
      setPassword('');
      setPwConf('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setConfirmDelete(false);
    setDeletingAcc(true);
    setError('');
    try {
      await api.delete('/auth/me');
      logout(() => {
        router.push('/login');
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account.');
      setDeletingAcc(false);
    }
  }

  const hasChanges = name !== (user?.name || '') || email !== (user?.email || '') || password !== '' || pwConf !== '';

  return (
    <AppLayout>
      <div className="px-8 md:px-12 xl:px-16 py-8">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
        >
          Settings
        </h1>
        <p className="text-sm mb-4 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Personalize your digital vellum.</p>

        <form onSubmit={handleSave}>

          <Row label="Profile" description="Personalize how you appear in your digital vellum.">
            <div className="space-y-4">
              <div>
                <label className="label-caps block mb-1.5 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="vellum-input"
                />
              </div>
              <div>
                <label className="label-caps block mb-1.5 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="vellum-input"
                />
              </div>
            </div>
          </Row>

          <Row label="Account" description="Manage your credentials and security access.">
            <div
              className="flex items-center justify-between rounded-xl px-5 py-4"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <div>
                <p className="text-sm font-medium font-inter" style={{ color: 'var(--on-surface)'}}>Password</p>
                <p className="text-xs mt-0.5 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Leave blank to keep current password</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('pw-section');
                  if (el) el.classList.toggle('hidden');
                }}
                className="label-caps px-3 py-1.5 rounded-lg transition-colors font-inter hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--primary)' }}
              >
                Update
              </button>
            </div>
            <div id="pw-section" className="hidden mt-4 space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  className="vellum-input pr-10"
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
              <div className="relative">
                <input
                  type={showPwConf ? 'text' : 'password'}
                  value={pwConf} onChange={e => setPwConf(e.target.value)}
                  placeholder="Confirm new password"
                  className="vellum-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwConf(!showPwConf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--on-surface-dim)' }}
                >
                  {showPwConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </Row>

          <Row label="Theme Preferences" description="Choose the visual aesthetic for your digital writing space.">
            <div className="flex gap-4">
              {(['light', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className="flex-1 rounded-2xl overflow-hidden border-2 transition-colors hover:border-[var(--primary)]"
                  style={{
                    borderColor: theme === mode ? 'var(--primary)' : 'var(--outline-variant)',
                  }}
                >
                  <div
                    className="h-20 flex items-center justify-center"
                    style={{ background: mode === 'light' ? '#f5f3ee' : '#0d0f0d' }}
                  >
                    <div className="w-12 h-1.5 rounded-full opacity-40" style={{ background: mode === 'light' ? '#3d6645' : '#a7d1a5' }} />
                  </div>
                  <div
                    className="py-2 text-center label-caps font-inter"
                    style={{
                      background: mode === 'light' ? '#edeae3' : '#1c211d',
                      color: mode === 'light' ? '#4a4845' : '#a7ada5',
                    }}
                  >
                    {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                </button>
              ))}
            </div>
          </Row>

          {(success || error) && (
            <div
              className="my-4 px-4 py-3 rounded-xl text-sm font-inter"
              style={{
                background: success ? 'var(--primary-container)' : '#fce4e4',
                color: success ? 'var(--primary)' : 'var(--error)',
              }}
            >
              {success || error}
            </div>
          )}

          <div className="flex justify-end gap-4 py-8">
            <button
              type="button"
              disabled={!hasChanges}
              onClick={() => { setName(user?.name || ''); setEmail(user?.email || ''); setPassword(''); setPwConf(''); setSuccess(''); setError(''); }}
              className="label-caps transition font-inter border px-4 py-2 rounded-lg hover:bg-[var(--surface-container-high)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ color: 'var(--on-surface-dim)', borderColor: hasChanges ? 'var(--outline-variant)' : 'transparent' }}
            >
              Discard changes
            </button>
            <button type="submit" disabled={saving || !hasChanges} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Preferences
            </button>
          </div>
        </form>

        <Row label="Session" description="Manage your current active session on this device.">
          <div className="flex justify-end">
            <button
              onClick={() => logout(() => router.push('/login'))}
              className="flex items-center gap-2 label-caps px-5 py-2.5 rounded-xl border-2 transition hover:bg-[var(--surface-container-high)]"
              style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
            >
              Logout
            </button>
          </div>
        </Row>

        <div
          className="rounded-2xl p-6 mt-4 font-inter border-2 transition-all"
          style={{ background: '#fce4e4', borderColor: '#f2b8b5' }}
        >
          <p className="label-caps mb-1" style={{ color: '#b3261e' }}>Danger Zone</p>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#7a2020' }}>
            Once you delete your account, there is no going back. All entries will be purged from our servers forever.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deletingAcc}
            className="flex items-center gap-2 label-caps px-4 py-2 rounded-full border-2 transition bg-transparent disabled:opacity-50 text-[#b3261e] border-[#b3261e] hover:bg-[#b3261e] hover:text-white"
          >
            {deletingAcc && <Loader2 size={14} className="animate-spin" />}
            Delete jinsei account
          </button>
        </div>
      </div>

      {/* ── Confirm Delete Account Modal ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setConfirmDelete(false)}
          />
          <div
            className="relative rounded-2xl p-7 shadow-2xl w-full max-w-sm animate-in"
            style={{ background: 'var(--surface-container)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#b3261e', fontFamily: "'Noto Serif', serif" }}>
              Final Warning
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
              Are you absolutely sure? This will permanently delete your account, your settings, and all of your journal entries. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-full text-sm transition hover:opacity-80"
                style={{ color: 'var(--on-surface-variant)', background: 'var(--surface-container-high)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition hover:opacity-80"
                style={{ background: '#b3261e', color: '#fff' }}
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default withAuth(SettingsPage);
