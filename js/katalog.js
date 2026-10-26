/* ============================================================
   katalog.js — Halaman 2.b: katalog interaktif + simulasi
   ketersediaan unit dan hold 15 menit (jQuery)
   ============================================================ */

window.stateKatalog = window.stateKatalog || null;

function initKatalog() {
  clearInterval(window.timerHold);

  if (!window.stateKatalog) {
    window.stateKatalog = { mulai: tambahHari(1), selesai: tambahHari(3), jumlah: 1 };
  }
  const st = window.stateKatalog;

  // Isi opsi kategori
  KATEGORI.forEach(k => $('#fKategori').append('<option value="' + k.id + '">' + k.nama + '</option>'));

  // Nilai awal filter
  $('#fMulai').val(st.mulai).attr('min', tambahHari(0));
  $('#fSelesai').val(st.selesai).attr('min', tambahHari(0));
  $('#fJumlah').val(st.jumlah);

  $('#formFilter').on('submit', e => e.preventDefault());
  $('#fCari, #fKategori, #fMulai, #fSelesai, #fJumlah, #fUrut').on('input change', function () {
    if (this.id === 'fMulai' && $('#fSelesai').val() && $('#fSelesai').val() < $(this).val()) {
      $('#fSelesai').val($(this).val());
    }
    renderDaftar();
  });

  // Aksi pada kartu (delegasi)
  $('#daftarBarang').on('click', '.btn-detail', function () { bukaDetail($(this).data('id')); });
  $('#daftarBarang').on('click', '.btn-hold', function () { tahanUnit($(this).data('id')); });

  // Aksi pada panel hold
  $('#panelHold').on('click', '.btn-lanjut', function () {
    const h = getHold($(this).data('id'));
    if (!h) return;
    window.prefill = { id_barang: h.id_barang, mulai: h.mulai, selesai: h.selesai, jumlah: h.jumlah, holdId: h.id };
    navigasi('sewa');
  });
  $('#panelHold').on('click', '.btn-lepas', function () {
    lepasHold($(this).data('id'));
    renderHold(); renderDaftar();
    tampilPesan('Unit dilepas dan tersedia kembali untuk pelanggan lain.', 'info');
  });

  // Penghitung mundur hold, jalan tiap detik
  window.timerHold = setInterval(function () {
    if (!$('#daftarBarang').length) { clearInterval(window.timerHold); return; }
    const berubah = bersihkanHoldKadaluarsa();
    renderHold();
    if (berubah) { renderDaftar(); tampilPesan('Sebuah penahanan kedaluwarsa dan unitnya dilepas otomatis.', 'warning'); }
  }, 1000);

  renderDaftar();
  renderHold();
}

function bacaFilter() {
  return {
    q: $('#fCari').val().trim().toLowerCase(),
    kat: $('#fKategori').val(),
    mulai: $('#fMulai').val(),
    selesai: $('#fSelesai').val(),
    jumlah: Math.max(1, parseInt($('#fJumlah').val(), 10) || 1),
    urut: $('#fUrut').val()
  };
}

function tampilPesan(teks, jenis) {
  const $p = $('#pesanKatalog');
  $p.removeClass('d-none alert-success alert-info alert-warning alert-danger').addClass('alert-' + jenis).text(teks);
  clearTimeout(window.timerPesan);
  window.timerPesan = setTimeout(() => $p.addClass('d-none'), 4000);
}

