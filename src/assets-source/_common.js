// _common.js — librería y datos del DISEÑO RICO de los planes de preparación.
// Diseño preferido (Sant Vicenç): portada con tarjeta de claims, sección "El
// temario", proceso de fases con etiquetas, opciones con tarjetas, canales con
// 3 QR + dudas + redes. NO MODIFICAR los helpers salvo necesidad.
// CRÍTICO: img() declara SIEMPRE type → nunca .undefined → Word abre sin error.

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, VerticalAlign,
  ImageRun, ExternalHyperlink, HeightRule, Header, Footer, TabStopType, PageBreak,
} = require("docx");

// ---------- Paleta y fuente ----------
const CYAN = "16A6D9", NAVY = "0E3A4F", INK = "1F2933";
const GREY = "6B7682", LINE = "E3E8EC", SOFT = "F2F8FB", WHITE = "FFFFFF";
const FONT = "Calibri";
const A = AlignmentType;

// ---------- Paleta de marca COTALY (la plataforma de estudio) ----------
// Identidad propia de Cotaly (cotaly.app). Se usa SOLO dentro de la sección
// "Cotaly · tu plataforma de estudio"; el resto del plan mantiene la identidad
// BYD/oposicionesdeporte (CYAN+NAVY). Concepto: alcanzar una cota.
const COT_NAVY = "0B2545";   // principal / texto
const COT_TEAL = "1B998B";   // secundario / progreso
const COT_TEALL = "33C9B7";  // teal claro (trazo sobre fondo oscuro)
const COT_CORAL = "F25F5C";  // acento / CTA / punto
const COT_LIGHT = "EAF1F4";  // fondo claro / superficies

// ---------- Precio español ----------
const fmt = n => (Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(".", ",")) + " €";

// ---------- Imágenes (type SIEMPRE declarado) ----------
function imgType(f){ f=f.toLowerCase();
  if(f.endsWith(".png"))return "png";
  if(f.endsWith(".jpg")||f.endsWith(".jpeg"))return "jpg";
  if(f.endsWith(".gif"))return "gif";
  if(f.endsWith(".bmp"))return "bmp"; return "png"; }
const img = (file, w, h) => new ImageRun({ type: imgType(file), data: fs.readFileSync(file), transformation:{ width:w, height:h } });
const ico = (name, size = 22) => img(`icons/${name}.png`, size, size);

// ---------- Texto / párrafo ----------
function txt(text, o = {}) {
  return new TextRun({ text, font:o.font||FONT, size:o.size||21,
    bold:o.bold||false, italics:o.italics||false, color:o.color||INK,
    ...(o.caps?{allCaps:true}:{}), ...(o.strike?{strike:true}:{}) });
}
function p(children, o = {}) {
  return new Paragraph({ children:Array.isArray(children)?children:[children],
    alignment:o.align, spacing:{ before:o.before??0, after:o.after??120, line:o.line??264 },
    ...(o.border?{border:o.border}:{}), ...(o.indent?{indent:o.indent}:{}),
    ...(o.pageBreakBefore?{pageBreakBefore:true}:{}) });
}
const spacer = (h=120) => new Paragraph({ children:[], spacing:{ after:h } });
const noBorder = { top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE} };
const cellBorders = { top:{style:BorderStyle.SINGLE,size:4,color:LINE},bottom:{style:BorderStyle.SINGLE,size:4,color:LINE},left:{style:BorderStyle.SINGLE,size:4,color:LINE},right:{style:BorderStyle.SINGLE,size:4,color:LINE} };

function cell(children, o = {}) {
  return new TableCell({
    width:{ size:o.width!=null?o.width:o.w, type:o.width!=null?WidthType.PERCENTAGE:WidthType.DXA },
    borders:o.borders||noBorder,
    shading:o.fill?{ fill:o.fill, type:ShadingType.CLEAR, color:"auto" }:undefined,
    margins:o.margins||{ top:80, bottom:80, left:120, right:120 },
    verticalAlign:o.valign||VerticalAlign.TOP,
    children:Array.isArray(children)?children:[children],
    ...(o.colSpan?{columnSpan:o.colSpan}:{}) });
}

