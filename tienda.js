/* ── CATEGORÍAS DINÁMICAS DE TIENDA ─────────────────────── */

const dynamicCategoriesGrid = document.getElementById("dynamicCategoriesGrid");
const dynamicCategoryCount = document.getElementById("dynamicCategoryCount");

function countDemoProductsByCategory(handle) {
  if (typeof DEMO_PRODUCTS === "undefined") return 0;
  return DEMO_PRODUCTS.filter(product => product.category === handle).length;
}

function renderCategories(collections) {
  if (!dynamicCategoriesGrid) return;

  if (!collections || collections.length === 0) {
    dynamicCategoriesGrid.innerHTML = `
      <div class="empty-products">
        No hay categorías disponibles.
      </div>
    `;
    return;
  }

  if (dynamicCategoryCount) {
    dynamicCategoryCount.textContent = collections.length;
  }

  dynamicCategoriesGrid.innerHTML = collections.map((collection, index) => {
    const productCount = isShopifyReady()
      ? "Ver productos"
      : `+${countDemoProductsByCategory(collection.handle)} productos`;

    const badge = index === 0
      ? `<span class="pc-badge">Categoría</span>`
      : "";

    return `
      <article class="product-card" data-href="categoria.html?cat=${encodeURIComponent(collection.handle)}">
        <div class="pc-img">
          ${badge}
          <img src="${collection.image}" alt="${collection.altText || collection.title}">
        </div>

        <div class="pc-body">
          <p class="pc-cat">Categoría</p>

          <h3>${collection.title}</h3>

          <p>${collection.description || "Explora los productos disponibles en esta categoría."}</p>
        </div>

        <div class="pc-footer">
          <span class="pc-count">${productCount}</span>

          <a href="categoria.html?cat=${encodeURIComponent(collection.handle)}" class="btn-card">
            Ver catálogo →
          </a>
        </div>
      </article>
    `;
  }).join("");

  makeCategoryCardsClickable();
}

function makeCategoryCardsClickable() {
  document.querySelectorAll(".equipo-section .product-card").forEach(card => {
    const href = card.dataset.href;

    if (!href) return;

    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    card.addEventListener("click", event => {
      if (event.target.closest("a, button")) return;
      window.location.href = href;
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = href;
      }
    });
  });
}

async function loadStoreCategories() {
  if (!dynamicCategoriesGrid) return;

  dynamicCategoriesGrid.innerHTML = `
    <div class="empty-products">
      Cargando categorías...
    </div>
  `;

  try {
    const collections = await getStoreCollections();
    renderCategories(collections);
  } catch (error) {
    console.error(error);
    renderCategories(getDemoCollections());
  }
}

loadStoreCategories();
