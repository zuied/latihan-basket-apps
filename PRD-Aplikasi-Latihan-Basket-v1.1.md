# Product Requirements Document (PRD)
## Aplikasi Manajemen Latihan Basket — Personal & Tim

| | |
|---|---|
| **Versi Dokumen** | 1.1 |
| **Tanggal** | 14 September 2026 |
| **Disusun untuk** | Pelatih Basket (Product Owner) |
| **Status** | Draft untuk Review + Data Model (Supabase) |

---

## 1. Ringkasan Eksekutif

Aplikasi ini adalah platform berbasis web (dapat diakses via browser desktop maupun browser HP Android) yang membantu pelatih basket merancang, menjalankan, dan mengevaluasi program latihan — baik untuk atlet individu maupun tim secara keseluruhan. Tujuan utamanya adalah memastikan setiap program latihan **terukur** (ada data & angka), **terencana** (ada jadwal & tahapan jelas), dan **menghasilkan progres yang bisa dibuktikan** (ada laporan perkembangan).

---

## 2. Latar Belakang & Masalah yang Diselesaikan

Pelatih basket saat ini umumnya mengelola program latihan secara manual (spreadsheet, catatan kertas, chat grup), yang menyebabkan:

- Program latihan tidak terdokumentasi dengan rapi dan sulit dilacak progresnya dari waktu ke waktu.
- Sulit membandingkan perkembangan individu vs tim secara objektif.
- Komunikasi jadwal & instruksi latihan tersebar di banyak platform (WA, Excel, kertas).
- Tidak ada data historis yang bisa dijadikan dasar keputusan (misalnya siapa yang siap naik level, atau area mana yang perlu diperbaiki).

**Aplikasi ini hadir untuk menyatukan perencanaan program, pelaksanaan latihan, pencatatan hasil, dan komunikasi dalam satu tempat.**

### 2.1 Referensi Pasar / Kompetitor

Sebagai konteks posisi produk, berikut gambaran singkat aplikasi sejenis yang sudah ada di pasar global (belum banyak yang fokus khusus basket berbahasa Indonesia):

| Aplikasi Referensi | Fokus Utama | Catatan |
|---|---|---|
| **TeamBuildr** | Program kekuatan & kondisi fisik (strength & conditioning) untuk tim olahraga | Kuat di sisi fisik/atletis, kurang fokus ke drill teknik basket spesifik |
| **CoachNow** | Komunikasi & berbagi video antara pelatih-atlet | Kuat di komunikasi & media, kurang di sisi program terstruktur & statistik |
| **TeamSnap** | Manajemen jadwal & administrasi tim (multi-olahraga) | Kuat di administrasi tim, minim fitur program latihan teknis |
| **Hudl** | Analisis video pertandingan | Fokus video, di luar cakupan MVP aplikasi ini |

**Peluang diferensiasi aplikasi ini:** menggabungkan program latihan terstruktur (seperti TeamBuildr), komunikasi tim (seperti CoachNow), dan pelacakan progres personal-tim dalam satu alur kerja yang sederhana — dengan antarmuka berbahasa Indonesia yang familiar bagi pelatih & atlet lokal.

---

## 3. Tujuan Produk (Goals)

1. Memungkinkan pelatih membuat program latihan terstruktur (jangka pendek/menengah/panjang) untuk individu maupun tim.
2. Menyediakan sistem tracking yang memudahkan pencatatan hasil latihan secara konsisten.
3. Menyajikan statistik & analisis performa yang mudah dibaca untuk pengambilan keputusan.
4. Menjadi kanal komunikasi utama antara pelatih dan atlet/tim terkait jadwal dan instruksi.
5. Menghasilkan laporan progres yang bisa dibagikan ke atlet, orang tua (jika relevan), atau manajemen klub.

### Non-Goals (Di Luar Cakupan Awal)
- Bukan aplikasi analisis video pertandingan (tidak ada AI video tagging di versi awal).
- Bukan sistem pembayaran/keuangan klub.
- Bukan pengganti sistem pendaftaran turnamen resmi.

---

## 4. Target Pengguna & Peran (User Roles)

