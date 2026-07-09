// smoke_test.js — Prueba el pipeline validate → prices → render SIN llamar a la
// API (usa un planData de ejemplo, como el que devolvería extract.js).
const fs = require("fs");
const path = require("path");
const { validatePlanData } = require("../src/validate");
const { computePrices } = require("../src/prices");
const { renderPlan } = require("../src/render");

// planData de ejemplo (caso 3: teórico solo test + práctico, Cataluña)
const planData = {
  conv: {
    plaza: "Monitor/a d'Esports",
    admin: "Ajuntament de Sant Vicenç de Castellet (Barcelona)",
    nplazas: "2", regimen: "laboral fijo", grupo: "Grupo C, subgrupo C1",
    sistema: "Concurso-oposición", ejercicios: "Test + práctico",
    idioma: "Catalán C1 (req.)",
    boletin: "BOPB de 15/05/2026 · CVE 202610088942. Plazo: 20 días hábiles.",
    cooficial: true, lenguaCooficial: "catalán",
    resumenGeneral: "Constitución, Estatuto, derecho administrativo, régimen local.",
    resumenEspecifico: "Funciones del monitor, salud, metodología, medio acuático.",
  },
  caso: 3,
  flags: { test: true, desarrollo: false, lectura: false, supuestos: false, practico: true },
  temario: {
    tieneTemario: true, ntemas: 40,
    temasGeneral: ["La Constitución Española de 1978.", "El Estatuto de Autonomía de Cataluña."],
    temasEspecifico: ["Funciones del monitor deportivo.", "Primeros auxilios básicos."],
    desglosePorGrupos: null,
  },
  servicios: ["temario", "temasSueltos", "practico"],
  servicioMeritos: null,
  fases: [
    { n: "1", t: "Admisión / exclusión", d: "Revisión de solicitudes.", tag: "Previa" },
    { n: "2", t: "Prueba teórica (test)", d: "40 preguntas tipo test, 60 min.", tag: "Temario · TEST" },
    { n: "3", t: "Prueba práctica", d: "Supuesto + clase práctica.", tag: "Práctico" },
    { n: "4", t: "Catalán C1", d: "Apto/no apto.", tag: "No temario" },
    { n: "5", t: "Concurso (méritos)", d: "Experiencia y formación.", tag: "Méritos" },
  ],
  baremo: null, faltantes: [],
  _meta: { modo: "decision", generadoEn: new Date().toISOString(), modelo: "test" },
};

(async () => {
  // Los helpers de _common.js (ico/img) usan rutas relativas al cwd (icons/,
  // *.png). El servidor debe ejecutarse con cwd = src/. Lo replicamos aquí.
  process.chdir(path.join(__dirname, "..", "src"));

  console.log("1) Validando...");
  const v = validatePlanData(planData);
  console.log("   ok:", v.ok, "| errores:", v.errores, "| avisos:", v.avisos);
  if (!v.ok) process.exit(1);

  console.log("2) Calculando precios...");
  const precios = computePrices(planData);
  console.log("   teórico:", precios.teorico.ofertaFmt, "(bruto", precios.teorico.brutoFmt + ")");
  console.log("   práctico:", precios.practico.etiqueta);
  console.log("   tutoría:", precios.tutoria.etiqueta, "| pack:", precios.packIntensivo.precioFmt, "| tras sesión:", precios.packIntensivo.trasSesionFmt);
  console.log("   mostrar resumen:", precios.mostrarResumen);

  console.log("3) Renderizando .docx...");
  const buffer = await renderPlan(planData, precios, path.join(__dirname, "..", "src"));
  const out = path.join(__dirname, "..", "outputs", "smoke_plan.docx");
  fs.writeFileSync(out, buffer);
  console.log("   escrito:", out, "(" + buffer.length + " bytes)");
  console.log("\n✅ Pipeline OK");
})().catch((e) => { console.error("❌", e); process.exit(1); });
