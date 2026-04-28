'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDS === 'true';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Hoş geldiniz');
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('test@test.com');
    setPassword('test123');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-brand-50 p-4">
      <div className="w-full max-w-md card">
        <div className="mb-6 text-center">
          <div className="text-5xl">📦</div>
          <h1 className="mt-2 text-2xl font-semibold">Stok Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">Hesabınıza giriş yapın</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="label">E-posta</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Şifre</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={7}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? 'Gizle' : 'Göster'}
              </button>
            </div>
          </div>
          {error && (
            <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
          {showDemo && (
            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-xs text-slate-500 hover:text-brand-700 underline"
            >
              Demo bilgileriyle doldur
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