function renderDaftar() {
  const f = bacaFilter();
  const $w = $('#peringatanTanggal');

  if (!f.mulai || !f.selesai || f.selesai < f.mulai) {
    $w.removeClass('d-none').text('Tanggal belum valid: tanggal selesai tidak boleh sebelum tanggal mulai.');
    $('#daftarBarang').empty();
    return;
  }
  if (f.mulai < tambahHari(0)) {
    $w.removeClass('d-none').text('Tanggal mulai tidak boleh sebelum hari ini.');
    $('#daftarBarang').empty();
    return;
  }
  $w.addClass('d-none');

  window.stateKatalog = { mulai: f.mulai, selesai: f.selesai, jumlah: f.jumlah };
  const durasi = hitungDurasi(f.mulai, f.selesai);
  $('#infoPeriode').html('Periode <strong>' + fmtTanggal(f.mulai) + ' – ' + fmtTanggal(f.selesai) + '</strong> (' + durasi + ' hari), jumlah diminta <strong>' + f.jumlah + '</strong> unit. Unit kosong = total unit − (dipesan + ditahan + diblokir) pada hari terpadat dalam periode.');

  let hasil = BARANG
    .filter(b => (!f.kat || b.id_kategori === Number(f.kat)) &&
                 (!f.q || (b.nama + ' ' + b.toko).toLowerCase().includes(f.q)))
    .map(b => ({ b: b, h: hitungTersedia(b.id, f.mulai, f.selesai) }));

  hasil.sort(function (x, y) {
    if (f.urut === 'harga-asc') return x.b.harga - y.b.harga;
    if (f.urut === 'harga-desc') return y.b.harga - x.b.harga;
    if (f.urut === 'tersedia') return y.h.tersedia - x.h.tersedia;
    return x.b.nama.localeCompare(y.b.nama);
  });

  if (!hasil.length) {
    $('#daftarBarang').html('<div class="col-12"><div class="alert alert-secondary">Tidak ada barang yang cocok dengan pencarian.</div></div>');
    return;
  }

  const html = hasil.map(function (r) {
    const b = r.b, h = r.h, kat = getKategori(b.id_kategori);
    const cukup = h.tersedia >= f.jumlah;
    const persen = Math.round(h.tersedia / h.total * 100);
    let badge, warna;
    if (h.tersedia === 0) { badge = 'Habis'; warna = 'bad'; }
    else if (!cukup) { badge = 'Kurang (' + h.tersedia + ' unit)'; warna = 'warn'; }
    else { badge = 'Tersedia ' + h.tersedia + ' unit'; warna = 'ok'; }
    const bg = { ok: 'bg-success', warn: 'bg-warning text-dark', bad: 'bg-danger' }[warna];
    const warnaBar = { ok: 'var(--c-ok)', warn: 'var(--c-warn)', bad: 'var(--c-bad)' }[warna];

    return '<div class="col-sm-6 col-xl-4"><div class="card item-card h-100">' +
      '<div class="item-thumb ' + kat.kelas + '" aria-hidden="true">' + b.emoji + '</div>' +
      '<div class="card-body d-flex flex-column">' +
        '<div class="d-flex justify-content-between align-items-start gap-2 mb-1">' +
          '<h2 class="h6 fw-bold mb-0">' + b.nama + '</h2>' +
          '<span class="badge ' + bg + '">' + badge + '</span></div>' +
        '<div class="small text-muted mb-2">' + kat.nama + ' • ' + b.toko + ', ' + b.kota + '</div>' +
        '<div class="fw-semibold mb-2">' + rupiah(b.harga) + ' <span class="text-muted fw-normal small">/ hari</span></div>' +
        '<div class="stok-bar mb-1" title="' + h.tersedia + ' dari ' + h.total + ' unit kosong"><div style="width:' + persen + '%;background:' + warnaBar + '"></div></div>' +
        '<div class="small text-muted mb-3">' + h.tersedia + ' dari ' + h.total + ' unit kosong</div>' +
        '<div class="mt-auto d-flex gap-2">' +
          '<button type="button" class="btn btn-outline-secondary btn-sm btn-detail flex-fill" data-id="' + b.id + '">Detail</button>' +
          '<button type="button" class="btn btn-success btn-sm btn-hold flex-fill" data-id="' + b.id + '"' + (cukup ? '' : ' disabled') + '>Tahan ' + f.jumlah + ' unit</button>' +
        '</div>' +
      '</div></div></div>';
  }).join('');

  $('#daftarBarang').html(html);
}

