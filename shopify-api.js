/* ── SHOPIFY STOREFRONT API ─────────────────────────
   Este archivo permite que la tienda lea:
   - Categorías desde Shopify Collections
   - Si no hay collections, arma categorías desde Vendor / Proveedor
   - Productos desde Shopify Products
   - Descripción larga desde Shopify descriptionHtml
   - Descripción corta desde metafield custom.descripcion_corta
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

function normalizePriceNumber(price) {
  if (!price || !price.amount) return 0;
  return Number(price.amount) || 0;
}

function getProductMainCollection(product) {
  return product.collections?.edges?.[0]?.node || null;
}

/* ── HELPERS ───────────────────────────────────── */

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripShopifyHTML(value) {
  const temp = document.createElement("div");
  temp.innerHTML = String(value || "");
  return temp.textContent.trim();
}

function handleizeCategory(value) {
  const clean = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "general";
}

/* ── LIMPIEZA DE MARCAS EN TÍTULOS ───────────────────────── */

const PRODUCT_BRANDS_TO_REMOVE = [
  "Welch Allyn",
  "Hillrom",
  "Hill-Rom",
  "Midmark",
  "SECA",
  "Seca",
  "Baxter",
  "Bovie",
  "HUNTLEIGH",
  "Huntleigh",
  "Mortara"
];

function detectProductBrand(title, collectionTitle, vendor) {
  const productTitle = String(title || "");
  const productCollection = String(collectionTitle || "");
  const productVendor = String(vendor || "").trim();

  if (productVendor) return productVendor;

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

  const plainText = stripShopifyHTML(cleanDescription);

  if (plainText.toLowerCase().includes(brand.toLowerCase())) {
    return cleanDescription;
  }

  return `Marca: ${brand}. ${cleanDescription}`;
}

function getProductCategoryInfo(product) {
  const firstCollection = getProductMainCollection(product);

  const vendor = String(product.vendor || "").trim();
  const productType = String(product.productType || "").trim();
  const collectionTitle = String(firstCollection?.title || "").trim();
  const collectionHandle = String(firstCollection?.handle || "").trim();

  const title =
    vendor ||
    collectionTitle ||
    productType ||
    "General";

  const handle =
    handleizeCategory(vendor) ||
    collectionHandle ||
    handleizeCategory(collectionTitle) ||
    handleizeCategory(productType) ||
    "general";

  return {
    handle,
    title
  };
}

