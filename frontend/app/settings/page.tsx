'use client';

import withAuth from '@/components/withAuth';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';

function SettingsPage() {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload: any = { name, email };
      
      if (password) {
        if (password !== passwordConfirmation) {
          setError('Passwords do not match');
          setSaving(false);
          return;
        }
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      const res = await api.patch('/auth/me', payload);
      setUser(res.data); // Update context with new user info
      setSuccess('Profile updated successfully!');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Settings Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Profile Section */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <UserIcon size={18} className="text-zinc-400" />
                Profile Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Password Section */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Lock size={18} className="text-zinc-400" />
                Change Password (Optional)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-xl text-sm font-medium hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </AppLayout>
  );
}

export default withAuth(SettingsPage);
