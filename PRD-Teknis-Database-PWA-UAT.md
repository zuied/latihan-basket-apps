# PRD Teknis — Database, PWA & UAT
## Aplikasi Manajemen Latihan Basket — Personal & Tim

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 16 September 2026 |
| **Diturunkan dari** | PRD Aplikasi Latihan Basket v1.0 |
| **Ditujukan untuk** | Tim Developer / Tim Teknis |
| **Status** | Draft untuk Review |

---

## 1. Tujuan Dokumen Ini

Dokumen ini melengkapi PRD utama dengan tiga keputusan teknis: (1) penggunaan **MySQL** sebagai database, (2) pengembangan aplikasi sebagai **Progressive Web App (PWA)**, dan (3) rencana **User Acceptance Testing (UAT)** sebelum aplikasi dirilis ke pengguna sebenarnya. Dokumen ini ditujukan untuk tim developer/teknis, sedangkan kebutuhan fitur & fungsi tetap merujuk ke PRD utama dan PRD UI/UX.

---

## 2. Keputusan Database: MySQL

### 2.1 Alasan Pemilihan

Skema database yang sudah dirancang bersifat **relasional** (atlet ↔ tim ↔ program ↔ sesi ↔ hasil latihan saling berelasi ketat), sehingga tetap membutuhkan database SQL — bukan NoSQL. MySQL dipilih sebagai alternatif dari PostgreSQL dengan pertimbangan:

- Lebih umum digunakan & familiar di kalangan developer lokal.
- Pilihan hosting lebih luas dan umumnya lebih murah untuk skala awal (MVP).
- Cukup memadai untuk kebutuhan CRUD dan pelaporan standar di aplikasi ini; kelemahan MySQL pada query analitik sangat kompleks tidak relevan untuk kebutuhan MVP.

### 2.2 Penyesuaian Skema

Struktur tabel inti (lihat PRD utama untuk daftar lengkap: `users`, `teams`, `athlete_profiles`, `drills`, `programs`, `sessions`, `attendance`, `session_results`, `assessments`, `training_load`, `reports`, dst) tetap sama secara konsep. Penyesuaian teknis untuk MySQL:

| Aspek | Ketentuan |
|---|---|
| **Storage engine** | InnoDB (wajib, untuk mendukung foreign key & transaksi) |
| **Character set** | `utf8mb4` dengan collation `utf8mb4_unicode_ci` (mendukung teks Bahasa Indonesia & emoji jika dibutuhkan di komentar/pesan) |
| **Primary key** | Gunakan `CHAR(36)` untuk UUID atau `BIGINT UNSIGNED AUTO_INCREMENT` — pilih salah satu secara konsisten di seluruh skema |
| **Tipe data tanggal** | `DATETIME` untuk waktu sesi/aktivitas, `DATE` untuk tanggal lahir |
| **Tipe data enum** | Gunakan `ENUM(...)` MySQL untuk kolom status tetap (mis. `status_kesiapan`: `penuh`, `terbatas`, `istirahat`) agar tervalidasi di level database |
| **Index** | Tambahkan index pada kolom yang sering difilter/join: `athlete_id`, `team_id`, `session_id`, `program_id` |
| **Soft delete** | Pertimbangkan kolom `deleted_at` (nullable) alih-alih hard delete untuk data atlet/riwayat, mengingat kebutuhan audit & hak hapus data (PRD utama Bab 7.1) |

### 2.3 ORM & Migrasi

Disarankan tetap menggunakan **Prisma** (mendukung MySQL secara native) atau **Sequelize/TypeORM** bila stack backend murni Node.js tanpa Next.js. ORM memudahkan penulisan migrasi skema secara terversi, penting karena skema akan terus berubah mengikuti fase pengembangan (MVP → Fase 2 → Fase 3 di PRD utama Bab 9).

### 2.4 Hosting Database

