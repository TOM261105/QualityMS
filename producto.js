/* ── PÁGINA INDIVIDUAL DE PRODUCTO ───────────────────────── */

const singleProductContainer = document.getElementById("singleProductContainer");
const productBackLink = document.getElementById("productBackLink");

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

  if (fallbackUrl.startsWith("categoria.html")) {
    backText = "← Volver a categoría";
  }

  if (fallbackUrl.startsWith("lista-productos.html")) {
    backText = "← Volver a lista de productos";
  }

  if (fallbackUrl.startsWith("productos.html")) {
    backText = "← Volver al catálogo";
  }

  if (fallbackUrl.startsWith("tienda.html")) {
    backText = "← Volver a tienda";
  }

  productBackLink.href = fallbackUrl;
  productBackLink.textContent = backText;
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

  const actionButton = product.type === "venta"
    ? `<button id="singleAddToCart" class="btn-primary" type="button">Agregar al carrito</button>`
    : `<a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="btn-primary">Solicitar cotización</a>`;

  singleProductContainer.innerHTML = `
    <section class="single-product-card">
      <div class="single-product-image">
        <img src="${product.image}" alt="${product.imageAlt || product.title}">
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
            <strong>${product.availability || "Consultar disponibilidad"}</strong>
          </div>

          <div>
            <span>Precio general</span>
            <strong>${product.priceGeneral || product.priceText || "Solicitar cotización"}</strong>
          </div>

          <div>
            <span>Precio distribuidor</span>
            <strong>${product.priceDistributor || "Cotizar con ejecutivo"}</strong>
          </div>
        </div>

        <div class="single-product-actions">
          ${actionButton}

          <a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="btn-outline">
            Hablar con un asesor
          </a>
        </div>
      </div>
    </section>
  `;

  const singleAddToCart = document.getElementById("singleAddToCart");

  if (singleAddToCart) {
    singleAddToCart.addEventListener("click", () => {
      if (typeof addToCart === "function") {
        addToCart(product);
      } else {
        alert("No se cargó correctamente el carrito.");
      }
    });
  }
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
