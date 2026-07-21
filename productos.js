/* ── TODOS LOS PRODUCTOS AGRUPADOS ───────────────────────── */

const allProductsContainer = document.getElementById('allProductsContainer');
const allProductsSearch = document.getElementById('allProductsSearch');

const categoryOrder = [
  "diagnostico",
  "emergencias",
  "mobiliario",
  "monitoreo",
  "mujer",
  "especialidades",
  "bienestar",
  "orl"
];

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || 'Solicitar cotización';
}

function getProductsByCategory(products, category) {
  return products.filter(product => product.category === category);
}

function renderProductCard(product) {
  const actionButton = product.type === 'venta'
    ? `
      <button class="product-action" type="button" data-add-id="${product.id}">
        Agregar al carrito
      </button>
    `
    : `
      <a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="product-action quote">
        Solicitar cotización
      </a>
    `;

  return `
    <article class="shopify-product-card">
      <div class="shopify-product-img">
        <span class="shopify-product-status">${product.availability || 'Disponible'}</span>
        <img src="${product.image}" alt="${product.title}">
      </div>

      <div class="shopify-product-body">
        <p class="shopify-product-category">
          ${product.categoryName || product.category || 'General'}
        </p>

        <h4>${product.title}</h4>

        <p>${product.description || 'Sin descripción disponible.'}</p>

        <div class="shopify-product-footer">
          <strong>${getProductGeneralPrice(product)}</strong>
        </div>

        <div class="shopify-product-actions">
          <a 
            href="producto.html?id=${product.id}&back=${encodeURIComponent('productos.html')}" 
            class="product-action light">
            Ver más información
          </a>

          ${actionButton}
        </div>
      </div>
    </article>
  `;
}

function renderAllProducts(products) {
  if (!allProductsContainer) return;

  if (!products || products.length === 0) {
    allProductsContainer.innerHTML = `
      <div class="empty-products">
        No se encontraron productos.
      </div>
    `;
    return;
  }

  const groupsHtml = categoryOrder.map(category => {
    const categoryProducts = getProductsByCategory(products, category);

    if (categoryProducts.length === 0) return '';

    const info = CATEGORY_INFO[category] || {
      title: 'Productos',
      eyebrow: 'Catálogo'
    };

    return `
      <section class="all-products-group">
        <div class="all-products-group-header">
          <div>
            <span>${info.eyebrow}</span>
            <h3>${info.title}</h3>
          </div>

          <a href="categoria.html?cat=${category}" class="group-link">
            Ver sección →
          </a>
        </div>

        <div class="all-products-row">
          ${categoryProducts.map(product => renderProductCard(product)).join('')}
        </div>
      </section>
    `;
  }).join('');

  allProductsContainer.innerHTML = groupsHtml;
}

function filterAllProducts() {
  const searchTerm = allProductsSearch.value.toLowerCase().trim();

  const filteredProducts = DEMO_PRODUCTS.filter(product => {
    const searchableText = `
      ${product.title || ''}
      ${product.description || ''}
      ${product.categoryName || ''}
      ${product.category || ''}
      ${product.priceGeneral || ''}
      ${product.priceDistributor || ''}
      ${product.priceText || ''}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderAllProducts(filteredProducts);
}

if (allProductsSearch) {
  allProductsSearch.addEventListener('input', filterAllProducts);
}

if (allProductsContainer) {
  allProductsContainer.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add-id]');
    if (!addButton) return;

    const productId = addButton.getAttribute('data-add-id');
    const product = DEMO_PRODUCTS.find(item => item.id === productId);

    if (!product) return;

    if (typeof addToCart === 'function') {
      addToCart(product);
    }

    if (typeof renderCart === 'function') {
      renderCart();
    }

    if (typeof openCart === 'function') {
      openCart();
    } else {
      const cartDrawer = document.getElementById('cartDrawer');
      const cartOverlay = document.getElementById('cartOverlay');

      if (cartDrawer) cartDrawer.classList.add('active');
      if (cartOverlay) cartOverlay.classList.add('active');

      document.body.style.overflow = 'hidden';
    }
  });
}

renderAllProducts(DEMO_PRODUCTS);
