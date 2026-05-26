const productsContainer = document.getElementById("productsContainer");
const categoryFilter = document.getElementById("categoryFilter");

let activeProducts = [];

async function initStorefront() {
  if (SHOPIFY_CONFIG.useShopify) {
    activeProducts = await getShopifyProducts();
  } else {
    activeProducts = DEMO_PRODUCTS;
  }

  renderProducts(activeProducts);
}

function renderProducts(products) {
  if (!productsContainer) return;

  if (!products.length) {
    productsContainer.innerHTML = `
      <div class="empty-products">
        <p>No hay productos disponibles en esta categoría.</p>
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products.map(product => {
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
            <strong>${product.price}</strong>

            <button 
              class="${buttonClass}" 
              data-product-id="${product.id}"
              data-product-title="${product.title}"
              data-product-type="${product.type}">
              ${buttonText}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  activateProductButtons();
}

function activateProductButtons() {
  document.querySelectorAll(".product-action").forEach(button => {
    button.addEventListener("click", () => {
      const productType = button.dataset.productType;
      const productTitle = button.dataset.productTitle;

      if (productType === "cotizacion") {
        const message = encodeURIComponent(`Hola, me interesa solicitar una cotización para: ${productTitle}`);
        window.location.href = `contacto.html?producto=${message}`;
        return;
      }

      if (SHOPIFY_CONFIG.useShopify) {
        alert("Aquí se conectará con el carrito de Shopify.");
      } else {
        alert(`Producto agregado a demo: ${productTitle}`);
      }
    });
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    const selectedCategory = categoryFilter.value;

    if (selectedCategory === "todos") {
      renderProducts(activeProducts);
      return;
    }

    const filteredProducts = activeProducts.filter(product => {
      return product.category === selectedCategory;
    });

    renderProducts(filteredProducts);
  });
}

async function getShopifyProducts() {
  const endpoint = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  const query = `
    query Products {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            description
            productType
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
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();

  return result.data.products.edges.map(({ node }) => {
    const price = node.priceRange.minVariantPrice;
    const image = node.featuredImage;

    return {
      id: node.id,
      variantId: node.variants.edges[0]?.node.id,
      title: node.title,
      category: normalizeCategory(node.productType),
      categoryName: node.productType || "Producto médico",
      price: `${Number(price.amount).toLocaleString("es-MX", {
        style: "currency",
        currency: price.currencyCode
      })}`,
      image: image?.url || "assets/diagnostico.png",
      description: node.description || "Producto médico disponible en catálogo.",
      availability: node.availableForSale ? "Disponible" : "No disponible",
      type: node.availableForSale ? "venta" : "cotizacion"
    };
  });
}

function normalizeCategory(category) {
  if (!category) return "diagnostico";

  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

initStorefront();
