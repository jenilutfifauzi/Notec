# PRD — Catatan Keuangan Sederhana

**Versi:** 1.1  
**Tanggal:** 25 September 2026  
**Platform:** Aplikasi mobile React Native (Android dan iOS)  
**Penyimpanan:** SQLite lokal pada perangkat; dapat digunakan tanpa internet  
**Bahasa dan mata uang:** Indonesia, rupiah (IDR)

## 1. Ringkasan

Aplikasi mobile untuk mencatat uang masuk dan keluar dalam beberapa detik, melihat ringkasan bulan ini, serta mengelompokkan transaksi dengan kategori yang dapat dibuat sendiri. Data disimpan di SQLite pada perangkat. Antarmuka mengutamakan angka dan tindakan utama, dengan sedikit menu dan teks singkat.

## 2. Tujuan dan batas MVP

- Mencatat satu transaksi dalam sekitar 10–20 detik.
- Mengetahui total pemasukan, pengeluaran, dan selisih pada periode yang dipilih.
- Melihat transaksi dan pengeluaran menurut kategori.
- Membuat kategori tanpa meninggalkan formulir transaksi.
- Menjaga data keuangan tetap tersimpan secara lokal dan dapat dicadangkan secara manual.

MVP berfokus pada **input manual**, dua visualisasi sederhana di Beranda, dan cadangan lokal. Impor PDF mutasi BCA yang pernah direncanakan ditempatkan pada fase lanjutan. Tidak ada akun daring, sinkronisasi antarperangkat, anggaran, rekening majemuk, transfer antar-rekening, subkategori, aturan otomatis, grafik lain yang kompleks, atau AI pada MVP.

## 3. Pengguna dan asumsi

Sasaran awal adalah satu pengguna pribadi pada satu perangkat yang mencatat pengeluaran sehari-hari. Aplikasi langsung terbuka tanpa registrasi atau login. Data hanya tersedia di perangkat tersebut dan tidak otomatis berpindah saat berganti ponsel. Tanggal transaksi mengikuti kalender lokal perangkat, dengan tampilan awal mengikuti zona waktu perangkat (contoh: Asia/Jakarta). Nominal disimpan sebagai bilangan bulat rupiah. Selisih periode adalah **pemasukan dikurangi pengeluaran**, bukan saldo rekening nyata; antarmuka melabelinya **Selisih**.

## 4. Struktur tampilan

Navigasi utama maksimal **dua tab**: **Beranda** dan **Riwayat**. Tombol **+ Catat** selalu mudah dijangkau di ponsel. **Kategori** dibuka melalui pemilih kategori di formulir dan tautan kecil **Kelola kategori**; **Pengaturan** tersedia lewat ikon kecil di Beranda untuk cadangan dan penghapusan data. Tidak ada menu laporan tersendiri pada MVP.

| Layar | Isi utama | Aksi utama |
| --- | --- | --- |
| Beranda | Periode **Bulan ini**, tiga angka **Masuk**, **Keluar**, **Selisih**; diagram batang tren pengeluaran; diagram lingkaran kategori; lima transaksi terakhir | **+ Catat**, ubah bulan, buka Riwayat |
| Catat | Pilihan **Keluar / Masuk**, nominal, kategori, tanggal, catatan opsional | **Simpan**; **+ Kategori** dari pemilih |
| Riwayat | Daftar transaksi per tanggal, pencarian, filter periode/jenis/kategori yang dapat dibuka saat perlu | Buka, ubah, hapus transaksi |
| Kategori | Daftar kategori menurut jenis, tambah, ubah nama, arsipkan | **+ Kategori** |
| Pengaturan | Cadangkan data, pulihkan cadangan, dan hapus semua data | Kelola data lokal |

Aturan tampilan:

- Gunakan satu tindakan utama per layar. Hindari paragraf petunjuk, ikon tanpa label, pop-up promosi, dan istilah akuntansi.
- Teks antarmuka singkat, misalnya **Catat**, **Masuk**, **Keluar**, **Kategori**, **Simpan**. Pesan kesalahan menyebut tindakan yang perlu diperbaiki, misalnya **Isi nominal lebih dari Rp0**.
- Tampilkan nominal dengan format `Rp25.000`; warna membantu membedakan jenis transaksi, tetapi label **Masuk/Keluar** tetap terlihat.
- Teks kosong yang berguna: **Belum ada catatan. Tambah transaksi pertama.**
- Desain menyesuaikan layar ponsel mulai lebar 360 dp, area sentuh memadai, kontras baik, serta mendukung ukuran teks sistem dan pembaca layar.

