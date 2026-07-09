# Planes de preparación · App web interna

App para que tu equipo y colaboradores generen **planes de preparación** en `.docx`
(identidad oposicionesdeporte.com / Cotaly) a partir del **texto de un boletín**
+ **observaciones**, sin depender de ti. Reutiliza el pipeline `docx` de la skill
`planes-preparacion-oposicionesdeporte`.

## Idea en una frase

> El modelo de IA **solo lee y clasifica** el boletín (devuelve un JSON). Todo lo
> que afecta a **precio, estructura e identidad visual** vive en **código
> determinista** que tú controlas. Así nadie puede romper el diseño ni equivocarse
> en un precio desde la interfaz.

## Flujo

```
TXT boletín + observaciones + modo
        │
        ▼
  extract.js  ──►  Claude API (Sonnet)  ──►  JSON estructurado
        │            (reglas = REGLAS_NEGOCIO.md)
        ▼
  validate.js  (red de seguridad: caso, servicios, nº temas, coherencia)
        │
        ▼
  prices.js  (23 €/tema −10%, 495/396 €, 95 €/h, 199 €… REGLAS FIJAS)
        │
        ▼
  render.js  ──►  usa _common.js SIN MODIFICAR  ──►  .docx (Buffer)
        │            (helpers, identidad BYD, sección Cotaly, QR, logo real)
        ▼
  convert.js  (LibreOffice headless → PDF de preview)
        │
        ▼
  descarga .docx  (+ ver PDF)
```

## Estructura del proyecto

```
planes-app/
├─ package.json
├─ Dockerfile               # Node + LibreOffice (imprescindible para el PDF)
├─ .env.example             # copia a .env
├─ scripts/
│  ├─ setup.sh              # copia assets a src/ + genera icons/
│  ├─ make_icons.py         # (de la skill) genera los line-icons
│  └─ validate_setup.js     # comprueba que todo está en su sitio
├─ src/
│  ├─ server.js             # Express: login + /api/generar + descargas
│  ├─ extract.js            # IA → JSON (única parte "inteligente")
│  ├─ validate.js           # valida el JSON antes de renderizar
│  ├─ prices.js             # precios FIJOS (fuera del modelo)
│  ├─ render.js             # ensambla el .docx (parametrizado)
│  ├─ convert.js            # docx → pdf (soffice)
│  ├─ pipeline/
│  │  └─ REGLAS_NEGOCIO.md  # reglas extraídas del SKILL.md (prompt de la IA)
│  └─ assets-source/        # _common.js + assets REALES de la marca (bundle)
│     ├─ _common.js         # ← los helpers de la skill, SIN modificar
│     ├─ byd_logo.png       # logo real (nunca inventar otro)
│     ├─ cotaly_appicon.png
│     ├─ qr_telegram.png / qr_whatsapp.png / qr_blog.png
│     └─ wa_business.png / sm_youtube.png / sm_instagram.png / sm_linkedin.png
└─ public/
   ├─ index.html            # interfaz de generación
   └─ login.html            # acceso del equipo
```

## Puesta en marcha (local)

```bash
cd planes-app
npm install
cp .env.example .env         # y rellena ANTHROPIC_API_KEY, APP_USERS, SESSION_SECRET
bash scripts/setup.sh        # copia assets a src/ y genera icons/ (necesita python3 + pillow)
# LibreOffice debe estar instalado para el PDF (en Docker ya viene)
npm start                    # http://localhost:3000
```

## Despliegue (contenedor)

Por LibreOffice, usa un host de **contenedores** (Railway, Render, Fly.io, VPS):

```bash
docker build -t planes-app .
docker run -p 3000:3000 --env-file .env planes-app
```

Configura las variables de entorno en el panel del proveedor (no subas `.env`).

## Acceso del equipo

