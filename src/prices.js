// prices.js — Los precios NUNCA los decide la IA. Aquí están las reglas fijas
// de la skill. Recibe el planData ya validado y devuelve los importes calculados
// que el renderer incrustará en las tarjetas. Si mañana cambian las reglas, se
// cambian AQUÍ, en un solo sitio.

const PRECIO_TEMA = 23;      // €/tema
const DTO_PAGO_UNICO = 0.10; // −10% teórico
const PRACT_FULL = 495;      // € práctico
const PRACT_DESC = 396;      // € práctico si ya prepara teoría (−20%)
const TUT_HORA = 95;         // €/hora tutoría individual
const PACK_INTENSIVO = 199;  // € pack (5 sesiones 30 min)
const SUPUESTOS_HORA = 149;  // €/hora supuestos sueltos

// Formato español: coma decimal, símbolo al final.
const fmt = (n) =>
  (Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(".", ",")) + " €";

function computePrices(planData) {
  const t = planData.temario || {};
  const out = { fmt };

  // Salvaguarda de clasificación: si el PROCESO tiene un ejercicio práctico
  // (prueba práctica, supuesto/caso práctico, teórico-práctica), es "practico"
  // (495/396 €), NO "supuestos sueltos" (149 €/h). Corrige el error típico del
  // modelo de marcar supuestos en vez de practico → así no sale la tarjeta de 149 €.
  const f = planData.flags || (planData.flags = {});
  const ejercicios = (planData.conv && planData.conv.ejercicios) || "";
  if (f.supuestos && !f.practico && /práctic|supuesto|caso\s+práctic|teórico[- ]?práctic/i.test(ejercicios)) {
    f.practico = true;
    f.supuestos = false;
  }

  // Teórico (solo si hay temario)
  if (t.tieneTemario && t.ntemas) {
    const bruto = t.ntemas * PRECIO_TEMA;
    const oferta = bruto * (1 - DTO_PAGO_UNICO);
    out.teorico = {
      ntemas: t.ntemas,
      precioTema: PRECIO_TEMA,
      bruto,
      oferta,
      brutoFmt: fmt(bruto),
      ofertaFmt: fmt(oferta),
      etiqueta: `${PRECIO_TEMA} €/tema (−10% pago único)`,
    };
    out.temasSueltos = { precioTema: PRECIO_TEMA, etiqueta: `${PRECIO_TEMA} €/tema` };
  }

  // Práctico
  if (f.practico) {
    out.practico = {
      full: PRACT_FULL, desc: PRACT_DESC,
      fullFmt: fmt(PRACT_FULL), descFmt: fmt(PRACT_DESC),
      etiqueta: `${fmt(PRACT_FULL)} (${fmt(PRACT_DESC)} si ya preparas la teoría)`,
    };
  }
  if (f.supuestos && !f.practico) {
    out.supuestos = { hora: SUPUESTOS_HORA, etiqueta: `${fmt(SUPUESTOS_HORA)}/hora` };
  }

  // Méritos (caso 5): tramos fijos "desde 300 €"
  if (planData.caso === 5) {
    out.meritos = {
      etiqueta: "desde 300 € (25 evidencias) · 50/450 € · 75/600 € · 100/750 €",
      desde: 300,
    };
  }

  // Tutorías: SIEMPRE disponibles
  out.tutoria = { hora: TUT_HORA, horaFmt: fmt(TUT_HORA), etiqueta: `${fmt(TUT_HORA)}/hora` };
  out.packIntensivo = {
    precio: PACK_INTENSIVO, precioFmt: fmt(PACK_INTENSIVO),
    // Compensación sesión->pack (regla de la skill)
    trasSesion: PACK_INTENSIVO - TUT_HORA, // 104 €
    trasSesionFmt: fmt(PACK_INTENSIVO - TUT_HORA),
  };

  // ¿Hace falta tabla resumen? Solo si 2+ servicios de pago con importe.
  const dePago = ["teorico", "practico", "supuestos", "meritos"].filter((k) => out[k]);
  out.mostrarResumen = dePago.length >= 2;

  return out;
}

module.exports = { computePrices, fmt, PRECIO_TEMA, PRACT_FULL, PRACT_DESC, TUT_HORA, PACK_INTENSIVO };
