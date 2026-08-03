// render.js — Ensamblado del .docx con el DISEÑO RICO real de la skill,
// parametrizado a partir de planData (JSON de la IA) + precios (prices.js).
//
// Replica fielmente build_ejemplo_santvicenc.js (modo DECISIÓN) y el patrón de
// captación. Los helpers de _common.js se usan SIN modificar; aquí solo cambia
// de dónde salen los datos (antes constantes hardcodeadas, ahora planData).
//
// IMPORTANTE (rutas de assets): _common.js lee icons/ y *.png con rutas
// RELATIVAS al cwd. server.js hace process.chdir(src/), por lo que aquí las
// imágenes se referencian por nombre ("byd_logo.png", etc.) igual que en la skill.

const path = require("path");
const fs = require("fs");
const C = require(path.join(__dirname, "_common.js"));
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, VerticalAlign, HeightRule, PageBreak, LineRuleType,
  CYAN, NAVY, INK, GREY, LINE, SOFT, WHITE, FONT, dxa, cols,
  fmt, txt, p, spacer, img, ico, cell, noBorder, featureRow, chip,
  sectionHead, rule, tycLink, link, makeHeader, makeFooter, Header,
  cotalySection, cursosTransversales, BANCO_SUPUESTOS, SERVICIOS,
} = C;
const A = AlignmentType;

// -------- Cabecera corregida (no tocamos _common.js) --------
// Igual que makeHeader pero con el logo alineado ARRIBA en su celda. Con
// valign BOTTOM, el LibreOffice del contenedor anclaba el logo por su base a la
// línea del texto de contacto y, al ser el logo más alto, su parte superior se
// salía de la página y se recortaba. Alineado arriba, el logo se ancla al borde
// superior de la cabecera y se ve entero en cualquier versión de LibreOffice.
function makeHeaderFix(logoPath) {
  if (!fs.existsSync(logoPath)) throw new Error("FALTA EL LOGO REAL en " + logoPath);
  return new Header({ children: [
    new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [6360, 3000], borders: noBorder,
      rows: [new TableRow({ height: { value: 1240, rule: HeightRule.ATLEAST }, children: [
        cell([new Paragraph({ spacing: { after: 0, line: 1200, lineRule: "atLeast" }, children: [img(logoPath, 128, 75)] })], { w: 6360, valign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
        cell([
          p([txt("Centro de preparación de oposiciones", { color: GREY, size: 16 })], { after: 0, align: A.RIGHT, line: 200 }),
          p([txt("info@oposicionesdeporte.com", { color: CYAN, size: 16, bold: true })], { after: 0, align: A.RIGHT, line: 200 }),
        ], { w: 3000, valign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      ]})],
    }),
    new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 } }, spacing: { after: 160 } }),
  ]});
}

// URLs/datos fijos de marca (idénticos a la skill).
const URLS = {
  telegram: "https://t.me/oposicionesdeporte",
  whatsappCanal: "https://www.whatsapp.com/channel/0029VapOK50I1rcgPaGhl30M",
  blog: "https://oposicionesdeporte.com/blog-oposiciones-deporte/",
  youtube: "https://www.youtube.com/@OposicionesdelDeporte",
  instagram: "https://www.instagram.com/oposicionesdeporte/",
  linkedin: "https://www.linkedin.com/company/bydformaciondeporte/",
  telefono: "910 78 13 23",
  email: "info@oposicionesdeporte.com",
};

// Estadísticas de marca FIJAS para todos los planes (por el momento).
const STATS = [
  ["+900", "opositores preparados desde 2017"],
  ["73 %", "de aprobados sobre presentados"],
  ["1 a 1", "con tu preparador"],
];
const LEMA = "Preparación personalizada, de principio a fin, con un preparador que te guía en cada fase del proceso. Tú estudias; nosotros nos encargamos del resto.";
const NOTA_STATS = "Dato global de aprobados sobre presentados en todas las convocatorias preparadas desde 2017.";

// Encabezado ligero de subsección (texto en negrita + regla fina), para las
// secciones "Descuentos…" y "Resumen de precios" (más discretas que sectionHead).
function subHead(body, titulo) {
  body.push(new Paragraph({
    spacing: { before: 60, after: 120, line: 260 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    children: [txt(titulo, { bold: true, color: NAVY, size: 24 })],
  }));
}

// -------- priceCard: banda de precio de color + features (igual que la skill) --------
function priceCard(body, { tag, tagColor, titulo, sub, precioBruto, precioOferta, ofertaNota, intro, features }) {
  body.push(chip(tag, tagColor));
  body.push(spacer(40));
  const precioRuns = [];
  if (precioBruto != null) precioRuns.push(txt(fmt(precioBruto) + "  ", { color: "BBD9E6", size: 24, strike: true }));
  precioRuns.push(txt(typeof precioOferta === "number" ? fmt(precioOferta) : precioOferta, { bold: true, color: WHITE, size: 38 }));
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([100]), borders: noBorder,
    rows: [new TableRow({ children: [cell([
      p([txt(titulo, { bold: true, color: WHITE, size: 23 })], { after: 4, line: 270 }),
      ...(sub ? [p([txt(sub, { color: "D7ECF5", size: 17 })], { after: 10, line: 230 })] : []),
      p(precioRuns, { after: ofertaNota ? 4 : 0, line: 420 }),
      ...(ofertaNota ? [p([txt(ofertaNota, { color: "D7ECF5", size: 17 })], { after: 0, line: 220 })] : []),
    ], { width: 100, fill: tagColor === CYAN ? CYAN : NAVY, margins: { top: 140, bottom: 140, left: 180, right: 180 } })] })]
  }));
  body.push(spacer(60));
  if (intro) body.push(p([txt(intro, { color: INK, size: 19 })], { after: 80, line: 256 }));
  if (features && features.length) {
    body.push(p([txt("Esto es lo que consigues:", { bold: true, color: NAVY, size: 19 })], { after: 60, line: 240 }));
    features.forEach((f) => body.push(featureRow(f[0], f[1], f[2])));
  }
  body.push(spacer(140));
}

