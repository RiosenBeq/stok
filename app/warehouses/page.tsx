'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Warehouse } from '@/types/api';

export default function WarehousesPage() {
  return (
    <SimpleCrud<Warehouse>
      title="Depolar"
      subtitle="Çoklu depo desteği için lokasyonları yönetin"
      endpoint="/warehouses/"
      columns={[
        { key: 'code', label: 'Kod' },
        { key: 'name', label: 'Ad' },
        { key: 'location', label: 'Lokasyon' },
      ]}
      fields={[
        { name: 'code', label: 'Kod', required: true },
        { name: 'name', label: 'Ad', required: true },
        { name: 'location', label: 'Lokasyon' },
      ]}
    />
  );
}
