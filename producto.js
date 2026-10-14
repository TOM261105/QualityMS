/* ── PÁGINA INDIVIDUAL DE PRODUCTO ───────────────────────── */

const singleProductContainer = document.getElementById("singleProductContainer");
const productBackLink = document.getElementById("productBackLink");

let selectedSingleProduct = null;

/* ── IDIOMA ───────────────────────────────────────────────── */

function getCurrentProductLanguage() {
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

function syncProductLanguage() {
  const lang = getCurrentProductLanguage();

  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  return lang;
}

function getProductText(es, en) {
  return getCurrentProductLanguage() === "en" ? en : es;
}

function getStoreProductText(key) {
  if (typeof window.getStoreText === "function") {
    return window.getStoreText(key);
  }

  const lang = getCurrentProductLanguage();

  const texts = {
    es: {
      availabilityLabel: "Disponibilidad",
      modalityLabel: "Modalidad",
      availabilityValue: "Disponible para cotización",
      quoteOnly: "Bajo cotización",
      addToQuote: "Agregar a cotización",
      quoteProduct: "Cotizar este producto",
      productNotFoundTitle: "Producto no encontrado",
      productNotFoundText: "El producto que buscas no está disponible o fue eliminado.",
      backToProducts: "Volver a productos",
      loadingProduct: "Cargando producto...",
      shareProduct: "Compartir producto",
      noDescription: "Sin descripción disponible."
    },
    en: {
      availabilityLabel: "Availability",
      modalityLabel: "Mode",
      availabilityValue: "Available for quote",
      quoteOnly: "Quote only",
      addToQuote: "Add to quote",
      quoteProduct: "Quote this product",
      productNotFoundTitle: "Product not found",
      productNotFoundText: "The product you are looking for is not available or has been removed.",
      backToProducts: "Back to products",
      loadingProduct: "Loading product...",
      shareProduct: "Share product",
      noDescription: "No description available."
    }
  };

  return texts[lang]?.[key] || texts.es[key] || key;
}

/* ── REGRESAR ─────────────────────────────────────────────── */

function setupProductBackLink() {
  if (!productBackLink) return;

  const lang = syncProductLanguage();

  const params = new URLSearchParams(window.location.search);
  const backUrl = params.get("back");

  let fallbackUrl = "lista-productos.html";
  let backText = lang === "en" ? "← Back to product list" : "← Volver a lista de productos";

  if (backUrl) {
    const decodedBackUrl = decodeURIComponent(backUrl);

    const allowedPages = [
      "categoria.html",
      "lista-productos.html",
      "productos.html",
      "tienda.html"
    ];

    const cleanPage = decodedBackUrl.split("?")[0];

    if (allowedPages.includes(cleanPage)) {
      fallbackUrl = decodedBackUrl;
    }
  }

  if (fallbackUrl.startsWith("categoria.html")) {
    backText = lang === "en" ? "← Back to category" : "← Volver a categoría";
  }

  if (fallbackUrl.startsWith("lista-productos.html")) {
    backText = lang === "en" ? "← Back to product list" : "← Volver a lista de productos";
  }

  if (fallbackUrl.startsWith("productos.html")) {
    backText = lang === "en" ? "← Back to catalog" : "← Volver al catálogo";
  }

  if (fallbackUrl.startsWith("tienda.html")) {
    backText = lang === "en" ? "← Back to store" : "← Volver a tienda";
  }

  productBackLink.href = fallbackUrl;
  productBackLink.textContent = backText;

  productBackLink.addEventListener("click", event => {
    const cameFromSameSite = document.referrer && document.referrer.includes(window.location.origin);

    if (cameFromSameSite && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });
}

/* ── PRODUCTO SELECCIONADO ───────────────────────────────── */

function getSelectedProductReference() {
  const params = new URLSearchParams(window.location.search);

  return {
    id: params.get("id"),
    handle: params.get("handle")
  };
}

function getDemoProductByReference(id, handle) {
  if (typeof DEMO_PRODUCTS === "undefined") return null;

  return DEMO_PRODUCTS.find(product => {
    return product.id === id || product.handle === handle;
  }) || null;
}

async function getCurrentProduct() {
  const { id, handle } = getSelectedProductReference();

  if (
    typeof isShopifyReady === "function" &&
    isShopifyReady() &&
    typeof getStoreProductByHandle === "function"
  ) {
    return await getStoreProductByHandle(handle || id);
  }

  return getDemoProductByReference(id, handle);
}

/* ── UTILIDADES ───────────────────────────────────────────── */

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

function stripHTML(value) {
  const temp = document.createElement("div");
  temp.innerHTML = String(value || "");
  return temp.textContent || temp.innerText || "";
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

function getTranslatedSingleProduct(product) {
  if (!product) return product;

  const lang = syncProductLanguage();

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

function getSafeProductDescriptionHTML(product) {
  const rawDescription =
    product?.descriptionHtml ||
    product?.description ||
    "";

  if (!String(rawDescription).trim()) {
    return `<p>${getStoreProductText("noDescription")}</p>`;
  }

  const temp = document.createElement("div");
  temp.innerHTML = rawDescription;

  temp.querySelectorAll("script, style, iframe").forEach(element => {
    element.remove();
  });

  return temp.innerHTML.trim() || `<p>${escapeHTML(stripHTML(rawDescription))}</p>`;
}

function makeAbsoluteUrl(path) {
  if (!path) {
    return "https://tom261105.github.io/QualityMS/assets/preview-qms.png";
  }

  try {
    return new URL(path, window.location.href).toString();
  } catch (error) {
    return "https://tom261105.github.io/QualityMS/assets/preview-qms.png";
  }
}

function setMetaContent(selector, value) {
  const meta = document.querySelector(selector);

  if (meta && value) {
    meta.setAttribute("content", value);
  }
}

/* ── LINK PARA COMPARTIR PRODUCTO CON PREVIEW DE WHATSAPP ─── */

function getProductShareUrl(product) {
  const handle = product && product.handle ? String(product.handle).trim() : "";

  if (!handle) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  const isGithubPages = window.location.hostname.includes("github.io");
  const basePath = isGithubPages ? "/QualityMS" : "";

  return `${window.location.origin}${basePath}/productos/${encodeURIComponent(handle)}.html`;
}

function updateProductMetaTags(product) {
  if (!product) return;

  const shareUrl = getProductShareUrl(product);
  const cleanTitle = stripHTML(product.title || "Producto médico");
  const cleanDescription = stripHTML(
    product.shortDescription ||
    product.description ||
    getProductText(
      "Producto médico disponible bajo cotización en Quality Medical Service.",
      "Medical product available by quote at Quality Medical Service."
    )
  );

  const shortDescription = cleanDescription.length > 155
    ? cleanDescription.substring(0, 152).trim() + "..."
    : cleanDescription;

  const productTitle = `${cleanTitle} | Quality Medical Service`;
  const productImage = makeAbsoluteUrl(product.image || "assets/preview-qms.png");

  document.title = productTitle;

  setMetaContent('meta[property="og:title"]', productTitle);
  setMetaContent('meta[property="og:description"]', shortDescription);
  setMetaContent('meta[property="og:image"]', productImage);
  setMetaContent('meta[property="og:url"]', shareUrl);

  setMetaContent('meta[name="twitter:title"]', productTitle);
  setMetaContent('meta[name="twitter:description"]', shortDescription);
  setMetaContent('meta[name="twitter:image"]', productImage);

  const canonical = document.querySelector('link[rel="canonical"]');

  if (canonical) {
    canonical.setAttribute("href", shareUrl);
  }
}

function showShareFeedback(message) {
  const oldToast = document.querySelector(".share-copy-toast");

  if (oldToast) {
    oldToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "share-copy-toast";
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.left = "50%";
  toast.style.bottom = "26px";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#0d2b4e";
  toast.style.color = "#ffffff";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "999px";
  toast.style.fontFamily = "'Barlow', sans-serif";
  toast.style.fontWeight = "800";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 14px 34px rgba(13, 43, 78, 0.25)";
  toast.style.zIndex = "9999";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

async function copyProductLink(product) {
  const shareUrl = getProductShareUrl(product);

  try {
    await navigator.clipboard.writeText(shareUrl);
    showShareFeedback(getProductText("Enlace copiado", "Link copied"));
  } catch (error) {
    prompt(getProductText("Copia este enlace:", "Copy this link:"), shareUrl);
  }
}

async function shareProduct(product) {
  if (!product) {
    alert(getProductText("No se encontró el producto.", "Product not found."));
    return;
  }

  const shareUrl = getProductShareUrl(product);
  const cleanTitle = stripHTML(product.title || "Producto médico");

  const shareText = getProductText(
    `Mira este producto de Quality Medical Service: ${cleanTitle}`,
    `See this product from Quality Medical Service: ${cleanTitle}`
  );

  const shareData = {
    title: `${cleanTitle} | Quality Medical Service`,
    text: shareText,
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      console.log("El usuario canceló compartir o el navegador no lo permitió.");
    }
  }

  await copyProductLink(product);
}

/* ── EVENTOS DE BOTONES ───────────────────────────────────── */

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-single-add-cart]");
  const quoteButton = event.target.closest("[data-single-quote]");
  const shareButton = event.target.closest("[data-single-share]");

  if (addButton) {
    if (!selectedSingleProduct) {
      alert(getProductText("No se encontró el producto.", "Product not found."));
      return;
    }

    if (typeof addToCart === "function") {
      addToCart(selectedSingleProduct);
    }

    return;
  }

  if (quoteButton) {
    if (!selectedSingleProduct) {
      alert(getProductText("No se encontró el producto.", "Product not found."));
      return;
    }

    if (typeof requestQuoteForProduct === "function") {
      requestQuoteForProduct(selectedSingleProduct);
    }

    return;
  }

  if (shareButton) {
    if (!selectedSingleProduct) {
      alert(getProductText("No se encontró el producto.", "Product not found."));
      return;
    }

    shareProduct(selectedSingleProduct);
  }
});

/* ── RENDER DEL PRODUCTO ─────────────────────────────────── */

function renderSingleProduct(originalProduct) {
  if (!singleProductContainer) return;

  syncProductLanguage();

  if (!originalProduct) {
    singleProductContainer.innerHTML = `
      <div class="single-product-empty">
        <h1>${getStoreProductText("productNotFoundTitle")}</h1>
        <p>${getStoreProductText("productNotFoundText")}</p>
        <a href="lista-productos.html" class="btn-primary">${getStoreProductText("backToProducts")}</a>
      </div>
    `;
    return;
  }

  const product = getTranslatedSingleProduct(originalProduct);

  selectedSingleProduct = product;
  updateProductMetaTags(product);

  const cleanTitle = escapeHTML(product.title || getProductText("Producto médico", "Medical product"));
  const cleanCategory = escapeHTML(product.categoryName || product.category || "General");
  const productDescriptionHTML = getSafeProductDescriptionHTML(product);
  const cleanImage = escapeHTML(product.image || "assets/preview-qms.png");
  const cleanImageAlt = escapeHTML(product.imageAlt || product.title || getProductText("Producto médico", "Medical product"));

  const availabilityText = escapeHTML(product.availability || getStoreProductText("availabilityValue"));
  const quoteText = escapeHTML(product.priceText || getStoreProductText("quoteOnly"));

  singleProductContainer.innerHTML = `
    <section class="single-product-card">
      <div class="single-product-image">
        <img 
          src="${cleanImage}" 
          alt="${cleanImageAlt}"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="single-product-info">
        <span class="eyebrow">${cleanCategory}</span>

        <h1>${cleanTitle}</h1>

        <div class="single-product-description">
          ${productDescriptionHTML}
        </div>

        <div class="single-product-data">
          <div>
            <span>${getStoreProductText("availabilityLabel")}</span>
            <strong>${availabilityText}</strong>
          </div>

          <div>
            <span>${getStoreProductText("modalityLabel")}</span>
            <strong>${quoteText}</strong>
          </div>
        </div>

        <div class="single-product-actions">
          <button class="btn-primary" type="button" data-single-add-cart>
            ${getStoreProductText("addToQuote")}
          </button>

          <button class="btn-outline" type="button" data-single-quote>
            ${getStoreProductText("quoteProduct")}
          </button>

          <button 
            class="btn-outline product-share-btn product-share-icon-btn" 
            type="button" 
            data-single-share
            aria-label="${getStoreProductText("shareProduct")}"
            title="${getStoreProductText("shareProduct")}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.6" y1="10.7" x2="15.4" y2="6.3"></line>
              <line x1="8.6" y1="13.3" x2="15.4" y2="17.7"></line>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `;

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

/* ── CARGA DEL PRODUCTO ──────────────────────────────────── */

async function loadSingleProductPage() {
  syncProductLanguage();
  setupProductBackLink();

  if (singleProductContainer) {
    singleProductContainer.innerHTML = `
      <div class="single-product-empty">
        <p>${getStoreProductText("loadingProduct")}</p>
      </div>
    `;
  }

  try {
    const product = await getCurrentProduct();
    renderSingleProduct(product);
  } catch (error) {
    console.error(error);
    renderSingleProduct(null);
  }
}

/* ── CAMBIO DE IDIOMA ─────────────────────────────────────── */

document.getElementById("langToggle")?.addEventListener("click", () => {
  setTimeout(() => {
    syncProductLanguage();
    setupProductBackLink();

    if (selectedSingleProduct) {
      renderSingleProduct(selectedSingleProduct);
    } else {
      loadSingleProductPage();
    }
  }, 300);

  setTimeout(() => {
    if (selectedSingleProduct) {
      renderSingleProduct(selectedSingleProduct);
    }
  }, 800);
});

/* ── INICIAR ──────────────────────────────────────────────── */

loadSingleProductPage();
