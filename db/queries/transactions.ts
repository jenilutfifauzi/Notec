import { eq, and, isNull, isNotNull, desc, sql, gte, lte, like, or, inArray } from 'drizzle-orm';
import { db } from '../client';
import { transactions, categories, Transaction, Category } from '../schema';
import { MAX_AMOUNT } from '../../lib/constants';

export type TransactionWithCategory = Transaction & {
  categoryName: string;
  categoryColor: string;
};

export type MonthSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type ExpenseTrendMonth = {
  year: number;
  month: number;
  label: string;
  total: number;
};

export type CategoryExpense = {
  categoryId: number;
  categoryName: string;
  color: string;
  total: number;
};

const INDONESIAN_MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

/**
 * Insert a new transaction
 */
export async function insertTransaction(data: {
  category_id: number;
  type: 'income' | 'expense';
  amount_idr: number;
  transaction_date: string;
  note?: string | null;
}): Promise<Transaction> {
  if (data.amount_idr <= 0 || data.amount_idr > MAX_AMOUNT) {
    throw new Error('Nominal harus lebih dari Rp0 dan maksimal Rp1.000.000.000.000');
  }

  // Validate category type match
  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.id, data.category_id))
    .limit(1);

  if (!cat[0]) {
    throw new Error('Kategori tidak ditemukan');
  }
  if (cat[0].type !== data.type) {
    throw new Error('Jenis kategori tidak cocok dengan jenis transaksi');
  }

  const result = await db
    .insert(transactions)
    .values({
      category_id: data.category_id,
      type: data.type,
      amount_idr: Math.round(data.amount_idr),
      transaction_date: data.transaction_date,
      note: data.note?.trim() || null,
    })
    .returning();

  return result[0];
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: number,
  data: {
    category_id: number;
    type: 'income' | 'expense';
    amount_idr: number;
    transaction_date: string;
    note?: string | null;
  }
): Promise<Transaction> {
  if (data.amount_idr <= 0 || data.amount_idr > MAX_AMOUNT) {
    throw new Error('Nominal harus lebih dari Rp0 dan maksimal Rp1.000.000.000.000');
  }

  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.id, data.category_id))
    .limit(1);

  if (!cat[0]) {
    throw new Error('Kategori tidak ditemukan');
  }
  if (cat[0].type !== data.type) {
    throw new Error('Jenis kategori tidak cocok dengan jenis transaksi');
  }

  const result = await db
    .update(transactions)
    .set({
      category_id: data.category_id,
      type: data.type,
      amount_idr: Math.round(data.amount_idr),
      transaction_date: data.transaction_date,
      note: data.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(transactions.id, id))
    .returning();

  if (!result[0]) {
    throw new Error('Transaksi tidak ditemukan');
  }

  return result[0];
}

/**
 * Soft delete a transaction for undo support
 */