// Separa la numeración que trae el enunciado del boletín ("1.", "Tema 1.",
// "11)", "5.-"...) y la reutiliza como número del tema. Así:
//   - el número mostrado es EL DEL BOLETÍN (cada proceso el suyo; 1..N, 11..20…),
//   - y NO se duplica: antes salía "Tema 1. 1. ...", ahora "Tema 1. ...".
// Exige un separador tras la cifra para no tocar enunciados que empiezan por un
// número real (p.ej. "112 servicio..."). Si el enunciado no trae número, usa el
// ordinal de posición como respaldo.
function splitTemaNum(s, fallback) {
  const str = String(s == null ? "" : s).trim();
  const m = str.match(/^(?:tema\s+)?(\d+)\s*[.)\-–—:]+\s*(.+)$/is);
  if (m && m[2].trim()) return { num: m[1], text: m[2].trim() };
  return { num: String(fallback), text: str };
}

// Resumen temático de un bloque para la tarjeta de "El temario". Se construye a
// partir de los PROPIOS temas del bloque (fuente fiable: el modelo a veces mete
// aquí la descripción del proceso o lo deja vacío). Toma el primer inciso de
// cada tema. Respaldo: el resumen del modelo, y si no, un texto genérico.
function resumenBloque(provided, temas, tipo) {
  const lista = Array.isArray(temas) ? temas.filter(Boolean) : [];
  if (lista.length) {
    const items = lista.slice(0, 6).map((t) => {
      let s = splitTemaNum(t, 1).text.split(/[.:;(]/)[0].trim();
      if (s.length > 46) s = s.slice(0, 44).trim() + "…";
      return s;
    }).filter(Boolean);
    let out = items.join(" · ");
    if (lista.length > 6 && out) out += " · …";
    if (out) return out;
  }
  const p = String(provided == null ? "" : provided).trim();
  if (p) return p;
  return tipo === "general" ? "Materias comunes del proceso." : "Materias específicas del puesto.";
}

// -------- Anexo: lista de temas en tarjetas numeradas (igual que la skill) --------
function temaList(body, titulo, temas) {
  body.push(p([txt(titulo, { bold: true, color: CYAN, size: 18, caps: true })], { before: 60, after: 60, line: 230 }));
  temas.forEach((raw, i) => {
    const { num, text } = splitTemaNum(raw, i + 1);
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([6, 94]), borders: noBorder,
      rows: [new TableRow({ children: [
        cell([p([txt(num, { bold: true, color: CYAN, size: 17 })], { after: 0, line: 220, align: A.CENTER })],
          { width: 6, fill: SOFT, valign: VerticalAlign.TOP, margins: { top: 40, bottom: 40, left: 20, right: 20 } }),
        cell([p([txt("Tema " + num + ". ", { bold: true, color: NAVY, size: 17 }), txt(text, { color: INK, size: 17 })], { after: 0, line: 230 })],
          { width: 94, margins: { top: 40, bottom: 40, left: 120, right: 40 } }),
      ]})]
    }));
    body.push(spacer(16));
  });
}

