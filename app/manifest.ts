import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stok — Burger Franchise',
    short_name: 'Stok',
    description: 'Çoklu şubeli burger franchise envanter ve satış sistemi',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#1e3a8a',
    orientation: 'portrait',
    icons: [
      { src: '/icon.svg', sizes: '32x32 192x192 512x512', type: 'image/svg+xml' },
    ],
    lang: 'tr',
  };
}
