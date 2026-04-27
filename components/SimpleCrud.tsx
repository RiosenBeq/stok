'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import Modal from './Modal';
import { api } from '@/lib/api';

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
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await api.get<T[]>(endpoint));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setForm(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setError(null);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const value = form[f.name]?.trim();
      payload[f.name] = value ? value : null;
    }
    try {
      await api.post(endpoint, payload);
      setOpen(false);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Hata');
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
                <th key={String(c.key)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                {columns.map((c) => {
                  const value = (item as unknown as Record<string, unknown>)[c.key];
                  return (
                    <td key={c.key}>
                      {value == null || value === '' ? '—' : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-slate-400 py-6">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={`Yeni ${title}`} onClose={() => setOpen(false)}>
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
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