function tahanUnit(id) {
  const f = bacaFilter();
  const cek = hitungTersedia(id, f.mulai, f.selesai);
  if (cek.tersedia < f.jumlah) {
    tampilPesan('Unit tidak cukup lagi pada periode ini. Ubah tanggal atau jumlah.', 'danger');
    renderDaftar();
    return;
  }
  const h = buatHold(id, f.mulai, f.selesai, f.jumlah);
  tampilPesan(f.jumlah + ' unit ' + getBarang(id).nama + ' ditahan selama ' + MENIT_HOLD + ' menit.', 'success');
  renderDaftar();
  renderHold();
  return h;
}

function fmtMenit(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function renderHold() {
  const aktif = holdAktif();
  if (!aktif.length) {
    $('#panelHold').html('<p class="small text-muted mb-0">Belum ada unit yang ditahan. Klik <em>Tahan unit</em> pada salah satu barang.</p>');
    return;
  }
  $('#panelHold').html(aktif.map(function (h) {
    const b = getBarang(h.id_barang);
    return '<div class="hold-item mb-2">' +
      '<div class="fw-semibold small">' + b.emoji + ' ' + b.nama + '</div>' +
      '<div class="small text-muted">' + h.jumlah + ' unit • ' + fmtTanggal(h.mulai) + ' – ' + fmtTanggal(h.selesai) + '</div>' +
      '<div class="small">Sisa waktu: <span class="countdown">' + fmtMenit(h.kadaluarsa - Date.now()) + '</span></div>' +
      '<div class="d-flex gap-2 mt-2">' +
        '<button type="button" class="btn btn-warning btn-sm btn-lanjut flex-fill" data-id="' + h.id + '">Ajukan sewa</button>' +
        '<button type="button" class="btn btn-outline-danger btn-sm btn-lepas" data-id="' + h.id + '" aria-label="Lepas unit">✕</button>' +
      '</div></div>';
  }).join(''));
}

function bukaDetail(id) {
  const b = getBarang(id), kat = getKategori(b.id_kategori);
  const f = bacaFilter();
  $('#detailJudul').text(b.emoji + ' ' + b.nama);

  // Peta ketersediaan 14 hari dari hari ini
  let bars = '';
  for (let i = 0; i < 14; i++) {
    const tgl = tambahHari(i);
    const u = pakaiPadaHari(b.id, tgl);
    const sisa = Math.max(0, b.total - (u.pesanan + u.hold + u.blokir));
    const tinggi = Math.max(4, Math.round(sisa / b.total * 100));
    const warna = sisa === 0 ? 'var(--c-bad)' : (sisa < b.total / 2 ? 'var(--c-warn)' : 'var(--c-ok)');
    bars += '<div class="avail-col" title="' + fmtTanggal(tgl) + ': ' + sisa + ' unit kosong (pesanan ' + u.pesanan + ', hold ' + u.hold + ', blokir ' + u.blokir + ')">' +
            '<div class="small fw-semibold">' + sisa + '</div>' +
            '<div class="bar" style="height:' + tinggi + '%;background:' + warna + '"></div>' +
            '<div class="lbl">' + tgl.slice(8) + '/' + tgl.slice(5, 7) + '</div></div>';
  }

  $('#detailIsi').html(
    '<p>' + b.deskripsi + '</p>' +
    '<ul class="list-unstyled small mb-3">' +
      '<li><strong>Kategori:</strong> ' + kat.nama + '</li>' +
      '<li><strong>Toko:</strong> ' + b.toko + ', ' + b.kota + ' <span class="badge text-bg-success">Terverifikasi</span></li>' +
      '<li><strong>Harga sewa:</strong> ' + rupiah(b.harga) + ' / hari</li>' +
      '<li><strong>Total unit dimiliki:</strong> ' + b.total + '</li></ul>' +
    '<h3 class="h6 fw-bold">Unit kosong 14 hari ke depan</h3>' +
    '<div class="avail-chart mb-2">' + bars + '</div>' +
    '<p class="small text-muted mb-0">Arahkan kursor ke batang untuk melihat rincian pesanan, hold, dan blokir. Hijau = longgar, kuning = menipis, merah = habis.</p>'
  );
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetail')).show();
}
