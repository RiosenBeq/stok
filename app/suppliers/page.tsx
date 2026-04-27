'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Supplier } from '@/types/api';

export default function SuppliersPage() {
  return (
    <SimpleCrud<Supplier>
      title="Tedarikçiler"
      subtitle="Tedarikçi rehberi"
      endpoint="/suppliers/"
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'contact_name', label: 'İletişim' },
        { key: 'email', label: 'E-posta' },
        { key: 'phone', label: 'Telefon' },
      ]}
      fields={[
        { name: 'name', label: 'Ad', required: true },
        { name: 'contact_name', label: 'İletişim Kişisi' },
        { name: 'email', label: 'E-posta', type: 'email' },
        { name: 'phone', label: 'Telefon', type: 'tel' },
      ]}
    />
  );
}
