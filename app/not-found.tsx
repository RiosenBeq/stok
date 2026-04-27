import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card text-center max-w-md">
        <div className="text-5xl mb-2">🔍</div>
        <h1 className="text-xl font-semibold mb-1">Sayfa bulunamadı</h1>
        <p className="text-sm text-slate-500 mb-4">
          Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
        </p>
        <Link href="/" className="btn-primary inline-block">Panoya dön</Link>
      </div>
    </div>
  );
}
