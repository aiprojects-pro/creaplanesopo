# Instrucciones de despliegue — para el administrador del servidor

App interna **planes-app** (oposicionesdeporte.com): genera planes de preparación
en `.docx` a partir del texto de un boletín. Se despliega en **contenedores**
(la app + Caddy, que emite el HTTPS automáticamente). No hay que instalar Node ni
LibreOffice en el sistema: la imagen los trae.

> El despliegue se ha probado de extremo a extremo: build de la imagen, arranque
> del contenedor y login funcionando. Solo falta que **tú añadas la API key real**
> (paso 3) y el dominio.

**Requisitos del servidor:** Ubuntu/Debian con **Docker** y **Docker Compose**, un
**subdominio libre** y los puertos **80/443** accesibles desde internet.

---

## 1. Apuntar el DNS

En el proveedor de dominios, crea un registro **A** del subdominio hacia la IP
pública del servidor:

```
planes.tudominio.com   A   <IP_DEL_SERVIDOR>
```

Espera a que propague y compruébalo:

```bash
dig +short planes.tudominio.com     # debe devolver la IP de tu servidor
```

Esto es **imprescindible antes de arrancar**: Caddy pedirá el certificado a
Let's Encrypt y necesita que el dominio ya resuelva al servidor.

## 2. Subir el proyecto

Por git o por copia de archivos. ⚠️ **No copies ningún `.env` de otra máquina**
(por ejemplo, el `.env` de pruebas en local): el servidor usa el suyo propio, que
se crea en el paso siguiente.

```bash
# opción A: clonar el repositorio
git clone <URL_DEL_REPO> planes-app && cd planes-app

# opción B: descomprimir el zip enviado
unzip planes-app.zip && cd planes-app
```

## 3. Configurar el `.env` (aquí va la API key)

```bash
cp .env.example .env
nano .env
```

Rellena:

| Variable | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | **La clave real de la API de Anthropic** (la que custodias tú). |
| `SESSION_SECRET` | Una cadena larga aleatoria. Genérala con `openssl rand -hex 32`. |
| `APP_USERS` | Usuarios del equipo: `rosario:CLAVE,colab1:CLAVE2` (usuario:contraseña, separados por comas). |
| `DOMINIO` | Tu subdominio, p. ej. `planes.tudominio.com`. |
| `NODE_ENV` | **Déjalo en `production`** (ya viene puesto). Activa las cookies seguras; es imprescindible detrás de Caddy. |

Guarda (Ctrl+O, Enter, Ctrl+X). **No subas el `.env` a ningún repositorio** (ya
está en `.gitignore`).

## 4. Abrir el firewall

Los puertos 80 y 443 deben estar abiertos al exterior:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

Si el proveedor tiene además un firewall de red en su panel, abre 80 y 443 ahí
también.

## 5. Arrancar

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos (construye la imagen con LibreOffice). Al
terminar, Caddy pide el certificado automáticamente y en ~1 minuto tendrás
`https://planes.tudominio.com`.

## 6. Comprobar

```bash
docker compose ps            # 'app' y 'caddy' en estado "running"
docker compose logs -f app   # debe verse: "Planes app en http://localhost:3000"
docker compose logs caddy    # aquí se ve la emisión del certificado TLS
```

Abre `https://planes.tudominio.com`:
1. Sale la pantalla de **login**.
2. Entra con uno de los usuarios de `APP_USERS`.
3. Pega el texto de un boletín de prueba y genera un plan → debe descargarse el `.docx`.

---

## Operaciones habituales

```bash
# Ver logs de la app
docker compose logs -f app

# Añadir/quitar usuarios: edita APP_USERS en .env y recarga (SIN rebuild)
docker compose up -d

# Actualizar tras cambios de código
docker compose up -d --build

# Parar todo
docker compose down
```

## Histórico de planes

Cada plan generado queda guardado y se puede buscar por **año** y **mes**:

- En la app hay un enlace **"Histórico"** (arriba a la derecha) con filtros de año y
  mes y descarga del Word/PDF de cualquier plan anterior.
- El histórico y los ficheros generados viven en la carpeta `outputs/` del servidor
  (montada como volumen), así que **se conservan entre redespliegues**. No borres esa
  carpeta si quieres mantener el histórico; puedes copiarla para hacer copia de seguridad.

## Si algo falla

| Síntoma | Causa probable / solución |
|---------|---------------------------|
| El navegador no carga o Caddy no saca certificado | El DNS aún no resuelve al servidor (paso 1) o 80/443 cerrados (paso 4). Revisa `docker compose logs caddy`. |
| Login correcto pero vuelve al login (bucle) | Falta `NODE_ENV=production` en `.env`, o se está entrando por `http://` en vez de `https://`. Entra siempre por HTTPS. |
| Al generar: error de la API / 401 | `ANTHROPIC_API_KEY` vacía o incorrecta en `.env`. Corrígela y `docker compose up -d`. |
| Se genera el `.docx` pero no el PDF de preview | Normal solo si faltara LibreOffice; en la imagen ya viene, así que no debería ocurrir. El `.docx` es la descarga principal. |

## Notas de seguridad

- La app **nunca** se expone directamente: solo Caddy (80/443). La app escucha en
  el puerto interno 3000 dentro de la red de Docker.
- La `ANTHROPIC_API_KEY` vive solo en `.env` en el servidor, jamás en el navegador.
- El login tiene límite de intentos (8 fallos en 15 min → bloqueo temporal de la IP).
- Los `.docx`/`.pdf` generados se borran automáticamente pasadas 48 h (configurable
  con `RETENTION_HOURS` en `.env`).
