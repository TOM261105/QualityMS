// Animaciones al hacer scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -30px 0px'
});

document.querySelectorAll('.reveal').forEach(element => {
  io.observe(element);
});


// Cambio de idioma ES / EN
const langToggle = document.getElementById('langToggle');

function setLanguage(lang) {
  localStorage.setItem('siteLang', lang);
  document.documentElement.lang = lang;

  // Textos simples
  document.querySelectorAll('[data-es], [data-en]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);

    if (text) {
      element.textContent = text;
    }
  });

  // Textos con HTML interno
  document.querySelectorAll('[data-es-html], [data-en-html]').forEach(element => {
    const html = element.getAttribute(`data-${lang}-html`);

    if (html) {
      element.innerHTML = html;
    }
  });

  // Placeholders de inputs y textareas
  document.querySelectorAll('[data-es-placeholder], [data-en-placeholder]').forEach(element => {
    const placeholder = element.getAttribute(`data-${lang}-placeholder`);

    if (placeholder) {
      element.setAttribute('placeholder', placeholder);
    }
  });

  // Texto del botón
  if (langToggle) {
    langToggle.textContent = lang === 'es' ? 'ES / EN' : 'EN / ES';
  }
}

const savedLang = localStorage.getItem('siteLang') || 'es';
setLanguage(savedLang);

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const currentLang = localStorage.getItem('siteLang') || 'es';
    const newLang = currentLang === 'es' ? 'en' : 'es';

    setLanguage(newLang);
  });
}