// ---------- Enlace ----------
function link(url, text, o = {}) {
  return new ExternalHyperlink({ link:url, children:[ new TextRun({ text, font:FONT, size:o.size||18, color:CYAN, bold:o.bold!==false, underline:{} }) ]});
}
const TYC_URL = "https://oposicionesdeporte.com/terminos-y-condiciones/";
function tycLink(o = {}) {
  return new Paragraph({ spacing:{ before:o.before??80, after:o.after??0, line:230 }, alignment:o.align,
    children:[ link(TYC_URL, "Consulta los términos y condiciones de compra", { size:18 }) ] });
}

// ---------- Encabezado de sección (icono + título + regla) ----------
function sectionHead(iconName, title) {
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, borders:noBorder, columnWidths:[7,93],
    rows:[ new TableRow({ children:[
      cell([ p([ico(iconName+"_cyan", 26)], {after:0}) ], { width:7, valign:VerticalAlign.CENTER, margins:{top:0,bottom:0,left:0,right:80} }),
      cell([ new Paragraph({ spacing:{after:0, line:300},
        border:{ bottom:{ style:BorderStyle.SINGLE, size:8, color:CYAN, space:6 } },
        children:[ txt(title, { bold:true, color:NAVY, size:32 }) ] }) ], { width:93, valign:VerticalAlign.CENTER }),
    ]})] });
}
const rule = (color=LINE, after=120) => new Paragraph({ children:[], border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color, space:6 } }, spacing:{ after } });

// ---------- Chip / etiqueta ----------
function chip(text, color = CYAN) {
  return new Table({ width:{size:0,type:WidthType.AUTO}, borders:noBorder, columnWidths:[2400],
    rows:[ new TableRow({ children:[ cell([ p([txt(text,{bold:true,color:WHITE,size:15,caps:true})],{after:0,align:A.CENTER,line:220}) ],
      { w:2400, fill:color, margins:{top:36,bottom:36,left:120,right:120} }) ]})] });
}

// ---------- Fila de característica (icono + título + desc) ----------
function featureRow(iconName, title, desc) {
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, borders:noBorder, columnWidths:[7,93],
    rows:[ new TableRow({ children:[
      cell([ p([ico(iconName+"_cyan", 22)], {after:0, line:240}) ], { width:7, valign:VerticalAlign.TOP, margins:{top:30,bottom:30,left:0,right:60} }),
      cell([ p([txt(title,{bold:true,color:NAVY,size:20})], {after:10, line:240}),
             p([txt(desc,{color:GREY,size:18})], {after:0, line:240}) ], { width:93, margins:{top:30,bottom:30,left:0,right:0} }),
    ]})] });
}

// ---------- Cabecera / pie (logo SOLO en cabecera, sin logo central) ----------
function makeHeader(logoPath) {
  if (!fs.existsSync(logoPath)) throw new Error("FALTA EL LOGO REAL en "+logoPath+" — copiar assets/byd_logo.png. NO inventar un logo.");
  return new Header({ children:[
    new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[6360,3000], borders:noBorder,
      rows:[ new TableRow({ children:[
        cell([ p([img(logoPath,128,75)], {after:0}) ], {w:6360, valign:VerticalAlign.BOTTOM, margins:{top:0,bottom:0,left:0,right:0}}),
        cell([ p([txt("Centro de preparación de oposiciones",{color:GREY,size:16})],{after:0,align:A.RIGHT,line:200}),
               p([txt("info@oposicionesdeporte.com",{color:CYAN,size:16,bold:true})],{after:0,align:A.RIGHT,line:200}) ],
             {w:3000, valign:VerticalAlign.BOTTOM, margins:{top:0,bottom:0,left:0,right:0}}),
      ]})] }),
    new Paragraph({ children:[], border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:LINE, space:6 } }, spacing:{after:160} }),
  ]});
}
function makeFooter(leftText) {
  return new Footer({ children:[ new Paragraph({
    border:{ top:{ style:BorderStyle.SINGLE, size:6, color:LINE, space:8 } },
    tabStops:[{ type:TabStopType.RIGHT, position:9360 }], spacing:{before:60},
    children:[ txt(leftText||"Plan de preparación personalizado",{color:GREY,size:16}),
      new TextRun({ text:"\t", font:FONT }), txt("oposicionesdeporte.com",{color:CYAN,size:16,bold:true}) ]
  })] });
}

