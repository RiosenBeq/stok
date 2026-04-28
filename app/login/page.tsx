'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-brand-50 p-4">
      <div className="w-full max-w-md card text-center">
        <div className="text-5xl">📦</div>
        <h1 className="mt-2 text-2xl font-semibold">Giriş Devre Dışı</h1>
        <p className="mt-2 text-sm text-slate-600">
          İstek başarısız sorununu aşmak için giriş sistemi geçici olarak kapatıldı.
        </p>
        <p className="mt-1 text-sm text-slate-600">Uygulamayı doğrudan kullanabilirsiniz.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Uygulamaya Git
        </Link>
      </div>
    </div>
  );
}
