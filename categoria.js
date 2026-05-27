const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("cat") || "diagnostico";

const categoryTitle = document.getElementById("categoryTitle");
const categoryEyebrow = document.getElementById("categoryEyebrow");
const categoryDescription = document.getElementById("categoryDescription");
const categoryProducts = document.getElementById("categoryProducts");
const productSearch = document.getElementById("productSearch");

let categoryProductList = [];

async function initCategoryPage() {
  const info = CATEGORY_INFO[selectedCategory] || CATEGORY_INFO.diagnostico;

  categoryTitle.textContent = info.title;
  categoryEyebrow.textContent = info.eyebrow;
  categoryDescription.textContent = info.description;

  if (SHOPIFY_CONFIG.useShopify) {
    categoryProductList = await getShopifyProductsByCategory(selectedCategory);
  } else {
    categoryProductList = DEMO_PRODUCTS.filter(product => product.category === selectedCategory);
  }

  renderCategoryProducts(categoryProductList);
}

function renderCategoryProducts(products) {
  if (!categoryProducts) return;

  if (!products.length) {
    categoryProducts.innerHTML = `
      <div class="empty-products">
        <p>No hay productos disponibles en esta categoría.</p>
      </div>
    `;
    return;
  }

  categoryProducts.innerHTML = products.map(product => {
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
  }).join("");

  bindProductButtons();
}

function bindProductButtons() {
  document.querySelectorAll(".product-action").forEach(button => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      const product = categoryProductList.find(item => item.id === productId);

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

if (productSearch) {
  productSearch.addEventListener("input", () => {
    const searchValue = productSearch.value.toLowerCase().trim();

    const filteredProducts = categoryProductList.filter(product => {
      return product.title.toLowerCase().includes(searchValue) ||
             product.description.toLowerCase().includes(searchValue);
    });

    renderCategoryProducts(filteredProducts);
  });
}

async function getShopifyProductsByCategory(category) {
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
        handle: category
      }
    })
  });

  const result = await response.json();

  const products = result.data.collection?.products?.edges || [];

  return products.map(({ node }) => {
    const price = node.priceRange.minVariantPrice;
    const image = node.featuredImage;

    return {
      id: node.id,
      variantId: node.variants.edges[0]?.node.id,
      title: node.title,
      category: category,
      categoryName: result.data.collection.title,
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

initCategoryPage();