// -------- Bloque de canales + CTA (assets fijos; idéntico en ambos modos) --------
function bloqueCanales(body) {
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(sectionHead("chat", "No pierdas oportunidades"));
  body.push(spacer(80));
  body.push(p([txt("Mantente al día de nuevas convocatorias, fechas y recursos a través de nuestros canales.", { color: INK, size: 20 })], { after: 160, line: 264 }));

  const qrCard = (headerColor, headerText, qrFile, footerPara) => cell([
    new Paragraph({ shading: { type: ShadingType.CLEAR, color: "auto", fill: headerColor }, spacing: { after: 0, line: 300 }, alignment: A.CENTER, children: [txt(headerText, { bold: true, color: WHITE, size: 18 })] }),
    new Paragraph({ alignment: A.CENTER, spacing: { after: 0, before: 100 }, children: [img(qrFile, 150, 150)] }),
    footerPara,
  ], { width: 32, valign: VerticalAlign.TOP, fill: SOFT, margins: { top: 0, bottom: 140, left: 80, right: 80 } });

  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([32, 2, 32, 2, 32]), borders: noBorder,
    rows: [new TableRow({ height: { value: 3100, rule: HeightRule.ATLEAST }, children: [
      qrCard(NAVY, "Telegram", "qr_telegram.png", new Paragraph({ alignment: A.CENTER, spacing: { after: 0, before: 80 }, children: [link(URLS.telegram, "Unirse a Telegram", { size: 15 })] })),
      cell([p([], { after: 0 })], { width: 2, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      qrCard(CYAN, "Canal de WhatsApp", "qr_whatsapp.png", new Paragraph({ alignment: A.CENTER, spacing: { after: 0, before: 80 }, children: [link(URLS.whatsappCanal, "Unirse al canal", { size: 15 })] })),
      cell([p([], { after: 0 })], { width: 2, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      qrCard(NAVY, "Blog", "qr_blog.png", new Paragraph({ alignment: A.CENTER, spacing: { after: 0, before: 80 }, children: [link(URLS.blog, "Suscríbete al blog", { size: 15 })] })),
    ]})]
  }));
  body.push(spacer(180));

  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([100]), borders: noBorder,
    rows: [new TableRow({ children: [cell([
      p([txt("Dudas e información", { bold: true, color: NAVY, size: 22 })], { after: 10, line: 260 }),
      new Paragraph({ spacing: { after: 6, line: 280 }, children: [img("wa_business.png", 24, 24), txt("   WhatsApp Business  ", { bold: true, color: INK, size: 21 }), txt(URLS.telefono, { bold: true, color: CYAN, size: 26 })] }),
      p([txt(URLS.email, { color: CYAN, size: 19, bold: true })], { after: 0, line: 240 }),
    ], { width: 100, fill: SOFT, margins: { top: 150, bottom: 150, left: 180, right: 180 } })] })]
  }));
  body.push(spacer(160));

  body.push(p([txt("Síguenos también en nuestras redes", { bold: true, color: NAVY, size: 20 })], { after: 60, line: 260 }));
  body.push(new Paragraph({ spacing: { after: 0, line: 320 }, children: [
    img("sm_youtube.png", 24, 24), txt("  ", { size: 21 }), link(URLS.youtube, "YouTube", { size: 19 }),
    txt("          ", { size: 21 }), img("sm_instagram.png", 24, 24), txt("  ", { size: 21 }), link(URLS.instagram, "Instagram", { size: 19 }),
    txt("          ", { size: 21 }), img("sm_linkedin.png", 24, 24), txt("  ", { size: 21 }), link(URLS.linkedin, "LinkedIn", { size: 19 }),
  ]}));
}

