// licilibre — fix2.js
// Añade 'force-dynamic' a las páginas para evitar el error de build
// Ejecutar desde la raíz: node fix2.js
const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'web', 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Añadir force-dynamic si no está ya
if (!content.includes('force-dynamic')) {
  content = "export const dynamic = 'force-dynamic';\n\n" + content;
  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('OK — force-dynamic añadido a page.tsx');
} else {
  console.log('Ya tenía force-dynamic, sin cambios');
}

// También en la página de detalle
const detallPath = path.join(__dirname, 'web', 'app', 'licitacion', '[id]', 'page.tsx');
let detall = fs.readFileSync(detallPath, 'utf8');
if (!detall.includes('force-dynamic')) {
  detall = "export const dynamic = 'force-dynamic';\n\n" + detall;
  fs.writeFileSync(detallPath, detall, 'utf8');
  console.log('OK — force-dynamic añadido a licitacion/[id]/page.tsx');
}

console.log('Listo. Ahora: git add . && git commit -m "fix: force-dynamic" && git push');
