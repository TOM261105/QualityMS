const DEMO_PRODUCTS = [
  {
    id: "prod-001",
    title: "Estetoscopio Profesional",
    category: "diagnostico",
    categoryName: "Diagnóstico General",
    price: 1250,
    priceText: "$1,250 MXN",
    image: "assets/diagnostico.png",
    description: "Equipo ideal para evaluación clínica general y auscultación médica.",
    availability: "Disponible",
    type: "venta"
  },
  {
    id: "prod-002",
    title: "Otoscopio LED",
    category: "diagnostico",
    categoryName: "Diagnóstico General",
    price: 2100,
    priceText: "$2,100 MXN",
    image: "assets/diagnostico.png",
    description: "Herramienta médica para exploración de oído con iluminación LED.",
    availability: "Disponible",
    type: "venta"
  },
  {
    id: "prod-003",
    title: "Desfibrilador Externo Automático",
    category: "emergencias",
    categoryName: "Emergencias y Triaje",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/emergencias.png",
    description: "Equipo para atención de emergencias y soporte vital básico.",
    availability: "Bajo cotización",
    type: "cotizacion"
  },
  {
    id: "prod-004",
    title: "Camilla Clínica Ajustable",
    category: "mobiliario",
    categoryName: "Mobiliario y Equipamiento",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/mobiliario.png",
    description: "Camilla para exploración médica con estructura resistente y ajuste cómodo.",
    availability: "Bajo cotización",
    type: "cotizacion"
  },
  {
    id: "prod-005",
    title: "Monitor Multiparamétrico",
    category: "monitoreo",
    categoryName: "Signos Vitales y Monitoreo",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/monitoreo.png",
    description: "Equipo para monitoreo de signos vitales en clínicas y hospitales.",
    availability: "Bajo cotización",
    type: "cotizacion"
  },
  {
    id: "prod-006",
    title: "Monitor Fetal",
    category: "mujer",
    categoryName: "Salud de la Mujer",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/mujer.png",
    description: "Equipo especializado para monitoreo fetal y atención ginecológica.",
    availability: "Bajo cotización",
    type: "cotizacion"
  },
  {
    id: "prod-007",
    title: "Equipo para Cardiología",
    category: "especialidades",
    categoryName: "Especialidades Médicas",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/especialidades.png",
    description: "Soluciones especializadas para diagnóstico y seguimiento cardiológico.",
    availability: "Bajo cotización",
    type: "cotizacion"
  },
  {
    id: "prod-008",
    title: "Báscula Clínica Profesional",
    category: "bienestar",
    categoryName: "Nutrición y Bienestar",
    price: 3450,
    priceText: "$3,450 MXN",
    image: "assets/nutricion.png",
    description: "Báscula clínica para medición precisa en consultorios y centros de salud.",
    availability: "Disponible",
    type: "venta"
  },
  {
    id: "prod-009",
    title: "Audiómetro Clínico",
    category: "orl",
    categoryName: "Oftalmología y ORL",
    price: 0,
    priceText: "Solicitar cotización",
    image: "assets/estetoscopio.png",
    description: "Equipo de evaluación auditiva para uso clínico especializado.",
    availability: "Bajo cotización",
    type: "cotizacion"
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
