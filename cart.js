let cart = [];

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function loadCart() {
  cart = JSON.parse(localStorage.getItem("qualityCart")) || [];
}

function saveCart() {
  localStorage.setItem("qualityCart", JSON.stringify(cart));
}

function escapeCartText(value) {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

function normalizeQuoteProduct(product) {
  return {
    id: product.id || product.handle || product.title,
    handle: product.handle || "",
    title: product.title || "Producto",
    image: product.image || "assets/diagnostico.png",
    imageAlt: product.imageAlt || product.title || "Producto",
    categoryName: product.categoryName || product.category || "General",
    availability: product.availability || "Disponible para cotización",
    priceText: "Bajo cotización",
    priceGeneral: "Bajo cotización",
    variantId: product.variantId || null,
    quantity: product.quantity || 1
  };
}

function openCart() {
  loadCart();
  renderCart();

  cartDrawer?.classList.add("active");
  cartOverlay?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer?.classList.remove("active");
  cartOverlay?.classList.remove("active");
  document.body.style.overflow = "";
}

function addToCart(product) {
  loadCart();

  if (!product) return;

  const quoteProduct = normalizeQuoteProduct(product);
  const existingProduct = cart.find(item => item.id === quoteProduct.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push(quoteProduct);
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(productId) {
  loadCart();

  cart = cart.filter(item => item.id !== productId);

  saveCart();
  renderCart();
}

function updateQuantity(productId, newQuantity) {
  loadCart();

  const product = cart.find(item => item.id === productId);

  if (!product) return;

  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  product.quantity = newQuantity;

  saveCart();
  renderCart();
}

function getQuoteMessageFromItems(items) {
  const lines = items.map((item, index) => {
    return `${index + 1}. ${item.title}
   Categoría: ${item.categoryName || "General"}
   Cantidad: ${item.quantity}`;
  }).join("\n\n");

  return `Hola, me interesa solicitar una cotización para los siguientes productos:

${lines}

Quedo pendiente de la información de precio, disponibilidad y tiempos de entrega.`;
}

function saveQuoteRequest(items) {
  const normalizedItems = items.map(item => normalizeQuoteProduct(item));
  const message = getQuoteMessageFromItems(normalizedItems);

  sessionStorage.setItem("qmsQuoteMessage", message);
  sessionStorage.setItem("qmsQuoteProducts", JSON.stringify(normalizedItems));
}

function requestQuoteForProduct(product) {
  if (!product) return;

  const quoteProduct = normalizeQuoteProduct(product);
  saveQuoteRequest([quoteProduct]);

  window.location.href = `contacto.html?cotizacion=producto&producto=${encodeURIComponent(quoteProduct.title)}`;
}

function requestQuoteFromCart() {
  loadCart();

  if (!cart.length) {
    alert("Tu carrito de cotización está vacío.");
    return;
  }

  saveQuoteRequest(cart);
  window.location.href = "contacto.html?cotizacion=carrito";
}

function renderCart() {
  loadCart();

  if (!cartItems || !cartCount || !cartTotal) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCount.textContent = totalItems;

  cartTotal.textContent = totalItems === 1
    ? "1 producto"
    : `${totalItems} productos`;

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p>Tu carrito de cotización está vacío.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${escapeCartText(item.image)}" alt="${escapeCartText(item.imageAlt || item.title)}">

      <div class="cart-item-info">
        <h4>${escapeCartText(item.title)}</h4>
        <p>${escapeCartText(item.categoryName || "General")}</p>
        <p class="cart-item-quote">Bajo cotización</p>

        <div class="cart-quantity">
          <button type="button" data-decrease-id="${escapeCartText(item.id)}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-increase-id="${escapeCartText(item.id)}">+</button>
        </div>
      </div>

      <button class="cart-remove" type="button" data-remove-id="${escapeCartText(item.id)}">
        ×
      </button>
    </div>
  `).join("");
}

if (cartItems) {
  cartItems.addEventListener("click", event => {
    const removeBtn = event.target.closest("[data-remove-id]");
    const increaseBtn = event.target.closest("[data-increase-id]");
    const decreaseBtn = event.target.closest("[data-decrease-id]");

    if (removeBtn) {
      removeFromCart(removeBtn.getAttribute("data-remove-id"));
      return;
    }

    if (increaseBtn) {
      const productId = increaseBtn.getAttribute("data-increase-id");
      const product = cart.find(item => item.id === productId);

      if (product) {
        updateQuantity(productId, product.quantity + 1);
      }

      return;
    }

    if (decreaseBtn) {
      const productId = decreaseBtn.getAttribute("data-decrease-id");
      const product = cart.find(item => item.id === productId);

      if (product) {
        updateQuantity(productId, product.quantity - 1);
      }
    }
  });
}

cartOpenBtn?.addEventListener("click", openCart);
cartCloseBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);
checkoutBtn?.addEventListener("click", requestQuoteFromCart);

renderCart();
