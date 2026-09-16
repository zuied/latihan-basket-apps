# Design Brief
## Aplikasi Manajemen Latihan Basket — Personal & Tim

| | |
|---|---|
| **Versi** | 1.1 |
| **Tanggal** | 16 September 2026 |
| **Untuk** | Tim Perancang UI/UX |
| **Dari** | Pelatih Basket (Product Owner) |
| **Tools Desain** | Penpot (lihat Bab 12 — Panduan Teknis Penggunaan Penpot) |
| **Dokumen Pendukung** | PRD Utama, PRD UI/UX, Spesifikasi Wireframe, PRD Teknis (lihat Bab 10) |

---

## 1. Ringkasan Proyek

Kami membangun web app (dapat diinstal sebagai PWA) untuk pelatih basket menyusun, menjalankan, dan mengevaluasi program latihan — untuk atlet individu maupun tim. Nilai jual utamanya: program latihan yang **terukur, terencana, dan menghasilkan progres yang bisa dibuktikan**, menggantikan cara kerja manual (spreadsheet, kertas, chat grup) yang selama ini dipakai pelatih.

---

## 2. Masalah yang Ingin Diselesaikan

Pelatih saat ini kesulitan melacak progres atlet secara konsisten, program latihan tidak terdokumentasi rapi, dan komunikasi jadwal tersebar di banyak platform. Aplikasi ini menyatukan semuanya dalam satu tempat.

---

## 3. Tujuan Desain

Desain harus membuat pengguna:
1. **Pelatih** — bisa menyusun program latihan terstruktur tanpa merasa mengisi formulir birokratis, dan langsung tahu "siapa yang perlu perhatian hari ini" dari dashboard.
2. **Atlet** — bisa mencatat hasil latihannya dalam hitungan detik, bahkan sambil masih di tengah sesi latihan.
3. **Orang tua/wali** — bisa melihat progres anaknya tanpa perlu belajar cara pakai aplikasi.

---

## 4. Target Pengguna

| Peran | Perangkat Dominan | Catatan Desain Penting |
|---|---|---|
| Pelatih | Desktop (susun program), HP (di lapangan) | Butuh tampilan data-dense namun tetap rapi |
| Atlet (termasuk junior) | HP, dipakai sambil bergerak/berlatih | Input harus super cepat, minim ketikan |
| Orang tua/wali | HP, akses jarang | Cukup read-only, sangat sederhana |

Rentang usia pengguna cukup luas — dari atlet junior (bisa remaja/anak sekolah) hingga pelatih dewasa — sehingga bahasa visual harus ramah untuk semua kalangan, tidak terlalu "kekanakan" tapi juga tidak kaku/korporat.

---

## 5. Prinsip & Tone Desain

**Tone yang diinginkan:** energik namun tetap profesional — mencerminkan semangat olahraga, tapi tetap terasa sebagai alat kerja yang bisa diandalkan, bukan aplikasi hiburan/game.

**Enam prinsip desain yang wajib dipegang** (detail lengkap di PRD UI/UX Bab 4):
1. Kecepatan input di atas segalanya (khususnya untuk atlet).
2. Angka & progres harus terasa nyata secara visual, bukan sekadar tabel.
3. Satu bahasa visual untuk dua kebutuhan berbeda (pelatih vs atlet).
4. Pengguna tidak boleh bingung "hari ini saya harus apa".
5. Ramah untuk pengguna muda & kurang melek teknologi.
6. Desain harus menoleransi data kosong (banyak status awal/atlet baru).

---

## 6. Ruang Lingkup Pekerjaan Desain

Wireframe low-fidelity untuk 10 layar prioritas sudah dibuat bersama tim produk sebagai titik awal (lihat Spesifikasi Wireframe v1.0). Yang dibutuhkan dari tim UI/UX:

