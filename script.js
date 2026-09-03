/* ══════════════════════════════════════════════════════════
   INTERRUPTOR: TIENDA EN MANTENIMIENTO
   
   true  = la tienda está CERRADA (nadie puede entrar)
   false = la tienda está ABIERTA (funciona normal)
   
   Para reabrir: cambia true por false, sube el archivo
   y súbele el número al ?v= en tus HTML.
   ══════════════════════════════════════════════════════════ */

const TIENDA_CERRADA = true;

/* Fecha estimada de regreso. Déjalo como "" si no quieres mostrarla. */
const TIENDA_REGRESA = "";


// Animaciones al hacer scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      io.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: "0px 0px -30px 0px"
});

document.querySelectorAll(".reveal").forEach(element => {
  io.observe(element);
});


// Cambio de idioma ES / EN
const langToggle = document.getElementById("langToggle");

function setLanguage(lang) {
  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-es], [data-en]").forEach(element => {
    const text = element.getAttribute(`data-${lang}`);

    if (text) {
      element.textContent = text;
    }
  });

  document.querySelectorAll("[data-es-html], [data-en-html]").forEach(element => {
    const html = element.getAttribute(`data-${lang}-html`);

    if (html) {
      element.innerHTML = html;
    }
  });

  document.querySelectorAll("[data-es-placeholder], [data-en-placeholder]").forEach(element => {
    const placeholder = element.getAttribute(`data-${lang}-placeholder`);

    if (placeholder) {
      element.setAttribute("placeholder", placeholder);
    }
  });

  if (langToggle) {
    langToggle.textContent = lang === "es" ? "ES / EN" : "EN / ES";
  }
}

const savedLang = localStorage.getItem("siteLang") || "es";
setLanguage(savedLang);

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const currentLang = localStorage.getItem("siteLang") || "es";
    const newLang = currentLang === "es" ? "en" : "es";

    setLanguage(newLang);
  });
}

// Abrir/cerrar tarjetas de Misión, Visión y Objetivos
document.addEventListener("DOMContentLoaded", () => {
  const archCards = document.querySelectorAll(".arch-card");

  archCards.forEach(card => {
    const toggleCard = () => {
      const isActive = card.classList.contains("active");

      archCards.forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-expanded", "false");
      });

      if (!isActive) {
        card.classList.add("active");
        card.setAttribute("aria-expanded", "true");
      }
    };

    card.addEventListener("click", toggleCard);

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCard();
      }
    });
  });
});

/* ── POP-UP ESPECIALISTA MÉDICO ───────────────────────────── */

const medicalPopup = document.getElementById("medicalPopup");
const medicalYes = document.getElementById("medicalYes");
const medicalNo = document.getElementById("medicalNo");

const protectedStorePages = [
  "tienda.html",
  "categoria.html",
  "productos.html",
  "lista-productos.html",
  "producto.html"
];

function getCurrentPageName() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf("/") + 1);
  return page || "index.html";
}

function isStorePage() {
  return protectedStorePages.includes(getCurrentPageName());
}

function wasPageReloaded() {
  const navEntries = performance.getEntriesByType("navigation");

  if (navEntries.length > 0) {
    return navEntries[0].type === "reload";
  }

  return performance.navigation && performance.navigation.type === 1;
}

if (wasPageReloaded()) {
  sessionStorage.removeItem("medicalSpecialist");
}