| Peran | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Pelatih (Coach/Admin)** | Pemilik akun utama, membuat & mengelola program | Membuat program, memantau semua atlet/tim, melihat laporan |
| **Asisten Pelatih** | Membantu pelatih utama | Akses program & data tim yang dibina; input data latihan, kelola drill & sesi, kelola akses orang tua |
| **Atlet Individu** | Berlatih secara personal (private coaching) | Lihat program pribadinya, catat hasil, lihat progres diri |
| **Pemain dalam Tim** | Bagian dari roster tim | Lihat jadwal tim, program individu dalam tim, progres pribadi |
| **(Opsional) Orang tua/Wali** | Memantau progres anak (untuk atlet muda) | Lihat ringkasan progres, jadwal |

---

## 5. Ruang Lingkup Fitur (MVP — Versi Pertama)

Berdasarkan prioritas yang dipilih, MVP mencakup **4 pilar utama**: Program Latihan, Tracking, Statistik, dan Komunikasi Tim — masing-masing dilengkapi kemampuan pendukung (bank materi latihan, asesmen awal, periodisasi, manajemen beban/cedera, rapor evaluasi, onboarding) agar program benar-benar terukur, terencana, dan bisa dipertanggungjawabkan hasilnya.

### 5.1 Modul Program Latihan (Planning)
- Pelatih dapat membuat **program latihan** dengan struktur: Fase → Siklus/Minggu → Sesi → Latihan (drill/exercise).
- Template program yang bisa dipakai ulang (mis. "Program Shooting 8 Minggu", "Pra-Musim Tim").
- Program bisa ditetapkan untuk: 1 atlet, beberapa atlet, atau 1 tim penuh.
- Setiap sesi latihan berisi: nama drill, target (repetisi/waktu/persentase keberhasilan), durasi, catatan teknik.
- Kalender jadwal latihan (mingguan/bulanan) yang otomatis terbentuk dari program.
- Kemampuan menyesuaikan/override jadwal individu di dalam program tim (mis. pemain cedera dapat program modifikasi).

#### 5.1.1 Bank Materi Latihan (Drill Library)

Agar pelatih tidak perlu menyusun materi dari nol setiap kali, aplikasi menyediakan **perpustakaan materi latihan (drill library)** milik masing-masing pelatih, yang bisa dipakai ulang dan ditarik ke dalam program mana pun (personal maupun tim).

Setiap materi latihan (drill) dalam library memiliki data berikut:

| Atribut | Keterangan |
|---|---|
| **Nama Drill** | Mis. "Mikan Drill", "Form Shooting Close Range", "3-Man Weave" |
| **Kategori Utama** | Fundamental Individu / Fisik & Atletis / Taktik & Tim / Mental & Game IQ |
| **Sub-kategori** | Mis. dalam "Fundamental Individu" → Ball Handling, Shooting, Footwork, Finishing, Passing, Defense Individu |
| **Level Kesulitan** | Pemula / Menengah / Lanjut (bisa juga ditandai per kelompok usia) |
| **Posisi Relevan** | Semua posisi / Guard / Forward / Center (opsional, untuk filter cepat) |
| **Target Terukur** | Repetisi, durasi, jarak, persentase keberhasilan, waktu tempuh, dsb — inilah yang membuat progres bisa diukur angka |
| **Deskripsi & Cara Pelaksanaan** | Instruksi teknik langkah-demi-langkah |
| **Peralatan Dibutuhkan** | Bola, cone, ring, stopwatch, dll |
| **Referensi Visual (opsional)** | Link video/gambar/diagram untuk memperjelas gerakan |
| **Variasi/Progresi** | Versi lebih mudah/lebih sulit dari drill yang sama, untuk kenaikan level bertahap |

**Kategori materi latihan (default, dapat disesuaikan pelatih):**

1. **Fundamental Individu** — ball handling/dribbling, shooting (form, catch & shoot, off the dribble, free throw), footwork & pivot, finishing di ring (layup, floater, finishing kontak), passing & catching, defense individu (stance, slide, closeout).
2. **Fisik & Atletis** — kekuatan (strength), kecepatan & agility, vertical jump/plyometric, daya tahan (conditioning), mobility & pemanasan/pendinginan, pencegahan cedera.
3. **Taktik & Tim** — sistem offense (motion, set play, pick and roll), sistem defense (man-to-man, zone, transition defense), screening & cutting, rebounding tim, fast break/transition, set piece (out of bounds play).
4. **Mental & Game IQ** — pengambilan keputusan (decision making), membaca pertahanan lawan, komunikasi di lapangan, simulasi situasi pertandingan (game-like scenarios).

#### 5.1.2 Perbedaan Materi: Program Personal vs Program Tim

