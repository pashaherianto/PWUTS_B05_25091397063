/* ============================================================
   main.js — Router Ajax untuk layout utama (item 2.a)
   Menu navigasi memuat halaman ke #konten memakai jQuery .load()
   ============================================================ */

const HALAMAN = {
  beranda: { url: null,                  init: initBeranda,    judul: 'Beranda' },
  katalog: { url: 'pages/katalog.html',    init: initKatalog,    judul: 'Katalog & Cek Ketersediaan' },
  sewa:    { url: 'pages/form-sewa.html',  init: initFormSewa,   judul: 'Form Pengajuan Sewa' }
};

let berandaHTML = '';      // salinan konten beranda agar bisa dipulihkan tanpa request
window.prefill = null;     // data yang dibawa dari katalog ke form

function initBeranda() {
  // Animasi hitung angka pada kotak statistik
  $('.stat-num').each(function () {
    const $el = $(this), target = Number($el.data('target'));
    $({ n: 0 }).animate({ n: target }, {
      duration: 900,
      step: function (now) { $el.text(Math.round(now)); },
      complete: function () { $el.text(target); }
    });
  });
}

function setAktif(page) {
  $('.app-nav .nav-link').removeClass('active').removeAttr('aria-current');
  $('.app-nav .nav-link[data-page="' + page + '"]').addClass('active').attr('aria-current', 'page');
}

function muatHalaman(page) {
  if (!HALAMAN[page]) page = 'beranda';
  const h = HALAMAN[page];
  clearInterval(window.timerHold);
  setAktif(page);
  document.title = h.judul + ' — SewaIn';

  if (!h.url) {                                  // beranda: pakai salinan
    $('#konten').html(berandaHTML);
    h.init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  $('#konten').html('<div class="loading-box"><div class="spinner-border text-success mb-3" role="status"></div><div>Memuat halaman…</div></div>');
  $('#konten').load(h.url, function (respon, status) {
    if (status === 'error') {
      const lokal = location.protocol === 'file:';
      $('#konten').html(
        '<div class="alert alert-danger"><h2 class="h5">Halaman gagal dimuat</h2>' +
        (lokal
          ? '<p class="mb-0">Ajax tidak berjalan lewat <code>file://</code>. Jalankan lewat server lokal (XAMPP/Laragon, ekstensi Live Server VS Code, atau <code>python -m http.server</code>) lalu buka <code>http://localhost/...</code></p>'
          : '<p class="mb-0">File <code>' + h.url + '</code> tidak ditemukan. Periksa struktur folder.</p>') +
        '</div>');
      return;
    }
    h.init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function navigasi(page) {
  if (location.hash === '#' + page) muatHalaman(page);   // hash sama → muat ulang manual
  else location.hash = page;                               // hashchange yang memuat
}

$(function () {
  berandaHTML = $('#konten').html();

  // Semua elemen [data-page] memakai Ajax (tanpa reload)
  $(document).on('click', '[data-page]', function (e) {
    e.preventDefault();
    navigasi($(this).data('page'));
    const menu = document.getElementById('menuUtama');
    if (menu && menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  });

  // Tombol Back/Forward browser
  $(window).on('hashchange', function () { muatHalaman(location.hash.replace('#', '') || 'beranda'); });

  const awal = location.hash.replace('#', '');
  if (awal && awal !== 'beranda') muatHalaman(awal);
  else { setAktif('beranda'); initBeranda(); }
});
