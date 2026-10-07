# Arquitectura de Astro-Trazos

## Principio central
La capa de presentación usa Canvas 2D. Los algoritmos académicos obligatorios se implementan en módulos propios y no se delegan a un motor de física o colisiones.

## Pipeline
Input → lógica del nivel → física simplificada → colisiones → transformaciones → clipping → render → HUD/debug.

## Módulos
- `src/math`: matrices homogéneas 3x3 y operaciones vectoriales.
- `src/clipping`: clipping de líneas/polígonos.
- `src/collision`: colisiones e intersecciones.
- `src/physics`: integración temporal y gravedad.
- `src/input`: captura de ratón/táctil y trazos.
- `src/render`: Canvas 2D, fondos, partículas y HUD.
- `src/levels`: definición declarativa de tutorial y niveles.
- `src/debug`: visualización académica para sustentación.

## Regla académica
Canvas dibuja. La lógica matemática relevante la implementa el equipo.
