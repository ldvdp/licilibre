// fix4.js — node 22 + pscp stub
// node fix4.js (desde la carpeta licilibre)
const fs = require('fs');
const path = require('path');

// 1. Node 22 en el workflow
const wfPath = path.join(__dirname, '.github', 'workflows', 'daily-fetch.yml');
let wf = fs.readFileSync(wfPath, 'utf8');
wf = wf.replace(/node-version: '20'/g, "node-version: '22'");
fs.writeFileSync(wfPath, wf, 'utf8');
console.log('OK — workflow actualizado a Node 22');

// 2. Crear fetch-pscp-cat.js stub
const pscpPath = path.join(__dirname, 'scripts', 'fetch-pscp-cat.js');
const pscpContent = [
  '// licilibre · scripts/fetch-pscp-cat.js',
  '// PSCP Catalunya fetcher — pendent d\'implementar',
  'console.log("[PSCP Cat] Pendent d\'implementar");',
].join('\n');
fs.writeFileSync(pscpPath, pscpContent, 'utf8');
console.log('OK — fetch-pscp-cat.js creat');

console.log('\nAra: git add . && git commit && git push');
