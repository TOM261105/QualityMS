/* ── SHOPIFY STOREFRONT API ─────────────────────────
   Este archivo permite que la tienda lea:
   - Categorías desde Shopify Collections
   - Productos desde Shopify Products
   - Precios desde variantes de Shopify
   - Precio distribuidor desde metafields
   - Checkout desde Shopify Cart
──────────────────────────────────────────────────── */

function isShopifyReady() {
  return (
    typeof SHOPIFY_CONFIG !== "undefined" &&
    SHOPIFY_CONFIG.useShopify === true &&
    SHOPIFY_CONFIG.shopDomain &&
    SHOPIFY_CONFIG.storefrontAccessToken &&
    !SHOPIFY_CONFIG.shopDomain.includes("tu-tienda") &&
    !SHOPIFY_CONFIG.storefrontAccessToken.includes("TU_STOREFRONT")
  );
}

async function shopifyRequest(query, variables = {}) {
  if (!isShopifyReady()) {
    throw new Error("Shopify no está configurado todavía.");
  }

  const endpoint = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify errors:", result.errors);
    throw new Error("Error al consultar Shopify.");
  }

  return result.data;
}

function moneyFormat(price) {
  return "Bajo cotización";
}

function normalizePriceNumber(price) {
  if (!price || !price.amount) return 0;
  return Number(price.amount) || 0;
}

function getProductMainCollection(product) {
  return product.collections?.edges?.[0]?.node || null;
}

/* ── LIMPIEZA DE MARCAS EN TÍTULOS ───────────────────────── */

const PRODUCT_BRANDS_TO_REMOVE = [
  "Welch Allyn",
  "Hillrom",
  "Hill-Rom",
  "Midmark",
  "SECA",
  "Seca"
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectProductBrand(title, collectionTitle) {
  const productTitle = String(title || "");
  const productCollection = String(collectionTitle || "");

  const foundBrand = PRODUCT_BRANDS_TO_REMOVE.find(brand => {
    const brandRegex = new RegExp(`^\\s*${escapeRegExp(brand)}\\b`, "i");
    const collectionRegex = new RegExp(`\\b${escapeRegExp(brand)}\\b`, "i");

    return brandRegex.test(productTitle) || collectionRegex.test(productCollection);
  });

  if (foundBrand) return foundBrand;

  if (productCollection.includes("|")) {
    return productCollection.split("|")[0].trim();
  }

  return "";
}

function cleanShopifyProductTitle(title, brand) {
  let cleanTitle = String(title || "").trim();

  if (brand) {
    const brandPattern = new RegExp(
      `^\\s*${escapeRegExp(brand)}\\s*(\\||-|–|—|:|/)?\\s*`,
      "i"
    );

    cleanTitle = cleanTitle.replace(brandPattern, "").trim();
  }

  PRODUCT_BRANDS_TO_REMOVE.forEach(item => {
    const pattern = new RegExp(
      `^\\s*${escapeRegExp(item)}\\s*(\\||-|–|—|:|/)?\\s*`,
      "i"
    );

    cleanTitle = cleanTitle.replace(pattern, "").trim();
  });

  return cleanTitle || title || "Producto";
}

function addBrandToProductDescription(description, brand) {
  const cleanDescription = String(description || "Sin descripción disponible.").trim();

  if (!brand) return cleanDescription;

  if (cleanDescription.toLowerCase().includes(brand.toLowerCase())) {
    return cleanDescription;
  }

  return `Marca: ${brand}. ${cleanDescription}`;
}

function mapShopifyCollection(collection) {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description || "Explora los productos disponibles en esta categoría.",
    image: collection.image?.url || "assets/diagnostico.png",
    altText: collection.image?.altText || collection.title
  };
}

function mapShopifyProduct(product) {
  const firstVariant = product.variants?.edges?.[0]?.node || null;
  const firstCollection = getProductMainCollection(product);
  const price = firstVariant?.price || null;
  const priceNumber = normalizePriceNumber(price);

  const brand = detectProductBrand(product.title, firstCollection?.title);
  const cleanTitle = cleanShopifyProductTitle(product.title, brand);
  const cleanDescription = addBrandToProductDescription(product.description, brand);

  return {
    id: product.id,
    handle: product.handle,
    originalTitle: product.title,
    title: cleanTitle,
    category: firstCollection?.handle || "general",
    categoryName: firstCollection?.title || "General",
    price: 0,
    priceGeneral: "Bajo cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Bajo cotización",
    image: product.featuredImage?.url || "assets/diagnostico.png",
    imageAlt: product.featuredImage?.altText || cleanTitle,
    description: cleanDescription,
    availability: "Disponible para cotización",
    type: "cotizacion",
    variantId: firstVariant?.id || null
  };
}