| Aspek | Program Personal | Program Tim |
|---|---|---|
| **Fokus utama** | Perbaikan skill individu berdasarkan kelemahan/posisi spesifik atlet | Implementasi sistem & kekompakan kolektif |
| **Sumber materi** | Diambil dari kategori Fundamental Individu, Fisik & Atletis, Mental (individu) | Diambil dari kategori Taktik & Tim, plus fundamental individu yang disesuaikan peran dalam tim |
| **Personalisasi** | Sangat spesifik per atlet: target angka disesuaikan level & progres masing-masing (mis. atlet A target FT 80%, atlet B target 70%) | Target ditetapkan per kelompok/posisi (mis. semua guard fokus ball handling under pressure, semua big fokus screening & rebounding) |
| **Struktur sesi** | Bisa 1-on-1 atau drill individu terarah, intensitas & progres diatur ketat mengikuti kurva perkembangan atlet | Kombinasi drill kelompok posisi + drill kolektif seluruh tim + scrimmage/simulasi pertandingan |
| **Contoh isi program** | "Program Shooting 8 Minggu" berisi progressive drill dari form shooting statis → shooting bergerak → shooting dengan pressure | "Program Pra-Musim Tim" berisi conditioning bertahap, instalasi offense/defense system, lalu scrimmage evaluatif |

#### 5.1.3 Personalisasi Materi dalam Konteks Tim

Karena satu atlet bisa menjadi bagian dari tim sekaligus punya kebutuhan individu, aplikasi mendukung **program berlapis**:

- **Lapisan Tim**: semua pemain menjalankan sesi latihan tim yang sama sesuai jadwal (misalnya latihan sore bersama).
- **Lapisan Individu di dalam Tim**: di sesi yang sama atau sesi tambahan, setiap pemain bisa mendapat *tambahan drill personal* sesuai posisi/kelemahannya (mis. saat sesi tim ada waktu "individual skill block" 15 menit, isinya berbeda per pemain: guard mengerjakan ball handling, big mengerjakan post move).
- Pelatih dapat menandai drill sebagai **wajib untuk semua** atau **khusus untuk atlet/posisi tertentu** saat menyusun sesi.
- **Implementasi visual**: drill "wajib semua" ditampilkan dengan badge warna biru, sedangkan drill "individu per posisi" ditampilkan dengan badge warna ungu dan label posisi (Guard/Forward/Center). Pelatih dapat mengubah cakupan drill lewat tombol toggle di baris drill.
- **Urutan drill**: pelatih dapat mengurutkan ulang drill dalam satu sesi menggunakan drag-and-drop (ikon grip di tiap baris drill).

#### 5.1.4 Asesmen Awal (Baseline Assessment)

Agar progres benar-benar bisa diukur, setiap atlet/tim harus melewati **asesmen awal** sebelum sebuah program dimulai. Tanpa titik awal yang jelas, angka "progres" tidak punya pembanding.

- Pelatih dapat membuat **paket tes asesmen** (kumpulan drill yang berfungsi sebagai tes, mis. tes shooting 50 tembakan, sprint 20m, vertical jump, ball handling time trial).
- Hasil asesmen awal otomatis menjadi **baseline/patokan** yang tersimpan di profil atlet.
- Asesmen dapat diulang secara berkala (mis. tiap akhir siklus/fase) untuk membandingkan hasil terbaru vs baseline vs asesmen sebelumnya.
- Baseline ini juga dipakai sistem untuk menyarankan target awal yang realistis saat pelatih menyusun program baru.

#### 5.1.5 Periodisasi Latihan (Training Periodization)

Program latihan tidak berdiri sendiri sebagai kumpulan sesi mingguan, tetapi mengikuti prinsip **periodisasi** agar punya arah jangka panjang yang sesuai kaidah kepelatihan olahraga:

- Pelatih dapat menetapkan **fase musim** untuk tim/atlet: Pra-Musim (persiapan fisik & instalasi sistem), Musim/Kompetisi (pemeliharaan performa & taktik pertandingan), Pemulihan/Off-Season (recovery & pengembangan skill jangka panjang).
- Setiap fase punya karakteristik default berbeda (mis. Pra-Musim menekankan volume conditioning lebih tinggi, Musim menekankan intensitas taktik & jaga performa, Off-Season menekankan pengembangan skill individu & istirahat aktif).
- Kalender program otomatis menyusun urutan fase berdasarkan tanggal mulai/berakhir musim yang ditentukan pelatih (mis. kapan liga/turnamen dimulai).
- Visualisasi garis waktu (timeline) periodisasi untuk melihat keseluruhan rencana satu musim dalam satu tampilan.

