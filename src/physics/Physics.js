export const DEFAULT_GRAVITY = 1200;

export function integrate(body, dt, gravity = DEFAULT_GRAVITY) {
  body.vy += gravity * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;
}
