// Local algorithm timing for the technical manual; excludes SVG/browser render.
import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Mat3 } from '../src/math/Mat3.js';
import { clipLine } from '../src/clipping/CohenSutherland.js';
import { segmentIntersection } from '../src/collision/Collisions.js';

const N = 100_000;
let sink = 0;
const tasks = {
  matrix: i => {
    const m = Mat3.multiply(Mat3.translation(450, 270), Mat3.rotation(.4));
    const p = Mat3.transformPoint(m, { x: i % 120, y: 35 }); sink += p.x;
  },
  clipping: i => {
    const r = clipLine({ x: -20, y: 120 + i % 80 }, { x: 820, y: 590 },
      { xMin: 0, yMin: 0, xMax: 800, yMax: 600 }); sink += r[0].x;
  },
  intersection: i => {
    const hit = segmentIntersection({ x: 0, y: i % 40 }, { x: 400, y: 400 },
      { x: 0, y: 400 }, { x: 400, y: 0 }); sink += hit.x;
  }
};
const result = { environment: `Node ${process.version} en Windows`, iterations: N,
  note: 'Mediana de cinco rondas, tras una ronda de calentamiento; sin renderizado SVG ni FPS.' };
for (const [name, fn] of Object.entries(tasks)) {
  const times=[];
  for (let round=0;round<6;round++) {
    const start=performance.now();
    for (let i=0;i<N;i++) fn(i);
    if (round) times.push(performance.now()-start);
  }
  times.sort((a,b)=>a-b);
  result[name] = Number(times[2].toFixed(2));
}
if (!Number.isFinite(sink)) throw new Error('Resultado inválido');
mkdirSync(new URL('../docs/entrega_u1/',import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/entrega_u1/benchmark_local.json',import.meta.url),
  JSON.stringify(result,null,2)+'\n');
console.log(result);
