# Spesifikasi Wireframe
## Aplikasi Manajemen Latihan Basket — Personal & Tim

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 16 September 2026 |
| **Diturunkan dari** | PRD Aplikasi Latihan Basket v1.0, PRD untuk Tim UI/UX v1.0 |
| **Status** | Draft — wireframe tahap low-fidelity |

---

## 1. Tujuan Dokumen Ini

Dokumen ini mendokumentasikan wireframe yang telah dirancang sebagai titik awal diskusi antara tim produk dan tim UI/UX, sebelum masuk ke tahap desain high-fidelity. Untuk setiap layar, dijelaskan **tujuan layar**, **elemen kunci**, dan **alasan keputusan desain** — supaya tim desain dapat melanjutkan atau menantang keputusan ini dengan konteks yang jelas, bukan menebak maksud dari gambar saja.

Dokumen ini merujuk pada daftar 24 layar di Bab 6 PRD UI/UX. Enam layar prioritas tertinggi sudah diwireframe di tahap ini; sisanya menyusul pada iterasi berikutnya (lihat Bab 8).

---

## 2. Cakupan Wireframe Tahap Ini

| # | Layar | Peran | Perangkat | Status |
|---|---|---|---|---|
| 1 | Dashboard pelatih | Pelatih | Desktop | Selesai (draft) |
| 2 | Beranda atlet | Atlet | Mobile | Selesai (draft) |
| 3 | Sesi latihan aktif (input hasil) | Atlet | Mobile | Selesai (draft) |
| 4 | Program builder | Pelatih | Desktop | Selesai (draft) |
| 5 | Dashboard statistik individu | Pelatih, Atlet | Desktop | Selesai (draft) |
| 6 | Onboarding & asesmen awal | Atlet | Mobile | Selesai (draft) |
| 7 | Kalender jadwal | Pelatih, Atlet | Desktop | Selesai (draft) |
| 8 | Profil atlet | Pelatih | Desktop | Selesai (draft) |
| 9 | Kehadiran sesi | Pelatih, Asisten | Mobile | Selesai (draft) |
| 10 | Dashboard statistik tim | Pelatih | Desktop | Selesai (draft) |

Kesepuluh layar ini dipilih sebagai prioritas pertama karena mewakili titik kritis dari 5 alur kunci di PRD UI/UX Bab 7 serta dua sisi kompleksitas desain yang berbeda: **desktop data-dense** (pelatih) dan **mobile input-cepat** (atlet/asisten). Kehadiran Sesi dan Dashboard Statistik Tim melengkapi pasangan alur yang sudah ada — Kalender Jadwal → Kehadiran Sesi, dan Statistik Individu → Statistik Tim.

---

## 3. Detail per Layar

### 3.1 Dashboard Pelatih (Desktop)

**Tujuan layar:** Titik masuk utama pelatih — menjawab pertanyaan "apa yang perlu saya perhatikan hari ini?" dalam satu pandangan, tanpa harus membuka banyak halaman.

**Elemen kunci:**
- Sidebar navigasi utama (Dashboard, Tim & Atlet, Program, Statistik, Pesan) — struktur ini mengikuti sitemap sisi pelatih di PRD UI/UX Bab 5.1.
- Kartu ringkasan metrik (atlet aktif, tim berjalan, kepatuhan minggu ini, jumlah yang perlu perhatian) — angka "perlu perhatian" sengaja ditonjolkan warna warning agar langsung terlihat.
- Feed aktivitas terbaru, termasuk notifikasi peringatan beban latihan (terkait modul Load Management di PRD utama Bab 5.2.1).

**Alasan desain:** Kartu metrik diletakkan di atas feed aktivitas supaya pelatih mendapat gambaran kuantitatif dulu sebelum detail naratif — sesuai prinsip desain #2 (angka & progres harus terasa nyata).

**Isu terbuka untuk hi-fi:** Bagaimana perilaku saat pelatih mengelola lebih dari 5 tim sekaligus — apakah dashboard perlu filter/switcher tim di bagian atas?

---

### 3.2 Beranda Atlet (Mobile)

**Tujuan layar:** Titik masuk utama atlet, menjawab pertanyaan yang sama seperti dashboard pelatih tapi dalam skala personal: "apa sesi latihan saya hari ini?"

