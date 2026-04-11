/* ============================================
   KATARINA SOKOLOVA — PORTFOLIO JS
   Gallery, lightbox, filters, process, nav
   ============================================ */

(function () {
  'use strict';

  /* --- Utilities --- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ==========================================
     NAVIGATION
     ========================================== */
  const nav = qs('#nav');
  const allNavLinks = qsa('[data-section]');

  var hasShiftedBrand = false;
  function updateNavState() {
    var scrollY = window.scrollY;
    if (scrollY > 2) {
      hasShiftedBrand = true;
    }
    nav.classList.toggle('scrolled', scrollY > 40);
    nav.classList.toggle('brand-shifted', hasShiftedBrand);
  }
  window.addEventListener('scroll', updateNavState);
  updateNavState();

  /* Active nav + mobile tab bar highlighting on scroll */
  const sections = qsa('section[id]');
  var mobileTabItems = qsa('.mobile-tab-bar__item');
  function updateActiveNav() {
    var scrollY = window.scrollY + 120;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');
      var links = qsa('[data-section="' + id + '"]');
      links.forEach(function (link) {
        if (scrollY >= top && scrollY < top + height) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    });
  }
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  /* ==========================================
     DESKTOP 3D GALLERY
     ========================================== */
  var gallery3d = qs('#gallery3d');
  if (gallery3d) {
    var items = qsa('.gallery3d__item');
    var totalItems = items.length;
    var currentIndex = 0;
    var counter = qs('#gallery3dCounter');

    function position3dGallery() {
      items.forEach(function (item, i) {
        var offset = i - currentIndex;
        item.classList.remove('center');

        if (offset === 0) {
          item.style.transform = 'translateX(0) translateZ(0) scale(1)';
          item.style.opacity = '1';
          item.style.zIndex = '10';
          item.classList.add('center');
        } else {
          var x = offset * 320;
          var z = -Math.abs(offset) * 150;
          var s = Math.max(0.6, 1 - Math.abs(offset) * 0.15);
          var o = Math.max(0.2, 1 - Math.abs(offset) * 0.3);
          item.style.transform = 'translateX(' + x + 'px) translateZ(' + z + 'px) scale(' + s + ')';
          item.style.opacity = String(o);
          item.style.zIndex = String(5 - Math.abs(offset));
        }
      });
      if (counter) {
        counter.textContent = (currentIndex + 1) + ' / ' + totalItems;
      }
    }

    function goTo3d(index) {
      currentIndex = ((index % totalItems) + totalItems) % totalItems;
      position3dGallery();
    }

    qs('#gallery3dPrev').addEventListener('click', function () { goTo3d(currentIndex - 1); });
    qs('#gallery3dNext').addEventListener('click', function () { goTo3d(currentIndex + 1); });

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.dataset.index, 10);
        if (idx === currentIndex) {
          openLightbox(idx, items.map(function (it) {
            var img = qs('img', it);
            return { src: img.src, alt: img.alt };
          }));
        } else {
          goTo3d(idx);
        }
      });
    });

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
      if (qs('.lightbox.open')) return;
      if (e.key === 'ArrowLeft') goTo3d(currentIndex - 1);
      if (e.key === 'ArrowRight') goTo3d(currentIndex + 1);
    });

    /* Mouse parallax on desktop gallery */
    gallery3d.addEventListener('mousemove', function (e) {
      var rect = gallery3d.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var track = qs('#gallery3dTrack');
      track.style.transform = 'rotateY(' + (x * 3) + 'deg)';
    });
    gallery3d.addEventListener('mouseleave', function () {
      qs('#gallery3dTrack').style.transform = 'rotateY(0deg)';
    });

    position3dGallery();
  }

  /* ==========================================
     MOBILE CARD STACK
     ========================================== */
  var cardStack = qs('#cardStack');
  if (cardStack) {
    var cards = qsa('.card-stack__card');
    var dotsContainer = qs('#cardStackDots');
    var mobileIndex = 0;
    var touchStartX = 0;
    var touchDeltaX = 0;
    var isSwiping = false;

    cards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'card-stack__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to artwork ' + (i + 1));
      dot.addEventListener('click', function () { goToCard(i); });
      dotsContainer.appendChild(dot);
    });
    var dots = qsa('.card-stack__dot');

    function positionCards() {
      cards.forEach(function (card, i) {
        card.className = 'card-stack__card';
        if (i === mobileIndex) card.classList.add('active');
        else if (i === (mobileIndex + 1) % cards.length) card.classList.add('next');
        else if (i === (mobileIndex - 1 + cards.length) % cards.length) card.classList.add('prev');
        else card.classList.add('hidden');
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === mobileIndex);
      });
    }

    function goToCard(index) {
      mobileIndex = ((index % cards.length) + cards.length) % cards.length;
      positionCards();
    }

    /* Touch swipe */
    var stackContainer = qs('#cardStackContainer');
    stackContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      isSwiping = true;
      cards[mobileIndex].classList.add('swiping');
    }, { passive: true });

    stackContainer.addEventListener('touchmove', function (e) {
      if (!isSwiping) return;
      touchDeltaX = e.touches[0].clientX - touchStartX;
      cards[mobileIndex].style.transform = 'translateX(' + touchDeltaX + 'px) scale(1)';
    }, { passive: true });

    stackContainer.addEventListener('touchend', function () {
      if (!isSwiping) return;
      isSwiping = false;
      cards[mobileIndex].classList.remove('swiping');
      cards[mobileIndex].style.transform = '';
      if (Math.abs(touchDeltaX) > 60) {
        if (touchDeltaX < 0) goToCard(mobileIndex + 1);
        else goToCard(mobileIndex - 1);
      }
      touchDeltaX = 0;
    });

    positionCards();
  }

  /* ==========================================
     PORTFOLIO FILTERS
     ========================================== */
  var filterBtns = qsa('.portfolio__filter');
  var portfolioItems = qsa('.portfolio__item');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;

      portfolioItems.forEach(function (item) {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hiding');
          item.style.display = '';
        } else {
          item.classList.add('hiding');
          setTimeout(function () { item.style.display = 'none'; }, 400);
        }
      });
    });
  });

  /* Portfolio lightbox on click */
  portfolioItems.forEach(function (item, i) {
    item.addEventListener('click', function () {
      var visibleItems = portfolioItems.filter(function (it) {
        return !it.classList.contains('hiding');
      });
      var visibleIndex = visibleItems.indexOf(item);
      openLightbox(visibleIndex, visibleItems.map(function (it) {
        var img = qs('img', it);
        return { src: img.src, alt: img.alt };
      }));
    });
  });

  /* ==========================================
     LIGHTBOX
     ========================================== */
  var lightbox = qs('#lightbox');
  var lightboxImg = qs('#lightboxImg');
  var lightboxCaption = qs('#lightboxCaption');
  var lightboxItems = [];
  var lightboxIndex = 0;

  function openLightbox(index, items) {
    lightboxItems = items;
    lightboxIndex = index;
    showLightboxItem();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function showLightboxItem() {
    var item = lightboxItems[lightboxIndex];
    if (!item) return;
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  qs('#lightboxClose').addEventListener('click', closeLightbox);
  qs('#lightboxPrev').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    showLightboxItem();
  });
  qs('#lightboxNext').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    showLightboxItem();
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
      showLightboxItem();
    }
    if (e.key === 'ArrowRight') {
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
      showLightboxItem();
    }
  });

  /* ==========================================
     PROCESS STAGES
     ========================================== */
  var processStages = qsa('.process__stage');
  var progressSteps = qsa('.process__progress-step');
  var progressBar = qs('#processProgressBar');
  var activeProcessStage = 0;

  function setProcessStage(index) {
    activeProcessStage = index;
    processStages.forEach(function (stage, i) {
      stage.classList.toggle('active', i === index);
    });
    progressSteps.forEach(function (step, i) {
      step.classList.toggle('active', i === index);
    });
    if (progressBar) {
      progressBar.dataset.progress = String(index);
    }
  }

  processStages.forEach(function (stage, i) {
    stage.addEventListener('click', function () { setProcessStage(i); });
  });
  progressSteps.forEach(function (step) {
    step.addEventListener('click', function () {
      setProcessStage(parseInt(step.dataset.step, 10));
    });
  });

  setProcessStage(0);

  /* ==========================================
     SCROLL REVEAL
     ========================================== */
  var revealElements = qsa('.section-header, .portfolio__item, .process__piece, .process__tool, .about__content, .about__awards, .about__clients, .contact__content');
  revealElements.forEach(function (el) { el.classList.add('reveal'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(function (el) { observer.observe(el); });

})();
