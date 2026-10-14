/* ── LISTA COMPLETA DE PRODUCTOS ──────────────────────────── */

const productListBody = document.getElementById("productListBody");
const productListSearch = document.getElementById("productListSearch");

let currentProductList = [];
let currentProductPage = 1;
let nextProductCursor = null;
let hasNextProductPage = false;
let pageCursors = [null];
let currentSearchTerm = "";
let searchTimer = null;

const PRODUCTS_PER_PAGE = 50;

/* ── IDIOMA ───────────────────────────────────────────────── */

function getCurrentSiteLanguage() {
  const siteLang = localStorage.getItem("siteLang");
  const qmsLang = localStorage.getItem("qmsLang");
  const language = localStorage.getItem("language");
  const lang = localStorage.getItem("lang");
  const currentLang = localStorage.getItem("currentLang");

  const possibleLangs = [
    siteLang,
    qmsLang,
    language,
    lang,
    currentLang
  ];

  for (const value of possibleLangs) {
    const cleanValue = String(value || "").toLowerCase().trim();

    if (cleanValue === "en" || cleanValue === "english") return "en";
    if (cleanValue === "es" || cleanValue === "spanish" || cleanValue === "español") return "es";
  }

  const htmlLang = String(document.documentElement.lang || "").toLowerCase().trim();

  if (htmlLang.startsWith("en")) return "en";
  if (htmlLang.startsWith("es")) return "es";

  return "es";
}

function getListText(es, en) {
  return getCurrentSiteLanguage() === "en" ? en : es;
}

function translateCategoryText(text) {
  if (getCurrentSiteLanguage() !== "en") return text || "General";

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

/* ── TRADUCCIÓN DE PRODUCTOS ───────────────────────────────── */

function getTranslatedProduct(product) {
  if (!product) return product;

  const lang = getCurrentSiteLanguage();

  /*
    Esta línea es importante:
    product-translations.js usa localStorage.siteLang,
    entonces lo mantenemos sincronizado.
  */
  localStorage.setItem("siteLang", lang);

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

  return product;
}

/* ── UTILIDADES ───────────────────────────────────────────── */

function getSelectedCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat");
}

function cleanProductDescription(description) {
  if (!description) {
    return getListText("Sin descripción disponible.", "No description available.");
  }

  const temp = document.createElement("div");
  temp.innerHTML = description;

  temp.querySelectorAll("p, div, span, li").forEach(element => {
    const text = element.textContent.toLowerCase();

    if (
      text.includes("precio distribuidor") ||
      text.includes("precio para distribuidor") ||
      text.includes("distribuidor:") ||
      text.includes("precio general") ||
      text.includes("precio usd")
    ) {
      element.remove();
    }
  });

  const cleaned = temp.textContent.trim();

  return cleaned || getListText("Sin descripción disponible.", "No description available.");
}

function getDisplayDescription(description) {
  const cleaned = cleanProductDescription(description);

  if (getCurrentSiteLanguage() !== "en") return cleaned;

  return cleaned
    .replace(/^Marca:/i, "Brand:")
    .replace("Sin descripción disponible.", "No description available.");
}

function getListPreviewDescription(product) {
  const translatedProduct = getTranslatedProduct(product);

  const description =
    translatedProduct?.shortDescription ||
    translatedProduct?.descripcionCorta ||
    translatedProduct?.description ||
    translatedProduct?.descriptionHtml ||
    "";

  return getDisplayDescription(description);
}

function refreshExtraTranslationPatches() {
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
  }, 80);
}

/* ── ESTADOS ──────────────────────────────────────────────── */

function renderLoadingState() {
  if (!productListBody) return;

  productListBody.innerHTML = `
    <tr>
      <td colspan="5" class="product-list-empty">
        ${getListText("Cargando productos...", "Loading products...")}
      </td>
    </tr>
  `;
}

function renderEmptyState() {
  if (!productListBody) return;

  productListBody.innerHTML = `
    <tr>
      <td colspan="5" class="product-list-empty">
        ${getListText("No se encontraron productos.", "No products found.")}
      </td>
    </tr>
  `;
}

/* ── PAGINACIÓN ───────────────────────────────────────────── */

function getPaginationContainer() {
  let pagination = document.getElementById("productPagination");

  if (!pagination) {
    const tableWrap = document.querySelector(".product-table-wrap");

    if (!tableWrap) return null;

    pagination = document.createElement("div");
    pagination.id = "productPagination";
    pagination.className = "product-pagination";

    tableWrap.insertAdjacentElement("afterend", pagination);
  }

  return pagination;
}

function renderPaginationControls() {
  const pagination = getPaginationContainer();

  if (!pagination) return;

  if (currentProductPage === 1 && !hasNextProductPage) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = `
    <div class="product-pagination-info">
      ${getListText(
        `Página ${currentProductPage} · Mostrando ${currentProductList.length} productos`,
        `Page ${currentProductPage} · Showing ${currentProductList.length} products`
      )}
    </div>

    <div class="product-pagination-actions">
      <button 
        type="button" 
        class="pagination-btn"
        data-page-action="prev"
        ${currentProductPage === 1 ? "disabled" : ""}>
        ${getListText("← Anterior", "← Previous")}
      </button>

      <span class="pagination-current">
        ${getListText(
          `Página ${currentProductPage}`,
          `Page ${currentProductPage}`
        )}
      </span>

      <button 
        type="button" 
        class="pagination-btn"
        data-page-action="next"
        ${!hasNextProductPage ? "disabled" : ""}>
        ${getListText("Siguiente →", "Next →")}
      </button>
    </div>
  `;
}

