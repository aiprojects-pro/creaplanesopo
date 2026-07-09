// extract.js — La ÚNICA parte "inteligente" de la app.
// Toma el TXT del boletín + observaciones y devuelve un JSON estructurado y
// ya clasificado (caso 1-5, servicios, precios, fases, temario...). NO redacta
// el .docx: solo entiende y clasifica. Toda la maquetación, identidad visual y
// reglas de precio viven en el pipeline (código determinista), fuera del modelo.

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cargamos las reglas de negocio desde el propio SKILL.md (fuente única de
// verdad). Así, si Rosario actualiza las reglas, basta con actualizar este
// fichero — no hay que tocar el prompt a mano.
const REGLAS = fs.readFileSync(
  path.join(__dirname, "pipeline", "REGLAS_NEGOCIO.md"),
  "utf8"
);

// Esquema que el modelo DEBE devolver. Se lo describimos en el system prompt y
// luego lo validamos en validate.js (defensa en profundidad: nunca confiamos
// ciegamente en la salida del modelo para nada que afecte a precio o estructura).
const SYSTEM_PROMPT = `Eres el motor de clasificación de la herramienta interna de oposicionesdeporte.com para generar planes de preparación. Tu único trabajo es LEER una convocatoria (texto de un boletín oficial) y devolver un objeto JSON estructurado, ya clasificado según las reglas de negocio. NO redactas el documento Word: eso lo hace otro sistema. NO inventas precios: los precios son FIJOS y los calcula el sistema a partir de los datos que extraes.

REGLAS DE NEGOCIO (autoritativas):
${REGLAS}

INSTRUCCIONES DE SALIDA:
- Responde ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin \`\`\`, sin texto antes o después.
- Si un dato no aparece en el boletín y no puedes inferirlo con seguridad, ponlo como null y añádelo al array "faltantes" con una nota de qué habría que preguntar.
- NO calcules importes en euros: solo extrae nplazas, nº de temas y clasifica ejercicios/servicios. El sistema aplica los 23 €/tema, −10%, 495/396 €, etc.

Esquema JSON EXACTO que debes devolver:
{
  "conv": {
    "plaza": string,
    "admin": string,
    "nplazas": string,
    "regimen": string,
    "grupo": string,
    "sistema": string,             // "Oposición" | "Concurso-oposición" | "Concurso de méritos" | ...
    "ejercicios": string,          // resumen legible: "Test + práctico", "Solo concurso", etc.
    "idioma": string | null,
    "boletin": string,             // referencia + plazo, en una frase
    "cooficial": boolean,          // true si Galicia/Cataluña/C.Valenciana/País Vasco
    "lenguaCooficial": string | null,   // "gallego" | "catalán" | "valenciano" | "euskera" | null
    "resumenGeneral": string | null,
    "resumenEspecifico": string | null
  },
  "caso": 1 | 2 | 3 | 4 | 5,       // según la tabla de casos de las reglas
  "flags": {                        // qué tipos de ejercicio existen (para cursos transversales)
    "test": boolean,
    "desarrollo": boolean,
    "lectura": boolean,
    "supuestos": boolean,
    "practico": boolean
  },
  "temario": {
    "tieneTemario": boolean,
    "ntemas": number | null,       // total de temas (0/null si no hay temario)
    "temasGeneral": string[],      // enunciados literales; [] si no se publican
    "temasEspecifico": string[],   // enunciados literales; [] si no se publican
    "desglosePorGrupos": [ { "grupo": string, "ntemas": number, "descripcion": string } ] | null
  },
  "servicios": string[],           // claves del catálogo SERVICIOS que aplican, p.ej. ["temario","practico"]. tutoria y packIntensivo van SIEMPRE, no hace falta listarlos.
  "servicioMeritos": "concurso" | "bolsa" | "libreDesig" | null,  // solo caso 5
  "fases": [                       // TODAS las fases del proceso, en orden
    { "n": string, "t": string, "d": string, "tag": string }   // tag: Previa|Temario · TEST|Temario · DESARROLLO|Práctico|No temario|Méritos|Final
  ],
  "baremo": [ { "concepto": string, "detalle": string, "max": string } ] | null,  // solo caso 5
  "faltantes": [ string ]          // datos que no se pudieron extraer y habría que confirmar
}`;

/**
 * Extrae y clasifica una convocatoria.
 * @param {string} boletinTxt  Texto del boletín oficial (pegado o subido como .txt).
 * @param {string} observaciones  Notas del operador sobre particularidades del proceso.
 * @param {string} modo  "decision" | "captacion" (no afecta a la extracción, pero se registra).
 * @returns {Promise<object>}  planData validable por validate.js
 */
async function extractPlanData(boletinTxt, observaciones = "", modo = "decision") {
  const userContent =
    `MODO SOLICITADO: ${modo}\n\n` +
    `=== TEXTO DEL BOLETÍN OFICIAL ===\n${boletinTxt}\n\n` +
    `=== OBSERVACIONES DEL OPERADOR (particularidades a tener en cuenta) ===\n` +
    `${observaciones || "(sin observaciones)"}\n\n` +
    `Clasifica esta convocatoria y devuelve el JSON según el esquema.`;

  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  // Ensamblamos todo el texto devuelto (por si viene en varios bloques).
  const raw = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // Defensa: quitar posibles fences aunque le hayamos pedido que no los ponga.
  const clean = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  let planData;
  try {
    planData = JSON.parse(clean);
  } catch (e) {
    const err = new Error(
      "El modelo no devolvió un JSON parseable. Revisa el boletín o reintenta."
    );
    err.raw = raw;
    throw err;
  }

  planData._meta = { modo, generadoEn: new Date().toISOString(), modelo: "claude-sonnet-4-6" };
  return planData;
}

module.exports = { extractPlanData };