// ===================================================================
//  DATOS DE LA CONVOCATORIA (ejemplo: Sant Vicenç de Castellet)
// ===================================================================
const CONV = {
  plaza: "Monitor/a d'Esports",
  admin: "Ajuntament de Sant Vicenç de Castellet (Barcelona)",
  nplazas: "2",
  regimen: "laboral fijo",
  grupo: "Grupo C, subgrupo C1",
  sistema: "Concurso-oposición",
  ejercicios: "Test + práctico",
  idioma: "Catalán C1 (req.)",
  boletin: "Convocatoria publicada en el BOPB de 15/05/2026 · CVE 202610088942 (Expediente 2026/06). Plazo: 20 días hábiles desde la última publicación. El proceso constituye además una bolsa de interinidad de 2 años.",
  cooficial: true,
  lenguaCooficial: "catalán",
  // El temario se entrega en UN solo idioma a elegir (castellano O lengua cooficial), nunca en ambos.
  resumenGeneral: "Constitución, Estatuto de Cataluña, derecho administrativo, régimen local, contratación, empleo público, igualdad y PRL.",
  resumenEspecifico: "Funciones del monitor, salud, metodología, entrenamiento, actividades dirigidas, medio acuático, gestión e instalaciones y legislación deportiva catalana.",
};

const NTEMARIO = 40, PRECIO_TEMA = 23;
const teoricoBruto = NTEMARIO * PRECIO_TEMA;   // 920
const teoricoOferta = teoricoBruto * 0.9;      // 828
const PRACT_FULL = 495, PRACT_DESC = 396;
// Tutorías (servicio independiente)
const TUT_HORA = 95, PACK_INTENSIVO = 199;

const TEMAS_GENERAL = [
 "La Constitución Española de 1978: estructura, contenido y principios. Derechos y deberes fundamentales.",
 "El Estatuto de Autonomía de Cataluña: estructura, contenido esencial y principios fundamentales.",
 "La Administración pública: concepto y principios. El Derecho administrativo.",
 "El Municipio: elementos. El término municipal. La población. El empadronamiento. Derechos y deberes de los vecinos.",
 "El procedimiento administrativo: concepto y principios. Fases del procedimiento común. El acto administrativo: concepto, clases y elementos.",
 "La contratación administrativa: concepto y principios básicos de la Ley de Contratos del Sector Público.",
 "Las haciendas locales. Los recursos y sus clases.",
 "Derechos y deberes de los empleados públicos. Códigos de conducta.",
 "Los planes de igualdad. Concepto y regulación.",
 "Prevención de riesgos laborales: principios básicos. Los equipos de protección individual.",
];
const TEMAS_ESPECIFICO = [
 "Funciones del monitor y la monitora de la actividad física y el deporte.",
 "Actividad física, ejercicio físico y deporte como inclusión social.",
 "Beneficios de la actividad física para la salud a lo largo de la vida.",
 "Lesiones y patologías.",
 "Primeros auxilios básicos: SVB, RCP, accidente deportivo.",
 "Capacidades físicas y habilidades motrices básicas.",
 "La iniciación deportiva y el perfeccionamiento deportivo prematuro.",
 "Metodología de la enseñanza-aprendizaje de las actividades físico-deportivas.",
 "Principios del entrenamiento deportivo.",
 "Tonificación muscular. Estructura de una sesión según el objetivo y la correcta ejecución de los ejercicios.",
 "Nuevas tendencias del fitness y las actividades dirigidas.",
 "Las actividades dirigidas a personas adultas y mayores: tonificación, coreografiadas, bicicleta estática, HIIT, pilates, gimnasia de mantenimiento, ejercicios en suspensión, movilidad, aquagym, natación.",
 "La familiarización y dominio del medio acuático en las diferentes etapas evolutivas y colectivos específicos.",
 "Los estilos natatorios: características básicas y la corrección para la mejora de la ejecución.",
 "El deporte en la administración local.",
 "Normativa de uso de las instalaciones deportivas.",
 "Funciones y líneas de actuación en el campo de la actividad deportiva.",
 "Competencias municipales en equipamientos deportivos.",
 "Planificación y organización en la gestión deportiva en los ayuntamientos. Modelo organizativo y desarrollo normativo.",
 "Los equipamientos deportivos: concepto y clasificación. Tipologías de espacios deportivos y complementarios.",
 "Diseño de actividades físicas para la tercera edad.",
 "Gestión de usos de instalaciones deportivas municipales. Tipología de usuarios y organización del acceso.",
 "Legislación básica del deporte en Cataluña. El texto único de la Ley del deporte. Principios y estructura.",
 "El Decreto Legislativo 1/2000, de 31 de julio, Texto Único de la Ley del Deporte.",
 "La Ley 3/2008, de 23 de abril, del ejercicio de las profesiones del deporte.",
 "Desarrollo reglamentario del deporte en Cataluña. Clubes, asociaciones y agrupaciones deportivas. El Registro de entidades deportivas.",
 "Deporte y salud. Efectos y adaptaciones fisiológicas ante la práctica de la actividad física.",
 "Ejercicio físico y osteoporosis. Ejercicio físico e hipertensión.",
 "El deporte escolar en Cataluña. Juegos escolares. Educación en valores. Actividades físico-deportivas extraescolares.",
 "Deporte y sociedad. El deporte como medio de integración social. Condiciones socioculturales de la práctica deportiva.",
];

