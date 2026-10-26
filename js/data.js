/* ============================================================
   data.js — Data simulasi + logika hitung ketersediaan
   Meniru tabel: barang, pesanan, hold_stok, blokir_ketersediaan
   (Proposal Bab III, Tabel 3.1). Unit kosong TIDAK disimpan,
   melainkan dihitung: total_stok - (pesanan + hold + blokir).
   ============================================================ */

const MENIT_HOLD = 15;

/* ---------- Util tanggal & format ---------- */
function fmtISO(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function tambahHari(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return fmtISO(d);
}
function daftarHari(mulai, selesai) {
  const hasil = [];
  const d = new Date(mulai + 'T00:00:00');
  const akhir = new Date(selesai + 'T00:00:00');
  while (d <= akhir) { hasil.push(fmtISO(d)); d.setDate(d.getDate() + 1); }
  return hasil;
}
function hitungDurasi(mulai, selesai) {      // inklusif: 1 hari bila mulai = selesai
  if (!mulai || !selesai || selesai < mulai) return 0;
  return daftarHari(mulai, selesai).length;
}
function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }
function fmtTanggal(iso) {
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}

/* ---------- Data master ---------- */
const KATEGORI = [
  { id: 1, nama: 'Outdoor',    kelas: 'cat-outdoor' },
  { id: 2, nama: 'Fotografi',  kelas: 'cat-fotografi' },
  { id: 3, nama: 'Elektronik', kelas: 'cat-elektronik' },
  { id: 4, nama: 'Olahraga',   kelas: 'cat-olahraga' },
  { id: 5, nama: 'Acara',      kelas: 'cat-acara' }
];

const BARANG = [
  { id: 1, nama: 'Tenda Camping 4 Orang', id_kategori: 1, harga: 50000,  total: 5,  toko: 'Rimba Gear',      kota: 'Surabaya', emoji: '⛺', deskripsi: 'Tenda dome 4 orang, double layer, anti air. Sudah termasuk flysheet dan pasak.' },
  { id: 2, nama: 'Kamera Mirrorless',     id_kategori: 2, harga: 150000, total: 2,  toko: 'Lensa Kita',      kota: 'Sidoarjo', emoji: '📷', deskripsi: 'Mirrorless 24MP + lensa kit 18–55mm, 2 baterai, dan kartu memori 64GB.' },
  { id: 3, nama: 'Proyektor Full HD',     id_kategori: 3, harga: 100000, total: 3,  toko: 'Elektra Rental',  kota: 'Surabaya', emoji: '📽️', deskripsi: 'Proyektor 3500 lumens, HDMI/VGA, termasuk kabel dan remote.' },
  { id: 4, nama: 'Sepeda Gunung 27.5"',   id_kategori: 4, harga: 75000,  total: 4,  toko: 'Gowes Jaya',      kota: 'Gresik',   emoji: '🚲', deskripsi: 'Sepeda MTB 21 speed, rem cakram, ukuran frame M. Helm disediakan.' },
  { id: 5, nama: 'Speaker Portable 200W', id_kategori: 3, harga: 120000, total: 2,  toko: 'Elektra Rental',  kota: 'Surabaya', emoji: '🔊', deskripsi: 'Speaker bluetooth dengan 2 mikrofon wireless, cocok untuk acara outdoor.' },
  { id: 6, nama: 'Carrier 60L',           id_kategori: 1, harga: 40000,  total: 6,  toko: 'Rimba Gear',      kota: 'Surabaya', emoji: '🎒', deskripsi: 'Tas gunung 60 liter dengan rain cover dan back system nyaman.' },
  { id: 7, nama: 'Gimbal 3-Axis',         id_kategori: 2, harga: 90000,  total: 2,  toko: 'Lensa Kita',      kota: 'Sidoarjo', emoji: '🎥', deskripsi: 'Gimbal stabilizer untuk ponsel dan kamera ringan, baterai tahan 12 jam.' },
  { id: 8, nama: 'Kursi Lipat Event',     id_kategori: 5, harga: 5000,   total: 40, toko: 'Pesta Mudah',     kota: 'Gresik',   emoji: '🪑', deskripsi: 'Kursi lipat besi, harga per unit per hari. Cocok untuk hajatan dan rapat.' }
];

function getBarang(id) { return BARANG.find(b => b.id === Number(id)); }
function getKategori(id) { return KATEGORI.find(k => k.id === Number(id)); }

