# Catatan Keuangan Sederhana — Implementation Plan

## Context

Build a mobile financial tracker (React Native Expo) for recording income/expenses in IDR, viewing monthly summaries with two charts, managing user-created categories, and encrypted local backup — all fully offline. Two-tab navigation (Beranda + Riwayat) with a floating "+ Catat" button. UI follows the provided HTML mockup: blue hero header, metric cards, bar chart (6-month expense trend), donut chart (expense by category), transaction list grouped by date. All code must follow **vercel-react-native-skills** guidelines: `Pressable` over `TouchableOpacity`, virtualized lists (`LegendList`) for any list, hoisted `Intl` formatters, ternary/`!!` instead of `&&` for conditional renders, native `Modal` with `presentationStyle='formSheet'` for sheets, primitives passed to list items for memoization.

## Tech Stack

| Concern | Library | Reason |
|---|---|---|
| Framework | Expo SDK 53, expo-router v5 | File-based routing, latest stable |
| Database | expo-sqlite + drizzle-orm | Typed queries, `useLiveQuery` for reactive UI, versioned migrations via drizzle-kit |
| Lists | @legendapp/list (`LegendList`) | Virtualized list per vercel-react-native-skills rule 2.6; replaces `FlatList`/`ScrollView` + `.map()` everywhere |
| Charts | react-native-gifted-charts | Expo-compatible, built-in bar + donut, no Skia dependency |
| Encryption | expo-crypto (`AESEncryptionKey`, `aesEncryptAsync` / `aesDecryptAsync`) | Native AES-GCM, cross-platform |
| Key derivation | Web Crypto API (`crypto.subtle.deriveKey` PBKDF2) | Derive AES key from user password; available via Hermes |
| File I/O | expo-file-system, expo-sharing, expo-document-picker | Export/import backup files through system picker |
| Date picker | @react-native-community/datetimepicker | Standard native date selection |

### Project Structure

```
app/
  _layout.tsx          ← root layout: DB provider + migration gate
  (tabs)/
    _layout.tsx        ← bottom tab navigator (Beranda, +Catat, Riwayat)
    index.tsx          ← Beranda (home)
    riwayat.tsx        ← Riwayat (history)
  catat.tsx            ← Catat (add/edit transaction) — modal presentation
  kategori.tsx         ← Kategori management screen
  pengaturan.tsx       ← Settings (backup/restore/delete)
components/
  BarChartCard.tsx
  DonutChartCard.tsx
  TransactionItem.tsx
  CategoryPickerModal.tsx
  NewCategoryModal.tsx
  MonthPicker.tsx
  ConfirmDialog.tsx
db/
  schema.ts            ← drizzle table definitions
  client.ts            ← openDatabaseSync + drizzle instance export
  seed.ts              ← initial categories
  queries/
    categories.ts      ← category CRUD functions
    transactions.ts    ← transaction CRUD + aggregation functions
    backup.ts          ← export/import database as JSON
lib/
  format.ts            ← formatRupiah, formatDate helpers
  crypto.ts            ← password-based encrypt/decrypt wrapper
  constants.ts         ← colors, max amount, default categories
drizzle/               ← generated migration files (drizzle-kit)
drizzle.config.ts
```

---

## Phase 1: Foundation

Setup Expo project, navigation shell, database schema with seed data, and shared utilities. Goal: app launches, shows empty Beranda skeleton with two tabs and a working database.

### Step 1.1 — Scaffold Expo project

Create new project with `npx create-expo-app@latest catatan_keuangan`. Install all dependencies in one batch:

```bash
npx expo install expo-sqlite expo-crypto expo-file-system expo-sharing expo-document-picker @react-native-community/datetimepicker react-native-gifted-charts expo-linear-gradient react-native-svg
npm install drizzle-orm @legendapp/list
npm install -D drizzle-kit babel-plugin-inline-import
```

Configure `babel.config.js`: add `babel-plugin-inline-import` plugin with extensions `['.sql']`.

Configure `metro.config.js`: push `'sql'` to `config.resolver.assetExts`.

Create `drizzle.config.ts`: schema `'./db/schema.ts'`, out `'./drizzle'`, dialect `'sqlite'`, driver `'expo'`.

