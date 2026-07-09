# Despliegue en tu servidor (Ubuntu/Debian + Docker)

Guía específica para un **servidor dedicado Ubuntu/Debian con Docker ya
instalado** y un **subdominio libre**. Todo va en contenedores: la app + Caddy
(que saca el HTTPS solo). Tú no instalas Node ni LibreOffice en el sistema: el
contenedor los trae.

## 0) Antes de empezar: apunta el DNS

En tu proveedor de dominios, crea un registro **A** del subdominio hacia la IP
pública de tu servidor:

```
planes.tudominio.com   A   <IP_DE_TU_SERVIDOR>
```

Espera a que propague (unos minutos). Compruébalo con:

```bash
dig +short planes.tudominio.com     # debe devolver la IP de tu servidor
```

Esto es **imprescindible antes de arrancar**: Caddy pide el certificado HTTPS a
Let's Encrypt y necesita que el dominio ya resuelva a tu servidor.

## 1) Sube el proyecto al servidor

Desde tu Mac (o clonando desde tu repositorio Git):

```bash
scp planes-preparacion-app.zip usuario@IP_SERVIDOR:~/
ssh usuario@IP_SERVIDOR
unzip planes-preparacion-app.zip && cd planes-app
```

## 2) Configura el .env

```bash
cp .env.example .env
nano .env
```

Rellena:
- `ANTHROPIC_API_KEY` — tu clave de la API de Anthropic.
- `SESSION_SECRET` — una cadena larga aleatoria. Genérala con:
  `openssl rand -hex 32`
- `APP_USERS` — usuarios del equipo: `rosario:clave1,colab1:clave2`
- `DOMINIO` — tu subdominio: `planes.tudominio.com`
- `NODE_ENV=production` (ya viene puesto).

Guarda (Ctrl+O, Enter, Ctrl+X).

## 3) Comprueba el firewall

Los puertos 80 y 443 deben estar abiertos al exterior. Si usas UFW:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

Si tu proveedor tiene además un firewall de red (panel web), abre 80 y 443 ahí
también.

## 4) Arranca

```bash
docker compose up -d --build
```

La primera vez tarda un poco (construye la imagen con LibreOffice). Cuando
termine, Caddy pedirá el certificado automáticamente. En ~1 minuto tendrás:

```
https://planes.tudominio.com
```

## 5) Comprueba que va

```bash
docker compose ps          # los dos servicios (app, caddy) en estado "running"
docker compose logs -f app # logs de la app
docker compose logs caddy  # aquí verás la emisión del certificado
```

Abre `https://planes.tudominio.com` en el navegador: debe salir la pantalla de
login. Entra con uno de los usuarios de `APP_USERS`, pega un boletín de prueba y
genera un plan.

## Operaciones habituales

```bash
# Ver logs
docker compose logs -f app

# Reiniciar tras cambiar el .env
docker compose up -d

# Actualizar tras cambios en el código
docker compose up -d --build

# Parar todo
docker compose down

# Parar y borrar también los datos de Caddy (certificados) — rara vez necesario
docker compose down -v
```

## Añadir o quitar usuarios del equipo

Edita `APP_USERS` en `.env` y `docker compose up -d` (no hace falta rebuild).
Para algo más serio (muchos usuarios, alta/baja frecuente, contraseñas
hasheadas), migra la autenticación a una base de datos: el punto de extensión
está en `src/server.js` (`loadUsers` / `/api/login`).

## Recursos / rendimiento

Tu servidor (Xeon 6c/12t, 32 GB ECC) va sobradísimo. La app consume poco; el
pico es LibreOffice al convertir cada plan a PDF (unos segundos, un núcleo). Con
un uso normal del equipo no notarás carga. Si en algún momento quisieras
procesar muchos planes en paralelo, LibreOffice es el cuello de botella; se
resolvería con una cola simple, pero para el uso previsto no hace falta.

## Nota sobre la fuente Calibri

El diseño usa Calibri. En Linux se sustituye por **Carlito** (misma métrica, ya
incluida en el Dockerfile), así que la maquetación es fiel. Si tienes licencia
de Calibri y quieres fidelidad tipográfica exacta, copia los `.ttf` de Calibri
a la imagen (añade un `COPY` en el Dockerfile a `/usr/share/fonts/` y
`fc-cache -f`).

## Seguridad — resumen

- La app **nunca** se expone directamente: solo Caddy (80/443). La app escucha
  en el puerto interno 3000 dentro de la red de Docker.
- La `ANTHROPIC_API_KEY` vive solo en `.env` en el servidor, jamás en el
  navegador.
- HTTPS obligatorio (Caddy) + cookies seguras (`NODE_ENV=production`).
- No subas nunca `.env` a un repositorio (ya está en `.gitignore`).
