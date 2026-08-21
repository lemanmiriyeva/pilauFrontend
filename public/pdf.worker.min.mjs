// pdf.js-in worker faylını public/-ə köçürür ki, PdfViewer.jsx onu sadə bir string yol
// ("/pdf.worker.min.mjs") ilə istifadə edə bilsin - nə CDN-ə (offline mühitdə işləməyəcək),
// nə də `import.meta.url`-ə (Next.js-in webpack/turbopack build-ini "Syntax Error: import.meta
// cannot be used outside of module code" ilə sındırır) ehtiyac qalmır.
// npm install-dan sonra avtomatik işə düşür (bax package.json -> "postinstall").
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(__dirname, '..', 'public');
const dest = path.join(destDir, 'pdf.worker.min.mjs');

if (!fs.existsSync(src)) {
    console.warn('[copy-pdf-worker] pdfjs-dist/build/pdf.worker.min.mjs tapılmadı, ötürülür.');
    process.exit(0);
}

fs.mkdirSync(destDir, {recursive: true});
fs.copyFileSync(src, dest);
console.log('[copy-pdf-worker] pdf.worker.min.mjs -> public/pdf.worker.min.mjs köçürüldü.');