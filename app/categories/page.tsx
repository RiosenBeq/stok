'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Category } from '@/types/api';

export default function CategoriesPage() {
  return (
    <SimpleCrud<Category>
      title="Kategoriler"
      subtitle="Ürünleri kategorilere ayırın"
      endpoint="/categories/"
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'description', label: 'Açıklama' },
      ]}
      fields={[
        { name: 'name', label: 'Ad', required: true },
        { name: 'description', label: 'Açıklama' },
      ]}
    />
  );
}
