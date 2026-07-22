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
  if (!price || !price.amount) return "Solicitar cotización";

  const amount = Number(price.amount);
  const currency = price.currencyCode || "MXN";

  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency
  });
}

function normalizePriceNumber(price) {
  if (!price || !price.amount) return 0;
  return Number(price.amount) || 0;
}

function getProductMainCollection(product) {
  return product.collections?.edges?.[0]?.node || null;
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
  const priceText = moneyFormat(price);
  const distributorPrice = product.metafield?.value || "Cotizar con ejecutivo";
  const canSell = Boolean(product.availableForSale && firstVariant?.id && priceNumber > 0);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    category: firstCollection?.handle || "general",
    categoryName: firstCollection?.title || "General",
    price: priceNumber,
    priceGeneral: priceText,
    priceDistributor: distributorPrice,
    priceText,
    image: product.featuredImage?.url || "assets/diagnostico.png",
    imageAlt: product.featuredImage?.altText || product.title,
    description: product.description || "Sin descripción disponible.",
    availability: product.availableForSale ? "Disponible" : "Bajo cotización",
    type: canSell ? "venta" : "cotizacion",
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
    query GetCollectionProducts($handle: String!) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(first: 100) {
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

  const data = await shopifyRequest(query, {
    handle: collectionHandle
  });

  if (!data.collection) {
    return {
      collection: null,
      products: []
    };
  }

  return {
    collection: mapShopifyCollection(data.collection),
    products: data.collection.products.edges.map(edge => mapShopifyProduct(edge.node))
  };
}

async function getStoreProducts() {
  if (!isShopifyReady()) return getDemoProducts();

  const query = `
    query GetProducts {
      products(first: 250) {
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

  const data = await shopifyRequest(query);

  return data.products.edges.map(edge => mapShopifyProduct(edge.node));
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
