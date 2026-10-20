# Arquitectura jugable de Astro‑Trazos

`index.html` conserva el arte y los controles de las siete escenas. `src/playable.js` añade los eventos del pincel, el estado de cada nivel, las reacciones de Nilo, la tinta, las pistas opcionales y la progresión. La selección de niveles está abierta desde el inicio; las estrellas registran cuáles se completaron.

`src/geometry/brushMath.js` ofrece distancias, longitudes, áreas, intersecciones y simplificación de trayectorias. `src/geometry/shapeRecognition.js` aproxima trazos imperfectos a segmentos, círculos y polígonos. `src/geometry/routePuzzle.js` evalúa la ruta del primer nivel. Las escenas restantes usan sus propias reglas geométricas en `src/playable.js`.

Las pistas crean trazos SVG dorados con animación dentro de la escena actual. No alteran los trazos guardados, la tinta ni el resultado. Se ocultan al dibujar, cambiar de nivel o reiniciar. `scripts/make-standalone.mjs` integra los archivos necesarios en `dist/Astro-Trazos-Presentacion.html` para la presentación sin conexión.
