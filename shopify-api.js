/* ── SHOPIFY STOREFRONT API ─────────────────────────
   Este archivo permite que la tienda lea:
   - Categorías desde Shopify Collections
   - Si no hay collections, arma categorías desde Vendor / Proveedor
   - Productos desde Shopify Products
   - Descripción larga desde Shopify descriptionHtml
   - Descripción corta desde metafield custom.descripcion_corta
   - Traducciones reales desde Shopify Translate & Adapt
   - Checkout desde Shopify Cart
──────────────────────────────────────────────────── */

/* ── CONFIGURACIÓN / IDIOMA ───────────────────────────────── */

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

function getCurrentShopifySiteLanguage() {
  const possibleValues = [
    localStorage.getItem("siteLang"),
    localStorage.getItem("qmsLang"),
    localStorage.getItem("language"),
    localStorage.getItem("lang"),
    localStorage.getItem("currentLang")
  ];

  for (const value of possibleValues) {
    const cleanValue = String(value || "").toLowerCase().trim();

    if (cleanValue === "en" || cleanValue === "english") return "en";
    if (cleanValue === "es" || cleanValue === "spanish" || cleanValue === "español") return "es";
  }

  const htmlLang = String(document.documentElement.lang || "").toLowerCase().trim();

  if (htmlLang.startsWith("en")) return "en";
  if (htmlLang.startsWith("es")) return "es";

  return "es";
}

function getShopifyLanguageCode() {
  return getCurrentShopifySiteLanguage() === "en" ? "EN" : "ES";
}

function syncShopifySiteLanguage() {
  const lang = getCurrentShopifySiteLanguage();

  localStorage.setItem("siteLang", lang);
  document.documentElement.lang = lang;

  return lang;
}

function isShopifyStorePage() {
  const page = window.location.pathname.split("/").pop() || "index.html";

  return [
    "tienda.html",
    "categoria.html",
    "productos.html",
    "lista-productos.html",
    "producto.html"
  ].includes(page);
}

/*
  Cuando cambias de ES a EN, la página debe volver a pedir los productos a Shopify.
  Si no recargamos, se queda usando los productos que ya había cargado en el idioma anterior.
*/
document.addEventListener("DOMContentLoaded", () => {
  const langToggle = document.getElementById("langToggle");

  if (!langToggle || langToggle.dataset.shopifyLangReload === "true") return;

  langToggle.dataset.shopifyLangReload = "true";

  langToggle.addEventListener("click", () => {
    if (!isShopifyStorePage()) return;

    setTimeout(() => {
      window.location.reload();
    }, 550);
  });
});

/* ── REQUEST GENERAL ─────────────────────────────────────── */

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

/* ── HELPERS ───────────────────────────────────── */

function normalizePriceNumber(price) {
  if (!price || !price.amount) return 0;
  return Number(price.amount) || 0;
}

function getProductMainCollection(product) {
  return product.collections?.edges?.[0]?.node || null;
}

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

function truncateText(value, maxLength = 230) {
  const text = stripShopifyHTML(value);

  if (!text) return "";

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + "...";
}

function looksProbablySpanish(value) {
  const text = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ");

  if (!text.trim()) return false;

  const spanishSignals = [
    " para ",
    " con ",
    " disenado",
    " disenada",
    " cuenta ",
    " incluye ",
    " permite ",
    " paciente ",
    " medico ",
    " clinico ",
    " exploracion ",
    " consulta ",
    " solicita ",
    " cotiza ",
    " producto ",
    " productos ",
    " disponible ",
    " disponibles "
  ];

  let score = 0;

  spanishSignals.forEach(signal => {
    if (` ${text} `.includes(signal)) score += 1;
  });

  return score >= 2;
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
  const lang = getCurrentShopifySiteLanguage();
  const cleanDescription = String(
    description ||
    (lang === "en" ? "No description available." : "Sin descripción disponible.")
  ).trim();

  if (!brand) return cleanDescription;

  const plainText = stripShopifyHTML(cleanDescription);

  if (plainText.toLowerCase().includes(brand.toLowerCase())) {
    return cleanDescription;
  }

  const brandLabel = lang === "en" ? "Brand" : "Marca";

  if (cleanDescription.startsWith("<")) {
    return `<p>${brandLabel}: ${brand}.</p>${cleanDescription}`;
  }

  return `${brandLabel}: ${brand}. ${cleanDescription}`;
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
  const lang = getCurrentShopifySiteLanguage();

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description:
      collection.description ||
      (lang === "en"
        ? "Explore the products available in this category."
        : "Explora los productos disponibles en esta categoría."),
    image: collection.image?.url || "assets/diagnostico.png",
    altText: collection.image?.altText || collection.title
  };
}

