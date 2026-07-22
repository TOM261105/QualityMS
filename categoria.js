/* ── PÁGINA DE CATEGORÍA ───────────────────────── */

const categoryEyebrow = document.getElementById("categoryEyebrow");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const categoryProducts = document.getElementById("categoryProducts");
const productSearch = document.getElementById("productSearch");

let currentCategoryProducts = [];

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat") || "diagnostico";
}

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || "Solicitar cotización";
}

function renderCategoryHeader(collection) {
  if (categoryEyebrow) categoryEyebrow.textContent = "Catálogo";
  if (categoryTitle) categoryTitle.textContent = collection?.title || "Productos";
  if (categoryDescription) {
    categoryDescription.textContent = collection?.description || "Explora los productos disponibles en esta categoría.";
  }
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
    const backUrl = `categoria.html?cat=${getSelectedCategory()}`;

    const actionButton = product.type === "venta"
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
          <span class="shopify-product-status">${product.availability || "Disponible"}</span>
          <img src="${product.image}" alt="${product.imageAlt || product.title}">
        </div>

        <div class="shopify-product-body">
          <p class="shopify-product-category">
            ${product.categoryName || product.category || "General"}
          </p>

          <h4>${product.title}</h4>

          <p>${product.description || "Sin descripción disponible."}</p>

          <div class="shopify-product-footer">
            <strong>${getProductGeneralPrice(product)}</strong>
          </div>

          <div class="shopify-product-actions">
            <a href="${getProductDetailUrl(product, backUrl)}" class="product-action light">
              Ver más información
            </a>

            ${actionButton}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function filterCategoryProducts() {
  if (!productSearch) return;

  const searchTerm = productSearch.value.toLowerCase().trim();

  const filteredProducts = currentCategoryProducts.filter(product => {
    const searchableText = `
      ${product.title || ""}
      ${product.description || ""}
      ${product.categoryName || ""}
      ${product.priceGeneral || ""}
      ${product.priceDistributor || ""}
      ${product.priceText || ""}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderCategoryProducts(filteredProducts);
}

if (productSearch) {
  productSearch.addEventListener("input", filterCategoryProducts);
}

if (categoryProducts) {
  categoryProducts.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");
    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const product = currentCategoryProducts.find(item => item.id === productId);

    if (!product) return;

    if (typeof addToCart === "function") {
      addToCart(product);
    }
  });
}

async function loadCategoryPage() {
  if (categoryProducts) {
    categoryProducts.innerHTML = `
      <div class="empty-products">
        Cargando productos...
      </div>
    `;
  }

  try {
    const selectedCategory = getSelectedCategory();
    const { collection, products } = await getStoreCollectionWithProducts(selectedCategory);

    renderCategoryHeader(collection);
    currentCategoryProducts = products;
    renderCategoryProducts(currentCategoryProducts);
  } catch (error) {
    console.error(error);

    const selectedCategory = getSelectedCategory();
    const fallbackCollection = getDemoCollections().find(item => item.handle === selectedCategory);
    const fallbackProducts = getDemoProducts().filter(product => product.category === selectedCategory);

    renderCategoryHeader(fallbackCollection);
    currentCategoryProducts = fallbackProducts;
    renderCategoryProducts(currentCategoryProducts);
  }
}

loadCategoryPage();
