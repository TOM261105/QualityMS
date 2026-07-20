/* ── LISTA COMPLETA DE PRODUCTOS ──────────────────────────── */

const productListBody = document.getElementById('productListBody');
const productListSearch = document.getElementById('productListSearch');

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || 'Solicitar cotización';
}

function getProductDistributorPrice(product) {
  return product.priceDistributor || 'Cotizar con ejecutivo';
}

function getProductsByUrlCategory() {
  const params = new URLSearchParams(window.location.search);
  const selectedCategory = params.get('cat');

  if (!selectedCategory) return DEMO_PRODUCTS;

  return DEMO_PRODUCTS.filter(product => product.category === selectedCategory);
}

function renderProductList(products) {
  if (!productListBody) return;

  if (!products || products.length === 0) {
    productListBody.innerHTML = `
      <tr>
        <td colspan="6" class="product-list-empty">
          No se encontraron productos.
        </td>
      </tr>
    `;
    return;
  }

  productListBody.innerHTML = products.map(product => {
    const actionButton = product.type === 'venta'
      ? `<button class="product-action" data-add-id="${product.id}">Agregar al carrito</button>`
      : `<a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="product-action quote">Solicitar cotización</a>`;

    return `
      <tr>
        <td>${product.categoryName || product.category || 'General'}</td>

        <td>
          <strong>${product.title || 'Producto sin nombre'}</strong>
        </td>

        <td>${product.description || 'Sin descripción disponible.'}</td>

        <td>${getProductGeneralPrice(product)}</td>

        <td>${getProductDistributorPrice(product)}</td>

        <td>
          <div class="product-list-actions">
            <a href="producto.html?id=${product.id}" class="product-action light">
              Ver más información
            </a>

            ${actionButton}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProductList() {
  const searchTerm = productListSearch.value.toLowerCase().trim();
  const baseProducts = getProductsByUrlCategory();

  const filteredProducts = baseProducts.filter(product => {
    const searchableText = `
      ${product.categoryName || ''}
      ${product.category || ''}
      ${product.title || ''}
      ${product.description || ''}
      ${product.priceGeneral || ''}
      ${product.priceDistributor || ''}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderProductList(filteredProducts);
}

if (productListSearch) {
  productListSearch.addEventListener('input', filterProductList);
}

if (productListBody) {
  productListBody.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add-id]');
    if (!addButton) return;

    const productId = addButton.getAttribute('data-add-id');
    const product = DEMO_PRODUCTS.find(item => item.id === productId);

    if (!product) return;

    if (typeof addToCart === 'function') {
      addToCart(product);
    }

    if (typeof openCart === 'function') {
      openCart();
    }
  });
}

renderProductList(getProductsByUrlCategory());