## 5. Fitur MVP dan aturan

### 5.1 Mulai menggunakan aplikasi

Pada pembukaan pertama, aplikasi membuat database SQLite dan kategori awal secara lokal. Pengguna langsung masuk ke Beranda tanpa akun, server, izin kontak, atau koneksi internet. Data satu instalasi tidak dibagi antarpengguna perangkat melalui fitur aplikasi.

### 5.2 Transaksi

- Wajib: jenis (**Masuk** atau **Keluar**), nominal lebih dari nol, tanggal, dan kategori yang cocok dengan jenisnya.
- Opsional: catatan pendek, maksimal 200 karakter.
- Tanggal bawaan adalah hari ini dalam zona waktu pengguna; transaksi bertanggal lampau diperbolehkan.
- Pengguna dapat menambah, mengubah, dan menghapus transaksi. Penghapusan meminta konfirmasi singkat serta menyediakan **Urungkan** bila memungkinkan.
- Perubahan jenis mengosongkan kategori lama bila kategorinya tidak sesuai. Transaksi yang diubah langsung memperbarui ringkasan.
- Tidak ada nominal negatif. Koreksi arah uang dilakukan dengan mengubah jenis transaksi.

### 5.3 Kategori buatan sendiri

- Sediakan beberapa kategori awal yang dapat dipakai langsung, misalnya **Makan**, **Belanja**, **Transportasi**, **Tagihan**, **Lainnya** untuk Keluar; **Gaji**, **Hadiah**, **Lainnya** untuk Masuk.
- Pengguna dapat menambah kategori dari formulir Catat melalui **+ Kategori**, mengisi nama dan jenis, lalu kategori baru otomatis terpilih tanpa kehilangan isian transaksi.
- Pengguna dapat mengubah nama dan warna opsional. Nama wajib, maksimal 40 karakter, serta unik untuk kategori aktif pada jenis yang sama tanpa membedakan huruf besar/kecil.
- Kategori yang telah dipakai **diarsipkan**, bukan dihapus permanen. Riwayat tetap menampilkan nama kategorinya; kategori arsip tidak tersedia untuk transaksi baru.
- Jika kategori arsip diaktifkan kembali, transaksi historis tetap terhubung; jika namanya bentrok dengan kategori aktif, pengguna harus mengganti nama terlebih dahulu. Kategori awal dapat diarsipkan tanpa menghapus transaksi lama.

### 5.4 Ringkasan dan riwayat

- Beranda menampilkan total Masuk, Keluar, dan Selisih untuk bulan terpilih, termasuk transaksi pada tanggal awal dan akhir bulan.
- **Diagram batang** menampilkan pengeluaran per bulan selama enam bulan, berakhir pada bulan yang dipilih di Beranda. Bulan tanpa transaksi bernilai Rp0. Ketuk batang untuk melihat nominal dan membuka Riwayat bulan tersebut. Total tiap batang harus sama dengan total Keluar pada bulan bersangkutan.
- **Diagram lingkaran** menampilkan proporsi pengeluaran menurut kategori pada bulan yang dipilih. Tampilkan tiga kategori terbesar dan gabungkan sisanya sebagai **Kategori lain** hanya pada visualisasi; kategori asli transaksi tetap utuh. Label/legenda menampilkan nama kategori, nominal, dan persentase; ketuk kategori untuk membuka Riwayat terfilter. Jangan campurkan kategori pemasukan.
- Persentase diagram lingkaran dihitung dari nominal kategori dibagi total Keluar pada bulan tersebut. Pembulatan tampilan boleh menyebabkan jumlah label persentase berbeda sedikit dari 100%; nominal tetap menjadi nilai acuan.
- Jika tidak ada pengeluaran pada periode terkait, tampilkan **Belum ada pengeluaran** alih-alih diagram kosong. Saat total pengeluaran enam bulan bernilai nol, gunakan pesan yang sama untuk diagram batang.
- Kedua diagram berada pada satu bagian **Ringkasan** di Beranda, mengikuti perubahan transaksi dan kategori tanpa perlu halaman atau menu baru. Pada ponsel diagram disusun vertikal; detail tersedia lewat sentuhan dan teks/legenda, bukan hanya warna.
- Riwayat diurutkan dari tanggal terbaru, lalu waktu pembuatan terbaru. Pencarian mencakup catatan dan nama kategori.
- Filter periode, jenis, dan kategori dapat dikombinasikan; bila tidak ada hasil, tampilkan pesan singkat dan opsi **Hapus filter**.
- Semua hitungan berasal dari transaksi aktif di SQLite lokal. Kategori yang diarsipkan tetap masuk ke total dan ringkasan historis.

