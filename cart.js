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

function getProductPriceNumber(product) {
  if (typeof product.price === "number") return product.price;

  const priceText = product.priceGeneral || product.priceText || "";
  const cleanPrice = priceText.replace(/[^0-9.]/g, "");

  return Number(cleanPrice) || 0;
}

function addToCart(product) {
  loadCart();

  if (!product) return;

  const existingProduct = cart.find(item => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      handle: product.handle,
      title: product.title,
      image: product.image,
      imageAlt: product.imageAlt || product.title,
      price: getProductPriceNumber(product),
      priceText: product.priceText || product.priceGeneral || "Solicitar cotización",
      priceGeneral: product.priceGeneral || product.priceText || "Solicitar cotización",
      priceDistributor: product.priceDistributor || "Cotizar con ejecutivo",
      categoryName: product.categoryName || product.category || "General",
      variantId: product.variantId || null,
      quantity: 1
    });
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

function renderCart() {
  loadCart();

  if (!cartItems || !cartCount || !cartTotal) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalItems;

  cartTotal.textContent = totalPrice.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p>Tu carrito está vacío.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.imageAlt || item.title}">

      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${item.priceText}</p>

        <div class="cart-quantity">
          <button type="button" data-decrease-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-increase-id="${item.id}">+</button>
        </div>
      </div>

      <button class="cart-remove" type="button" data-remove-id="${item.id}">
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

async function goToCheckout() {
  loadCart();

  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  if (typeof isShopifyReady !== "function" || !isShopifyReady()) {
    alert("Demo: cuando se conecte Shopify, este botón enviará al checkout seguro de Shopify.");
    return;
  }

  const checkoutUrl = await createShopifyCart(cart);

  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  }
}

cartOpenBtn?.addEventListener("click", openCart);
cartCloseBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);
checkoutBtn?.addEventListener("click", goToCheckout);

renderCart();
