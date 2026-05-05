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

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
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

  // ===== Smooth-Scroll Anchor-Links (mit Nav-Offset) =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = 80;
      const targetPos = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
    });
  });
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

    window.location.href = `mailto:hallo@solve-records.com?subject=${subject}&body=${body}`;

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