/* ---------- Data simulasi reservasi (relatif terhadap hari ini) ---------- */
// tipe: 'pesanan' (reservasi aktif) | 'blokir' (dipakai di luar website)
const RESERVASI = [
  { id_barang: 1, mulai: tambahHari(1),  selesai: tambahHari(3),  jumlah: 2, tipe: 'pesanan' },
  { id_barang: 1, mulai: tambahHari(2),  selesai: tambahHari(5),  jumlah: 2, tipe: 'pesanan' },
  { id_barang: 1, mulai: tambahHari(3),  selesai: tambahHari(4),  jumlah: 1, tipe: 'blokir'  },
  { id_barang: 2, mulai: tambahHari(0),  selesai: tambahHari(4),  jumlah: 1, tipe: 'pesanan' },
  { id_barang: 2, mulai: tambahHari(6),  selesai: tambahHari(8),  jumlah: 2, tipe: 'pesanan' },
  { id_barang: 3, mulai: tambahHari(2),  selesai: tambahHari(2),  jumlah: 3, tipe: 'pesanan' },
  { id_barang: 4, mulai: tambahHari(1),  selesai: tambahHari(7),  jumlah: 3, tipe: 'pesanan' },
  { id_barang: 4, mulai: tambahHari(5),  selesai: tambahHari(6),  jumlah: 1, tipe: 'blokir'  },
  { id_barang: 5, mulai: tambahHari(1),  selesai: tambahHari(2),  jumlah: 2, tipe: 'pesanan' },
  { id_barang: 6, mulai: tambahHari(0),  selesai: tambahHari(2),  jumlah: 4, tipe: 'pesanan' },
  { id_barang: 7, mulai: tambahHari(3),  selesai: tambahHari(9),  jumlah: 1, tipe: 'blokir'  },
  { id_barang: 8, mulai: tambahHari(1),  selesai: tambahHari(1),  jumlah: 35, tipe: 'pesanan' }
];

/* ---------- Hold milik pengguna di sesi ini (tabel hold_stok) ---------- */
const HOLD = [];
let hitungId = 1;

function holdAktif() {
  const sekarang = Date.now();
  return HOLD.filter(h => h.kadaluarsa > sekarang);
}
function bersihkanHoldKadaluarsa() {   // mengembalikan true bila ada yang dilepas
  const sebelum = HOLD.length;
  const sekarang = Date.now();
  for (let i = HOLD.length - 1; i >= 0; i--) {
    if (HOLD[i].kadaluarsa <= sekarang) HOLD.splice(i, 1);
  }
  return HOLD.length !== sebelum;
}
function buatHold(id_barang, mulai, selesai, jumlah) {
  const h = {
    id: hitungId++, id_barang: Number(id_barang), mulai, selesai, jumlah: Number(jumlah),
    kadaluarsa: Date.now() + MENIT_HOLD * 60 * 1000, tipe: 'hold'
  };
  HOLD.push(h);
  return h;
}
function lepasHold(id) {
  const i = HOLD.findIndex(h => h.id === Number(id));
  if (i >= 0) HOLD.splice(i, 1);
}
function getHold(id) { return HOLD.find(h => h.id === Number(id)); }

/* ---------- Inti: hitung unit terpakai & tersedia ---------- */
// Unit terpakai pada satu hari tertentu, dirinci per jenis
function pakaiPadaHari(id_barang, tgl, excludeHoldId) {
  const r = { pesanan: 0, hold: 0, blokir: 0 };
  RESERVASI.forEach(x => {
    if (x.id_barang === Number(id_barang) && x.mulai <= tgl && tgl <= x.selesai) r[x.tipe] += x.jumlah;
  });
  holdAktif().forEach(h => {
    if (h.id_barang === Number(id_barang) && h.id !== Number(excludeHoldId) && h.mulai <= tgl && tgl <= h.selesai) r.hold += h.jumlah;
  });
  return r;
}

// Unit kosong untuk rentang [mulai, selesai]: diambil dari hari TERPADAT,
// sebab unit yang sama harus tersedia di setiap hari selama masa sewa.
function hitungTersedia(id_barang, mulai, selesai, excludeHoldId) {
  const b = getBarang(id_barang);
  let min = b.total, puncak = { pesanan: 0, hold: 0, blokir: 0 };
  daftarHari(mulai, selesai).forEach(tgl => {
    const u = pakaiPadaHari(id_barang, tgl, excludeHoldId);
    const sisa = b.total - (u.pesanan + u.hold + u.blokir);
    if (sisa < min) { min = sisa; puncak = u; }
  });
  return { tersedia: Math.max(0, min), total: b.total, rincian: puncak };
}

// Menyimpan pengajuan sewa sebagai reservasi (menunggu keputusan penyedia)
function simpanPesanan(id_barang, mulai, selesai, jumlah) {
  RESERVASI.push({ id_barang: Number(id_barang), mulai, selesai, jumlah: Number(jumlah), tipe: 'pesanan' });
}
