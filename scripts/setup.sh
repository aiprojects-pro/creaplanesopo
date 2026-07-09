#!/usr/bin/env bash
# setup.sh — Prepara el entorno de ejecución.
# Copia _common.js y los assets reales de la marca a src/ (donde el renderer los
# espera) y genera la carpeta icons/ con los line-icons. Ejecutar una vez tras
# clonar / instalar dependencias, y siempre que se actualicen los assets.
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "==> Copiando _common.js y assets de marca a src/"
cp src/assets-source/_common.js src/_common.js
cp src/assets-source/*.png src/

echo "==> Generando icons/ (line-icons) con make_icons.py"
cd src
python3 ../scripts/make_icons.py
cd ..

echo "==> Comprobando que el logo real está presente"
test -f src/byd_logo.png && echo "   OK byd_logo.png" || { echo "   FALTA byd_logo.png (logo real de la marca)"; exit 1; }

echo "==> Setup completado. Recuerda crear tu .env (ver .env.example)."
