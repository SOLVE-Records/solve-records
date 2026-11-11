/* ============================================================
   SOLVE RECORDS — JAVASCRIPT
   ============================================================ */

(function() {
  'use strict';

  // ===== Jahr im Footer =====
  document.getElementById('year').textContent = new Date().getFullYear();

  // ===== Sticky Nav Effekt beim Scrollen =====
  const nav = document.querySelector('.nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });

  // ===== Mobile Menu Toggle =====
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  function closeMenu() {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function openMenu() {
    navLinks.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu when clicking outside of it
  document.addEventListener('click', (e) => {
    if (
      navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close menu on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });

  // Close menu on window resize back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });

  // ===== Reveal Animations beim Scrollen =====
  const revealElements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Kleine Verzögerung pro Element für Cascade-Effekt
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 80);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));

  // ===== Anker-Ziel festhalten, solange das Layout sich noch setzt =====
  // Beim ersten Besuch kommen die Webfonts erst nach dem Sprung an; der Font-Swap
  // verschiebt alles unterhalb des Hero (#services ca. 50px, #kontakt ca. 125px).
  // Safari/iOS gleicht das nicht aus, Ziel landet daneben; mit Cache passt es.
  // Daher: nach Hash-Aufruf oder Anker-Klick das Ziel kurz "festhalten" und bei
  // jeder Layout-Änderung neu ausrichten, bis load + fonts.ready durch sind
  // (plus kurze Nachlaufzeit, max. 15 s). Abbruch, sobald der Nutzer selbst
  // scrollt/tippt. Offset weiterhin allein über scroll-padding-top.
  const pageSettled = new Promise(resolve => {
    const afterLoad = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(resolve);
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
  });

  let pin = null; // { target, top, smooth, idleTimer, endTimer }

  function docTop(el) {
    return el.getBoundingClientRect().top + window.pageYOffset;
  }

  function unpin() {
    if (!pin) return;
    clearTimeout(pin.idleTimer);
    clearTimeout(pin.endTimer);
    pin = null;
  }

  // Ziel hat sich im Dokument verschoben → neu ausrichten. Während der
  // Smooth-Animation eines Klicks wird die Animation neu angesetzt (kein Ruck),
  // danach sofort (ResizeObserver läuft vor dem Paint, die Korrektur ist unsichtbar).
  function realign() {
    if (!pin) return;
    const top = docTop(pin.target);
    if (Math.abs(top - pin.top) < 1) return;
    pin.top = top;
    pin.target.scrollIntoView(pin.smooth ? { behavior: 'smooth', block: 'start' } : { block: 'start' });
  }

  // Smooth-Scroll gilt als beendet, wenn 150 ms lang kein scroll-Event kam
  function armIdle() {
    if (!pin || !pin.smooth) return;
    clearTimeout(pin.idleTimer);
    pin.idleTimer = setTimeout(() => {
      if (!pin) return;
      pin.smooth = false;
      realign();
    }, 150);
  }

  function pinTo(target, smooth) {
    unpin();
    pin = { target, top: docTop(target), smooth, idleTimer: 0, endTimer: 0 };
    const p = pin;
    p.endTimer = setTimeout(() => { if (pin === p) unpin(); }, 15000);
    armIdle();
    pageSettled.then(() => {
      if (pin !== p) return;
      realign();
      if (!p.smooth) p.target.scrollIntoView({ block: 'start' });
      // Nachlauf für späte Font-Faces/Bilder
      setTimeout(() => { if (pin === p) unpin(); }, 1500);
    });
  }

  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev =>
    window.addEventListener(ev, unpin, { passive: true }));
  window.addEventListener('scroll', armIdle, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(realign).observe(document.body);
  }

  // ===== Smooth-Scroll Anchor-Links =====
  // Offset kommt allein aus html { scroll-padding-top } (styles.css, --header-h + --anchor-gap)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pinTo(target, true);
    });
  });

  // ===== Aufruf mit #anker (z. B. Rücklink ../#services) =====
  // Nicht bei Reload/Zurück: dort stellt der Browser die alte Scrollposition wieder her.
  if (location.hash.length > 1) {
    const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const navType = navEntry ? navEntry.type : 'navigate';
    let target = null;
    try { target = document.querySelector(decodeURIComponent(location.hash)); } catch (err) { /* ungültiger Selektor */ }
    if (target && navType !== 'reload' && navType !== 'back_forward') {
      pinTo(target, false);
    }
  }
})();

// ===== Form-Handling =====
function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('.form-submit');
  const originalText = submitBtn.textContent;

  // Daten sammeln
  const data = {
    name: form.name.value,
    email: form.email.value,
    projekt: form.projekt.value,
    nachricht: form.nachricht.value
  };

  // Hier könnte ein echter Form-Handler eingebaut werden
  // (Formspree, Netlify Forms, eigene Backend-API etc.)
  // Für jetzt: mailto-Fallback

  submitBtn.textContent = 'Wird gesendet…';
  submitBtn.disabled = true;

  setTimeout(() => {
    const subject = encodeURIComponent(`Booking-Anfrage von ${data.name}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\n` +
      `Email: ${data.email}\n` +
      `Projekt: ${data.projekt || 'nicht angegeben'}\n\n` +
      `Nachricht:\n${data.nachricht}`
    );

    window.location.href = `mailto:solfmichael5@gmail.com?subject=${subject}&body=${body}`;

    submitBtn.textContent = 'Email-Programm geöffnet ✓';
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      form.reset();
    }, 3000);
  }, 600);
}

// ============================================================
// LIGHTBOX (Galerie)
// ============================================================
(function() {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImage = lightbox.querySelector('.lightbox-image');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[index];
    const src = item.getAttribute('href');
    const caption = item.dataset.caption || '';
    const img = item.querySelector('img');
    const altText = img ? img.alt : '';

    lightboxImage.src = src;
    lightboxImage.alt = altText;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      lightboxImage.src = '';
    }, 300);
  }

  function navigate(delta) {
    const newIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    openLightbox(newIndex);
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));

  // Klick auf Hintergrund schließt
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Tastatur-Navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
})();
