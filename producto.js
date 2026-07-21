/* ── PÁGINA INDIVIDUAL DE PRODUCTO ───────────────────────── */

const singleProductContainer = document.getElementById('singleProductContainer');

const productBackLink = document.getElementById('productBackLink');

function setupProductBackLink() {
  if (!productBackLink) return;

  const params = new URLSearchParams(window.location.search);
  const backUrl = params.get('back');

  let fallbackUrl = 'lista-productos.html';
  let backText = '← Volver a lista de productos';

  if (backUrl) {
    const decodedBackUrl = decodeURIComponent(backUrl);

    const allowedPages = [
      'categoria.html',
      'lista-productos.html',
      'productos.html',
      'tienda.html'
    ];

    const cleanPage = decodedBackUrl.split('?')[0];

    if (allowedPages.includes(cleanPage)) {
      fallbackUrl = decodedBackUrl;
    }
  }

  if (fallbackUrl.startsWith('categoria.html')) {
    backText = '← Volver a categoría';
  }

  if (fallbackUrl.startsWith('lista-productos.html')) {
    backText = '← Volver a lista de productos';
  }

  if (fallbackUrl.startsWith('productos.html')) {
    backText = '← Volver al catálogo';
  }

  if (fallbackUrl.startsWith('tienda.html')) {
    backText = '← Volver a tienda';
  }

  productBackLink.href = fallbackUrl;
  productBackLink.textContent = backText;

  productBackLink.addEventListener('click', event => {
    const cameFromSameSite = document.referrer && document.referrer.includes(window.location.origin);

    if (cameFromSameSite && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });
}

function getSelectedProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getNumericPrice(product) {
  if (typeof product.price === 'number') return product.price;

  const priceText = product.priceGeneral || product.priceText || '';
  const cleanPrice = priceText.replace(/[^0-9.]/g, '');

  return Number(cleanPrice) || 0;
}

function getCartFromStorage() {
  return JSON.parse(localStorage.getItem('qualityCart')) || [];
}

function saveCartToStorage(cart) {
  localStorage.setItem('qualityCart', JSON.stringify(cart));
}

function addProductToCartFromProductPage(product) {
  const cart = getCartFromStorage();
  const existingProduct = cart.find(item => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      image: product.image,
      price: getNumericPrice(product),
      priceText: product.priceText || product.priceGeneral || 'Solicitar cotización',
      priceGeneral: product.priceGeneral || product.priceText || 'Solicitar cotización',
      priceDistributor: product.priceDistributor || 'Cotizar con ejecutivo',
      categoryName: product.categoryName || product.category || 'General',
      quantity: 1
    });
  }

  saveCartToStorage(cart);
}

function renderCartFromProductPage() {
  const cart = getCartFromStorage();

  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
  }

  if (cartTotal) {
    cartTotal.textContent = `$${totalPrice.toLocaleString('es-MX')} MXN`;
  }

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p class="cart-empty">Tu carrito está vacío.</p>
    `;
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">

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
  `).join('');

  document.querySelectorAll('[data-remove-id]').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-remove-id');
      const updatedCart = getCartFromStorage().filter(item => item.id !== productId);

      saveCartToStorage(updatedCart);
      renderCartFromProductPage();
    });
  });

  document.querySelectorAll('[data-increase-id]').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-increase-id');
      const updatedCart = getCartFromStorage().map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: item.quantity + 1
          };
        }

        return item;
      });

      saveCartToStorage(updatedCart);
      renderCartFromProductPage();
    });
  });

  document.querySelectorAll('[data-decrease-id]').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-decrease-id');

      const updatedCart = getCartFromStorage()
        .map(item => {
          if (item.id === productId) {
            return {
              ...item,
              quantity: item.quantity - 1
            };
          }

          return item;
        })
        .filter(item => item.quantity > 0);

      saveCartToStorage(updatedCart);
      renderCartFromProductPage();
    });
  });
}

function openCartFromProductPage() {
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartDrawer) {
    cartDrawer.classList.add('active');
  }

  if (cartOverlay) {
    cartOverlay.classList.add('active');
  }

  document.body.style.overflow = 'hidden';
}

function renderSingleProduct() {
  const productId = getSelectedProductId();

  if (typeof DEMO_PRODUCTS === 'undefined') {
    if (singleProductContainer) {
      singleProductContainer.innerHTML = `
        <div class="single-product-empty">
          <h1>Error al cargar productos</h1>
          <p>No se encontró el archivo productos-demo.js.</p>
          <a href="lista-productos.html" class="btn-primary">Volver a productos</a>
        </div>
      `;
    }

    return;
  }

  const product = DEMO_PRODUCTS.find(item => item.id === productId);

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

  const actionButton = product.type === 'venta'
    ? `<button id="singleAddToCart" class="btn-primary" type="button">Agregar al carrito</button>`
    : `<a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="btn-primary">Solicitar cotización</a>`;

  singleProductContainer.innerHTML = `
    <section class="single-product-card">
      <div class="single-product-image">
        <img src="${product.image}" alt="${product.title}">
      </div>

      <div class="single-product-info">
        <span class="eyebrow">${product.categoryName || product.category}</span>

        <h1>${product.title}</h1>

        <p class="single-product-description">
          ${product.description || 'Sin descripción disponible.'}
        </p>

        <div class="single-product-data">
          <div>
            <span>Disponibilidad</span>
            <strong>${product.availability || 'Consultar disponibilidad'}</strong>
          </div>

          <div>
            <span>Precio general</span>
            <strong>${product.priceGeneral || product.priceText || 'Solicitar cotización'}</strong>
          </div>

          <div>
            <span>Precio distribuidor</span>
            <strong>${product.priceDistributor || 'Cotizar con ejecutivo'}</strong>
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

  const singleAddToCart = document.getElementById('singleAddToCart');

  if (singleAddToCart) {
    singleAddToCart.addEventListener('click', () => {
      addProductToCartFromProductPage(product);
      renderCartFromProductPage();
      openCartFromProductPage();
    });
  }
}

setupProductBackLink();
renderSingleProduct();
renderCartFromProductPage();
