import {
  distance, pathLength, polygonArea, lineDeviation, firstPathIntersection,
  hasSelfIntersection, simplifyRDP, rectangleMetrics, rectangleFromDrag
} from './geometry/brushMath.js';
import { evaluateRoute, ROUTE_START, ROUTE_GOAL, ROUTE_METEOR, ROUTE_MAX_ANGLE } from './geometry/routePuzzle.js';
import { recognizeStroke } from './geometry/shapeRecognition.js';
import { Mat3 } from './math/Mat3.js';
import { clipLine } from './clipping/CohenSutherland.js';

// El arte SVG original permanece intacto. Esta capa convierte cada trazo en una
// construcción comprobable: la tinta, la geometría y las colisiones son reales.
const SVG = 'http://www.w3.org/2000/svg';
const ORDER = ['level1', 'level2', 'salto', 'level3', 'level4', 'level5', 'level6'];
const MENU_ORDER = ['level1', 'level2', 'salto', 'level4', 'level5', 'level6'];
const CONFIG = {
  level1: { ink: 1150, region: [500, 130, 1550, 850] },
  level2: { ink: 550, region: [300, 260, 940, 770] },
  salto: { ink: 730, region: [535, 230, 1240, 560] },
  level3: { ink: 1100, region: [750, 315, 1185, 605] },
  level4: { ink: 920, region: [610, 160, 1320, 700] },
  level5: { ink: 2300, region: [600, 105, 1330, 780] },
  level6: { ink: 1850, region: [640, 190, 1280, 785] }
};
const LABEL = {
  level1: 'Despegue', level2: 'Impulso vectorial', salto: 'Un salto con ingenio',
  level3: 'El peso justo', level4: 'Bloquea los rayos',
  level5: 'Polígonos lejanos', level6: 'Núcleo cósmico'
};
const MISSIONS = {
  level1: { number: '01', goal: 'Rodea el cometa con dos tramos para llegar al cohete.', steps: ['Desde 1, dibuja un tramo recto hasta un punto de giro seguro.', 'Desde allí, dibuja otro tramo hasta 2.', 'Evita el cometa. Nilo no sube pendientes mayores de 40°.'], action: 'Probar ruta' },
  level2: { number: '02', goal: 'Dibuja el impulso que lleve a Nilo sobre la pirámide.', steps: ['Empieza en el lanzador marcado.', 'Dibuja una flecha hacia arriba y a la derecha.', 'Mira la caída prevista; cambia la flecha antes de lanzar.'], action: 'Lanzar' },
  salto: { number: '03', goal: 'Construye una rampa para alcanzar la pieza de la nave.', steps: ['Empieza en el borde izquierdo iluminado.', 'Dibuja una rampa ascendente hacia la isla.', 'Mira dónde caería Nilo y ajusta el ángulo antes de saltar.'], action: 'Probar salto' },
  level3: { number: '04', goal: 'Construye un rectángulo de 1200 u² para equilibrar la balanza.', steps: ['Pulsa una esquina y arrastra hasta la esquina opuesta.', 'La base y la altura cambian de 5 u en 5 u.', 'Busca dos medidas cuyo producto sea 1200 u².'], action: 'Pesar figura' },
  level4: { number: '05', goal: 'Bloquea los tres rayos para abrir el camino.', steps: ['Cruza cada láser rojo con un trazo azul.', 'Observa dónde se detiene cada rayo.', 'Bloquea los tres y prueba el paso de Nilo.'], action: 'Probar defensa' },
  level5: { number: '06', goal: 'Une las seis estrellas vecinas para crear un escudo.', steps: ['Dibuja un lado recto entre dos estrellas.', 'Repite hasta cerrar el hexágono.', 'Comprueba sus seis lados y activa el escudo.'], action: 'Activar escudo' },
  level6: { number: '07', goal: 'Cierra una órbita estable alrededor del núcleo.', steps: ['Sigue las marcas alrededor del núcleo.', 'Termina exactamente donde comenzaste.', 'Ajusta el radio y comprueba el perímetro.'], action: 'Reparar nave' }
};
const HINTS = {
  level1: {
    text: 'Ejemplo: une 1 con el punto dorado bajo el cometa; desde allí sube hasta 2. Son dos segmentos que no tocan la roca.',
    strokes: [[{ x: 580, y: 800 }, { x: 1090, y: 670 }], [{ x: 1090, y: 670 }, { x: 1490, y: 340 }]]
  },
  level2: {
    text: 'Ejemplo: dibuja una flecha desde el lanzador hacia arriba y a la derecha. La caída prevista debe quedar detrás de la pirámide.',
    strokes: [[{ x: 360, y: 720 }, { x: 660, y: 380 }]]
  },
  salto: {
    text: 'Ejemplo: crea una rampa desde el borde izquierdo hasta el extremo alto. Un ángulo cercano a 24° lleva a Nilo a la isla.',
    strokes: [[{ x: 588, y: 492 }, { x: 1100, y: 260 }]]
  },
  level3: {
    text: 'Ejemplo: arrastra desde la esquina superior izquierda hasta la inferior derecha del rectángulo dorado. 40 u × 30 u = 1200 u².',
    strokes: [[{ x: 820, y: 350 }, { x: 1060, y: 350 }, { x: 1060, y: 530 }, { x: 820, y: 530 }, { x: 820, y: 350 }]]
  },
  level4: {
    text: 'Ejemplo: dibuja tres defensas azules que crucen los tres rayos rojos. Cada rayo se detiene donde toca un trazo.',
    strokes: [[{ x: 750, y: 420 }, { x: 900, y: 420 }], [{ x: 1000, y: 440 }, { x: 1000, y: 520 }], [{ x: 1120, y: 350 }, { x: 1200, y: 350 }]]
  },
  level5: {
    text: 'Ejemplo: une cada estrella con la siguiente hasta cerrar un hexágono de seis lados. Puedes dibujarlo de un solo trazo.',
    strokes: [Array.from({ length: 7 }, (_, i) => ({
      x: 960 + 305 * Math.cos((-90 + (i % 6) * 60) * Math.PI / 180),
      y: 435 + 305 * Math.sin((-90 + (i % 6) * 60) * Math.PI / 180)
    }))]
  },
  level6: {
    text: 'Ejemplo: rodea el núcleo siguiendo las ocho marcas y vuelve al inicio. La distancia al centro debe mantenerse casi igual.',
    strokes: [Array.from({ length: 49 }, (_, i) => ({
      x: 960 + 240 * Math.cos((-90 + i * 7.5) * Math.PI / 180),
      y: 480 + 240 * Math.sin((-90 + i * 7.5) * Math.PI / 180)
    }))]
  }
};
const records = Object.fromEntries(ORDER.map(name => [name, { strokes: [], result: null, spent: 0 }]));
let currentScreen = 'menu';
let unlocked = ORDER.length - 1;
const completed = new Set((localStorage.getItem('astro-trazos-completed-v1') || '').split(',').filter(Boolean));
let activeStroke = null;
let pointerId = null;
let busy = false;
let runToken = 0;
let suppressClickUntil = 0;
let toastTimer = 0;
let heroCheerUntil = 0;
const layers = {};
const heroes = {};
let hintLayer = null;
const HERO_HOME = {
  level1: { x: 360, y: 780, scale: 1 },
  level2: { x: 232, y: 754, scale: .86 },
  salto: { x: 450, y: 500, scale: .66 },
  level3: { x: 418, y: 708, scale: .86 },
  level4: { x: 254, y: 564, scale: .82 },
  level5: { x: 338, y: 800, scale: .86 },
  level6: { x: 334, y: 654, scale: .86 }
};
const HERO_POSES = {
  idle: '/assets/nilo-explorador.png', walk: '/assets/nilo-camina.png',
  jump: '/assets/nilo-salta.png', build: '/assets/nilo-construye.png',
  cheer: '/assets/nilo-celebra.png'
};
const heroMotion = Object.fromEntries(Object.entries(HERO_HOME).map(([name, pose]) => [name, { ...pose }]));
const moveKeys = new Set();
let lastObstacleHint = 0;
const rayDefs = [
  { outer: 'ray-0-aura', core: 'ray-0-core', start: { x: 682, y: 296 }, end: { x: 1220, y: 640 } },
  { outer: 'ray-1-aura', core: 'ray-1-core', start: { x: 622, y: 479 }, end: { x: 1320, y: 479 } },
  { outer: 'ray-2-aura', core: 'ray-2-core', start: { x: 1156, y: 100 }, end: { x: 1156, y: 655 } }
];

