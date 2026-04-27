'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
}

interface Props<T extends { id: number }> {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: Array<{ key: keyof T & string; label: string }>;
  fields: Field[];
}

export default function SimpleCrud<T extends { id: number }>({
  title,
  subtitle,
  endpoint,
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
    try {
      setItems(await api.get<T[]>(endpoint));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Liste yüklenemedi');
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          const v = (item as unknown as Record<string, unknown>)[f.name];
          return [f.name, v == null ? '' : String(v)];
        })
      )
    );
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
        actions={
          <button className="btn-primary" onClick={openNew}>
            + Ekle
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th className="w-32 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items === null ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-slate-400 py-6">
                  Yükleniyor…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-slate-400 py-10">
                  Henüz kayıt yok. Yukarıdan <strong>+ Ekle</strong> ile başlayın.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  {columns.map((c) => {
                    const value = (item as unknown as Record<string, unknown>)[c.key];
                    return (
                      <td key={c.key}>
                        {value == null || value === '' ? '—' : String(value)}
                      </td>
                    );
                  })}
                  <td className="text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-brand-700 hover:underline mr-3 text-xs"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setConfirmingId(item.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? 'Kaydı düzenle' : `Yeni ${title}`}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label">
                {f.label}
                {f.required && ' *'}
              </label>
              <input
                type={f.type ?? 'text'}
                className="input"
                required={f.required}
                value={form[f.name] ?? ''}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
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
