const allProductsContainer = document.getElementById("allProductsContainer");
const allProductsSearch = document.getElementById("allProductsSearch");

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

let allProductsList = [];

async function initAllProductsPage() {
  if (SHOPIFY_CONFIG.useShopify) {
    allProductsList = await getAllShopifyProducts();
  } else {
    allProductsList = DEMO_PRODUCTS;
  }

  renderGroupedProducts(allProductsList);
}

function renderGroupedProducts(products) {
  if (!allProductsContainer) return;

  if (!products.length) {
    allProductsContainer.innerHTML = `
      <div class="empty-products">
        <p>No hay productos disponibles.</p>
      </div>
    `;
    return;
  }

  const groupedHTML = categoryOrder.map(categoryKey => {
    const categoryProducts = products.filter(product => product.category === categoryKey);

    if (!categoryProducts.length) return "";

    const info = CATEGORY_INFO[categoryKey];

    return `
      <section class="all-products-group">
        <div class="all-products-group-header">
          <div>
            <span>${info.eyebrow}</span>
            <h3>${info.title}</h3>
          </div>

          <a href="categoria.html?cat=${categoryKey}" class="group-link">
            Ver sección →
          </a>
        </div>

        <div class="all-products-row">
          ${categoryProducts.map(product => productCardTemplate(product)).join("")}
        </div>
      </section>
    `;
  }).join("");

  allProductsContainer.innerHTML = groupedHTML;
  bindAllProductButtons();
}

function productCardTemplate(product) {
  const buttonText = product.type === "cotizacion"
    ? "Solicitar cotización"
    : "Agregar al carrito";

  const buttonClass = product.type === "cotizacion"
    ? "product-action quote"
    : "product-action";

  return `
    <article class="shopify-product-card">
      <div class="shopify-product-img">
        <img src="${product.image}" alt="${product.title}">
        <span class="shopify-product-status">${product.availability}</span>
      </div>

      <div class="shopify-product-body">
        <p class="shopify-product-category">${product.categoryName}</p>
        <h4>${product.title}</h4>
        <p>${product.description}</p>

        <div class="shopify-product-footer">
          <strong>${product.priceText}</strong>

          <button 
            class="${buttonClass}" 
            data-product-id="${product.id}">
            ${buttonText}
          </button>
        </div>
      </div>
    </article>
  `;
}

function bindAllProductButtons() {
  document.querySelectorAll(".product-action").forEach(button => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      const product = allProductsList.find(item => item.id === productId);

      if (!product) return;

      if (product.type === "cotizacion") {
        const message = encodeURIComponent(`Hola, me interesa solicitar una cotización para: ${product.title}`);
        window.location.href = `contacto.html?producto=${message}`;
        return;
      }

      addToCart(product);
    });
  });
}

if (allProductsSearch) {
  allProductsSearch.addEventListener("input", () => {
    const searchValue = allProductsSearch.value.toLowerCase().trim();

    if (!searchValue) {
      renderGroupedProducts(allProductsList);
      return;
    }

    const filteredProducts = allProductsList.filter(product => {
      return product.title.toLowerCase().includes(searchValue) ||
             product.description.toLowerCase().includes(searchValue) ||
             product.categoryName.toLowerCase().includes(searchValue);
    });

    renderGroupedProducts(filteredProducts);
  });
}

/* Futura conexión con Shopify */
async function getAllShopifyProducts() {
  const endpoint = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  /*
    En Shopify, lo ideal es que tus colecciones tengan estos handles:
    diagnostico, emergencias, mobiliario, monitoreo, mujer, especialidades, bienestar, orl.

    Esta función pide productos colección por colección y los agrupa igual que la demo.
  */

  const allProducts = [];

  for (const categoryKey of categoryOrder) {
    const products = await getShopifyCollectionProducts(categoryKey);
    allProducts.push(...products);
  }

  return allProducts;
}

async function getShopifyCollectionProducts(categoryKey) {
  const endpoint = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  const query = `
    query CollectionProducts($handle: String!) {
      collection(handle: $handle) {
        title
        description
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              description
              availableForSale
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken
    },
    body: JSON.stringify({
      query,
      variables: {
        handle: categoryKey
      }
    })
  });

  const result = await response.json();
  const collection = result.data.collection;

  if (!collection) return [];

  return collection.products.edges.map(({ node }) => {
    const price = node.priceRange.minVariantPrice;
    const image = node.featuredImage;

    return {
      id: node.id,
      variantId: node.variants.edges[0]?.node.id,
      title: node.title,
      category: categoryKey,
      categoryName: collection.title,
      price: Number(price.amount),
      priceText: Number(price.amount).toLocaleString("es-MX", {
        style: "currency",
        currency: price.currencyCode
      }),
      image: image?.url || "assets/diagnostico.png",
      description: node.description || "Producto médico disponible en catálogo.",
      availability: node.availableForSale ? "Disponible" : "No disponible",
      type: node.availableForSale ? "venta" : "cotizacion"
    };
  });
}

initAllProductsPage();
