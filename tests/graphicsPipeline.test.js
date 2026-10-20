import { describe, expect, it } from 'vitest';
import { Mat3 } from '../src/math/Mat3.js';
import { clipLine } from '../src/clipping/CohenSutherland.js';
import { aabb, segmentIntersection } from '../src/collision/Collisions.js';

describe('algoritmos gráficos utilizados en la escena jugable', () => {
  it('compone traslación, rotación y escala con matrices homogéneas', () => {
    const transform = Mat3.multiply(Mat3.multiply(Mat3.translation(10, 5),
      Mat3.rotation(Math.PI / 2)), Mat3.scale(2, 2));
    const point = Mat3.transformPoint(transform, { x: 1, y: 0 });
    expect(point.x).toBeCloseTo(10);
    expect(point.y).toBeCloseTo(7);
  });

  it('recorta segmentos que cruzan el viewport y descarta los externos', () => {
    const viewport = { xMin: 0, yMin: 0, xMax: 100, yMax: 100 };
    expect(clipLine({ x: -20, y: 50 }, { x: 120, y: 50 }, viewport))
      .toEqual([{ x: 0, y: 50 }, { x: 100, y: 50 }]);
    expect(clipLine({ x: -20, y: 20 }, { x: -10, y: 80 }, viewport)).toBeNull();
  });

  it('calcula colisiones de cajas e intersecciones paramétricas', () => {
    expect(aabb({ x: 0, y: 0, w: 20, h: 20 }, { x: 15, y: 10, w: 20, h: 20 })).toBe(true);
    const hit = segmentIntersection({ x: 0, y: 5 }, { x: 20, y: 5 },
      { x: 7, y: 0 }, { x: 7, y: 10 });
    expect(hit).toMatchObject({ x: 7, y: 5 });
    expect(hit.t).toBeCloseTo(.35);
  });
});
