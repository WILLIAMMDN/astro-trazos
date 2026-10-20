import { describe, expect, it } from 'vitest';
import {
  distance, pathLength, polygonArea, lineDeviation, firstPathIntersection,
  hasSelfIntersection, simplifyRDP, rectangleMetrics, rectangleFromDrag
} from '../src/geometry/brushMath.js';

describe('geometría que convierte trazos en objetos jugables', () => {
  it('mide la tinta y la longitud de una construcción', () => {
    const stroke = [{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 9, y: 4 }];
    expect(distance(stroke[0], stroke[1])).toBe(5);
    expect(pathLength(stroke)).toBe(11);
  });

  it('mide el área del contorno aunque se dibuje en sentido inverso', () => {
    const shape = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }];
    expect(polygonArea(shape)).toBe(12);
    expect(polygonArea([...shape].reverse())).toBe(12);
  });

  it('distingue una viga recta de una doblada', () => {
    expect(lineDeviation([{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }])).toBe(0);
    expect(lineDeviation([{ x: 0, y: 0 }, { x: 5, y: 15 }, { x: 10, y: 10 }])).toBeGreaterThan(5);
  });

  it('detiene un rayo en la primera defensa dibujada', () => {
    const rayStart = { x: 0, y: 5 }, rayEnd = { x: 20, y: 5 };
    const guards = [
      [{ x: 15, y: 0 }, { x: 15, y: 10 }],
      [{ x: 7, y: 0 }, { x: 7, y: 10 }]
    ];
    expect(firstPathIntersection(rayStart, rayEnd, guards)).toMatchObject({ x: 7, y: 5 });
    expect(firstPathIntersection(rayStart, rayEnd, [[{ x: 0, y: 6 }, { x: 20, y: 6 }]])).toBeNull();
  });

  it('rechaza polígonos cruzados y simplifica un trazo sin alterar sus extremos', () => {
    const bowtie = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 0 }];
    expect(hasSelfIntersection(bowtie)).toBe(true);
    const straight = [{ x: 0, y: 0 }, { x: 5, y: .1 }, { x: 10, y: 0 }];
    expect(simplifyRDP(straight, 1)).toEqual([straight[0], straight[2]]);
  });

  it('explica el área del peso justo mediante base por altura', () => {
    const rectangle = [
      { x: 820, y: 350 }, { x: 1060, y: 350 }, { x: 1060, y: 530 },
      { x: 820, y: 530 }, { x: 820, y: 350 }
    ];
    expect(rectangleMetrics(rectangle)).toMatchObject({ base: 40, height: 30, area: 1200 });
    expect(rectangleMetrics(rectangle.slice(0, -1))).toBeNull();
    expect(rectangleMetrics([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }, { x: 0, y: 0 }])).toBeNull();
  });

  it('construye un rectángulo en pasos estables de 5 u con un arrastre', () => {
    const start = { x: 820, y: 350 };
    const region = [750, 315, 1185, 605];
    for (const end of [{ x: 1060, y: 530 }, { x: 1062, y: 528 }, { x: 1054, y: 535 }]) {
      const rectangle = rectangleFromDrag(start, end, region, 1100);
      expect(rectangleMetrics(rectangle)).toMatchObject({ base: 40, height: 30, area: 1200 });
      expect(pathLength(rectangle)).toBe(840);
    }
    const reverse = rectangleFromDrag({ x: 1060, y: 530 }, start, region, 1100);
    expect(rectangleMetrics(reverse)).toMatchObject({ base: 40, height: 30, area: 1200 });
  });
});