const FASES = [
  { n:"1", t:"Admisión / exclusión", d:"Revisión de solicitudes y publicación de la lista de personas admitidas y excluidas. 10 días para subsanar.", tag:"Previa" },
  { n:"2", t:"Prueba teórica (test)", d:"40 preguntas tipo test sobre el temario general y específico, 60 min. De 0 a 10 puntos; eliminatoria por debajo de 5.", tag:"Temario · TEST" },
  { n:"3", t:"Prueba práctica", d:"Supuesto práctico por escrito (máx. 5 pts) + conducción de una clase práctica de actividades dirigidas (máx. 5 pts). Eliminatoria por debajo de 5.", tag:"Práctico" },
  { n:"4", t:"Conocimientos de catalán", d:"Acreditación del nivel C1 o prueba específica. Apto / no apto, eliminatoria. No incluida en el material.", tag:"No temario" },
  { n:"5", t:"Entrevista personal", d:"Potestativa, de carácter competencial. Máx. 1 punto. No eliminatoria. No incluida en el material.", tag:"No temario" },
  { n:"6", t:"Fase de concurso (méritos)", d:"Valoración de experiencia profesional (máx. 3 pts) y formación (máx. 3 pts).", tag:"Méritos" },
  { n:"7", t:"Período de prueba", d:"Dos meses, evaluados por una comisión. Forma parte del proceso selectivo.", tag:"Final" },
];

