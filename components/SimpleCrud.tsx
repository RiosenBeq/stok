'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './ui/EmptyState';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  placeholder?: string;
}

interface Props<T extends { id: number }> {
  title: string;
  subtitle: string;
  endpoint: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  columns: Array<{ key: keyof T & string; label: string }>;
  fields: Field[];
}

export default function SimpleCrud<T extends { id: number }>({
  title,
  subtitle,
  endpoint,
  emptyIcon = '📋',
  emptyTitle,
  emptyDescription,
  columns,
  fields,
}: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function reload() {
    try { setItems(await api.get<T[]>(endpoint)); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Liste yüklenemedi'); }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  function openNew() {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setOpen(true);
  }
  function openEdit(item: T) {
    setEditing(item);
    setForm(Object.fromEntries(fields.map((f) => {
      const v = (item as unknown as Record<string, unknown>)[f.name];
      return [f.name, v == null ? '' : String(v)];
    })));
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const value = form[f.name]?.trim();
      payload[f.name] = value ? value : null;
    }
    try {
      if (editing) {
        await api.patch(`${endpoint}${editing.id}`, payload);
        toast.success('Güncellendi');
      } else {
        await api.post(endpoint, payload);
        toast.success('Eklendi');
      }
      setOpen(false);
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setConfirmingId(null);
    try {
      await api.delete(`${endpoint}${id}`);
      toast.success('Silindi');
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<Button onClick={openNew} iconLeft={<span>+</span>}>Yeni</Button>}
      />

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items === null ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card skeleton h-16" />)
        ) : items.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle ?? 'Henüz kayıt yok'}
            description={emptyDescription ?? 'Yukarıdan + Yeni ile başlayın.'}
            action={<Button onClick={openNew}>+ Yeni Ekle</Button>}
          />
        ) : (
          items.map((item) => {
            const primary = (item as unknown as Record<string, unknown>)[columns[0].key];
            const secondary = columns.slice(1).map((c) => {
              const v = (item as unknown as Record<string, unknown>)[c.key];
              return v == null || v === '' ? null : String(v);
            }).filter(Boolean);
            return (
              <div key={item.id} className="card flex items-center gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 text-lg">
                  {emptyIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900 truncate">{String(primary ?? '—')}</div>
                  {secondary.length > 0 && (
                    <div className="text-xs text-ink-500 truncate">{secondary.join(' · ')}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <button onClick={() => openEdit(item)} className="text-brand-700 hover:underline">Düzenle</button>
                  <button onClick={() => setConfirmingId(item.id)} className="text-red-600 hover:underline">Sil</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th className="w-32 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={columns.length + 1}><div className="skeleton h-6 w-full" /></td></tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle ?? 'Henüz kayıt yok'}
                    description={emptyDescription ?? 'Yukarıdan + Yeni ile başlayın.'}
                    action={<Button onClick={openNew}>+ Yeni Ekle</Button>}
                  />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  {columns.map((c) => {
                    const value = (item as unknown as Record<string, unknown>)[c.key];
                    return <td key={c.key}>{value == null || value === '' ? '—' : String(value)}</td>;
                  })}
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => openEdit(item)} className="text-brand-700 hover:underline mr-3 text-xs">Düzenle</button>
                    <button onClick={() => setConfirmingId(item.id)} className="text-red-600 hover:underline text-xs">Sil</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? 'Kaydı düzenle' : `Yeni ${title}`} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          {fields.map((f) => (
            <Input
              key={f.name}
              label={f.label}
              type={f.type ?? 'text'}
              required={f.required}
              placeholder={f.placeholder}
              value={form[f.name] ?? ''}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
            />
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" loading={saving}>{editing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmingId !== null}
        title="Silme onayı"
        message="Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => confirmingId !== null && onDelete(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </>
  );
}