function byId(id) { return document.getElementById(id); }
function svgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}
function setText(id, value) { const el = byId(id); if (el) el.textContent = value; }
function setAttr(id, key, value) { const el = byId(id); if (el) el.setAttribute(key, String(value)); }
function fmt(n) { return Number(n).toFixed(1); }
function point(evt, svg) {
  const p = svg.createSVGPoint();
  p.x = evt.clientX; p.y = evt.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
function inside(p, region) {
  return p.x >= region[0] && p.x <= region[2] && p.y >= region[1] && p.y <= region[3];
}
function linePath(points, closed = false) {
  if (!points.length) return '';
  return 'M ' + points.map(p => `${fmt(p.x)} ${fmt(p.y)}`).join(' L ') + (closed ? ' Z' : '');
}
const VIEWPORT = { xMin: 0, yMin: 0, xMax: 1920, yMax: 1080 };
function clippedLinePath(points, closed = false) {
  const edges = points.slice(1).map((p, i) => [points[i], p]);
  if (closed && distance(points[0], points.at(-1)) > .01) edges.push([points.at(-1), points[0]]);
  const clipped = edges.map(([a, b]) => clipLine(a, b, VIEWPORT));
  if (clipped.every((part, i) => part && distance(part[0], edges[i][0]) < .01 &&
    distance(part[1], edges[i][1]) < .01)) return linePath(points, closed);
  const commands = [];
  let previous = null;
  for (const part of clipped) {
    if (!part) { previous = null; continue; }
    if (!previous || distance(previous, part[0]) > .01) commands.push(`M ${fmt(part[0].x)} ${fmt(part[0].y)}`);
    commands.push(`L ${fmt(part[1].x)} ${fmt(part[1].y)}`);
    previous = part[1];
  }
  return commands.join(' ');
}

function hideHint() {
  hintLayer?.remove();
  hintLayer = null;
  const detail = byId('mission-hint-detail');
  if (detail) detail.hidden = true;
  const steps = byId('mission-steps');
  if (steps) steps.hidden = false;
  const button = byId('mission-hint');
  if (button) button.textContent = '💡 Ver ejemplo';
}

function toggleHint() {
  if (currentScreen === 'menu') return;
  if (hintLayer) { hideHint(); return; }
  const hint = HINTS[currentScreen];
  const group = svgElement('g', { id: 'construction-hint', 'pointer-events': 'none', 'aria-hidden': 'true' });
  heroes[currentScreen].parentNode.insertBefore(group, heroes[currentScreen]);
  hintLayer = group;
  byId('mission-hint-detail').textContent = hint.text;
  byId('mission-hint-detail').hidden = false;
  byId('mission-steps').hidden = true;
  byId('mission-hint').textContent = 'Ocultar ejemplo';
  let delay = 0;
  for (const [index, stroke] of hint.strokes.entries()) {
    const d = linePath(stroke);
    const outline = svgElement('path', { d, fill: 'none', stroke: '#132448', 'stroke-width': 18,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .85 });
    const path = svgElement('path', { d, fill: 'none', stroke: '#ffe582', 'stroke-width': 10,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'filter:drop-shadow(0 0 10px #ffd058)' });
    group.append(outline, path);
    const length = path.getTotalLength();
    for (const part of [outline, path]) {
      part.style.strokeDasharray = String(length);
      part.style.strokeDashoffset = String(length);
      part.animate([{ strokeDashoffset: String(length) }, { strokeDashoffset: '0' }],
        { duration: Math.max(650, Math.min(1800, length * 2.2)), delay, fill: 'forwards', easing: 'ease-in-out' });
    }
    const start = stroke[0];
    if (index === 0) {
      group.append(svgElement('circle', { cx: start.x, cy: start.y, r: 17,
        fill: '#ffe582', stroke: '#132448', 'stroke-width': 5 }));
    }
    delay += Math.max(650, Math.min(1800, length * 2.2)) + 180;
  }
}

// El pincel interpreta la intención geométrica al soltarlo. Conserva los
// extremos de los segmentos para que las marcas y las medidas sigan siendo
// controladas por el jugador, y regulariza los contornos cerrados.
function finishStroke(name, raw) {
  if (name === 'level3') return raw;
  const shape = recognizeStroke(raw);
  if (!shape) return raw;
  const mayClose = ['level5', 'level6'].includes(name);
  if (mayClose && shape.type !== 'line') {
    return [...shape.points, shape.points[0]];
  }
  if (shape.type === 'line' && lineDeviation(raw) <= 30) {
    return [raw[0], raw.at(-1)];
  }
  return simplifyRDP(raw, 6);
}

function setHero(name, x, y, scale = HERO_HOME[name].scale, tilt = 0) {
  const hero = heroes[name];
  if (hero) {
    const matrix = Mat3.multiply(Mat3.multiply(Mat3.translation(x, y),
      Mat3.rotation(tilt * Math.PI / 180)), Mat3.scale(scale, scale));
    hero.setAttribute('transform', `matrix(${matrix[0].toFixed(4)} ${matrix[3].toFixed(4)} ` +
      `${matrix[1].toFixed(4)} ${matrix[4].toFixed(4)} ${fmt(matrix[2])} ${fmt(matrix[5])})`);
  }
  heroMotion[name].x = x;
  heroMotion[name].y = y;
}
function setHeroPose(name, pose) {
  const hero = heroes[name];
  if (!hero || hero.dataset.pose === pose) return;
  hero.dataset.pose = pose;
  hero.querySelector('.nilo-body').setAttribute('href', HERO_POSES[pose] || HERO_POSES.idle);
}

function walkingGround(name, x, valid) {
  if (name === 'level1') {
    return HERO_HOME.level1.y;
  }
  if (name === 'salto') {
    if (!valid || x < 588) return HERO_HOME.salto.y;
    const end = records.salto.result.end;
    return 492 + (end.y - 492) * Math.min(1, Math.max(0, (x - 588) / (end.x - 588)));
  }
  if (name === 'level4') return HERO_HOME.level4.y;
  return HERO_HOME[name].y;
}

function moveHeroManually(dt) {
  if (currentScreen === 'menu' || busy || !heroes[currentScreen]) return;
  const direction = (moveKeys.has('ArrowRight') || moveKeys.has('d') ? 1 : 0) -
    (moveKeys.has('ArrowLeft') || moveKeys.has('a') ? 1 : 0);
  if (!direction) {
    if (!activeStroke && performance.now() > heroCheerUntil) setHeroPose(currentScreen, 'idle');
    return;
  }
  const name = currentScreen;
  const valid = Boolean(records[name].result?.valid);
  const limit = {
    level1: 555,
    level2: 520,
    salto: valid ? records.salto.result.end.x : 575,
    level3: 595,
    level4: 604,
    level5: 535,
    level6: 425
  }[name];
  const left = HERO_HOME[name].x - 80;
  const previous = heroMotion[name].x;
  const x = Math.max(left, Math.min(limit, previous + direction * 300 * dt));
  if (x === previous && direction > 0 && !valid && performance.now() - lastObstacleHint > 3200) {
    lastObstacleHint = performance.now();
    showToast('Nilo necesita una construcción válida para avanzar. Dibuja y pulsa Probar.');
  }
  setHero(name, x, walkingGround(name, x, valid), HERO_HOME[name].scale, direction * 4);
  setHeroPose(name, 'walk');
}

function makeHero(name, svg) {
  const home = HERO_HOME[name];
  const group = svgElement('g', { id: `nilo-${name}`, class: 'nilo-hero', 'data-pose': 'idle' });
  group.append(svgElement('ellipse', { class: 'nilo-shadow', cx: 0, cy: 1, rx: 76, ry: 12, fill: '#06172c', opacity: .42, 'pointer-events': 'none' }));
  const body = svgElement('image', { class: 'nilo-body', x: -108, y: -250, width: 216, height: 250,
    href: '/assets/nilo-explorador.png', preserveAspectRatio: 'xMidYMax meet' });
  group.append(body);
  group.style.cursor = 'pointer';
  group.setAttribute('role', 'button');
  group.setAttribute('aria-label', `Probar construcción con Nilo: ${LABEL[name]}`);
  group.addEventListener('click', playCurrent);
  svg.append(group);
  heroes[name] = group;
  setHero(name, home.x, home.y, home.scale);
}

function addConstructionPattern(svg) {
  const defs = svgElement('defs');
  const pattern = svgElement('pattern', { id: 'construction-hatch', width: 18, height: 18,
    patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(32)' });
  pattern.append(svgElement('rect', { width: 18, height: 18, fill: '#5ae8bb', opacity: .2 }));
  pattern.append(svgElement('line', { x1: 2, y1: 0, x2: 2, y2: 18,
    stroke: '#096e7f', 'stroke-width': 2, opacity: .6 }));
  defs.append(pattern);
  svg.insertBefore(defs, svg.firstChild);
}

function drawPath(layer, points, color, closed = false, fill = 'none', preview = false) {
  const d = linePath(points, closed);
  if (!d) return;
  const visibleStroke = clippedLinePath(points, closed);
  const group = svgElement('g', { 'pointer-events': 'none', class: preview ? 'construction-preview' : 'construction-solid' });
  if (closed && fill !== 'none') {
    group.append(svgElement('path', { d, fill, opacity: .56, stroke: 'none' }));
    group.append(svgElement('path', { d, fill: 'url(#construction-hatch)', opacity: .55, stroke: 'none' }));
  }
  if (preview) {
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: '#ffffff', 'stroke-width': 21,
      'stroke-dasharray': '8 9', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .4 }));
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: '#43e7ff', 'stroke-width': 8,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .9 }));
  } else {
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: '#061637', 'stroke-width': 30,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .84 }));
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: '#075bb7', 'stroke-width': 23,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', style: 'filter:drop-shadow(0 0 9px #38deff)' }));
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: color, 'stroke-width': 16,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    group.append(svgElement('path', { d: visibleStroke, fill: 'none', stroke: '#dffaff', 'stroke-width': 3,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .95 }));
    for (const p of [points[0], points.at(-1)]) {
      group.append(svgElement('circle', { cx: fmt(p.x), cy: fmt(p.y), r: 11, fill: '#dffaff',
        stroke: '#075bb7', 'stroke-width': 5 }));
      group.append(svgElement('circle', { cx: fmt(p.x), cy: fmt(p.y), r: 3, fill: '#092d66' }));
    }
  }
  layer.append(group);
}

function drawArrow(layer, points, preview = false) {
  drawPath(layer, points, '#36d7ff', false, 'none', preview);
  if (points.length < 2) return;
  const a = points[0], b = points.at(-1);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const size = preview ? 27 : 37;
  const wing = 19;
  const tip = svgElement('polygon', { points: `${fmt(b.x)},${fmt(b.y)} ${fmt(b.x - size * Math.cos(angle) + wing * Math.sin(angle))},${fmt(b.y - size * Math.sin(angle) - wing * Math.cos(angle))} ${fmt(b.x - size * Math.cos(angle) - wing * Math.sin(angle))},${fmt(b.y - size * Math.sin(angle) + wing * Math.cos(angle))}`,
    fill: preview ? '#8dedfa' : '#e8fbff', stroke: '#075bb7', 'stroke-width': 5, 'pointer-events': 'none' });
  layer.append(tip);
}