// ===================================================================
//  CATÁLOGO DE SERVICIOS (oposicionesdeporte.com)
// ===================================================================
// Mapa de TODOS los servicios para que el plan SIEMPRE pueda ofrecer algo,
// también cuando la convocatoria NO tiene temario. Precios confirmados en la
// web (jun-2026). Tutorías y Pack: precio FIJO de la skill (95 € / 199 €),
// que prevalece sobre el de la web. Úsese como lógica de selección: según el
// tipo de proceso, elegir el/los servicios que apliquen.
const SERVICIOS = {
  // Temario (núcleo clásico) — solo si hay test y/o desarrollo escrito
  temario:    { nombre:"Preparación completa", precio:"23 €/tema (−10% pago único)", desc:"Temario específico de esta convocatoria, hecho a medida (entrega en torno a un mes) + consultas con el preparador por chat en cualquier momento + exámenes tipo test en la plataforma específicos para este proceso + acceso a los cursos transversales.", url:"https://oposicionesdeporte.com/categoria-producto/oposiones_deporte/buscador-oposiciones/" },
  temasSueltos:{ nombre:"Temas sueltos a medida", precio:"23 €/tema", desc:"Solo versión test. Prueba previa del servicio; su importe se descuenta del total si luego contratas la preparación completa.", url:"https://oposicionesdeporte.com/categoria-producto/oposiones_deporte/buscador-oposiciones/" },
  // Práctico / supuestos
  supuestos:  { nombre:"Supuestos prácticos", precio:"149 €/hora", desc:"Propuesta de un supuesto práctico a medida y su corrección personalizada por un preparador (vía aula virtual). Acceso al Banco de supuestos prácticos en la plataforma.", url:"https://oposicionesdeporte.com/servicio-de-supuestos-practicos/" },
  practico:   { nombre:"Preparación del ejercicio práctico", precio:"495 € (396 € si ya preparas la teoría)", desc:"Metodología, tipología de supuestos, recursos en vídeo y acceso al Banco de supuestos prácticos en la plataforma. Sin pago fraccionado.", url:null },
  // Concurso / méritos (3 variantes, mismo esquema de evidencias y precio)
  concurso:   { nombre:"Preparación de la documentación del concurso", precio:"desde 300 € (25 ev.) · 50/450 · 75/600 · 100/750", desc:"Para la FASE DE CONCURSO de un proceso selectivo: análisis del baremo y preparación/presentación de las evidencias de méritos.", url:"https://oposicionesdeporte.com/servicio-preparacion-documentacion-concurso/" },
  bolsa:      { nombre:"Preparación de la documentación para bolsa de empleo", precio:"desde 300 € (25 ev.) · 50/450 · 75/600 · 100/750", desc:"Igual que el de concurso, orientado a BOLSAS DE EMPLEO público.", url:"https://oposicionesdeporte.com/servicio-preparacion-documentacion-bolsa-de-empleo-publico/" },
  libreDesig: { nombre:"Preparación de la documentación para puesto de libre designación", precio:"desde 300 € (25 ev.) · 50/450 · 75/600 · 100/750", desc:"Igual esquema de evidencias que concurso/bolsa, orientado a puestos de LIBRE DESIGNACIÓN.", url:"https://oposicionesdeporte.com/servicio-preparacion-documentacion-puesto-de-libre-designacion/" },
  // Proyecto (memorias/proyectos de gestión deportiva exigidos por algunas plazas)
  proyecto:   { nombre:"Elaboración de proyectos asociados a procesos selectivos", precio:"15 car./300 € · 20/400 · 25/500 · 50/1.000 · 100/2.000", desc:"Proyecto en Word maquetado, índices, APA, revisado, adaptado a la administración, en plazo reducido. Incluye una clase para la exposición.", url:"https://oposicionesdeporte.com/servicio-de-elaboracion-de-proyectos-para-procesos-selectivos/" },
  // Reclamación de examen
  reclamacion:{ nombre:"Reclamación de exámenes", precio:"149 € total", desc:"Análisis de preguntas y respuestas, detección de preguntas reclamables y entrega de la reclamación por escrito para registro.", url:"https://oposicionesdeporte.com/servicio-de-reclamacion-de-examenes/" },
  // Orientación (para quien aún no sabe a qué presentarse)
  orientacion:{ nombre:"Orientación laboral", precio:"65 €/hora", desc:"Entrevista con un preparador: salidas profesionales e itinerario de acceso al empleo público a partir de tu perfil.", url:"https://oposicionesdeporte.com/servicio-orientacion-laboral/" },
  // Tutorías (precio FIJO de la skill: 95 €/h + Pack 199 €) — aplican SIEMPRE
  tutoria:    { nombre:"Tutorías individuales", precio:"95 €/hora", desc:"Acompañamiento uno a uno con el preparador (funcionario en activo, +15 años). Puedes probar una sola sesión.", url:"https://oposicionesdeporte.com/servicio-de-tutoria-para-opositores/" },
  packIntensivo:{ nombre:"Pack Intensivo de tutorías individuales", precio:"199 €", desc:"5 sesiones de 30 min + revisión de méritos + acompañamiento por chat.", url:"https://oposicionesdeporte.com/servicio-de-tutoria-para-opositores/" },
};

// ===================================================================
//  CURSOS TRANSVERSALES (incluidos con la preparación completa)
// ===================================================================
// Cursos de la plataforma que entran SIEMPRE con la preparación completa.
// "Recursos para la planificación del estudio" se incluye en TODOS los planes;
// el curso de "Consejos..." se elige según el TIPO DE EXAMEN de la convocatoria
// (test, desarrollo escrito, lectura pública del examen, supuesto práctico).
// Nombres LITERALES tal y como figuran en la plataforma (no reescribir).
const CURSOS_TRANSVERSALES = {
  planificacion: "Recursos para la planificación del estudio",                 // SIEMPRE
  test:          "Consejos para realizar exámenes tipo test",                   // si hay tipo test
  desarrollo:    "Consejos para abordar los temas de desarrollo",               // si hay desarrollo escrito
  lectura:       "Consejos generales para afrontar la lectura de un examen",    // si hay lectura pública
  supuestos:     "Consejos generales para afrontar supuestos prácticos",        // si hay supuesto práctico
};

