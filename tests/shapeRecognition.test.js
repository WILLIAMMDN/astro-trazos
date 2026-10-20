import { describe, expect, it } from 'vitest';
import { recognizeStroke } from '../src/geometry/shapeRecognition.js';

const trace = (vertices, steps = 12) => vertices.flatMap((point, index) => {
  if (index === vertices.length - 1) return [point];
  const next = vertices[index + 1];
  return Array.from({ length: steps }, (_, i) => ({
    x: point.x + (next.x - point.x) * i / steps + (i % 3 === 0 ? 1.4 : -1.1),
    y: point.y + (next.y - point.y) * i / steps + (i % 4 === 0 ? -1.2 : 1.3)
  }));
});

describe('aproximación del pincel geométrico', () => {
  it('endereza un segmento tembloroso', () => {
    expect(recognizeStroke(trace([{ x: 100, y: 200 }, { x: 500, y: 225 }], 40)).type).toBe('line');
  });

  it('reconoce una figura rectangular casi cuadrada sin convertirla en círculo', () => {
    const shape = recognizeStroke(trace([
      { x: 820, y: 350 }, { x: 1040, y: 350 }, { x: 1040, y: 550 },
      { x: 820, y: 550 }, { x: 820, y: 350 }
    ]));
    expect(shape.type).toBe('rectangle');
    expect(shape.points).toHaveLength(4);
    const exact = [
      { x: 820, y: 350 }, { x: 1060, y: 350 }, { x: 1060, y: 530 },
      { x: 820, y: 530 }, { x: 820, y: 350 }
    ];
    const sampled = exact.flatMap((p, i) => i === exact.length - 1 ? [p] :
      Array.from({ length: 12 }, (_, j) => ({
        x: p.x + (exact[i + 1].x - p.x) * j / 12,
        y: p.y + (exact[i + 1].y - p.y) * j / 12
      })));
    expect(recognizeStroke(sampled).points).toEqual(exact.slice(0, -1));
  });

  it('conserva los tres vértices de un triángulo', () => {
    const shape = recognizeStroke(trace([
      { x: 300, y: 390 }, { x: 500, y: 130 }, { x: 700, y: 390 }, { x: 300, y: 390 }
    ]));
    expect(shape.type).toBe('triangle');
  });

  it('distingue un hexágono de una órbita circular', () => {
    const hexagon = Array.from({ length: 7 }, (_, i) => ({
      x: 960 + 305 * Math.cos((-90 + i * 60) * Math.PI / 180),
      y: 435 + 305 * Math.sin((-90 + i * 60) * Math.PI / 180)
    }));
    expect(recognizeStroke(trace(hexagon)).points).toHaveLength(6);
    const circle = Array.from({ length: 91 }, (_, i) => ({
      x: 960 + 240 * Math.cos(i * Math.PI * 2 / 90),
      y: 480 + 240 * Math.sin(i * Math.PI * 2 / 90)
    }));
    expect(recognizeStroke(circle).type).toBe('circle');
  });
});
