import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { db } from '../client';
import { categories, Category, NewCategory } from '../schema';

/**
 * Get active (non-archived) categories, optionally filtered by type ('income' | 'expense')
 */
export async function getActiveCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return db
      .select()
      .from(categories)
      .where(and(isNull(categories.archived_at), eq(categories.type, type)))
      .orderBy(categories.name);
  }
  return db
    .select()
    .from(categories)
    .where(isNull(categories.archived_at))
    .orderBy(categories.name);
}

/**
 * Get archived categories, optionally filtered by type
 */
export async function getArchivedCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return db
      .select()
      .from(categories)
      .where(and(isNotNull(categories.archived_at), eq(categories.type, type)))
      .orderBy(categories.name);
  }
  return db
    .select()
    .from(categories)
    .where(isNotNull(categories.archived_at))
    .orderBy(categories.name);
}

/**
 * Get all categories (both active and archived)
 */
export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(categories.name);
}

/**
 * Check if an active category with the same name and type exists (case-insensitive)
 */
export async function checkCategoryExists(
  name: string,
  type: 'income' | 'expense',
  excludeId?: number
): Promise<boolean> {
  const trimmed = name.trim().toLowerCase();
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.type, type),
        isNull(categories.archived_at),
        sql`lower(${categories.name}) = ${trimmed}`
      )
    );

  if (excludeId !== undefined) {
    return existing.some((c) => c.id !== excludeId);
  }
  return existing.length > 0;
}

/**
 * Insert a new category after validating uniqueness
 */
export async function insertCategory(
  name: string,
  type: 'income' | 'expense',
  color?: string | null
): Promise<Category> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Nama kategori tidak boleh kosong');
  }
  if (trimmedName.length > 40) {
    throw new Error('Nama kategori maksimal 40 karakter');
  }

  const exists = await checkCategoryExists(trimmedName, type);
  if (exists) {
    throw new Error('Kategori sudah ada');
  }

  const result = await db
    .insert(categories)
    .values({
      name: trimmedName,
      type,
      color: color || '#2451bf',
    })
    .returning();

  return result[0];
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: number,
  data: { name?: string; color?: string | null }
): Promise<Category> {
  const current = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!current[0]) {
    throw new Error('Kategori tidak ditemukan');
  }

  const valuesToUpdate: Partial<NewCategory> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new Error('Nama kategori tidak boleh kosong');
    }
    if (trimmed.length > 40) {
      throw new Error('Nama kategori maksimal 40 karakter');
    }

    const exists = await checkCategoryExists(trimmed, current[0].type, id);
    if (exists) {
      throw new Error('Kategori dengan nama ini sudah ada');
    }
    valuesToUpdate.name = trimmed;
  }

  if (data.color !== undefined) {
    valuesToUpdate.color = data.color;
  }

  const updated = await db
    .update(categories)
    .set(valuesToUpdate)
    .where(eq(categories.id, id))
    .returning();

  return updated[0];
}

/**
 * Archive a category (soft-archive)
 */
export async function archiveCategory(id: number): Promise<void> {
  await db
    .update(categories)
    .set({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(categories.id, id));
}

/**
 * Restore an archived category
 */
export async function unarchiveCategory(id: number): Promise<Category> {
  const current = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!current[0]) {
    throw new Error('Kategori tidak ditemukan');
  }

  const exists = await checkCategoryExists(current[0].name, current[0].type);
  if (exists) {
    throw new Error('Ganti nama terlebih dahulu, kategori aktif dengan nama ini sudah ada');
  }

  const updated = await db
    .update(categories)
    .set({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(categories.id, id))
    .returning();

  return updated[0];
}