// Devuelve la lista de cursos transversales aplicables a una convocatoria.
// flags: { test, desarrollo, lectura, supuestos } (booleanos según los
// ejercicios reales de la convocatoria). "Recursos para la planificación del
// estudio" se añade siempre. Úsese para la feature "Acceso a cursos
// transversales" de la tarjeta de Preparación completa.
function cursosTransversales({ test=false, desarrollo=false, lectura=false, supuestos=false } = {}) {
  const out = [CURSOS_TRANSVERSALES.planificacion]; // siempre
  if (test)       out.push(CURSOS_TRANSVERSALES.test);
  if (desarrollo) out.push(CURSOS_TRANSVERSALES.desarrollo);
  if (lectura)    out.push(CURSOS_TRANSVERSALES.lectura);
  if (supuestos)  out.push(CURSOS_TRANSVERSALES.supuestos);
  return out;
}

// Nombre LITERAL del banco de supuestos de la plataforma (incluido con los
// servicios de práctico / supuestos prácticos). No reescribir.
const BANCO_SUPUESTOS = "Banco de supuestos prácticos";

// ===================================================================
//  COTALY · tu plataforma de estudio  (sección reutilizable)
// ===================================================================
// Se incluye SIEMPRE en los planes (modo decisión y captación), como VALOR
// INCLUIDO con la preparación completa. Identidad propia de Cotaly (navy +
// teal + coral) embebida dentro del plan BYD. Enfoque: beneficio + función
// breve. Requiere assets/cotaly_appicon.png copiado a /home/claude/.
//
// Beneficios (qué gana el opositor) con su función breve. Iconos = inicial
// con punto coral (estilo "cota"); no usamos los line-icons cian de BYD aquí
// para no mezclar identidades.
const COTALY = {
  nombre: "Cotaly",
  claim: "tu plataforma de estudio",
  url: "cotaly.app",
  // Lema de marca (concepto "cota"): progreso medible hacia la plaza.
  intro: "Con la preparación completa entras en Cotaly, tu plataforma de estudio. "
       + "Reúne en un solo sitio tu plan, tu temario, tus simulacros y a tu preparador, "
       + "para que cada hora de estudio te acerque a tu cota: la plaza.",
  // features: [titulo (beneficio), desc (función breve)]
  features: [
    ["Un plan que se adapta a ti", "Defines tus horas y la plataforma reparte el temario hasta la fecha del examen; si te desvías, recalcula el plan."],
    ["Sabes qué toca cada día", "Tu semana organizada en tareas diarias que marcas como hechas, con tus horas planificadas frente a las cumplidas."],
    ["Tu progreso, en datos reales", "Registras simulacros y pruebas por tipo (test, supuesto práctico, oral, desarrollo…) y ves tu evolución, no una sensación."],
    ["Tu preparador, siempre cerca", "Reservas tutorías, recibes materiales y ejercicios y consultas tus dudas en un chat que tu preparador supervisa."],
    ["Repasa con ayuda de la IA", "Generas tests, resúmenes y mapas conceptuales sobre tu propio temario para afianzar y repasar antes del examen."],
    ["No se te escapa ningún plazo", "Agenda y carpeta de trámites para no perder fechas clave del proceso: instancias, tasas, méritos."],
  ],
};

// Marca-gráfica mínima de Cotaly: inicial "c" en navy + punto coral (la "cota").
// Si el app icon está disponible se usa como sello; si no, se omite sin romper.
function cotalyMark(size = 30) {
  try { return img("cotaly_appicon.png", size, size); } catch (e) { return null; }
}

