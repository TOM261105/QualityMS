/* ── CATEGORÍAS DINÁMICAS DE TIENDA ─────────────────────── */

const dynamicCategoriesGrid = document.getElementById("dynamicCategoriesGrid");
const dynamicCategoryCount = document.getElementById("dynamicCategoryCount");

let currentStoreCollections = [];

function getCurrentStoreLanguage() {
  const storedLang =
    localStorage.getItem("qmsLang") ||
    localStorage.getItem("siteLang") ||
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    localStorage.getItem("currentLang") ||
    "";

  const cleanStoredLang = String(storedLang).toLowerCase().trim();

  if (cleanStoredLang === "en" || cleanStoredLang === "english") return "en";
  if (cleanStoredLang === "es" || cleanStoredLang === "spanish" || cleanStoredLang === "español") return "es";

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

function getStoreText(es, en) {
  return getCurrentStoreLanguage() === "en" ? en : es;
}

function translateCategoryTitle(title) {
  const currentLang = getCurrentStoreLanguage();

  if (!title) return currentLang === "en" ? "General" : "General";

  let translated = title;

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
    ["Nutrición", "Nutrition"]
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
    ["Nutrition", "Nutrición"]
  ];

  const replacements = currentLang === "en"
    ? replacementsToEnglish
    : replacementsToSpanish;

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

  let translated = description;

  const replacementsToEnglish = [
    ["Explora los productos disponibles en esta categoría.", "Explore the products available in this category."],
    ["Explora los productos disponibles en esta categoría", "Explore the products available in this category"],
    ["Explora los productos disponibles", "Explore the available products"],
    ["en esta categoría", "in this category"],
    ["productos disponibles", "available products"],
    ["categoría", "category"]
  ];

  const replacementsToSpanish = [
    ["Explore the products available in this category.", "Explora los productos disponibles en esta categoría."],
    ["Explore the products available in this category", "Explora los productos disponibles en esta categoría"],
    ["Explore the available products", "Explora los productos disponibles"],
    ["in this category", "en esta categoría"],
    ["available products", "productos disponibles"],
    ["category", "categoría"]
  ];

  const replacements = currentLang === "en"
    ? replacementsToEnglish
    : replacementsToSpanish;

  replacements.forEach(([from, to]) => {
    translated = translated.replace(new RegExp(from, "gi"), to);
  });

  return translated;
}

function countDemoProductsByCategory(handle) {
  if (typeof DEMO_PRODUCTS === "undefined") return 0;

  return DEMO_PRODUCTS.filter(product => product.category === handle).length;
}

function renderCategories(collections) {
  if (!dynamicCategoriesGrid) return;

  currentStoreCollections = collections || [];

  if (!collections || collections.length === 0) {
    dynamicCategoriesGrid.innerHTML = `
      <div class="empty-products">
        ${getStoreText("No hay categorías disponibles.", "No categories available.")}
      </div>
    `;
    return;
  }

  if (dynamicCategoryCount) {
    dynamicCategoryCount.textContent = collections.length;
  }

  dynamicCategoriesGrid.innerHTML = collections.map(collection => {
    const productCount = isShopifyReady()
      ? getStoreText("Ver productos", "View products")
      : `+${countDemoProductsByCategory(collection.handle)} ${getStoreText("productos", "products")}`;

    const categoryUrl = `categoria.html?cat=${encodeURIComponent(collection.handle)}`;
    const categoryTitle = translateCategoryTitle(collection.title);
    const categoryDescription = translateCategoryDescription(collection.description);

    return `
      <article class="product-card" data-href="${categoryUrl}">
        <div class="pc-img">
          <img 
            src="${collection.image || "assets/product-placeholder.png"}" 
            alt="${collection.altText || categoryTitle}"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="pc-body">
          <h3>${categoryTitle}</h3>

          <p>
            ${categoryDescription}
          </p>
        </div>

        <div class="pc-footer">
          <span class="pc-count">${productCount}</span>

          <a href="${categoryUrl}" class="btn-card">
            ${getStoreText("Ver catálogo →", "View catalog →")}
          </a>
        </div>
      </article>
    `;
  }).join("");

  makeCategoryCardsClickable();
}

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

async function loadStoreCategories() {
  if (!dynamicCategoriesGrid) return;

  dynamicCategoriesGrid.innerHTML = `
    <div class="empty-products">
      ${getStoreText("Cargando categorías...", "Loading categories...")}
    </div>
  `;

  try {
    const collections = await getStoreCollections();
    renderCategories(collections);
  } catch (error) {
    console.error(error);
    renderCategories(getDemoCollections());
  }
}

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    renderCategories(currentStoreCollections);
  }, 250);
});

loadStoreCategories();