// -------- Tarjetas de "Cómo prepararte" según el caso (comparten priceCard) --------
// Orden: completa → temas sueltos → práctico/supuestos → méritos → tutorías → pack.
function tarjetasOpciones(body, planData, precios) {
  const f = planData.flags || {};

  // 1) Preparación completa (temario) — recomendada + temas sueltos
  if (precios.teorico) {
    const cursos = cursosTransversales(f);
    const feats = [
      ["doc", "Temario específico de esta convocatoria", "Hecho a medida para este proceso (en versión test" + (f.desarrollo ? " y desarrollo" : "") + "). Tras la contratación, se subirá gradualmente al aula virtual en PDF descargable, completándose en un plazo aproximado de un mes."],
      ["chat", "Consultas con tu preparador por chat", "Resuelve tus dudas con el preparador, de forma individualizada, en cualquier momento de la preparación."],
      ["test", "Exámenes tipo test en la plataforma", "Baterías de preguntas y simulacro tipo test específicos para este proceso, además de exámenes reales de procesos selectivos de la misma categoría profesional."],
      ["audio", "Audio por tema", "Cada tema en audio descargable para repasar en cualquier momento."],
      ["stack", "Acceso a los cursos transversales", "Incluye el acceso a otros cursos transversales de la plataforma: " + cursos.join(" · ") + "."],
    ];
    if (planData.conv.cooficial) feats.push(["stack", "Idioma a elegir: castellano o " + planData.conv.lenguaCooficial, "Eliges el idioma del temario; se entrega en un solo idioma, no en ambos."]);
    // El título deja claro que cubre la parte teórica (el práctico va aparte):
    // "examen teórico" si hay un solo ejercicio teórico; "ejercicios teóricos" si hay dos (test + desarrollo).
    const nTeo = (f.test ? 1 : 0) + (f.desarrollo ? 1 : 0);
    const tituloCompleta = "Preparación completa " + (nTeo >= 2 ? "ejercicios teóricos" : "examen teórico");
    const teoParts = [f.test ? "test" : null, f.desarrollo ? "desarrollo" : null].filter(Boolean).join(" + ");
    priceCard(body, {
      tag: "Recomendada", tagColor: NAVY, titulo: tituloCompleta,
      sub: "Los " + precios.teorico.ntemas + " temas" + (teoParts ? " (" + teoParts + ")" : "") + " + aula virtual + preparador",
      precioBruto: precios.teorico.bruto, precioOferta: precios.teorico.oferta, ofertaNota: "pago único · 10% dto.",
      intro: "Preparas a fondo la parte teórica con el temario específico de esta convocatoria, hecho a medida, y el acompañamiento del preparador.",
      features: feats,
    });

    // Temas sueltos — "Empieza probando"
    priceCard(body, {
      tag: "Empieza probando", tagColor: CYAN, titulo: "Temas sueltos a medida",
      sub: "Elige solo los temas que necesitas",
      precioBruto: null, precioOferta: precios.temasSueltos.precioTema, ofertaNota: "por tema · solo versión test · sin permanencia",
      intro: "Pensados para ver un tema antes de contratar la preparación completa: funcionan como prueba de nuestra forma de trabajar.",
      features: [
        ["doc", "Tema a medida en PDF", "Redactado para el ejercicio tipo test, conforme al temario oficial de esta plaza."],
        ["check", "Sin permanencia", "Pago por tema, sin compromisos. Mismo estándar que la preparación completa."],
        ["euro", "Su importe se descuenta del total", "Lo que pagues por temas sueltos se descuenta del precio de la preparación completa si después la contratas (acumulativo)."],
      ],
    });
  }

  // 2) Práctico / supuestos (justo tras la parte teórica)
  if (precios.practico) {
    // Etiqueta según el ordinal del ejercicio práctico en el proceso ("Tercer
    // ejercicio"…), tomado del título de su fase; si no, "Ejercicio práctico".
    const fasePr = (planData.fases || []).find((x) => /práctic/i.test(x.tag || ""));
    const tagPr = (fasePr && fasePr.t && fasePr.t.includes("·")) ? fasePr.t.split("·")[0].trim() : "Ejercicio práctico";
    priceCard(body, {
      tag: tagPr, tagColor: NAVY, titulo: "Preparación del ejercicio práctico",
      sub: "Metodología, tipología de supuestos y recursos",
      precioBruto: precios.practico.full, precioOferta: precios.practico.desc,
      ofertaNota: fmt(precios.practico.desc) + " si preparas la teoría con nosotros (−20%) · " + fmt(precios.practico.full) + " por separado",
      intro: "Preparamos el ejercicio práctico con metodología, ejemplos reales y recursos de apoyo.",
      features: [
        ["target", "Tipología de supuestos", "Ejemplos y tipos de supuestos prácticos relacionados con las funciones del puesto."],
        ["info", "Construcción de hipótesis", "Cómo plantear y anticipar posibles supuestos del tribunal."],
        ["check", "Metodología de resolución", "Sistemática de planteamiento, desarrollo y conclusiones."],
        ["tool", "Recursos en vídeo", "Clases grabadas y documentos de referencia para justificar el desarrollo."],
        ["stack", BANCO_SUPUESTOS, "Acceso al " + BANCO_SUPUESTOS + " en la plataforma, para entrenar con casos a medida."],
      ],
    });
    body.push(p([txt("Se contrata tras superar el ejercicio anterior. No admite pago fraccionado.", { color: GREY, size: 18, italics: true })], { after: 0 }));
  } else if (precios.supuestos) {
    priceCard(body, {
      tag: "Supuestos prácticos", tagColor: NAVY, titulo: "Supuestos prácticos",
      sub: "Propuesta y corrección personalizada por hora",
      precioBruto: null, precioOferta: precios.supuestos.hora, ofertaNota: "por hora",
      intro: "Un preparador te propone un supuesto práctico a medida y corrige tu resolución.",
      features: [
        ["check", "Corrección personalizada", "Vía aula virtual, con feedback individualizado."],
        ["stack", BANCO_SUPUESTOS, "Acceso al " + BANCO_SUPUESTOS + " en la plataforma."],
      ],
    });
  }

  // 3) Méritos (caso 5)
  if (precios.meritos) {
    const nombre = SERVICIOS[planData.servicioMeritos]?.nombre || "Preparación de la documentación";
    priceCard(body, {
      tag: "Recomendada", tagColor: NAVY, titulo: nombre,
      sub: "Análisis del baremo y preparación de tus méritos",
      precioBruto: null, precioOferta: precios.meritos.etiqueta, ofertaNota: "según nº de evidencias",
      intro: "Aquí se gana la plaza: analizamos el baremo oficial y preparamos y presentamos las evidencias de tus méritos.",
      features: [
        ["scale", "Análisis del baremo", "Qué méritos puntúan y cómo maximizarlos según el baremo oficial."],
        ["doc", "Preparación de evidencias", "Organización y presentación de tus méritos conforme a la convocatoria."],
      ],
    });
  }

  // 4) Tutorías — "Solo acompañamiento"
  priceCard(body, {
    tag: "Solo acompañamiento", tagColor: CYAN, titulo: "Tutorías individuales",
    sub: "Acompañamiento con el preparador, sin necesidad de la preparación completa",
    precioBruto: null, precioOferta: precios.tutoria.hora, ofertaNota: "por hora · sesión individual uno a uno",
    intro: "El preparador es funcionario en activo, con más de 15 años preparando opositores. Puedes contratar una sola sesión de prueba, sin compromiso.",
    features: [
      ["user", "Sesión individual", "Uno a uno con el preparador, enfocada a tus necesidades concretas."],
      ["chat", "A tu ritmo", "Resuelve dudas, planifica el estudio o repasa los contenidos que necesites."],
    ],
  });

  // 5) Pack Intensivo
  priceCard(body, {
    tag: "El más completo · ahorro", tagColor: NAVY, titulo: "Pack Intensivo de tutorías individuales",
    sub: "5 sesiones de 30 min + repaso guiado + acompañamiento por chat",
    precioBruto: null, precioOferta: precios.packIntensivo.precio, ofertaNota: "ahorras casi 40 € frente a las sesiones sueltas",
    intro: "Un paquete cerrado para trabajar de forma continuada con el preparador y reforzar los puntos donde más lo necesites. Si vienes de una sesión individual de 1 h, pagas " + precios.packIntensivo.trasSesionFmt + " y te quedan 3 sesiones de 30 min.",
    features: [
      ["calendar", "5 sesiones de 30 minutos", "Cinco tutorías individuales para avanzar de forma guiada y constante."],
      ["scale", "Repaso guiado", "Trabajo enfocado sobre los temas, el desarrollo escrito o los supuestos prácticos que más se te resistan."],
      ["chat", "Acompañamiento por chat", "Seguimiento y resolución de dudas entre sesiones."],
    ],
  });
}

