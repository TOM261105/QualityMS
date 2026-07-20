/* ── LISTA COMPLETA DE PRODUCTOS EN TIENDA ───────────────── */

const toggleProductListBtn = document.getElementById('toggleProductList');
const productListSection = document.getElementById('productListSection');
const closeProductListBtn = document.getElementById('closeProductList');
const productListBody = document.getElementById('productListBody');
const productListSearch = document.getElementById('productListSearch');

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || 'Cotizar';
}

function getProductDistributorPrice(product) {
  return product.priceDistributor || product.distributorPriceText || 'Cotizar';
}

function renderProductList(products) {
  if (!productListBody) return;

  if (!products || products.length === 0) {
    productListBody.innerHTML = `
      <tr>
        <td colspan="5" class="product-list-empty">
          No se encontraron productos.
        </td>
      </tr>
    `;
    return;
  }

  productListBody.innerHTML = products.map(product => `
    <tr>
      <td>${product.categoryName || product.category || 'General'}</td>
      <td><strong>${product.title || 'Producto sin nombre'}</strong></td>
      <td>${product.description || 'Sin descripción disponible.'}</td>
      <td>${getProductGeneralPrice(product)}</td>
      <td>${getProductDistributorPrice(product)}</td>
    </tr>
  `).join('');
}

function openProductList() {
  if (!productListSection) return;

  productListSection.classList.add('active');

  if (typeof DEMO_PRODUCTS !== 'undefined') {
    renderProductList(DEMO_PRODUCTS);
  } else {
    renderProductList([]);
  }

  setTimeout(() => {
    productListSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}

function closeProductList() {
  if (!productListSection) return;
  productListSection.classList.remove('active');
}

if (toggleProductListBtn) {
  toggleProductListBtn.addEventListener('click', openProductList);
}

if (closeProductListBtn) {
  closeProductListBtn.addEventListener('click', closeProductList);
}

if (productListSearch) {
  productListSearch.addEventListener('input', () => {
    const searchTerm = productListSearch.value.toLowerCase().trim();

    if (typeof DEMO_PRODUCTS === 'undefined') {
      renderProductList([]);
      return;
    }

    const filteredProducts = DEMO_PRODUCTS.filter(product => {
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
  });
}