function mapShopifyProduct(product) {
  const lang = getCurrentShopifySiteLanguage();

  const firstVariant = product.variants?.edges?.[0]?.node || null;
  const firstCollection = getProductMainCollection(product);
  const categoryInfo = getProductCategoryInfo(product);

  const brand = detectProductBrand(product.title, firstCollection?.title, product.vendor);
  const cleanTitle = cleanShopifyProductTitle(product.title, brand);

  const rawDescriptionHTML =
    product.descriptionHtml ||
    product.description ||
    "";

  const rawDescriptionText =
    product.description ||
    stripShopifyHTML(product.descriptionHtml) ||
    "";

  const cleanDescriptionHTML = addBrandToProductDescription(rawDescriptionHTML, brand);
  const cleanDescriptionText = addBrandToProductDescription(rawDescriptionText, brand);

  const shopifyShortDescription =
    product.shortDescription?.value ||
    product.descripcionCorta?.value ||
    "";

  /*
    Si el idioma está en inglés pero el metafield de descripción corta sigue en español,
    usamos un resumen de la descripción larga traducida de Shopify.
  */
  const shortDescription =
    lang === "en" && looksProbablySpanish(shopifyShortDescription)
      ? truncateText(cleanDescriptionHTML, 230)
      : shopifyShortDescription;

  const descriptionFinal =
    cleanDescriptionHTML ||
    cleanDescriptionText ||
    (lang === "en" ? "No description available." : "Sin descripción disponible.");

  return {
    id: product.id,
    handle: product.handle,
    originalTitle: product.title,

    title: cleanTitle,
    titleEs: cleanTitle,
    titleEn: cleanTitle,

    category: categoryInfo.handle,
    categoryName: categoryInfo.title,

    price: 0,
    priceGeneral: lang === "en" ? "Quote only" : "Bajo cotización",
    priceDistributor: lang === "en" ? "Quote with an advisor" : "Cotizar con ejecutivo",
    priceText: lang === "en" ? "Quote only" : "Bajo cotización",

    image: product.featuredImage?.url || "assets/diagnostico.png",
    imageAlt: product.featuredImage?.altText || cleanTitle,

    description: descriptionFinal,
    descriptionHtml: descriptionFinal,

    shortDescription: shortDescription || truncateText(descriptionFinal, 230),

    descriptionEs: descriptionFinal,
    descriptionEn: descriptionFinal,

    shortDescriptionEs: shortDescription || truncateText(descriptionFinal, 230),
    shortDescriptionEn: shortDescription || truncateText(descriptionFinal, 230),

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
        description:
          getCurrentShopifySiteLanguage() === "en"
            ? `Products from ${title}.`
            : `Productos de ${title}.`,
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
  syncShopifySiteLanguage();

  if (!isShopifyReady()) return getDemoCollections();

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetCollections @inContext(language: ${languageCode}) {
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
  syncShopifySiteLanguage();

  if (!isShopifyReady()) return getDemoProducts();

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetProducts($cursor: String) @inContext(language: ${languageCode}) {
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
  syncShopifySiteLanguage();

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

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetCollectionProducts($handle: String!, $cursor: String) @inContext(language: ${languageCode}) {
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
      description:
        getCurrentShopifySiteLanguage() === "en"
          ? "Explore the products available in this category."
          : "Explora los productos disponibles en esta categoría.",
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
  syncShopifySiteLanguage();

  if (!isShopifyReady()) {
    return getDemoProducts().find(product => product.id === productHandle || product.handle === productHandle) || null;
  }

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetProduct($handle: String!) @inContext(language: ${languageCode}) {
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
  syncShopifySiteLanguage();

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

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetProductsPage($cursor: String, $limit: Int!, $searchQuery: String) @inContext(language: ${languageCode}) {
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
  syncShopifySiteLanguage();

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

  const languageCode = getShopifyLanguageCode();

  const query = `
    query GetCollectionProductsPage($handle: String!, $cursor: String, $limit: Int!) @inContext(language: ${languageCode}) {
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