// -------- Proceso selectivo (fases con chips) --------
function seccionProceso(body, planData, titulo, intro) {
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(sectionHead("test", titulo));
  body.push(spacer(80));
  if (intro) body.push(p([txt(intro, { color: INK, size: 20 })], { after: 140, line: 264 }));
  (planData.fases || []).forEach((fase, i) => {
    const tag = fase.tag || "";
    const tagColor = tag.includes("TEST") || tag === "Práctico" ? CYAN : (tag === "No temario" ? GREY : NAVY);
    // La columna del nº es estrecha: solo debe llevar el ordinal. Si el modelo
    // mete texto largo en "n" (p.ej. "Oposición — Ejercicio 1") usamos el índice
    // secuencial para no romper la maqueta; el nombre de la fase ya va en fase.t.
    const nDisp = /^\s*\d{1,3}\s*$/.test(String(fase.n || "")) ? String(fase.n).trim() : String(i + 1);
    body.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([7, 68, 25]), borders: noBorder,
      rows: [new TableRow({ children: [
        cell([p([txt(nDisp, { bold: true, color: CYAN, size: 26 })], { after: 0, line: 280 })], { width: 7, valign: VerticalAlign.TOP, margins: { top: 30, bottom: 30, left: 0, right: 40 } }),
        cell([p([txt(fase.t, { bold: true, color: NAVY, size: 20 })], { after: 8, line: 240 }), p([txt(fase.d, { color: GREY, size: 18 })], { after: 0, line: 240 })], { width: 68, margins: { top: 30, bottom: 30, left: 0, right: 60 } }),
        cell([chip(tag, tagColor)], { width: 25, valign: VerticalAlign.TOP, margins: { top: 30, bottom: 30, left: 0, right: 0 } }),
      ]})]
    }));
    body.push(spacer(60));
  });
}

// -------- Portada con franja de datos (modo decisión) --------
function portadaDecision(body, planData) {
  const conv = planData.conv, t = planData.temario || {};
  body.push(spacer(60));
  body.push(p([txt("PLAN DE PREPARACIÓN", { bold: true, color: CYAN, size: 24, caps: true })], { after: 50 }));
  body.push(p([txt(conv.plaza, { bold: true, color: NAVY, size: 48 })], { after: 40, line: 620, lineRule: LineRuleType.AT_LEAST }));
  body.push(p([txt(conv.admin, { color: GREY, size: 24 })], { after: 160 }));
  const datos = [
    ["Plazas", (conv.nplazas || "—") + " · " + (conv.regimen || "—")],
    ["Grupo", conv.grupo || "—"],
    ["Temario", t.tieneTemario ? t.ntemas + " temas" : "Sin temario"],
    ["Sistema", conv.sistema || "—"],
    ["Ejercicios", conv.ejercicios || "—"],
    ["Idioma", conv.idioma || "Español"],
  ];
  const dRows = [];
  for (let i = 0; i < datos.length; i += 3) {
    dRows.push(new TableRow({ children: datos.slice(i, i + 3).map(([k, v]) => cell([
      p([txt(k.toUpperCase() + " ", { bold: true, color: GREY, size: 15, caps: true }), txt(v, { bold: true, color: INK, size: 18 })], { after: 0, line: 230 })
    ], { width: 33, fill: SOFT, margins: { top: 120, bottom: 120, left: 140, right: 120 } })) }));
  }
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([33, 34, 33]),
    borders: { ...noBorder, insideHorizontal: { style: BorderStyle.SINGLE, color: WHITE, size: 16 }, insideVertical: { style: BorderStyle.SINGLE, color: WHITE, size: 16 } },
    rows: dRows,
  }));
  body.push(spacer(140));

  // Lema (banda azul marino con texto blanco centrado)
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([100]), borders: noBorder,
    rows: [new TableRow({ children: [cell([
      p([txt(LEMA, { bold: true, color: WHITE, size: 21 })], { after: 0, align: A.CENTER, line: 300 }),
    ], { width: 100, fill: NAVY, margins: { top: 180, bottom: 180, left: 260, right: 260 } })] })]
  }));
  body.push(spacer(120));

  // Claims fijos (+900 · 73 % · 1 a 1)
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([33, 33, 34]),
    borders: { ...noBorder, insideVertical: { style: BorderStyle.SINGLE, color: WHITE, size: 16 } },
    rows: [new TableRow({ children: STATS.map(([big, small]) => cell([
      p([txt(big, { bold: true, color: CYAN, size: 40 })], { after: 6, align: A.CENTER, line: 460 }),
      p([txt(small, { color: GREY, size: 16 })], { after: 0, align: A.CENTER, line: 220 }),
    ], { width: 33, fill: SOFT, margins: { top: 150, bottom: 150, left: 120, right: 120 } })) })]
  }));
  body.push(spacer(60));
  body.push(p([txt(NOTA_STATS, { color: GREY, size: 15, italics: true })], { after: 60, align: A.CENTER, line: 220 }));

  if (conv.boletin) body.push(p([txt(conv.boletin, { color: GREY, size: 18, italics: true })], { after: 0, line: 264 }));
}