### 5.2 Modul Tracking (Pelaksanaan)
- Atlet atau pelatih dapat mencatat hasil setiap sesi latihan (selesai/tidak, capaian angka vs target).
- Kehadiran (attendance) untuk sesi tim.
- Catatan subjektif per sesi (RPE/tingkat kelelahan, catatan pelatih).
- Riwayat lengkap semua sesi yang sudah dijalankan per atlet.
- Notifikasi pengingat jadwal latihan (mis. via browser notification/email).

#### 5.2.1 Manajemen Beban & Cedera (Load Management)

Mencegah cedera akibat beban latihan yang tidak terkontrol adalah bagian penting dari program yang bertanggung jawab:

- **Status kesiapan atlet**: setiap atlet punya status yang dapat diperbarui pelatih/atlet — *Latihan Penuh*, *Latihan Terbatas (modifikasi)*, atau *Istirahat/Pemulihan*.
- **Riwayat cedera**: catatan cedera per atlet (jenis, tanggal, tingkat keparahan, estimasi pemulihan) yang tersimpan di profil.
- **Pelacakan beban latihan**: akumulasi RPE × durasi per minggu (acute training load) dibandingkan rata-rata beberapa minggu terakhir, untuk melihat apakah beban naik terlalu cepat.
- **Peringatan otomatis**: notifikasi ke pelatih jika beban latihan seorang atlet melonjak signifikan dibanding rata-rata sebelumnya (indikasi risiko cedera akibat overtraining) — fitur ini dapat masuk fase lanjutan bila kompleksitas teknis tinggi.
- Saat atlet berstatus "Latihan Terbatas", program otomatis menampilkan versi drill yang dimodifikasi (jika sudah disiapkan pelatih) alih-alih drill penuh.

### 5.3 Modul Statistik & Analisis
- Dashboard progres individu: grafik perkembangan dari waktu ke waktu (mis. persentase free throw, kecepatan sprint, dll — metrik dapat disesuaikan pelatih).
- Dashboard tim: ringkasan kehadiran, tingkat penyelesaian program, perbandingan antar pemain.
- Perbandingan capaian vs target program (on-track / tertinggal).
- Laporan periodik otomatis (mingguan/bulanan) yang bisa diunduh atau dibagikan.

#### 5.3.1 Evaluasi & Rapor Periodik Berstruktur

Selain grafik mentah, aplikasi menghasilkan **"rapor" perkembangan** yang lebih mudah dibaca dan dibagikan, disusun tiap akhir siklus (mis. tiap 4 atau 8 minggu, mengikuti struktur periodisasi di 5.1.5):

- **Ringkasan capaian vs target**: per kategori materi latihan (Fundamental, Fisik, Taktik, Mental), tampilkan status tercapai/mendekati/tertinggal.
- **Catatan kualitatif pelatih**: kolom naratif tempat pelatih menuliskan evaluasi personal (kekuatan, area perbaikan, catatan sikap/perilaku latihan).
- **Rekomendasi fokus siklus berikutnya**: daftar area yang disarankan jadi prioritas program selanjutnya, berdasarkan hasil dibanding target.
- **Perbandingan lintas siklus**: melihat tren dari rapor ke rapor (mis. progres siklus 1 → 2 → 3), bukan hanya satu titik waktu.
- Rapor tersedia untuk level individu maupun ringkasan tim.

#### 5.3.2 Ekspor & Berbagi Laporan

- Semua laporan/rapor dapat **diunduh dalam format PDF** yang rapi untuk dicetak atau dikirim.
- Tersedia **tautan berbagi (share link)** yang bisa dikirim ke orang tua/wali atau manajemen klub tanpa mengharuskan mereka membuat akun/login — cukup akses lihat saja (read-only).
- Pelatih dapat mengatur masa berlaku tautan berbagi (mis. otomatis kedaluwarsa setelah 30 hari) demi menjaga privasi data atlet.

### 5.4 Modul Komunikasi Tim
- Pengumuman/broadcast dari pelatih ke tim atau individu.
- Komentar/catatan pada sesi latihan tertentu (feedback dua arah pelatih–atlet).
- Notifikasi perubahan jadwal.

### 5.5 Manajemen Pengguna & Tim
- Pelatih dapat membuat & mengelola beberapa tim sekaligus.
- Atlet dapat terdaftar di lebih dari satu tim/program (mis. tim sekolah + latihan privat).
- Profil atlet: data dasar, riwayat cedera (opsional), posisi bermain, catatan khusus.