Untuk tahap MVP: layanan managed MySQL (mis. PlanetScale, AWS RDS MySQL, DigitalOcean Managed MySQL, atau Railway) lebih disarankan dibanding shared hosting manual — memudahkan backup otomatis & scaling saat jumlah pengguna bertambah.

---

## 3. Keputusan Arsitektur: Progressive Web App (PWA)

### 3.1 Alasan Pemilihan

PWA dipilih karena selaras dengan tiga kebutuhan yang sudah ada di PRD utama:

1. **Platform web responsif** (Bab 7 PRD utama) — PWA tetap berbasis web, tidak perlu publish ke Play Store/App Store, namun bisa "diinstal" ke layar utama HP seperti aplikasi native.
2. **Offline/koneksi terbatas** (nice-to-have di PRD utama Bab 7) — PWA menyediakan *service worker* yang bisa meng-cache halaman & menyimpan data sementara saat koneksi lambat/terputus, sangat relevan untuk atlet yang mengisi hasil latihan di lapangan dengan sinyal tidak stabil.
3. **Notifikasi pengingat jadwal** (PRD utama Bab 5.2) — PWA mendukung push notification tanpa perlu aplikasi native terpisah.

### 3.2 Kebutuhan Teknis PWA

| Komponen | Kebutuhan |
|---|---|
| **Web App Manifest** | File `manifest.json` berisi nama aplikasi, ikon (berbagai ukuran), warna tema, `display: standalone` agar tampil tanpa address bar seperti aplikasi native |
| **Service Worker** | Meng-cache aset statis (CSS, JS, ikon) untuk load cepat & mendukung akses dasar saat offline |
| **Caching strategi data** | Untuk halaman **Sesi Latihan Aktif** (wireframe Bab 3.3, Spesifikasi Wireframe): gunakan strategi *cache-then-network* dengan antrean penyimpanan lokal (IndexedDB) — hasil latihan yang diisi saat offline disimpan sementara di perangkat, lalu otomatis disinkronkan ke server saat koneksi kembali tersedia |
| **Installability** | Harus memenuhi kriteria "installable" standar (manifest valid, service worker terdaftar, disajikan lewat HTTPS) agar muncul prompt "Tambahkan ke layar utama" di Android Chrome |
| **Push Notification** | Menggunakan Web Push API untuk pengingat jadwal latihan; membutuhkan izin eksplisit dari pengguna (opt-in), bukan otomatis aktif |
| **Ikon & splash screen** | Disiapkan mengikuti identitas visual yang akan ditentukan tim UI/UX (lihat PRD UI/UX Bab 12, Sistem Desain) |

### 3.3 Dampak ke Desain (Terkait Wireframe yang Sudah Ada)

- Layar **Sesi Latihan Aktif** dan **Kehadiran Sesi** (frekuensi tinggi, sering dipakai di lapangan) menjadi prioritas utama untuk mendukung mode offline — sesuai catatan "isu terbuka" pada kedua wireframe tersebut di dokumen Spesifikasi Wireframe.
- Perlu ditambahkan **indikator status koneksi** (online/offline/menyinkronkan) di UI, terutama pada layar-layar yang mendukung input offline, agar pengguna tahu data mereka aman meski belum tersinkron.
- Perlu dirancang *state* baru: "Tersimpan lokal, menunggu sinkronisasi" — melengkapi kebutuhan state yang sudah dicatat sebagai catatan terbuka di Spesifikasi Wireframe Bab 6.

### 3.4 Batasan PWA yang Perlu Diketahui

- PWA di iOS (Safari) memiliki dukungan lebih terbatas dibanding Android (mis. push notification baru didukung penuh di versi iOS yang lebih baru) — mengingat PRD utama menyebut target awal Android Chrome, ini bukan blocker untuk MVP, namun perlu dicatat sebagai batasan jika ke depan target diperluas ke pengguna iOS.
- Penyimpanan offline (IndexedDB) memiliki kuota terbatas per browser — tidak masalah untuk data teks/angka hasil latihan, namun perlu diperhatikan bila nanti ditambahkan lampiran media (foto/video, Fase 3 PRD utama).

