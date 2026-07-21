/* ── PÁGINA DE CATEGORÍA ───────────────────────── */

const categoryEyebrow = document.getElementById('categoryEyebrow');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescription = document.getElementById('categoryDescription');
const categoryProducts = document.getElementById('categoryProducts');
const productSearch = document.getElementById('productSearch');

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cat') || 'diagnostico';
}

function getSelectedCategoryInfo(category) {
  return CATEGORY_INFO[category] || {
    title: 'Productos',
    eyebrow: 'Catálogo',
    description: 'Explora los productos disponibles en esta categoría.'
  };
}

function getCategoryProducts() {
  const selectedCategory = getSelectedCategory();

  if (typeof DEMO_PRODUCTS === 'undefined') {
    return [];
  }

  return DEMO_PRODUCTS.filter(product => product.category === selectedCategory);
}

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || 'Solicitar cotización';
}

function renderCategoryHeader() {
  const selectedCategory = getSelectedCategory();
  const info = getSelectedCategoryInfo(selectedCategory);

  if (categoryEyebrow) categoryEyebrow.textContent = info.eyebrow;
  if (categoryTitle) categoryTitle.textContent = info.title;
  if (categoryDescription) categoryDescription.textContent = info.description;
}

function renderCategoryProducts(products) {
  if (!categoryProducts) return;

  if (!products || products.length === 0) {
    categoryProducts.innerHTML = `
      <div class="empty-products">
        No se encontraron productos en esta categoría.
      </div>
    `;
    return;
  }

  categoryProducts.innerHTML = products.map(product => {
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
            <a href="producto.html?id=${product.id}" class="product-action light">
              Ver más información
            </a>

            ${actionButton}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterCategoryProducts() {
  const searchTerm = productSearch.value.toLowerCase().trim();
  const products = getCategoryProducts();

  const filteredProducts = products.filter(product => {
    const searchableText = `
      ${product.title || ''}
      ${product.description || ''}
      ${product.categoryName || ''}
      ${product.priceGeneral || ''}
      ${product.priceDistributor || ''}
      ${product.priceText || ''}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderCategoryProducts(filteredProducts);
}

if (productSearch) {
  productSearch.addEventListener('input', filterCategoryProducts);
}

if (categoryProducts) {
  categoryProducts.addEventListener('click', event => {
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

renderCategoryHeader();
renderCategoryProducts(getCategoryProducts());
