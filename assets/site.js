(function () {
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  // ảnh đầu trang trôi chậm hơn khi cuộn (chỉ máy tính, tôn trọng chế độ giảm chuyển động)
  var heroBg = document.querySelector('.hero-bg');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroBg && !calm && window.matchMedia('(min-width: 761px)').matches) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) heroBg.style.setProperty('--py', (y * 0.28).toFixed(1) + 'px');
        ticking = false;
      });
    }, { passive: true });
  }
  var items = document.querySelectorAll('.reveal');
  // phần đang nằm trong màn hình lúc mở trang: hiện ngay, không chờ hiệu ứng
  var vh = window.innerHeight;
  items.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.classList.add('now', 'in');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
  // lọc theo thể loại và tìm kiếm (dùng chung cho trang Sách và Góc viết)
  var group = document.querySelector('[data-filter-group]');
  var search = document.querySelector('[data-search]');
  var none = document.querySelector('[data-none]');
  var cat = '*';
  var fold = function (s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
  };
  function apply() {
    var q = search ? fold(search.value) : '';
    var shown = 0;
    document.querySelectorAll('main [data-cat]').forEach(function (el) {
      if (el.closest('.related')) return;
      var cats = (el.getAttribute('data-cat') || '').split('|');
      var okCat = cat === '*' || cats.indexOf(cat) !== -1;
      var okQ = !q || (el.getAttribute('data-q') || '').indexOf(q) !== -1;
      el.hidden = !(okCat && okQ);
      if (!el.hidden) { shown++; el.classList.add('in'); }
    });
    if (none) none.hidden = shown > 0;
  }
  if (group) {
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
      btn.classList.add('on');
      cat = btn.getAttribute('data-f');
      apply();
    });
  }
  if (search) search.addEventListener('input', apply);

  // nút chép đường dẫn
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = b.getAttribute('data-copy');
      var label = b.querySelector('span');
      var done = function () { if (label) { label.textContent = 'Đã chép'; setTimeout(function () { label.textContent = 'Chép đường dẫn'; }, 2000); } };
      if (navigator.share && window.matchMedia('(max-width: 760px)').matches) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Chép đường dẫn này:', url); });
      } else {
        window.prompt('Chép đường dẫn này:', url);
      }
    });
  });
})();
