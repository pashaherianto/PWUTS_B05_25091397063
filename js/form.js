/* ============================================================
   form.js — Halaman 2.c: form pengajuan sewa + validasi JS/jQuery
   Field mengikuti tabel `pesanan` (proposal Tabel 3.1).
   Validasi dijalankan SEBELUM data dikirim ke server HTTP.
   ============================================================ */

// Ubah ke true bila backend PHP sudah tersedia (proses/simpan_pesanan.php)
const KIRIM_KE_SERVER = false;
const ENDPOINT_SIMPAN = 'proses/simpan_pesanan.php';

function initFormSewa() {
  clearInterval(window.timerHold);
  const pre = window.prefill;          // dibawa dari katalog (bila ada)
  window.prefill = null;
  let holdId = pre && pre.holdId ? pre.holdId : null;

  // Isi pilihan barang
  BARANG.forEach(b => $('#id_barang').append('<option value="' + b.id + '">' + b.nama + ' — ' + rupiah(b.harga) + '/hari</option>'));
  $('#tgl_mulai, #tgl_selesai').attr('min', tambahHari(0));

  if (pre) {
    $('#id_barang').val(pre.id_barang);
    $('#tgl_mulai').val(pre.mulai);
    $('#tgl_selesai').val(pre.selesai);
    $('#jumlah').val(pre.jumlah);
  } else if (window.stateKatalog) {
    $('#tgl_mulai').val(window.stateKatalog.mulai);
    $('#tgl_selesai').val(window.stateKatalog.selesai);
    $('#jumlah').val(window.stateKatalog.jumlah);
  }

  /* ---------- Banner hold ---------- */
  function renderBanner() {
    const $b = $('#bannerHold');
    if (!holdId) { $b.addClass('d-none'); return; }
    const h = getHold(holdId);
    if (!h || h.kadaluarsa <= Date.now()) {
      $b.removeClass('d-none alert-warning').addClass('alert-danger')
        .html('⚠️ Penahanan unit sudah kedaluwarsa. Ketersediaan dicek ulang saat Anda mengirim pengajuan.');
      holdId = null;
      hitungRingkasan();
      return;
    }
    $b.removeClass('d-none alert-danger').addClass('alert-warning')
      .html('⏱️ Unit Anda sedang ditahan. Selesaikan pengajuan dalam <strong class="countdown">' + fmtMenit(h.kadaluarsa - Date.now()) + '</strong>.');
  }
  renderBanner();
  window.timerHold = setInterval(function () {
    if (!$('#formSewa').length) { clearInterval(window.timerHold); return; }
    bersihkanHoldKadaluarsa();
    renderBanner();
  }, 1000);

  /* ---------- Helper tampilan error ---------- */
  function fb($el) { return $el.closest('.mb-3, .col-md-4, .col-md-6, .form-check').find('.invalid-feedback').first(); }
  function salah($el, pesan) {
    $el.removeClass('is-valid').addClass('is-invalid');
    fb($el).text(pesan);
    return false;
  }
  function benar($el) {
    $el.removeClass('is-invalid').addClass('is-valid');
    fb($el).text('');
    return true;
  }

  /* ---------- Aturan validasi per field ---------- */
  const aturan = {
    nama: function () {
      const $e = $('#nama'), v = $e.val().trim();
      if (!v) return salah($e, 'Nama lengkap wajib diisi.');
      if (v.length < 3) return salah($e, 'Nama minimal 3 karakter.');
      if (!/^[A-Za-z\s.'-]+$/.test(v)) return salah($e, 'Nama hanya boleh berisi huruf, spasi, titik, atau tanda hubung.');
      return benar($e);
    },
    email: function () {
      const $e = $('#email'), v = $e.val().trim();
      if (!v) return salah($e, 'Email wajib diisi.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return salah($e, 'Format email tidak valid (contoh: nama@email.com).');
      return benar($e);
    },
    no_hp: function () {
      const $e = $('#no_hp'), v = $e.val().replace(/[\s-]/g, '');
      if (!v) return salah($e, 'Nomor HP wajib diisi.');
      if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(v)) return salah($e, 'Nomor HP tidak valid. Gunakan format 08xx… atau +628xx… (10–13 digit).');
      return benar($e);
    },
    id_barang: function () {
      const $e = $('#id_barang');
      if (!$e.val()) return salah($e, 'Silakan pilih barang yang akan disewa.');
      return benar($e);
    },
    tgl_mulai: function () {
      const $e = $('#tgl_mulai'), v = $e.val();
      if (!v) return salah($e, 'Tanggal mulai wajib diisi.');
      if (v < tambahHari(0)) return salah($e, 'Tanggal mulai tidak boleh sebelum hari ini.');
      return benar($e);
    },
    tgl_selesai: function () {
      const $e = $('#tgl_selesai'), v = $e.val(), m = $('#tgl_mulai').val();
      if (!v) return salah($e, 'Tanggal selesai wajib diisi.');
      if (m && v < m) return salah($e, 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
      if (m && hitungDurasi(m, v) > 30) return salah($e, 'Durasi sewa maksimal 30 hari.');
      return benar($e);
    },
    jumlah: function () {
      const $e = $('#jumlah'), raw = $e.val().trim(), v = Number(raw);
      if (!raw) return salah($e, 'Jumlah wajib diisi.');
      if (!Number.isInteger(v) || v < 1) return salah($e, 'Jumlah harus bilangan bulat minimal 1.');
      const id = $('#id_barang').val(), m = $('#tgl_mulai').val(), s = $('#tgl_selesai').val();
      if (id && m && s && s >= m) {
        const cek = hitungTersedia(id, m, s, holdId);
        if (v > cek.tersedia) return salah($e, 'Jumlah melebihi unit kosong (' + cek.tersedia + ' unit) pada periode ini.');
      }
      return benar($e);
    },
    catatan: function () {
      const $e = $('#catatan'), v = $e.val();
      $('#hitungCatatan').text(v.length);
      if (v.length > 200) { $e.addClass('is-invalid'); $e.closest('.mb-3').find('.invalid-feedback').text('Catatan maksimal 200 karakter.'); return false; }
      $e.removeClass('is-invalid');
      $e.closest('.mb-3').find('.invalid-feedback').text('');
      return true;
    },
    setuju: function () {
      const $e = $('#setuju');
      if (!$e.is(':checked')) { $e.addClass('is-invalid'); fb($e).addClass('d-block').text('Anda harus menyetujui ketentuan sebelum mengirim.'); return false; }
      $e.removeClass('is-invalid'); fb($e).removeClass('d-block').text('');
      return true;
    }
  };

  /* ---------- Info stok & ringkasan (hitung otomatis) ---------- */
  function hitungRingkasan() {
    const id = $('#id_barang').val(), m = $('#tgl_mulai').val(), s = $('#tgl_selesai').val();
    const jml = parseInt($('#jumlah').val(), 10) || 0;
    const b = id ? getBarang(id) : null;
    const durasi = hitungDurasi(m, s);

    $('#rBarang').text(b ? b.nama : '—');
    $('#rToko').text(b ? b.toko + ', ' + b.kota : '—');
    $('#rHarga').text(b ? rupiah(b.harga) : '—');
    $('#rPeriode').text(m && s ? fmtTanggal(m) + ' – ' + fmtTanggal(s) : '—');
    $('#rDurasi').text(durasi ? durasi + ' hari' : '—');
    $('#rJumlah').text(jml > 0 ? jml + ' unit' : '—');
    $('#rTotal').text(b && durasi && jml > 0 ? rupiah(b.harga * jml * durasi) : 'Rp0');

    const $i = $('#infoStok');
    if (b && m && s && s >= m) {
      const cek = hitungTersedia(id, m, s, holdId);
      const kelas = cek.tersedia === 0 ? 'text-danger' : (cek.tersedia < jml ? 'text-warning' : 'text-success');
      $i.html('<span class="' + kelas + ' fw-semibold">Unit kosong pada periode ini: ' + cek.tersedia + ' dari ' + cek.total + '.</span>');
    } else {
      $i.text('Pilih barang dan tanggal untuk melihat unit kosong.');
    }
  }

  /* ---------- Validasi langsung saat mengisi ---------- */
  const urutan = ['nama', 'email', 'no_hp', 'id_barang', 'tgl_mulai', 'tgl_selesai', 'jumlah', 'catatan', 'setuju'];
  $('#formSewa').on('input change', 'input, select, textarea', function () {
    const nm = this.name;
    if ($(this).hasClass('is-invalid') || $(this).hasClass('is-valid') || nm === 'catatan') aturan[nm] && aturan[nm]();
    // Field yang saling bergantung divalidasi ulang bila sudah pernah diisi
    if (['id_barang', 'tgl_mulai', 'tgl_selesai'].includes(nm)) {
      if ($('#tgl_selesai').val()) aturan.tgl_selesai();
      if ($('#jumlah').hasClass('is-valid') || $('#jumlah').hasClass('is-invalid')) aturan.jumlah();
    }
    hitungRingkasan();
  });
  $('#formSewa').on('blur', 'input, select', function () { if (aturan[this.name] && this.type !== 'checkbox') aturan[this.name](); });

  $('#btnReset').on('click', function () {
    setTimeout(function () {
      $('#formSewa .is-valid, #formSewa .is-invalid').removeClass('is-valid is-invalid');
      $('#formSewa .invalid-feedback').text('');
      $('#hitungCatatan').text(0);
      holdId = null; $('#bannerHold').addClass('d-none');
      hitungRingkasan();
    }, 0);
  });

  /* ---------- Submit ---------- */
  $('#formSewa').on('submit', function (e) {
    e.preventDefault();
    let valid = true, pertamaSalah = null;
    urutan.forEach(function (nm) {
      const ok = aturan[nm]();
      if (!ok) { valid = false; if (!pertamaSalah) pertamaSalah = $('#' + nm); }
    });
    if (!valid) { pertamaSalah.trigger('focus'); return; }

    const data = {
      kode_pesanan: 'PSN-' + fmtISO(new Date()).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000)),
      nama: $('#nama').val().trim(),
      email: $('#email').val().trim(),
      no_hp: $('#no_hp').val().replace(/[\s-]/g, ''),
      id_barang: Number($('#id_barang').val()),
      tgl_mulai: $('#tgl_mulai').val(),
      tgl_selesai: $('#tgl_selesai').val(),
      jumlah: Number($('#jumlah').val()),
      catatan: $('#catatan').val().trim(),
      status_pesanan: 'menunggu_keputusan'
    };
    const b = getBarang(data.id_barang);
    data.total_harga = b.harga * data.jumlah * hitungDurasi(data.tgl_mulai, data.tgl_selesai);

    function sukses() {
      if (holdId) lepasHold(holdId);                    // hold berubah menjadi reservasi
      simpanPesanan(data.id_barang, data.tgl_mulai, data.tgl_selesai, data.jumlah);
      holdId = null;
      tampilSukses(data, b);
    }

    if (KIRIM_KE_SERVER) {
      $.post(ENDPOINT_SIMPAN, data)
        .done(sukses)
        .fail(function () { alert('Pengiriman ke server gagal. Perubahan belum tersimpan, silakan coba lagi.'); });
    } else {
      sukses();                                         // mode simulasi (tanpa backend)
    }
  });

  function tampilSukses(d, b) {
    $('#areaForm, #bannerHold').addClass('d-none');
    const ringkas = JSON.stringify(d, null, 2).replace(/</g, '&lt;');
    $('#hasilKirim').removeClass('d-none').html(
      '<div class="card form-card"><div class="card-body p-4">' +
      '<div class="fs-1">✅</div>' +
      '<h2 class="h4 fw-bold">Pengajuan terkirim!</h2>' +
      '<p>Kode pesanan <strong>' + d.kode_pesanan + '</strong>. Penyedia <strong>' + b.toko + '</strong> akan memutuskan menerima atau menolak permintaan Anda. Total sewa: <strong>' + rupiah(d.total_harga) + '</strong>.</p>' +
      '<details class="mb-3"><summary class="small text-muted">Lihat data yang dikirim ke server</summary><pre class="small bg-light p-3 rounded mt-2">' + ringkas + '</pre></details>' +
      '<div class="d-flex flex-wrap gap-2">' +
        '<button type="button" class="btn btn-success" data-page="katalog">Kembali ke katalog</button>' +
        '<button type="button" class="btn btn-outline-secondary" id="btnBaru">Buat pengajuan lain</button>' +
      '</div></div></div>');
    $('#btnBaru').on('click', function () { navigasi('sewa'); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hitungRingkasan();
}
