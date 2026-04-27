'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Client-side guard: redirects to /login when there's no session,
 * or away from /login when already authenticated.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { accessToken, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const onLoginPage = pathname === '/login';

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken && !onLoginPage) router.replace('/login');
    if (accessToken && onLoginPage) router.replace('/');
  }, [hydrated, accessToken, onLoginPage, router]);

  if (!hydrated) {
    return <div className="p-8 text-slate-500">Yükleniyor…</div>;
  }
  if (!accessToken && !onLoginPage) return null;
  if (accessToken && onLoginPage) return null;
  return <>{children}</>;
}