### Step 1.2 — Database schema (`db/schema.ts`)

Two tables matching PRD §7:

**`categories`** table:
- `id` — integer, primary key, autoincrement
- `name` — text, not null, max 40 chars (enforced in app)
- `type` — text, not null, check `IN ('income', 'expense')`
- `color` — text, nullable (hex like `#2451bf`)
- `archived_at` — text (ISO timestamp), nullable
- `created_at` — text, not null, default `CURRENT_TIMESTAMP`
- `updated_at` — text, not null, default `CURRENT_TIMESTAMP`

**`transactions`** table:
- `id` — integer, primary key, autoincrement
- `category_id` — integer, not null, references `categories(id)`
- `type` — text, not null, check `IN ('income', 'expense')`
- `amount_idr` — integer, not null (positive, max 1_000_000_000_000)
- `transaction_date` — text, not null (format `YYYY-MM-DD`, stored as local calendar date, never UTC-converted)
- `note` — text, nullable, max 200 chars
- `deleted_at` — text (ISO timestamp), nullable — soft delete for undo
- `created_at` — text, not null, default `CURRENT_TIMESTAMP`
- `updated_at` — text, not null, default `CURRENT_TIMESTAMP`

Indexes (create in migration SQL, not drizzle schema — drizzle-kit generates the migration):
- `idx_tx_date_type` on `transactions(transaction_date, type, deleted_at)`
- `idx_cat_type` on `categories(type, archived_at)`
- `idx_cat_unique_active` — unique partial index on `(type, lower(name)) WHERE archived_at IS NULL`

Enable foreign keys via `PRAGMA foreign_keys = ON` executed right after opening the database in `db/client.ts`.

Run `npx drizzle-kit generate` to produce migration SQL under `drizzle/`.

### Step 1.3 — Database client & migration gate (`db/client.ts`, `app/_layout.tsx`)

`db/client.ts`: call `openDatabaseSync('catatan.db', { enableChangeListener: true })`, wrap with `drizzle()`, export `db`. Run `PRAGMA foreign_keys = ON` immediately.

`app/_layout.tsx`: use `useMigrations(db, migrations)` from `drizzle-orm/expo-sqlite/migrator`. While migrating, show a centered spinner. On error, show error text. After success, run seed, then render `<Slot />`.

### Step 1.4 — Seed initial categories (`db/seed.ts`)

Insert only if `categories` table is empty (first launch). Default categories from PRD §5.3:

| Type | Names |
|---|---|
| expense | Makan, Belanja, Transportasi, Tagihan, Lainnya |
| income | Gaji, Hadiah, Lainnya |

Each gets a distinct `color` from the design palette: Makan `#2451bf`, Belanja `#7da1f0`, Transportasi `#c5d5f8`, Tagihan `#e5ecfa`, Lainnya (expense) `#8190a8`, Gaji `#14996b`, Hadiah `#7da1f0`, Lainnya (income) `#8190a8`.

### Step 1.5 — Navigation shell (`app/(tabs)/_layout.tsx`)

Bottom tab bar with three items matching the mockup:
1. **Beranda** — house icon, route `/(tabs)/`
2. **+ Catat** — center floating blue rounded button (not a real tab destination; `onPress` navigates to `/catat` as modal)
3. **Riwayat** — list icon, route `/(tabs)/riwayat`

Style the tab bar: white background, border-top `#e8edf5`, active color `#2451bf`, inactive `#9aa8bf`. The center button: blue `#2451bf` background, white `+`, `borderRadius: 12`, elevated shadow, `width: 43, height: 39`.

### Step 1.6 — Shared utilities (`lib/format.ts`, `lib/constants.ts`)
`formatRupiah(n: number): string` — returns `Rp` + dot-separated thousands, e.g. `formatRupiah(25000)` → `"Rp25.000"`. Hoist `Intl.NumberFormat('id-ID')` to **module scope** (per vercel-react-native-skills rule 13.1 — never recreate inside render). Export the hoisted instance as `rupiahFormatter` for reuse in components that need raw formatter access.

`formatDate(dateStr: string): string` — converts `YYYY-MM-DD` to locale display. Hoist `Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' })` to module scope.

