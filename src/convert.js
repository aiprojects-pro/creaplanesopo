// convert.js — Conversión .docx -> .pdf con LibreOffice headless (soffice).
// Requiere LibreOffice instalado en el servidor (por eso el hosting debe ser un
// contenedor, no una función serverless "pura"). Se usa para el preview PDF; la
// descarga principal es el .docx.

const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

function docxToPdf(docxPath, outDir) {
  return new Promise((resolve, reject) => {
    // Cada invocación usa un perfil de usuario de LibreOffice propio. Sin esto,
    // dos conversiones simultáneas comparten el perfil por defecto y la segunda
    // falla por bloqueo (lock). Se borra al terminar.
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "lo-"));
    const userInstallation = "-env:UserInstallation=file://" + profileDir;
    const cleanup = () => fs.rm(profileDir, { recursive: true, force: true }, () => {});

    execFile(
      "soffice",
      [userInstallation, "--headless", "--convert-to", "pdf", "--outdir", outDir, docxPath],
      { timeout: 60000 },
      (err) => {
        cleanup();
        if (err) return reject(err);
        const pdf = path.join(outDir, path.basename(docxPath).replace(/\.docx$/i, ".pdf"));
        if (!fs.existsSync(pdf)) return reject(new Error("LibreOffice no generó el PDF"));
        resolve(pdf);
      }
    );
  });
}

module.exports = { docxToPdf };
