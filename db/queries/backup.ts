import { eq, isNull } from 'drizzle-orm';
import { db } from '../client';
import { categories, transactions, Category, Transaction } from '../schema';
import { DEFAULT_CATEGORIES } from '../seed';

export interface BackupData {
  version: number;
  created_at: string;
  categories: Category[];
  transactions: Transaction[];
}

/**
 * Generate full database JSON payload for backup
 */
export async function generateBackupPayload(): Promise<string> {
  const allCategories = await db.select().from(categories).orderBy(categories.id);
  const allTransactions = await db.select().from(transactions).orderBy(transactions.id);

  const payload: BackupData = {
    version: 1,
    created_at: new Date().toISOString(),
    categories: allCategories,
    transactions: allTransactions,
  };

  return JSON.stringify(payload);
}

/**
 * Validate backup JSON structure and return parsed data
 */
export function validateBackupPayload(jsonStr: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Format berkas bukan JSON yang valid');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format cadangan tidak valid');
  }

  const data = parsed as Record<string, unknown>;

  if (data.version !== 1) {
    throw new Error(`Versi cadangan tidak didukung (versi: ${data.version})`);
  }

  if (!Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
    throw new Error('Struktur data cadangan tidak lengkap');
  }

  return parsed as BackupData;
}

/**
 * Restore database from validated backup data inside a single transaction
 */
export async function restoreFromPayload(
  payloadJson: string
): Promise<{ categoryCount: number; transactionCount: number }> {
  const data = validateBackupPayload(payloadJson);

  await db.transaction(async (tx) => {
    // Clear current database
    await tx.delete(transactions);
    await tx.delete(categories);

    // Insert categories with original IDs
    for (const cat of data.categories) {
      await tx.insert(categories).values({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        archived_at: cat.archived_at,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      });
    }

    // Insert transactions with original IDs
    for (const item of data.transactions) {
      await tx.insert(transactions).values({
        id: item.id,
        category_id: item.category_id,
        type: item.type,
        amount_idr: item.amount_idr,
        transaction_date: item.transaction_date,
        note: item.note,
        deleted_at: item.deleted_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }
  });

  return {
    categoryCount: data.categories.length,
    transactionCount: data.transactions.length,
  };
}

/**
 * Delete all transactions and categories, and restore default categories
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(transactions);
    await tx.delete(categories);

    for (const cat of DEFAULT_CATEGORIES) {
      await tx.insert(categories).values(cat);
    }
  });
}
