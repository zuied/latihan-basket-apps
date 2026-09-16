# Work Breakdown Structure (WBS)
## Aplikasi Manajemen Latihan Basket — Personal & Tim (Fase 1 / MVP)

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 16 September 2026 |
| **Untuk** | Tim Developer |
| **Dokumen Acuan** | PRD Utama, PRD Teknis (Database, PWA, UAT), Spesifikasi Wireframe |
| **Cakupan** | Fase 1 (MVP) sesuai PRD Utama Bab 9 |

---

## 1. Cara Membaca Dokumen Ini

WBS ini memecah pengembangan MVP menjadi **10 paket pekerjaan (work package)**, masing-masing berisi daftar tugas konkret. Setiap tugas diberi estimasi kompleksitas relatif (**S**mall/**M**edium/**L**arge, bukan jam pasti — untuk disesuaikan tim dengan kapasitas nyata) dan dependensi terhadap tugas lain. Urutan paket kerja secara umum mengikuti urutan logis pengembangan, meski beberapa dapat dikerjakan paralel oleh anggota tim berbeda.

---

## 2. Ringkasan Paket Pekerjaan

| # | Paket Pekerjaan | Dependensi Utama |
|---|---|---|
| 1 | Setup & Infrastruktur | — |
| 2 | Database & Skema Data | Paket 1 |
| 3 | Autentikasi & Manajemen Pengguna | Paket 2 |
| 4 | Modul Program Latihan | Paket 2, 3 |
| 5 | Modul Tracking (Kehadiran, Hasil, Beban Latihan) | Paket 4 |
| 6 | Modul Statistik & Rapor | Paket 5 |
| 7 | Modul Komunikasi Tim | Paket 3 |
| 8 | Implementasi PWA | Paket 1 (dapat paralel dengan 4–7) |
| 9 | Integrasi Frontend (Sesuai Desain UI/UX) | Paket 4–8 |
| 10 | Testing, UAT & Deployment | Semua paket sebelumnya |

---

## 3. Detail per Paket Pekerjaan

### Paket 1 — Setup & Infrastruktur

| Tugas | Estimasi |
|---|---|
| Setup repository & struktur project (frontend + backend) | S |
| Setup environment development, staging, production | M |
| Konfigurasi hosting frontend (mis. Vercel) | S |
| Konfigurasi hosting database MySQL (managed service) | S |
| Setup CI/CD dasar (build & deploy otomatis) | M |
| Konfigurasi HTTPS (wajib untuk PWA) | S |

### Paket 2 — Database & Skema Data

| Tugas | Estimasi |
|---|---|
| Finalisasi skema MySQL (users, teams, athlete_profiles, dst — lihat PRD Teknis Bab 2.2) | M |
| Setup ORM (Prisma/Sequelize/TypeORM) & koneksi ke MySQL | S |
| Buat migrasi awal seluruh tabel inti | M |
| Buat data seed/dummy untuk keperluan development | S |
| Implementasi soft delete untuk data sensitif (riwayat cedera, profil atlet) | S |

### Paket 3 — Autentikasi & Manajemen Pengguna

| Tugas | Estimasi |
|---|---|
| Implementasi login/register | M |
| Role-based access control (Pelatih, Asisten, Atlet, Orang tua/Wali) | L |
| Alur undangan atlet baru (link/kode undangan) | M |
| Alur persetujuan orang tua/wali untuk atlet di bawah umur (PRD Utama Bab 7.1) | M |
| Halaman pengaturan akun & kelola akses asisten/orang tua | M |

### Paket 4 — Modul Program Latihan

| Tugas | Estimasi |
|---|---|
| CRUD Bank Materi Latihan (drill library) | M |
| CRUD Program (fase → minggu → sesi → drill) | L |
| Logika program berlapis (drill wajib semua vs khusus posisi/individu) | L |
| Template program yang bisa dipakai ulang | M |
| Kalender jadwal otomatis dari program | M |
| Fitur asesmen awal (baseline) & asesmen berkala | M |
| Periodisasi musim (fase pra-musim/musim/off-season) | M |

### Paket 5 — Modul Tracking

| Tugas | Estimasi |
|---|---|
| Form input hasil latihan (per drill) | M |
| Pencatatan kehadiran sesi | M |
| Pencatatan RPE/catatan subjektif per sesi | S |
| Perhitungan & pelacakan beban latihan (training load) | L |
| Sistem peringatan otomatis lonjakan beban | M |
| Status kesiapan atlet (penuh/terbatas/istirahat) & dampaknya ke sesi | M |

### Paket 6 — Modul Statistik & Rapor

| Tugas | Estimasi |
|---|---|
| Dashboard statistik individu (grafik tren, perbandingan target) | L |
| Dashboard statistik tim (agregat, perbandingan antar pemain) | L |
| Generate rapor periodik (ringkasan capaian, catatan pelatih) | M |
| Ekspor rapor ke PDF | M |
| Fitur share link rapor (read-only, dengan masa berlaku) | M |

### Paket 7 — Modul Komunikasi Tim

| Tugas | Estimasi |
|---|---|
| Pengumuman/broadcast dari pelatih | S |
| Komentar/feedback per sesi latihan | S |
| Notifikasi perubahan jadwal | S |

### Paket 8 — Implementasi PWA

| Tugas | Estimasi |
|---|---|
| Buat Web App Manifest (ikon, nama, tema, display standalone) | S |
| Implementasi Service Worker (caching aset statis) | M |
| Strategi caching data untuk mode offline (IndexedDB, cache-then-network) — prioritas: layar Sesi Latihan Aktif & Kehadiran | L |
| Mekanisme sinkronisasi otomatis saat koneksi kembali tersedia | L |
| Implementasi Push Notification (reminder jadwal) | M |
| Uji kriteria installability (prompt "Tambahkan ke layar utama") | S |
| Indikator status koneksi (online/offline/menyinkronkan) di UI | S |

### Paket 9 — Integrasi Frontend (Sesuai Desain UI/UX)

| Tugas | Estimasi |
|---|---|
| Setup design system/component library di kode (sesuai hasil tim UI/UX) | M |
| Bangun seluruh layar sisi pelatih (10+ layar, desktop-first responsif) | L |
| Bangun seluruh layar sisi atlet (mobile-first) | L |
| Implementasi state kosong/error/warning/loading di setiap layar | M |
| Implementasi state "tersimpan lokal, menunggu sinkronisasi" (PWA) | M |
| Responsive testing di breakpoint desktop & mobile | M |

### Paket 10 — Testing, UAT & Deployment

| Tugas | Estimasi |
|---|---|
| Unit testing untuk logika inti (perhitungan beban latihan, target vs capaian) | M |
| Integration testing API | M |
| QA internal menyeluruh (seluruh modul) | L |
| Persiapan lingkungan & data untuk UAT (lihat PRD Teknis Bab 4.4) | S |
| Pelaksanaan UAT bersama pengguna nyata | — (dijadwalkan, bukan tugas developer) |
| Perbaikan isu hasil UAT (Blocker & Mayor) | Bervariasi tergantung temuan |
| Deployment ke production | S |
| Monitoring pasca-rilis (error tracking, performa) | M |

---

## 4. Urutan Pengerjaan yang Disarankan (Gantt Sederhana)

```
Minggu 1     : Paket 1 (Setup) ██████
Minggu 1–2   : Paket 2 (Database) ████████
Minggu 2–3   : Paket 3 (Auth)          ██████
Minggu 3–5   : Paket 4 (Program)             ████████████
Minggu 4–5   : Paket 8 (PWA — mulai paralel)      ████████
Minggu 5–6   : Paket 5 (Tracking)                      ████████
Minggu 6–7   : Paket 6 (Statistik)                           ████████
Minggu 5–7   : Paket 7 (Komunikasi — paralel, ringan)         ██████
Minggu 6–8   : Paket 9 (Integrasi Frontend)                        ██████████
Minggu 8–9   : Paket 10 (Testing & UAT)                                  ████████
```

*Ini estimasi kasar untuk tim kecil (2–4 developer). Sesuaikan dengan jumlah anggota tim, dan pertimbangkan mengerjakan Paket 4–7 secara paralel oleh developer berbeda jika tim lebih besar.*

---

## 5. Pembagian Peran yang Disarankan (jika tim lebih dari 1 orang)

| Peran | Tanggung Jawab Utama |
|---|---|
| **Backend Developer** | Paket 2, 3, 4, 5, 6, 7 (logika & API) |
| **Frontend Developer** | Paket 9, kolaborasi erat dengan tim UI/UX |
| **Full-stack/PWA Specialist** | Paket 8 (kebutuhan PWA lintas frontend-backend) |
| **QA/Tester** | Paket 10, koordinasi UAT |

Jika tim hanya 1–2 orang, seluruh paket tetap relevan namun dikerjakan berurutan sesuai Bab 4, dengan Paket 8 (PWA) bisa ditunda ke akhir jika perlu mempercepat rilis fitur inti terlebih dahulu.

---

## 6. Catatan Prioritas untuk Rilis Awal (Jika Perlu Dipersempit)

Jika timeline perlu dipersingkat, urutan berikut menunjukkan apa yang **paling wajib** ada di rilis pertama vs yang bisa menyusul:

**Wajib ada di rilis pertama:**
- Paket 1, 2, 3 (fondasi)
- Paket 4 — minimal: CRUD Program & Bank Materi Latihan (tanpa periodisasi kompleks dulu)
- Paket 5 — minimal: input hasil latihan & kehadiran (tanpa training load otomatis dulu)
- Paket 9 — layar-layar prioritas tertinggi saja (Beranda Atlet, Sesi Latihan Aktif, Dashboard Pelatih)

**Bisa menyusul di iterasi berikutnya (masih dalam Fase 1, tidak digeser ke Fase 2):**
- Periodisasi musim detail
- Sistem peringatan otomatis beban latihan
- Fitur PWA lanjutan (push notification, sinkronisasi offline penuh) — versi awal bisa online-only dulu
- Dashboard statistik tim (mulai dari statistik individu dulu)

---

## 7. Pertanyaan Terbuka untuk Tim Developer

1. Berapa jumlah developer yang akan mengerjakan proyek ini, untuk menyesuaikan estimasi timeline di Bab 4?
2. Apakah ada preferensi framework spesifik (mis. Next.js vs framework lain) yang sudah ditentukan, atau tim developer bebas memilih selama memenuhi kebutuhan teknis di PRD Teknis?
3. Apakah fitur PWA (Paket 8) dikerjakan penuh di rilis pertama, atau versi online-only dulu untuk mempercepat rilis awal (lihat opsi di Bab 6)?

---

*WBS ini adalah panduan kerja teknis yang melengkapi PRD Utama, PRD Teknis, dan Design Brief. Estimasi bersifat relatif dan sebaiknya dikonfirmasi ulang oleh tim developer berdasarkan kapasitas & pengalaman nyata sebelum dijadikan komitmen jadwal resmi.*
