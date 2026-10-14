/* ── PÁGINA DE CATEGORÍA ───────────────────────── */

const categoryEyebrow = document.getElementById("categoryEyebrow");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const categoryProducts = document.getElementById("categoryProducts");
const productSearch = document.getElementById("productSearch");

let currentCategoryProducts = [];

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
    return `<span class="supplier-name-text">${supplierName}</span>`;
  }

  return `
    <span class="supplier-logo-wrap supplier-logo-${size}">
      <img 
        src="${logo}" 
        alt="${supplierName}" 
        class="supplier-logo-img"
        loading="lazy"
        decoding="async"
        onerror="this.closest('.supplier-logo-wrap').outerHTML='<span class=&quot;supplier-name-text&quot;>${supplierName}</span>';"
      >
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
      justify-content: flex-start;
      vertical-align: middle;
    }

    .supplier-logo-img {
      display: block;
      width: auto;
      height: auto;
      object-fit: contain;
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
      margin: 8px 0 10px;
    }

    .supplier-logo-large .supplier-logo-img {
      max-width: 260px;
      max-height: 82px;
    }

    .supplier-name-text {
      color: var(--blue-main, #005b93);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .shopify-product-category .supplier-logo-wrap {
      margin-bottom: 2px;
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
  const lang =
    localStorage.getItem("siteLang") ||
    localStorage.getItem("qmsLang") ||
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    "es";

  return String(lang).toLowerCase().trim() === "en" ? "en" : "es";
}

function getCategoryText(es, en) {
  return getCurrentCategoryLanguage() === "en" ? en : es;
}

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat") || "diagnostico";
}

function stripProductHTML(value) {
  const temp = document.createElement("div");
  temp.innerHTML = String(value || "");
  return temp.textContent.trim();
}

function getTranslatedProduct(product) {
  if (
    product &&
    typeof window.getTranslatedProductForCurrentLang === "function"
  ) {
    return window.getTranslatedProductForCurrentLang(product);
  }

  return product;
}

function getProductPreviewDescription(product) {
  const translatedProduct = getTranslatedProduct(product);

  const shortDescription =
    translatedProduct?.shortDescription ||
    translatedProduct?.descripcionCorta ||
    "";

  if (String(shortDescription).trim()) {
    return stripProductHTML(shortDescription);
  }

  return stripProductHTML(translatedProduct?.description) || getCategoryText(
    "Sin descripción disponible.",
    "No description available."
  );
}

/* ── HEADER DE CATEGORÍA ───────────────────────── */

function renderCategoryHeader(collection) {
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
            src="${product.image}" 
            alt="${product.imageAlt || product.title}"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="shopify-product-body">
          <p class="shopify-product-category">
            ${renderSupplierLogo(supplierName, "small")}
          </p>

          <h4>${product.title}</h4>

          <p>${getProductPreviewDescription(product)}</p>

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
    const product = currentCategoryProducts.find(item => item.id === productId);

    if (!product) return;

    const translatedProduct = getTranslatedProduct(product);

    if (typeof addToCart === "function") {
      addToCart(translatedProduct);
    }
  });
}

/* ── CARGAR PÁGINA ───────────────────────── */

async function loadCategoryPage() {
  injectSupplierLogoStyles();

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

    renderCategoryHeader(collection);
    currentCategoryProducts = products || [];
    renderCategoryProducts(currentCategoryProducts);
  } catch (error) {
    console.error(error);

    const selectedCategory = getSelectedCategory();
    const fallbackCollection = getDemoCollections().find(item => item.handle === selectedCategory);
    const fallbackProducts = getDemoProducts().filter(product => product.category === selectedCategory);

    renderCategoryHeader(fallbackCollection);
    currentCategoryProducts = fallbackProducts || [];
    renderCategoryProducts(currentCategoryProducts);
  }
}

/* ── CAMBIO DE IDIOMA ───────────────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    renderCategoryHeader({
      title: currentCategoryProducts?.[0]?.categoryName || currentCategoryProducts?.[0]?.category || "Productos",
      description: categoryDescription?.textContent || ""
    });

    renderCategoryProducts(currentCategoryProducts);
  }, 300);
});

/* ── INICIAR ───────────────────────── */

loadCategoryPage();