// -------- "Por qué prepararte con nosotros" (4 features, tras la portada) --------
function seccionPorque(body) {
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(sectionHead("target", "Por qué prepararte con nosotros"));
  body.push(spacer(80));
  body.push(p([txt("No es solo un temario: es un método y un preparador que te acompaña hasta el examen.", { color: INK, size: 20 })], { after: 140, line: 264 }));
  [
    ["user", "Preparador funcionario en activo", "Funcionario de carrera en activo, con más de 15 años preparando opositores, que te guía en cada fase del proceso: de la solicitud al examen."],
    ["doc", "Temario a medida y único para tu proceso", "No es un temario genérico ni reutilizado: se elabora a medida para esta convocatoria concreta, con su normativa y sus particularidades."],
    ["test", "Simulacros con exámenes reales", "Baterías de preguntas por tema y simulacros específicos de este proceso, además de exámenes reales de convocatorias anteriores."],
    ["calendar", "Acompañamiento hasta el examen", "Te guiamos de la solicitud al examen: planificación del estudio, seguimiento y avisos de cada plazo del proceso."],
  ].forEach((c) => body.push(featureRow(c[0], c[1], c[2])));
}

// -------- "Descuentos y cómo se combinan" --------
function seccionDescuentos(body, precios) {
  body.push(spacer(120));
  subHead(body, "Descuentos y cómo se combinan");
  body.push(featureRow("euro", "Pago único −10 %", "La preparación completa tiene un 10 % de descuento por pago único (ya reflejado en el precio)."));
  body.push(featureRow("euro", "Temas sueltos acumulables", "Lo que pagues por temas sueltos se descuenta del precio de la preparación completa si luego la contratas."));
  if (precios.practico) body.push(featureRow("euro", "Práctico −20 %", "El ejercicio práctico cuesta " + fmt(precios.practico.desc) + " si preparas la teoría con nosotros; " + fmt(precios.practico.full) + " por separado."));
}

// -------- "Resumen de precios" (tabla) --------
// Siempre empieza en una página nueva (PageBreak) y sus filas no se parten
// (cantSplit) para que la tabla no aparezca cortada entre páginas.
function tablaResumen(body, planData, precios) {
  body.push(new Paragraph({ children: [new PageBreak()] }));
  subHead(body, "Resumen de precios");
  const f = planData.flags || {};
  const teoParts = [f.test ? "test" : null, f.desarrollo ? "desarrollo" : null].filter(Boolean).join(" + ");
  const tituloCompleta = "Preparación completa" + (teoParts ? " (" + teoParts + ")" : "");
  const filas = [];
  // [nombre, referencia (o null), loQuePagas, subnota (o null), destacada]
  if (precios.teorico) filas.push([tituloCompleta, precios.teorico.brutoFmt, precios.teorico.ofertaFmt, "con pago único · ahorras " + fmt(precios.teorico.bruto - precios.teorico.oferta), true]);
  if (precios.temasSueltos) filas.push(["Temas sueltos a medida (para probar)", null, precios.temasSueltos.precioTema + " € / tema", null, false]);
  if (precios.practico) filas.push(["Ejercicio práctico (supuestos)", precios.practico.fullFmt, precios.practico.descFmt, "si preparas la teoría · ahorras " + fmt(precios.practico.full - precios.practico.desc), false]);
  else if (precios.supuestos) filas.push(["Supuestos prácticos", null, precios.supuestos.hora + " € / hora", null, false]);
  if (precios.meritos) filas.push(["Preparación de méritos", null, precios.meritos.etiqueta, null, false]);
  filas.push(["Tutoría individual (60 min)", null, precios.tutoria.hora + " € / hora", null, false]);
  filas.push(["Pack Intensivo (5 tutorías de 30 min)", null, precios.packIntensivo.precio + " €", null, false]);

  const th = (t, align) => new Paragraph({ spacing: { after: 0, line: 220 }, alignment: align, children: [txt(t, { bold: true, color: WHITE, size: 15, caps: true })] });
  const rows = [new TableRow({ cantSplit: true, children: [
    cell([th("Servicio", A.LEFT)], { w: dxa(50), fill: NAVY, margins: { top: 90, bottom: 90, left: 140, right: 100 } }),
    cell([th("Precio de referencia", A.RIGHT)], { w: dxa(24), fill: NAVY, margins: { top: 90, bottom: 90, left: 60, right: 100 } }),
    cell([th("Lo que pagas", A.RIGHT)], { w: dxa(26), fill: NAVY, margins: { top: 90, bottom: 90, left: 60, right: 140 } }),
  ] })];
  const cb = { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } };
  filas.forEach(([nombre, ref, paga, sub, dest]) => {
    rows.push(new TableRow({ cantSplit: true, children: [
      cell([p([...(dest ? [txt("★ ", { color: CYAN, size: 18, bold: true })] : []), txt(nombre, { bold: dest, color: dest ? NAVY : INK, size: 18 })], { after: 0, line: 240 })], { w: dxa(50), borders: cb, margins: { top: 100, bottom: 100, left: 140, right: 100 } }),
      cell([p([ref ? txt(ref, { color: GREY, size: 17, strike: true }) : txt("—", { color: LINE, size: 17 })], { after: 0, align: A.RIGHT, line: 240 })], { w: dxa(24), borders: cb, valign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 60, right: 100 } }),
      cell([p([txt(paga, { bold: true, color: NAVY, size: 18 })], { after: sub ? 2 : 0, align: A.RIGHT, line: 240 }), ...(sub ? [p([txt(sub, { color: GREY, size: 15 })], { after: 0, align: A.RIGHT, line: 210 })] : [])], { w: dxa(26), borders: cb, valign: VerticalAlign.CENTER, margins: { top: 100, bottom: 100, left: 60, right: 140 } }),
    ] }));
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([50, 24, 26]), borders: noBorder, rows }));
  body.push(spacer(80));
  body.push(p([txt("Los descuentos por pago único (−10 %) y del ejercicio práctico (−20 %) ya están aplicados en la columna “Lo que pagas”.", { color: GREY, size: 16, italics: true })], { after: 0, line: 240 }));
}