### 5.6 Onboarding & Pengisian Profil Atlet

Alur khusus saat ada atlet baru bergabung, agar data yang dibutuhkan modul lain (asesmen, program, tracking) sudah tersedia sejak awal:

1. Pelatih mengundang atlet (via link/kode undangan) atau mendaftarkan langsung.
2. Atlet (atau pelatih, untuk atlet muda) mengisi **data dasar**: nama, tanggal lahir, posisi bermain, tinggi/berat badan (opsional), kontak orang tua/wali (jika di bawah umur).
3. Sistem mengarahkan atlet untuk mengikuti **asesmen awal** (lihat 5.1.4) sebelum ditempatkan ke program apa pun.
4. Setelah asesmen selesai, pelatih dapat langsung menetapkan program personal dan/atau memasukkan atlet ke tim.
5. Jika ada kontak orang tua/wali yang diisi, sistem mengirim undangan akses ringkasan progres (lihat 5.3.2 & Bab 7.1).

### 5.7 Sistem Rekomendasi Otomatis (Direncanakan — Fase Lanjutan)

Fitur ini bukan bagian dari MVP, namun dirancang sejak awal agar struktur data (drill library, hasil tracking, target) mendukungnya di fase berikutnya:

- Berdasarkan hasil tracking, sistem menyarankan drill tambahan untuk area yang tertinggal (mis. FT% masih di bawah target → sistem menyarankan drill free throw tambahan dari drill library).
- Rekomendasi penyesuaian target (menaikkan/menurunkan target) berdasarkan kecepatan progres aktual dibanding rencana.
- Saran urutan progresi drill (dari variasi mudah ke sulit) berdasarkan tingkat keberhasilan atlet pada drill sebelumnya.
- Fitur ini butuh volume data historis yang cukup untuk bermakna, sehingga realistis dikerjakan setelah aplikasi berjalan minimal 1-2 siklus program (lihat Bab 9, Fase 2/3).

---

## 6. Alur Pengguna Utama (Key User Flows)

**Flow 1 — Pelatih membuat program baru untuk tim:**
Login → Pilih Tim → Buat Program Baru → Tentukan durasi & fase → Susun sesi & drill per minggu → Publish → Program otomatis muncul di kalender & akun setiap pemain.

**Flow 2 — Atlet menjalankan sesi latihan personal:**
Login → Lihat jadwal hari ini → Buka sesi latihan → Ikuti drill sesuai instruksi → Input hasil (skor/repetisi) → Submit → Progres otomatis ter-update di dashboard.

**Flow 3 — Pelatih mengevaluasi progres:**
Login → Pilih atlet/tim → Buka Dashboard Statistik → Lihat grafik tren → Bandingkan dengan target program → Unduh/bagikan laporan.

---

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Platform** | Responsive web app — berjalan optimal di browser desktop & mobile (Android Chrome minimal) |
| **Performa** | Waktu muat halaman < 3 detik pada koneksi 4G standar |
| **Skalabilitas** | Mendukung minimal 1 pelatih dengan banyak tim (puluhan atlet) di versi awal, dapat berkembang |
| **Keamanan & Privasi** | Data atlet (terutama di bawah umur) harus terlindungi; login dengan autentikasi standar; role-based access |
| **Offline/Koneksi Terbatas** | Idealnya sesi latihan tetap bisa diisi walau koneksi lambat, sinkron saat online kembali (nice-to-have, bukan wajib MVP) |
| **Ketersediaan** | Uptime yang stabil terutama pada jam-jam latihan (sore/malam) |

### 7.1 Perlindungan Data Atlet di Bawah Umur

Mengingat kemungkinan besar pengguna adalah atlet usia sekolah/junior, aplikasi perlu perhatian khusus soal data anak:

- **Persetujuan orang tua/wali**: saat mendaftarkan atlet di bawah umur (mis. di bawah 17 tahun, dapat disesuaikan kebijakan), sistem meminta konfirmasi/persetujuan dari orang tua/wali sebelum akun aktif penuh.
- **Batasan data yang disimpan**: hanya menyimpan data yang benar-benar diperlukan untuk fungsi program latihan (data performa, kehadiran, cedera terkait latihan) — tidak menyimpan data sensitif di luar keperluan tersebut.
- **Kontrol akses berjenjang**: orang tua/wali hanya bisa melihat ringkasan progres anak mereka sendiri (read-only), tidak bisa melihat data atlet lain dalam tim.
- **Hak hapus data**: orang tua/wali atau atlet (setelah dewasa) dapat meminta penghapusan akun & data sesuai kebutuhan.
- **Transparansi**: kebijakan privasi yang jelas dan mudah dipahami, dijelaskan dalam bahasa sederhana (bukan hanya istilah hukum) mengingat sebagian pengguna adalah anak-anak/remaja.

