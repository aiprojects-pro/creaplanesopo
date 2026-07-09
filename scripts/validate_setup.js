// validate_setup.js — Comprueba que todo está en su sitio antes de arrancar.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");
const req = [
  "_common.js", "byd_logo.png", "cotaly_appicon.png",
  "qr_telegram.png", "qr_whatsapp.png", "qr_blog.png",
  "wa_business.png", "sm_youtube.png", "sm_instagram.png", "sm_linkedin.png",
];

let ok = true;
console.log("Verificando assets en src/ (ejecuta scripts/setup.sh si faltan):");
req.forEach((f) => {
  const exists = fs.existsSync(path.join(SRC, f));
  console.log(`  ${exists ? "OK " : "FALTA"}  ${f}`);
  if (!exists) ok = false;
});

const iconsDir = path.join(SRC, "icons");
const hasIcons = fs.existsSync(iconsDir) && fs.readdirSync(iconsDir).length > 0;
console.log(`  ${hasIcons ? "OK " : "FALTA"}  icons/ (${hasIcons ? fs.readdirSync(iconsDir).length + " iconos" : "vacío"})`);
if (!hasIcons) ok = false;

if (!process.env.ANTHROPIC_API_KEY) console.log("  AVISO: ANTHROPIC_API_KEY no está en el entorno (define .env)");

console.log(ok ? "\n✅ Entorno listo." : "\n❌ Faltan assets. Ejecuta: bash scripts/setup.sh");
process.exit(ok ? 0 : 1);
