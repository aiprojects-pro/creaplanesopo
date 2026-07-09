// server.js — Servidor de la app. Flujo:
//   1) login del equipo (sesión)
//   2) POST /api/generar  con { boletinTxt (o fichero .txt), observaciones, modo }
//   3) extract (IA) -> validate -> computePrices -> render (.docx) -> [convert PDF]
//   4) descarga del .docx (y preview PDF opcional)
//
// SEGURIDAD: la ANTHROPIC_API_KEY vive SOLO aquí (servidor). Nunca en el navegador.

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { extractPlanData } = require("./extract");
const { validatePlanData } = require("./validate");
const { computePrices } = require("./prices");
const { renderPlan } = require("./render");
const { docxToPdf } = require("./convert");

const app = express();
const PORT = process.env.PORT || 3000;
// Los helpers de _common.js (ico/img) leen icons/ y *.png con rutas RELATIVAS
// al cwd. Fijamos el cwd a src/ para que resuelvan correctamente.
process.chdir(__dirname);
const ASSETS_DIR = __dirname; // _common.js, byd_logo.png, icons/, qr_*.png... se copian aquí en el arranque
const OUT_DIR = path.join(__dirname, "..", "outputs");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- Retención: los .docx/.pdf generados y los .txt temporales son
// regenerables; se borran pasadas RETENTION_HOURS horas para que las carpetas
// no crezcan sin límite. Barrido al arrancar y cada hora.
const RETENTION_HOURS = Number(process.env.RETENTION_HOURS) || 48;
function sweepOldFiles(dir) {
  const cutoff = Date.now() - RETENTION_HOURS * 3600 * 1000;
  fs.readdir(dir, (err, files) => {
    if (err) return;
    for (const f of files) {
      if (f.startsWith(".")) continue; // no tocar .gitkeep
      const full = path.join(dir, f);
      fs.stat(full, (e, st) => {
        if (!e && st.isFile() && st.mtimeMs < cutoff) fs.unlink(full, () => {});
      });
    }
  });
}
function sweepAll() { sweepOldFiles(OUT_DIR); sweepOldFiles(UPLOAD_DIR); }
sweepAll();
setInterval(sweepAll, 3600 * 1000).unref();

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB máx para un .txt
  fileFilter: (req, file, cb) => cb(null, /text\/plain|\.txt$/i.test(file.mimetype + file.originalname)),
});

// Detrás de Caddy (u otro reverse proxy) la app recibe HTTP en :3000 y el TLS
// lo termina el proxy. Sin esto, express-session NO fija la cookie `secure` en
// producción (no percibe la conexión como HTTPS) y el login entra en bucle.
app.set("trust proxy", 1);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 3600 * 1000 },
}));

// ---- Auth mínima para equipo + colaboradores ----
// Usuarios en variable de entorno APP_USERS = "user1:pass1,user2:pass2"
// (para producción real: mover a una BD y hashear; esto es el esqueleto).
function loadUsers() {
  const raw = process.env.APP_USERS || "equipo:cambia-esto";
  // Partimos solo en el PRIMER ":" para no romper contraseñas que lo contengan.
  return Object.fromEntries(
    raw.split(",").map((p) => {
      const i = p.indexOf(":");
      return i === -1 ? [p, ""] : [p.slice(0, i), p.slice(i + 1)];
    })
  );
}
function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "No autenticado" });
  return res.redirect("/login.html");
}

// ---- Rate-limit del login (en memoria, por IP) ----
// Frena la fuerza bruta sin dependencias: tras LOGIN_MAX_INTENTOS fallos en la
// ventana, se bloquea esa IP hasta que expira. Un login correcto la resetea.
const LOGIN_MAX_INTENTOS = 8;
const LOGIN_VENTANA_MS = 15 * 60 * 1000; // 15 min
const intentosLogin = new Map(); // ip -> { count, first }
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, v] of intentosLogin) if (ahora - v.first > LOGIN_VENTANA_MS) intentosLogin.delete(ip);
}, LOGIN_VENTANA_MS).unref();

