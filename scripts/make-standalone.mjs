import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const project = resolve(import.meta.dirname, '..');
const dist = join(project, 'dist');
const assetDirectory = join(dist, 'assets');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const scriptTag = html.match(/<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!scriptTag) throw new Error('Vite no produjo el JavaScript del juego. Ejecuta npm run build.');

const scriptPath = join(dist, scriptTag[1].replace(/^\//, ''));
const script = readFileSync(scriptPath, 'utf8').replaceAll('</script', '<\\/script');
html = html.replace(scriptTag[0], `<script type="module">${script}</script>`);

const stylesheetTag = html.match(/<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (stylesheetTag) {
  const stylesheetPath = join(dist, stylesheetTag[1].replace(/^\//, ''));
  const stylesheet = readFileSync(stylesheetPath, 'utf8');
  html = html.replace(stylesheetTag[0], `<style>${stylesheet}</style>`);
}

function embedAssets(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) { embedAssets(absolute, relative); continue; }
    const extension = extname(entry.name).toLowerCase();
    const mime = { '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }[extension];
    if (!mime) continue;
    const base64 = readFileSync(absolute).toString('base64');
    html = html.replaceAll(`/assets/${relative}`, `data:${mime};base64,${base64}`);
  }
}
embedAssets(assetDirectory);

// Por compatibilidad con archivos antiguos, elimina cualquier enlace remoto;
// las fuentes actuales quedan embebidas desde public/assets/fonts.
html = html.replace(/\s*<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>/g, '');

const output = join(dist, 'Astro-Trazos-Presentacion.html');
writeFileSync(output, html, 'utf8');
console.log(`Archivo autónomo: ${output}`);
