const DEMO_PRODUCTS = [
  {
    id: "prod-001",
    handle: "estetoscopio-profesional",
    title: "Estetoscopio Profesional",
    category: "diagnostico",
    categoryName: "Diagnóstico General",
    price: 1200,
    priceGeneral: "$1,200 MXN",
    priceDistributor: "$950 MXN",
    priceText: "$1,200 MXN",
    image: "assets/diagnostico.png",
    description: "Equipo ideal para evaluación clínica general y auscultación médica.",
    availability: "Disponible",
    type: "venta",
    variantId: null
  },
  {
    id: "prod-002",
    handle: "otoscopio-led",
    title: "Otoscopio LED",
    category: "diagnostico",
    categoryName: "Diagnóstico General",
    price: 2100,
    priceGeneral: "$2,100 MXN",
    priceDistributor: "$1,750 MXN",
    priceText: "$2,100 MXN",
    image: "assets/diagnostico.png",
    description: "Herramienta médica para exploración de oído con iluminación LED.",
    availability: "Disponible",
    type: "venta",
    variantId: null
  },
  {
    id: "prod-003",
    handle: "desfibrilador-externo-automatico",
    title: "Desfibrilador Externo Automático",
    category: "emergencias",
    categoryName: "Emergencias y Triaje",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/emergencias.png",
    description: "Equipo para atención de emergencias y soporte vital básico.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  },
  {
    id: "prod-004",
    handle: "camilla-clinica-ajustable",
    title: "Camilla Clínica Ajustable",
    category: "mobiliario",
    categoryName: "Mobiliario y Equipamiento",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/mobiliario.png",
    description: "Camilla para exploración médica con estructura resistente y ajuste cómodo.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  },
  {
    id: "prod-005",
    handle: "monitor-multiparametrico",
    title: "Monitor Multiparamétrico",
    category: "monitoreo",
    categoryName: "Signos Vitales y Monitoreo",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/monitoreo.png",
    description: "Equipo para monitoreo de signos vitales en clínicas y hospitales.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  },
  {
    id: "prod-006",
    handle: "monitor-fetal",
    title: "Monitor Fetal",
    category: "mujer",
    categoryName: "Salud de la Mujer",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/mujer.png",
    description: "Equipo especializado para monitoreo fetal y atención ginecológica.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  },
  {
    id: "prod-007",
    handle: "equipo-para-cardiologia",
    title: "Equipo para Cardiología",
    category: "especialidades",
    categoryName: "Especialidades Médicas",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/especialidades.png",
    description: "Soluciones especializadas para diagnóstico y seguimiento cardiológico.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  },
  {
    id: "prod-008",
    handle: "bascula-clinica-profesional",
    title: "Báscula Clínica Profesional",
    category: "bienestar",
    categoryName: "Nutrición y Bienestar",
    price: 3450,
    priceGeneral: "$3,450 MXN",
    priceDistributor: "$2,950 MXN",
    priceText: "$3,450 MXN",
    image: "assets/nutricion.png",
    description: "Báscula clínica para medición precisa en consultorios y centros de salud.",
    availability: "Disponible",
    type: "venta",
    variantId: null
  },
  {
    id: "prod-009",
    handle: "audiometro-clinico",
    title: "Audiómetro Clínico",
    category: "orl",
    categoryName: "Oftalmología y ORL",
    price: 0,
    priceGeneral: "Solicitar cotización",
    priceDistributor: "Cotizar con ejecutivo",
    priceText: "Solicitar cotización",
    image: "assets/estetoscopio.png",
    description: "Equipo de evaluación auditiva para uso clínico especializado.",
    availability: "Bajo cotización",
    type: "cotizacion",
    variantId: null
  }
];

const CATEGORY_INFO = {
  diagnostico: {
    title: "Diagnóstico General",
    eyebrow: "Catálogo médico",
    description: "Productos para evaluación clínica, diagnóstico básico y exploración médica general."
  },

  emergencias: {
    title: "Emergencias y Triaje",
    eyebrow: "Atención inmediata",
    description: "Equipos para urgencias, reanimación, traslado y atención de pacientes críticos."
  },

  mobiliario: {
    title: "Mobiliario y Equipamiento",
    eyebrow: "Infraestructura clínica",
    description: "Mobiliario médico y equipo de apoyo para consultorios, clínicas y hospitales."
  },

  monitoreo: {
    title: "Signos Vitales y Monitoreo",
    eyebrow: "Monitoreo clínico",
    description: "Soluciones para medición y seguimiento de signos vitales."
  },

  mujer: {
    title: "Salud de la Mujer",
    eyebrow: "Especialidad médica",
    description: "Equipos especializados para ginecología, monitoreo fetal y atención integral."
  },

  especialidades: {
    title: "Especialidades Médicas",
    eyebrow: "Soluciones especializadas",
    description: "Equipos para cardiología, neurología, endoscopia, urología y más especialidades."
  },

  bienestar: {
    title: "Nutrición y Bienestar",
    eyebrow: "Evaluación corporal",
    description: "Equipos para medición, composición corporal y seguimiento nutricional."
  },

  orl: {
    title: "Oftalmología y ORL",
    eyebrow: "Exploración especializada",
    description: "Equipos para evaluación oftalmológica, auditiva y de otorrinolaringología."
  }
};
