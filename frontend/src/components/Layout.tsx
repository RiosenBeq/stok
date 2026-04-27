import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Pano' },
  { to: '/products', label: 'Ürünler' },
  { to: '/movements', label: 'Stok Hareketleri' },
  { to: '/warehouses', label: 'Depolar' },
  { to: '/suppliers', label: 'Tedarikçiler' },
  { to: '/categories', label: 'Kategoriler' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-6 py-5 text-xl font-bold tracking-tight border-b border-slate-800">
          📦 Stok
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-xs">
          <div className="font-medium">{user?.full_name}</div>
          <div className="text-slate-400">{user?.role}</div>
          <button onClick={logout} className="mt-2 text-brand-100 hover:text-white">
            Çıkış yap
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