---

## 4. Rencana User Acceptance Testing (UAT)

### 4.1 Tujuan UAT

Memastikan aplikasi benar-benar memenuhi kebutuhan nyata pelatih & atlet — bukan hanya "berfungsi secara teknis" — sebelum digunakan secara penuh. UAT dilakukan **setelah** pengujian teknis internal (unit test, QA developer) selesai, dan **sebelum** peluncuran ke seluruh pengguna.

### 4.2 Peserta UAT

| Peran | Jumlah Disarankan | Catatan |
|---|---|---|
| Pelatih (Admin) | Minimal 1 (Product Owner sendiri) + 1–2 pelatih lain bila memungkinkan | Wajib melibatkan pelatih yang menyusun kebutuhan awal |
| Asisten pelatih | 1 (jika ada) | Menguji akses terbatas |
| Atlet (personal) | 2–3 orang, variasi usia (termasuk atlet junior) | Menguji kecepatan input & pemahaman UI oleh pengguna kurang teknis |
| Atlet dalam tim | 3–5 orang dari satu tim yang sama | Menguji alur tim & program berlapis secara nyata |
| Orang tua/Wali | 1–2 orang | Menguji akses ringkasan progres read-only |

### 4.3 Skenario Uji Utama

Skenario disusun mengikuti alur kunci yang sudah didefinisikan di PRD UI/UX Bab 7 dan wireframe yang sudah dibuat, agar UAT benar-benar menguji apa yang telah dirancang:

| # | Skenario | Peran Penguji | Kriteria Lulus |
|---|---|---|---|
| 1 | Pelatih membuat program baru untuk tim (fase → minggu → sesi → drill) menggunakan Program Builder | Pelatih | Program berhasil dibuat & otomatis muncul di kalender & akun setiap pemain, tanpa error |
| 2 | Atlet baru menyelesaikan onboarding + asesmen awal | Atlet | Proses selesai dalam waktu wajar tanpa kebingungan, data baseline tersimpan benar |
| 3 | Atlet menjalankan sesi latihan & mengisi hasil | Atlet | Pengisian hasil satu sesi (6 drill) selesai **di bawah 1 menit** (target eksplisit PRD utama) |
| 4 | Atlet mengisi hasil latihan dalam kondisi **koneksi terputus**, lalu tersambung kembali | Atlet | Data tersimpan lokal saat offline dan otomatis tersinkron tanpa data hilang |
| 5 | Pelatih/asisten menandai kehadiran seluruh roster tim (20 pemain) | Pelatih/Asisten | Seluruh kehadiran bisa ditandai dalam waktu singkat (target di bawah 2 menit untuk 20 pemain) |
| 6 | Pelatih melihat dashboard statistik individu & tim, lalu mengunduh rapor PDF | Pelatih | Data grafik sesuai hasil yang sudah diinput, rapor PDF terbentuk rapi & terbaca |
| 7 | Pelatih membagikan rapor ke orang tua/wali via share link | Pelatih, Orang tua | Orang tua bisa mengakses ringkasan tanpa perlu login/akun |
| 8 | Sistem mendeteksi lonjakan beban latihan seorang atlet dan menampilkan peringatan | Pelatih | Peringatan muncul jelas di Dashboard & Profil Atlet, tidak terasa seperti error mengagetkan |
| 9 | Atlet menginstal aplikasi ke layar utama HP (PWA) dan membukanya dalam mode standalone | Atlet | Prompt instalasi muncul, aplikasi terbuka tanpa address bar browser |
| 10 | Pelatih menyusun sesi dengan **program berlapis** (drill wajib semua vs drill khusus posisi) dan atlet menjalankannya | Pelatih, Atlet | Atlet hanya melihat instruksi yang relevan untuk dirinya, tidak bingung dengan instruksi rekan setim |

### 4.4 Proses & Jadwal UAT