---

## 8. Metrik Keberhasilan (Success Metrics)

Karena tujuan utama produk adalah program yang **terukur, terencana, dan berhasil**, metrik berikut jadi tolok ukur:

- **Tingkat kepatuhan program**: % sesi latihan yang diselesaikan sesuai jadwal.
- **Tingkat pencapaian target**: % atlet yang mencapai target performa yang ditetapkan dalam program.
- **Konsistensi pencatatan**: % sesi yang datanya diinput (bukan kosong/terlewat).
- **Retensi penggunaan**: pelatih & atlet aktif menggunakan aplikasi tiap minggu selama masa program berjalan.
- **Kepuasan pengguna**: umpan balik kualitatif dari pelatih & atlet setelah 1 siklus program (mis. 8 minggu).

---

## 9. Fase Pengembangan yang Disarankan

| Fase | Fokus |
|---|---|
| **Fase 1 (MVP)** | Program latihan (termasuk bank materi, asesmen awal, periodisasi), tracking dasar & manajemen beban, statistik dasar & rapor periodik, komunikasi tim, onboarding atlet — sesuai cakupan Bab 5 |
| **Fase 2** | Sistem rekomendasi otomatis (5.7), laporan otomatis lanjutan, template program yang lebih kaya, profil atlet lebih detail (cedera, riwayat medis) |
| **Fase 3** | Integrasi video/foto teknik, mode offline penuh, akses orang tua/wali penuh, ekspor data lanjutan |

---

## 10. Risiko & Pertimbangan

- **Adopsi pengguna**: atlet (terutama usia muda) perlu diarahkan agar konsisten mengisi data — perlu UX yang sangat sederhana dan cepat diisi (idealnya < 1 menit per sesi).
- **Kualitas data**: jika input data tidak konsisten, statistik jadi kurang bermakna — perlu reminder & UX yang mendorong kepatuhan.
- **Kompleksitas program tim vs individu**: struktur data harus fleksibel agar satu atlet bisa punya program pribadi sekaligus ikut program tim tanpa bentrok.

---

## 11. Pertanyaan Terbuka untuk Didiskusikan Lebih Lanjut

1. Apakah dibutuhkan aplikasi terpisah untuk atlet vs dashboard pelatih, atau cukup satu web app dengan tampilan berbeda per role?
2. Metrik performa apa saja yang ingin dilacak secara default (shooting %, sprint time, vertical jump, dll)? Ini akan menentukan struktur data drill.
3. ~~Apakah ada kebutuhan multi-pelatih dalam satu tim (misalnya kepala pelatih + asisten) dengan hak akses berbeda?~~ **Sudah dijawab:** Ya, asisten pelatih bisa melihat dan mengelola program tim yang dibina, dengan hak akses yang sama dengan pelatih utama untuk program tim tersebut.
4. Berapa perkiraan jumlah atlet/tim yang akan dikelola dalam 6–12 bulan pertama? (untuk estimasi skala teknis)

---

*Dokumen ini adalah draft yang sudah dilengkapi model data awal (Bab 12) dan terbuka untuk direvisi berdasarkan diskusi lebih lanjut sebelum masuk ke tahap desain teknis (wireframe & arsitektur sistem).*

---

## 12. Model Data / Database Schema (Supabase / PostgreSQL)

Dokumen ini merekomendasikan **Supabase (PostgreSQL)** sebagai database utama karena cocok dengan struktur data hierarkis, multi-role, dan kebutuhan statistik yang ada di PRD. Schema di bawah ini dirancang untuk mendukung seluruh fitur MVP (Program, Drill Library, Asesmen, Tracking, Load Management, Komunikasi, Role-based Access, dan Privasi data anak).

> Catatan: Semua tabel utama menggunakan `uuid` sebagai primary key. Relasi ke `auth.users` dilakukan melalui tabel `profiles`. Row Level Security (RLS) wajib diaktifkan pada semua tabel untuk memisahkan data antar pelatih, atlet, dan orang tua.

