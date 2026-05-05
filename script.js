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
