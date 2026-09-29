/* ── LISTA COMPLETA DE PRODUCTOS ──────────────────────────── */

const productListBody = document.getElementById("productListBody");
const productListSearch = document.getElementById("productListSearch");

let currentProductList = [];
let filteredProductList = [];
let currentProductPage = 1;

const PRODUCTS_PER_PAGE = 50;

function getSelectedCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat");
}

function cleanProductDescription(description) {
  if (!description) return "Sin descripción disponible.";

  const temp = document.createElement("div");
  temp.innerHTML = description;

  temp.querySelectorAll("p, div, span, li").forEach(element => {
    const text = element.textContent.toLowerCase();

    if (
      text.includes("precio distribuidor") ||
      text.includes("precio para distribuidor") ||
      text.includes("distribuidor:") ||
      text.includes("precio general") ||
      text.includes("precio usd")
    ) {
      element.remove();
    }
  });

  const cleaned = temp.textContent.trim();

  return cleaned || "Sin descripción disponible.";
}

function getPaginationContainer() {
  let pagination = document.getElementById("productPagination");

  if (!pagination) {
    const tableWrap = document.querySelector(".product-table-wrap");

    if (!tableWrap) return null;

    pagination = document.createElement("div");
    pagination.id = "productPagination";
    pagination.className = "product-pagination";

    tableWrap.insertAdjacentElement("afterend", pagination);
  }

  return pagination;
}

function renderPaginationControls(totalProducts) {
  const pagination = getPaginationContainer();

  if (!pagination) return;

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const startItem = (currentProductPage - 1) * PRODUCTS_PER_PAGE + 1;
  const endItem = Math.min(currentProductPage * PRODUCTS_PER_PAGE, totalProducts);

  pagination.innerHTML = `
    <div class="product-pagination-info">
      Mostrando ${startItem}-${endItem} de ${totalProducts} productos
    </div>

    <div class="product-pagination-actions">
      <button 
        type="button" 
        class="pagination-btn"
        data-page-action="prev"
        ${currentProductPage === 1 ? "disabled" : ""}>
        ← Anterior
      </button>

      <span class="pagination-current">
        Página ${currentProductPage} de ${totalPages}
      </span>

      <button 
        type="button" 
        class="pagination-btn"
        data-page-action="next"
        ${currentProductPage === totalPages ? "disabled" : ""}>
        Siguiente →
      </button>
    </div>
  `;
}

function renderProductList(products, resetPage = false) {
  if (!productListBody) return;

  filteredProductList = products || [];

  if (resetPage) {
    currentProductPage = 1;
  }

  if (!filteredProductList.length) {
    productListBody.innerHTML = `
      <tr>
        <td colspan="5" class="product-list-empty">
          No se encontraron productos.
        </td>
      </tr>
    `;

    renderPaginationControls(0);
    return;
  }

  const totalPages = Math.ceil(filteredProductList.length / PRODUCTS_PER_PAGE);

  if (currentProductPage > totalPages) {
    currentProductPage = totalPages;
  }

  const startIndex = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const productsToShow = filteredProductList.slice(startIndex, endIndex);

  productListBody.innerHTML = productsToShow.map(product => {
    const backUrl = "lista-productos.html" + window.location.search;

    return `
      <tr>
        <td>${product.categoryName || product.category || "General"}</td>

        <td>
          <strong>${product.title || "Producto sin nombre"}</strong>
        </td>

        <td>${cleanProductDescription(product.description)}</td>

        <td>
          <strong>Bajo cotización</strong>
        </td>

        <td>
          <div class="product-list-actions">
            <a href="${getProductDetailUrl(product, backUrl)}" class="product-action light">
              Ver más información
            </a>

            <button class="product-action" data-add-id="${product.id}">
              Agregar a cotización
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderPaginationControls(filteredProductList.length);
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
    `.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderProductList(filteredProducts, true);
}

if (productListSearch) {
  productListSearch.addEventListener("input", filterProductList);
}

document.addEventListener("click", event => {
  const paginationButton = event.target.closest("[data-page-action]");

  if (!paginationButton) return;

  const action = paginationButton.getAttribute("data-page-action");
  const totalPages = Math.ceil(filteredProductList.length / PRODUCTS_PER_PAGE);

  if (action === "prev" && currentProductPage > 1) {
    currentProductPage -= 1;
  }

  if (action === "next" && currentProductPage < totalPages) {
    currentProductPage += 1;
  }

  renderProductList(filteredProductList);

  const tableWrap = document.querySelector(".product-table-wrap");

  if (tableWrap) {
    tableWrap.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

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
        <td colspan="5" class="product-list-empty">
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

    renderProductList(currentProductList, true);
  } catch (error) {
    console.error(error);

    const selectedCategory = getSelectedCategoryFromUrl();
    const demoProducts = getDemoProducts();

    currentProductList = selectedCategory
      ? demoProducts.filter(product => product.category === selectedCategory)
      : demoProducts;

    renderProductList(currentProductList, true);
  }
}

loadProductListPage();