1. **Review & penyempurnaan** terhadap 10 wireframe yang sudah ada, termasuk menjawab isu terbuka di tiap layar.
2. **Wireframe untuk 10 layar tersisa** (daftar lengkap di PRD UI/UX Bab 6 & Spesifikasi Wireframe Bab 7) — prioritaskan Daftar/Detail Tim, Rapor Periodik, dan Form Drill.
3. **Desain state tambahan** untuk setiap layar: kosong (empty), gagal (error), perlu perhatian (warning), dan khusus PWA: "tersimpan lokal, menunggu sinkronisasi" (lihat PRD Teknis Bab 3.3).
4. **Desain high-fidelity** untuk kedua breakpoint (desktop & mobile), dimulai dari layar prioritas tertinggi: Beranda Atlet, Sesi Latihan Aktif, Dashboard Pelatih, Program Builder.
5. **Design system/component library** dasar: warna status, tipografi, komponen berulang (stepper angka, kartu drill, badge status, kalender), dan ikonografi kategori materi latihan.
6. **Prototipe interaktif** khusus untuk alur Isi Hasil Latihan dan Program Builder, mengingat frekuensi dan kompleksitasnya.

---

## 7. Referensi & Inspirasi

Aplikasi sejenis di pasar (detail perbandingan di PRD Utama Bab 2.1): **TeamBuildr** (kuat di program fisik), **CoachNow** (kuat di komunikasi & media), **TeamSnap** (kuat di administrasi jadwal). Peluang diferensiasi kita: menggabungkan kekuatan ketiganya dalam satu alur kerja sederhana, dengan bahasa Indonesia yang natural.

Silakan tim desain juga membawa referensi visual dari aplikasi olahraga/fitness lain yang dirasa relevan (mis. Strava, Nike Training Club) sebagai bahan diskusi — terutama untuk cara memvisualisasikan progres dan pencapaian secara memotivasi tanpa terasa "gamifikasi berlebihan".

---

## 8. Batasan Teknis yang Memengaruhi Desain

- Aplikasi dikembangkan sebagai **PWA** — desain perlu mempertimbangkan ikon aplikasi, splash screen, dan mode tampilan standalone (tanpa address bar) saat diinstal ke HP.
- Harus **mobile-first** untuk seluruh layar sisi atlet; **desktop-first namun tetap responsif** untuk layar sisi pelatih yang kompleks (khususnya Program Builder).
- Beberapa layar harus mendukung **mode offline** (data tersimpan sementara di perangkat) — perlu indikator status koneksi yang jelas di UI.
- Tidak ada budget untuk custom illustration/ikon dari nol di tahap MVP — disarankan memakai icon set yang konsisten dan tersedia luas (bukan generate ilustrasi custom per fitur).

---

## 9. Yang TIDAK Termasuk dalam Cakupan Ini (Non-Goals)

- Desain untuk fitur Fase 2/3 (rekomendasi otomatis, integrasi video, dsb) — cukup dipikirkan strukturnya secara kasar, belum perlu didesain detail.
- Branding/logo aplikasi dari nol — akan dibahas terpisah, di luar cakupan brief ini kecuali disepakati lain.

---

## 10. Timeline & Milestone yang Diusulkan

| Milestone | Target |
|---|---|
| Review wireframe yang sudah ada + isu terbuka selesai dibahas | Minggu 1 |
| Wireframe untuk 10 layar tersisa selesai | Minggu 2–3 |
| Design system dasar (warna, tipografi, komponen inti) selesai | Minggu 3 |
| Desain high-fidelity layar prioritas (4 layar utama) selesai | Minggu 4–5 |
| Prototipe interaktif (2 alur kunci) selesai | Minggu 5–6 |
| Handoff ke tim developer | Minggu 6 |

*Timeline ini adalah usulan awal — mohon disesuaikan tim desain berdasarkan kapasitas & ketersediaan.*

---

## 11. Proses Review & Persetujuan

- Review dilakukan bertahap per milestone (bukan menunggu semua selesai), agar arah desain bisa dikoreksi lebih awal.
- Product Owner (pelatih) memberikan persetujuan tertulis (approval) pada setiap milestone sebelum tim desain lanjut ke tahap berikutnya.
- Pertanyaan/kebutuhan klarifikasi soal fitur dapat merujuk langsung ke PRD Utama dan PRD UI/UX; untuk hal yang belum terjawab di sana, silakan diajukan langsung ke Product Owner.

---

## 12. Lampiran: Panduan Teknis Penggunaan Penpot

Tim desain menggunakan **Penpot** sebagai tools utama untuk proyek ini. Berikut alur kerja yang disarankan:

1. **Siapkan workspace Penpot.** Pilih Penpot Cloud (penpot.app, langsung pakai, gratis untuk tim kecil) atau self-hosted lewat Docker bila ingin data desain sepenuhnya di server sendiri. Untuk tim kecil di awal proyek, versi cloud biasanya cukup. Undang anggota tim desain dan beri akses Product Owner sebagai reviewer.

2. **Buat struktur project & file.** Buat satu project untuk aplikasi ini, lalu pisahkan jadi beberapa file — bukan ditumpuk dalam satu file besar: mis. "Design System", "Sisi Pelatih (Desktop)", "Sisi Atlet (Mobile)", dan "Prototipe Alur Kunci". Ini memudahkan navigasi mengingat ada 20+ layar yang perlu dirancang sesuai Spesifikasi Wireframe.

3. **Bangun Design System lebih dulu.** Sebelum menggambar layar, buat file "Design System" berisi warna status (on-track/tertinggal/warning, lihat Bab 6 & PRD UI/UX Bab 12), tipografi, dan Design Tokens native Penpot (dapat diekspor ke format W3C Design Tokens agar langsung dipakai developer). Lalu buat Components dasar dengan variants (state normal/hover/disabled): tombol, stepper angka, badge status, kartu drill, kartu sesi.

4. **Reproduksi wireframe sebagai board awal.** Untuk tiap layar di Spesifikasi Wireframe, buat satu Board sesuai ukuran breakpoint yang relevan (desktop ≥1024px atau mobile ~375px). Gunakan struktur & elemen kunci yang sudah didokumentasikan per layar sebagai acuan tata letak awal, lalu kembangkan jadi high-fidelity memakai komponen dari Design System.

5. **Gunakan Flex/Grid layout untuk struktur responsif.** Penpot memakai CSS Flexbox & Grid asli (bukan sistem auto-layout proprietary), jadi manfaatkan ini untuk board yang perlu menyesuaikan ukuran konten secara otomatis — mis. daftar drill di Program Builder atau kartu metrik di dashboard. Ini membuat hasil desain lebih dekat dengan cara developer akan membangunnya di kode.

6. **Buat prototipe interaktif untuk alur kunci.** Fokuskan prototyping (interactions, flows, transitions) pada dua alur prioritas: Isi Hasil Latihan dan Program Builder (lihat Bab 6, poin 6). Hubungkan antar board dengan trigger (klik tombol → navigasi ke board berikutnya).

7. **Review bertahap bersama Product Owner.** Manfaatkan fitur real-time collaboration & komentar Penpot untuk review per milestone (Bab 10) — bukan menunggu semua desain selesai. Komentar ditandai selesai setelah direvisi.

8. **Handoff ke developer lewat Inspect/Dev Mode.** Setelah desain high-fidelity disetujui, gunakan Inspect Mode untuk memberi developer akses ke CSS yang dihasilkan otomatis, ukuran elemen, jarak (spacing), dan aset yang bisa diekspor langsung. File Penpot berbasis SVG terbuka sehingga developer juga bisa membuka struktur desain secara langsung — memudahkan sinkronisasi dengan WBS Paket 9 (Integrasi Frontend).

**Catatan tambahan:**
- File Penpot berformat SVG terbuka dan bisa disimpan di version control (Git) — bermanfaat bila tim developer ingin melacak perubahan desain seperti melacak perubahan kode.
- Bila tim developer memakai Claude Code, Penpot menyediakan MCP server resmi yang memungkinkan Claude membaca file desain secara terstruktur (bukan menebak dari screenshot) untuk membantu translate desain ke kode — berpotensi mempercepat WBS Paket 9.
- Ekosistem plugin Penpot masih jauh lebih kecil dibanding Figma — bila tim desain terbiasa memakai plugin tertentu di Figma, cek dulu ketersediaan padanannya di Penpot sebelum berkomitmen penuh pada suatu alur kerja.

---

*Design brief ini adalah ringkasan actionable dari PRD Utama dan PRD UI/UX yang lebih lengkap. Untuk detail fitur, alur, dan rasionalisasi tiap keputusan, silakan rujuk kedua dokumen tersebut beserta Spesifikasi Wireframe v1.0.*
