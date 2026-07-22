/* ── LISTA COMPLETA DE PRODUCTOS ──────────────────────────── */

const productListBody = document.getElementById("productListBody");
const productListSearch = document.getElementById("productListSearch");

let currentProductList = [];

function getSelectedCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat");
}

function getProductGeneralPrice(product) {
  return product.priceGeneral || product.priceText || "Solicitar cotización";
}

function getProductDistributorPrice(product) {
  return product.priceDistributor || "Cotizar con ejecutivo";
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
    const backUrl = "lista-productos.html" + window.location.search;

    const actionButton = product.type === "venta"
      ? `<button class="product-action" data-add-id="${product.id}">Agregar al carrito</button>`
      : `<a href="contacto.html?producto=${encodeURIComponent(product.title)}" class="product-action quote">Solicitar cotización</a>`;

    return `
      <tr>
        <td>${product.categoryName || product.category || "General"}</td>

        <td>
          <strong>${product.title || "Producto sin nombre"}</strong>
        </td>

        <td>${product.description || "Sin descripción disponible."}</td>

        <td>${getProductGeneralPrice(product)}</td>

        <td>${getProductDistributorPrice(product)}</td>

        <td>
          <div class="product-list-actions">
            <a href="${getProductDetailUrl(product, backUrl)}" class="product-action light">
              Ver más información
            </a>

            ${actionButton}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterProductList() {
  if (!productListSearch) return;

  const searchTerm = productListSearch.value.toLowerCase().trim();

  const filteredProducts = currentProductList.filter(product => {
    const searchableText = `
      ${product.categoryName || ""}
      ${product.category || ""}
      ${product.title || ""}
      ${product.description || ""}
      ${product.priceGeneral || ""}
      ${product.priceDistributor || ""}
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderProductList(filteredProducts);
}

if (productListSearch) {
  productListSearch.addEventListener("input", filterProductList);
}

if (productListBody) {
  productListBody.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-id]");
    if (!addButton) return;

    const productId = addButton.getAttribute("data-add-id");
    const product = currentProductList.find(item => item.id === productId);

    if (!product) return;

    if (typeof addToCart === "function") {
      addToCart(product);
    }
  });
}

async function loadProductListPage() {
  if (productListBody) {
    productListBody.innerHTML = `
      <tr>
        <td colspan="6" class="product-list-empty">
          Cargando productos...
        </td>
      </tr>
    `;
  }

  try {
    const selectedCategory = getSelectedCategoryFromUrl();

    if (selectedCategory) {
      const { products } = await getStoreCollectionWithProducts(selectedCategory);
      currentProductList = products;
    } else {
      currentProductList = await getStoreProducts();
    }

    renderProductList(currentProductList);
  } catch (error) {
    console.error(error);

    const selectedCategory = getSelectedCategoryFromUrl();
    const demoProducts = getDemoProducts();

    currentProductList = selectedCategory
      ? demoProducts.filter(product => product.category === selectedCategory)
      : demoProducts;

    renderProductList(currentProductList);
  }
}

loadProductListPage();
