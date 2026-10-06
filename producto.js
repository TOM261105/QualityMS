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

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-single-add-cart]");
  const quoteButton = event.target.closest("[data-single-quote]");

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
  }
});

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

  singleProductContainer.innerHTML = `
    <section class="single-product-card">
      <div class="single-product-image">
        <img 
          src="${product.image}" 
          alt="${product.imageAlt || product.title}"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div class="single-product-info">
        <span class="eyebrow">${product.categoryName || product.category || "General"}</span>

        <h1>${product.title}</h1>

        <p class="single-product-description">
          ${product.description || "Sin descripción disponible."}
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
        </div>
      </div>
    </section>
  `;
}

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
