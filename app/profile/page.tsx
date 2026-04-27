'use client';

import { FormEvent, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { useAuth } from '@/hooks/useAuth';

const ROLE_TONE: Record<string, 'red' | 'amber' | 'blue' | 'slate'> = {
  admin: 'red',
  manager: 'amber',
  staff: 'blue',
  viewer: 'slate',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const initials = (user?.full_name ?? '')
    .split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error('Yeni şifre en az 8 karakter olmalı');
    if (next !== confirm) return toast.error('Yeni şifre tekrarı eşleşmiyor');
    setBusy(true);
    try {
      await api.patch('/users/me/password', { current_password: current, new_password: next });
      toast.success('Şifre güncellendi');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Profil" subtitle="Hesap bilgileri ve güvenlik" />

      <div className="card mb-4 flex items-center gap-4 bg-gradient-to-br from-brand-50 to-white">
        <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-semibold text-ink-900 truncate">{user?.full_name ?? '—'}</div>
          <div className="text-sm text-ink-500 truncate">{user?.email ?? '—'}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user?.role && <Tag tone={ROLE_TONE[user.role] ?? 'slate'}>{user.role}</Tag>}
            {user?.is_active ? <Tag tone="green">Aktif</Tag> : <Tag tone="slate">Pasif</Tag>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Hesap Bilgileri" description="Yöneticiniz tarafından yönetilir">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Ad Soyad</dt>
              <dd className="font-medium text-ink-900">{user?.full_name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">E-posta</dt>
              <dd className="font-medium text-ink-900 truncate ml-2">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Rol</dt>
              <dd>{user?.role && <Tag tone={ROLE_TONE[user.role] ?? 'slate'}>{user.role}</Tag>}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">Hesap Durumu</dt>
              <dd>{user?.is_active ? <Tag tone="green">Aktif</Tag> : <Tag tone="slate">Pasif</Tag>}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Şifre Değiştir" description="En az 8 karakterli güçlü bir şifre seçin">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Mevcut Şifre"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              iconLeft={<span>🔒</span>}
            />
            <Input
              label="Yeni Şifre"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              iconLeft={<span>🔑</span>}
              helper="En az 8 karakter"
            />
            <Input
              label="Yeni Şifre (Tekrar)"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              iconLeft={<span>🔑</span>}
              error={confirm && next !== confirm ? 'Eşleşmiyor' : undefined}
            />
            <Button type="submit" loading={busy} fullWidth>Şifreyi Güncelle</Button>
          </form>
        </Section>
      </div>

      <Section title="Tehlikeli Bölge" description="Geri alınması zor işlemler" className="mt-4 ring-red-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-ink-900">Çıkış yap</div>
            <div className="text-xs text-ink-500">Bu oturumu sonlandırır.</div>
          </div>
          <Button variant="danger" onClick={logout}>Çıkış yap</Button>
        </div>
      </Section>
    </>
  );
}
