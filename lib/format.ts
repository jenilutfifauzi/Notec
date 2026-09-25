// Hoisted formatters per vercel-react-native-skills rule js-hoist-intl
export const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export const dateFormatterLong = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
});

export const dateFormatterFull = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const monthYearFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

export const monthShortFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
});

export const dateShortFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Format a number to IDR string with 'Rp' prefix and dot separators
 * e.g. 25000 -> 'Rp25.000'
 */
export function formatRupiah(amount: number): string {
  const formatted = rupiahFormatter.format(Math.abs(amount));
  return amount < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

/**
 * Format compact rupiah for charts/summaries (e.g. 3050000 -> 'Rp3,05 jt')
 */
export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(2).replace('.', ',');
    return `${amount < 0 ? '-' : ''}Rp${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(2).replace('.', ',');
    return `${amount < 0 ? '-' : ''}Rp${val} jt`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(1).replace('.', ',');
    return `${amount < 0 ? '-' : ''}Rp${val} rb`;
  }
  return formatRupiah(amount);
}

/**
 * Format YYYY-MM-DD string to Indonesian locale display
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return dateFormatterLong.format(date);
}

/**
 * Format YYYY-MM-DD string to short Indonesian locale display (e.g. "25 Sep 2026")
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return dateShortFormatter.format(date);
}

/**
 * Format date for history section headings
 * e.g. "HARI INI · 25 SEPTEMBER" or "KEMARIN · 24 SEPTEMBER" or "20 SEPTEMBER"
 */
export function formatSectionDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const formattedDate = dateFormatterLong.format(date).toUpperCase();

  if (dateStr === todayStr) {
    return `HARI INI · ${formattedDate}`;
  }
  if (dateStr === yesterdayStr) {
    return `KEMARIN · ${formattedDate}`;
  }
  return formattedDate;
}

/**
 * Returns today's date in local calendar format YYYY-MM-DD (never UTC-converted)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