### 12.1 Diagram Relasi Utama (Ringkas)

```
auth.users
    └── profiles (1:1)
            ├── teams (coach)
            ├── team_members (athlete)
            ├── parent_athlete_links
            ├── drills (owner)
            ├── programs (owner)
            ├── injuries
            └── athlete_readiness

programs
    ├── program_phases
    │       └── program_cycles
    │               └── sessions
    │                       └── session_drills → drills
    └── program_assignments (atlet / tim)

sessions + athletes
    └── session_logs
            └── drill_results

assessments
    ├── assessment_items → drills
    └── assessment_results
```

### 12.2 Daftar Tabel & Field Utama

#### A. Pengguna & Akses

**profiles** (memperluas auth.users)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | = auth.users.id |
| full_name | text | |
| role | text | 'coach', 'assistant', 'athlete', 'parent' |
| date_of_birth | date | Untuk deteksi di bawah umur |
| position | text | Guard / Forward / Center / dll (nullable) |
| height_cm | numeric | Opsional |
| weight_kg | numeric | Opsional |
| phone | text | |
| avatar_url | text | |
| is_minor | boolean | Generated / dihitung dari date_of_birth |
| parent_consent_status | text | 'pending', 'approved', 'rejected' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**parent_athlete_links**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| parent_id | uuid FK → profiles | |
| athlete_id | uuid FK → profiles | |
| relationship | text | 'ayah', 'ibu', 'wali', dll |
| status | text | 'pending', 'active', 'revoked' |
| created_at | timestamptz | |

#### B. Tim

**teams**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| name | text | |
| coach_id | uuid FK → profiles | Pemilik utama |
| description | text | |
| season_start | date | |
| season_end | date | |
| created_at | timestamptz | |

**team_members**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| team_id | uuid FK → teams | |
| athlete_id | uuid FK → profiles | |
| role_in_team | text | 'player', 'assistant_coach' |
| jersey_number | text | Opsional |
| status | text | 'active', 'inactive' |
| joined_at | timestamptz | |

#### C. Bank Materi Latihan (Drill Library)

**drills**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| owner_id | uuid FK → profiles | Pelatih pemilik |
| name | text | |
| main_category | text | Fundamental Individu / Fisik & Atletis / Taktik & Tim / Mental & Game IQ |
| sub_category | text | Ball Handling, Shooting, dll |
| difficulty | text | 'pemula', 'menengah', 'lanjut' |
| relevant_positions | text[] | Array: {'Guard','Forward',...} atau {'All'} |
| target_type | text | 'reps', 'time_sec', 'percentage', 'distance_m', dll |
| default_target_value | numeric | |
| description | text | Cara pelaksanaan |
| equipment | text[] | |
| video_url | text | Referensi visual |
| variations | jsonb | Versi mudah/sulit |
| is_public_template | boolean | Default false |
| created_at | timestamptz | |

#### D. Program Latihan & Periodisasi

**programs**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| name | text | |
| owner_id | uuid FK → profiles | |
| type | text | 'personal', 'team' |
| team_id | uuid FK → teams | Nullable |
| description | text | |
| start_date | date | |
| end_date | date | |
| status | text | 'draft', 'active', 'completed', 'archived' |
| is_template | boolean | |
| created_at | timestamptz | |

**program_assignments** (siapa yang menjalankan program)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| program_id | uuid FK → programs | |
| athlete_id | uuid FK → profiles | Nullable jika full team |
| team_id | uuid FK → teams | Nullable |
| assigned_at | timestamptz | |

**program_phases**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| program_id | uuid FK → programs | |
| name | text | Pra-Musim, Kompetisi, Off-Season, dll |
| order_index | int | |
| start_date | date | |
| end_date | date | |
| focus_notes | text | |

**program_cycles** (minggu / mikro-siklus)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| phase_id | uuid FK → program_phases | |
| name | text | Minggu 1, dll |
| week_number | int | |
| start_date | date | |
| end_date | date | |

**sessions**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| cycle_id | uuid FK → program_cycles | Nullable jika sesi lepas |
| program_id | uuid FK → programs | |
| name | text | |
| scheduled_at | timestamptz | |
| duration_minutes | int | |
| location | text | Opsional |
| notes | text | |
| is_optional | boolean | |

**session_drills**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| session_id | uuid FK → sessions | |
| drill_id | uuid FK → drills | |
| order_index | int | |
| target_value | numeric | |
| target_unit | text | |
| duration_minutes | int | |
| is_mandatory | boolean | Default true |
| assigned_athlete_id | uuid FK → profiles | Null = semua / sesuai posisi |
| assigned_positions | text[] | Null = semua |
| notes | text | |