function getDemoCollections() {
  if (typeof CATEGORY_INFO === "undefined") return [];

  const images = {
    diagnostico: "assets/estetoscopio.png",
    emergencias: "assets/emergencias.png",
    mobiliario: "assets/mobiliario.png",
    monitoreo: "assets/monitoreo.png",
    mujer: "assets/mujer.png",
    especialidades: "assets/especialidades.png",
    bienestar: "assets/nutricion.png",
    orl: "assets/diagnostico.png"
  };

  return Object.keys(CATEGORY_INFO).map(handle => {
    const info = CATEGORY_INFO[handle];

    return {
      id: handle,
      handle,
      title: info.title,
      description: info.description,
      image: images[handle] || "assets/diagnostico.png",
      altText: info.title
    };
  });
}

function getDemoProducts() {
  if (typeof DEMO_PRODUCTS === "undefined") return [];
  return DEMO_PRODUCTS;
}

function getProductDetailUrl(product, backUrl = "productos.html") {
  const backParam = encodeURIComponent(backUrl);

  if (typeof SHOPIFY_CONFIG !== "undefined" && SHOPIFY_CONFIG.useShopify && product.handle) {
    return `producto.html?handle=${encodeURIComponent(product.handle)}&back=${backParam}`;
  }

  return `producto.html?id=${encodeURIComponent(product.id)}&back=${backParam}`;
}

async function getStoreCollections() {
  if (!isShopifyReady()) return getDemoCollections();

  const query = `
    query GetCollections {
      collections(first: 100) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const data = await shopifyRequest(query);

  return data.collections.edges.map(edge => mapShopifyCollection(edge.node));
}

async function getStoreCollectionWithProducts(collectionHandle) {
  if (!isShopifyReady()) {
    const collection = getDemoCollections().find(item => item.handle === collectionHandle) || {
      id: collectionHandle,
      handle: collectionHandle,
      title: "Productos",
      description: "Explora los productos disponibles en esta categoría.",
      image: "assets/diagnostico.png"
    };

    const products = getDemoProducts().filter(product => product.category === collectionHandle);

    return {
      collection,
      products
    };
  }

  const query = `
    query GetCollectionProducts($handle: String!, $cursor: String) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(first: 250, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
              metafield(namespace: "custom", key: "precio_distribuidor") {
                value
              }
              collections(first: 3) {
                edges {
                  node {
                    title
                    handle
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  let collectionData = null;
  let allProducts = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyRequest(query, {
      handle: collectionHandle,
      cursor
    });

    if (!data.collection) {
      return {
        collection: null,
        products: []
      };
    }

    if (!collectionData) {
      collectionData = mapShopifyCollection(data.collection);
    }

    const products = data.collection.products.edges.map(edge => mapShopifyProduct(edge.node));

    allProducts = allProducts.concat(products);

    hasNextPage = data.collection.products.pageInfo.hasNextPage;
    cursor = data.collection.products.pageInfo.endCursor;
  }

  return {
    collection: collectionData,
    products: allProducts
  };
}

async function getStoreProducts() {
  if (!isShopifyReady()) return getDemoProducts();

  const query = `
    query GetProducts($cursor: String) {
      products(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
            metafield(namespace: "custom", key: "precio_distribuidor") {
              value
            }
            collections(first: 3) {
              edges {
                node {
                  title
                  handle
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  let allProducts = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyRequest(query, { cursor });

    const products = data.products.edges.map(edge => mapShopifyProduct(edge.node));

    allProducts = allProducts.concat(products);

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allProducts;
}

async function getStoreProductByHandle(productHandle) {
  if (!isShopifyReady()) {
    return getDemoProducts().find(product => product.id === productHandle || product.handle === productHandle) || null;
  }

  const query = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        availableForSale
        featuredImage {
          url
          altText
        }
        metafield(namespace: "custom", key: "precio_distribuidor") {
          value
        }
        collections(first: 3) {
          edges {
            node {
              title
              handle
            }
          }
        }
        variants(first: 1) {
          edges {
            node {
              id
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyRequest(query, {
    handle: productHandle
  });

  if (!data.product) return null;

  return mapShopifyProduct(data.product);
}

async function createShopifyCart(cartItems) {
  if (!isShopifyReady()) {
    alert("Shopify todavía no está configurado.");
    return null;
  }

  const lines = cartItems
    .filter(item => item.variantId)
    .map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity
    }));

  if (!lines.length) {
    alert("Este carrito no tiene productos comprables en Shopify.");
    return null;
  }

  const mutation = `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyRequest(mutation, {
    input: {
      lines
    }
  });

  const errors = data.cartCreate.userErrors;

  if (errors && errors.length) {
    console.error(errors);
    alert("Hubo un error al crear el carrito.");
    return null;
  }

  return data.cartCreate.cart.checkoutUrl;
}
