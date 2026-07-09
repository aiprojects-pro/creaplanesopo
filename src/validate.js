// validate.js — Red de seguridad. El JSON de la IA NUNCA se renderiza sin pasar
// por aquí. Comprueba estructura, coherencia de caso vs flags, y que los datos
// que afectan al PRECIO (nº de temas, servicios) son sensatos. Los importes en
// euros NO los pone el modelo: los calcula prices.js con las reglas fijas.

const CASOS_VALIDOS = [1, 2, 3, 4, 5];
const SERVICIOS_VALIDOS = [
  "temario", "temasSueltos", "supuestos", "practico",
  "concurso", "bolsa", "libreDesig", "proyecto",
  "reclamacion", "orientacion", "tutoria", "packIntensivo",
];
const MERITOS_VALIDOS = ["concurso", "bolsa", "libreDesig"];

function validatePlanData(d) {
  const errores = [];
  const avisos = [];

  if (!d || typeof d !== "object") return { ok: false, errores: ["planData vacío o no es objeto"], avisos };

  // --- conv ---
  if (!d.conv || typeof d.conv !== "object") errores.push("Falta el bloque conv{}");
  else {
    if (!d.conv.plaza) errores.push("conv.plaza vacío");
    if (!d.conv.admin) errores.push("conv.admin vacío");
    if (typeof d.conv.cooficial !== "boolean") avisos.push("conv.cooficial no es booleano; se asume false");
    if (d.conv.cooficial && !d.conv.lenguaCooficial)
      errores.push("cooficial=true pero falta lenguaCooficial");
  }

  // --- caso ---
  if (!CASOS_VALIDOS.includes(d.caso)) errores.push(`caso inválido: ${d.caso}`);

  // --- flags ---
  const f = d.flags || {};
  ["test", "desarrollo", "lectura", "supuestos", "practico"].forEach((k) => {
    if (typeof f[k] !== "boolean") avisos.push(`flags.${k} no booleano; se asume false`);
  });

  // --- coherencia caso <-> flags ---
  if (d.caso === 2 && !f.desarrollo) avisos.push("caso 2 (test+desarrollo) pero flags.desarrollo=false");
  if (d.caso === 4 && !(f.desarrollo && f.practico))
    avisos.push("caso 4 debería tener desarrollo Y práctico en flags");
  if ((d.caso === 3 || d.caso === 4) && !f.practico && !f.supuestos)
    avisos.push("caso con práctico pero flags.practico y flags.supuestos ambos false");

  // --- temario ---
  const t = d.temario || {};
  if (typeof t.tieneTemario !== "boolean") errores.push("temario.tieneTemario no booleano");
  if (t.tieneTemario) {
    if (!t.ntemas || t.ntemas < 1) errores.push("temario.tieneTemario=true pero ntemas inválido (afecta al precio)");
    const listados = (t.temasGeneral?.length || 0) + (t.temasEspecifico?.length || 0);
    if (listados > 0 && t.ntemas && listados !== t.ntemas)
      avisos.push(`ntemas=${t.ntemas} pero hay ${listados} enunciados listados (revisar)`);
    if (listados === 0 && !t.desglosePorGrupos)
      avisos.push("sin enunciados y sin desglosePorGrupos: el anexo quedará escueto");
  } else {
    if (d.caso !== 5) avisos.push("tieneTemario=false pero caso != 5 (concurso de méritos)");
  }

  // --- servicios ---
  if (!Array.isArray(d.servicios) || d.servicios.length === 0)
    errores.push("servicios[] vacío: SIEMPRE debe haber algo que ofrecer");
  else {
    d.servicios.forEach((s) => {
      if (!SERVICIOS_VALIDOS.includes(s)) errores.push(`servicio desconocido: ${s}`);
    });
    if (t.tieneTemario && !d.servicios.includes("temario"))
      avisos.push("hay temario pero 'temario' no está en servicios[]");
  }

  // --- caso 5: méritos ---
  if (d.caso === 5) {
    if (!MERITOS_VALIDOS.includes(d.servicioMeritos))
      errores.push("caso 5 requiere servicioMeritos = concurso|bolsa|libreDesig");
    if (!Array.isArray(d.baremo) || d.baremo.length === 0)
      avisos.push("caso 5 sin baremo[]: la sección 'dónde se gana la plaza' quedará vacía");
  }

  // --- fases ---
  if (!Array.isArray(d.fases) || d.fases.length === 0)
    errores.push("fases[] vacío: el proceso selectivo no se puede pintar");

  return { ok: errores.length === 0, errores, avisos };
}

module.exports = { validatePlanData, SERVICIOS_VALIDOS };
