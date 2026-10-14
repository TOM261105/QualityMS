/* ── CATEGORÍAS DINÁMICAS DE TIENDA ─────────────────────── */

const dynamicCategoriesGrid = document.getElementById("dynamicCategoriesGrid");
const dynamicCategoryCount = document.getElementById("dynamicCategoryCount");

let currentStoreCollections = [];

/* ── IDIOMA ACTUAL ───────────────────────────────────────── */

function getCurrentStoreLanguage() {
  const possibleValues = [
    localStorage.getItem("siteLang"),
    localStorage.getItem("qmsLang"),
    localStorage.getItem("language"),
    localStorage.getItem("lang"),
    localStorage.getItem("currentLang")
  ];

  for (const value of possibleValues) {
    const cleanValue = String(value || "").toLowerCase().trim();

    if (cleanValue === "en" || cleanValue === "english") return "en";
    if (cleanValue === "es" || cleanValue === "spanish" || cleanValue === "español") return "es";
  }

  const htmlLang = String(document.documentElement.lang || "").toLowerCase().trim();

  if (htmlLang.startsWith("en")) return "en";
  if (htmlLang.startsWith("es")) return "es";

  const visualCatalogBtn = document.querySelector('a[href="productos.html"]')?.textContent.trim().toLowerCase() || "";
  const productListBtn = document.querySelector('a[href="lista-productos.html"]')?.textContent.trim().toLowerCase() || "";
  const categoriesTitle = document.querySelector(".categories-title-block h3")?.textContent.trim().toLowerCase() || "";
  const sectionTitle = document.querySelector(".section-header h2")?.textContent.trim().toLowerCase() || "";

  if (
    visualCatalogBtn.includes("visual catalog") ||
    productListBtn.includes("product list") ||
    categoriesTitle.includes("product categories") ||
    sectionTitle.includes("all the medical equipment")
  ) {
    return "en";
  }

  return "es";
}

function syncStoreLanguage() {
  const lang = getCurrentStoreLanguage();

  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  return lang;
}

/*
  Importante:
  No usamos el nombre getStoreText aquí porque ese nombre ya lo usa
  product-translations.js para textos de productos.
*/
function getStorePageText(es, en) {
  return getCurrentStoreLanguage() === "en" ? en : es;
}

/* ── UTILIDADES ───────────────────────────────────────── */

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, char => {
    const chars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return chars[char];
  });
}

/* ── TRADUCCIÓN DE CATEGORÍAS ────────────────────────────── */

function translateCategoryTitle(title) {
  const currentLang = getCurrentStoreLanguage();

  if (!title) return "General";

  let translated = String(title);

  const replacementsToEnglish = [
    ["Audiología y timpanometría", "Audiology and tympanometry"],
    ["Cables, conectores y accesorios", "Cables, connectors and accessories"],
    ["Electrocardiografía y accesorios", "Electrocardiography and accessories"],
    ["Estetoscopios y accesorios", "Stethoscopes and accessories"],
    ["Diagnóstico", "Diagnostics"],
    ["Mobiliario", "Medical furniture"],
    ["Monitoreo", "Monitoring"],
    ["Emergencias", "Emergency"],
    ["Mujer", "Women’s health"],
    ["Especialidades", "Specialties"],
    ["Bienestar", "Wellness"],
    ["Nutrición", "Nutrition"],
    ["General", "General"]
  ];

  const replacementsToSpanish = [
    ["Audiology and tympanometry", "Audiología y timpanometría"],
    ["Cables, connectors and accessories", "Cables, conectores y accesorios"],
    ["Electrocardiography and accessories", "Electrocardiografía y accesorios"],
    ["Stethoscopes and accessories", "Estetoscopios y accesorios"],
    ["Diagnostics", "Diagnóstico"],
    ["Medical furniture", "Mobiliario"],
    ["Monitoring", "Monitoreo"],
    ["Emergency", "Emergencias"],
    ["Women’s health", "Mujer"],
    ["Specialties", "Especialidades"],
    ["Wellness", "Bienestar"],
    ["Nutrition", "Nutrición"],
    ["General", "General"]
  ];

  const replacements = currentLang === "en" ? replacementsToEnglish : replacementsToSpanish;

  replacements.forEach(([from, to]) => {
    translated = translated.replace(new RegExp(from, "gi"), to);
  });

  return translated;
}

