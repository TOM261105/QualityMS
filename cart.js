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
}

function closeCart() {
  cartDrawer?.classList.remove("active");
  cartOverlay?.classList.remove("active");
}

function addToCart(product) {
  const existingProduct = cart.find(item => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      ...product,
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
        <img src="${item.image}" alt="${item.title}">

        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <p>${item.priceText}</p>

          <div class="cart-quantity">
            <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>

        <button class="cart-remove" onclick="removeFromCart('${item.id}')">×</button>
      </div>
    `;
  }).join("");
}

async function goToCheckout() {
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  if (!SHOPIFY_CONFIG.useShopify) {
    alert("Demo: cuando se conecte Shopify, este botón enviará al checkout seguro de Shopify.");
    return;
  }

  const checkoutUrl = await createShopifyCart(cart);

  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  }
}

async function createShopifyCart(cartItems) {
  const endpoint = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  const lines = cartItems
    .filter(item => item.variantId)
    .map(item => {
      return {
        merchandiseId: item.variantId,
        quantity: item.quantity
      };
    });

  const mutation = `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          lines
        }
      }
    })
  });

  const result = await response.json();

  const errors = result.data.cartCreate.userErrors;

  if (errors.length) {
    console.error(errors);
    alert("Hubo un error al crear el carrito.");
    return null;
  }

  return result.data.cartCreate.cart.checkoutUrl;
}

cartOpenBtn?.addEventListener("click", openCart);
cartCloseBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);
checkoutBtn?.addEventListener("click", goToCheckout);

renderCart();
