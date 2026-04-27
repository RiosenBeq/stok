import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Movements from './pages/Movements';
import SimpleCrud from './pages/SimpleCrud';
import { useAuth } from './hooks/useAuth';
import type { Category, Supplier, Warehouse } from './types/api';

function ProtectedRoutes() {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoutes />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="movements" element={<Movements />} />
        <Route
          path="warehouses"
          element={
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
          }
        />
        <Route
          path="suppliers"
          element={
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
          }
        />
        <Route
          path="categories"
          element={
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
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
