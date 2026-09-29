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

  const htmlLang = document.documentElement.lang || "";
  const pageText = document.body.innerText || "";

  const langText = `${storedLang} ${htmlLang} ${pageText}`.toLowerCase();

  if (
    langText.includes("product categories") ||
    langText.includes("browse by section") ||
    langText.includes("visual catalog") ||
    langText.includes("products to quote") ||
    langText.includes("en")
  ) {
    return "en";
  }

  return "es";
}

function getStoreText(es, en) {
  return getCurrentStoreLanguage() === "en" ? en : es;
}

function translateCategoryTitle(title) {
  if (getCurrentStoreLanguage() !== "en") return title || "General";

  let translated = title || "General";

  const replacements = [
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

  replacements.forEach(([es, en]) => {
    translated = translated.replace(new RegExp(es, "gi"), en);
  });

  return translated;
}

function translateCategoryDescription(description) {
  if (getCurrentStoreLanguage() !== "en") {
    return description || "Explora los productos disponibles en esta categoría.";
  }

  if (!description) {
    return "Explore the products available in this category.";
  }

  let translated = description;

  const replacements = [
    ["Explora los productos disponibles en esta categoría.", "Explore the products available in this category."],
    ["Explora los productos disponibles en esta categoría", "Explore the products available in this category"],
    ["Explora los productos disponibles", "Explore the available products"],
    ["en esta categoría", "in this category"],
    ["productos disponibles", "available products"],
    ["categoría", "category"]
  ];

  replacements.forEach(([es, en]) => {
    translated = translated.replace(new RegExp(es, "gi"), en);
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
  }, 200);
});

loadStoreCategories();
