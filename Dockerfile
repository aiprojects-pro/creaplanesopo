# Dockerfile — Contenedor con Node + LibreOffice (necesario para el PDF).
# Este es el motivo por el que NO sirve una función serverless "pura":
# LibreOffice headless (soffice) tiene que estar instalado en el sistema.
# Despliega en Railway, Render, Fly.io, un VPS, o cualquier host de contenedores.

FROM node:20-bookworm-slim

# LibreOffice headless + fuentes + Python + cairosvg (para make_icons.py).
# make_icons.py renderiza los iconos SVG->PNG con cairosvg, que necesita la
# librería nativa libcairo2. (No usa Pillow.)
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer \
      fonts-crosextra-carlito \
      python3 python3-pip \
      libcairo2 \
      fontconfig \
    && pip3 install --break-system-packages cairosvg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Calibri no es libre; Carlito es la métrica-equivalente. Si tienes licencia de
# Calibri, copia los .ttf a /usr/share/fonts y ejecuta fc-cache -f.

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chmod +x scripts/setup.sh && ./scripts/setup.sh

EXPOSE 3000
CMD ["node", "src/server.js"]
