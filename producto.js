/* ── PÁGINA INDIVIDUAL DE PRODUCTO ───────────────────────── */

const singleProductContainer = document.getElementById('singleProductContainer');

function getSelectedProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderSingleProduct() {
  const productId = getSelectedProductId();
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
    ? `<button id="singleAddToCart" class="btn-primary">Agregar al carrito</button>`
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
      if (typeof addToCart === 'function') {
        addToCart(product);
      }

      if (typeof renderCart === 'function') {
        renderCart();
      }

      if (typeof updateCartCount === 'function') {
        updateCartCount();
      }

      const cartDrawer = document.getElementById('cartDrawer');
      const cartOverlay = document.getElementById('cartOverlay');

      if (cartDrawer) {
        cartDrawer.classList.add('active');
      }

      if (cartOverlay) {
        cartOverlay.classList.add('active');
      }

      document.body.style.overflow = 'hidden';
    });
  }
}

renderSingleProduct();
