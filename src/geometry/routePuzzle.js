import { distance, lineDeviation, pathLength, pointToSegmentDistance } from './brushMath.js';

export const ROUTE_START = { x: 580, y: 800 };
export const ROUTE_GOAL = { x: 1490, y: 340 };
export const ROUTE_METEOR = { x: 1035, y: 570, radius: 110 };
export const ROUTE_MAX_ANGLE = 40;
export const ROUTE_MAX_INK = 1150;

function metrics(stroke) {
  const start = stroke[0], end = stroke.at(-1);
  const angle = Math.atan2(start.y - end.y, end.x - start.x) * 180 / Math.PI;
  const straight = distance(start, end);
  const length = pathLength(stroke);
  const clearance = pointToSegmentDistance(ROUTE_METEOR, start, end);
  return { start, end, angle, straight, length, clearance, directness: lineDeviation(stroke) };
}

export function evaluateRoute(strokes) {
  if (!strokes.length) return {
    valid: false, stage: 0, reason: 'empty',
    message: 'Nilo necesita dos tramos: empieza en 1 y rodea el cometa antes de llegar a 2.'
  };
  const first = metrics(strokes[0]);
  const totalInk = strokes.reduce((sum, stroke) => sum + pathLength(stroke), 0);
  if (distance(first.start, ROUTE_START) > 55) return {
    valid: false, stage: 0, reason: 'start', totalInk,
    message: 'El primer tramo debe comenzar en la marca 1 del suelo.'
  };
  if (strokes.length === 1 && distance(first.end, ROUTE_GOAL) < 60) return {
    valid: false, stage: 1, reason: 'meteor', totalInk, failStroke: 0,
    message: 'La ruta directa atraviesa el cometa. Deshazla y construye dos tramos alrededor.'
  };
  if (first.end.x < 750 || first.end.x > 1300 || first.end.y < 210 || first.end.y > 790) return {
    valid: false, stage: 1, reason: 'elbow', totalInk,
    message: 'El primer tramo necesita un codo en el cielo, entre el suelo y el cohete.'
  };
  if (first.directness > 32 || first.end.x <= first.start.x + 80) return {
    valid: false, stage: 1, reason: 'straight', totalInk,
    message: 'Haz el tramo recto hacia la derecha; así Nilo puede caminar sobre él.'
  };
  if (first.clearance < ROUTE_METEOR.radius) return {
    valid: false, stage: 1, reason: 'meteor', totalInk, failStroke: 0,
    message: '¡El primer tramo atraviesa el cometa! Deshazlo y pasa por arriba o por abajo.'
  };
  if (Math.abs(first.angle) > ROUTE_MAX_ANGLE) return {
    valid: false, stage: 1, reason: 'steep', totalInk, failStroke: 0,
    message: `Primer tramo: ${Math.round(Math.abs(first.angle))}°. Nilo solo puede subir hasta ${ROUTE_MAX_ANGLE}°. Hazlo menos empinado.`
  };
  if (strokes.length === 1) return {
    valid: false, stage: 1, reason: 'second', totalInk, elbow: first.end,
    first,
    message: `Tramo 1 listo: ${Math.round(Math.abs(first.angle))}° y ${(first.straight / 80).toFixed(1)} u. Empieza el segundo en el codo y llega a 2.`
  };
  const second = metrics(strokes[1]);
  if (distance(second.start, first.end) > 47) return {
    valid: false, stage: 1, reason: 'join', totalInk,
    message: 'Los tramos no se tocan. Deshaz el segundo y empieza justo en el codo luminoso.'
  };
  if (distance(second.end, ROUTE_GOAL) > 60) return {
    valid: false, stage: 2, reason: 'goal', totalInk,
    message: 'El segundo tramo debe terminar en la marca 2, dentro de la cabina.'
  };
  if (second.directness > 32 || second.end.x <= second.start.x + 80) return {
    valid: false, stage: 2, reason: 'straight', totalInk,
    message: 'El segundo tramo debe ser recto y avanzar hacia el cohete.'
  };
  if (second.clearance < ROUTE_METEOR.radius) return {
    valid: false, stage: 2, reason: 'meteor', totalInk, failStroke: 1,
    message: '¡El segundo tramo toca el cometa! Mueve el codo y vuelve a construir.'
  };
  if (Math.abs(second.angle) > ROUTE_MAX_ANGLE) return {
    valid: false, stage: 2, reason: 'steep', totalInk, failStroke: 1,
    message: `Segundo tramo: ${Math.round(Math.abs(second.angle))}°. Nilo necesita una pendiente de ${ROUTE_MAX_ANGLE}° o menos.`
  };
  if (totalInk > ROUTE_MAX_INK) return {
    valid: false, stage: 2, reason: 'ink', totalInk,
    message: 'La ruta gasta demasiada tinta. Prueba un codo más cercano al cometa sin tocarlo.'
  };
  return {
    valid: true, stage: 2, reason: 'ready', totalInk, first, second, elbow: first.end,
    message: `Ruta segura: ${Math.round(Math.abs(first.angle))}° + ${Math.round(Math.abs(second.angle))}°, longitud ${(totalInk / 80).toFixed(1)} u. ¡Prueba el rescate!`
  };
}
