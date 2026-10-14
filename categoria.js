/* ── PÁGINA DE CATEGORÍA ───────────────────────── */

const categoryEyebrow = document.getElementById("categoryEyebrow");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const categoryProducts = document.getElementById("categoryProducts");
const productSearch = document.getElementById("productSearch");

let currentCategoryProducts = [];
let currentCategoryCollection = null;

/* ── LOGOS DE PROVEEDORES ───────────────────────── */

const SUPPLIER_LOGOS = {
  "bovie": "assets/distribuidores/Bovie.webp",
  "huntleigh": "assets/distribuidores/HUNTLEIGH.webp",
  "litman": "assets/distribuidores/Litman.webp",
  "littmann": "assets/distribuidores/Litman.webp",
  "baxter": "assets/distribuidores/Logotipos.webp",
  "midmark": "assets/distribuidores/Midmark.webp",
  "miltex": "assets/distribuidores/Miltex.webp",
  "mortara": "assets/distribuidores/Mortara.webp",
  "schiller": "assets/distribuidores/Schiller.webp",
  "wallach": "assets/distribuidores/WALLACH.webp",
  "seca": "assets/distribuidores/seca.webp"
};

function normalizeSupplierName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSupplierLogo(value) {
  const cleanName = normalizeSupplierName(value);

  if (SUPPLIER_LOGOS[cleanName]) {
    return SUPPLIER_LOGOS[cleanName];
  }

  const matchedKey = Object.keys(SUPPLIER_LOGOS).find(key => {
    return cleanName.includes(key) || key.includes(cleanName);
  });

  return matchedKey ? SUPPLIER_LOGOS[matchedKey] : "";
}

function renderSupplierLogo(value, size = "small") {
  const supplierName = String(value || "Proveedor").trim();
  const logo = getSupplierLogo(supplierName);

  if (!logo) {
    return `<span class="supplier-name-text">${escapeHTML(supplierName)}</span>`;
  }

  return `
    <span class="supplier-logo-wrap supplier-logo-${size}">
      <img 
        src="${logo}" 
        alt="${escapeHTML(supplierName)}" 
        class="supplier-logo-img"
        loading="lazy"
        decoding="async"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"
      >
      <span class="supplier-name-text supplier-logo-fallback">${escapeHTML(supplierName)}</span>
    </span>
  `;
}

function injectSupplierLogoStyles() {
  if (document.getElementById("supplierLogoStyles")) return;

  const style = document.createElement("style");
  style.id = "supplierLogoStyles";

  style.textContent = `
    .supplier-logo-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }

    .supplier-logo-img {
      display: block;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .supplier-logo-fallback {
      display: none;
    }

    .supplier-logo-small {
      min-height: 28px;
      max-width: 120px;
    }

    .supplier-logo-small .supplier-logo-img {
      max-width: 110px;
      max-height: 32px;
    }

    .supplier-logo-large {
      width: 100%;
      min-height: 78px;
      margin: 8px auto 10px;
      justify-content: center;
    }

    .supplier-logo-large .supplier-logo-img {
      max-width: 260px;
      max-height: 82px;
      margin-left: auto;
      margin-right: auto;
    }

    .supplier-name-text {
      color: var(--blue-main, #005b93);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    #categoryTitle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .shopify-product-category .supplier-logo-wrap {
      margin-bottom: 2px;
    }

    .shopify-product-description {
      display: block;
    }

    @media (max-width: 640px) {
      .supplier-logo-large .supplier-logo-img {
        max-width: 210px;
        max-height: 68px;
      }

      .supplier-logo-small .supplier-logo-img {
        max-width: 92px;
        max-height: 28px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* ── IDIOMA / TEXTOS ───────────────────────── */

function getCurrentCategoryLanguage() {
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

function syncCategoryLanguage() {
  const lang = getCurrentCategoryLanguage();

  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  return lang;
}

function getCategoryText(es, en) {
  return getCurrentCategoryLanguage() === "en" ? en : es;
}

/* ── UTILIDADES ───────────────────────── */

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat") || "diagnostico";
}

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

/* ── TRADUCCIÓN DE PRODUCTOS ───────────────────────── */

function getTranslatedProduct(product) {
  if (!product) return product;

  const lang = syncCategoryLanguage();

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

  return getCategoryText(
    "Sin descripción disponible.",
    "No description available."
  );
}

function refreshCategoryTranslationPatches() {
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

/* ── HEADER DE CATEGORÍA ───────────────────────── */

function renderCategoryHeader(collection) {
  syncCategoryLanguage();

  const collectionTitle = collection?.title || "Productos";

  const collectionDescription =
    collection?.description ||
    getCategoryText(
      "Explora los productos disponibles en esta categoría.",
      "Explore the products available in this category."
    );

  if (categoryEyebrow) {
    categoryEyebrow.textContent = getCategoryText("Catálogo", "Catalog");
  }

  if (categoryTitle) {
    const logo = getSupplierLogo(collectionTitle);

    if (logo) {
      categoryTitle.innerHTML = renderSupplierLogo(collectionTitle, "large");
    } else {
      categoryTitle.textContent = collectionTitle;
    }
  }

  if (categoryDescription) {
    categoryDescription.textContent = collectionDescription;
  }
}

/* ── RENDER DE PRODUCTOS ───────────────────────── */

function renderCategoryProducts(products) {
  syncCategoryLanguage();

  if (!categoryProducts) return;

  if (!products || products.length === 0) {
    categoryProducts.innerHTML = `
      <div class="empty-products">
        ${getCategoryText(
          "No se encontraron productos en esta categoría.",
          "No products were found in this category."
        )}
      </div>
    `;

    refreshCategoryTranslationPatches();
    return;
  }

  categoryProducts.innerHTML = products.map(originalProduct => {
    const product = getTranslatedProduct(originalProduct);
    const backUrl = `categoria.html?cat=${getSelectedCategory()}`;

    const supplierName = product.categoryName || product.category || "General";

    return `
      <article class="shopify-product-card">
        <div class="shopify-product-img">
          <span class="shopify-product-status">
            ${getCategoryText("Bajo cotización", "Quote only")}
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
            ${renderSupplierLogo(supplierName, "small")}
          </p>

          <h4 class="shopify-product-title">${escapeHTML(product.title || getCategoryText("Producto sin nombre", "Unnamed product"))}</h4>

          <p class="shopify-product-description">
            ${escapeHTML(getProductPreviewDescription(originalProduct))}
          </p>

          <div class="shopify-product-footer">
            <strong>${getCategoryText("Bajo cotización", "Quote only")}</strong>
          </div>

          <div class="shopify-product-actions">
            <a href="${getProductDetailUrl(originalProduct, backUrl)}" class="product-action light">
              ${getCategoryText("Ver más información", "More information")}
            </a>

            <button class="product-action" type="button" data-add-id="${originalProduct.id}">
              ${getCategoryText("Agregar a cotización", "Add to quote")}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  refreshCategoryTranslationPatches();
}

