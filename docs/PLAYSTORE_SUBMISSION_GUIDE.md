# Panduan Lengkap Rilis Notec ke Google Play Store

Dokumen ini memandu proses rilis aplikasi **Notec (Catatan Keuangan)** ke Google Play Console mulai dari persiapan metadata, pengisian deklarasi wajib (Data Safety & Financial Features), hingga peluncuran rilis production/testing.

---

## 1. Ringkasan Informasi Teknis Aplikasi

| Parameter | Nilai |
| :--- | :--- |
| **Nama Aplikasi** | Notec (Catatan Keuangan) |
| **Package Name** | `com.notec.app` |
| **Framework** | Expo SDK 57 (React Native 0.86) |
| **Format Artefak** | Android App Bundle (`.aab`) |
| **Signing Keystore** | Expo Managed Keystore |
| **Penyimpanan Data** | 100% Offline Lokal (SQLite) |
| **Izin Native Utama** | `RECORD_AUDIO` (hanya untuk input suara) |

---

## 2. Persiapan Akun & Pembuatan Aplikasi Baru di Google Play Console

1. Buka [Google Play Console](https://play.google.com/console).
2. Di dashboard utama, klik tombol **Buat Aplikasi** (Create app).
3. Isi detail awal:
   - **Nama Aplikasi:** `Notec - Catatan Keuangan`
   - **Bahasa Default:** `Indonesian - id`
   - **Aplikasi atau Game:** `Aplikasi` (App)
   - **Gratis atau Berbayar:** `Gratis` (Free)
4. Centang persetujuan kebijakan pengembang dan ketentuan ekspor, lalu klik **Buat Aplikasi**.

---

## 3. Pengisian Bagian "Konten Aplikasi" (App Content) - Wajib

Masuk ke menu samping kiri: **Kebijakan dan program** -> **Konten aplikasi** (App content). Selesaikan seluruh form berikut:

### A. Kebijakan Privasi (Privacy Policy)
- Masukkan URL Kebijakan Privasi yang dapat diakses publik.
- Gunakan teks dari file `docs/PRIVACY_POLICY.md` (dapat di-host di GitHub Pages, Notion publik, atau website pribadi).

### B. Akses Aplikasi (App Access)
- Pilih: **Semua fungsi tersedia tanpa batasan akses** (*All functionality is available without restrictions*).
- *Alasan:* Notec bekerja offline dan tidak memerlukan username/password/login untuk mengakses fitur apa pun.

### C. Iklan (Ads)
- Pilih: **Tidak, aplikasi saya tidak berisi iklan** (*No, my app does not contain ads*).

### D. Peringkat Konten (Content Rating)
- Mulai kuesioner IARC:
  - Masukkan email pengembang Anda.
  - Kategori: Pilih **Utilitas, Produktivitas, Komunikasi, atau Lainnya** (*Utility, Productivity, Communication, or other*).
  - Jawab pertanyaan mengenai kekerasan, konten dewasa, bahasa kasar: Pilih **Tidak** untuk semua.
- Simpan dan terapkan peringkat (biasanya menghasilkan rating **3+ / Everyone**).

### E. Target Audiens dan Konten (Target Audience)
- Pilih kelompok usia: **18 tahun ke atas** (atau centang 13-15, 16-17, 18+ jika menargetkan pelajar/mahasiswa).
- Pertanyaan daya tarik bagi anak-anak (*Appeal to children*): Pilih **Tidak**.

### F. Aplikasi Berita (News Apps)
- Pilih: **Tidak, ini bukan aplikasi berita**.

### G. Pelacakan Kontak & Status COVID-19
- Pilih: **Aplikasi saya bukan aplikasi pelacakan kontak atau status COVID-19**.

### H. Fitur Finansial (Financial Features Declaration) — SANGAT PENTING
Karena nama aplikasi mengandung "Keuangan" dan memiliki fitur pencatatan uang, Google Play mewajibkan pengisian deklarasi fitur finansial:
1. Saat ditanya apakah aplikasi menyediakan fitur finansial: Pilih **Ya** (*Yes*).
2. Pilih Kategori:
   - Centang: **Personal Financial Management / Budgeting & Expense Tracking** (Manajemen Keuangan Pribadi / Pencatat Anggaran & Pengeluaran).
3. Pastikan **TIDAK** mencentang:
   - *Banking services* (Layanan perbankan)
   - *Loans / Personal Loans* (Pinjaman online / P2P lending)
   - *Investment / Cryptocurrency* (Investasi / Aset kripto)
   - *Payment instruments / Mobile wallets* (Dompet digital berlisensi)
4. Deskripsi fungsi finansial:
   > *"Notec is an offline personal expense and budgeting manager. It allows users to manually input and track daily income and expenses locally on their device via SQLite. The app does not connect to bank accounts, does not provide loans, does not facilitate money transfers, and does not process payments."*
5. Unggah dokumen pendukung jika diminta (biasanya untuk aplikasi offline non-pinjol, deskripsi pernyataan di atas sudah cukup).

### I. Keamanan Data (Data Safety Form)
Form ini menentukan label privasi pada halaman Play Store:
1. **Pengumpulan Data:**
   - Pertanyaan: *Apakah aplikasi Anda mengumpulkan atau membagikan jenis data pengguna yang ditentukan?*
   - Jawab: **TIDAK** (*No*).
   - *Alasan:* Seluruh data transaksi, kategori, dan catatan disimpan secara lokal di SQLite perangkat pengguna tanpa sinkronisasi cloud atau analitik pihak ketiga.
2. **Audio/Suara:**
   - Pertanyaan: *Apakah mikrofon digunakan untuk mengumpulkan data suara?*
   - Jawab: Suara diproses secara *ephemeral on-device* untuk Speech Recognition saat tombol mikrofon ditekan dan **tidak pernah disimpan atau dikirim ke server**.

---

## 4. Penyiapan Halaman Listing Google Play Store (Main Store Listing)

Masuk ke menu: **Tumbuhkan pengguna** -> **Keberadaan di Google Play** -> **Halaman listing utama Play Store**:

1. **Detail Aplikasi:**
   - **Nama Aplikasi:** `Notec - Catatan Keuangan` (Maks 30 karakter)
   - **Deskripsi Singkat:** `Catat pengeluaran dan pemasukan harian dengan cepat, rapi, dan mudah.` (Maks 80 karakter)
   - **Deskripsi Lengkap:**
     ```
     Notec adalah aplikasi pencatat keuangan harian yang dirancang untuk membantu Anda mengelola arus kas pribadi dengan mudah, cepat, dan teratur.

     Fitur Utama:
     • Catat Pengeluaran & Pemasukan: Tambah transaksi harian dalam hitungan detik.
     • Input Suara Cepat: Cukup ucapkan transaksi Anda (contoh: "Makan siang 25 ribu"), Notec akan otomatis mencatatnya.
     • Kategori Lengkap: Klasifikasikan transaksi makanan, transportasi, belanja, tagihan, dan lainnya.
     • Analisis & Grafik Visual: Pantau tren pengeluaran mingguan dan bulanan melalui diagram yang interaktif.
     • Dompet & Multi-Akun: Kelola kas tunai, rekening bank, dan dompet digital dalam satu tempat.
     • 100% Privasi & Offline: Seluruh data Anda disimpan secara lokal di ponsel Anda tanpa perlu koneksi internet.
     • Ringan & Tanpa Iklan: Antarmuka bersih, cepat, dan bebas gangguan.

     Mulai kelola keuangan Anda dengan lebih bijak bersama Notec!
     ```

2. **Aset Grafis:**
   - **Ikon Aplikasi:** 512 x 512 px PNG (32-bit color, format transparan/solid). File siap pakai: `assets/images/icon.png`.
   - **Grafis Fitur (Feature Graphic):** 1024 x 500 px JPG atau PNG (tanpa transparansi).
   - **Tangkapan Layar Ponsel (Screenshots):**
     - Minimal 2 tangkapan layar (disarankan 4–6 gambar).
     - Rasio 16:9 atau 9:16.
     - Gambar siap pakai tersedia pada folder `docs/screenshot/`.

---

## 5. Mengunggah File AAB & Memulai Peluncuran

### Jalur Rilis yang Direkomendasikan:
> **Catatan untuk Akun Google Play Developer Personal Baru (setelah Nov 2023):**
> Google Play mewajibkan pengujian tertutup (**Closed Testing**) dengan minimal **20 penguji (tester)** selama **14 hari berturut-turut** sebelum pengajuan rilis ke Production diizinkan.

1. Buka menu **Pengujian** -> **Pengujian Tertutup** (*Closed testing*) atau **Pengujian Internal** (*Internal testing*).
2. Klik tombol **Buat rilis baru** (*Create new release*).
3. Di bagian **App Bundle**: Klik tombol **Unggah** (*Upload*) dan pilih file `.aab` hasil build EAS.
4. Tentukan **Nama Rilis**: `1.0.0 (3)`
5. Masukkan **Catatan Rilis (Release Notes)**:
   ```
   Rilis perdana Notec:
   - Pencatatan transaksi pengeluaran dan pemasukan harian
   - Input transaksi cepat dengan suara (voice recognition)
   - Visualisasi grafik arus kas dan statistik per kategori
   - Manajemen multi-dompet / rekening
   - Penyimpanan offline aman berbasis SQLite
   ```
6. Klik **Simpan** (*Save*) -> **Tinjau rilis** (*Review release*).
7. Jika tidak ada peringatan kesalahan kritis, klik **Mulai peluncuran**.