`lib/constants.ts` — export color tokens from the design (`BLUE: '#2451bf'`, `GREEN: '#14996b'`, `RED: '#e05b67'`, etc.), `MAX_AMOUNT: 1_000_000_000_000`, `MAX_NOTE_LENGTH: 200`, `MAX_CATEGORY_NAME_LENGTH: 40`.

### Step 1.7 — Beranda placeholder

`app/(tabs)/index.tsx`: render the blue hero header with hardcoded "Selisih bulan ini Rp0", month selector text (current month/year), two metric cards (Masuk Rp0, Keluar Rp0), and empty-state text "Belum ada catatan. Tambah transaksi pertama." Verify the app launches, tabs work, database is created with seed categories.

---

## Phase 2: Transaction Input

Build the Catat screen — full transaction form with type toggle, formatted nominal input, category picker modal with inline category creation, date picker, and save. After saving, navigate back and data persists.

### Step 2.1 — Transaction form screen (`app/catat.tsx`)

Present as a modal (expo-router `presentation: 'modal'` in route config). Layout follows mockup screen 03:

- **Blue header** "Catat transaksi" with back arrow
- **Type toggle** — segmented control using `Pressable` (never `TouchableOpacity`): `↗ Keluar` (default, selected) / `↙ Masuk`. State: `type: 'expense' | 'income'`
- **Nominal field** — prefix "Rp", large numeric input. `inputMode="numeric"`. On change: strip non-digits, cap at 13 chars, format with dot separators for display using the hoisted `rupiahFormatter`. Store raw integer. Validation: must be > 0 and ≤ `MAX_AMOUNT`.
- **Category selector** — `Pressable` button showing selected category name or "Pilih kategori" (muted). Opens `CategoryPickerModal`. When type changes, clear selected category if it doesn't match new type.
- **Date field** — defaults to today (`new Date()` formatted as `YYYY-MM-DD`). Tapping opens native date picker (`@react-native-community/datetimepicker`). Past dates allowed, no future restriction specified.
- **Note field** — optional text input, maxLength 200, placeholder "Contoh: Kopi sore"
- **Save button** — blue `Pressable` primary button "Simpan transaksi". Validates: nominal > 0, category selected. On invalid: toast "Isi nominal lebih dari Rp0" or "Pilih kategori". On valid: insert transaction via `db/queries/transactions.ts`, navigate back, show toast "Transaksi disimpan".

For edit mode: accept `?id=<transactionId>` query param. Pre-fill all fields. Save performs update instead of insert. Header changes to "Ubah transaksi".

### Step 2.2 — Category picker modal (`components/CategoryPickerModal.tsx`)

Use React Native's native `<Modal visible={visible} presentationStyle="formSheet" animationType="slide">` (per vercel-react-native-skills rule 9.8 — native modals over JS bottom sheets). Props: `visible`, `type`, `onSelect(category)`, `onClose`.

- Lists active (non-archived) categories filtered by current transaction type
- Each row: category color dot + name, tappable → calls `onSelect` and closes
- Bottom: dashed border button "+ Buat kategori baru" → switches modal to creation mode

Creation mode (matches mockup "Kategori baru"):
- Text input "Nama kategori baru", maxLength 40
- "Simpan kategori" + "Batal" buttons
- Validate: name not empty, unique among active categories of same type (case-insensitive). On duplicate: toast "Kategori sudah ada"
- On save: insert category via `db/queries/categories.ts`, auto-select the new category, return to transaction form with all prior field values intact (form state preserved in parent)

### Step 2.3 — Transaction queries (`db/queries/transactions.ts`)

Functions (all use drizzle, wrap writes in `db.transaction()`):

- `insertTransaction(data)` — validate `category.type === transaction.type` inside a DB transaction. Insert row. Return new id.
- `updateTransaction(id, data)` — same type-match validation. Update row, set `updated_at`.
- `softDeleteTransaction(id)` — set `deleted_at` to current ISO timestamp.
- `restoreTransaction(id)` — clear `deleted_at` (for undo).
- `hardDeleteExpired()` — optionally clean old soft-deleted rows (> 30 seconds, called on app foreground).

