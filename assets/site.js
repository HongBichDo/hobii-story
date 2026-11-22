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
  var group = document.querySelector('[data-filter-group]');
  if (group) {
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
      btn.classList.add('on');
      var f = btn.getAttribute('data-f');
      document.querySelectorAll('[data-cat]').forEach(function (el) {
        el.hidden = f !== '*' && el.getAttribute('data-cat') !== f;
      });
    });
  }
})();
