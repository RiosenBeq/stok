'use client';

import SimpleCrud from '@/components/SimpleCrud';
import type { Warehouse } from '@/types/api';

export default function WarehousesPage() {
  return (
    <SimpleCrud<Warehouse>
      title="Şubeler"
      subtitle="Franchise lokasyonları — her şubenin kendi stok defteri"
      endpoint="/warehouses/"
      columns={[
        { key: 'code', label: 'Kod' },
        { key: 'name', label: 'Şube Adı' },
        { key: 'location', label: 'Lokasyon' },
      ]}
      fields={[
        { name: 'code', label: 'Kod (örn. ACAR-01)', required: true },
        { name: 'name', label: 'Şube Adı', required: true },
        { name: 'location', label: 'Adres / Lokasyon' },
      ]}
    />
  );
}