1. **Persiapan** (H-3 hari): siapkan akun uji untuk tiap peran, data contoh (tim, program, drill), dan lembar skenario/checklist untuk peserta.
2. **Pelaksanaan** (durasi disarankan 3–5 hari): peserta menjalankan skenario di Bab 4.3 secara mandiri atau didampingi, mencatat kendala di lembar umpan balik.
3. **Pengumpulan umpan balik**: kendala dikategorikan sebagai **Blocker** (menghalangi peluncuran), **Mayor** (mengganggu tapi ada workaround), atau **Minor** (kosmetik/nice-to-fix).
4. **Perbaikan**: seluruh isu Blocker wajib diperbaiki sebelum lanjut; isu Mayor diprioritaskan; isu Minor dicatat untuk iterasi berikutnya.
5. **Sign-off**: Product Owner (pelatih) menyetujui secara eksplisit bahwa hasil UAT dapat diterima sebelum aplikasi dirilis ke pengguna sebenarnya.

### 4.5 Template Pencatatan Isu UAT

| Kolom | Keterangan |
|---|---|
| ID Isu | Nomor urut |
| Skenario Terkait | Merujuk ke nomor skenario Bab 4.3 |
| Deskripsi Kendala | Apa yang terjadi vs yang diharapkan |
| Tingkat | Blocker / Mayor / Minor |
| Peran Penguji | Siapa yang menemukan |
| Status | Baru / Dalam perbaikan / Selesai / Ditunda |

### 4.6 Kriteria Kelulusan UAT

- Seluruh skenario di Bab 4.3 berhasil dijalankan tanpa isu berkategori Blocker.
- Skenario 3 (kecepatan input hasil latihan) dan skenario 5 (kehadiran) memenuhi target waktu yang ditetapkan — ini metrik kritis karena berkaitan langsung dengan Risiko Adopsi Pengguna di PRD utama Bab 10.
- Product Owner memberikan sign-off tertulis (bisa berupa email/dokumen sederhana) sebelum status berpindah ke "siap rilis".

---

## 5. Ringkasan Perubahan terhadap Dokumen Sebelumnya

| Dokumen Sebelumnya | Perubahan/Tambahan dari Dokumen Ini |
|---|---|
| PRD Utama Bab 7 (Kebutuhan Non-Fungsional) | Poin "Offline/Koneksi Terbatas" yang sebelumnya nice-to-have kini punya spesifikasi teknis konkret via PWA (Bab 3.2) |
| PRD Utama (implisit — belum menentukan database) | Ditetapkan MySQL sebagai pilihan database (Bab 2), dengan skema tabel yang sama seperti dibahas sebelumnya, hanya disesuaikan sintaksnya |
| Spesifikasi Wireframe Bab 6 (state yang belum tercakup) | Ditambahkan kebutuhan state baru: "Tersimpan lokal, menunggu sinkronisasi" (Bab 3.3 dokumen ini) |
| — | Ditambahkan rencana UAT yang belum ada di dokumen manapun sebelumnya (Bab 4) |

---

## 6. Pertanyaan Terbuka

1. Apakah target awal benar-benar cukup Android Chrome saja, atau perlu dipastikan dukungan iOS Safari mengingat keterbatasan PWA di platform tersebut?
2. Berapa lama data hasil latihan yang tersimpan offline boleh "menunggu" sebelum dianggap gagal sinkron dan perlu penanganan khusus (mis. notifikasi ke pengguna)?
3. Siapa yang akan menjadi peserta UAT dari sisi atlet junior — apakah sudah ada tim/kelompok yang bisa dilibatkan untuk pengujian nyata?
4. Apakah UAT dilakukan sekali di akhir sebelum rilis MVP, atau bertahap per modul (mis. UAT modul Program Latihan selesai duluan sebelum modul Statistik)?

---

*Dokumen ini melengkapi PRD Aplikasi Latihan Basket v1.0, PRD untuk Tim UI/UX v1.0, dan Spesifikasi Wireframe v1.0. Disarankan dibaca berurutan sebagai satu rangkaian sebelum pengembangan teknis dimulai.*
