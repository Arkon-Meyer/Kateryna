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
     ARTWORK MANIFEST — loaded from artwork.json
     Drives hero gallery, portfolio grid, and
     rotation logic from a single data source.
     ========================================== */
  var allArtwork = [];
  var heroArtwork = [];
  var galleryData = [];

  var ITEMS_PER_PAGE = 12;
  var portfolioPage = 0;
  var currentFilter = 'all';

  function artworkImgSrc(item) {
    return 'images/artwork/' + item.file + '.webp';
  }

  function artworkThumbSrc(item) {
    return 'images/artwork/' + item.file + '_thumb.webp';
  }

  function artworkFallbackSrc(item) {
    return 'images/' + item.file + '.svg';
  }

  function imgSrc(item) {
    return artworkFallbackSrc(item);
  }

  function thumbSrc(item) {
    return artworkFallbackSrc(item);
  }

  /* --- View tracking (localStorage) --- */
  var VIEW_KEY = 'ks_views';
  var ROTATION_KEY = 'ks_rotation_ts';
  var ROTATION_DAYS = 21;

  function getViewCounts() {
    try { return JSON.parse(localStorage.getItem(VIEW_KEY)) || {}; } catch (e) { return {}; }
  }

  function recordView(id) {
    var counts = getViewCounts();
    counts[id] = (counts[id] || 0) + 1;
    try { localStorage.setItem(VIEW_KEY, JSON.stringify(counts)); } catch (e) { /* ignore */ }
  }

  function selectHeroArtwork(artwork) {
    var featured = artwork.filter(function (a) { return a.featured; });
    if (featured.length >= 6) return featured.slice(0, 8);

    var lastRotation = 0;
    try { lastRotation = parseInt(localStorage.getItem(ROTATION_KEY), 10) || 0; } catch (e) {}
    var now = Date.now();
    var daysSince = (now - lastRotation) / (1000 * 60 * 60 * 24);

    if (daysSince >= ROTATION_DAYS || lastRotation === 0) {
      try { localStorage.setItem(ROTATION_KEY, String(now)); } catch (e) {}
      var counts = getViewCounts();
      var sorted = artwork.slice().sort(function (a, b) {
        return (counts[b.id] || 0) - (counts[a.id] || 0);
      });
      return sorted.slice(0, 8);
    }

    if (featured.length > 0) return featured.slice(0, 8);
    return artwork.slice(0, 8);
  }

  function buildDesktopGallery(items) {
    var track = qs('#gallery3dTrack');
    if (!track) return;
    track.innerHTML = '';
    items.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'gallery3d__item';
      div.dataset.index = String(i);
      div.dataset.artId = item.id;
      div.innerHTML =
        '<div class="gallery3d__frame">' +
          '<img src="' + imgSrc(item) + '" alt="' + item.title + '"' + (i < 3 ? ' loading="eager"' : ' loading="lazy"') + '>' +
          '<div class="gallery3d__caption">' + item.title + '</div>' +
        '</div>';
      track.appendChild(div);
    });
  }

  function buildMobileCardStack(items) {
    var container = qs('#cardStackContainer');
    if (!container) return;
    container.innerHTML = '';
    items.forEach(function (item, i) {
      var div = document.createElement('div');
      div.className = 'card-stack__card';
      div.dataset.index = String(i);
      div.dataset.artId = item.id;
      div.innerHTML =
        '<img src="' + imgSrc(item) + '" alt="' + item.title + '">' +
        '<div class="card-stack__caption">' + item.title + '</div>';
      container.appendChild(div);
    });
  }

  /* --- Portfolio grid rendering --- */
  var CATEGORY_LABELS = {
    'book-covers': 'Book Covers',
    'fantasy': 'Fantasy',
    'editorial': 'Editorial',
    'personal': 'Personal'
  };

  function getFilteredArtwork() {
    if (currentFilter === 'all') return allArtwork;
    return allArtwork.filter(function (a) { return a.category === currentFilter; });
  }

  function renderPortfolioPage() {
    var grid = qs('#portfolioGrid');
    if (!grid) return;
    var filtered = getFilteredArtwork();
    var end = (portfolioPage + 1) * ITEMS_PER_PAGE;
    var visible = filtered.slice(0, end);

    grid.innerHTML = '';
    visible.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'portfolio__item reveal';
      div.dataset.category = item.category;
      div.dataset.artId = item.id;
      div.innerHTML =
        '<img src="' + thumbSrc(item) + '" alt="' + item.title + '" loading="lazy">' +
        '<div class="portfolio__overlay">' +
          '<h3>' + item.title + '</h3>' +
          '<span>' + (CATEGORY_LABELS[item.category] || item.category) + '</span>' +
        '</div>';
      grid.appendChild(div);
    });

    var loadMoreWrap = qs('#loadMoreWrap');
    if (loadMoreWrap) {
      loadMoreWrap.classList.toggle('hidden', end >= filtered.length);
    }

    requestAnimationFrame(function () {
      attachPortfolioClicks();
      attachShimmer();
      observeReveals();
    });
  }

  function attachPortfolioClicks() {
    qsa('.portfolio__item').forEach(function (item) {
      item.addEventListener('click', function () {
        var visibleItems = qsa('.portfolio__item');
        var idx = visibleItems.indexOf(item);
        var lightboxItems = visibleItems.map(function (el) {
          var img = qs('img', el);
          var artId = el.dataset.artId;
          var artwork = allArtwork.find(function (a) { return a.id === artId; });
          return { src: artwork ? imgSrc(artwork) : img.src, alt: img.alt, id: artId };
        });
        openLightbox(idx, lightboxItems);
      });
    });
  }

  /* --- Load artwork.json and initialize --- */
  function initFromManifest(artwork) {
    allArtwork = artwork;
    heroArtwork = selectHeroArtwork(artwork);

    galleryData = heroArtwork.map(function (a) {
      return { src: imgSrc(a), alt: a.title, id: a.id };
    });

    buildDesktopGallery(heroArtwork);
    buildMobileCardStack(heroArtwork);
    renderPortfolioPage();
    initDesktop3dGallery();
    initMobileCardStack();
    attachShimmer();
  }

  fetch('artwork.json')
    .then(function (r) { return r.json(); })
    .then(initFromManifest)
    .catch(function () {
      var fallback = [
        { id: 'placeholder', file: 'gallery-1', title: 'Artwork', category: 'fantasy', year: 2020, featured: true }
      ];
      initFromManifest(fallback);
    });

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
  function initDesktop3dGallery() {
  var gallery3d = qs('#gallery3d');
  if (!gallery3d) return;
  var items = qsa('.gallery3d__item');
  if (!items.length) return;
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
          openLightbox(idx, galleryData.map(function (g) {
            return { src: g.src, alt: g.alt, id: g.id };
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
  function initMobileCardStack() {
  var cardStack = qs('#cardStack');
  if (!cardStack) return;
  var cards = qsa('.card-stack__card');
  if (!cards.length) return;
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
     PORTFOLIO FILTERS + LOAD MORE
     ========================================== */
  qsa('.portfolio__filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      qsa('.portfolio__filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      portfolioPage = 0;
      renderPortfolioPage();
    });
  });

  var loadMoreBtn = qs('#loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      portfolioPage++;
      renderPortfolioPage();
    });
  }

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
    if (item.id) recordView(item.id);
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
     BEFORE/AFTER COMPARE SLIDER
     ========================================== */
  var compare = qs('#processCompare');
  if (compare) {
    var sketchLayer = qs('#processSketchLayer');
    var handle = qs('#processHandle');
    var dragging = false;

    function setComparePosition(pct) {
      pct = Math.max(2, Math.min(pct, 98));
      sketchLayer.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
    }

    function getPercent(clientX) {
      var rect = compare.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    compare.addEventListener('mousedown', function (e) {
      dragging = true;
      setComparePosition(getPercent(e.clientX));
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      setComparePosition(getPercent(e.clientX));
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    compare.addEventListener('touchstart', function (e) {
      dragging = true;
      if (e.touches.length) setComparePosition(getPercent(e.touches[0].clientX));
    }, { passive: true });
    compare.addEventListener('touchmove', function (e) {
      if (!dragging || !e.touches.length) return;
      setComparePosition(getPercent(e.touches[0].clientX));
    }, { passive: true });
    compare.addEventListener('touchend', function () { dragging = false; }, { passive: true });
  }

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
     SCROLL REVEAL (re-attachable for dynamic content)
     ========================================== */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  var staggerObserver = new IntersectionObserver(function (entries) {
    var newVisible = entries.filter(function (e) { return e.isIntersecting && !e.target.classList.contains('visible'); });
    newVisible.forEach(function (entry, i) {
      setTimeout(function () {
        entry.target.classList.add('visible');
      }, i * 60);
      staggerObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  function observeReveals() {
    qsa('.portfolio__item.reveal:not(.visible)').forEach(function (el) {
      staggerObserver.observe(el);
    });
  }

  qsa('.section-header, .process__story, .about__content, .about__awards, .about__work-highlights, .contact__content').forEach(function (el) {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* ==========================================
     IMAGE LOAD SHIMMER (re-attachable)
     ========================================== */
  function attachShimmer() {
    qsa('.portfolio__item, .gallery3d__frame, .card-stack__card, .process__compare, .about__photo').forEach(function (el) {
      if (el.classList.contains('img-loading') || el.classList.contains('img-loaded')) return;
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
  }

  attachShimmer();

})();