**Elemen kunci:**
- Kartu "sesi hari ini" ditempatkan paling atas dan paling menonjol (border aksen), dengan satu tombol aksi utama "Mulai latihan" — sesuai prinsip desain #4 (tidak boleh bingung harus apa hari ini).
- Dua metrik ringkas (kepatuhan, satu metrik performa andalan) — sengaja dibatasi 2 agar tidak membebani layar kecil.
- Pesan terbaru dari pelatih ditampilkan ringkas di bawah, bukan di layar terpisah, karena frekuensi cek pesan cukup tinggi namun kontennya singkat.
- Navigasi bawah (bottom nav) dengan 4 ikon — pola standar aplikasi mobile agar mudah dikenali.

**Alasan desain:** Hanya ada **satu** tombol aksi utama di layar ini (Mulai latihan) mengikuti prinsip "satu aksi tunggal per layar" untuk sisi atlet.

**Isu terbuka untuk hi-fi:** Bagaimana tampilan saat atlet punya lebih dari satu sesi di hari yang sama (mis. sesi tim + sesi personal)?

---

### 3.3 Sesi Latihan Aktif — Input Hasil (Mobile)

**Tujuan layar:** Layar dengan frekuensi pemakaian tertinggi di seluruh aplikasi. Tujuannya murni satu: mencatat hasil drill secepat dan seakurat mungkin.

**Elemen kunci:**
- Indikator progres "drill 3 dari 6" dengan progress bar — memberi kepastian berapa lama lagi sesi akan selesai.
- Instruksi drill ringkas (nama, kategori, target) dalam kartu terpisah — tidak digabung dengan area input agar mata tidak berpindah-pindah.
- Input berupa **stepper angka besar** (tombol tambah/kurang), bukan keyboard — sesuai prinsip desain #1 (kecepatan input di atas segalanya), karena atlet mengisi ini sambil masih memegang bola/di tengah latihan.
- Opsi "Lewati drill ini" tetap tersedia tapi ditempatkan lebih kecil/rendah agar tidak jadi pilihan default.

**Alasan desain:** Target keberhasilan eksplisit dari PRD utama adalah pengisian di bawah 1 menit per sesi — layar ini dirancang agar satu drill bisa diisi dalam hitungan detik (dua-tiga tap saja).

**Isu terbuka untuk hi-fi:** Bagaimana pola input untuk drill berbasis **waktu/durasi** (bukan repetisi/angka, mis. drill conditioning) — apakah tetap stepper atau perlu pola timer terpisah?

---

### 3.4 Program Builder (Desktop)

**Tujuan layar:** Tempat pelatih menyusun struktur program (fase → minggu → sesi → drill) dan menariknya dari bank materi latihan.

**Elemen kunci:**
- Layout dua kolom: kolom kiri (lebih besar) untuk struktur program yang sedang disusun, kolom kanan untuk bank materi latihan yang bisa dicari & diseret ke kiri.
- Tab minggu di bagian atas untuk berpindah antar minggu tanpa keluar dari layar.
- Blok "wajib semua" vs blok "individu per posisi" dipisahkan secara visual dengan badge warna berbeda per posisi — ini secara langsung menjawab kebutuhan **program berlapis** dari PRD utama Bab 5.1.3.
- Ikon grip (titik tiga vertikal) pada setiap item drill menandakan bisa diurutkan ulang (drag-and-drop).

**Alasan desain:** Bank materi latihan sengaja ditempatkan selalu terlihat di sisi kanan (bukan modal terpisah) supaya alur "cari drill → seret ke sesi" tidak terputus oleh perpindahan halaman — ini layar dengan kompleksitas tertinggi, jadi meminimalkan jumlah klik/pindah konteks jadi prioritas.

**Isu terbuka untuk hi-fi:** Perlu diuji apakah pola drag-and-drop nyaman dipakai, atau perlu alternatif tombol "+" (tap untuk tambah) sebagai fallback bagi pengguna yang kurang terbiasa drag-and-drop. Juga perlu dirancang versi mobile yang disederhanakan (lihat PRD UI/UX Bab 10).

---

### 3.5 Dashboard Statistik Individu (Desktop)

**Tujuan layar:** Tempat pelatih (dan atlet) melihat progres seorang atlet secara mendalam — jawaban visual dari nilai inti produk "terukur, terencana, menghasilkan progres yang bisa dibuktikan".

