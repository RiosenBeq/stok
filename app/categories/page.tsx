'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Category } from '@/types/api';

export default function CategoriesPage() {
  return (
    <SimpleCrud<Category>
      title="Kategoriler"
      subtitle="Malzemeleri organize etmek için kategoriler (et, ekmek, sebze…)"
      endpoint="/categories/"
      emptyIcon="🗂️"
      emptyTitle="Kategori yok"
      emptyDescription="Malzemelerinizi gruplandırmak için kategoriler oluşturun."
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'description', label: 'Açıklama' },
      ]}
      fields={[
        { name: 'name', label: 'Kategori Adı', required: true, placeholder: 'Et Ürünleri' },
        { name: 'description', label: 'Açıklama', placeholder: 'Hamburger köftesi, sosis vs.' },
      ]}
    />
  );
}
