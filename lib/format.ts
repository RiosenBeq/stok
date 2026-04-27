export function formatCurrency(value: number, currency = '₺', minimumFractionDigits = 2): string {
  return `${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return formatDateTime(iso);
}