// Encabezado de sección con identidad Cotaly (no el sectionHead cian de BYD).
function cotalyHead(title, sub) {
  const mk = cotalyMark(34);
  const left = mk
    ? cell([ new Paragraph({ spacing:{after:0}, children:[mk] }) ],
        { width:8, valign:VerticalAlign.CENTER, margins:{top:0,bottom:0,left:0,right:100} })
    : null;
  const titleCell = cell([
    new Paragraph({ spacing:{after:0, line:300},
      border:{ bottom:{ style:BorderStyle.SINGLE, size:8, color:COT_TEAL, space:6 } },
      children:[ txt(title,{bold:true,color:COT_NAVY,size:32}), txt("  ·  ",{color:COT_CORAL,size:30,bold:true}), txt(sub,{color:COT_TEAL,size:24,bold:true}) ] })
  ], { width:mk?92:100, valign:VerticalAlign.CENTER });
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, borders:noBorder,
    columnWidths: mk?[8,92]:[100],
    rows:[ new TableRow({ children: mk?[left,titleCell]:[titleCell] }) ] });
}

// Fila de característica con bullet coral (identidad Cotaly).
function cotalyFeature(title, desc) {
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, borders:noBorder, columnWidths:[5,95],
    rows:[ new TableRow({ children:[
      cell([ p([txt("●",{color:COT_CORAL,size:18})], {after:0, line:240}) ], { width:5, valign:VerticalAlign.TOP, margins:{top:34,bottom:30,left:0,right:40} }),
      cell([ p([txt(title,{bold:true,color:COT_NAVY,size:20})], {after:8, line:240}),
             p([txt(desc,{color:GREY,size:18})], {after:0, line:240}) ], { width:95, margins:{top:30,bottom:30,left:0,right:0} }),
    ]})] });
}

// Sección completa "Cotaly · tu plataforma de estudio".
// Empuja al array `body`. opts: { pageBreak=true, incluida=true }.
// `incluida=true` (defecto) la presenta como valor incluido con la completa;
// `incluida=false` la presenta de forma neutra (p. ej. captación).
function cotalySection(body, opts = {}) {
  const { pageBreak = true, incluida = true } = opts;
  if (pageBreak) body.push(new Paragraph({ children:[new PageBreak()] }));
  body.push(cotalyHead(COTALY.nombre, COTALY.claim));
  body.push(spacer(80));
  // Banda de marca con el claim y, si procede, etiqueta "incluido".
  body.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, columnWidths:[100], borders:noBorder,
    rows:[ new TableRow({ children:[ cell([
      ...(incluida?[ new Paragraph({ spacing:{after:60,line:220}, children:[ txt("INCLUIDO CON LA PREPARACIÓN COMPLETA",{bold:true,color:COT_TEALL,size:15,caps:true}) ] }) ]:[]),
      p([txt(COTALY.intro,{color:WHITE,size:20})], {after:0, line:276}),
    ], { width:100, fill:COT_NAVY, margins:{top:150,bottom:150,left:180,right:180} }) ]})] }));
  body.push(spacer(120));
  COTALY.features.forEach(f => body.push(cotalyFeature(f[0], f[1])));
  body.push(spacer(80));
  body.push(new Paragraph({ spacing:{after:0, line:240}, children:[
    txt("Disponible en ordenador, tablet y móvil · ",{color:GREY,size:18}),
    txt(COTALY.url,{bold:true,color:COT_TEAL,size:18}),
  ]}));
}

module.exports = {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, VerticalAlign, ExternalHyperlink, HeightRule, ImageRun, PageBreak, Header, Footer, TabStopType,
  CYAN, NAVY, INK, GREY, LINE, SOFT, WHITE, FONT,
  COT_NAVY, COT_TEAL, COT_TEALL, COT_CORAL, COT_LIGHT,
  fmt, txt, p, spacer, img, ico, cell, cellBorders, noBorder, featureRow, chip,
  sectionHead, rule, tycLink, link, makeHeader, makeFooter,
  COTALY, cotalyMark, cotalyHead, cotalyFeature, cotalySection,
  SERVICIOS,
  CURSOS_TRANSVERSALES, cursosTransversales, BANCO_SUPUESTOS,
  CONV, NTEMARIO, PRECIO_TEMA, teoricoBruto, teoricoOferta, PRACT_FULL, PRACT_DESC, TUT_HORA, PACK_INTENSIVO,
  TEMAS_GENERAL, TEMAS_ESPECIFICO, FASES,
};