All queries exclude `deleted_at IS NOT NULL` rows unless explicitly requested.

### Step 2.4 — Category queries (`db/queries/categories.ts`)

- `getActiveCategories(type)` — `WHERE archived_at IS NULL AND type = ?`, ordered by name
- `insertCategory(name, type, color?)` — check uniqueness (active, same type, case-insensitive) in app layer; insert. Return new category.
- `updateCategory(id, { name?, color? })` — same uniqueness check for name changes.
- `archiveCategory(id)` — set `archived_at` to current ISO timestamp.
- `unarchiveCategory(id)` — clear `archived_at`; check name doesn't clash with existing active category of same type first, error if it does.

---

## Phase 3: Home Screen (Beranda)

Replace the placeholder with live data: monthly summary cards, 6-month bar chart, category donut chart, and 5 most recent transactions. All reactive via `useLiveQuery`.

### Step 3.1 — Monthly summary queries (`db/queries/transactions.ts`)

- `getMonthSummary(year, month)` — returns `{ income: number, expense: number, balance: number }`. Aggregates `SUM(amount_idr)` grouped by type for transactions where `transaction_date BETWEEN 'YYYY-MM-01' AND 'YYYY-MM-{lastDay}'` and `deleted_at IS NULL`. Balance = income − expense.
- `getSixMonthExpenseTrend(year, month)` — returns array of `{ year, month, total }` for 6 months ending at the given month. Months with no transactions return `total: 0`.
- `getExpenseByCategory(year, month)` — returns `{ categoryId, categoryName, color, total }[]` ordered by total descending, for expense transactions in the given month. Used for donut chart.
- `getRecentTransactions(limit = 5)` — most recent 5 non-deleted transactions with category name joined, ordered by `transaction_date DESC, created_at DESC`.

### Step 3.2 — Beranda screen (`app/(tabs)/index.tsx`)

Use `useLiveQuery` wrapping each query for automatic refresh on data change. Component state: `selectedMonth` (Date object, defaults to current month).

Layout top-to-bottom matching mockup screen 01:

1. **Hero section** (blue `#2451bf` background, rounded bottom corners):
   - "Ringkasan keuanganmu" subtitle
   - "Selisih bulan ini" label + large formatted balance (e.g. "Rp2.350.000")
   - Month selector pill button showing "September 2026 ⌄" — tapping opens `MonthPicker` component (simple left/right arrows + month-year text)
   - Top-right: gear icon button → navigates to `/pengaturan`

2. **Metric cards** (overlapping hero bottom by negative margin):
   - Two cards side-by-side: "↙ Masuk" with green total, "↗ Keluar" with red total

3. **Bar chart section** "Tren pengeluaran":
   - `BarChartCard` component using `react-native-gifted-charts` `<BarChart>`. 6 bars, labels = abbreviated month names (Apr, Mei, Jun, etc.). Active month bar colored `#2451bf`, others `#c7d6fa`. Pill badge shows selected month name + total.
   - `onPress` per bar: navigate to `/riwayat` filtered to that month.
   - Empty state: if all 6 months sum to 0 → show "Belum ada pengeluaran" text instead of chart.

4. **Donut chart section** "Pengeluaran per kategori":
   - `DonutChartCard` component using `react-native-gifted-charts` `<PieChart>` with `donut` prop. Show top 3 categories by total; merge the rest as "Kategori lain" (only in visualization — data stays intact). Center hole shows total in "Rp3,05 juta" compact format.
   - Right-side legend: color dot + category name + percentage. Percentage = `category total / month expense total * 100`, rounded to nearest integer.
   - `onPress` per slice: navigate to `/riwayat` filtered by that category (or multiple categories for "Kategori lain").
   - Empty state: if month has no expenses → "Belum ada pengeluaran" text, no chart.

5. **Recent transactions** "Terbaru":
   - List of up to 5 `TransactionItem` components. Each shows: icon, note/category name, category + date, formatted amount with color (green +, red −).
   - "Lihat semua" link → navigates to Riwayat tab.
   - Empty state: "Belum ada catatan. Tambah transaksi pertama."