/* ── MAPS ───────────────────────────────────── */

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
  const categoryInfo = getProductCategoryInfo(product);

  const brand = detectProductBrand(product.title, firstCollection?.title, product.vendor);
  const cleanTitleEs = cleanShopifyProductTitle(product.title, brand);

  const rawDescriptionHTMLEs =
    product.descriptionHtml ||
    product.description ||
    "";

  const rawDescriptionTextEs =
    product.description ||
    stripShopifyHTML(product.descriptionHtml) ||
    "";

  const cleanDescriptionHTMLEs = addBrandToProductDescription(rawDescriptionHTMLEs, brand);
  const cleanDescriptionTextEs = addBrandToProductDescription(rawDescriptionTextEs, brand);

  const shortDescriptionEs =
    product.shortDescription?.value ||
    product.descripcionCorta?.value ||
    "";

  const lang = localStorage.getItem("siteLang") || "es";

  const translation = window.getProductTranslation
    ? window.getProductTranslation(product.handle, lang)
    : null;

  const translationEs = window.getProductTranslation
    ? window.getProductTranslation(product.handle, "es")
    : null;

  const translationEn = window.getProductTranslation
    ? window.getProductTranslation(product.handle, "en")
    : null;

  const titleFinal =
    translation?.title ||
    cleanTitleEs;

  const shortDescriptionFinal =
    translation?.shortDescription ||
    shortDescriptionEs ||
    "";

  const descriptionFinal =
    translation?.description ||
    cleanDescriptionHTMLEs ||
    cleanDescriptionTextEs ||
    (lang === "en" ? "No description available." : "Sin descripción disponible.");

  const descriptionEs =
    translationEs?.description ||
    cleanDescriptionHTMLEs ||
    cleanDescriptionTextEs ||
    "Sin descripción disponible.";

  const descriptionEn =
    translationEn?.description ||
    cleanDescriptionHTMLEs ||
    cleanDescriptionTextEs ||
    "No description available.";

  return {
    id: product.id,
    handle: product.handle,
    originalTitle: product.title,

    title: titleFinal,
    titleEs: translationEs?.title || cleanTitleEs,
    titleEn: translationEn?.title || cleanTitleEs,

    category: categoryInfo.handle,
    categoryName: categoryInfo.title,

    price: 0,
    priceGeneral: lang === "en" ? "Quote only" : "Bajo cotización",
    priceDistributor: lang === "en" ? "Quote with an advisor" : "Cotizar con ejecutivo",
    priceText: lang === "en" ? "Quote only" : "Bajo cotización",

    image: product.featuredImage?.url || "assets/diagnostico.png",
    imageAlt: product.featuredImage?.altText || titleFinal,

    description: descriptionFinal,
    descriptionHtml: descriptionFinal,

    shortDescription: shortDescriptionFinal,

    descriptionEs,
    descriptionEn,

    shortDescriptionEs: translationEs?.shortDescription || shortDescriptionEs,
    shortDescriptionEn: translationEn?.shortDescription || shortDescriptionEs,

    availability: lang === "en" ? "Available for quote" : "Disponible para cotización",
    type: "cotizacion",
    variantId: firstVariant?.id || null
  };
}
function buildCollectionsFromProducts(products) {
  const categoryMap = new Map();

  products.forEach(product => {
    const handle = product.category || handleizeCategory(product.categoryName);
    const title = product.categoryName || "General";

    if (!categoryMap.has(handle)) {
      categoryMap.set(handle, {
        id: `generated-${handle}`,
        handle,
        title,
        description: `Productos de ${title}.`,
        image: product.image || "assets/diagnostico.png",
        altText: title,
        generatedFromProducts: true
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => {
    return a.title.localeCompare(b.title, "es");
  });
}

/* ── DEMO ───────────────────────────────────── */

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

/* ── PRODUCT QUERY FRAGMENT ───────────────────────────────────── */

const PRODUCT_FIELDS = `
  id
  title
  handle
  vendor
  productType
  description
  descriptionHtml
  availableForSale
  featuredImage {
    url
    altText
  }
  shortDescription: metafield(namespace: "custom", key: "descripcion_corta") {
    value
  }
  distributorPrice: metafield(namespace: "custom", key: "precio_distribuidor") {
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
`;

/* ── COLLECTIONS ───────────────────────────────────────── */

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

  const collections = data.collections.edges.map(edge => mapShopifyCollection(edge.node));

  if (collections.length > 0) {
    return collections;
  }

  const products = await getStoreProducts();
  return buildCollectionsFromProducts(products);
}

/* ── TODOS LOS PRODUCTOS ────────────────────────────────── */

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
            ${PRODUCT_FIELDS}
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

/* ── COLLECTION CON TODOS SUS PRODUCTOS ─────────────────── */

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
              ${PRODUCT_FIELDS}
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
  let collectionExists = false;

  while (hasNextPage) {
    const data = await shopifyRequest(query, {
      handle: collectionHandle,
      cursor
    });

    if (!data.collection) {
      break;
    }

    collectionExists = true;

    if (!collectionData) {
      collectionData = mapShopifyCollection(data.collection);
    }

    const products = data.collection.products.edges.map(edge => mapShopifyProduct(edge.node));

    allProducts = allProducts.concat(products);

    hasNextPage = data.collection.products.pageInfo.hasNextPage;
    cursor = data.collection.products.pageInfo.endCursor;
  }

  if (collectionExists && allProducts.length > 0) {
    return {
      collection: collectionData,
      products: allProducts
    };
  }

  const allStoreProducts = await getStoreProducts();
  const generatedCollections = buildCollectionsFromProducts(allStoreProducts);

  const fallbackCollection =
    generatedCollections.find(item => item.handle === collectionHandle) || {
      id: `generated-${collectionHandle}`,
      handle: collectionHandle,
      title: collectionHandle,
      description: "Explora los productos disponibles en esta categoría.",
      image: "assets/diagnostico.png",
      altText: collectionHandle
    };

  const fallbackProducts = allStoreProducts.filter(product => {
    return product.category === collectionHandle;
  });

  return {
    collection: fallbackCollection,
    products: fallbackProducts
  };
}

/* ── PRODUCTO INDIVIDUAL ────────────────────────────────── */

async function getStoreProductByHandle(productHandle) {
  if (!isShopifyReady()) {
    return getDemoProducts().find(product => product.id === productHandle || product.handle === productHandle) || null;
  }

  const query = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        ${PRODUCT_FIELDS}
      }
    }
  `;

  const data = await shopifyRequest(query, {
    handle: productHandle
  });

  if (!data.product) return null;

  return mapShopifyProduct(data.product);
}

/* ── PRODUCTOS POR PÁGINA PARA LISTA ─────────────────────── */

async function getStoreProductsPage(options = {}) {
  const {
    cursor = null,
    limit = 50,
    searchTerm = ""
  } = options;

  if (!isShopifyReady()) {
    let demoProducts = getDemoProducts();

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();

      demoProducts = demoProducts.filter(product => {
        const text = `
          ${product.title || ""}
          ${product.shortDescription || ""}
          ${product.description || ""}
          ${product.category || ""}
          ${product.categoryName || ""}
        `.toLowerCase();

        return text.includes(term);
      });
    }

    const startIndex = cursor ? Number(cursor) : 0;
    const endIndex = startIndex + limit;

    return {
      products: demoProducts.slice(startIndex, endIndex),
      pageInfo: {
        hasNextPage: endIndex < demoProducts.length,
        endCursor: endIndex < demoProducts.length ? String(endIndex) : null
      }
    };
  }

  const query = `
    query GetProductsPage($cursor: String, $limit: Int!, $searchQuery: String) {
      products(first: $limit, after: $cursor, query: $searchQuery) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ${PRODUCT_FIELDS}
          }
        }
      }
    }
  `;

  const data = await shopifyRequest(query, {
    cursor,
    limit,
    searchQuery: searchTerm ? searchTerm : null
  });

  return {
    products: data.products.edges.map(edge => mapShopifyProduct(edge.node)),
    pageInfo: data.products.pageInfo
  };
}

async function getStoreCollectionProductsPage(collectionHandle, options = {}) {
  const {
    cursor = null,
    limit = 50
  } = options;

  if (!isShopifyReady()) {
    const demoProducts = getDemoProducts().filter(product => product.category === collectionHandle);

    const startIndex = cursor ? Number(cursor) : 0;
    const endIndex = startIndex + limit;

    return {
      collection: getDemoCollections().find(item => item.handle === collectionHandle) || null,
      products: demoProducts.slice(startIndex, endIndex),
      pageInfo: {
        hasNextPage: endIndex < demoProducts.length,
        endCursor: endIndex < demoProducts.length ? String(endIndex) : null
      }
    };
  }

  const query = `
    query GetCollectionProductsPage($handle: String!, $cursor: String, $limit: Int!) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(first: $limit, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              ${PRODUCT_FIELDS}
            }
          }
        }
      }
    }
  `;

  const data = await shopifyRequest(query, {
    handle: collectionHandle,
    cursor,
    limit
  });

  if (data.collection && data.collection.products.edges.length > 0) {
    return {
      collection: mapShopifyCollection(data.collection),
      products: data.collection.products.edges.map(edge => mapShopifyProduct(edge.node)),
      pageInfo: data.collection.products.pageInfo
    };
  }

  const allProducts = await getStoreProducts();
  const filteredProducts = allProducts.filter(product => product.category === collectionHandle);

  const startIndex = cursor ? Number(cursor) : 0;
  const endIndex = startIndex + limit;

  const generatedCollections = buildCollectionsFromProducts(allProducts);
  const generatedCollection = generatedCollections.find(item => item.handle === collectionHandle) || null;

  return {
    collection: generatedCollection,
    products: filteredProducts.slice(startIndex, endIndex),
    pageInfo: {
      hasNextPage: endIndex < filteredProducts.length,
      endCursor: endIndex < filteredProducts.length ? String(endIndex) : null
    }
  };
}

/* ── CREAR CARRITO SHOPIFY ──────────────────────────────── */

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