function weightBounds(points) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function drawWeightDimensions(layer) {
  const live = currentScreen === 'level3' && activeStroke?.length > 1 ? activeStroke : null;
  const measure = live ? null : records.level3.result?.measure;
  if (!live && !measure) return;
  let corners, base, height;
  if (live) {
    const box = weightBounds(live);
    if (box.right - box.left < 28 || box.bottom - box.top < 28) return;
    corners = [
      { x: box.left, y: box.top }, { x: box.right, y: box.top },
      { x: box.right, y: box.bottom }, { x: box.left, y: box.bottom }
    ];
    base = (box.right - box.left) / 6;
    height = (box.bottom - box.top) / 6;
  } else ({ corners, base, height } = measure);
  const group = svgElement('g', { id: 'weight-dimensions', 'pointer-events': 'none', opacity: live ? .85 : 1 });
  const center = { x: corners.reduce((sum, p) => sum + p.x, 0) / 4,
    y: corners.reduce((sum, p) => sum + p.y, 0) / 4 };
  const midpoint = ([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const baseEdge = [[corners[0], corners[1]], [corners[2], corners[3]]]
    .sort((a, b) => midpoint(b).y - midpoint(a).y)[0];
  const heightEdge = [[corners[1], corners[2]], [corners[3], corners[0]]]
    .sort((a, b) => midpoint(b).x - midpoint(a).x)[0];
  for (const [edge, label] of [[baseEdge, `base ${Math.round(base)} u`], [heightEdge, `altura ${Math.round(height)} u`]]) {
    const [a, b] = edge;
    const length = distance(a, b);
    let normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    const mid = midpoint(edge);
    if (normal.x * (mid.x - center.x) + normal.y * (mid.y - center.y) < 0)
      normal = { x: -normal.x, y: -normal.y };
    const offset = 36;
    const start = { x: a.x + normal.x * offset, y: a.y + normal.y * offset };
    const end = { x: b.x + normal.x * offset, y: b.y + normal.y * offset };
    for (const point of [a, b]) group.append(svgElement('line', {
      x1: point.x, y1: point.y, x2: point.x + normal.x * (offset + 8), y2: point.y + normal.y * (offset + 8),
      stroke: '#fff5cc', 'stroke-width': 3, 'stroke-dasharray': '5 5'
    }));
    group.append(svgElement('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y,
      stroke: '#142b4d', 'stroke-width': 10, 'stroke-linecap': 'round' }));
    group.append(svgElement('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y,
      stroke: '#ffe284', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    const text = svgElement('text', { x: mid.x + normal.x * (offset + 26),
      y: mid.y + normal.y * (offset + 26), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: '#fff2bf', stroke: '#142b4d', 'stroke-width': 7, 'paint-order': 'stroke',
      'font-size': 27, 'font-weight': 900 });
    text.textContent = label;
    group.append(text);
  }
  layer.append(group);
}

function renderBrush(name) {
  const layer = layers[name];
  if (!layer) return;
  layer.replaceChildren();
  if (name === 'level2') drawTrajectoryPreview(layer, activeStroke && currentScreen === name ? activeStroke : records.level2.strokes.at(-1));
  if (name === 'salto') drawJumpPreview(layer, activeStroke && currentScreen === name ? activeStroke : records.salto.strokes.at(-1));
  if (name === 'level3' && records.level3.result?.valid) {
    layer.append(svgElement('path', { d: linePath(records.level3.result.points, true),
      fill: '#6ef5a6', opacity: .44, stroke: 'none', 'pointer-events': 'none' }));
  }
  for (const stroke of records[name].strokes) {
    const closed = ['level3', 'level5', 'level6'].includes(name) && distance(stroke[0], stroke.at(-1)) < 50;
    const color = name === 'level3' && records[name].result?.valid ? '#75f0a2' : '#38dfff';
    if (name === 'level2') drawArrow(layer, stroke);
    else drawPath(layer, stroke, color, closed, name === 'level3' && closed ? '#75e99e' : 'none');
  }
  if (activeStroke && currentScreen === name) {
    if (name === 'level2') drawArrow(layer, activeStroke, true);
    else drawPath(layer, activeStroke, '#83e7ff', false, 'none', true);
  }
  if (name === 'level3') drawWeightDimensions(layer);
  if (name === 'level1') {
    const guide = byId('level1-guide-line');
    if (guide) guide.style.opacity = records.level1.strokes.length || activeStroke ? '0' : '.72';
    if (records.level1.strokes.length) {
      const p = records.level1.strokes[0].at(-1);
      const elbow = svgElement('g', { class: 'route-elbow', 'pointer-events': 'none' });
      elbow.append(svgElement('circle', { cx: p.x, cy: p.y, r: 26, fill: '#fbd16a', stroke: '#142747', 'stroke-width': 6 }));
      const mark = svgElement('text', { x: p.x, y: p.y + 9, 'text-anchor': 'middle', 'font-size': 25, 'font-weight': 900, fill: '#142747' });
      mark.textContent = '★'; elbow.append(mark); layer.append(elbow);
    }
  }
}

function usedInk(name) {
  return records[name].strokes.reduce((sum, stroke) => sum + pathLength(stroke), 0);
}
function updateInk(name) {
  const pending = currentScreen === name && activeStroke ? pathLength(activeStroke) : 0;
  const remaining = Math.max(0, CONFIG[name].ink - usedInk(name) - pending);
  const pct = Math.round(100 * remaining / CONFIG[name].ink);
  if (name === 'salto') {
    setText('salto-top-ink-text', `✦ ${pct} / 100`);
    setText('salto-card-ink-text', `Tinta restante: ${pct}%`);
    setAttr('salto-top-ink-bar', 'width', Math.round(212 * remaining / CONFIG[name].ink));
  }
  if (name === 'level3') {
    setText('l3-ink-pct', `${pct}%`);
    setAttr('l3-ink-bar', 'width', Math.round(140 * remaining / CONFIG[name].ink));
  }
  if (name === 'level4') {
    setText('ink-counter-text', `${fmt(20 * remaining / CONFIG[name].ink)} / 20 u`);
    setAttr('ink-bar-fill', 'width', Math.round(400 * remaining / CONFIG[name].ink));
    setAttr('ink-bar-gloss', 'width', Math.round(390 * remaining / CONFIG[name].ink));
  }
  const badge = byId('brush-status');
  if (badge && currentScreen === name) badge.querySelector('.brush-ink').textContent = `Tinta ${pct}%`;
  if (currentScreen === name) {
    byId('mission-ink-fill').style.width = `${pct}%`;
    byId('mission-ink-pct').textContent = `${pct}%`;
    byId('mission-ink-track').setAttribute('aria-valuenow', String(pct));
  }
}

function evaluateLevel1() {
  const result = evaluateRoute(records.level1.strokes);
  if (currentScreen === 'level1') {
    setText('mission-guide-title', result.valid ? 'Ruta lista · 2/2' : result.stage === 0 ? 'Construye · 1/2' : 'Construye · 2/2');
    byId('mission-guide').dataset.stage = String(result.stage);
  }
  if (result.valid) {
    const { first, second } = result;
    setText('l1-formula-text', `c₁ = ${fmt(first.straight / 80)} u · c₂ = ${fmt(second.straight / 80)} u · total = ${fmt(result.totalInk / 80)} u`);
  }
  return result;
}

function ballistic(stroke) {
  const a = stroke[0], b = stroke.at(-1);
  const vx = (b.x - a.x) * 2.7;
  const vy = (b.y - a.y) * 3.5;
  const gravity = 1450;
  const atPyramid = (880 - a.x) / vx;
  const yPyramid = a.y + vy * atPyramid + 0.5 * gravity * atPyramid ** 2;
  const landingTime = -2 * vy / gravity;
  const landingX = a.x + vx * landingTime;
  return { vx, vy, gravity, yPyramid, landingX, landingTime };
}
function drawTrajectoryPreview(layer, stroke) {
  if (!stroke || stroke.length < 2) return;
  const a = stroke[0];
  const f = ballistic(stroke);
  if (distance(a, { x: 360, y: 720 }) > 48 || f.vx <= 0 || f.vy >= 0 || f.landingTime <= 0) return;
  const time = Math.min(f.landingTime, 1.8);
  const samples = Array.from({ length: 34 }, (_, i) => {
    const t = time * i / 33;
    return { x: a.x + f.vx * t, y: a.y + f.vy * t + .5 * f.gravity * t * t };
  });
  const safe = f.yPyramid < 300 && f.landingX >= 1410 && f.landingX <= 1810;
  const color = safe ? '#9bffbc' : '#ffcc6b';
  const preview = svgElement('g', { class: 'trajectory-preview', 'pointer-events': 'none' });
  preview.append(svgElement('path', { d: linePath(samples), fill: 'none', stroke: '#10294d', 'stroke-width': 11,
    'stroke-linecap': 'round', 'stroke-dasharray': '6 18', opacity: .85 }));
  preview.append(svgElement('path', { d: linePath(samples), fill: 'none', stroke: color, 'stroke-width': 5,
    'stroke-linecap': 'round', 'stroke-dasharray': '6 18', opacity: .95 }));
  if (Number.isFinite(f.landingX) && f.landingX > 50 && f.landingX < 1950) {
    preview.append(svgElement('circle', { cx: fmt(f.landingX), cy: fmt(a.y), r: 24,
      fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-dasharray': '9 5' }));
    const label = svgElement('text', { x: fmt(f.landingX), y: fmt(a.y + 54), 'text-anchor': 'middle',
      fill: color, stroke: '#10294d', 'stroke-width': 6, 'paint-order': 'stroke', 'font-size': 26, 'font-weight': 900 });
    label.textContent = 'caída prevista'; preview.append(label);
  }
  layer.append(preview);
}
function evaluateLevel2(stroke) {
  if (!stroke || stroke.length < 2) return { valid: false, message: 'Dibuja el vector de impulso desde el lanzador.' };
  const a = stroke[0];
  const f = ballistic(stroke);
  const angle = Math.atan2(-f.vy, f.vx) * 180 / Math.PI;
  setText('l2-vector-text', `Fx = ${Math.round(f.vx)} · Fy = ${Math.round(-f.vy)} · ángulo = ${Math.round(angle)}°`);
  const valid = distance(a, { x: 360, y: 720 }) < 48 && f.vx > 450 && f.vy < -600 &&
    f.yPyramid < 300 && f.landingX >= 1410 && f.landingX <= 1810 && lineDeviation(stroke) < 35;
  let message = 'Ajusta el vector: la trayectoria debe pasar sobre la pirámide y aterrizar al otro lado.';
  if (f.yPyramid >= 300) message = 'El impulso vertical es pequeño: la nave tocaría la pirámide. Traza más arriba.';
  else if (f.landingX < 1410) message = 'Falta impulso horizontal: la nave cae antes de la zona de aterrizaje.';
  else if (f.landingX > 1810) message = 'Demasiado impulso horizontal: la nave supera la zona de aterrizaje.';
  if (valid) message = 'Vector calibrado. Pulsa Lanzar para ver la parábola real.';
  return { valid, message, physics: f };
}

function evaluateSalto(stroke) {
  if (!stroke || stroke.length < 2) return { valid: false, message: 'Dibuja con el pincel una rampa desde el borde izquierdo.' };
  const a = stroke[0], b = stroke.at(-1);
  const angle = Math.atan2(a.y - b.y, b.x - a.x) * 180 / Math.PI;
  const rampLength = distance(a, b);
  const jump = jumpPrediction(b, angle);
  const valid = distance(a, { x: 588, y: 492 }) < 58 && b.x >= 1020 && b.x <= 1180 &&
    angle >= 18 && angle <= 30 && lineDeviation(stroke) < 38 && rampLength <= CONFIG.salto.ink;
  setText('salto-floating-angle-text', `${Math.round(angle)}°`);
  setText('salto-card-angle-text', `Ángulo: ${Math.round(angle)}°`);
  let message = 'La rampa debe salir del borde izquierdo, subir entre 18° y 30° y llegar cerca de la isla.';
  if (angle < 18) message = `Ángulo ${Math.round(angle)}°: la rampa queda baja. Eleva el extremo derecho.`;
  if (angle > 30) message = `Ángulo ${Math.round(angle)}°: la rampa queda empinada. Baja el extremo derecho.`;
  if (valid) message = jump.landingX < 1175 ? `Rampa de ${Math.round(angle)}°: Nilo caería antes de la isla. Ajusta el salto.` :
    jump.landingX > 1670 ? `Rampa de ${Math.round(angle)}°: Nilo pasaría de largo. Ajusta el salto.` :
    `Rampa de ${Math.round(angle)}°. La caída prevista llega a la isla; ¡prueba el salto!`;
  return { valid, message, angle, start: a, end: b, jump };
}

function jumpPrediction(end, angle) {
  const radians = angle * Math.PI / 180;
  const vx = 450 * Math.cos(radians), vy = -450 * Math.sin(radians), gravity = 900;
  const flight = (-vy + Math.sqrt(vy * vy + 2 * gravity * (550 - end.y))) / gravity;
  return { vx, vy, gravity, flight, landingX: end.x + vx * flight };
}

function drawJumpPreview(layer, stroke) {
  if (!stroke || stroke.length < 2) return;
  const a = stroke[0], end = stroke.at(-1);
  if (distance(a, { x: 588, y: 492 }) > 58 || end.x <= a.x + 80) return;
  const angle = Math.atan2(a.y - end.y, end.x - a.x) * 180 / Math.PI;
  if (angle < 5 || angle > 45) return;
  const jump = jumpPrediction(end, angle);
  if (!Number.isFinite(jump.flight) || jump.flight <= 0) return;
  const samples = Array.from({ length: 28 }, (_, i) => {
    const t = jump.flight * i / 27;
    return { x: end.x + jump.vx * t, y: end.y + jump.vy * t + .5 * jump.gravity * t * t };
  });
  const safe = jump.landingX >= 1175 && jump.landingX <= 1670;
  const color = safe ? '#9bffbc' : '#ffcc6b';
  const preview = svgElement('g', { class: 'jump-preview', 'pointer-events': 'none' });
  preview.append(svgElement('path', { d: linePath(samples), fill: 'none', stroke: '#10294d', 'stroke-width': 11,
    'stroke-linecap': 'round', 'stroke-dasharray': '7 19' }));
  preview.append(svgElement('path', { d: linePath(samples), fill: 'none', stroke: color, 'stroke-width': 5,
    'stroke-linecap': 'round', 'stroke-dasharray': '7 19' }));
  if (jump.landingX < 1900) preview.append(svgElement('circle', { cx: fmt(jump.landingX), cy: 550, r: 19,
    fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-dasharray': '8 5' }));
  layer.append(preview);
}

function evaluateWeight(strokes) {
  if (!strokes.length) {
    setText('live-area-value', '0');
    setAttr('weight-gate-light', 'opacity', '0');
    setAttr('weight-scale-light', 'opacity', '0');
    return { valid: false, message: 'Arrastra entre dos esquinas para crear el rectángulo. Base × altura = área.' };
  }
  const stroke = [...strokes[0]];
  let connected = true;
  for (const part of strokes.slice(1)) {
    if (distance(stroke.at(-1), part[0]) < 50) stroke.push(...part.slice(1));
    else if (distance(stroke.at(-1), part.at(-1)) < 50) stroke.push(...[...part].reverse().slice(1));
    else connected = false;
  }
  if (stroke.length < 4) return { valid: false, message: 'Continúa el contorno hasta cerrar la figura.' };
  const closed = connected && distance(stroke[0], stroke.at(-1)) < 48;
  const points = closed ? [...stroke, stroke[0]] : stroke;
  // En esta escena 1 unidad equivale a 6 píxeles SVG: 1 u² = 36 px².
  const measure = closed ? rectangleMetrics(points) : null;
  const area = Math.round(measure ? measure.area : polygonArea(points) / 36);
  setText('live-area-value', String(area));
  const needleAngle = Math.max(-58, Math.min(58, ((area - 1200) / 500) * 48));
  setAttr('scale-gauge-needle', 'transform', `rotate(${fmt(needleAngle)} 0 -22)`);
  setAttr('weight-needle-live', 'transform', `rotate(${fmt(needleAngle)} 958 784)`);
  setAttr('scale-platform-movable', 'transform', `translate(0, ${fmt(Math.max(-8, Math.min(14, (area - 1200) / 35)))})`);
  const coarse = strokes.length > 1
    ? [strokes[0][0], ...strokes.map(part => part.at(-1))]
    : simplifyRDP(stroke, 16);
  if (coarse.length > 2) coarse[coarse.length - 1] = coarse[0];
  const crossed = closed && hasSelfIntersection(coarse);
  const valid = Boolean(measure) && !crossed && area === 1200;
  setAttr('weight-status-circle', 'fill', valid ? '#15803d' : !measure || area < 1200 ? '#d97706' : '#dc2626');
  setText('weight-status-line1', valid ? '¡Peso' : !closed ? 'Cierra' : !measure ? 'Cuatro' : 'Muy');
  setText('weight-status-line2', valid ? 'correcto!' : !closed ? 'la figura' : !measure ? 'lados' : area < 1200 ? 'liviano' : 'pesado');
  byId('poly-success-ticks').style.opacity = valid ? '1' : '0.15';
  byId('fortress-green-beam').style.opacity = valid ? '1' : '0.15';
  setAttr('gate-door-left', 'transform', valid ? 'translate(0, 0)' : 'translate(22, 0)');
  setAttr('gate-door-right', 'transform', valid ? 'translate(0, 0)' : 'translate(-22, 0)');
  const gateLight = byId('weight-gate-light');
  const scaleLight = byId('weight-scale-light');
  if (gateLight) gateLight.setAttribute('opacity', valid ? '.72' : '0');
  if (scaleLight) scaleLight.setAttribute('opacity', valid ? '.75' : '0');
  const equation = measure ? `${Math.round(measure.base)} u × ${Math.round(measure.height)} u = ${area} u²` : '';
  let message = !connected ? 'Los lados deben tocarse. Deshaz el último y únelo al contorno.' :
    !closed ? 'Cierra el contorno: vuelve con el pincel al punto donde comenzaste.' :
    crossed ? 'El contorno se cruza. Dibuja una figura simple para medir su área.' :
    !measure ? 'La balanza necesita un rectángulo para calcular base × altura.' :
    area < 1200 ? `${equation}. Falta superficie para llegar a 1200 u².` :
    area > 1200 ? `${equation}. Sobra superficie para llegar a 1200 u².` :
    `${equation}. La balanza está equilibrada.`;
  return { valid, message, area, points, measure };
}

function updateLasers(paths) {
  let blocked = 0;
  rayDefs.forEach((ray, index) => {
    const hit = firstPathIntersection(ray.start, ray.end, paths);
    if (hit) blocked++;
    const end = hit || ray.end;
    for (const id of [ray.outer, ray.core, `ray-${index}-hot`, `ray-${index}-stream`]) {
      setAttr(id, 'x2', fmt(end.x)); setAttr(id, 'y2', fmt(end.y));
    }
    const spark = byId(`ray-${index}-spark`);
    spark.setAttribute('transform', `translate(${fmt(end.x)} ${fmt(end.y)})`);
    spark.style.opacity = hit ? '1' : '0';
  });
  const status = byId('brush-status');
  if (status && currentScreen === 'level4') status.querySelector('.brush-feedback').textContent = `${blocked} / 3 rayos bloqueados`;
  return blocked;
}

function setupLasers() {
  byId('laserBeamsLayer').style.display = 'none';
  const svg = byId('scene-svg');
  const layer = svgElement('g', { id: 'laser-effects', 'pointer-events': 'none' });
  rayDefs.forEach((ray, index) => {
    const beam = svgElement('g', { class: 'laser-beam' });
    beam.append(svgElement('line', { id: ray.outer, x1: ray.start.x, y1: ray.start.y,
      x2: ray.end.x, y2: ray.end.y, stroke: '#f51e3f', 'stroke-width': 30,
      'stroke-linecap': 'round', opacity: .82, style: 'filter:blur(8px)' }));
    beam.append(svgElement('line', { id: `ray-${index}-hot`, x1: ray.start.x, y1: ray.start.y,
      x2: ray.end.x, y2: ray.end.y, stroke: '#ff3857', 'stroke-width': 11,
      'stroke-linecap': 'round', class: 'laser-hot' }));
    beam.append(svgElement('line', { id: ray.core, x1: ray.start.x, y1: ray.start.y,
      x2: ray.end.x, y2: ray.end.y, stroke: '#fff4d5', 'stroke-width': 3.5,
      'stroke-linecap': 'round' }));
    beam.append(svgElement('line', { id: `ray-${index}-stream`, x1: ray.start.x, y1: ray.start.y,
      x2: ray.end.x, y2: ray.end.y, stroke: '#ffb4af', 'stroke-width': 3,
      'stroke-linecap': 'round', 'stroke-dasharray': '3 24', class: 'laser-stream' }));
    const emitter = svgElement('g', { transform: `translate(${ray.start.x} ${ray.start.y})`, class: 'laser-emitter' });
    emitter.append(svgElement('circle', { r: 27, fill: '#263246', stroke: '#101626', 'stroke-width': 7 }));
    emitter.append(svgElement('circle', { r: 16, fill: '#752236', stroke: '#d6847e', 'stroke-width': 4 }));
    emitter.append(svgElement('circle', { r: 9, fill: '#ff9c93', class: 'emitter-core' }));
    beam.append(emitter);
    const spark = svgElement('g', { id: `ray-${index}-spark`, class: 'laser-spark', opacity: 0 });
    spark.append(svgElement('circle', { r: 22, fill: '#ff7761', opacity: .25 }));
    spark.append(svgElement('circle', { r: 8, fill: '#fff3ce' }));
    for (let j = 0; j < 8; j++) {
      const angle = j * Math.PI / 4;
      spark.append(svgElement('line', { x1: fmt(13 * Math.cos(angle)), y1: fmt(13 * Math.sin(angle)),
        x2: fmt(27 * Math.cos(angle)), y2: fmt(27 * Math.sin(angle)),
        stroke: '#ffbd6f', 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
    }
    beam.append(spark);
    layer.append(beam);
  });
  svg.append(layer);
}
function evaluateLasers(strokes) {
  const blocked = updateLasers(strokes);
  const valid = blocked === rayDefs.length;
  return { valid, message: valid ? 'Los tres rayos chocan con tus trazos. Pulsa Probar defensa.' :
    `${blocked} de 3 rayos bloqueados. Cruza cada rayo rojo con un trazo azul.`, blocked };
}

const hexagon = Array.from({ length: 6 }, (_, i) => ({
  x: 960 + 305 * Math.cos((-90 + i * 60) * Math.PI / 180),
  y: 435 + 305 * Math.sin((-90 + i * 60) * Math.PI / 180)
}));
function evaluateHexagon(strokes) {
  const edges = new Set();
  let malformed = 0;
  for (const stroke of strokes) {
    const nearest = p => hexagon.map((v, i) => ({ i, d: distance(p, v) })).sort((a, b) => a.d - b.d)[0];
    const closed = stroke.length >= 7 && distance(stroke[0], stroke.at(-1)) < 35;
    const segments = closed ? stroke.slice(0, -1).map((p, i) => [p, stroke[i + 1]]) : [[stroke[0], stroke.at(-1)]];
    for (const [start, end] of segments) {
      const a = nearest(start), b = nearest(end);
      if (a.d >= 50 || b.d >= 50 || a.i === b.i || ![1, 5].includes(Math.abs(a.i - b.i)) ||
        (!closed && lineDeviation(stroke) > 32)) {
        malformed++;
        continue;
      }
      edges.add([a.i, b.i].sort().join('-'));
    }
  }
  const valid = edges.size === 6;
  setText('l5-poly-info', valid ? '6 lados unidos · ángulos interiores ≈ 120° · escudo listo' :
    `${edges.size} / 6 lados construidos · une estrellas vecinas con trazos rectos`);
  return { valid, message: valid ? 'Hexágono construido: seis lados y ángulos cercanos a 120°. Activa el escudo.' :
    malformed ? `${edges.size} / 6 lados. Algún trazo no une dos estrellas vecinas o no es recto; deshaz y repítelo.` :
    `${edges.size} / 6 lados. Traza cada lado entre dos estrellas vecinas.`, edges: edges.size };
}

function evaluateOrbit(strokes) {
  if (!strokes.length) return { valid: false, message: 'Traza la órbita siguiendo las ocho marcas alrededor del núcleo.' };
  const stroke = [...strokes[0]];
  let connected = true;
  for (const part of strokes.slice(1)) {
    if (distance(stroke.at(-1), part[0]) < 58) stroke.push(...part.slice(1));
    else if (distance(stroke.at(-1), part.at(-1)) < 58) stroke.push(...[...part].reverse().slice(1));
    else connected = false;
  }
  if (stroke.length < 15) return { valid: false, message: 'Continúa uniendo las marcas para cerrar la órbita.' };
  const closed = connected && distance(stroke[0], stroke.at(-1)) < 58;
  const radii = stroke.map(p => distance(p, { x: 960, y: 480 }));
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  const deviation = Math.sqrt(radii.reduce((a, r) => a + (r - mean) ** 2, 0) / radii.length);
  const sectors = new Set(stroke.map(p => Math.floor(((Math.atan2(p.y - 480, p.x - 960) + Math.PI) / (2 * Math.PI)) * 12) % 12));
  const circumference = pathLength(stroke) / 10;
  const valid = closed && sectors.size === 12 && mean >= 223 && mean <= 257 && deviation <= 21 &&
    Math.abs(circumference - 2 * Math.PI * mean / 10) < 22;
  const note = byId('orbit-live-text');
  if (note) note.textContent = `Radio ${fmt(mean / 10)} u · perímetro ${fmt(circumference)} u`;
  return { valid, message: valid ? `Órbita estable: C ≈ ${fmt(circumference)} u. Pulsa Reparar nave.` :
    !connected ? 'Las secciones de la órbita deben tocarse. Deshaz el último tramo y vuelve a unirlas.' :
    !closed ? 'Sigue las marcas hasta volver al punto de partida y cerrar la órbita.' :
    `Órbita inestable: radio ${fmt(mean / 10)} u. Acerca el trazo a las marcas circulares.`, radius: mean };
}

function evaluate(name, announce = false) {
  const r = records[name];
  const stroke = r.strokes.at(-1);
  if (name === 'level1') r.result = evaluateLevel1();
  if (name === 'level2') r.result = evaluateLevel2(stroke);
  if (name === 'salto') r.result = evaluateSalto(stroke);
  if (name === 'level3') r.result = evaluateWeight(r.strokes);
  if (name === 'level4') r.result = evaluateLasers(r.strokes);
  if (name === 'level5') r.result = evaluateHexagon(r.strokes);
  if (name === 'level6') r.result = evaluateOrbit(r.strokes);
  const status = byId('brush-status');
  if (status && currentScreen === name && name !== 'level4') status.querySelector('.brush-feedback').textContent = r.result.message;
  if (name === 'level3') renderBrush(name);
  updateInk(name);
  if (announce) showToast(r.result.message);
  return r.result;
}

function beginBrush(evt, name, svg) {
  if (currentScreen !== name || busy || pointerId !== null) return;
  if (evt.target.closest('.hud-btn, .menu-btn, .level-card, .nilo-hero')) return;
  const p = snapPoint(name, point(evt, svg));
  if (!inside(p, CONFIG[name].region)) return;
  if (name !== 'level3') hideHint();
  if (name === 'level1' && records.level1.strokes.length >= 2) {
    showToast('La ruta tiene dos tramos. Deshaz el último o reinicia para construir otra.');
    return;
  }
  if ((name === 'level3' || !['level1', 'level4', 'level5', 'level6'].includes(name)) && records[name].strokes.length) {
    records[name].strokes = [];
    evaluate(name);
  }
  const remaining = CONFIG[name].ink - usedInk(name);
  if (remaining < 25) { showToast('Se acabó la tinta. Deshaz o reinicia el nivel.'); return; }
  pointerId = evt.pointerId;
  activeStroke = [{ x: p.x, y: p.y }];
  setHeroPose(name, 'build');
  svg.setPointerCapture(evt.pointerId);
  evt.preventDefault();
  renderBrush(name);
}
function moveBrush(evt, name, svg) {
  if (pointerId !== evt.pointerId || !activeStroke || currentScreen !== name) return;
  if (name === 'level3') {
    activeStroke = rectangleFromDrag(activeStroke[0], point(evt, svg), CONFIG.level3.region, CONFIG.level3.ink);
    renderBrush(name);
    updateInk(name);
    const box = weightBounds(activeStroke);
    const base = (box.right - box.left) / 6;
    const height = (box.bottom - box.top) / 6;
    const area = base * height;
    byId('brush-status').querySelector('.brush-feedback').textContent =
      `Base ${base} u × altura ${height} u = ${area} u² · objetivo 1200 u²`;
    setText('live-area-value', String(area));
    const needleAngle = Math.max(-58, Math.min(58, ((area - 1200) / 500) * 48));
    setAttr('scale-gauge-needle', 'transform', `rotate(${fmt(needleAngle)} 0 -22)`);
    setAttr('weight-needle-live', 'transform', `rotate(${fmt(needleAngle)} 958 784)`);
    return;
  }
  const p = snapPoint(name, point(evt, svg));
  if (!inside(p, CONFIG[name].region)) return;
  if (distance(activeStroke.at(-1), p) < 4) return;
  const permitted = CONFIG[name].ink - usedInk(name);
  if (pathLength(activeStroke) + distance(activeStroke.at(-1), p) > permitted) return;
  activeStroke.push({ x: p.x, y: p.y });
  renderBrush(name);
  updateInk(name);
  const live = byId('brush-status').querySelector('.brush-feedback');
  if (name === 'level1') {
    const a = activeStroke[0], b = activeStroke.at(-1);
    const angle = Math.abs(Math.atan2(a.y - b.y, b.x - a.x) * 180 / Math.PI);
    live.textContent = `Tramo ${records.level1.strokes.length + 1}/2 · ${Math.round(angle)}° de ${ROUTE_MAX_ANGLE}° máximos · ${fmt(pathLength(activeStroke) / 80)} u de tinta.`;
  }
  if (name === 'level2' || name === 'salto') {
    const a = activeStroke[0], b = activeStroke.at(-1);
    live.textContent = `${name === 'salto' ? 'Rampa' : 'Vector'}: ${Math.round(Math.atan2(a.y - b.y, b.x - a.x) * 180 / Math.PI)}° · ${fmt(pathLength(activeStroke) / 80)} u`;
  }
  if (name === 'level4') updateLasers([...records.level4.strokes, activeStroke]);
}
function endBrush(evt, name) {
  if (pointerId !== evt.pointerId || !activeStroke) return;
  const stroke = activeStroke;
  pointerId = null;
  activeStroke = null;
  setHeroPose(name, 'idle');
  suppressClickUntil = performance.now() + 350;
  const box = name === 'level3' ? weightBounds(stroke) : null;
  const constructed = name === 'level3'
    ? box.right - box.left >= 30 && box.bottom - box.top >= 30
    : pathLength(stroke) >= 28;
  if (constructed) records[name].strokes.push(finishStroke(name, stroke));
  renderBrush(name);
  evaluate(name);
  if (constructed) playCurrent();
}

function guidePoints(name) {
  if (name === 'level1') return [ROUTE_START, ROUTE_GOAL, ...(records.level1.strokes.length ? [records.level1.strokes[0].at(-1)] : [])];
  if (name === 'level2') return [{ x: 360, y: 720 }];
  if (name === 'salto') return [{ x: 588, y: 492 }];
  if (name === 'level5') return hexagon;
  if (name === 'level6') return Array.from({ length: 8 }, (_, i) => ({
    x: 960 + 240 * Math.cos((-90 + i * 45) * Math.PI / 180),
    y: 480 + 240 * Math.sin((-90 + i * 45) * Math.PI / 180)
  }));
  return [];
}

function snapPoint(name, p) {
  const nearby = guidePoints(name).find(guide => distance(p, guide) <= (name === 'level1' ? 32 : 18));
  return nearby || p;
}

function showToast(message) {
  const box = byId('toast-msg');
  setText('toast-text', message);
  box.classList.remove('opacity-0', '-translate-y-2');
  box.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    box.classList.remove('opacity-100', 'translate-y-0');
    box.classList.add('opacity-0', '-translate-y-2');
  }, 3500);
}
function togglePauseModal(show) { byId('pause-modal').classList.toggle('hidden', !show); }
function toggleVictoryModal(show) { byId('victory-modal').classList.toggle('hidden', !show); }

function updateMenu() {
  const sixthStars = document.querySelector('.menu-sixth-stars');
  if (sixthStars) sixthStars.textContent = '★★★';
  const cards = [...document.querySelectorAll('#levelsParchmentGroup .level-card')];
  cards.forEach((card, i) => {
    const stageIndex = ORDER.indexOf(MENU_ORDER[i]);
    card.style.opacity = stageIndex <= unlocked ? '1' : '0.68';
    card.style.filter = stageIndex <= unlocked ? '' : 'saturate(.45)';
    card.setAttribute('aria-label', stageIndex <= unlocked ? `Abrir nivel ${i + 1}: ${LABEL[MENU_ORDER[i]]}` : `Nivel ${i + 1} bloqueado`);
    card.querySelectorAll('use[href="#goldStarCard"]').forEach(star => star.style.opacity = completed.has(MENU_ORDER[i]) ? '1' : '0.22');
  });
  document.querySelectorAll('.menu-lock').forEach((lock, i) => {
    lock.style.display = ORDER.indexOf(MENU_ORDER[i + 1]) > unlocked ? 'grid' : 'none';
  });
  document.querySelectorAll('.menu-level-hit').forEach((hit, i) => {
    hit.setAttribute('aria-label', ORDER.indexOf(MENU_ORDER[i]) <= unlocked ? `Nivel ${i + 1}: ${LABEL[MENU_ORDER[i]]}` : `Nivel ${i + 1} bloqueado`);
  });
}
function switchToScreen(target) {
  hideHint();
  byId('level-picker')?.classList.add('hidden');
  if (target === 'menu') {
    runToken++; busy = false;
  } else {
    const index = ORDER.indexOf(target);
    if (index < 0) target = 'menu';
    else if (index > unlocked && document.querySelector('.quick-switcher').style.display === 'none') {
      showToast(`Completa ${LABEL[ORDER[unlocked]]} para abrir este nivel.`); return;
    }
  }
  pointerId = null; activeStroke = null;
  togglePauseModal(false); toggleVictoryModal(false); toggleOptionsModal(false);
  byId('mission-result').hidden = true;
  currentScreen = target;
  byId('game-stage').dataset.screen = target;
  for (const screen of ['menu', ...ORDER]) {
    byId(`screen-${screen}`).classList.toggle('screen-active', screen === target);
    byId(`screen-${screen}`).classList.toggle('screen-hidden', screen !== target);
  }
  // El lienzo transparente vive encima de la ilustración activa y detrás del SVG interactivo.
  byId(`screen-${target}`).prepend(byId('space-canvas'));
  byId('brush-status').hidden = target === 'menu';
  document.querySelectorAll('.mission-ui').forEach(el => { el.hidden = target === 'menu'; });
  if (target !== 'menu') {
    byId('brush-status').querySelector('.brush-title').textContent = LABEL[target];
    const mission = MISSIONS[target];
    byId('mission-kicker').textContent = `Misión ${mission.number} · ${LABEL[target]}`;
    byId('mission-title').textContent = 'Objetivo';
    byId('mission-goal').textContent = mission.goal;
    byId('mission-guide-title').textContent = 'Cómo jugar';
    byId('mission-steps').replaceChildren(...mission.steps.map(step => {
      const item = document.createElement('li'); item.textContent = step; return item;
    }));
    byId('mission-play').textContent = `▶ ${mission.action}`;
    evaluate(target);
  }
  updateMenu();
}
function startGame() { switchToScreen('level1'); }
function pulseLevelsContainer() {
  byId('level-picker').classList.remove('hidden');
}
function resetLevel(name = currentScreen) {
  if (!records[name]) return;
  if (currentScreen === name) hideHint();
  runToken++; busy = false;
  records[name].strokes = [];
  records[name].result = null;
  if (heroes[name]) { setHero(name, HERO_HOME[name].x, HERO_HOME[name].y, HERO_HOME[name].scale); setHeroPose(name, 'idle'); }
  if (name === 'salto') {
    setAttr('saltoHeroCharacter', 'transform', 'translate(515, 412)');
    byId('collectibleShipPiece').style.opacity = '1';
    setAttr('salto-objective-check', 'opacity', '0');
    setText('salto-floating-angle-text', '—°');
    setText('salto-card-angle-text', 'Ángulo: —°');
  }
  if (name === 'level3') {
    setAttr('origamiRobotHero', 'transform', 'translate(418, 545)');
    setText('live-area-value', '0');
    setAttr('scale-gauge-needle', 'transform', 'rotate(-58 0 -22)');
    setAttr('weight-needle-live', 'transform', 'rotate(-58 958 784)');
    setAttr('weight-status-circle', 'fill', '#d97706');
    setText('weight-status-line1', 'Dibuja'); setText('weight-status-line2', 'la carga');
    byId('poly-success-ticks').style.opacity = '0.15';
    byId('fortress-green-beam').style.opacity = '0.15';
    setAttr('weight-gate-light', 'opacity', '0');
    setAttr('weight-scale-light', 'opacity', '0');
  }
  if (name === 'level4') setAttr('triangleHero', 'transform', 'translate(254, 464)');
  if (name === 'level1') {
    setText('l1-formula-text', '¿Cuánto camino extra necesitas para rodear el cometa?');
    setText('l1-c-label', 'c = ?');
  }
  if (name === 'level2') setText('l2-vector-text', 'Dibuja la dirección del impulso desde el origen.');
  if (name === 'level5') setText('l5-poly-info', 'Une los seis puntos con el pincel.');
  renderBrush(name);
  evaluate(name);
}
function undoAction() {
  if (!records[currentScreen]) return;
  records[currentScreen].strokes.pop();
  renderBrush(currentScreen); evaluate(currentScreen, true);
}
function clearTracesAction() { resetLevel(); showToast('Trazos borrados. La tinta vuelve al depósito.'); }
function resetExactLevelState() { resetLevel(); }
function resetLevel3Polygon() { resetLevel('level3'); }
function resetSaltoLevel() { resetLevel('salto'); }

function animate(duration, frame, done) {
  const token = ++runToken;
  const start = performance.now();
  function tick(now) {
    if (token !== runToken) return;
    const t = Math.min(1, (now - start) / duration);
    frame(t);
    if (t < 1) requestAnimationFrame(tick);
    else done();
  }
  requestAnimationFrame(tick);
}
function advance() {
  const index = ORDER.indexOf(currentScreen);
  if (index < 0) return;
  unlocked = Math.max(unlocked, Math.min(index + 1, ORDER.length - 1));
  localStorage.setItem('astro-trazos-brush-unlocked-v1', String(unlocked));
  completed.add(currentScreen);
  localStorage.setItem('astro-trazos-completed-v1', [...completed].join(','));
  updateMenu();
  busy = false;
  heroCheerUntil = performance.now() + 5000;
  setHeroPose(currentScreen, 'cheer');
  const discovery = explainDiscovery(currentScreen);
  setText('mission-result-title', index === ORDER.length - 1 ? '¡Nave reparada!' : '¡Misión superada!');
  setText('mission-result-explanation', discovery.explanation);
  setText('mission-result-math', discovery.math);
  setText('mission-result-next', index === ORDER.length - 1 ? 'Ver final de aventura' : `Siguiente: ${LABEL[ORDER[index + 1]]}`);
  byId('mission-result').hidden = false;
  byId('mission-result-next').focus();
}
function explainDiscovery(name) {
  const result = records[name].result;
  if (name === 'level1') {
    const direct = Math.round(distance(ROUTE_START, ROUTE_GOAL) / 8) / 10;
    const drawn = Math.round(result.totalInk / 8) / 10;
    return {
      explanation: `La ruta directa medía ${fmt(direct)} u, pero chocaba con el cometa. Tu rodeo mide ${fmt(drawn)} u: gastaste ${fmt(drawn - direct)} u más para pasar a salvo.`,
      math: `Inclinación de tus tramos: ${Math.round(Math.abs(result.first.angle))}° y ${Math.round(Math.abs(result.second.angle))}°; Nilo soporta hasta ${ROUTE_MAX_ANGLE}°.`
    };
  }
  if (name === 'level2') {
    const stroke = records.level2.strokes.at(-1);
    const angle = Math.round(Math.atan2(stroke[0].y - stroke.at(-1).y, stroke.at(-1).x - stroke[0].x) * 180 / Math.PI);
    return { explanation: 'La flecha que dibujaste decidió cuánto avanzó la nave y cuánto subió antes de que la gravedad la hiciera caer.',
      math: `Ángulo ${angle}° · aterrizaje a ${fmt((result.physics.landingX - 360) / 80)} u del lanzador.` };
  }
  if (name === 'salto') return { explanation: 'La inclinación de tu rampa convirtió la carrera de Nilo en un salto hasta la isla.',
    math: `Ángulo ${Math.round(result.angle)}° · longitud de rampa ${fmt(distance(result.start, result.end) / 80)} u.` };
  if (name === 'level3') return { explanation: 'La balanza reaccionó al área de tu rectángulo. Multiplicaste sus dos lados para acercarte al objetivo.',
    math: `${Math.round(result.measure.base)} u × ${Math.round(result.measure.height)} u = ${result.area} u² · objetivo 1200 u².` };
  if (name === 'level4') return { explanation: 'Cada defensa azul detuvo un láser en el primer punto donde ambos caminos se cruzaron.',
    math: `${result.blocked} de 3 rayos interceptados por tus trazos.` };
  if (name === 'level5') return { explanation: 'Los seis segmentos vecinos formaron un contorno cerrado. Esa forma distribuye el escudo alrededor de la nave.',
    math: 'Hexágono: 6 lados · 6 vértices · ángulo interior aproximado 120°.' };
  const length = records.level6.strokes.reduce((sum, stroke) => sum + pathLength(stroke), 0) / 10;
  return { explanation: 'La órbita volvió al punto de partida y mantuvo casi la misma distancia al núcleo en todo el recorrido.',
    math: `Radio medio ${fmt(result.radius / 10)} u · recorrido ${fmt(length)} u · relación C ≈ 2πr.` };
}
function continueAfterDiscovery() {
  byId('mission-result').hidden = true;
  const index = ORDER.indexOf(currentScreen);
  if (index === ORDER.length - 1) {
    byId('victory-modal').querySelector('h2').textContent = '¡Nave reparada!';
    byId('victory-modal').querySelector('p').textContent = 'Usaste longitud, ángulos, área, intersecciones y órbitas para salvar la misión.';
    toggleVictoryModal(true);
  } else if (index >= 0) switchToScreen(ORDER[index + 1]);
}
function playLevel1() {
  const beam = layers.level1;
  const start = { ...heroMotion.level1 };
  setHeroPose('level1', 'walk');
  const result = records.level1.result;
  const route = [start, ROUTE_START, result.elbow, ROUTE_GOAL];
  animate(3200, t => {
    const p = sampleRoute(route, t);
    setHero('level1', p.x, p.y - 5 * Math.abs(Math.sin(t * 46)),
      1 - .35 * Math.max(0, (t - .88) / .12), -7 * t);
    beam.style.filter = `drop-shadow(0 0 ${Math.round(12 + 25 * t)}px #a8f4ff)`;
  }, () => {
    beam.style.filter = ''; advance();
  });
}
function sampleRoute(points, progress) {
  const segments = points.slice(1).map((point, i) => ({ a: points[i], b: point,
    length: distance(points[i], point) }));
  let remaining = segments.reduce((sum, segment) => sum + segment.length, 0) * progress;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const t = remaining / (segment.length || 1);
      return { x: segment.a.x + (segment.b.x - segment.a.x) * t,
        y: segment.a.y + (segment.b.y - segment.a.y) * t };
    }
    remaining -= segment.length;
  }
  return points.at(-1);
}
function playRouteFailure() {
  const result = records.level1.result;
  const failIndex = result.failStroke || 0;
  const stroke = records.level1.strokes[failIndex];
  if (!stroke) { showToast(result.message); return; }
  busy = true;
  const a = stroke[0], b = stroke.at(-1);
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const closest = Math.max(0, Math.min(1, ((ROUTE_METEOR.x - a.x) * dx + (ROUTE_METEOR.y - a.y) * dy) / (length * length)));
  const stop = Math.max(.05, closest - ROUTE_METEOR.radius / length);
  const impact = { x: a.x + dx * stop, y: a.y + dy * stop };
  const route = [{ ...heroMotion.level1 }, ROUTE_START];
  if (failIndex === 1) route.push(records.level1.strokes[0].at(-1));
  route.push(impact);
  setHeroPose('level1', 'walk');
  animate(1700, t => {
    const p = sampleRoute(route, t);
    setHero('level1', p.x, p.y - 4 * Math.abs(Math.sin(t * 30)));
  }, () => {
    setHeroPose('level1', 'jump');
    const hazard = byId('route-hazard');
    hazard.classList.add('route-crash');
    showToast(result.message);
    setTimeout(() => {
      hazard.classList.remove('route-crash');
      if (currentScreen === 'level1') setHero('level1', HERO_HOME.level1.x, HERO_HOME.level1.y);
      setHeroPose('level1', 'idle');
      busy = false;
    }, 750);
  });
}
function playLevel2() {
  const f = records.level2.result.physics;
  const svg = byId('screen-level2').querySelector('svg');
  const ship = svgElement('g', { 'pointer-events': 'none' });
  ship.append(svgElement('path', { d: 'M 0,-42 L 38,36 L 0,17 L -38,36 Z', fill: '#fff0cc', stroke: '#123c66', 'stroke-width': 7 }));
  ship.append(svgElement('circle', { cy: -5, r: 12, fill: '#72e7f5', stroke: '#123c66', 'stroke-width': 4 }));
  svg.append(ship);
  setHeroPose('level2', 'jump');
  animate(Math.max(650, f.landingTime * 1000), t => {
    const sec = t * f.landingTime;
    const x = 360 + f.vx * sec;
    const y = 720 + f.vy * sec + 0.5 * f.gravity * sec * sec;
    ship.setAttribute('transform', `translate(${fmt(x)}, ${fmt(y)})`);
    setHero('level2', x - 45, y + 35, .52, -28 + 56 * t);
  }, () => {
    ship.remove();
    if (records.level2.result.valid) advance();
    else finishFailedAttempt('level2', 'La nave cayó fuera de la zona de aterrizaje.');
  });
}
function finishFailedAttempt(name, outcome) {
  if (currentScreen !== name) return;
  showToast(outcome);
  setHero(name, HERO_HOME[name].x, HERO_HOME[name].y, HERO_HOME[name].scale);
  setHeroPose(name, 'idle');
  busy = false;
}
function playFailedAttempt(name) {
  busy = true;
  const home = HERO_HOME[name];
  const outcome = {
    level1: 'La ruta se interrumpió antes de llegar al cohete.',
    level2: 'La nave no alcanzó la zona de aterrizaje.',
    salto: 'Nilo no llegó a la isla.',
    level3: 'La balanza no abrió la puerta.',
    level4: 'Un rayo sigue cruzando el camino.',
    level5: 'El escudo dejó un lado abierto.',
    level6: 'La órbita perdió estabilidad.'
  }[name];
  setHeroPose(name, name === 'level6' ? 'jump' : 'walk');
  const animation = layers[name]?.animate([
    { filter: 'brightness(1)' }, { filter: 'brightness(1.55)' }, { filter: 'brightness(1)' }
  ], { duration: 850, easing: 'ease-in-out' });
  animate(850, t => {
    const progress = Math.sin(Math.PI * t / 2);
    setHero(name, home.x + (name === 'level3' || name === 'level4' ? 230 : 90) * progress,
      home.y - 12 * Math.abs(Math.sin(t * 8 * Math.PI)), home.scale);
  }, () => { animation?.cancel(); finishFailedAttempt(name, outcome); });
}
function playSaltoSimulation() {
  if (currentScreen !== 'salto') return;
  const result = records.salto.result;
  if (!result?.jump || !Number.isFinite(result.jump.flight) || result.jump.flight <= 0 ||
    result.end.x <= result.start.x) { playFailedAttempt('salto'); return; }
  if (busy) return;
  busy = true;
  const start = { ...heroMotion.salto };
  const b = result.end;
  const { vx, vy, gravity: g, flight, landingX: landX } = result.jump;
  setHeroPose('salto', 'walk');
  animate(1500, t => setHero('salto', start.x + (b.x - start.x) * t,
    start.y + (b.y - start.y) * t - 10 * Math.abs(Math.sin(t * 24)), .82, -result.angle * t), () => {
    animate(Math.min(2200, flight * 1000), t => {
      setHeroPose('salto', 'jump');
      const s = t * flight;
      setHero('salto', b.x + vx * s, b.y + vy * s + .5 * g * s * s, .82, 10 * Math.sin(t * Math.PI));
    }, () => {
      if (result.valid && landX >= 1175 && landX <= 1670) {
        byId('collectibleShipPiece').style.opacity = '0.15';
        setAttr('salto-objective-check', 'opacity', '1');
        advance();
      } else finishFailedAttempt('salto', 'El salto terminó fuera de la isla.');
    });
  });
}
function walkOrigamiRobotToGate() {
  if (currentScreen !== 'level3') return;
  const result = records.level3.result;
  if (!result?.valid) { showToast(result?.message || 'Primero construye una figura con el área adecuada.'); return; }
  if (busy) return;
  busy = true;
  const start = { ...heroMotion.level3 };
  setHeroPose('level3', 'walk');
  animate(2400, t => setHero('level3', start.x + (1668 - start.x) * t,
    start.y - 12 * Math.abs(Math.sin(t * 12 * Math.PI)),
    .95 * (1 - .65 * Math.max(0, (t - .84) / .16))), () => {
    advance();
  });
}
function playLevelSimulation() {
  if (currentScreen !== 'level4') return;
  const result = records.level4.result;
  if (!result?.valid) { showToast(result?.message || 'Bloquea los tres rayos.'); return; }
  if (busy) return;
  busy = true;
  const start = { ...heroMotion.level4 };
  setHeroPose('level4', 'walk');
  animate(2500, t => setHero('level4', start.x + (1798 - start.x) * t,
    start.y + (645 - start.y) * t - 16 * Math.abs(Math.sin(t * 12 * Math.PI)),
    .9 * (1 - .8 * Math.max(0, (t - .9) / .1))), () => {
    advance();
  });
}
function playCurrent() {
  if (busy) return;
  const r = records[currentScreen];
  if (!r) return;
  evaluate(currentScreen);
  if (!r.result?.valid) {
    if (currentScreen === 'level1' && r.result?.reason === 'meteor') playRouteFailure();
    else if (currentScreen === 'salto') playSaltoSimulation();
    else if (currentScreen === 'level2' && Number.isFinite(r.result?.physics?.landingTime) &&
      r.result.physics.landingTime > 0 && r.result.physics.landingTime < 2.5) {
      busy = true; playLevel2();
    } else playFailedAttempt(currentScreen);
    return;
  }
  busy = true;
  if (currentScreen === 'level1') playLevel1();
  else if (currentScreen === 'level2') playLevel2();
  else if (currentScreen === 'salto') { busy = false; playSaltoSimulation(); }
  else if (currentScreen === 'level3') { busy = false; walkOrigamiRobotToGate(); }
  else if (currentScreen === 'level4') { busy = false; playLevelSimulation(); }
  else if (currentScreen === 'level5') {
    setHeroPose('level5', 'jump');
    const shield = svgElement('polygon', { points: hexagon.map(p => `${fmt(p.x)},${fmt(p.y)}`).join(' '),
      fill: '#6be8df', opacity: 0, stroke: '#dffaff', 'stroke-width': 8, filter: 'url(#neonCyanGlow)',
      'pointer-events': 'none' });
    layers.level5.append(shield);
    animate(1200, t => {
      shield.setAttribute('opacity', fmt(.65 * Math.sin(Math.PI * t)));
      setHero('level5', 338 + 320 * t, HERO_HOME.level5.y - 180 * Math.sin(Math.PI * t), .86, 8 * Math.sin(t * 2 * Math.PI));
    }, () => {
      shield.remove(); advance();
    });
  } else if (currentScreen === 'level6') {
    setHeroPose('level6', 'walk');
    const svg = byId('screen-level6').querySelector('svg');
    const satellite = svgElement('circle', { r: 16, fill: '#facc15', stroke: '#ffffff', 'stroke-width': 5, filter: 'url(#sparkBurstGlow)' });
    svg.append(satellite);
    animate(2100, t => {
      const angle = -Math.PI / 2 + t * Math.PI * 4;
      satellite.setAttribute('cx', fmt(960 + 240 * Math.cos(angle)));
      satellite.setAttribute('cy', fmt(480 + 240 * Math.sin(angle)));
      setHero('level6', 334 + 280 * t, HERO_HOME.level6.y - 85 * Math.abs(Math.sin(t * 4 * Math.PI)), .86, 10 * Math.sin(t * 4 * Math.PI));
    }, () => { satellite.remove(); advance(); });
  }
}
function completeGenericLevel() { playCurrent(); }
function adjustLevel1Height() { showToast('Diseña dos tramos desde 1 hasta 2 para rodear el cometa.'); }
function setLevel5Sides() { showToast('Construye los seis lados con el pincel siguiendo las marcas.'); }

function addGuides() {
  const level1Line = svgElement('line', { id: 'level1-guide-line', x1: ROUTE_START.x, y1: ROUTE_START.y,
    x2: ROUTE_GOAL.x, y2: ROUTE_GOAL.y, stroke: '#ff7c83', 'stroke-width': 5,
    'stroke-dasharray': '5 24', 'stroke-linecap': 'round', opacity: .72, 'pointer-events': 'none' });
  layers.level1.parentNode.insertBefore(level1Line, layers.level1);
  for (const name of ['level1', 'level2', 'salto', 'level5', 'level6']) {
    const points = guidePoints(name);
    const layer = layers[name];
    for (const [index, p] of points.entries()) {
      const dot = svgElement('g', { 'pointer-events': 'none', class: 'guide-dot' });
      dot.append(svgElement('circle', { cx: p.x, cy: p.y, r: name === 'level1' ? 27 : 18, fill: '#ffd665', stroke: '#14233f', 'stroke-width': 5 }));
      if (name === 'level1') {
        const numeral = svgElement('text', { x: p.x, y: p.y + 11, 'text-anchor': 'middle',
          'font-size': 30, 'font-weight': 900, fill: '#14233f' });
        numeral.textContent = String(index + 1);
        dot.append(numeral);
        const label = svgElement('text', { x: p.x + (index ? -12 : 12), y: p.y + (index ? -45 : 61),
          'text-anchor': index ? 'end' : 'start', 'font-size': 27, 'font-weight': 900,
          fill: '#fff5d4', stroke: '#14233f', 'stroke-width': 6, 'paint-order': 'stroke' });
        label.textContent = index ? 'META · COHETE' : 'INICIO · DIBUJA AQUÍ';
        dot.append(label);
      } else dot.append(svgElement('circle', { cx: p.x, cy: p.y, r: 6, fill: '#ffffff' }));
      layer.parentNode.insertBefore(dot, layer);
    }
  }
}
function setupRouteHazard() {
  const meteor = svgElement('g', { id: 'route-hazard', 'pointer-events': 'none' });
  const { x, y, radius } = ROUTE_METEOR;
  meteor.append(svgElement('circle', { class: 'route-danger-ring', cx: x, cy: y, r: radius,
    fill: '#ff5e5525', stroke: '#ff8277', 'stroke-width': 6, 'stroke-dasharray': '12 15' }));
  meteor.append(svgElement('circle', { cx: x, cy: y, r: 77, fill: '#4b285b', stroke: '#ff9a75', 'stroke-width': 10,
    style: 'filter:drop-shadow(0 0 25px #ff5f52)' }));
  meteor.append(svgElement('path', { d: `M ${x - 66} ${y - 15} L ${x - 22} ${y - 74} L ${x + 48} ${y - 53} L ${x + 78} ${y + 12} L ${x + 24} ${y + 69} L ${x - 51} ${y + 51} Z`,
    fill: '#905476', stroke: '#321e4e', 'stroke-width': 6 }));
  meteor.append(svgElement('path', { d: `M ${x - 22} ${y - 74} L ${x + 10} ${y - 25} L ${x - 66} ${y - 15} Z M ${x + 48} ${y - 53} L ${x + 10} ${y - 25} L ${x + 78} ${y + 12} Z M ${x - 51} ${y + 51} L ${x + 10} ${y - 25} L ${x + 24} ${y + 69} Z`,
    fill: '#d58e8e', opacity: .64 }));
  meteor.append(svgElement('path', { d: `M ${x - 4} ${y - 51} L ${x + 22} ${y - 5} L ${x + 5} ${y + 18} L ${x + 32} ${y + 45}`,
    fill: 'none', stroke: '#ffe6a5', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  const title = svgElement('text', { x, y: y - radius - 24, 'text-anchor': 'middle', 'font-size': 29,
    'font-weight': 900, fill: '#fff4dc', stroke: '#49213c', 'stroke-width': 7, 'paint-order': 'stroke' });
  title.textContent = 'COMETA · NO TOCAR'; meteor.append(title);
  const arrow = svgElement('text', { x, y: y + 9, 'text-anchor': 'middle', 'font-size': 40,
    'font-weight': 900, fill: '#fff2c2', stroke: '#512644', 'stroke-width': 4, 'paint-order': 'stroke' });
  arrow.textContent = '✕'; meteor.append(arrow);
  layers.level1.parentNode.insertBefore(meteor, heroes.level1);
}
function setupArt() {
  for (const id of ['saltoHeroCharacter', 'origamiRobotHero', 'triangleHero']) byId(id).style.display = 'none';
  for (const name of ['level1', 'level2']) {
    const children = [...byId(`screen-${name}`).querySelector('svg').children];
    children[1].style.display = 'none'; children[2].style.display = 'none';
    for (let i = 3; i <= (name === 'level1' ? 6 : 5); i++) children[i].style.display = 'none';
    if (name === 'level2') children[7].style.display = 'none';
  }
  byId('screen-level5').querySelector('svg').children[3].style.display = 'none';
  byId('screen-level6').querySelector('svg').children[3].style.display = 'none';
  for (const name of ['level5', 'level6']) {
    const children = [...byId(`screen-${name}`).querySelector('svg').children];
    for (const i of [1, 2, 4]) children[i].style.display = 'none';
  }
  const saltoSvg = byId('salto-svg');
  const piece = byId('collectibleShipPiece');
  piece.remove();
  piece.setAttribute('transform', 'translate(1451, 460)');
  saltoSvg.append(piece);
  [...saltoSvg.children].forEach((child, i) => {
    if ((i >= 1 && i <= 10) || i === 13 || (i >= 14 && i <= 18)) child.style.display = 'none';
  });
  const weightSvg = byId('level3-svg');
  [...weightSvg.children].forEach((child, i) => {
    if ((i >= 1 && i <= 5) || i === 7 || i === 8 || (i >= 11 && i <= 16)) child.style.display = 'none';
  });
  const scaleLight = svgElement('circle', { id: 'weight-scale-light', cx: 958, cy: 784, r: 82,
    fill: 'none', stroke: '#77ffab', 'stroke-width': 15, opacity: 0, filter: 'url(#neonCyanGlow)', 'pointer-events': 'none' });
  const needle = svgElement('g', { id: 'weight-needle-live', transform: 'rotate(-58 958 784)', 'pointer-events': 'none' });
  needle.append(svgElement('path', { d: 'M 958 785 L 948 714 L 958 699 L 968 714 Z',
    fill: '#17774e', stroke: '#123747', 'stroke-width': 5 }));
  needle.append(svgElement('circle', { cx: 958, cy: 785, r: 11, fill: '#65ec9e', stroke: '#123747', 'stroke-width': 4 }));
  const gateLight = svgElement('rect', { id: 'weight-gate-light', x: 1610, y: 435, width: 95, height: 277,
    rx: 28, fill: '#72ffad', opacity: 0, filter: 'url(#neonCyanGlow)', 'pointer-events': 'none' });
  weightSvg.append(scaleLight, needle, gateLight);
  const raySvg = byId('scene-svg');
  [...raySvg.children].forEach((child, i) => {
    if ((i >= 1 && i <= 5) || (i >= 7 && i <= 13) || i === 16 || (i >= 18 && i <= 22)) child.style.display = 'none';
  });
  byId('sawBlade1').style.display = '';
  byId('sawBlade2').style.display = '';
  byId('l1-tri-poly').style.opacity = '0';
  byId('l1-triangle-group').style.display = 'none';
  byId('l2-vec-arrow').style.opacity = '0';
  byId('l2-parabola').style.opacity = '0';
  byId('salto-ramp-beam').style.opacity = '0';
  byId('salto-ramp-handle').style.pointerEvents = 'none';
  byId('solidWeightPolygonGroup').style.opacity = '0';
  byId('geometryTracesLayer').style.opacity = '0';
  for (const id of ['sparkCluster1', 'sparkCluster2', 'sparkCluster3', 'sparkCluster4']) byId(id).style.opacity = '0';
  byId('l5-regular-polygon').style.opacity = '0';
  const weightHint = weightSvg.querySelector('[onclick*="Arrastra los 5"]');
  if (weightHint) weightHint.setAttribute('onclick', "showToast('Arrastra entre dos esquinas. Cambia base y altura en pasos de 5 u hasta que su producto sea 1200 u².')");
  const level6Svg = byId('screen-level6').querySelector('svg');
  const orbitGuide = svgElement('circle', { cx: 960, cy: 480, r: 240, fill: 'none', stroke: '#8adbf4',
    'stroke-width': 3, 'stroke-dasharray': '10 18', opacity: .55, 'pointer-events': 'none' });
  level6Svg.append(orbitGuide);
  const menuPlay = document.querySelector('#screen-menu .menu-btn[onclick="switchToScreen(\'level3\')"]');
  if (menuPlay) menuPlay.setAttribute('onclick', 'startGame()');
  // Estos controles del prototipo daban una victoria sin construir nada.
  document.querySelectorAll('#screen-level1 .hud-btn[onclick^="adjustLevel1Height"], #screen-level5 .hud-btn[onclick^="setLevel5Sides"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#screen-level1 .hud-btn, #screen-level2 .hud-btn, #screen-salto .hud-btn, #screen-level3 .hud-btn, #screen-level4 .hud-btn, #screen-level5 .hud-btn, #screen-level6 .hud-btn').forEach(el => {
    if (el.id !== 'topLeftLogo') el.style.display = 'none';
  });
  const menuHero = byId('menuHeroCharacter');
  if (menuHero) menuHero.setAttribute('onclick', 'startGame()');
  const endButton = document.querySelector('#screen-menu .menu-btn[onclick*="desinstales"]');
  if (endButton) endButton.setAttribute('onclick', 'showCredits()');
  const optionButton = document.querySelector('#screen-menu .menu-btn[onclick*="Opciones:"]');
  if (optionButton) optionButton.setAttribute('onclick', 'showOptions()');
}
function showCredits() { showToast('Astro-Trazos · proyecto de computación gráfica · construye y aprende jugando.'); }
function toggleOptionsModal(show) { byId('options-modal').classList.toggle('hidden', !show); }
function showOptions() { toggleOptionsModal(true); }
function newGame() {
  unlocked = ORDER.length - 1;
  completed.clear();
  localStorage.setItem('astro-trazos-brush-unlocked-v1', String(unlocked));
  localStorage.removeItem('astro-trazos-completed-v1');
  for (const name of ORDER) resetLevel(name);
  toggleOptionsModal(false);
  switchToScreen('menu');
  showToast('Nueva aventura preparada. Empieza dibujando la primera construcción.');
}
function showExit() { showToast('Para salir del juego, cierra esta pestaña. Tu progreso queda guardado aquí.'); }

function makeStatus() {
  const stage = byId('game-stage');
  const resultPanel = document.createElement('div');
  resultPanel.id = 'mission-result'; resultPanel.hidden = true;
  resultPanel.setAttribute('role', 'dialog'); resultPanel.setAttribute('aria-modal', 'true');
  resultPanel.setAttribute('aria-label', 'Descubrimiento de la misión');
  resultPanel.innerHTML = '<div id="mission-result-card"><div id="mission-result-star" aria-hidden="true">★</div><h2 id="mission-result-title"></h2><p id="mission-result-explanation"></p><div id="mission-result-math"></div><button type="button" id="mission-result-next"></button></div>';
  stage.append(resultPanel);
  byId('mission-result-next').addEventListener('click', continueAfterDiscovery);
  const header = document.createElement('section');
  header.id = 'mission-header'; header.className = 'mission-ui'; header.hidden = true;
  header.setAttribute('aria-label', 'Objetivo de la misión');
  header.innerHTML = '<div id="mission-kicker"></div><h2 id="mission-title"></h2><div id="mission-goal"></div>';
  stage.append(header);
  const ink = document.createElement('section');
  ink.id = 'mission-ink'; ink.className = 'mission-ui'; ink.hidden = true;
  ink.setAttribute('aria-label', 'Tinta disponible');
  ink.innerHTML = '<div class="mission-ink-row"><svg class="mission-drop" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2 C11 11 3 21 3 28 a13 13 0 0 0 26 0 C29 21 21 11 16 2 Z"/></svg><span>Tinta restante</span><span id="mission-ink-pct">100%</span></div><div id="mission-ink-track" class="mission-ink-track" role="progressbar" aria-label="Tinta restante" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div id="mission-ink-fill"></div></div>';
  stage.append(ink);
  const guide = document.createElement('aside');
  guide.id = 'mission-guide'; guide.className = 'mission-ui'; guide.hidden = true;
  guide.innerHTML = '<strong id="mission-guide-title"></strong><ol id="mission-steps"></ol><button type="button" id="mission-hint">💡 Ver ejemplo</button><p id="mission-hint-detail" hidden></p>';
  stage.append(guide);
  byId('mission-hint').addEventListener('click', toggleHint);
  const actionsPanel = document.createElement('div');
  actionsPanel.id = 'mission-actions'; actionsPanel.className = 'mission-ui'; actionsPanel.hidden = true;
  actionsPanel.innerHTML = '<button type="button" id="mission-undo">↶ Deshacer</button><button type="button" id="mission-reset">↺ Reiniciar</button><button type="button" id="mission-play">▶ Probar</button><button type="button" id="mission-menu">☰ Menú</button>';
  stage.append(actionsPanel);
  byId('mission-undo').addEventListener('click', undoAction);
  byId('mission-reset').addEventListener('click', () => resetLevel());
  byId('mission-play').addEventListener('click', playCurrent);
  byId('mission-menu').addEventListener('click', () => switchToScreen('menu'));
  const status = document.createElement('div');
  status.id = 'brush-status';
  status.innerHTML = '<div class="brush-title"></div><div class="brush-feedback"></div><div class="brush-ink"></div>';
  byId('game-stage').append(status);
  status.hidden = true;
  const picker = document.createElement('div');
  picker.id = 'level-picker'; picker.className = 'hidden';
  picker.setAttribute('role', 'dialog'); picker.setAttribute('aria-modal', 'true');
  picker.setAttribute('aria-label', 'Elegir nivel');
  picker.innerHTML = '<div class="level-picker-card"><h2>Elige un nivel</h2><p>Todos están disponibles para practicar.</p><div id="level-picker-list"></div><button type="button" id="level-picker-close">Cerrar</button></div>';
  stage.append(picker);
  for (const [index, name] of ORDER.entries()) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = `${index + 1}. ${LABEL[name]}`;
    button.addEventListener('click', () => switchToScreen(name));
    byId('level-picker-list').append(button);
  }
  byId('level-picker-close').addEventListener('click', () => picker.classList.add('hidden'));
  const options = document.createElement('div');
  options.id = 'options-modal';
  options.className = 'hidden';
  options.setAttribute('role', 'dialog');
  options.setAttribute('aria-modal', 'true');
  options.setAttribute('aria-label', 'Opciones del juego');
  options.innerHTML = '<div><h2>Opciones</h2><p>Dibuja con mouse o dedo. ←/→ o A/D: mover a Nilo · clic en Nilo o Enter: probar · Z: deshacer · R: reiniciar · Esc: menú.</p><button type="button" id="new-game-button">↺ Nueva partida desde cero</button><button type="button" id="close-options-button">▶ Continuar</button></div>';
  byId('game-stage').append(options);
  byId('new-game-button').addEventListener('click', newGame);
  byId('close-options-button').addEventListener('click', () => toggleOptionsModal(false));
  const menu = byId('screen-menu');
  const actions = [
    { label: 'Jugar', left: 75.5, top: 37.5, width: 17.5, height: 8.2, action: startGame },
    { label: 'Niveles', left: 76, top: 46.5, width: 17, height: 7.7, action: pulseLevelsContainer },
    { label: 'Opciones', left: 77, top: 55.2, width: 15, height: 7.3, action: showOptions },
    { label: 'Salir', left: 77, top: 63.3, width: 15, height: 7.2, action: showExit }
  ];
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'menu-hit'; button.setAttribute('aria-label', action.label);
    button.style.left = `${action.left}%`; button.style.top = `${action.top}%`;
    button.style.width = `${action.width}%`; button.style.height = `${action.height}%`;
    button.addEventListener('click', action.action);
    menu.append(button);
  }
  for (let i = 0; i < 6; i++) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'menu-hit menu-level-hit';
    button.style.left = `${(76 + i * 232) / 1920 * 100}%`;
    button.style.top = '72.8%'; button.style.width = '11.7%'; button.style.height = '21.5%';
    button.addEventListener('click', () => switchToScreen(MENU_ORDER[i]));
    menu.append(button);
  }
  for (let i = 1; i < 6; i++) {
    const lock = document.createElement('div');
    lock.className = 'menu-lock';
    lock.style.left = `${(76 + i * 232) / 1920 * 100}%`;
    lock.textContent = '🔒';
    menu.append(lock);
  }
  const sixthCard = document.createElement('div');
  sixthCard.className = 'menu-sixth-card';
  sixthCard.setAttribute('aria-hidden', 'true');
  sixthCard.innerHTML = '<div class="menu-sixth-thumb"></div><div class="menu-sixth-stars">★★★</div><strong>6</strong><span>Núcleo cósmico</span>';
  menu.append(sixthCard);
  const orbitText = svgElement('text', { id: 'orbit-live-text', x: 960, y: 810, fill: '#fff8dc',
    'font-size': 29, 'font-weight': 900, 'text-anchor': 'middle' });
  orbitText.textContent = 'Radio — · perímetro —';
  byId('screen-level6').querySelector('svg').append(orbitText);
}

function animateSky() {
  const canvas = byId('space-canvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seed = 183947;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const stars = Array.from({ length: 560 }, () => {
    const depth = random();
    return {
      x: 22 + random() * 1876, y: 18 + random() * 750,
      size: depth > .92 ? 2.8 : depth > .67 ? 1.7 : .78,
      glow: depth > .92, phase: random() * Math.PI * 2,
      rate: .55 + random() * 1.25,
      drift: .7 + depth * 5.4,
      tint: random() > .83 ? '#ffe9bb' : random() > .53 ? '#c8f4ff' : '#ffffff'
    };
  });
  const asteroidLanes = [
    { period: 9600, duration: 5100, offset: 1200, fromY: 170, toY: 320, radius: 17, direction: 1, phase: .2 },
    { period: 12300, duration: 5800, offset: 7100, fromY: 340, toY: 210, radius: 12, direction: -1, phase: 1.8 },
    { period: 15100, duration: 6900, offset: 3400, fromY: 110, toY: 190, radius: 24, direction: 1, phase: 3.4 }
  ];
  function drawAsteroid(x, y, radius, angle, alpha, direction) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const tail = ctx.createLinearGradient(-direction * radius * 4, 0, 0, 0);
    tail.addColorStop(0, '#8fc3ff00'); tail.addColorStop(1, '#b4d9ff55');
    ctx.strokeStyle = tail; ctx.lineWidth = radius * .7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-direction * radius * 4, 0); ctx.lineTo(-direction * radius, 0); ctx.stroke();
    const vertices = [1, .83, 1.1, .87, 1.05, .78, 1.08, .88, 1.02];
    ctx.beginPath();
    vertices.forEach((scale, i) => {
      const a = i * Math.PI * 2 / vertices.length;
      const px = Math.cos(a) * radius * scale, py = Math.sin(a) * radius * scale;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = '#677b98'; ctx.strokeStyle = '#263650'; ctx.lineWidth = 2.4;
    ctx.shadowColor = '#91b9e3'; ctx.shadowBlur = radius * .65;
    ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(-radius * .88, -radius * .12);
    ctx.lineTo(-radius * .12, -radius * .82); ctx.lineTo(radius * .34, -radius * .42);
    ctx.lineTo(radius * .08, radius * .13); ctx.closePath();
    ctx.fillStyle = '#9db0c5'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(radius * .32, radius * .32, radius * .23, radius * .16, -.4, 0, Math.PI * 2);
    ctx.fillStyle = '#35475f'; ctx.fill();
    ctx.beginPath(); ctx.arc(-radius * .34, radius * .2, radius * .12, 0, Math.PI * 2);
    ctx.fillStyle = '#455871'; ctx.fill();
    ctx.restore();
  }
  let previousTime = 0;
  let lastSkyPaint = -Infinity;
  let paintedScreen = '';
  function frame(now) {
    moveHeroManually(Math.min(.05, (now - previousTime) / 1000 || 0));
    previousTime = now;
    if (document.hidden || (reducedMotion && paintedScreen === currentScreen) || now - lastSkyPaint < 33) {
      requestAnimationFrame(frame);
      return;
    }
    lastSkyPaint = now;
    paintedScreen = currentScreen;
    ctx.clearRect(0, 0, 1920, 1080);
    const glowShift = reducedMotion ? 0 : Math.sin(now * .00012) * 55;
    const leftGlow = ctx.createRadialGradient(430 + glowShift, 230, 10, 430 + glowShift, 230, 450);
    leftGlow.addColorStop(0, '#5982df20'); leftGlow.addColorStop(1, '#5982df00');
    ctx.fillStyle = leftGlow; ctx.fillRect(0, 0, 900, 700);
    const rightGlow = ctx.createRadialGradient(1430 - glowShift, 290, 20, 1430 - glowShift, 290, 490);
    rightGlow.addColorStop(0, '#58d4df18'); rightGlow.addColorStop(1, '#58d4df00');
    ctx.fillStyle = rightGlow; ctx.fillRect(920, 0, 1000, 750);
    const horizon = currentScreen === 'menu' ? 810 : 690;
    for (const s of stars) {
      if (currentScreen === 'menu' && s.x > 850 && s.x < 1850 && s.y < 385) continue;
      const fade = Math.max(0, Math.min(1, (horizon - s.y) / 250));
      if (!fade) continue;
      const pulse = reducedMotion ? .7 : .5 + .5 * Math.sin(now * .0014 * s.rate + s.phase);
      const x = s.x + (reducedMotion ? 0 : Math.sin(now * .0002 + s.phase) * s.drift);
      const y = s.y + (reducedMotion ? 0 : Math.cos(now * .00016 + s.phase) * s.drift * .45);
      const alpha = fade * ((s.glow ? .5 : .38) + (s.glow ? .5 : .55) * pulse);
      if (s.glow) {
        ctx.globalAlpha = 1;
        const haloSize = 10 + 6 * pulse;
        const halo = ctx.createRadialGradient(x, y, 0, x, y, haloSize);
        halo.addColorStop(0, '#fffdf4' + Math.round(alpha * 95).toString(16).padStart(2, '0'));
        halo.addColorStop(1, '#c0eaff00');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, haloSize, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(220,245,255,${(alpha * .55).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        const glint = 6 + 5 * pulse;
        ctx.beginPath(); ctx.moveTo(x - glint, y); ctx.lineTo(x + glint, y);
        ctx.moveTo(x, y - glint); ctx.lineTo(x, y + glint); ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.tint; ctx.beginPath(); ctx.arc(x, y, s.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reducedMotion) {
      for (const lane of asteroidLanes) {
        const progress = ((now + lane.offset) % lane.period) / lane.duration;
        if (progress >= 1) continue;
        const menu = currentScreen === 'menu';
        const x = menu ? lane.direction > 0 ? -70 + progress * 870 : 800 - progress * 870
          : lane.direction > 0 ? -70 + progress * 2060 : 1990 - progress * 2060;
        const y = menu ? 105 + lane.radius * 3 + progress * 35
          : lane.fromY + (lane.toY - lane.fromY) * progress + 14 * Math.sin(progress * Math.PI * 2 + lane.phase);
        const fade = Math.min(1, progress * 8, (1 - progress) * 8) *
          (menu ? Math.max(0, Math.min(1, (x - 260) / 85)) : 1);
        if (fade <= 0) continue;
        drawAsteroid(x, y, lane.radius, lane.phase + progress * Math.PI * 2, fade * .86, lane.direction);
      }
      const cycle = Math.floor(now / 8200);
      const progress = (now % 8200 - 1400) / 1700;
      if (progress > 0 && progress < 1) {
        const fromX = currentScreen === 'menu' ? 120 + ((cycle * 271) % 470) : 220 + ((cycle * 337) % 1150);
        const fromY = 75 + ((cycle * 113) % 250);
        const headX = fromX + progress * 310;
        const headY = fromY + progress * 124;
        const tail = ctx.createLinearGradient(headX - 145, headY - 58, headX, headY);
        tail.addColorStop(0, '#ccf7ff00'); tail.addColorStop(.75, '#a1dfff70'); tail.addColorStop(1, '#fff9dded');
        ctx.globalAlpha = Math.min(1, progress * 5, (1 - progress) * 5);
        ctx.strokeStyle = tail; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(headX - 145, headY - 58); ctx.lineTo(headX, headY); ctx.stroke();
        ctx.fillStyle = '#fffbe9'; ctx.beginPath(); ctx.arc(headX, headY, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function init() {
  setupArt(); makeStatus();
  setupLasers();
  const switcher = document.querySelector('.quick-switcher');
  switcher.style.display = 'none';
  for (const name of ORDER) {
    const svg = byId(`screen-${name}`).querySelector('svg');
    addConstructionPattern(svg);
    const layer = svgElement('g', { id: `brush-layer-${name}`, 'pointer-events': 'none' });
    svg.append(layer);
    layers[name] = layer;
    makeHero(name, svg);
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', e => beginBrush(e, name, svg));
    svg.addEventListener('pointermove', e => moveBrush(e, name, svg));
    svg.addEventListener('pointerup', e => endBrush(e, name));
    svg.addEventListener('pointercancel', e => endBrush(e, name));
    svg.addEventListener('click', e => {
      if (performance.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }
  addGuides();
  setupRouteHazard();
  for (const name of ORDER) resetLevel(name);
  switchToScreen('menu');
  animateSky();
  window.addEventListener('keydown', e => {
    if (!byId('mission-result').hidden) {
      if (e.key === 'Enter' && document.activeElement !== byId('mission-result-next')) {
        e.preventDefault(); continueAfterDiscovery();
      }
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
      moveKeys.add(e.key);
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    if (e.key === 'F1') { e.preventDefault(); switcher.style.display = switcher.style.display === 'none' ? 'flex' : 'none'; return; }
    if (e.key === 'Escape') {
      if (!byId('level-picker').classList.contains('hidden')) byId('level-picker').classList.add('hidden');
      else if (!byId('options-modal').classList.contains('hidden')) toggleOptionsModal(false);
      else if (currentScreen !== 'menu') switchToScreen('menu');
      return;
    }
    if (currentScreen === 'menu') return;
    if (e.key.toLowerCase() === 'r') resetLevel();
    if (e.key.toLowerCase() === 'z') undoAction();
    if (e.key === 'Enter') playCurrent();
  });
  window.addEventListener('keyup', e => moveKeys.delete(e.key));
  window.addEventListener('blur', () => moveKeys.clear());
}

Object.assign(window, {
  switchToScreen, startGame, pulseLevelsContainer, togglePauseModal, toggleVictoryModal,
  completeGenericLevel, adjustLevel1Height, setLevel5Sides, resetSaltoLevel,
  resetLevel3Polygon, walkOrigamiRobotToGate, playSaltoSimulation,
  undoAction, clearTracesAction, resetExactLevelState, playLevelSimulation,
  showToast, showCredits, showOptions, showExit
});
init();