**Elemen kunci:**
- Kartu metrik dengan status berlabel teks eksplisit ("mendekati", "on-track", "tertinggal dari target") — bukan hanya warna, sesuai kebutuhan aksesibilitas di PRD UI/UX Bab 11.
- Grafik tren sederhana (bar chart minimalis) untuk satu metrik andalan, dengan trend naik yang terlihat langsung.
- Catatan naratif pelatih untuk siklus berjalan — mengisi kebutuhan Rapor Periodik Berstruktur (PRD utama Bab 5.3.1).
- Tombol "unduh rapor" di kanan atas untuk ekspor PDF (PRD utama Bab 5.3.2).

**Alasan desain:** Tiga metrik pada baris atas sengaja dibatasi 3 kartu agar tidak menjadi dinding angka — metrik lain dapat diakses lewat scroll/tab tambahan, bukan dipadatkan semua di satu layar.

**Isu terbuka untuk hi-fi:** Berapa banyak metrik default yang ditampilkan untuk atlet baru yang datanya masih sedikit (terkait empty state)?

---

### 3.6 Onboarding & Asesmen Awal (Mobile)

**Tujuan layar:** Kesan pertama atlet terhadap aplikasi — mengisi data dasar lalu menjalani tes asesmen awal (PRD utama Bab 5.1.4) sebelum masuk ke program.

**Elemen kunci:**
- Indikator langkah ("Langkah 3 dari 4") berupa progress bar segmented di bagian atas — memberi kepastian berapa lama proses onboarding akan berlangsung.
- Satu tes per layar (bukan form panjang) — contoh di wireframe adalah tes free throw dengan instruksi singkat dan ikon ilustratif.
- Pola input sama seperti layar Sesi Latihan Aktif (stepper angka) — konsistensi ini disengaja, supaya atlet sudah "terlatih" memakai pola input yang sama sejak awal.
- Tombol "Kembali" tetap tersedia untuk koreksi tanpa mengulang dari awal.

**Alasan desain:** Wizard bertahap dipilih dibanding form panjang karena target pengguna termasuk atlet muda dengan literasi digital lebih rendah (PRD UI/UX Bab 3) — satu tugas jelas per layar mengurangi risiko bingung/berhenti di tengah jalan.

**Isu terbuka untuk hi-fi:** Bagaimana alur ini berubah jika diisi oleh orang tua/wali untuk atlet yang masih sangat muda, bukan oleh atlet itu sendiri?

---

### 3.7 Kalender Jadwal (Desktop)

**Tujuan layar:** Menyatukan semua jadwal — sesi tim maupun personal — dalam satu tampilan, menjawab masalah utama di PRD utama Bab 2 (jadwal tersebar di banyak platform).

**Elemen kunci:**
- Tampilan mingguan sebagai default (dengan opsi beralih ke bulanan) — mingguan dipilih sebagai default karena ini rentang waktu paling relevan untuk perencanaan latihan sehari-hari.
- Setiap sesi diberi warna berbeda antara **sesi tim** (biru) dan **sesi personal** (ungu) — konsisten dengan kebutuhan membedakan program berlapis di Bab 3.4.
- Sesi hari ini/mendatang yang relevan bagi pengguna yang login ditandai dengan border aksen agar langsung terlihat.
- Legenda warna eksplisit ditampilkan di bagian bawah, bukan mengandalkan asumsi pengguna mengenali warna — sesuai kebutuhan aksesibilitas PRD UI/UX Bab 11.

**Alasan desain:** Kalender ini dirancang sebagai tampilan bersama pelatih & atlet (bukan dua layar terpisah) supaya sumber data jadwal benar-benar satu — menghindari duplikasi yang menyebabkan masalah "jadwal tersebar" yang justru ingin diselesaikan aplikasi ini.

**Isu terbuka untuk hi-fi:** Bagaimana kalender menampilkan sesi yang sudah lewat dan belum diisi hasilnya (butuh indikator visual berbeda dari sesi mendatang)? Juga perlu dirancang versi mobile yang lebih ringkas (kemungkinan daftar harian, bukan grid mingguan penuh).

---

### 3.8 Profil Atlet (Desktop)

**Tujuan layar:** Satu tempat bagi pelatih melihat gambaran lengkap seorang atlet — data dasar, baseline asesmen, dan indikator kesiapan/beban latihan — sebelum mengambil keputusan terkait program atlet tersebut.