`APP_USERS="rosario:clave,colab1:clave2"` en el `.env`. Login por sesión con
cookie httpOnly. Para producción seria: migrar usuarios a una BD y hashear las
contraseñas (bcrypt); el esqueleto deja el punto de extensión en `server.js`
(`loadUsers` / `/api/login`).

## Qué está COMPLETO

Todo el pipeline está implementado, probado de extremo a extremo y validado
(`All validations PASSED!` con el validador de la skill, 0 imágenes
`.undefined`, 10 páginas en modo decisión):

- Arquitectura extract → validate → prices → render → convert.
- `extract.js` con el esquema JSON y las reglas de negocio.
- `validate.js` con todas las comprobaciones de coherencia y precio.
- `prices.js` con TODAS las reglas de precio fijas (incluida la compensación
  sesión→pack de 104 €).
- `server.js`, login, subida de .txt, descargas, PDF best-effort.
- Frontend (index + login).
- `render.js` COMPLETO, con el **diseño rico real** de la skill:
  - **Modo DECISIÓN**: portada con franja de datos, "El temario" (tarjetas
    general/específico), proceso selectivo (fases con chips de color),
    "Cómo prepararte" (priceCard con banda de precio de color: completa,
    temas sueltos, tutorías, pack, práctico/supuestos, méritos), sección
    Cotaly (vía `cotalySection` intacta), condiciones con cláusulas del primer
    acceso, anexo con `temaList` numerado, y bloque de canales completo
    (3 QR + tarjeta de dudas WhatsApp Business + redes).
  - **Modo CAPTACIÓN (AIDA)**: portada con gancho + 3 claims (2017/73%/1a1),
    proceso, "así te preparamos", precio, Cotaly, "por qué nosotros", CTA+canales.
  - Se elige automáticamente según `planData._meta.modo`.

### Verificado en pruebas
- Modo decisión: `.docx` válido, 10 páginas, identidad BYD correcta.
- Modo captación: `.docx` válido, portada con gancho y claims.
- Precios exactos: 828 € (40 temas −10%), práctico 495/396 €, pack 104 € tras sesión.

### Posibles ajustes finos (opcionales)
- **Tabla "Resumen de precios"**: `prices.js` ya calcula `mostrarResumen`
  (true si 2+ servicios de pago). Si la quieres visible, añade una tabla en
  `render.js` antes de Condiciones usando ese flag. No es imprescindible: la
  skill la marca como opcional.
- **Desglose por grupos** (cuando el boletín no publica enunciados): el JSON ya
  trae `temario.desglosePorGrupos`; si lo quieres pintar en el anexo, añade un
  helper análogo a `temaList`.
- **Caso 5 / baremo**: el JSON trae `baremo[]`; la tarjeta de méritos ya se
  pinta. Si quieres una sección "dónde se gana la plaza" con el baremo detallado,
  añádela en `buildDecision` antes de "Cómo prepararte".

## Notas importantes (heredadas de la skill)

- **Nunca modificar los helpers de `_common.js`.** Solo cambia de dónde salen los datos.
- **`img()` fuerza `type:"png"`** → evita el error de imágenes `.undefined` que
  rompe Word. Usa siempre `img()` / `ico()`, nunca `ImageRun` a mano.
- **Logo:** solo `byd_logo.png` real, solo en cabecera, nunca uno inventado.
- **Fuente:** el diseño usa Calibri. En Linux se sustituye por **Carlito**
  (métrica-equivalente, ya en el Dockerfile). Si tienes licencia de Calibri,
  instala los `.ttf` y `fc-cache -f` para fidelidad exacta.
- **Validación docx:** puedes seguir usando el `validate.py` de la skill pública
  sobre los `.docx` de `outputs/` como QA extra.

## Coste operativo (orden de magnitud)

- API: unos céntimos por plan (una llamada Sonnet de entrada media).
- Hosting: contenedor pequeño, unos pocos €/mes.
- Sin coste por usuario: la clave es tuya y sirve a todo el equipo.