/* ── BUSCADOR ───────────────────────── */

function filterCategoryProducts() {
  if (!productSearch) return;

  const searchTerm = productSearch.value.toLowerCase().trim();

  const filteredProducts = currentCategoryProducts.filter(product => {
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

  renderCategoryProducts(filteredProducts);
}

if (productSearch) {
  productSearch.addEventListener("input", filterCategoryProducts);
}

/* ── AGREGAR A COTIZACIÓN ───────────────────────── */

if (categoryProducts) {
  categoryProducts.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");

    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const originalProduct = currentCategoryProducts.find(item => item.id === productId);

    if (!originalProduct) return;

    const translatedProduct = getTranslatedProduct(originalProduct);

    if (typeof addToCart === "function") {
      addToCart(translatedProduct);
    }
  });
}

/* ── CARGAR PÁGINA ───────────────────────── */

async function loadCategoryPage() {
  injectSupplierLogoStyles();
  syncCategoryLanguage();

  if (categoryProducts) {
    categoryProducts.innerHTML = `
      <div class="empty-products">
        ${getCategoryText("Cargando productos...", "Loading products...")}
      </div>
    `;
  }

  try {
    const selectedCategory = getSelectedCategory();
    const { collection, products } = await getStoreCollectionWithProducts(selectedCategory);

    currentCategoryCollection = collection || null;
    renderCategoryHeader(currentCategoryCollection);

    currentCategoryProducts = products || [];
    renderCategoryProducts(currentCategoryProducts);
  } catch (error) {
    console.error(error);

    const selectedCategory = getSelectedCategory();
    const fallbackCollection = getDemoCollections().find(item => item.handle === selectedCategory);
    const fallbackProducts = getDemoProducts().filter(product => product.category === selectedCategory);

    currentCategoryCollection = fallbackCollection || null;
    renderCategoryHeader(currentCategoryCollection);

    currentCategoryProducts = fallbackProducts || [];
    renderCategoryProducts(currentCategoryProducts);
  }
}

/* ── CAMBIO DE IDIOMA ───────────────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    syncCategoryLanguage();
    renderCategoryHeader(currentCategoryCollection);
    renderCategoryProducts(currentCategoryProducts);
  }, 300);

  setTimeout(() => {
    syncCategoryLanguage();
    renderCategoryHeader(currentCategoryCollection);
    renderCategoryProducts(currentCategoryProducts);
  }, 800);
});

/* ── INICIAR ───────────────────────── */

loadCategoryPage();
