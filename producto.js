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

function getSingleCart() {
  return JSON.parse(localStorage.getItem("qualityCart")) || [];
}

function saveSingleCart(cart) {
  localStorage.setItem("qualityCart", JSON.stringify(cart));
}

function getSingleProductPrice(product) {
  if (typeof product.price === "number") return product.price;

  const priceText = product.priceGeneral || product.priceText || "";
  const cleanPrice = priceText.replace(/[^0-9.]/g, "");

  return Number(cleanPrice) || 0;
}

function normalizeSingleProductForCart(product) {
  return {
    id: product.id || product.handle,
    handle: product.handle || "",
    title: product.title || "Producto",
    image: product.image || "assets/diagnostico.png",
    imageAlt: product.imageAlt || product.title || "Producto",
    price: getSingleProductPrice(product),
    priceText: product.priceText || product.priceGeneral || "Solicitar cotización",
    priceGeneral: product.priceGeneral || product.priceText || "Solicitar cotización",
    priceDistributor: product.priceDistributor || "Cotizar con ejecutivo",
    categoryName: product.categoryName || product.category || "General",
    variantId: product.variantId || null,
    quantity: 1
  };
}

function addSingleProductToCart(product) {
  const cart = getSingleCart();
  const cartProduct = normalizeSingleProductForCart(product);

  const existingProduct = cart.find(item => item.id === cartProduct.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push(cartProduct);
  }

  saveSingleCart(cart);
  renderSinglePageCart();
  openSinglePageCart();
}

function renderSinglePageCart() {
  const cart = getSingleCart();

  const singleCartItems = document.getElementById("cartItems");
  const singleCartCount = document.getElementById("cartCount");
  const singleCartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);

  if (singleCartCount) {
    singleCartCount.textContent = totalItems;
  }

  if (singleCartTotal) {
    singleCartTotal.textContent = totalPrice.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN"
    });
  }

  if (!singleCartItems) return;

  if (!cart.length) {
    singleCartItems.innerHTML = `
      <div class="cart-empty">
        <p>Tu carrito está vacío.</p>
      </div>
    `;
    return;
  }

  singleCartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.imageAlt || item.title}">

      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${item.priceText}</p>

        <div class="cart-quantity">
          <button type="button" data-single-decrease-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-single-increase-id="${item.id}">+</button>
        </div>
      </div>

      <button class="cart-remove" type="button" data-single-remove-id="${item.id}">
        ×
      </button>
    </div>
  `).join("");
}

function openSinglePageCart() {
  const singleCartDrawer = document.getElementById("cartDrawer");
  const singleCartOverlay = document.getElementById("cartOverlay");

  if (singleCartDrawer) {
    singleCartDrawer.classList.add("active");
  }

  if (singleCartOverlay) {
    singleCartOverlay.classList.add("active");
  }

  document.body.style.overflow = "hidden";
}

function updateSingleCartQuantity(productId, newQuantity) {
  let cart = getSingleCart();

  if (newQuantity <= 0) {
    cart = cart.filter(item => item.id !== productId);
  } else {
    cart = cart.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          quantity: newQuantity
        };
      }

      return item;
    });
  }

  saveSingleCart(cart);
  renderSinglePageCart();
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-single-add-cart]");
  const removeButton = event.target.closest("[data-single-remove-id]");
  const increaseButton = event.target.closest("[data-single-increase-id]");
  const decreaseButton = event.target.closest("[data-single-decrease-id]");

  if (addButton) {
    if (!selectedSingleProduct) {
      alert("No se encontró el producto.");
      return;
    }

    addSingleProductToCart(selectedSingleProduct);
    return;
  }

  if (removeButton) {
    const productId = removeButton.getAttribute("data-single-remove-id");
    updateSingleCartQuantity(productId, 0);
    return;
  }

  if (increaseButton) {
    const productId = increaseButton.getAttribute("data-single-increase-id");
    const cart = getSingleCart();
    const product = cart.find(item => item.id === productId);

    if (product) {
      updateSingleCartQuantity(productId, product.quantity + 1);
    }

    return;
  }

  if (decreaseButton) {
    const productId = decreaseButton.getAttribute("data-single-decrease-id");
    const cart = getSingleCart();
    const product = cart.find(item => item.id === productId);

    if (product) {
      updateSingleCartQuantity(productId, product.quantity - 1);
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

  const canAddToCart = product.type === "venta" || getSingleProductPrice(product) > 0;

  const actionButton = canAddToCart
    ? `
      <button class="btn-primary" type="button" data-single-add-cart>
        Agregar al carrito
      </button>
    `
    : `
      <a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="btn-primary">
        Solicitar cotización
      </a>
    `;

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
    renderSinglePageCart();
  } catch (error) {
    console.error(error);
    renderSingleProduct(null);
  }
}

setupProductBackLink();
loadSingleProductPage();
