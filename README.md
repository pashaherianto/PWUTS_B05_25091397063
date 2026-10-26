# PWUTS_B05_25091397063 — SewaIn: Website Penyewaan Barang

Tugas UTS **Pemrograman Web Lanjut** — Prodi D4 Manajemen Informatika, Fakultas Vokasi, Universitas Negeri Surabaya.
Topik mengikuti proposal kelompok 5: *Sistem Informasi Penyewaan Barang dengan Reservasi dan Pengelolaan Ketersediaan Stok Berbasis Web*.

- **Nama:** Muhammad Pasha Herianto
- **NIM:** 25091397063
- **Kelompok:** 5

## Cara menjalankan

Navigasi memakai Ajax (`jQuery .load()`), sehingga **harus dibuka lewat server HTTP**, bukan klik ganda `index.html` (`file://`).


1. **Laragon** — salin folder ini ke `htdocs` / `www`, buka `http://localhost/PWUTS_B05_25091397063/`.
2. **GitHub Pages** — aktifkan di pengaturan repository, lalu buka URL Pages-nya.

Perlu koneksi internet saat pertama dibuka, karena Bootstrap 5 dan jQuery dimuat dari CDN.

## Struktur folder

```
PWUTS_B05_25091397063/
├── index.html            ← 2.a Homepage / layout utama (navbar, hero, footer)
├── css/style.css         ← gaya kustom + responsive
├── js/
│   ├── main.js           ← router Ajax (jQuery .load) + animasi beranda
│   ├── data.js           ← data simulasi + fungsi hitung ketersediaan
│   ├── katalog.js        ← logika halaman 2.b
│   └── form.js           ← logika & validasi halaman 2.c
├── pages/
│   ├── katalog.html      ← 2.b Katalog & cek ketersediaan (interaktif/simulasi)
│   └── form-sewa.html    ← 2.c Form pengajuan sewa + validasi
└── README.md
```

## Pemenuhan ketentuan tugas

### 2.a Homepage (`index.html`)
- Layout utama dengan Bootstrap 5: navbar yang menciut jadi tombol menu di layar kecil, hero, statistik, langkah kerja, fitur, dan footer. Responsif lewat grid Bootstrap dan media query di `style.css`.
- Menu *Katalog & Cek Ketersediaan* dan *Form Pengajuan Sewa* memuat halaman ke `#konten` **tanpa reload** (`$('#konten').load(...)`), dengan indikator loading, penanganan error, penanda menu aktif, dan dukungan tombol Back/Forward lewat hash URL.
- Gambar/ikon memakai emoji dan gradasi CSS, jadi tidak ada ketergantungan file gambar.

### 2.b Halaman interaktif — Katalog & simulasi ketersediaan (`pages/katalog.html`)
Menerapkan inti proposal: **unit kosong tidak disimpan, tetapi dihitung**.
- Cari, filter kategori, dan urutkan (nama, harga, unit kosong terbanyak).
- Pilih tanggal mulai/selesai dan jumlah → setiap barang langsung menampilkan unit kosong pada periode itu.
- Rumus: `unit kosong = total_stok − (pesanan + hold + blokir)` pada **hari terpadat** dalam periode, agar unit yang sama tersedia sepanjang masa sewa. Ini menjawab rumusan masalah no. 2 dan 3 (tidak ada pesanan ganda pada tanggal beririsan).
- **Hold 15 menit**: tombol *Tahan unit* menahan stok dengan penghitung mundur; unit dilepas otomatis saat kedaluwarsa atau bila dilepas manual.
- Detail barang menampilkan grafik batang unit kosong 14 hari ke depan beserta rincian pesanan/hold/blokir.
- Data awal (`RESERVASI` di `js/data.js`) disimulasikan relatif terhadap hari ini, sehingga demo selalu punya contoh unit yang terpakai.

### 2.c Form transaksi — Pengajuan sewa (`pages/form-sewa.html`)
Field mengikuti tabel `pesanan` pada Tabel 3.1 proposal (pemesan, `id_barang`, `tgl_mulai`, `tgl_selesai`, `jumlah`, `total_harga`, `status_pesanan`).

Validasi JavaScript/jQuery sebelum submit:

| Field | Aturan |
|---|---|
| Nama | wajib, minimal 3 karakter, hanya huruf/spasi/titik/tanda hubung |
| Email | wajib, format email valid |
| No. HP | wajib, format Indonesia `08xx…` / `+628xx…`, 10–13 digit |
| Barang | wajib dipilih |
| Tanggal mulai | wajib, tidak boleh sebelum hari ini |
| Tanggal selesai | wajib, tidak boleh sebelum tanggal mulai, maksimal 30 hari |
| Jumlah | wajib, bilangan bulat ≥ 1, tidak boleh melebihi unit kosong pada periode |
| Catatan | opsional, maksimal 200 karakter (dengan penghitung) |
| Persetujuan | wajib dicentang |

- Pesan error tampil per field (gaya `is-invalid` Bootstrap), divalidasi saat mengisi, saat keluar field, dan saat submit; fokus pindah ke field pertama yang salah.
- Ringkasan pesanan dan **total harga dihitung otomatis**: `harga × jumlah × durasi hari` (durasi inklusif).
- Bila dibuka dari tombol *Ajukan sewa* di panel hold, data terisi otomatis dan sisa waktu hold ditampilkan.
- Setelah valid, data dikirim lewat `$.post` ke `proses/simpan_pesanan.php` bila `KIRIM_KE_SERVER = true` di `js/form.js`. Karena backend PHP/MySQL belum menjadi bagian UTS ini, nilai default-nya `false` (mode simulasi): sistem menampilkan kode pesanan dan data yang akan dikirim, serta mencatat pesanan ke data simulasi sehingga stok di katalog ikut berkurang.

## Catatan

- Data bersifat simulasi di memori browser; refresh halaman mengembalikan data ke kondisi awal.
- Backend (PHP + MySQL, 12 tabel pada proposal) akan dikerjakan pada tahap berikutnya; struktur data di `data.js` sengaja meniru tabel `barang`, `pesanan`, `hold_stok`, dan `blokir_ketersediaan`.
- Halaman 2.b (katalog & simulasi ketersediaan) dan 2.c (form pengajuan sewa) dipilih agar berbeda dari halaman anggota kelompok lain sesuai ketentuan 2.d. Fitur lain dari proposal yang dapat dipakai anggota lain: verifikasi toko, blokir ketersediaan, konfirmasi pembayaran, serah terima/pengembalian.

## Cara mengunggah ke GitHub

Folder harus bernama `PW_<kode_kelompok>_<nim>` dan berada di repository akun GitHub masing-masing:

```bash
git add PWUTS_B05_25091397063
git commit -m "UTS Pemrograman Web Lanjut"
git push
```

Hasil dapat diakses di `https://github.com/<id-github>/PWUTS_B05_25091397063`. 
