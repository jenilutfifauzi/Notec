import { db } from './client';
import { categories } from './schema';
import { count } from 'drizzle-orm';

export const DEFAULT_CATEGORIES = [
  { name: 'Makan', type: 'expense' as const, color: '#2451bf' },
  { name: 'Belanja', type: 'expense' as const, color: '#7da1f0' },
  { name: 'Transportasi', type: 'expense' as const, color: '#c5d5f8' },
  { name: 'Tagihan', type: 'expense' as const, color: '#e5ecfa' },
  { name: 'Lainnya', type: 'expense' as const, color: '#8190a8' },
  { name: 'Gaji', type: 'income' as const, color: '#14996b' },
  { name: 'Hadiah', type: 'income' as const, color: '#7da1f0' },
  { name: 'Lainnya', type: 'income' as const, color: '#8190a8' },
];

export async function seedCategories(): Promise<void> {
  const result = await db.select({ value: count() }).from(categories);
  const total = result[0]?.value ?? 0;
  if (total === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(categories).values(cat);
    }
  }
}
