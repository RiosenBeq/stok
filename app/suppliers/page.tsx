'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Supplier } from '@/types/api';

export default function SuppliersPage() {
  return (
    <SimpleCrud<Supplier>
      title="Tedarikçiler"
      subtitle="Tedarikçi rehberi — siparişleriniz buraya bağlanır"
      endpoint="/suppliers/"
      emptyIcon="🤝"
      emptyTitle="Tedarikçi yok"
      emptyDescription="Tedarikçilerinizi ekleyin, satınalma siparişlerini onlara bağlayın."
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'contact_name', label: 'İletişim' },
        { key: 'email', label: 'E-posta' },
        { key: 'phone', label: 'Telefon' },
      ]}
      fields={[
        { name: 'name', label: 'Tedarikçi Adı', required: true, placeholder: 'Et Anonim Şti.' },
        { name: 'contact_name', label: 'İletişim Kişisi', placeholder: 'Ahmet Yılmaz' },
        { name: 'email', label: 'E-posta', type: 'email', placeholder: 'siparis@firma.com' },
        { name: 'phone', label: 'Telefon', type: 'tel', placeholder: '+90 555 123 4567' },
      ]}
    />
  );
}
