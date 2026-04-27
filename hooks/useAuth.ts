'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { TokenPair, User } from '@/types/api';

export function useAuth() {
  const { user, accessToken, hydrated, setTokens, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (hydrated && accessToken && !user) {
      api.get<User>('/auth/me').then(setUser).catch(() => logout());
    }
  }, [hydrated, accessToken, user, setUser, logout]);

  const login = async (email: string, password: string) => {
    const tokens = await api.postForm<TokenPair>('/auth/login', {
      username: email,
      password,
    });
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await api.get<User>('/auth/me');
    setUser(me);
  };

  return { user, accessToken, hydrated, login, logout };
}
