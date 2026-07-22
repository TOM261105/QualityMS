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

// Abrir/cerrar tarjetas de Misión, Visión y Objetivos
document.addEventListener("DOMContentLoaded", () => {
  const archCards = document.querySelectorAll(".arch-card");

  archCards.forEach((card) => {
    const toggleCard = () => {
      const isActive = card.classList.contains("active");

      archCards.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-expanded", "false");
      });

      if (!isActive) {
        card.classList.add("active");
        card.setAttribute("aria-expanded", "true");
      }
    };

    card.addEventListener("click", toggleCard);

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCard();
      }
    });
  });
});

/* ── POP-UP ESPECIALISTA MÉDICO ───────────────────────────── */

const medicalPopup = document.getElementById('medicalPopup');
const medicalYes = document.getElementById('medicalYes');
const medicalNo = document.getElementById('medicalNo');

const protectedStorePages = [
  'tienda.html',
  'categoria.html',
  'productos.html',
  'lista-productos.html',
  'producto.html'
];

function getCurrentPageName() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);
  return page || 'index.html';
}

function isStorePage() {
  return protectedStorePages.includes(getCurrentPageName());
}

/* Detecta si fue hard refresh o recarga */
function wasPageReloaded() {
  const navEntries = performance.getEntriesByType('navigation');

  if (navEntries.length > 0) {
    return navEntries[0].type === 'reload';
  }

  return performance.navigation && performance.navigation.type === 1;
}

/* Si hace hard refresh, vuelve a pedir confirmación */
if (wasPageReloaded()) {
  sessionStorage.removeItem('medicalSpecialist');
}

function blockStoreAccess() {
  const mainContent = document.querySelector('main') || document.body;

  mainContent.innerHTML = `
    <section class="store-locked">
      <div class="store-locked-card">
        <h1>Acceso restringido</h1>
        <p>
          La tienda en línea está disponible únicamente para especialistas médicos
          o profesionales de la salud.
        </p>
        <a href="contacto.html" class="btn-primary">Contactar a Quality MS</a>
      </div>
    </section>
  `;
}

function checkMedicalAccess() {
  const medicalAccess = sessionStorage.getItem('medicalSpecialist');

  if (!medicalAccess && medicalPopup) {
    medicalPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
    return;
  }

  if (medicalAccess === 'no' && isStorePage()) {
    blockStoreAccess();
  }
}

if (medicalYes) {
  medicalYes.addEventListener('click', () => {
    sessionStorage.setItem('medicalSpecialist', 'yes');

    if (medicalPopup) {
      medicalPopup.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

if (medicalNo) {
  medicalNo.addEventListener('click', () => {
    sessionStorage.setItem('medicalSpecialist', 'no');

    if (medicalPopup) {
      medicalPopup.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (isStorePage()) {
      blockStoreAccess();
    }
  });
}

/* Evita entrar a tienda si respondió que NO */
document.querySelectorAll('a[href*="tienda.html"], a[href*="categoria.html"], a[href*="productos.html"]').forEach(link => {
  link.addEventListener('click', event => {
    const medicalAccess = sessionStorage.getItem('medicalSpecialist');

    if (medicalAccess === 'no') {
      event.preventDefault();
      alert('La tienda en línea está disponible únicamente para especialistas médicos o profesionales de la salud.');
    }
  });
});

checkMedicalAccess();

/* ── MARCAR PÁGINA ACTIVA EN EL MENÚ ─────────────────────── */

function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    link.classList.remove('active');

    const linkPage = link.getAttribute('href');

    // Inicio / Conócenos
    if (currentPage === 'index.html' && linkPage === 'index.html') {
      link.classList.add('active');
    }

    // Distribuidores
    if (currentPage === 'distribuidores.html' && linkPage === 'distribuidores.html') {
      link.classList.add('active');
    }

    // Soporte
    if (currentPage === 'soporte.html' && linkPage === 'soporte.html') {
      link.classList.add('active');
    }

    // Contacto
    if (currentPage === 'contacto.html' && linkPage === 'contacto.html') {
      link.classList.add('active');
    }

    // Todas las páginas de tienda deben marcar "Tienda en línea"
    const storePages = [
      'tienda.html',
      'categoria.html',
      'productos.html',
      'lista-productos.html',
      'producto.html'
    ];

    if (storePages.includes(currentPage) && linkPage === 'tienda.html') {
      link.classList.add('active');
    }
  });
}
// Links de redes sociales (aplica en todas las páginas)
const socialLinks = {
  Instagram: "https://www.instagram.com/qualitymedicalservice/",
  YouTube: "https://www.youtube.com/channel/UCkZFxncboEjXPPjk5UjPAvg",
  X: "https://x.com/QualityMedical_",
  Facebook: "https://www.facebook.com/p/Quality-MS-100075618777480/"
};

document.querySelectorAll(".social-btn").forEach(link => {
  const network = link.getAttribute("aria-label");

  if (socialLinks[network]) {
    link.setAttribute("href", socialLinks[network]);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  }
});
setActiveNavLink();