### Step 3.3 — MonthPicker component (`components/MonthPicker.tsx`)

Simple inline component: left arrow `‹`, "September 2026" text, right arrow `›`. Tapping arrows changes `selectedMonth` by ±1 month. Used in both Beranda hero and Riwayat header.

### Step 3.4 — TransactionItem component (`components/TransactionItem.tsx`)

Memoized with `memo()`. Accepts **only primitives** as props (per vercel-react-native-skills rule 2.5): `id: number`, `note: string | null`, `categoryName: string`, `categoryColor: string`, `type: 'income' | 'expense'`, `amountIdr: number`, `transactionDate: string`. Never pass the whole transaction object. Renders: colored icon circle (category color background), title (note or category name — use ternary `note ? note : categoryName`, never `&&`), subtitle (category name · formatted date), right-aligned amount. Expense amounts prefixed `−` in red `#e05b67`, income prefixed `+` in green `#14996b`. All tappable areas use `Pressable`. Used in Beranda recent list and Riwayat full list.

---

## Phase 4: History Screen (Riwayat)

Full transaction list with month navigation, search, filter chips, grouped by date, with edit and delete actions.

### Step 4.1 — History queries (`db/queries/transactions.ts`)

- `getFilteredTransactions({ year, month, type?, categoryId?, search?, limit, offset })` — returns transactions joined with category, filtered by combination of: month period, type (income/expense/all), category id, search text (LIKE on `note` and category `name`). Ordered by `transaction_date DESC, created_at DESC`. Paginated with limit+offset for progressive loading.
- `getTransactionById(id)` — single transaction with category data for edit screen.

### Step 4.2 — Riwayat screen (`app/(tabs)/riwayat.tsx`)

Layout matches mockup screen 02:

1. **Blue header** "Riwayat"
2. **Month navigator** — reuse `MonthPicker` with `‹ September 2026 ›`
3. **Search bar** — text input "Cari catatan atau kategori". Debounced 300ms, filters transaction list.
4. **Filter chips** row — horizontal scroll: "Semua" (default, selected), "Keluar", "Masuk", "Kategori ⌄". Tapping "Kategori ⌄" opens a dropdown/bottom sheet listing active categories as checkboxes; selecting one filters by that category. Chip styling: selected = blue fill + white text, unselected = white + border.
5. **Transaction list** — `LegendList` from `@legendapp/list` (per vercel-react-native-skills rule 2.6 — virtualize any list). Group by date using section-like rendering: section header "HARI INI · 25 SEPTEMBER" or "KEMARIN · 24 SEPTEMBER" or "20 SEPTEMBER". Each row: `TransactionItem` receiving only primitives. Hoist `renderItem` and `keyExtractor` callbacks outside the component (per rule 2.2). Set `estimatedItemSize={60}`. Progressive loading: load 20 at a time, `onEndReached` fetches more.
6. **Empty state** — "Tidak ada transaksi ditemukan." + "Hapus filter" button (if any filter active).

Accept optional route params for pre-filtering (from chart tap): `?month=2026-09&type=expense&categoryIds=1,2,3`.

### Step 4.3 — Transaction detail & actions

Tapping a `TransactionItem` in Riwayat opens the Catat screen in edit mode (`router.push('/catat?id=123')`). Add a delete action: long-press or swipe-to-delete on a row. On delete:

1. Show `ConfirmDialog`: "Hapus transaksi ini?"
2. On confirm: `softDeleteTransaction(id)`, show toast "Transaksi dihapus" with "Urungkan" action button
3. Undo button: `restoreTransaction(id)` within a 5-second window, then hard-deletes

`useLiveQuery` ensures the list, Beranda summary, and charts update immediately after any mutation.

---

## Phase 5: Category Management

Full category management screen accessible from the category picker's "Kelola kategori" link and from Beranda's "Lihat kategori" link.

### Step 5.1 — Category screen (`app/kategori.tsx`)

Layout matches mockup screen 04:

1. **Blue header** "Kategori" with back arrow
2. **Type toggle** — segmented control using `Pressable`: `↗ Keluar` (default) / `↙ Masuk`. Switches displayed category list.
3. **Category list** — `LegendList` showing "Kategori saya" + count label. Each row: `Pressable` with colored dot icon + name + chevron `›`. Tapping opens edit mode (inline or native `Modal` with `presentationStyle='formSheet'`): rename field + color picker (optional, 8 preset colors) + "Arsipkan" button. Pass only primitives (`id`, `name`, `color`, `type`) to memoized category row component.
4. **Add button** — dashed border "+ Tambah kategori" at bottom. Opens `NewCategoryModal` scoped to selected type.
5. **Tip text** — "Kategori yang sudah dipakai bisa diarsipkan. Catatan lama tetap tersimpan."
6. **Archived section** — collapsible "Diarsipkan" section below active list. Each archived category shows "Aktifkan kembali" action. If reactivating and name clashes with existing active category of same type, show error "Ganti nama terlebih dahulu" and prompt rename.

### Step 5.2 — Archive behavior

Archiving: set `archived_at`, category disappears from picker, but existing transactions retain the category link. Historical summaries (bar chart, donut) include archived category transactions — queries join on `category_id` regardless of archive status.

Unarchiving: clear `archived_at`. Pre-check: `SELECT id FROM categories WHERE type = ? AND lower(name) = lower(?) AND archived_at IS NULL` — if exists, block and show error requiring rename first.

---

## Phase 6: Settings & Backup

Settings screen with encrypted backup export, restore with password, and full data wipe.

### Step 6.1 — Settings screen (`app/pengaturan.tsx`)

Accessible from gear icon on Beranda hero. Layout:

1. **Blue header** "Pengaturan" with back arrow
2. **Section "Data"**:
   - "Cadangkan data" row → starts backup flow
   - "Pulihkan cadangan" row → starts restore flow
   - "Hapus semua data" row (red text) → destructive confirmation flow
3. **Info text** — "Menghapus aplikasi dapat menghilangkan semua data. Buat cadangan sebelum pindah perangkat."

### Step 6.2 — Backup export (`lib/crypto.ts`, `db/queries/backup.ts`)

Flow: tap "Cadangkan data" → password prompt modal (text input + confirm input + "Sandi ini diperlukan untuk membuka cadangan. Jika hilang, cadangan tidak dapat dibuka." warning) → generate backup → share via system picker.

**Backup payload** (JSON before encryption):
```json
{
  "version": 1,
  "created_at": "2026-09-25T10:00:00Z",
  "categories": [ ...all rows... ],
  "transactions": [ ...all non-hard-deleted rows... ]
}
```

**Encryption** (`lib/crypto.ts`):
1. Generate random 16-byte salt via `expo-crypto.getRandomBytes(16)`
2. Derive AES-256 key from password + salt using Web Crypto API: `crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey'])` → `crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' }, ..., { name: 'AES-GCM', length: 256 }, false, ['encrypt'])`
3. Generate random 12-byte IV via `getRandomBytes(12)`
4. Encrypt JSON payload: `crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)`
5. Output file structure: `salt (16B) || iv (12B) || ciphertext+tag` — single binary blob, base64-encoded, saved as `.ckbackup` file

Write to `FileSystem.documentDirectory` → `expo-sharing.shareAsync()` to let user pick save location. File name: `catatan_YYYY-MM-DD.ckbackup`.

### Step 6.3 — Backup restore

Flow: tap "Pulihkan cadangan" → `expo-document-picker.getDocumentAsync()` to pick `.ckbackup` file → password prompt → decrypt → validate → confirm → replace.

1. Read file, decode base64, extract salt (first 16B), IV (next 12B), ciphertext (rest)
2. Derive key from password + salt (same PBKDF2 params)
3. Decrypt via `crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)`
4. Parse JSON; validate `version` field and structure (categories array, transactions array)
5. Show confirmation: "Data pada perangkat akan diganti. {N} transaksi dan {M} kategori akan dipulihkan. Lanjutkan?"
6. On confirm: within a single SQLite transaction — delete all rows from `transactions`, delete all from `categories`, insert all restored categories (preserving original IDs), insert all restored transactions. If any step fails, rollback — existing data unchanged.
7. On success: toast "Data berhasil dipulihkan", navigate to Beranda. `useLiveQuery` auto-refreshes everything.

