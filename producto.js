/* ── PÁGINA INDIVIDUAL DE PRODUCTO ───────────────────────── */

const singleProductContainer = document.getElementById("singleProductContainer");
const productBackLink = document.getElementById("productBackLink");

let selectedSingleProduct = null;

function setupProductBackLink() {
  if (!productBackLink) return;

  const params = new URLSearchParams(window.location.search);
  const backUrl = params.get("back");

  let fallbackUrl = "lista-productos.html";
  let backText = "← Volver a lista de productos";

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

  if (fallbackUrl.startsWith("categoria.html")) backText = "← Volver a categoría";
  if (fallbackUrl.startsWith("lista-productos.html")) backText = "← Volver a lista de productos";
  if (fallbackUrl.startsWith("productos.html")) backText = "← Volver al catálogo";
  if (fallbackUrl.startsWith("tienda.html")) backText = "← Volver a tienda";

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

/* ── LINK PARA COMPARTIR PRODUCTO ─────────────────────────── */

function getProductShareUrl(product) {
  const url = new URL(window.location.href);

  url.search = "";
  url.hash = "";

  if (product && product.handle) {
    url.searchParams.set("handle", product.handle);
  } else if (product && product.id) {
    url.searchParams.set("id", product.id);
  }

  return url.toString();
}

function updateProductMetaTags(product) {
  if (!product) return;

  const shareUrl = getProductShareUrl(product);
  const cleanTitle = stripHTML(product.title || "Producto médico");
  const cleanDescription = stripHTML(product.description || "Producto médico disponible bajo cotización en Quality Medical Service.");
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
    showShareFeedback("Enlace copiado");
  } catch (error) {
    prompt("Copia este enlace:", shareUrl);
  }
}

async function shareProduct(product) {
  if (!product) {
    alert("No se encontró el producto.");
    return;
  }

  const shareUrl = getProductShareUrl(product);
  const cleanTitle = stripHTML(product.title || "Producto médico");
  const shareText = `Mira este producto de Quality Medical Service: ${cleanTitle}`;

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
      alert("No se encontró el producto.");
      return;
    }

    if (typeof addToCart === "function") {
      addToCart(selectedSingleProduct);
    }

    return;
  }

  if (quoteButton) {
    if (!selectedSingleProduct) {
      alert("No se encontró el producto.");
      return;
    }

    if (typeof requestQuoteForProduct === "function") {
      requestQuoteForProduct(selectedSingleProduct);
    }

    return;
  }

  if (shareButton) {
    if (!selectedSingleProduct) {
      alert("No se encontró el producto.");
      return;
    }

    shareProduct(selectedSingleProduct);
  }
});

/* ── RENDER DEL PRODUCTO ─────────────────────────────────── */

function renderSingleProduct(product) {
  if (!singleProductContainer) return;

  if (!product) {
    singleProductContainer.innerHTML = `
      <div class="single-product-empty">
        <h1>Producto no encontrado</h1>
        <p>El producto que buscas no está disponible o fue eliminado.</p>
        <a href="lista-productos.html" class="btn-primary">Volver a productos</a>
      </div>
    `;
    return;
  }

  selectedSingleProduct = product;
  updateProductMetaTags(product);

  const cleanTitle = escapeHTML(product.title || "Producto médico");
  const cleanCategory = escapeHTML(product.categoryName || product.category || "General");
  const cleanDescription = escapeHTML(stripHTML(product.description || "Sin descripción disponible."));
  const cleanImage = escapeHTML(product.image || "assets/preview-qms.png");
  const cleanImageAlt = escapeHTML(product.imageAlt || product.title || "Producto médico");

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

        <p class="single-product-description">
          ${cleanDescription}
        </p>

        <div class="single-product-data">
          <div>
            <span>Disponibilidad</span>
            <strong>Disponible para cotización</strong>
          </div>

          <div>
            <span>Modalidad</span>
            <strong>Bajo cotización</strong>
          </div>
        </div>

        <div class="single-product-actions">
          <button class="btn-primary" type="button" data-single-add-cart>
            Agregar a cotización
          </button>

          <button class="btn-outline" type="button" data-single-quote>
            Cotizar este producto
          </button>

          <button 
          class="btn-outline product-share-btn product-share-icon-btn" 
          type="button" 
          data-single-share
          aria-label="Compartir producto"
          title="Compartir producto">
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
}

/* ── CARGA DEL PRODUCTO ──────────────────────────────────── */

async function loadSingleProductPage() {
  if (singleProductContainer) {
    singleProductContainer.innerHTML = `
      <div class="single-product-empty">
        <p>Cargando producto...</p>
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

setupProductBackLink();
loadSingleProductPage();
