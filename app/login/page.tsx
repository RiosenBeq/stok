'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <span className="text-3xl">🍔</span>
            <span>Stok</span>
          </div>
          <p className="mt-1 text-sm text-brand-100/80">Burger Franchise Konsolu</p>
        </div>

        <div className="relative space-y-6 max-w-sm">
          <h2 className="text-3xl font-bold leading-tight">
            Şubelerinizi tek bir kontrol panelinden yönetin.
          </h2>
          <ul className="space-y-3 text-sm text-brand-50/90">
            <li className="flex items-start gap-3">
              <span className="text-lg">🍔</span>
              <span>POS — sepete ekle, tek dokunuşla onayla, reçete malzemeleri otomatik düşer</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">📊</span>
              <span>Anlık ciro, marj ve zayiat takibi şube bazında</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">🏪</span>
              <span>Sınırsız şube · transfer · düşük stok uyarıları</span>
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-brand-100/60">
          © {new Date().getFullYear()} Stok · Burger Franchise
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-ink-50">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden text-center mb-6">
            <div className="text-4xl">🍔</div>
            <div className="mt-1 text-xl font-semibold">Stok</div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Giriş yap</h1>
          <p className="mt-1 text-sm text-ink-500">Devam etmek için hesabınıza giriş yapın</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Input
              label="E-posta"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              iconLeft={<span>✉️</span>}
              placeholder="ornek@firma.com"
            />
            <div>
              <Input
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                iconLeft={<span>🔒</span>}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-xs text-ink-500 hover:text-ink-700 pointer-events-auto"
                    aria-label={showPassword ? 'Gizle' : 'Göster'}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Gizle' : 'Göster'}
                  </button>
                }
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 ring-1 ring-red-200 px-3 py-2 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              Giriş Yap
            </Button>

            {showDemo && (
              <button
                type="button"
                onClick={() => { setEmail('admin@stok.local'); setPassword('admin12345'); }}
                className="w-full text-center text-xs text-ink-500 hover:text-brand-700 underline-offset-2 hover:underline pt-1"
              >
                Demo bilgileriyle doldur →
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-ink-400">
            Hesabınız yoksa yöneticinizden bir hesap talep edin.
          </p>
        </div>
      </div>
    </div>
  );
}