### 5.5 Cadangkan dan pulihkan data

- Di Pengaturan, pengguna dapat membuat **cadangan terenkripsi** yang memuat transaksi, kategori, dan versi format data, lalu menyimpannya melalui pemilih berkas sistem ke lokasi pilihan pengguna. Aplikasi tidak mengirim cadangan ke server sendiri.
- Pengguna menetapkan sandi cadangan saat mengekspor. Sandi tidak disimpan oleh aplikasi dan diperlukan saat memulihkan. Jelaskan secara singkat bahwa sandi yang hilang membuat cadangan tidak dapat dibuka.
- Saat memulihkan, tampilkan jumlah transaksi/kategori dan minta konfirmasi bahwa **data pada perangkat akan diganti**. Validasi format, versi, dan integritas cadangan terlebih dahulu; lakukan penggantian dalam satu transaksi database agar kegagalan tidak menghasilkan data sebagian.
- Tidak ada penggabungan data pada MVP. Setelah pemulihan berhasil, Beranda dan Riwayat memuat ulang hasil yang dipulihkan. Pengguna dapat menghapus seluruh data lokal melalui konfirmasi terpisah.

## 6. Alur penting

**Catat pengeluaran:** Beranda → **+ Catat** → **Keluar** → nominal → kategori → **Simpan** → Beranda dan ringkasan diperbarui.

**Buat kategori saat mencatat:** Catat → pilih kategori → **+ Kategori** → isi nama → **Simpan** → kembali ke Catat dengan kategori baru terpilih dan data sebelumnya utuh.

**Perbaiki catatan:** Riwayat → buka transaksi → **Ubah** → **Simpan** → nilai pada Riwayat dan Beranda mengikuti data baru.

**Pindah perangkat:** Perangkat lama → Pengaturan → **Cadangkan** → simpan berkas dan sandi → perangkat baru → Pengaturan → **Pulihkan** → pilih berkas dan masukkan sandi.

## 7. Model data minimum

| Entitas | Kolom utama | Aturan |
| --- | --- | --- |
| `categories` | `id`, `name`, `type` (`income`/`expense`), `color`, `archived_at`, timestamps | Nama kategori aktif unik per jenis (tanpa membedakan huruf besar/kecil) |
| `transactions` | `id`, `category_id`, `type`, `amount_idr`, `transaction_date`, `note`, timestamps, `deleted_at` | `amount_idr` bilangan bulat positif; jenis kategori harus cocok dengan transaksi |

Kategori awal dibuat sekali ketika database baru dibuat. Aktifkan foreign key SQLite dan gunakan migrasi database yang berversi. Indeks minimum: transaksi pada `(transaction_date, type, deleted_at)` dan kategori pada `(type, archived_at)`, serta indeks unik parsial pada `(type, lower(name))` untuk kategori aktif. Validasi jenis kategori pada saat penyimpanan transaksi dalam transaksi database. Penghapusan transaksi dapat menggunakan soft delete untuk mendukung **Urungkan**; transaksi terhapus tidak dihitung. `transaction_date` disimpan sebagai tanggal kalender `YYYY-MM-DD` tanpa konversi UTC, sementara waktu pembuatan/perubahan disimpan sebagai waktu UTC. Batasi nominal per transaksi hingga Rp1.000.000.000.000 agar konversi angka dalam React Native aman.

## 8. Implementasi, keamanan, dan kualitas

