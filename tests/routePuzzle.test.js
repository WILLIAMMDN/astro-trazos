import { describe, expect, it } from 'vitest';
import { evaluateRoute, ROUTE_GOAL, ROUTE_START } from '../src/geometry/routePuzzle.js';

const line = (a, b) => Array.from({ length: 16 }, (_, i) => ({
  x: a.x + (b.x - a.x) * i / 15,
  y: a.y + (b.y - a.y) * i / 15
}));

describe('rescate con dos tramos', () => {
  it('rechaza el atajo que atraviesa el cometa', () => {
    expect(evaluateRoute([line(ROUTE_START, ROUTE_GOAL)]).reason).toBe('meteor');
  });

  it('acepta rutas distintas por arriba y por abajo del cometa', () => {
    for (const elbow of [{ x: 980, y: 470 }, { x: 1090, y: 670 }]) {
      const route = evaluateRoute([line(ROUTE_START, elbow), line(elbow, ROUTE_GOAL)]);
      expect(route.valid).toBe(true);
      expect(route.totalInk).toBeLessThan(1150);
    }
  });

  it('distingue una pendiente excesiva de un choque', () => {
    const elbow = { x: 920, y: 390 };
    expect(evaluateRoute([line(ROUTE_START, elbow)]).reason).toBe('steep');
  });
});
