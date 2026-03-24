'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedPage(props: P) {
    const user = useAuthStore((s) => s.user);
    const loading = useAuthStore((s) => s.loading);
    const initialize = useAuthStore((s) => s.initialize);
    const router = useRouter();

    useEffect(() => {
      initialize();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return (
        <div className="flex h-screen items-center justify-center bg-black">
          <span className="text-white opacity-50 text-sm animate-pulse">Loading…</span>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