**Error handling:**
- Wrong password → AES-GCM decryption throws (tag mismatch) → toast "Sandi salah atau file rusak"
- Corrupt file → parse error → toast "Format cadangan tidak valid"
- Neither case modifies existing database

### Step 6.4 — Delete all data

Flow: tap "Hapus semua data" → `ConfirmDialog` "Semua catatan dan kategori akan dihapus permanen. Cadangan yang tersimpan di luar aplikasi tidak terpengaruh." with red "Hapus" button → on confirm: within SQLite transaction delete all transactions then all categories, re-run seed → toast "Data berhasil dihapus" → navigate to Beranda.

---

## Critical Files & Anchors

| File | Symbol/Region | Reason |
|---|---|---|
| `db/schema.ts` | `categories`, `transactions` tables | All queries, migrations, and backup depend on these exact column definitions |
| `db/client.ts` | `db` export, `PRAGMA foreign_keys` | Single DB instance shared app-wide; foreign key enforcement must happen at open time |
| `app/(tabs)/_layout.tsx` | Center tab button `onPress` | The "+ Catat" button is not a tab destination — it triggers `router.push('/catat')` as a modal; misconfiguring this breaks the core flow |
| `lib/crypto.ts` | `encryptBackup`, `decryptBackup` | PBKDF2 iterations (600k) and salt/IV sizes must match between encrypt and decrypt; password-derived key means backup works across devices |

## Verification

### After Phase 1
- `npx expo start`, app launches on iOS/Android simulator without crash
- Database inspector (`Shift+M` in Expo CLI) shows `categories` table with 8 seeded rows, `transactions` table empty
- Bottom tabs navigate between Beranda placeholder and empty Riwayat

### After Phase 2
- Tap `+ Catat` → modal opens. Select "Keluar", type "25000" (displays as "25.000"), pick "Makan", save → toast "Transaksi disimpan", navigates back
- Open category picker → tap "+ Buat kategori baru" → type "Kopi" → save → modal closes, "Kopi" auto-selected in form, nominal and date still intact
- Switch type to "Masuk" → category clears, picker shows only income categories

### After Phase 3
- Beranda shows Masuk Rp0, Keluar Rp25.000, Selisih −Rp25.000 for current month
- Bar chart shows current month bar at Rp25.000, other 5 months at Rp0
- Donut chart shows Makan 100%
- "Terbaru" section shows the Kopi sore transaction
- Change month backward → shows Rp0 / empty state

### After Phase 4
- Riwayat lists transactions grouped by date, most recent first
- Type "Kopi" in search → filters to matching transaction
- Tap "Keluar" chip → shows only expense transactions
- Tap a transaction → edit screen opens pre-filled; change type to "Masuk", must re-pick income category; save → Beranda totals recalculated correctly
- Delete transaction → toast with "Urungkan" → tap undo within 5s → transaction restored

### After Phase 5
- Navigate to Kategori → 5 expense categories visible. Tap "Makan" → rename to "Makanan" → save → Riwayat and Beranda show "Makanan"
- Archive "Makanan" → disappears from category picker in Catat, but historical transaction still shows "Makanan" in Riwayat and donut chart
- Archived section shows "Makanan" with "Aktifkan kembali" option

### After Phase 6
- Pengaturan → "Cadangkan data" → enter password "test123" → confirm → file saved via share sheet
- Fresh install / after "Hapus semua data" → "Pulihkan cadangan" → pick file → enter "test123" → confirm → all transactions and categories restored, Beranda shows correct totals
- Wrong password → "Sandi salah atau file rusak", no data changed
- "Hapus semua data" → confirm → Beranda shows Rp0, categories reset to defaults

## Assumptions & Contingencies

- **Web Crypto PBKDF2 availability**: Hermes in Expo SDK 53 exposes `crypto.subtle`. If unavailable at runtime, fall back to a JS PBKDF2 implementation from the `@noble/hashes` package (add as contingency dependency).
- **`react-native-gifted-charts` donut `onPress`**: If per-slice press handler is not supported, implement a custom legend with pressable rows that navigate to filtered Riwayat instead.