**Elemen kunci:**
- Header profil dengan status kesiapan yang menonjol (badge "Latihan penuh/Terbatas/Istirahat") tepat di sebelah nama — ini data yang paling sering perlu dicek cepat oleh pelatih sebelum menyusun sesi (PRD utama Bab 5.2.1).
- Navigasi tab (Ringkasan, Program aktif, Riwayat cedera, Asesmen) memisahkan informasi padat menjadi bagian yang bisa diakses sesuai kebutuhan, bukan ditumpuk semua di satu scroll panjang.
- Kartu "Baseline asesmen awal" ditampilkan berdampingan dengan data dasar — mengingatkan pelatih bahwa baseline ini adalah acuan pembanding progres (PRD utama Bab 5.1.4).
- Grafik beban latihan dengan peringatan eksplisit saat ada lonjakan — implementasi langsung dari kebutuhan peringatan otomatis Load Management, ditampilkan bukan sebagai popup mengagetkan, melainkan grafik dengan catatan tenang di bawahnya.

**Alasan desain:** Status kesiapan sengaja ditempatkan di header (bukan di dalam tab) karena ini informasi yang harus terlihat sekilas tanpa harus mengklik apa pun — konsisten dengan prinsip "tidak boleh bingung harus apa" yang di sini bermakna "pelatih tidak boleh salah menyusun sesi untuk atlet yang sedang cedera".

**Isu terbuka untuk hi-fi:** Riwayat cedera memuat data sensitif — perlu didiskusikan dengan tim apakah tab ini perlu pembatasan akses tambahan (mis. tidak semua asisten pelatih bisa melihatnya), terkait kebutuhan role-based access di PRD utama Bab 7.

---

### 3.9 Kehadiran Sesi (Mobile)

**Tujuan layar:** Memudahkan pelatih/asisten menandai kehadiran seluruh roster dalam waktu singkat, langsung dari lapangan sebelum atau saat sesi berlangsung.

**Elemen kunci:**
- Ringkasan angka (Hadir/Terlambat/Absen) di bagian atas — memberi gambaran cepat sebelum menelusuri daftar satu per satu.
- Setiap pemain punya tiga tombol bulat sejajar (Hadir/Terlambat/Absen) yang bisa ditekan langsung — tanpa perlu membuka dropdown atau layar detail per pemain.
- Status yang sudah dipilih diberi warna solid + ikon (bukan hanya warna) agar konsisten dengan kebutuhan aksesibilitas.
- Tombol simpan tunggal di bagian bawah untuk mengonfirmasi seluruh kehadiran sekaligus.

**Alasan desain:** Pola tiga-tombol-sejajar dipilih dibanding toggle/dropdown karena ini perlu dilakukan cepat untuk banyak pemain sekaligus (mis. 20 pemain dalam hitungan detik) — konsisten dengan prinsip desain #1 (kecepatan input di atas segalanya), yang di layar ini berlaku juga untuk pelatih/asisten, bukan hanya atlet.

**Isu terbuka untuk hi-fi:** Apakah kehadiran perlu terhubung otomatis dengan status "Latihan Terbatas/Istirahat" di Profil Atlet (mis. absen karena cedera vs absen biasa perlu dibedakan)?

---

### 3.10 Dashboard Statistik Tim (Desktop)

**Tujuan layar:** Memberi pelatih gambaran performa kolektif tim, sekaligus menyorot pemain mana yang butuh perhatian lebih — pelengkap dari Dashboard Statistik Individu (Bab 3.5) pada level agregat.

**Elemen kunci:**
- Tiga kartu metrik ringkas di atas (rata-rata kehadiran, penyelesaian program, jumlah pemain perlu perhatian) — pola yang sama dengan Dashboard Pelatih (Bab 3.1) untuk konsistensi visual antar dashboard.
- Grafik bar horizontal perbandingan pemain pada satu metrik terpilih (dicontohkan free throw %) — bar horizontal dipilih karena lebih mudah membaca banyak nama pemain sekaligus dibanding bar vertikal.
- Daftar "pemain perlu perhatian" di bagian bawah, masing-masing bisa diklik untuk masuk ke Profil Atlet terkait — menghubungkan langsung ke Bab 3.8 tanpa pelatih perlu mencari manual.