#### E. Asesmen Awal (Baseline)

**assessments**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| owner_id | uuid FK → profiles | |
| name | text | Mis. "Baseline Shooting & Athletic" |
| description | text | |
| created_at | timestamptz | |

**assessment_items**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| assessment_id | uuid FK → assessments | |
| drill_id | uuid FK → drills | |
| order_index | int | |
| target_instruction | text | |

**assessment_results**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| assessment_id | uuid FK → assessments | |
| athlete_id | uuid FK → profiles | |
| conducted_at | timestamptz | |
| is_baseline | boolean | True untuk asesmen awal |
| notes | text | |
| conducted_by | uuid FK → profiles | |

**assessment_result_items**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| assessment_result_id | uuid FK → assessment_results | |
| assessment_item_id | uuid FK → assessment_items | |
| actual_value | numeric | |
| unit | text | |
| notes | text | |

#### F. Tracking & Pelaksanaan

**session_logs**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| session_id | uuid FK → sessions | |
| athlete_id | uuid FK → profiles | |
| attendance_status | text | 'present', 'absent', 'late', 'excused' |
| completed | boolean | |
| rpe | int | 1–10 (Rate of Perceived Exertion) |
| duration_actual_minutes | int | |
| athlete_notes | text | |
| coach_notes | text | |
| logged_at | timestamptz | |

**drill_results**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| session_log_id | uuid FK → session_logs | |
| session_drill_id | uuid FK → session_drills | |
| actual_value | numeric | |
| unit | text | |
| success_count | int | Opsional |
| attempt_count | int | Opsional |
| notes | text | |

#### G. Manajemen Beban & Cedera

**injuries**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| athlete_id | uuid FK → profiles | |
| injury_type | text | |
| body_part | text | |
| severity | text | 'ringan', 'sedang', 'berat' |
| start_date | date | |
| expected_recovery_date | date | |
| status | text | 'active', 'recovered' |
| notes | text | |
| recorded_by | uuid FK → profiles | |

**athlete_readiness**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| athlete_id | uuid FK → profiles | |
| status | text | 'full', 'limited', 'rest' |
| reason | text | |
| valid_from | timestamptz | |
| valid_until | timestamptz | Nullable |
| updated_by | uuid FK → profiles | |
| updated_at | timestamptz | |

#### H. Komunikasi

**announcements**
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| author_id | uuid FK → profiles | |
| team_id | uuid FK → teams | Nullable |
| athlete_id | uuid FK → profiles | Nullable (untuk personal) |
| title | text | |
| content | text | |
| created_at | timestamptz | |

**session_comments** (feedback dua arah)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| session_id | uuid FK → sessions | |
| author_id | uuid FK → profiles | |
| content | text | |
| created_at | timestamptz | |

### 12.3 Catatan Implementasi Supabase

1. **Row Level Security (RLS)** wajib diaktifkan di semua tabel. Contoh policy penting:
   - Atlet hanya bisa membaca/menulis data miliknya sendiri.
   - Orang tua hanya bisa membaca data anak yang terhubung melalui `parent_athlete_links`.
   - Pelatih hanya bisa mengakses data tim & atlet yang dia kelola.
   - **Asisten pelatih** memiliki akses yang sama dengan pelatih utama untuk program, drill, dan sesi tim yang dibina (ditentukan melalui `team_members.role_in_team = 'assistant_coach'`). Asisten juga bisa mengelola akses orang tua untuk tim yang dibina.

2. **Indexes** yang disarankan:  
   `(athlete_id, scheduled_at)`, `(program_id)`, `(session_id)`, `(team_id)`, `(owner_id)` pada tabel terkait.

3. **View / Materialized View** bisa dibuat kemudian untuk dashboard statistik (progres FT%, attendance rate, acute:chronic workload, dll).

4. **Storage** Supabase digunakan untuk avatar, foto cedera (opsional), dan file PDF rapor.

5. Schema ini mendukung fitur rekomendasi otomatis di Fase 2 karena semua hasil tracking & target tersimpan terstruktur.

### 12.4 Perubahan Status Dokumen

Dengan penambahan model data ini, PRD bergerak lebih dekat ke tahap desain teknis. Schema di atas bersifat **draft awal** dan dapat disesuaikan setelah diskusi lebih lanjut dengan developer.

