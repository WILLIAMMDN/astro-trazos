import { chromium } from 'playwright';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('docs/entrega_u1');
const temp = path.join(out, '_grabacion');
await mkdir(temp, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
  recordVideo: { dir: temp, size: { width: 1280, height: 720 } } });
const page = await context.newPage();
page.on('pageerror', error => process.stderr.write(`PAGE ERROR: ${error.message}\n`));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const box = document.createElement('div');
  box.id = 'demo-subtitle';
  Object.assign(box.style, { position: 'fixed', left: '19%', top: '12%', width: '62%',
    zIndex: '99999', padding: '8px 17px', borderRadius: '13px', pointerEvents: 'none',
    background: 'rgba(7,25,54,.88)', border: '2px solid #ffe3a7', color: '#fff9e9',
    textAlign: 'center', font: 'bold 20px Arial', boxShadow: '0 5px 22px #06142eaa' });
  document.body.append(box);
});
async function caption(message) { await page.evaluate(text => { document.querySelector('#demo-subtitle').textContent = text; }, message); }
async function hold(seconds) { await page.waitForTimeout(seconds * 1000); }
async function scene(name) { await page.evaluate(n => window.switchToScreen(n), name); await hold(2); }
async function hint() { await page.locator('#mission-hint').click(); }
async function stroke(name, points, steps=22) {
  const svg=page.locator(`#screen-${name} svg`).first(); const b=await svg.boundingBox();
  if (!b) throw new Error(`No SVG box for ${name}`);
  const xy=p=>({x:b.x+p[0]/1920*b.width,y:b.y+p[1]/1080*b.height});
  let a=xy(points[0]);await page.mouse.move(a.x,a.y);await page.mouse.down();
  for(let k=1;k<points.length;k++){
    const c=xy(points[k]);await page.mouse.move(c.x,c.y,{steps});
  }
  await page.mouse.up();await hold(1.5);
}

await caption('ASTRO-TRAZOS · geometría que se construye con el pincel');await hold(16);
await scene('level1');await caption('1. Diseñamos dos segmentos para rodear el cometa.');await hint();await hold(9);await hint();
await stroke('level1',[[580,800],[1090,670]],30);await hold(5);
await stroke('level1',[[1090,670],[1490,340]],30);await hold(12);
await scene('level2');await caption('2. La dirección y longitud del vector cambian la trayectoria.');await hint();await hold(7);await hint();
await stroke('level2',[[360,720],[660,380]],34);await hold(15);
await scene('level3');await caption('3. El peso justo: buscamos dos medidas cuyo producto sea 1200.');await hint();await hold(9);
await caption('Arrastramos: base 40 u × altura 30 u = área 1200 u².');
await stroke('level3',[[820,350],[1060,530]],65);await hold(20);
await scene('level4');await caption('4. Las defensas detienen los rayos en la intersección real.');await hint();await hold(9);await hint();
await stroke('level4',[[750,420],[900,420]],28);await hold(5);
await stroke('level4',[[1000,440],[1000,520]],28);await hold(5);
await stroke('level4',[[1120,350],[1200,350]],28);await hold(14);
await scene('level5');await caption('5. El escudo exige seis lados conectados y un contorno cerrado.');await hint();await hold(11);
await scene('level6');await caption('6. La órbita se evalúa por su cierre y por la distancia al centro.');await hint();await hold(12);
await scene('menu');await caption('Siete escenas · 17 pruebas automatizadas · jornada RSU documentada');await hold(15);
const video=page.video();await context.close();const source=await video.path();
await copyFile(source,path.join(out,'5_Video_Demostracion.webm'));
await browser.close();
console.log('Saved',path.join(out,'5_Video_Demostracion.webm'));