app.post("/api/login", (req, res) => {
  const ip = req.ip;
  const ahora = Date.now();
  let reg = intentosLogin.get(ip);
  if (reg && ahora - reg.first > LOGIN_VENTANA_MS) reg = undefined; // ventana expirada
  if (reg && reg.count >= LOGIN_MAX_INTENTOS) {
    const espera = Math.ceil((LOGIN_VENTANA_MS - (ahora - reg.first)) / 60000);
    return res.status(429).json({ error: `Demasiados intentos. Prueba de nuevo en ~${espera} min.` });
  }

  const { user, pass } = req.body || {};
  const users = loadUsers();
  if (user && users[user] && users[user] === pass) {
    intentosLogin.delete(ip); // login correcto: resetea el contador
    req.session.user = user;
    return res.json({ ok: true, user });
  }

  // Fallo: incrementa el contador de la IP.
  if (reg) reg.count += 1;
  else intentosLogin.set(ip, { count: 1, first: ahora });
  return res.status(401).json({ error: "Credenciales incorrectas" });
});
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

// Estáticos públicos (login) y protegidos (app)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "creaplanesopo" });
});
app.use("/login.html", express.static(path.join(__dirname, "..", "public", "login.html")));
app.use(requireAuth);
app.use(express.static(path.join(__dirname, "..", "public")));

// ---- Endpoint principal ----
app.post("/api/generar", upload.single("boletinFile"), async (req, res) => {
  try {
    let boletinTxt = (req.body.boletinTxt || "").trim();
    if (req.file) boletinTxt = fs.readFileSync(req.file.path, "utf8");
    const observaciones = (req.body.observaciones || "").trim();
    const modo = req.body.modo === "captacion" ? "captacion" : "decision";

    if (!boletinTxt || boletinTxt.length < 200) {
      return res.status(400).json({ error: "El texto del boletín es demasiado corto o falta." });
    }

    // 1) Extracción IA
    const planData = await extractPlanData(boletinTxt, observaciones, modo);

    // 2) Validación (red de seguridad)
    const v = validatePlanData(planData);
    if (!v.ok) {
      return res.status(422).json({ error: "El plan no pasó la validación", detalles: v.errores, avisos: v.avisos, planData });
    }

    // 3) Precios (reglas fijas, fuera del modelo)
    const precios = computePrices(planData);

    // 4) Render .docx
    const buffer = await renderPlan(planData, precios, ASSETS_DIR);
    const slug = (planData.conv.plaza || "plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    const stamp = Date.now();
    const docxPath = path.join(OUT_DIR, `plan-${slug}-${stamp}.docx`);
    fs.writeFileSync(docxPath, buffer);

    // 5) PDF preview (best-effort; si falla LibreOffice, seguimos con el docx)
    let pdfName = null;
    try {
      const pdfPath = await docxToPdf(docxPath, OUT_DIR);
      pdfName = path.basename(pdfPath);
    } catch (e) {
      console.warn("PDF no generado (¿LibreOffice instalado?):", e.message);
    }

    return res.json({
      ok: true,
      docx: path.basename(docxPath),
      pdf: pdfName,
      avisos: v.avisos,
      resumen: {
        plaza: planData.conv.plaza, caso: planData.caso,
        servicios: planData.servicios, faltantes: planData.faltantes || [],
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Error interno", raw: err.raw });
  } finally {
    // Limpieza del upload temporal en TODAS las rutas (éxito, 400/422 y error).
    if (req.file) fs.unlink(req.file.path, () => {});
  }
});

// Descarga de ficheros generados (solo autenticado)
app.get("/api/download/:name", (req, res) => {
  const f = path.join(OUT_DIR, path.basename(req.params.name));
  if (!fs.existsSync(f)) return res.status(404).send("No encontrado");
  res.download(f);
});

app.listen(PORT, () => console.log(`Planes app en http://localhost:${PORT}`));
