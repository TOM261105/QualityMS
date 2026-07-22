/* ── TODOS LOS PRODUCTOS AGRUPADOS ───────────────────────── */

const allProductsContainer = document.getElementById("allProductsContainer");
const allProductsSearch = document.getElementById("allProductsSearch");

let allStoreProducts = [];
let allStoreCollections = [];

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || "Solicitar cotización";
}

function renderProductCard(product) {
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
          <a href="${getProductDetailUrl(product, "productos.html")}" class="product-action light">
            Ver más información
          </a>

          ${actionButton}
        </div>
      </div>
    </article>
  `;
}

function getCollectionInfo(handle) {
  return allStoreCollections.find(collection => collection.handle === handle) || {
    handle,
    title: handle === "general" ? "General" : handle,
    description: "",
    eyebrow: "Catálogo"
  };
}

function getOrderedCategoryHandles(products) {
  const productHandles = [...new Set(products.map(product => product.category || "general"))];

  const collectionHandles = allStoreCollections.map(collection => collection.handle);
  const orderedHandles = collectionHandles.filter(handle => productHandles.includes(handle));

  productHandles.forEach(handle => {
    if (!orderedHandles.includes(handle)) orderedHandles.push(handle);
  });

  return orderedHandles;
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

  const categoryHandles = getOrderedCategoryHandles(products);

  const groupsHtml = categoryHandles.map(categoryHandle => {
    const categoryProducts = products.filter(product => (product.category || "general") === categoryHandle);

    if (categoryProducts.length === 0) return "";

    const info = getCollectionInfo(categoryHandle);

    return `
      <section class="all-products-group">
        <div class="all-products-group-header">
          <div>
            <span>Catálogo</span>
            <h3>${info.title}</h3>
          </div>

          <a href="categoria.html?cat=${encodeURIComponent(categoryHandle)}" class="group-link">
            Ver sección →
          </a>
        </div>

        <div class="all-products-row">
          ${categoryProducts.map(product => renderProductCard(product)).join("")}
        </div>
      </section>
    `;
  }).join("");

  allProductsContainer.innerHTML = groupsHtml;
}

function filterAllProducts() {
  if (!allProductsSearch) return;

  const searchTerm = allProductsSearch.value.toLowerCase().trim();

  const filteredProducts = allStoreProducts.filter(product => {
    const searchableText = `
      ${product.title || ""}
      ${product.description || ""}
      ${product.categoryName || ""}
      ${product.category || ""}
      ${product.priceGeneral || ""}
      ${product.priceDistributor || ""}
      ${product.priceText || ""}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderAllProducts(filteredProducts);
}

if (allProductsSearch) {
  allProductsSearch.addEventListener("input", filterAllProducts);
}

if (allProductsContainer) {
  allProductsContainer.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");
    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const product = allStoreProducts.find(item => item.id === productId);

    if (!product) return;

    if (typeof addToCart === "function") {
      addToCart(product);
    }
  });
}

async function loadAllProductsPage() {
  if (allProductsContainer) {
    allProductsContainer.innerHTML = `
      <div class="empty-products">
        Cargando productos...
      </div>
    `;
  }

  try {
    allStoreCollections = await getStoreCollections();
    allStoreProducts = await getStoreProducts();
    renderAllProducts(allStoreProducts);
  } catch (error) {
    console.error(error);

    allStoreCollections = getDemoCollections();
    allStoreProducts = getDemoProducts();
    renderAllProducts(allStoreProducts);
  }
}

loadAllProductsPage();
