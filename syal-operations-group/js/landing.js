(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initDrawer();
    initReveal();
    initCounters();
    initVideoModal();
  });

  function initNav() {
    var nav = document.querySelector('.floating-nav');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initDrawer() {
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.getElementById('nav-drawer');
    var backdrop = document.getElementById('nav-backdrop');
    if (!toggle || !drawer) return;

    function close() {
      drawer.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function open() {
      drawer.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) close();
      else open();
    });

    if (backdrop) backdrop.addEventListener('click', close);

    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function initReveal() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = document.querySelectorAll('.reveal');

    if (prefersReduced) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  function initCounters() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var counters = document.querySelectorAll('[data-count]');

    function setFinal(el) {
      var target = el.dataset.count;
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      el.textContent = prefix + target + suffix;
    }

    if (prefersReduced) {
      counters.forEach(setFinal);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var raw = el.dataset.count.replace(/,/g, '');
        var target = parseFloat(raw);
        var isDecimal = raw.indexOf('.') !== -1;
        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        var duration = 1600;
        var start = performance.now();

        function tick(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = eased * target;
          var display = isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString();
          el.textContent = prefix + display + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function initVideoModal() {
    var trigger = document.getElementById('watch-overview');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      alert('Product overview video coming soon.');
    });
  }
})();
