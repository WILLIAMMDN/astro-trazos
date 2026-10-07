# Astro-Trazos

Videojuego 2D educativo de física y geometría para el curso **Computación Gráfica (IIAD65) — EPIS, UNAJMA, 2026-II**.

## Objetivo
Resolver puzles dibujando líneas, rampas y polígonos que se convierten en elementos del escenario. El proyecto prioriza la implementación propia y explicable de los algoritmos gráficos exigidos por el curso.

## Stack
- HTML5 + JavaScript (ES Modules)
- Canvas 2D como capa de renderizado
- Sin motor de física externo
- Ejecución objetivo: Chrome/Edge en Windows y Lab. 05

## Algoritmos académicos
- Matrices homogéneas 3x3: traslación, rotación, escala y composición.
- Clipping al viewport: Cohen–Sutherland para líneas.
- Colisiones: AABB, segmento–segmento y otras primitivas necesarias.
- Geometría: longitud, ángulo y área de polígonos (shoelace).
- Física simplificada: gravedad, velocidad e integración por delta time.
- Rayos/láseres: intersección de segmentos.

> **Regla del proyecto:** Canvas renderiza; la matemática y los algoritmos evaluables se implementan en módulos propios.

## Alcance
**MVP:** game loop, dibujo con mouse, tinta limitada, transformaciones, clipping, colisiones, física simple, modo debug, tutorial + 2 niveles.

**Final:** tutorial + 5 niveles, arte papercraft/vectorial, parallax, partículas, HUD, audio y demo académica.

## Niveles previstos
1. Tutorial — trazo y longitud.
2. Puente vectorial — distancia y colisión.
3. Rampa orbital — ángulo, rotación y gravedad.
4. Peso geométrico — área de polígonos.
5. Rayos — intersección de segmentos y clipping.
6. Reparación final — integración de todas las mecánicas.

## Estructura
```
src/
  core/        game loop y estado
  math/        matrices y vectores
  geometry/    cálculos geométricos
  clipping/    algoritmos de recorte
  collision/   detección de colisiones
  render/      Canvas 2D
  debug/       modo académico
assets/        arte, audio y tipografías
docs/          arquitectura, roadmap y documentación
tests/         pruebas de algoritmos
```

## Ejecución local
Por usar ES Modules, se recomienda servir el proyecto mediante un servidor HTTP local:

```bash
python -m http.server 8080
```

Luego abrir `http://localhost:8080`.

También puede usarse la extensión Live Server de VS Code.

## Flujo Git
- `main`: versión estable.
- Cada integrante trabaja en ramas `feat/*`, `fix/*`, `docs/*` o `test/*`.
- Los cambios entran mediante Pull Request.
- Todos los integrantes deben conservar commits visibles.

Consulta [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Documentación
- [Arquitectura](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Trabajo en equipo](docs/CONTRIBUTING.md)
- [Recursos y licencias](THIRD_PARTY_NOTICES.md)

## Estado
🟡 **Base técnica creada.** Próximo objetivo: input de dibujo + física/colisiones + primera prueba jugable.

## Equipo
Proyecto académico grupal. Los integrantes y roles se incorporarán cuando queden definidos.
