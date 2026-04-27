'use client';

import { FormEvent, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error('Yeni şifre en az 8 karakter olmalı');
      return;
    }
    if (next !== confirm) {
      toast.error('Yeni şifre tekrarı eşleşmiyor');
      return;
    }
    setBusy(true);
    try {
      await api.patch('/users/me/password', {
        current_password: current,
        new_password: next,
      });
      toast.success('Şifre güncellendi');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Profil" subtitle="Hesap bilgileri ve şifre" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card">
          <h2 className="font-semibold mb-3">Hesap</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Ad Soyad</dt>
              <dd className="font-medium">{user?.full_name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">E-posta</dt>
              <dd className="font-medium">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium capitalize">{user?.role ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Durum</dt>
              <dd>
                {user?.is_active ? (
                  <span className="badge-green">Aktif</span>
                ) : (
                  <span className="badge-slate">Pasif</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className="font-semibold mb-3">Şifre Değiştir</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Mevcut Şifre</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="input"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Yeni Şifre</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