function translateCategoryDescription(description) {
  const currentLang = getCurrentStoreLanguage();

  if (!description) {
    return currentLang === "en"
      ? "Explore the products available in this category."
      : "Explora los productos disponibles en esta categoría.";
  }

  let translated = String(description);

  const replacementsToEnglish = [
    ["Explora los productos disponibles en esta categoría.", "Explore the products available in this category."],
    ["Explora los productos disponibles en esta categoría", "Explore the products available in this category"],
    ["Explora los productos disponibles", "Explore the available products"],
    ["Productos de", "Products from"],
    ["productos de", "products from"],
    ["en esta categoría", "in this category"],
    ["productos disponibles", "available products"],
    ["categoría", "category"]
  ];

  const replacementsToSpanish = [
    ["Explore the products available in this category.", "Explora los productos disponibles en esta categoría."],
    ["Explore the products available in this category", "Explora los productos disponibles en esta categoría"],
    ["Explore the available products", "Explora los productos disponibles"],
    ["Products from", "Productos de"],
    ["products from", "productos de"],
    ["in this category", "en esta categoría"],
    ["available products", "productos disponibles"],
    ["category", "categoría"]
  ];

  const replacements = currentLang === "en" ? replacementsToEnglish : replacementsToSpanish;

  replacements.forEach(([from, to]) => {
    translated = translated.replace(new RegExp(from, "gi"), to);
  });

  return translated;
}

/* ── PRODUCTOS DEMO ──────────────────────────────────────── */

function countDemoProductsByCategory(handle) {
  if (typeof DEMO_PRODUCTS === "undefined") return 0;

  return DEMO_PRODUCTS.filter(product => product.category === handle).length;
}

/* ── RENDER DE CATEGORÍAS ────────────────────────────────── */

function renderCategories(collections) {
  syncStoreLanguage();

  if (!dynamicCategoriesGrid) return;

  currentStoreCollections = collections || [];

  if (!collections || collections.length === 0) {
    dynamicCategoriesGrid.innerHTML = `
      <div class="empty-products">
        ${getStorePageText("No hay categorías disponibles.", "No categories available.")}
      </div>
    `;
    return;
  }

  if (dynamicCategoryCount) {
    dynamicCategoryCount.textContent = collections.length;
  }

  dynamicCategoriesGrid.innerHTML = collections.map(collection => {
    const shopifyReady =
      typeof isShopifyReady === "function" &&
      isShopifyReady();

    const productCount = shopifyReady
      ? getStorePageText("Ver productos", "View products")
      : `+${countDemoProductsByCategory(collection.handle)} ${getStorePageText("productos", "products")}`;

    const categoryUrl = `categoria.html?cat=${encodeURIComponent(collection.handle)}`;
    const categoryTitle = translateCategoryTitle(collection.title);
    const categoryDescription = translateCategoryDescription(collection.description);

    return `
      <article class="product-card" data-href="${categoryUrl}">
        <div class="pc-img">
          <img 
            src="${escapeHTML(collection.image || "assets/product-placeholder.png")}" 
            alt="${escapeHTML(collection.altText || categoryTitle)}"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="pc-body">
          <h3>${escapeHTML(categoryTitle)}</h3>
          <p>${escapeHTML(categoryDescription)}</p>
        </div>

        <div class="pc-footer">
          <span class="pc-count">${productCount}</span>

          <a href="${categoryUrl}" class="btn-card">
            ${getStorePageText("Ver catálogo →", "View catalog →")}
          </a>
        </div>
      </article>
    `;
  }).join("");

  makeCategoryCardsClickable();

  setTimeout(() => {
    if (typeof window.applyFinalStoreTranslations === "function") {
      window.applyFinalStoreTranslations();
    }

    if (typeof window.applyStoreTranslations === "function") {
      window.applyStoreTranslations();
    }
  }, 100);
}

/* ── CLIC EN TARJETAS ────────────────────────────────────── */

function makeCategoryCardsClickable() {
  document.querySelectorAll(".equipo-section .product-card").forEach(card => {
    const href = card.dataset.href;

    if (!href) return;

    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    card.addEventListener("click", event => {
      if (event.target.closest("a, button")) return;
      window.location.href = href;
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = href;
      }
    });
  });
}

/* ── CARGA DE CATEGORÍAS ─────────────────────────────────── */

async function loadStoreCategories() {
  syncStoreLanguage();

  if (!dynamicCategoriesGrid) return;

  dynamicCategoriesGrid.innerHTML = `
    <div class="empty-products">
      ${getStorePageText("Cargando categorías...", "Loading categories...")}
    </div>
  `;

  try {
    const collections = await getStoreCollections();
    renderCategories(collections);
  } catch (error) {
    console.error(error);

    if (typeof getDemoCollections === "function") {
      renderCategories(getDemoCollections());
    } else {
      renderCategories([]);
    }
  }
}

/* ── CAMBIO DE IDIOMA ────────────────────────────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    syncStoreLanguage();
    renderCategories(currentStoreCollections);
  }, 250);

  setTimeout(() => {
    syncStoreLanguage();
    renderCategories(currentStoreCollections);
  }, 700);
});

/* ── INICIAR ─────────────────────────────────────────────── */

loadStoreCategories();
