# PRD untuk Tim UI/UX
## Aplikasi Manajemen Latihan Basket — Personal & Tim

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 16 September 2026 |
| **Disusun untuk** | Tim Perancang UI/UX |
| **Diturunkan dari** | PRD Aplikasi Latihan Basket v1.0 (Product Owner: Pelatih Basket) |
| **Status** | Draft untuk Review |

---

## 1. Tujuan Dokumen Ini

Dokumen ini menerjemahkan kebutuhan produk (PRD utama) menjadi kebutuhan yang relevan untuk proses **perancangan UI/UX**: layar apa saja yang perlu dirancang, alur apa yang perlu diperhalus, prinsip desain yang harus dipegang, serta batasan teknis yang memengaruhi keputusan desain. Dokumen ini bukan pengganti PRD utama — melainkan lensa desain di atasnya. Untuk detail fitur & logika bisnis lengkap, tim desain tetap perlu merujuk ke PRD utama.

---

## 2. Konteks Produk (Ringkasan)

Aplikasi berbasis **web responsif** (diakses lewat browser desktop maupun browser HP Android) untuk pelatih basket menyusun, menjalankan, dan mengevaluasi program latihan — baik untuk atlet individu (personal coaching) maupun tim. Nilai inti produk: program yang **terukur, terencana, dan menghasilkan progres yang bisa dibuktikan**.

Empat pilar fitur MVP: **Program Latihan**, **Tracking**, **Statistik & Rapor**, **Komunikasi Tim** — didukung modul pelengkap: bank materi latihan, asesmen awal, periodisasi, manajemen beban/cedera, onboarding.

---

## 3. Target Pengguna dari Sudut Pandang Desain

Selain peran (role) yang sudah didefinisikan di PRD utama, tim desain perlu memperhatikan **konteks pemakaian** tiap peran karena ini sangat memengaruhi keputusan UI:

| Peran | Perangkat Utama | Konteks Penggunaan | Implikasi Desain |
|---|---|---|---|
| **Pelatih (Admin)** | Desktop/laptop (saat menyusun program), HP (saat di lapangan) | Sesi fokus lebih panjang saat merancang program; butuh akses cepat saat di lapangan untuk cek jadwal/kehadiran | Desktop: layout kaya data & tabel. Mobile: ringkas, aksi cepat (mis. tandai kehadiran) |
| **Asisten Pelatih** | Sama seperti pelatih, tapi akses terbatas | Input cepat di sela latihan | UI harus jelas membedakan apa yang bisa/tidak bisa diakses tanpa terasa "dikunci" |
| **Atlet (personal/tim)** | Dominan HP, sering di lapangan dengan tangan berkeringat/terburu-buru | Mengisi hasil latihan sesaat setelah/selama sesi berlangsung | **Prioritas tertinggi**: input harus super cepat (target < 1 menit per sesi, lihat Risiko #1 di PRD utama), tombol besar, minim ketikan (pakai stepper/slider/tap, bukan keyboard) |
| **Atlet muda (junior)** | HP, kemungkinan literasi digital lebih rendah | Kemungkinan didampingi orang tua saat pertama pakai | Bahasa & ikon sederhana, alur onboarding dituntun langkah demi langkah |
| **Orang tua/Wali** | HP, akses jarang (cek sesekali) | Hanya ingin tahu progres anak, tidak berinteraksi mendalam | Tampilan ringkasan read-only yang jelas tanpa perlu belajar navigasi aplikasi |

**Implikasi desain utama:** ini adalah produk **mobile-first untuk sisi atlet**, dan **desktop-first (tapi tetap responsif) untuk sisi pelatih** saat menyusun program — dua mode berpikir desain yang berbeda dalam satu sistem.

---

## 4. Prinsip Desain (Design Principles)

Prinsip berikut sebaiknya jadi acuan setiap keputusan desain, diturunkan langsung dari tujuan & risiko yang tercantum di PRD utama:

1. **Kecepatan input di atas segalanya (untuk atlet).** Mengisi hasil latihan harus terasa seperti mencentang, bukan mengisi formulir. Gunakan komponen tap/slider/stepper, hindari input teks bebas kecuali perlu.
2. **Angka & progres harus terasa nyata, bukan sekadar tabel.** Karena nilai inti produk adalah "terukur", visualisasi progres (grafik, indikator on-track/tertinggal) harus jadi elemen visual utama, bukan pelengkap.
3. **Satu bahasa visual, dua kebutuhan berbeda.** Tampilan pelatih (data-dense, banyak kontrol) dan tampilan atlet (ringkas, aksi tunggal per layar) harus terasa satu keluarga desain, meski kompleksitasnya berbeda jauh.
4. **Tidak pernah membuat pengguna bingung "hari ini saya harus apa".** Baik pelatih maupun atlet harus langsung tahu dari dashboard: apa yang perlu dikerjakan hari ini.
5. **Ramah untuk pengguna muda dan orang tua yang kurang teknis.** Hindari jargon teknis, gunakan bahasa Indonesia yang natural (sesuai PRD utama, ini juga jadi nilai diferensiasi dibanding kompetitor global).
6. **Desain harus menoleransi data kosong.** Banyak status awal (atlet baru, belum ada hasil, belum ada asesmen) — setiap layar butuh *empty state* yang informatif, bukan halaman kosong membingungkan.

---

## 5. Peta Informasi (Sitemap) per Peran

### 5.1 Sisi Pelatih (Admin)
```
Dashboard
├─ Tim & Atlet
│  ├─ Daftar tim → Detail tim → Roster pemain
│  └─ Profil atlet → Riwayat, asesmen, status kesiapan
├─ Program Latihan
│  ├─ Bank materi latihan (drill library)
│  ├─ Buat/edit program (builder: fase → minggu → sesi → drill)
│  ├─ Template program
│  └─ Kalender jadwal
├─ Tracking
│  ├─ Kehadiran per sesi
│  └─ Log hasil latihan per atlet
├─ Statistik & Rapor
│  ├─ Dashboard progres individu
│  ├─ Dashboard progres tim
│  └─ Rapor periodik (buat, unduh, bagikan)
├─ Komunikasi
│  ├─ Pengumuman/broadcast
│  └─ Komentar per sesi
└─ Pengaturan
   ├─ Kelola asisten pelatih
   └─ Kelola akses orang tua/wali
```

### 5.2 Sisi Atlet
```
Beranda (hari ini)
├─ Jadwal/kalender saya
├─ Sesi latihan aktif → Jalankan drill → Input hasil
├─ Progres saya (grafik, rapor)
└─ Pesan/pengumuman dari pelatih
```

### 5.3 Sisi Orang Tua/Wali (ringkas)
```
Ringkasan progres anak (read-only)
└─ Rapor periodik (lihat/unduh)
```

---

## 6. Inventaris Layar yang Perlu Dirancang

Daftar berikut mengelompokkan layar per modul PRD, sebagai checklist untuk tim desain (belum termasuk state seperti loading/error/empty — lihat Bab 8).

| # | Layar | Peran Pengguna | Prioritas |
|---|---|---|---|
| 1 | Login & pemilihan peran | Semua | Wajib MVP |
| 2 | Onboarding atlet baru (isi data → asesmen awal) | Atlet, Pelatih | Wajib MVP |
| 3 | Dashboard pelatih | Pelatih | Wajib MVP |
| 4 | Daftar & detail tim/roster | Pelatih | Wajib MVP |
| 5 | Profil atlet (data, riwayat, status kesiapan) | Pelatih | Wajib MVP |
| 6 | Bank materi latihan (drill library) — daftar & filter | Pelatih | Wajib MVP |
| 7 | Detail/form drill (buat & edit drill) | Pelatih | Wajib MVP |
| 8 | Program builder (susun fase-minggu-sesi-drill) | Pelatih | Wajib MVP — kompleksitas tertinggi |
| 9 | Kalender jadwal (mingguan/bulanan) | Pelatih, Atlet | Wajib MVP |
| 10 | Timeline periodisasi musim | Pelatih | Wajib MVP |
| 11 | Halaman asesmen (buat paket tes, input hasil) | Pelatih, Atlet | Wajib MVP |
| 12 | Beranda atlet ("hari ini") | Atlet | Wajib MVP |
| 13 | Halaman sesi latihan aktif (jalankan drill) | Atlet | Wajib MVP — paling sering dipakai |
| 14 | Form input hasil latihan | Atlet | Wajib MVP — harus tercepat |
| 15 | Kehadiran sesi (tandai hadir/tidak) | Pelatih/Asisten | Wajib MVP |
| 16 | Status kesiapan & beban latihan (load management) | Pelatih | Wajib MVP |
| 17 | Dashboard statistik individu | Pelatih, Atlet | Wajib MVP |
| 18 | Dashboard statistik tim | Pelatih | Wajib MVP |
| 19 | Rapor periodik (tampilan & generate) | Pelatih | Wajib MVP |
| 20 | Halaman berbagi rapor (share link, read-only) | Orang tua/Wali | Wajib MVP |
| 21 | Pengumuman/broadcast (buat & daftar) | Pelatih | Wajib MVP |
| 22 | Komentar per sesi latihan | Pelatih, Atlet | Wajib MVP |
| 23 | Pengaturan akun & kelola akses (asisten, orang tua) | Pelatih | Wajib MVP |
| 24 | Rekomendasi otomatis (saran drill/target) | Pelatih | Fase 2 — desain awal saja |

---

## 7. Alur Kunci yang Perlu Didesain Detail (Detailed User Flows)

Selain 3 flow ringkas di PRD utama (Bab 6), berikut alur yang butuh perhatian desain lebih dalam karena rawan menjadi titik gesekan (friction point):

**A. Alur onboarding atlet baru → asesmen awal**
Ini adalah kesan pertama pengguna terhadap aplikasi. Harus dirancang sebagai wizard singkat bertahap, bukan satu formulir panjang. Sertakan indikator progres ("Langkah 2 dari 4").

**B. Alur mengisi hasil latihan (paling sering diulang)**
Ini adalah interaksi dengan frekuensi tertinggi di seluruh aplikasi. Perlu dirancang sebagai pola berulang yang sangat konsisten — layout drill-demi-drill dengan input minimal (tap angka, slider, atau preset cepat), progres sesi terlihat jelas (mis. "3 dari 6 drill selesai"), dan konfirmasi submit yang jelas namun tidak butuh banyak klik.

**C. Alur program builder (fase → minggu → sesi → drill)**
Ini fitur dengan kompleksitas tertinggi. Perlu pola UI yang bisa menangani struktur bertingkat tanpa terasa berat — pertimbangkan pola drag-and-drop, tarik dari drill library ke slot sesi, dan preview kalender langsung ter-update.

**D. Alur "program berlapis" (drill wajib semua vs drill khusus posisi/individu dalam sesi tim)**
Perlu visual yang jelas membedakan mana bagian sesi yang sama untuk semua pemain dan mana yang personal, baik di sisi pelatih (saat menyusun) maupun atlet (saat menjalankan) — supaya atlet tidak bingung kenapa instruksinya berbeda dari rekan setimnya.

**E. Alur eskalasi peringatan beban latihan (load management)**
Saat sistem mendeteksi lonjakan beban seorang atlet, perlu alur yang jelas dari notifikasi → detail → tindakan (ubah status kesiapan atlet / modifikasi sesi berikutnya) tanpa terasa seperti "alarm error" yang menakutkan.

---

## 8. Kebutuhan State & Kondisi Khusus

Setiap layar dalam Bab 6 idealnya dirancang dengan mempertimbangkan kondisi berikut (tidak semua state berlaku untuk semua layar):

- **Kosong (empty state)** — mis. atlet baru belum punya data progres, tim baru belum punya program. Harus mengarahkan pengguna ke aksi berikutnya, bukan sekadar "tidak ada data".
- **Dalam proses (loading)** — terutama untuk layar dengan data statistik/grafik.
- **Gagal (error)** — khususnya untuk aksi submit hasil latihan (jangan sampai atlet kehilangan input karena koneksi terputus, ingat kebutuhan non-fungsional soal koneksi terbatas).
- **Butuh perhatian (warning)** — mis. status kesiapan atlet "terbatas/istirahat", beban latihan melonjak, target tertinggal jauh dari rencana.
- **Read-only** — untuk tampilan orang tua/wali dan asisten pelatih dengan akses terbatas.
- **Offline/koneksi lambat** — form input hasil latihan idealnya tetap bisa diisi dan tersimpan sementara (lihat PRD utama Bab 7, ini nice-to-have tapi baik dipikirkan dari awal desain agar tidak perlu redesain besar nanti).

---

## 9. Kebutuhan Konten & Microcopy

- Semua teks antarmuka dalam **Bahasa Indonesia**, natural dan tidak kaku (hindari terjemahan harfiah dari istilah asing basket bila ada padanan umum yang dipakai pelatih Indonesia — mis. tetap gunakan istilah yang sudah lazim seperti "layup", "free throw", "dribbling").
- Istilah teknis basket (nama drill, posisi, sistem taktik) sebaiknya dikonsultasikan dengan pelatih agar sesuai istilah yang benar-benar dipakai di lapangan, bukan hasil terjemahan generik.
- Pesan error & validasi harus actionable (memberi tahu apa yang harus dilakukan, bukan sekadar "terjadi kesalahan").
- Label & instruksi drill di halaman "sesi latihan aktif" harus sangat ringkas — atlet membacanya sambil bergerak/berlatih, bukan duduk santai membaca.

---

## 10. Kebutuhan Responsif & Lintas Perangkat

- **Breakpoint minimal yang perlu didesain:** Desktop (≥1024px, untuk pelatih menyusun program) dan Mobile (~360–430px, untuk atlet & pelatih saat di lapangan). Tablet dapat mengikuti pola desktop dengan penyesuaian kepadatan.
- Layar dengan interaksi kompleks (program builder, drill library dengan banyak filter) perlu dipikirkan versi mobile-nya secara khusus — kemungkinan disederhanakan (mis. builder penuh hanya optimal di desktop, versi mobile untuk penyesuaian cepat saja).
- Layar dengan frekuensi tinggi (beranda atlet, isi hasil latihan, kehadiran) harus **mobile-first**, baru diadaptasi ke desktop.

---

## 11. Aksesibilitas & Inklusivitas

- Ukuran target sentuh (tap target) cukup besar, mengingat sebagian pengguna adalah anak-anak/remaja dan digunakan sambil bergerak/berkeringat di lapangan.
- Kontras warna cukup untuk dibaca di luar ruangan/lapangan outdoor dengan cahaya terang.
- Hindari mengandalkan warna saja untuk menyampaikan status (mis. status "perlu perhatian" sebaiknya pakai ikon/label teks, bukan warna merah saja) — penting untuk pengguna dengan buta warna.
- Bahasa yang digunakan sederhana, mempertimbangkan variasi usia pengguna (dari atlet junior hingga pelatih dewasa).

---

## 12. Kebutuhan Sistem Desain (Design System)

Untuk konsistensi lintas puluhan layar di atas, disarankan tim UI/UX menyiapkan sejak awal:

- **Komponen dasar**: tombol, input, stepper angka, slider, badge status (on-track/tertinggal/perlu perhatian), kartu ringkasan metrik, kalender, tabel data.
- **Pola komponen khusus produk ini**: kartu drill (untuk drill library & builder), kartu sesi latihan, komponen progres bertingkat (fase → minggu → sesi), grafik tren progres, komponen rapor yang bisa diekspor rapi ke PDF.
- **Sistem warna status** yang konsisten dipakai di seluruh aplikasi untuk: tercapai/on-track, mendekati target, tertinggal, perlu perhatian/warning, dan status kesiapan atlet (penuh/terbatas/istirahat).
- **Ikonografi** untuk kategori materi latihan (Fundamental, Fisik & Atletis, Taktik & Tim, Mental) agar mudah dikenali sekilas tanpa membaca label.

---

## 13. Yang Diharapkan dari Tim UI/UX (Deliverables)

1. **Peta alur pengguna (user flow)** yang lebih detail dari Bab 7, khususnya untuk 5 alur kunci yang disebutkan.
2. **Wireframe low-fidelity** untuk seluruh layar di Bab 6 (sudah dimulai sebagian bersama tim produk — lihat lampiran wireframe awal).
3. **Desain high-fidelity** untuk kedua breakpoint utama (desktop & mobile), minimal untuk layar prioritas tertinggi (beranda atlet, isi hasil latihan, dashboard pelatih, program builder).
4. **Design system/component library** dasar sesuai Bab 12.
5. **Prototipe interaktif** untuk alur B (isi hasil latihan) dan C (program builder) sebelum development, mengingat kompleksitas & frekuensi pemakaiannya.

---

## 14. Kriteria Sukses dari Sisi Desain

Selaras dengan metrik keberhasilan produk di PRD utama (Bab 8), dari sisi desain secara khusus:

- **Waktu pengisian hasil latihan** oleh atlet idealnya di bawah 1 menit per sesi (target eksplisit dari PRD utama).
- **Tingkat penyelesaian onboarding** (dari mulai daftar sampai asesmen awal selesai) tanpa bantuan/drop-off tinggi.
- **Tidak ada kebingungan navigasi** antara "apa yang wajib untuk semua tim" vs "apa yang khusus untuk saya" pada program berlapis (diuji lewat usability testing).
- **Pelatih bisa menyusun program dasar** (mis. 4 minggu, 3 sesi/minggu) dalam waktu singkat tanpa training/panduan tambahan.

---

## 15. Pertanyaan Terbuka untuk Tim Desain

1. Apakah dibutuhkan dua aplikasi/tampilan terpisah (pelatih vs atlet) dengan branding sama, atau satu shell aplikasi dengan tampilan adaptif per peran? (terkait Pertanyaan Terbuka #1 di PRD utama)
2. Apakah program builder cukup ditangani dengan pola form bertingkat, atau perlu pola visual seperti drag-and-drop/kanban untuk menyusun fase-minggu-sesi?
3. Untuk atlet junior, apakah perlu mode tampilan yang lebih "playful"/gamified (mis. badge pencapaian) dibanding tampilan untuk atlet dewasa/tim profesional — atau cukup satu tone visual untuk semua?
4. Sejauh mana kebutuhan mode offline (Bab 7 PRD utama) memengaruhi arsitektur desain form input sejak awal, mengingat ini nice-to-have namun berdampak besar pada pola interaksi jika ditambahkan belakangan?

---

*Dokumen ini adalah turunan dari PRD utama khusus untuk kebutuhan perancangan UI/UX, dan sebaiknya dibaca berdampingan dengannya. Wireframe awal untuk beberapa layar prioritas (dashboard pelatih, dll) telah mulai disusun bersama tim produk sebagai titik awal diskusi dengan tim desain.*
