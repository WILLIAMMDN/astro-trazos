# Plan técnico-artístico definitivo — Astro-Trazos

## Decisiones congeladas
- Runtime: HTML5 Canvas 2D + JavaScript ES Modules.
- Tooling: Vite 8.x, Node.js 24 LTS, Vitest y ESLint.
- Resolución lógica: 1280×720.
- Objetivo visual: papercraft espacial + geometría vectorial + UI de cuaderno científico.
- El renderer puede usar imágenes, SVG, partículas, parallax y composición; los algoritmos académicos se mantienen en módulos propios.
- Objetivo de rendimiento: 60 FPS; piso de aceptación estable: 30 FPS en Lab. 05.

## Prioridad académica
1. Transformaciones 2D propias con matrices homogéneas 3×3.
2. Clipping al viewport.
3. Colisiones implementadas por el equipo.
4. Física simplificada y geometría necesaria para los puzles.
5. Visualización académica/debug.
6. Polish visual.

## Pipeline gráfico
Input → gameplay → física → colisiones → transformaciones → clipping → cámara → render por capas → FX → HUD → debug.

## Pipeline visual
Concept art → Art Bible → master asset → limpieza/vectorización → export optimizado → integración → revisión dentro del juego.

## Capas de render
1. fondo profundo;
2. nebulosas/planetas;
3. paisaje medio;
4. escenario jugable;
5. personaje/objetos;
6. trazos y efectos;
7. foreground;
8. HUD;
9. modo académico.

## Assets
El inventario obligatorio está en [ASSET_MANIFEST.md](art/ASSET_MANIFEST.md) y las reglas visuales en [ART_BIBLE.md](art/ART_BIBLE.md).

## Formatos
- UI/iconos: SVG cuando convenga.
- Personaje/props transparentes: PNG o WebP.
- Fondos: WebP.
- Fuente editable: se conserva fuera del runtime bajo assets/source.
- Audio master: WAV; runtime: OGG/MP3 según compatibilidad final.

## Estrategia para alta calidad visual
El acabado no depende de una sola imagen. Se consigue combinando:
- arte consistente;
- parallax multicapa;
- partículas discretas;
- additive/light blending con Canvas;
- glow por capas;
- easing/transiciones;
- cámara suave y screen shake limitado;
- buena jerarquía de UI;
- animaciones cortas pero expresivas.

## MVP visual
Una sola vertical slice debe verse cercana al concept:
- alien canónico;
- fondo espacial por capas;
- plataforma de papel;
- abismo y pinchos;
- trazo cian con glow;
- pieza dorada;
- HUD de tinta;
- partículas básicas.

No producir los cinco niveles visuales antes de validar esta pantalla.

## Orden de producción
### MUST
- Alien canónico.
- Kit modular de terreno.
- HUD/tinta.
- Nave y pieza recuperable.
- Fondo de 4 capas.
- Tinta/glow/partículas.
- Primer nivel completo.

### SHOULD
- Variantes ambientales.
- Transiciones.
- Audio completo.
- Más FX de recogida/impacto.

### COULD
- sierras;
- biomas adicionales;
- shaders complejos;
- iluminación avanzada.

## Calendario de ejecución
### 7–9 oct.
Cerrar Art Bible, tooling, alien canónico y vertical slice gris.

### 10–12 oct.
Environment kit, HUD, trazo final, fondo/parallax y primera pantalla con arte.

### 13–16 oct.
Tutorial + niveles 1–3 y modo académico.

### 17–19 oct.
Niveles 4–5, nave final, audio y polish.

### 20 oct.
Congelamiento de features. Solo bugs, rendimiento y compatibilidad.

### 21–27 oct.
Pruebas Lab. 05, documentación, video, presentación y entrega.

## Criterio de calidad
Un asset entra solamente si:
1. pertenece claramente al mismo universo;
2. respeta la paleta y siluetas;
3. funciona a 1280×720;
4. no dificulta leer el puzzle;
5. tiene procedencia/licencia/IA registrada;
6. mantiene buen rendimiento.

## Documentos relacionados
- [Art Bible](art/ART_BIBLE.md)
- [Asset Pipeline](art/ASSET_PIPELINE.md)
- [Asset Manifest](art/ASSET_MANIFEST.md)
- [Visuales por nivel](art/LEVEL_VISUALS.md)
- [Registro de IA visual](art/AI_USAGE.md)
- [Arquitectura](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