export async function softDeleteTransaction(id: number): Promise<void> {
  await db
    .update(transactions)
    .set({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(transactions.id, id));
}

/**
 * Restore a soft-deleted transaction
 */
export async function restoreTransaction(id: number): Promise<void> {
  await db
    .update(transactions)
    .set({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(transactions.id, id));
}

/**
 * Hard delete expired soft-deleted transactions (older than specified seconds)
 */
export async function hardDeleteExpired(seconds: number = 30): Promise<void> {
  const threshold = new Date(Date.now() - seconds * 1000).toISOString();
  await db
    .delete(transactions)
    .where(
      and(
        isNotNull(transactions.deleted_at),
        sql`${transactions.deleted_at} < ${threshold}`
      )
    );
}

/**
 * Get a single transaction by ID with joined category
 */
export async function getTransactionById(
  id: number
): Promise<TransactionWithCategory | null> {
  const result = await db
    .select({
      id: transactions.id,
      category_id: transactions.category_id,
      type: transactions.type,
      amount_idr: transactions.amount_idr,
      transaction_date: transactions.transaction_date,
      note: transactions.note,
      deleted_at: transactions.deleted_at,
      created_at: transactions.created_at,
      updated_at: transactions.updated_at,
      categoryName: categories.name,
      categoryColor: sql<string>`coalesce(${categories.color}, '#2451bf')`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.category_id, categories.id))
    .where(and(eq(transactions.id, id), isNull(transactions.deleted_at)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get summary of income, expense, and balance for a specific month
 */
export async function getMonthSummary(
  year: number,
  month: number
): Promise<MonthSummary> {
  const { start, end } = getMonthDateRange(year, month);

  const rows = await db
    .select({
      type: transactions.type,
      total: sql<number>`coalesce(sum(${transactions.amount_idr}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.transaction_date, start),
        lte(transactions.transaction_date, end),
        isNull(transactions.deleted_at)
      )
    )
    .groupBy(transactions.type);

  let income = 0;
  let expense = 0;

  for (const row of rows) {
    if (row.type === 'income') {
      income = Number(row.total);
    } else if (row.type === 'expense') {
      expense = Number(row.total);
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Get 6-month expense trend ending at (year, month)
 */
export async function getSixMonthExpenseTrend(
  year: number,
  month: number
): Promise<ExpenseTrendMonth[]> {
  const months: { year: number; month: number; label: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    months.push({
      year: y,
      month: m,
      label: INDONESIAN_MONTH_SHORT[m - 1],
    });
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${months[0].year}-${pad(months[0].month)}-01`;
  const endMonthInfo = months[months.length - 1];
  const lastDay = new Date(endMonthInfo.year, endMonthInfo.month, 0).getDate();
  const endDate = `${endMonthInfo.year}-${pad(endMonthInfo.month)}-${pad(lastDay)}`;

  const rows = await db
    .select({
      monthStr: sql<string>`substr(${transactions.transaction_date}, 1, 7)`,
      total: sql<number>`coalesce(sum(${transactions.amount_idr}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'expense'),
        gte(transactions.transaction_date, startDate),
        lte(transactions.transaction_date, endDate),
        isNull(transactions.deleted_at)
      )
    )
    .groupBy(sql`substr(${transactions.transaction_date}, 1, 7)`);

  const totalsByMonth = new Map<string, number>();
  for (const r of rows) {
    totalsByMonth.set(r.monthStr, Number(r.total));
  }

  return months.map((m) => {
    const key = `${m.year}-${pad(m.month)}`;
    return {
      year: m.year,
      month: m.month,
      label: m.label,
      total: totalsByMonth.get(key) || 0,
    };
  });
}

/**
 * Get expenses aggregated by category for a specific month (for donut chart)
 */
export async function getExpenseByCategory(
  year: number,
  month: number
): Promise<CategoryExpense[]> {
  const { start, end } = getMonthDateRange(year, month);

  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      color: sql<string>`coalesce(${categories.color}, '#2451bf')`,
      total: sql<number>`coalesce(sum(${transactions.amount_idr}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.category_id, categories.id))
    .where(
      and(
        eq(transactions.type, 'expense'),
        gte(transactions.transaction_date, start),
        lte(transactions.transaction_date, end),
        isNull(transactions.deleted_at)
      )
    )
    .groupBy(categories.id, categories.name, categories.color)
    .orderBy(desc(sql`sum(${transactions.amount_idr})`));

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    color: r.color,
    total: Number(r.total),
  }));
}

/**
 * Get 5 most recent transactions with category details
 */
export async function getRecentTransactions(
  limit: number = 5
): Promise<TransactionWithCategory[]> {
  return db
    .select({
      id: transactions.id,
      category_id: transactions.category_id,
      type: transactions.type,
      amount_idr: transactions.amount_idr,
      transaction_date: transactions.transaction_date,
      note: transactions.note,
      deleted_at: transactions.deleted_at,
      created_at: transactions.created_at,
      updated_at: transactions.updated_at,
      categoryName: categories.name,
      categoryColor: sql<string>`coalesce(${categories.color}, '#2451bf')`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.category_id, categories.id))
    .where(isNull(transactions.deleted_at))
    .orderBy(
      desc(transactions.transaction_date),
      desc(transactions.created_at),
      desc(transactions.id)
    )
    .limit(limit);
}

/**
 * Query for filtered transactions in Riwayat screen with pagination
 */
export async function getFilteredTransactions(params: {
  year?: number;
  month?: number;
  type?: 'income' | 'expense' | 'all';
  categoryId?: number;
  categoryIds?: number[];
  search?: string;
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TransactionWithCategory[]> {
  const conditions = [isNull(transactions.deleted_at)];

  if (params.dateFrom || params.dateTo) {
    if (params.dateFrom) {
      conditions.push(gte(transactions.transaction_date, params.dateFrom));
    }
    if (params.dateTo) {
      conditions.push(lte(transactions.transaction_date, params.dateTo));
    }
  } else if (params.year && params.month) {
    const { start, end } = getMonthDateRange(params.year, params.month);
    conditions.push(gte(transactions.transaction_date, start));
    conditions.push(lte(transactions.transaction_date, end));
  }

  if (params.type && params.type !== 'all') {
    conditions.push(eq(transactions.type, params.type));
  }

  if (params.categoryIds && params.categoryIds.length > 0) {
    conditions.push(inArray(transactions.category_id, params.categoryIds));
  } else if (params.categoryId) {
    conditions.push(eq(transactions.category_id, params.categoryId));
  }

  if (params.search && params.search.trim()) {
    const searchPattern = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${transactions.note})`, searchPattern),
        like(sql`lower(${categories.name})`, searchPattern)
      )!
    );
  }

  let query = db
    .select({
      id: transactions.id,
      category_id: transactions.category_id,
      type: transactions.type,
      amount_idr: transactions.amount_idr,
      transaction_date: transactions.transaction_date,
      note: transactions.note,
      deleted_at: transactions.deleted_at,
      created_at: transactions.created_at,
      updated_at: transactions.updated_at,
      categoryName: categories.name,
      categoryColor: sql<string>`coalesce(${categories.color}, '#2451bf')`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.category_id, categories.id))
    .where(and(...conditions))
    .orderBy(
      desc(transactions.transaction_date),
      desc(transactions.created_at),
      desc(transactions.id)
    );

  if (params.limit !== undefined) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params.offset !== undefined) {
    query = query.offset(params.offset) as typeof query;
  }

  return query;
}
