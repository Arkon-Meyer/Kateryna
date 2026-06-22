/* ============================================
   KATARINA SOKOLOVA — PORTFOLIO JS
   Gallery, lightbox, filters, process, nav
   ============================================ */

(function () {
  'use strict';

  /* --- Utilities --- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function bindHorizontalSwipe(el, handlers) {
    if (!el) return;

    var startX = 0;
    var startY = 0;
    var deltaX = 0;
    var deltaY = 0;
    var tracking = false;

    function reset() {
      startX = 0;
      startY = 0;
      deltaX = 0;
      deltaY = 0;
      tracking = false;
    }

    function onTouchStart(e) {
      if (!e.touches || e.touches.length !== 1) return;
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaX = 0;
      deltaY = 0;
    }

    function onTouchMove(e) {
      if (!tracking || !e.touches || e.touches.length !== 1) return;
      deltaX = e.touches[0].clientX - startX;
      deltaY = e.touches[0].clientY - startY;
    }

    function onTouchEnd() {
      if (!tracking) return;
      var absX = Math.abs(deltaX);
      var absY = Math.abs(deltaY);
      var isHorizontalSwipe = absX > 48 && absX > absY * 1.15;

      if (isHorizontalSwipe) {
        if (deltaX < 0 && handlers && handlers.onSwipeLeft) handlers.onSwipeLeft();
        if (deltaX > 0 && handlers && handlers.onSwipeRight) handlers.onSwipeRight();
      }
      reset();
    }

    function onTouchCancel() {
      reset();
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
  }

  /* ==========================================
     GALLERY DATA — single source of truth
     ========================================== */
  var galleryData = [];
  var dataEl = qs('#galleryData');
  if (dataEl) {
    try { galleryData = JSON.parse(dataEl.textContent); } catch (e) { /* ignore */ }
  }

  function buildDesktopGallery() {
    var track = qs('#gallery3dTrack');
    if (!track) return;
    galleryData.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'gallery3d__item';
      div.dataset.index = String(i);
      div.innerHTML =
        '<div class="gallery3d__frame">' +
          '<img src="' + item.src + '" alt="' + item.alt + '"' + (i < 3 ? ' loading="eager"' : ' loading="lazy"') + '>' +
          '<div class="gallery3d__caption">' + item.alt + '</div>' +
        '</div>';
      track.appendChild(div);
    });
  }

  function buildMobileCardStack() {
    var container = qs('#cardStackContainer');
    if (!container) return;
    galleryData.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'card-stack__card';
      div.dataset.index = String(i);
      div.innerHTML =
        '<img src="' + item.src + '" alt="' + item.alt + '">' +
        '<div class="card-stack__caption">' + item.alt + '</div>';
      container.appendChild(div);
    });
  }

  buildDesktopGallery();
  buildMobileCardStack();

  /* ==========================================
     NAVIGATION
     ========================================== */
  var nav = qs('#nav');
  const hero = qs('.hero');
  const sections = qsa('section[id]');

  function clamp01(v) {
    return Math.max(0, Math.min(v, 1));
  }

  var sectionLinksMap = sections.map(function (section) {
    var id = section.getAttribute('id');
    return {
      section: section,
      links: qsa('[data-section="' + id + '"]')
    };
  });

  function applyNavState(scrollY, titleProgress, barProgress, linksProgress, heroTextProgress) {
    nav.classList.toggle('scrolled', barProgress > 0.04);
    nav.classList.toggle('brand-shifted', titleProgress > 0.08);
    nav.style.setProperty('--title-progress', String(titleProgress));
    nav.style.setProperty('--bar-progress', String(barProgress));
    nav.style.setProperty('--links-progress', String(linksProgress));
    if (hero) {
      hero.style.setProperty('--title-progress', String(titleProgress));
      hero.style.setProperty('--hero-text-progress', String(heroTextProgress));
    }

    var activeScanY = scrollY + 120;
    sectionLinksMap.forEach(function (entry) {
      var top = entry.section.offsetTop;
      var height = entry.section.offsetHeight;
      entry.links.forEach(function (link) {
        var isActive = activeScanY >= top && activeScanY < top + height;
        link.classList.toggle('active', isActive);
      });
    });
  }

  var latestScrollY = window.scrollY;
  var rafId = 0;
  var currentTitleProgress = 0;
  var currentBarProgress = 0;
  var currentLinksProgress = 0;
  var currentHeroTextProgress = 0;

  function targetProgresses(scrollY) {
    return {
      title: clamp01(scrollY / 170),
      bar: clamp01(scrollY / 160),
      links: clamp01((scrollY - 72) / 128),
      heroText: clamp01(scrollY / 140)
    };
  }

  function tickScrollAnimation() {
    var t = targetProgresses(latestScrollY);
    var smoothing = 0.26;

    currentTitleProgress += (t.title - currentTitleProgress) * smoothing;
    currentBarProgress += (t.bar - currentBarProgress) * smoothing;
    currentLinksProgress += (t.links - currentLinksProgress) * smoothing;
    currentHeroTextProgress += (t.heroText - currentHeroTextProgress) * smoothing;

    if (Math.abs(t.title - currentTitleProgress) < 0.001) currentTitleProgress = t.title;
    if (Math.abs(t.bar - currentBarProgress) < 0.001) currentBarProgress = t.bar;
    if (Math.abs(t.links - currentLinksProgress) < 0.001) currentLinksProgress = t.links;
    if (Math.abs(t.heroText - currentHeroTextProgress) < 0.001) currentHeroTextProgress = t.heroText;

    applyNavState(
      latestScrollY,
      currentTitleProgress,
      currentBarProgress,
      currentLinksProgress,
      currentHeroTextProgress
    );

    var keepAnimating =
      currentTitleProgress !== t.title ||
      currentBarProgress !== t.bar ||
      currentLinksProgress !== t.links ||
      currentHeroTextProgress !== t.heroText;

    if (keepAnimating) {
      rafId = window.requestAnimationFrame(tickScrollAnimation);
    } else {
      rafId = 0;
    }
  }

  function queueScrollAnimation() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(tickScrollAnimation);
  }

  window.addEventListener('scroll', function () {
    latestScrollY = window.scrollY;
    queueScrollAnimation();
  }, { passive: true });

  window.addEventListener('resize', function () {
    latestScrollY = window.scrollY;
    queueScrollAnimation();
  });

  (function initScrollState() {
    var t = targetProgresses(latestScrollY);
    currentTitleProgress = t.title;
    currentBarProgress = t.bar;
    currentLinksProgress = t.links;
    currentHeroTextProgress = t.heroText;
    applyNavState(latestScrollY, t.title, t.bar, t.links, t.heroText);
  })();

  /* ==========================================
     NAV LINK SCROLLING — instant interrupt
     Clicking a nav link immediately scrolls to
     the target, even if a previous scroll is
     still in momentum. Uses JS scrollTo to
     bypass CSS scroll-behavior queuing.
     ========================================== */
  qsa('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = qs(targetId);
      if (!target) return;
      e.preventDefault();
      var scrollPadding = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 0;
      var targetY = target.getBoundingClientRect().top + window.scrollY - scrollPadding;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  /* ==========================================
     DESKTOP 3D GALLERY
     ========================================== */
  var gallery3d = qs('#gallery3d');
  if (gallery3d) {
    var items = qsa('.gallery3d__item');
    var totalItems = items.length;
    var currentIndex = 0;
    var counter = qs('#gallery3dCounter');
    var last3dSwipeAt = 0;

    function position3dGallery(skipTransition) {
      items.forEach(function (item, i) {
        var offset = i - currentIndex;
        item.classList.remove('center');

        if (skipTransition) {
          item.style.transition = 'none';
        } else {
          item.style.transition = '';
        }

        var newZ = offset === 0 ? 10 : Math.max(1, 5 - Math.abs(offset));
        item.style.zIndex = String(newZ);

        if (offset === 0) {
          item.style.transform = 'translateX(0) translateZ(0) scale(1)';
          item.style.opacity = '1';
          item.classList.add('center');
        } else {
          var x = offset * 320;
          var z = -Math.abs(offset) * 150;
          var s = Math.max(0.6, 1 - Math.abs(offset) * 0.15);
          var o = Math.max(0.2, 1 - Math.abs(offset) * 0.3);
          item.style.transform = 'translateX(' + x + 'px) translateZ(' + z + 'px) scale(' + s + ')';
          item.style.opacity = String(o);
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
        if (Date.now() - last3dSwipeAt < 320) return;
        var idx = parseInt(item.dataset.index, 10);
        if (idx === currentIndex) {
          openLightbox(idx, galleryData);
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

    /* Touch swipe for hero gallery (touchscreen desktop/tablet) */
    bindHorizontalSwipe(gallery3d, {
      onSwipeLeft: function () {
        last3dSwipeAt = Date.now();
        goTo3d(currentIndex + 1);
      },
      onSwipeRight: function () {
        last3dSwipeAt = Date.now();
        goTo3d(currentIndex - 1);
      }
    });

    position3dGallery(true);

    /* Auto-advance: rotate every 5s, pause on hover/touch/focus */
    var autoAdvanceTimer = null;
    var autoAdvancePaused = false;

    function startAutoAdvance() {
      stopAutoAdvance();
      if (autoAdvancePaused) return;
      autoAdvanceTimer = setInterval(function () {
        goTo3d(currentIndex + 1);
      }, 5000);
    }

    function stopAutoAdvance() {
      if (autoAdvanceTimer) { clearInterval(autoAdvanceTimer); autoAdvanceTimer = null; }
    }

    function pauseAutoAdvance() {
      autoAdvancePaused = true;
      stopAutoAdvance();
    }

    function resumeAutoAdvance() {
      autoAdvancePaused = false;
      startAutoAdvance();
    }

    gallery3d.addEventListener('mouseenter', pauseAutoAdvance);
    gallery3d.addEventListener('mouseleave', resumeAutoAdvance);
    gallery3d.addEventListener('touchstart', function () {
      pauseAutoAdvance();
      setTimeout(resumeAutoAdvance, 10000);
    }, { passive: true });

    startAutoAdvance();

    /* Mouse wheel navigation */
    var lastWheelAt = 0;
    gallery3d.addEventListener('wheel', function (e) {
      var now = Date.now();
      if (now - lastWheelAt < 600) return;
      lastWheelAt = now;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        if (e.deltaY > 0) goTo3d(currentIndex + 1);
        else goTo3d(currentIndex - 1);
        pauseAutoAdvance();
        setTimeout(resumeAutoAdvance, 8000);
      }
    }, { passive: false });
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
  var filterHideTimers = [];

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;

      filterHideTimers.forEach(function (id) { clearTimeout(id); });
      filterHideTimers.length = 0;

      portfolioItems.forEach(function (item) {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hiding');
          item.style.display = '';
        } else {
          item.classList.add('hiding');
          var timerId = setTimeout(function () { item.style.display = 'none'; }, 400);
          filterHideTimers.push(timerId);
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
  var lightboxContent = qs('.lightbox__content');
  var lightboxImg = qs('#lightboxImg');
  var lightboxCaption = qs('#lightboxCaption');
  var lightboxItems = [];
  var lightboxIndex = 0;

  var lastFocusBeforeLightbox = null;

  function openLightbox(index, items) {
    lightboxItems = items;
    lightboxIndex = index;
    showLightboxItem();
    lastFocusBeforeLightbox = document.activeElement;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    qs('#lightboxClose').focus();
  }

  function showLightboxItem(animate) {
    var item = lightboxItems[lightboxIndex];
    if (!item) return;
    if (animate) {
      lightboxImg.classList.add('fading');
      setTimeout(function () {
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxCaption.textContent = item.alt;
        lightboxImg.classList.remove('fading');
      }, 200);
    } else {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      lightboxCaption.textContent = item.alt;
    }
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusBeforeLightbox) {
      lastFocusBeforeLightbox.focus();
      lastFocusBeforeLightbox = null;
    }
  }

  qs('#lightboxClose').addEventListener('click', closeLightbox);
  qs('#lightboxPrev').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    showLightboxItem(true);
  });
  qs('#lightboxNext').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    showLightboxItem(true);
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
      showLightboxItem(true);
    }
    if (e.key === 'ArrowRight') {
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
      showLightboxItem(true);
    }
    if (e.key === 'Tab') {
      var focusable = qsa('button', lightbox);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  /* Touch swipe for fullscreen lightbox gallery */
  bindHorizontalSwipe(lightboxContent, {
    onSwipeLeft: function () {
      if (!lightbox.classList.contains('open') || !lightboxItems.length) return;
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
      showLightboxItem(true);
    },
    onSwipeRight: function () {
      if (!lightbox.classList.contains('open') || !lightboxItems.length) return;
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
      showLightboxItem(true);
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
     PORTFOLIO FILTER KEYBOARD NAVIGATION
     ========================================== */
  var filterBar = qs('#portfolioFilters');
  if (filterBar) {
    filterBar.addEventListener('keydown', function (e) {
      var btns = qsa('.portfolio__filter');
      var idx = btns.indexOf(document.activeElement);
      if (idx < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        btns[(idx + 1) % btns.length].focus();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        btns[(idx - 1 + btns.length) % btns.length].focus();
      }
    });
  }

  /* ==========================================
     SCROLL REVEAL (with staggered portfolio)
     ========================================== */
  var standardReveals = qsa('.section-header, .process__piece, .process__tool, .about__content, .about__awards, .about__clients, .contact__content');
  standardReveals.forEach(function (el) { el.classList.add('reveal'); });

  var portfolioRevealItems = qsa('.portfolio__item');
  portfolioRevealItems.forEach(function (el) { el.classList.add('reveal'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  standardReveals.forEach(function (el) { observer.observe(el); });

  var staggerObserver = new IntersectionObserver(function (entries) {
    var newVisible = entries.filter(function (e) { return e.isIntersecting && !e.target.classList.contains('visible'); });
    newVisible.forEach(function (entry, i) {
      setTimeout(function () {
        entry.target.classList.add('visible');
      }, i * 60);
      staggerObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  portfolioRevealItems.forEach(function (el) { staggerObserver.observe(el); });

  /* ==========================================
     IMAGE LOAD SHIMMER
     ========================================== */
  qsa('.portfolio__item, .gallery3d__frame, .card-stack__card, .process__stage-img, .about__photo').forEach(function (el) {
    el.classList.add('img-loading');
    var img = qs('img', el);
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      el.classList.add('img-loaded');
    } else {
      img.addEventListener('load', function () { el.classList.add('img-loaded'); });
      img.addEventListener('error', function () { el.classList.add('img-loaded'); });
    }
  });

})();
