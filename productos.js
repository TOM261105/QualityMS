/* ── TODOS LOS PRODUCTOS AGRUPADOS ───────────────────────── */

const allProductsContainer = document.getElementById("allProductsContainer");
const allProductsSearch = document.getElementById("allProductsSearch");

let allStoreProducts = [];
let allStoreCollections = [];

/* ── IDIOMA ───────────────────────────────────────── */

function getCurrentAllProductsLanguage() {
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

  return "es";
}

function syncAllProductsLanguage() {
  const lang = getCurrentAllProductsLanguage();

  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  return lang;
}

function getAllProductsText(es, en) {
  return getCurrentAllProductsLanguage() === "en" ? en : es;
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

function stripProductHTML(value) {
  const temp = document.createElement("div");
  temp.innerHTML = String(value || "");
  return temp.textContent.trim();
}

function normalizeProductText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™]/g, "")
    .replace(/\b(welch allyn|hillrom|hill-rom|midmark|seca|baxter|bovie|huntleigh|mortara|ritter)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function translateCategoryText(text) {
  if (getCurrentAllProductsLanguage() !== "en") return text || "General";

  let translated = text || "General";

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

/* ── TRADUCCIÓN DE PRODUCTOS ───────────────────────── */

function getTranslatedProduct(product) {
  if (!product) return product;

  const lang = syncAllProductsLanguage();

  if (typeof window.getTranslatedProductForCurrentLang === "function") {
    return window.getTranslatedProductForCurrentLang(product);
  }

  if (typeof window.getProductTranslationByProduct === "function") {
    const translation = window.getProductTranslationByProduct(product, lang);

    if (translation) {
      return {
        ...product,
        title: translation.title || product.title,
        shortDescription: translation.shortDescription || product.shortDescription,
        description: translation.description || product.description,
        descriptionHtml: translation.description || product.descriptionHtml || product.description,
        priceText: lang === "en" ? "Quote only" : "Bajo cotización",
        priceGeneral: lang === "en" ? "Quote only" : "Bajo cotización",
        availability: lang === "en" ? "Available for quote" : "Disponible para cotización"
      };
    }
  }

  if (typeof window.getProductTranslation === "function") {
    const translation = window.getProductTranslation(product.handle, lang);

    if (translation) {
      return {
        ...product,
        title: translation.title || product.title,
        shortDescription: translation.shortDescription || product.shortDescription,
        description: translation.description || product.description,
        descriptionHtml: translation.description || product.descriptionHtml || product.description,
        priceText: lang === "en" ? "Quote only" : "Bajo cotización",
        priceGeneral: lang === "en" ? "Quote only" : "Bajo cotización",
        availability: lang === "en" ? "Available for quote" : "Disponible para cotización"
      };
    }
  }

  if (window.PRODUCT_TRANSLATIONS) {
    const productCandidates = [
      product.handle,
      product.id,
      product.title,
      product.originalTitle,
      product.titleEs,
      product.titleEn
    ]
      .map(normalizeProductText)
      .filter(Boolean);

    for (const handle in window.PRODUCT_TRANSLATIONS) {
      const item = window.PRODUCT_TRANSLATIONS[handle];

      const translationCandidates = [
        handle,
        item?.es?.title,
        item?.en?.title
      ]
        .map(normalizeProductText)
        .filter(Boolean);

      const matched = productCandidates.some(productText => {
        return translationCandidates.some(translationText => {
          return (
            productText === translationText ||
            productText.includes(translationText) ||
            translationText.includes(productText)
          );
        });
      });

      if (matched) {
        const translation = item[lang] || item.es;

        return {
          ...product,
          title: translation.title || product.title,
          shortDescription: translation.shortDescription || product.shortDescription,
          description: translation.description || product.description,
          descriptionHtml: translation.description || product.descriptionHtml || product.description,
          priceText: lang === "en" ? "Quote only" : "Bajo cotización",
          priceGeneral: lang === "en" ? "Quote only" : "Bajo cotización",
          availability: lang === "en" ? "Available for quote" : "Disponible para cotización"
        };
      }
    }
  }

  return product;
}

function getProductPreviewDescription(product) {
  const translatedProduct = getTranslatedProduct(product);

  const description =
    translatedProduct?.shortDescription ||
    translatedProduct?.descripcionCorta ||
    translatedProduct?.description ||
    translatedProduct?.descriptionHtml ||
    "";

  if (String(description).trim()) {
    return stripProductHTML(description);
  }

  return getAllProductsText(
    "Sin descripción disponible.",
    "No description available."
  );
}

function refreshAllProductTranslationPatches() {
  setTimeout(() => {
    if (typeof window.applyFinalStoreTranslations === "function") {
      window.applyFinalStoreTranslations();
    }

    if (typeof window.applyStoreTranslations === "function") {
      window.applyStoreTranslations();
    }

    if (typeof window.translateVisibleProductDescriptions === "function") {
      window.translateVisibleProductDescriptions();
    }
  }, 100);
}

/* ── RENDER DE PRODUCTOS ───────────────────────── */

function renderProductCard(originalProduct) {
  const product = getTranslatedProduct(originalProduct);

  return `
    <article class="shopify-product-card">
      <div class="shopify-product-img">
        <span class="shopify-product-status">
          ${getAllProductsText("Bajo cotización", "Quote only")}
        </span>

        <img 
          src="${escapeHTML(product.image || "assets/preview-qms.png")}" 
          alt="${escapeHTML(product.imageAlt || product.title || "Producto médico")}"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="shopify-product-body">
        <p class="shopify-product-category">
          ${escapeHTML(translateCategoryText(product.categoryName || product.category || "General"))}
        </p>

        <h4 class="shopify-product-title">
          ${escapeHTML(product.title || getAllProductsText("Producto sin nombre", "Unnamed product"))}
        </h4>

        <p class="shopify-product-description">
          ${escapeHTML(getProductPreviewDescription(originalProduct))}
        </p>

        <div class="shopify-product-footer">
          <strong>${getAllProductsText("Bajo cotización", "Quote only")}</strong>
        </div>

        <div class="shopify-product-actions">
          <a href="${getProductDetailUrl(originalProduct, "productos.html")}" class="product-action light">
            ${getAllProductsText("Ver más información", "More information")}
          </a>

          <button class="product-action" type="button" data-add-id="${originalProduct.id}">
            ${getAllProductsText("Agregar a cotización", "Add to quote")}
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ── COLECCIONES / CATEGORÍAS ───────────────────────── */

function getCollectionInfo(handle) {
  return allStoreCollections.find(collection => collection.handle === handle) || {
    handle,
    title: handle === "general" ? "General" : handle,
    description: "",
    eyebrow: "Catálogo"
  };
}

function getOrderedCategoryHandles(products) {
  const productHandles = [...new Set(products.map(product => product.category || "general"))];

  const collectionHandles = allStoreCollections.map(collection => collection.handle);
  const orderedHandles = collectionHandles.filter(handle => productHandles.includes(handle));

  productHandles.forEach(handle => {
    if (!orderedHandles.includes(handle)) orderedHandles.push(handle);
  });

  return orderedHandles;
}

function renderAllProducts(products) {
  syncAllProductsLanguage();

  if (!allProductsContainer) return;

  if (!products || products.length === 0) {
    allProductsContainer.innerHTML = `
      <div class="empty-products">
        ${getAllProductsText("No se encontraron productos.", "No products found.")}
      </div>
    `;

    refreshAllProductTranslationPatches();
    return;
  }

  const categoryHandles = getOrderedCategoryHandles(products);

  const groupsHtml = categoryHandles.map(categoryHandle => {
    const categoryProducts = products.filter(product => (product.category || "general") === categoryHandle);

    if (categoryProducts.length === 0) return "";

    const info = getCollectionInfo(categoryHandle);
    const groupTitle = translateCategoryText(info.title || categoryHandle || "General");

    return `
      <section class="all-products-group">
        <div class="all-products-group-header">
          <div>
            <span>${getAllProductsText("Catálogo", "Catalog")}</span>
            <h3>${escapeHTML(groupTitle)}</h3>
          </div>

          <a href="categoria.html?cat=${encodeURIComponent(categoryHandle)}" class="group-link">
            ${getAllProductsText("Ver sección →", "View section →")}
          </a>
        </div>

        <div class="all-products-row">
          ${categoryProducts.map(product => renderProductCard(product)).join("")}
        </div>
      </section>
    `;
  }).join("");

  allProductsContainer.innerHTML = groupsHtml;
  refreshAllProductTranslationPatches();
}

/* ── BUSCADOR ───────────────────────── */

function filterAllProducts() {
  if (!allProductsSearch) return;

  const searchTerm = allProductsSearch.value.toLowerCase().trim();

  const filteredProducts = allStoreProducts.filter(product => {
    const translatedProduct = getTranslatedProduct(product);

    const searchableText = `
      ${translatedProduct.title || ""}
      ${translatedProduct.shortDescription || ""}
      ${translatedProduct.description || ""}
      ${translatedProduct.descriptionHtml || ""}
      ${translatedProduct.categoryName || ""}
      ${translatedProduct.category || ""}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderAllProducts(filteredProducts);
}

if (allProductsSearch) {
  allProductsSearch.addEventListener("input", filterAllProducts);
}

/* ── AGREGAR A COTIZACIÓN ───────────────────────── */

if (allProductsContainer) {
  allProductsContainer.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");

    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const originalProduct = allStoreProducts.find(item => item.id === productId);

    if (!originalProduct) return;

    const translatedProduct = getTranslatedProduct(originalProduct);

    if (typeof addToCart === "function") {
      addToCart(translatedProduct);
    }
  });
}

/* ── CARGAR PÁGINA ───────────────────────── */

async function loadAllProductsPage() {
  syncAllProductsLanguage();

  if (allProductsContainer) {
    allProductsContainer.innerHTML = `
      <div class="empty-products">
        ${getAllProductsText("Cargando productos...", "Loading products...")}
      </div>
    `;
  }

  try {
    allStoreCollections = await getStoreCollections();
    allStoreProducts = await getStoreProducts();
    renderAllProducts(allStoreProducts);
  } catch (error) {
    console.error(error);

    allStoreCollections = getDemoCollections();
    allStoreProducts = getDemoProducts();
    renderAllProducts(allStoreProducts);
  }
}

/* ── CAMBIO DE IDIOMA ───────────────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    syncAllProductsLanguage();
    renderAllProducts(allStoreProducts);
  }, 300);

  setTimeout(() => {
    syncAllProductsLanguage();
    renderAllProducts(allStoreProducts);
  }, 800);
});

/* ── INICIAR ───────────────────────── */

loadAllProductsPage();