- Bangun UI dan navigasi dengan React Native. Sediakan lapisan akses SQLite terpisah dari komponen layar, migrasi skema berversi, query terparameterisasi, dan operasi tulis atomik. Semua fitur inti dan diagram dapat digunakan tanpa internet.
- Simpan file database dalam ruang privat aplikasi. SQLite biasa **tidak otomatis terenkripsi**; jangan mengklaim data terenkripsi saat tersimpan kecuali enkripsi database benar-benar diterapkan dan diuji. Anjurkan kunci layar perangkat. Jangan log transaksi atau isi cadangan.
- Cadangan harus memakai enkripsi terautentikasi dengan kunci yang diturunkan dari sandi melalui mekanisme standar yang diuji; jangan membuat algoritme kriptografi sendiri. Jangan menaruh berkas cadangan tanpa enkripsi di folder publik.
- Uninstall atau penghapusan data aplikasi dapat menghilangkan catatan lokal; jelaskan ini secara singkat di Pengaturan dan anjurkan cadangan sebelum pindah perangkat. Cadangan sistem operasi tidak diasumsikan aktif.
- Beranda dan Riwayat ditargetkan tampil dalam 2 detik pada perangkat kelas menengah untuk hingga 10.000 transaksi; daftar Riwayat dimuat bertahap.
- Nominal dihitung dengan integer, bukan floating point. Penyajian angka mengikuti format rupiah.
- Pengguna dapat menghapus seluruh catatan lokal melalui alur konfirmasi yang jelas; berkas cadangan yang tersimpan di luar aplikasi perlu dihapus terpisah oleh pengguna.

## 9. Kriteria penerimaan MVP

1. Pengguna dapat mencatat transaksi Keluar Rp25.000 untuk hari ini dengan kategori **Makan**; total Keluar bulan ini bertambah Rp25.000.
2. Saat mengisi transaksi, pengguna membuat kategori **Kopi**; formulir tetap berisi nominal dan tanggal semula, dan kategori **Kopi** langsung terpilih.
3. Kategori **Kopi** yang sudah dipakai dapat diarsipkan; transaksi lama tetap muncul di Riwayat dan ringkasan, sementara kategori itu tidak dapat dipilih untuk transaksi baru.
4. Setelah transaksi diubah dari Keluar menjadi Masuk, pengguna wajib memilih kategori Masuk; total Masuk, Keluar, dan Selisih dihitung ulang dengan benar.
5. Pada perangkat berzona Asia/Jakarta, transaksi 31 Agustus dan 1 September masuk ke ringkasan bulannya masing-masing; perubahan zona waktu perangkat tidak menggeser tanggal transaksi yang sudah dicatat.
6. Seluruh alur utama berjalan dalam mode pesawat; transaksi tetap ada setelah aplikasi ditutup paksa dan dibuka kembali.
7. Pada lebar layar 360 dp, pengguna dapat menambah transaksi tanpa gulir horizontal; navigasi utama tetap dua tab.
8. Setelah mencatat pengeluaran, batang bulan terkait dan irisan kategori terkait berubah; nominal pada batang cocok dengan total Keluar, sedangkan jumlah nominal seluruh kategori pada diagram lingkaran cocok dengan total Keluar bulan terpilih.
9. Kategori pengeluaran keempat dan seterusnya digabung sebagai **Kategori lain** hanya di diagram; ketukan pada **Kategori lain** membuka Riwayat yang memuat kategori-kategori tersebut. Pada bulan tanpa pengeluaran, diagram lingkaran menampilkan keadaan kosong yang jelas dan tidak menampilkan pembagian persentase palsu; diagram batang tetap menampilkan bulan lain yang memiliki pengeluaran.
10. Cadangan yang benar dan sandinya dapat memulihkan kategori serta transaksi di instalasi baru; sandi salah atau berkas rusak tidak mengubah database yang sudah ada.
11. Setelah pengguna mengonfirmasi pemulihan, data lokal diganti secara utuh; jika proses gagal di tengah jalan, data lama tetap tersedia.

## 10. Tahap setelah MVP

Jika pencatatan manual sudah nyaman dipakai, pertimbangkan impor PDF BCA dengan pratinjau dan pemeriksaan duplikat sesuai PRD BCA sebelumnya; implementasinya harus disesuaikan dengan perangkat mobile. Fitur lanjutan lain: sinkronisasi opsional antarperangkat, ekspor CSV, anggaran per kategori, dan pengingat mencatat. Tambahkan hanya berdasarkan kebutuhan pengguna nyata agar antarmuka tetap ringkas.
