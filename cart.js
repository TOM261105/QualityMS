let cart = JSON.parse(localStorage.getItem("qualityCart")) || [];

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function saveCart() {
  localStorage.setItem("qualityCart", JSON.stringify(cart));
}

function openCart() {
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
  if (!product || product.type !== "venta") return;

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
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

function updateQuantity(productId, newQuantity) {
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

  cartItems.innerHTML = cart.map(item => {
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.imageAlt || item.title}">

        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <p>${item.priceText}</p>

          <div class="cart-quantity">
            <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>

        <button class="cart-remove" type="button" onclick="removeFromCart('${item.id}')">×</button>
      </div>
    `;
  }).join("");
}

async function goToCheckout() {
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  if (!isShopifyReady()) {
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