/* ── RENDER TABLA ─────────────────────────────────────────── */

function renderProductList(products) {
  if (!productListBody) return;

  /*
    Guardamos los productos originales.
    La traducción se aplica solo al pintar.
  */
  currentProductList = products || [];

  if (!currentProductList.length) {
    renderEmptyState();
    renderPaginationControls();
    refreshExtraTranslationPatches();
    return;
  }

  productListBody.innerHTML = currentProductList.map(originalProduct => {
    const product = getTranslatedProduct(originalProduct);
    const backUrl = "lista-productos.html" + window.location.search;

    return `
      <tr>
        <td>${translateCategoryText(product.categoryName || product.category || "General")}</td>

        <td>
          <strong>${product.title || getListText("Producto sin nombre", "Unnamed product")}</strong>
        </td>

        <td>${getListPreviewDescription(originalProduct)}</td>

        <td>
          <strong>${getListText("Bajo cotización", "Quote required")}</strong>
        </td>

        <td>
          <div class="product-list-actions">
            <a href="${getProductDetailUrl(originalProduct, backUrl)}" class="product-action light">
              ${getListText("Ver más información", "More information")}
            </a>

            <button class="product-action" data-add-id="${originalProduct.id}">
              ${getListText("Agregar a cotización", "Add to quote")}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderPaginationControls();
  refreshExtraTranslationPatches();
}

/* ── CARGA REAL DE 50 PRODUCTOS ──────────────────────────── */

async function loadProductPage(cursor = null, pageNumber = 1, shouldScroll = false) {
  renderLoadingState();

  try {
    const selectedCategory = getSelectedCategoryFromUrl();

    let response;

    if (selectedCategory) {
      response = await getStoreCollectionProductsPage(selectedCategory, {
        cursor,
        limit: PRODUCTS_PER_PAGE
      });
    } else {
      response = await getStoreProductsPage({
        cursor,
        limit: PRODUCTS_PER_PAGE,
        searchTerm: currentSearchTerm
      });
    }

    currentProductPage = pageNumber;
    nextProductCursor = response.pageInfo?.endCursor || null;
    hasNextProductPage = Boolean(response.pageInfo?.hasNextPage);

    renderProductList(response.products || []);

    if (shouldScroll) {
      const tableWrap = document.querySelector(".product-table-wrap");

      if (tableWrap) {
        tableWrap.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  } catch (error) {
    console.error(error);

    let demoProducts = getDemoProducts();
    const selectedCategory = getSelectedCategoryFromUrl();

    if (selectedCategory) {
      demoProducts = demoProducts.filter(product => product.category === selectedCategory);
    }

    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();

      demoProducts = demoProducts.filter(product => {
        const translatedProduct = getTranslatedProduct(product);

        const text = `
          ${translatedProduct.categoryName || ""}
          ${translatedProduct.category || ""}
          ${translatedProduct.title || ""}
          ${translatedProduct.shortDescription || ""}
          ${translatedProduct.description || ""}
        `.toLowerCase();

        return text.includes(term);
      });
    }

    const startIndex = (pageNumber - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;

    currentProductPage = pageNumber;
    currentProductList = demoProducts.slice(startIndex, endIndex);
    hasNextProductPage = endIndex < demoProducts.length;
    nextProductCursor = hasNextProductPage ? String(endIndex) : null;

    renderProductList(currentProductList);
  }
}

/* ── BUSCADOR ─────────────────────────────────────────────── */

function resetPagination() {
  currentProductPage = 1;
  nextProductCursor = null;
  hasNextProductPage = false;
  pageCursors = [null];
}

if (productListSearch) {
  productListSearch.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      currentSearchTerm = productListSearch.value.toLowerCase().trim();

      resetPagination();
      loadProductPage(null, 1, false);
    }, 350);
  });
}

/* ── CAMBIO DE PÁGINA ─────────────────────────────────────── */

document.addEventListener("click", event => {
  const paginationButton = event.target.closest("[data-page-action]");

  if (!paginationButton) return;

  const action = paginationButton.getAttribute("data-page-action");

  if (action === "next") {
    if (!hasNextProductPage || !nextProductCursor) return;

    const nextPage = currentProductPage + 1;

    pageCursors[nextPage - 1] = nextProductCursor;

    loadProductPage(nextProductCursor, nextPage, true);
  }

  if (action === "prev") {
    if (currentProductPage === 1) return;

    const previousPage = currentProductPage - 1;
    const previousCursor = pageCursors[previousPage - 1] || null;

    loadProductPage(previousCursor, previousPage, true);
  }
});

/* ── AGREGAR A COTIZACIÓN ────────────────────────────────── */

if (productListBody) {
  productListBody.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");

    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const originalProduct = currentProductList.find(item => item.id === productId);

    if (!originalProduct) return;

    const translatedProduct = getTranslatedProduct(originalProduct);

    if (typeof addToCart === "function") {
      addToCart(translatedProduct);
    }
  });
}

/* ── RECARGAR TEXTOS CUANDO CAMBIA EL IDIOMA ─────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    renderProductList(currentProductList);
  }, 250);

  setTimeout(() => {
    renderProductList(currentProductList);
  }, 700);
});

/* ── INICIO ───────────────────────────────────────────────── */

loadProductPage(null, 1, false);