// -------- CTA "Empieza hoy" (banda azul marino) --------
function ctaEmpieza(body) {
  body.push(spacer(180));
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([100]), borders: noBorder,
    rows: [new TableRow({ children: [cell([
      p([txt("Empieza hoy", { bold: true, color: WHITE, size: 26 })], { after: 8, align: A.CENTER, line: 300 }),
      p([txt("Contrata tu preparación o escríbenos para resolver cualquier duda antes de decidir.", { color: "D7ECF5", size: 18 })], { after: 20, align: A.CENTER, line: 260 }),
      new Paragraph({ alignment: A.CENTER, spacing: { after: 0, line: 300 }, children: [img("wa_business.png", 24, 24), txt("  WhatsApp Business  ", { bold: true, color: WHITE, size: 20 }), txt(URLS.telefono, { bold: true, color: "8FE3FF", size: 24 })] }),
    ], { width: 100, fill: NAVY, margins: { top: 200, bottom: 200, left: 200, right: 200 } })] })]
  }));
}

// ===================== PLAN (único modo) =====================
function buildDecision(planData, precios) {
  const conv = planData.conv, t = planData.temario || {};
  const body = [];
  // Etiquetas de los bloques del temario según el boletín (p. ej. "Materias
  // comunes/específicas" o "Temario general/específico"). Respaldo genérico.
  const lblGen = t.etiquetaGeneral || "Temario general";
  const lblEsp = t.etiquetaEspecifico || "Temario específico";

  portadaDecision(body, planData);

  // Por qué prepararte con nosotros
  seccionPorque(body);

  // Proceso selectivo (antes que el temario, como en el diseño definitivo)
  seccionProceso(body, planData, "¿En qué consiste el proceso selectivo?",
    "Estas son las fases del proceso. Solo los ejercicios de temario y, en su caso, el práctico se preparan con material; el resto forma parte del proceso pero queda fuera de la preparación.");

  // El temario (solo si hay)
  if (t.tieneTemario) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(sectionHead("doc", "El temario"));
    body.push(spacer(80));
    const ng = t.temasGeneral?.length || 0, ne = t.temasEspecifico?.length || 0;
    if (ng && ne) {
      const total = ng + ne;
      body.push(p([txt("El temario consta de ", { color: INK, size: 20 }), txt(total + " temas", { bold: true, color: NAVY, size: 20 }),
        txt(": " + lblGen.toLowerCase() + " (" + ng + " temas) y " + lblEsp.toLowerCase() + " (" + ne + " temas).", { color: INK, size: 20 })], { after: 140, line: 264 }));
      body.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([49, 2, 49]), borders: noBorder,
        rows: [new TableRow({ children: [
          cell([p([txt(lblGen + " · " + ng + " temas", { bold: true, color: CYAN, size: 17, caps: true })], { after: 40, line: 230 }), p([txt(resumenBloque(conv.resumenGeneral, t.temasGeneral, "general"), { color: GREY, size: 18 })], { after: 0, line: 240 })], { width: 49, fill: SOFT, margins: { top: 120, bottom: 120, left: 140, right: 120 } }),
          cell([p([], { after: 0 })], { width: 2, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
          cell([p([txt(lblEsp + " · " + ne + " temas", { bold: true, color: CYAN, size: 17, caps: true })], { after: 40, line: 230 }), p([txt(resumenBloque(conv.resumenEspecifico, t.temasEspecifico, "especifico"), { color: GREY, size: 18 })], { after: 0, line: 240 })], { width: 49, fill: SOFT, margins: { top: 120, bottom: 120, left: 140, right: 120 } }),
        ]})]
      }));
    } else {
      const temas = (ne ? t.temasEspecifico : t.temasGeneral) || [];
      const totalUnico = temas.length || t.ntemas || 0;
      body.push(p([txt("El temario consta de ", { color: INK, size: 20 }), txt(totalUnico + " temas", { bold: true, color: NAVY, size: 20 }), txt(".", { color: INK, size: 20 })], { after: 140, line: 264 }));
      body.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols([100]), borders: noBorder,
        rows: [new TableRow({ children: [
          cell([
            p([txt("Temario · " + totalUnico + " temas", { bold: true, color: CYAN, size: 17, caps: true })], { after: 40, line: 230 }),
            p([txt(resumenBloque(conv.resumenGeneral || conv.resumenEspecifico, temas, "especifico"), { color: GREY, size: 18 })], { after: 0, line: 240 }),
          ], { width: 100, fill: SOFT, margins: { top: 120, bottom: 120, left: 140, right: 120 } }),
        ]})]
      }));
    }
    body.push(spacer(80));
    body.push(p([txt("El detalle completo de los enunciados está en el anexo final.", { color: GREY, size: 18, italics: true })], { after: 0 }));
  }

  // Cómo prepararte
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(sectionHead("stack", "Cómo prepararte con nosotros"));
  body.push(spacer(80));
  body.push(p([txt("La preparación se organiza en servicios que puedes combinar: la parte teórica (temario para test y desarrollo), el ejercicio práctico y las tutorías individuales.", { color: INK, size: 20 })], { after: 60, line: 264 }));
  if (conv.cooficial) {
    body.push(p([txt("El temario puedes elegirlo en castellano o en " + conv.lenguaCooficial + ", en un solo idioma (no en ambos a la vez). ", { bold: true, color: NAVY, size: 19 }),
      txt("Todas las clases y tutorías con el preparador se imparten en español.", { color: INK, size: 19 })], { after: 160, line: 260 }));
  }
  tarjetasOpciones(body, planData, precios);

  // Descuentos + Resumen de precios + CTA
  seccionDescuentos(body, precios);
  tablaResumen(body, planData, precios);
  ctaEmpieza(body);

  // Condiciones de contratación
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(sectionHead("scale", "Condiciones de contratación"));
  body.push(spacer(80));
  [
    ["Seguimiento de convocatorias", "El seguimiento de las publicaciones oficiales es responsabilidad de la persona opositora; el centro puede facilitar el enlace cuando la administración lo tenga."],
    ["Activación", "El aula virtual y los temas se activan tras formalizar la contratación."],
    ["Temario a medida, único para tu proceso", "No es un temario genérico ni reutilizado: cada convocatoria tiene su programa y su normativa."],
    ["Plazo de entrega", "El temario completo se entrega en torno a un mes desde la contratación, al ser material a medida. Consultas individualizadas por chat durante toda la preparación."],
    ["Primer acceso al aula", "Al acceder por primera vez aceptas las Condiciones Generales, el inicio inmediato del servicio (con la consiguiente pérdida del derecho de desistimiento), las Normas de uso y compromiso del alumno y la Política de Privacidad."],
    ["Pago y formalización", "El precio de la parte teórica ya incluye el 10% por pago único. El servicio queda sujeto a la aceptación de los términos y condiciones."],
  ].forEach((c) => body.push(featureRow("info", c[0], c[1])));
  body.push(tycLink({ before: 100 }));

  // Anexo (si hay enunciados)
  const ng = planData.temario?.temasGeneral?.length || 0, ne = planData.temario?.temasEspecifico?.length || 0;
  if (t.tieneTemario && (ng || ne)) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(sectionHead("doc", "Anexo · Relación de temas"));
    body.push(spacer(80));
    const ambos = ng && ne;
    if (ng) temaList(body, (ambos ? lblGen + " · " : "Temario · ") + ng + " temas", planData.temario.temasGeneral);
    if (ambos) body.push(spacer(80));
    if (ne) temaList(body, (ambos ? lblEsp + " · " : "Temario · ") + ne + " temas", planData.temario.temasEspecifico);
  }

  // Canales
  bloqueCanales(body);
  return body;
}

/**
 * Construye el .docx y devuelve un Buffer.
 * @param {object} planData  JSON validado
 * @param {object} precios   salida de computePrices()
 * @param {string} assetsDir carpeta con _common.js, byd_logo.png, icons/, QR...
 */
async function renderPlan(planData, precios, assetsDir) {
  const body = buildDecision(planData, precios);

  const doc = new Document({
    creator: "oposicionesdeporte.com",
    title: "Plan de preparación · " + planData.conv.plaza,
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [{
      // Margen superior amplio + distancia de cabecera fija: deja sitio a la
      // cabecera (logo alto) para que no se solape con el cuerpo en ningún
      // LibreOffice. El recorte del logo se corrige además en makeHeaderFix.
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 2160, bottom: 1100, left: 1440, right: 1440, header: 420, footer: 708 } } },
      headers: { default: makeHeaderFix(path.join(assetsDir, "byd_logo.png")) },
      footers: { default: makeFooter("Plan de preparación · " + planData.conv.plaza) },
      children: body,
    }],
  });
  return Packer.toBuffer(doc);
}

module.exports = { renderPlan };