**Alasan desain:** Bar perbandingan sengaja hanya menampilkan satu metrik pada satu waktu (bukan multi-metrik sekaligus) agar tidak menjadi tabel padat yang sulit dibaca sekilas — pelatih dapat beralih metrik lewat kontrol yang belum digambarkan di wireframe ini (lihat isu terbuka).

**Isu terbuka untuk hi-fi:** Perlu ditambahkan kontrol untuk memilih metrik pembanding (dropdown/tab), karena wireframe ini baru menampilkan satu metrik contoh. Juga perlu dipikirkan bagaimana tampilan untuk tim dengan jumlah pemain sangat banyak (lebih dari 20) agar grafik perbandingan tidak menjadi terlalu panjang.

---

## 4. Pola Desain yang Konsisten Lintas Layar

Beberapa keputusan desain sengaja diulang di berbagai layar sebagai fondasi konsistensi sebelum masuk ke design system formal:

- **Stepper angka besar** untuk semua input hasil bernilai numerik (dipakai di Sesi Latihan Aktif & Asesmen Awal).
- **Badge status berlabel teks**, bukan warna saja, untuk semua indikator on-track/tertinggal/warning.
- **Satu aksi utama per layar** pada sisi atlet (mobile), berbeda dari sisi pelatih (desktop) yang boleh punya beberapa aksi sejajar.
- **Progress indicator** (bar atau "x dari y") untuk setiap alur bertahap (sesi latihan, onboarding).

---

## 5. Kesesuaian dengan PRD UI/UX

| Prinsip Desain (PRD UI/UX Bab 4) | Terlihat di Layar |
|---|---|
| Kecepatan input di atas segalanya | Sesi Latihan Aktif, Asesmen Awal |
| Angka & progres terasa nyata | Dashboard Pelatih, Dashboard Statistik |
| Satu bahasa visual, dua kebutuhan berbeda | Seluruh 6 layar (kontras desktop vs mobile) |
| Tidak bingung "hari ini harus apa" | Dashboard Pelatih, Beranda Atlet |
| Ramah pengguna muda & kurang teknis | Onboarding & Asesmen Awal |
| Menoleransi data kosong | Belum tercermin — lihat Bab 6 (catatan) |

---

## 6. Catatan: Yang Belum Tercakup di Wireframe Tahap Ini

Sesuai kebutuhan state di PRD UI/UX Bab 8, wireframe tahap ini baru menampilkan **kondisi ideal/terisi penuh** (happy path). Belum tercakup:

- Tampilan **empty state** (mis. atlet baru belum punya data progres, tim baru belum punya program).
- Tampilan **error** (khususnya saat submit hasil latihan gagal karena koneksi).
- Tampilan **warning** detail untuk status kesiapan atlet (Load Management).
- Versi **mobile** dari Program Builder dan Dashboard Statistik.

Ini disarankan menjadi fokus iterasi wireframe berikutnya sebelum masuk ke desain high-fidelity.

---

## 7. Layar yang Belum Diwireframe

Merujuk ke 24 layar di PRD UI/UX Bab 6, berikut yang masih tersisa untuk iterasi berikutnya, dikelompokkan berdasarkan urutan kebutuhan alur kerja:

- Daftar & detail tim/roster
- Bank materi latihan — tampilan mandiri (di luar konteks builder)
- Detail/form drill (buat & edit drill)
- Timeline periodisasi musim
- Rapor periodik (tampilan lengkap & generate)
- Halaman berbagi rapor untuk orang tua/wali
- Pengumuman/broadcast
- Komentar per sesi latihan
- Pengaturan akun & kelola akses
- Rekomendasi otomatis (Fase 2)

---

## 8. Langkah Selanjutnya

1. Review bersama tim UI/UX terhadap 6 wireframe ini — khususnya isu terbuka yang tercantum di tiap layar (Bab 3).
2. Lanjutkan wireframe untuk layar prioritas berikutnya (Bab 7), terutama Kalender Jadwal dan Profil Atlet karena sering dirujuk dari layar yang sudah ada.
3. Rancang state tambahan (empty/error/warning) untuk 6 layar yang sudah ada (Bab 6) sebelum masuk high-fidelity.
4. Mulai penyusunan design system formal (komponen, warna status, ikonografi) berdasarkan pola yang sudah konsisten muncul (Bab 4).

---

*Dokumen ini adalah pendamping visual dari PRD UI/UX v1.0. Gambar wireframe aktual dibagikan terpisah di percakapan/sesi desain bersama tim produk.*