function blockStoreAccess() {
  const mainContent = document.querySelector("main") || document.querySelector("section") || document.body;

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

/* ══════════════════════════════════════════════════════════
   TIENDA EN MANTENIMIENTO
   ══════════════════════════════════════════════════════════ */

/* true solo si el interruptor está encendido Y estamos en una página de tienda */
const tiendaEnMantenimiento = TIENDA_CERRADA && isStorePage();

const textosMantenimiento = {
  es: {
    eyebrow: "Aviso temporal",
    titulo: "Tienda en mantenimiento",
    texto: "Estamos actualizando nuestro catálogo de productos. La tienda en línea volverá a estar disponible muy pronto.",
    mientras: "Mientras tanto, puedes escribirnos y con gusto te atendemos por teléfono o correo.",
    regresa: "Volvemos el",
    btnContacto: "Solicitar cotización",
    btnInicio: "Volver al inicio",
    modalTexto: "La tienda en línea está temporalmente cerrada por mantenimiento. Volverá a estar disponible muy pronto.",
    modalBtn: "Entendido",
    navBadge: "En mantenimiento"
  },
  en: {
    eyebrow: "Temporary notice",
    titulo: "Store under maintenance",
    texto: "We are updating our product catalog. The online store will be available again very soon.",
    mientras: "In the meantime, feel free to contact us by phone or email.",
    regresa: "Back on",
    btnContacto: "Request a quote",
    btnInicio: "Back to home",
    modalTexto: "The online store is temporarily closed for maintenance. It will be available again very soon.",
    modalBtn: "Got it",
    navBadge: "Under maintenance"
  }
};

function textosMant() {
  const lang = localStorage.getItem("siteLang") || "es";
  return textosMantenimiento[lang] || textosMantenimiento.es;
}

/* Bloquea por completo la página de tienda */
function mostrarTiendaCerrada() {
  const t = textosMant();

  /* Quita el carrito y sus overlays */
  ["cartDrawer", "cartOverlay", "cartOpenBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  /* Quita los pop-ups que estorbarían encima del aviso */
  ["medicalPopup", "purchaseSecurityPopup"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  document.body.style.overflow = "";

  /* Reemplaza el contenido principal por el aviso */
  const mainContent =
    document.querySelector("main") ||
    document.querySelector("section") ||
    document.body;

  const fecha = TIENDA_REGRESA
    ? `<p class="mant-fecha">${t.regresa} <strong>${TIENDA_REGRESA}</strong></p>`
    : "";

  mainContent.outerHTML = `
    <section class="mant-section">
      <div class="mant-card">
        <div class="mant-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9"/>
            <polyline points="12 7 12 12 15.5 14"/>
          </svg>
        </div>

        <span class="mant-eyebrow">${t.eyebrow}</span>
        <h1>${t.titulo}</h1>
        <p>${t.texto}</p>
        ${fecha}
        <p class="mant-mientras">${t.mientras}</p>

        <div class="mant-actions">
          <a href="contacto.html" class="mant-btn primary">${t.btnContacto}</a>
          <a href="index.html" class="mant-btn ghost">${t.btnInicio}</a>
        </div>

        <div class="mant-contacto">
          <a href="mailto:contacto@qualityms.com.mx">contacto@qualityms.com.mx</a>
          <a href="tel:5555147815">55-55-14-78-15</a>
        </div>
      </div>
    </section>
  `;
}

/* Modal de aviso cuando alguien hace clic en un link de tienda desde otra página */
function mostrarAvisoTienda() {
  if (document.getElementById("mantPopup")) return;

  const t = textosMant();

  const popup = document.createElement("div");
  popup.id = "mantPopup";
  popup.className = "mant-popup active";

  popup.innerHTML = `
    <div class="mant-popup-card">
      <div class="mant-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <polyline points="12 7 12 12 15.5 14"/>
        </svg>
      </div>

      <h2>${t.titulo}</h2>
      <p>${t.modalTexto}</p>

      <div class="mant-actions">
        <a href="contacto.html" class="mant-btn primary">${t.btnContacto}</a>
        <button type="button" class="mant-btn ghost" id="mantPopupClose">${t.modalBtn}</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
  document.body.style.overflow = "hidden";

  const cerrar = () => {
    popup.remove();
    document.body.style.overflow = "";
  };

  popup.querySelector("#mantPopupClose").addEventListener("click", cerrar);

  popup.addEventListener("click", event => {
    if (event.target === popup) cerrar();
  });

  document.addEventListener("keydown", function escHandler(event) {
    if (event.key === "Escape") {
      cerrar();
      document.removeEventListener("keydown", escHandler);
    }
  });
}

/* Intercepta todos los links que llevan a la tienda */
function bloquearLinksDeTienda() {
  const selector = protectedStorePages
    .map(page => `a[href*="${page}"]`)
    .join(", ");

  document.querySelectorAll(selector).forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      mostrarAvisoTienda();
    });
  });

  /* Marca el botón del menú como no disponible */
  const t = textosMant();

  document.querySelectorAll('.nav-links a[href*="tienda.html"]').forEach(link => {
    link.classList.add("nav-mantenimiento");
    link.setAttribute("title", t.navBadge);
  });
}

if (TIENDA_CERRADA) {
  if (tiendaEnMantenimiento) {
    mostrarTiendaCerrada();
  }

  bloquearLinksDeTienda();
}

/* ── FIN TIENDA EN MANTENIMIENTO ─────────────────────────── */

function checkMedicalAccess() {
  const medicalAccess = sessionStorage.getItem("medicalSpecialist");

  if (!medicalAccess && medicalPopup) {
    medicalPopup.classList.add("active");
    document.body.style.overflow = "hidden";
    return;
  }

  if (medicalAccess === "no" && isStorePage()) {
    blockStoreAccess();
  }
}

if (medicalYes) {
  medicalYes.addEventListener("click", () => {
    sessionStorage.setItem("medicalSpecialist", "yes");

    if (medicalPopup) {
      medicalPopup.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

if (medicalNo) {
  medicalNo.addEventListener("click", () => {
    sessionStorage.setItem("medicalSpecialist", "no");

    if (medicalPopup) {
      medicalPopup.classList.remove("active");
      document.body.style.overflow = "";
    }

    if (isStorePage()) {
      blockStoreAccess();
    }
  });
}

document.querySelectorAll('a[href*="tienda.html"], a[href*="categoria.html"], a[href*="productos.html"], a[href*="lista-productos.html"], a[href*="producto.html"]').forEach(link => {
  link.addEventListener("click", event => {
    if (TIENDA_CERRADA) return;

    const medicalAccess = sessionStorage.getItem("medicalSpecialist");

    if (medicalAccess === "no") {
      event.preventDefault();
      alert("La tienda en línea está disponible únicamente para especialistas médicos o profesionales de la salud.");
    }
  });
});

if (!tiendaEnMantenimiento) {
  checkMedicalAccess();
}

/* ── POP-UP SEGURIDAD DE COMPRA ───────────────────────────── */

const purchaseSecurityPopup = document.getElementById("purchaseSecurityPopup");
const purchaseSecurityOk = document.getElementById("purchaseSecurityOk");

let purchaseSecurityShownThisLoad = false;

function isPurchaseSecurityPage() {
  const storePages = [
    "tienda.html",
    "categoria.html",
    "productos.html",
    "lista-productos.html",
    "producto.html"
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  return storePages.includes(currentPage);
}

function showPurchaseSecurityNotice() {
  if (tiendaEnMantenimiento) return;
  if (!isPurchaseSecurityPage()) return;
  if (!purchaseSecurityPopup) return;
  if (purchaseSecurityShownThisLoad) return;

  purchaseSecurityShownThisLoad = true;
  purchaseSecurityPopup.classList.add("active");
  document.body.style.overflow = "hidden";
}

function showPurchaseSecurityAfterMedicalPopup() {
  if (tiendaEnMantenimiento) return;
  if (!isPurchaseSecurityPage()) return;
  if (!purchaseSecurityPopup) return;

  const medicalIsOpen =
    typeof medicalPopup !== "undefined" &&
    medicalPopup &&
    medicalPopup.classList.contains("active");

  if (medicalIsOpen) return;

  showPurchaseSecurityNotice();
}

function closePurchaseSecurityNotice() {
  if (purchaseSecurityPopup) {
    purchaseSecurityPopup.classList.remove("active");
    document.body.style.overflow = "";
  }
}

if (purchaseSecurityOk) {
  purchaseSecurityOk.addEventListener("click", closePurchaseSecurityNotice);
}

/* Si el usuario confirma el primer popup, después aparece el de seguridad */
if (typeof medicalYes !== "undefined" && medicalYes) {
  medicalYes.addEventListener("click", () => {
    setTimeout(showPurchaseSecurityAfterMedicalPopup, 180);
  });
}

/* Cada carga o hard refresh vuelve a mostrarlo */
window.addEventListener("load", () => {
  setTimeout(showPurchaseSecurityAfterMedicalPopup, 350);
});

/* También si la página vuelve desde caché del navegador */
window.addEventListener("pageshow", () => {
  setTimeout(showPurchaseSecurityAfterMedicalPopup, 350);
});

/* ── MARCAR PÁGINA ACTIVA EN EL MENÚ ─────────────────────── */

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach(link => {
    link.classList.remove("active");

    const linkPage = link.getAttribute("href");

    if (currentPage === "index.html" && linkPage === "index.html") {
      link.classList.add("active");
    }

    if (currentPage === "distribuidores.html" && linkPage === "distribuidores.html") {
      link.classList.add("active");
    }

    if (currentPage === "soporte.html" && linkPage === "soporte.html") {
      link.classList.add("active");
    }

    if (currentPage === "contacto.html" && linkPage === "contacto.html") {
      link.classList.add("active");
    }

    const storePages = [
      "tienda.html",
      "categoria.html",
      "productos.html",
      "lista-productos.html",
      "producto.html"
    ];

    if (storePages.includes(currentPage) && linkPage === "tienda.html") {
      link.classList.add("active");
    }
  });
}

/* ── LINKS DE REDES SOCIALES ─────────────────────────────── */

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

/* ── PROBLEMAS FRECUENTES SMOOTH ─────────────────────────── */

const faqToggleBtn = document.getElementById("faqToggleBtn");
const faqPanel = document.getElementById("faqPanel");

if (faqToggleBtn && faqPanel) {
  faqToggleBtn.addEventListener("click", () => {
    faqPanel.classList.toggle("active");

    if (faqPanel.classList.contains("active")) {
      setTimeout(() => {
        faqPanel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 180);
    }
  });
}

document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const faqItem = button.closest(".faq-item");

    if (!faqItem) return;

    const isActive = faqItem.classList.contains("active");

    document.querySelectorAll(".faq-item").forEach(item => {
      item.classList.remove("active");

      const icon = item.querySelector(".faq-question strong");
      if (icon) icon.textContent = "+";
    });

    if (!isActive) {
      faqItem.classList.add("active");

      const icon = button.querySelector("strong");
      if (icon) icon.textContent = "−";
    }
  });
});
