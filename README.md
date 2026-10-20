# Astro‑Trazos

Juego de geometría con siete escenas ilustradas. El jugador construye rutas, vectores, rampas, figuras, defensas, polígonos y órbitas con el pincel. Nilo y los mecanismos reaccionan al dibujo. Todos los niveles están disponibles desde el menú.

## Jugar

Abre `dist/Astro-Trazos-Presentacion.html` en Chrome o Edge para jugar sin servidor ni conexión. Para desarrollo:

```bash
npm install
npm run dev
```

Para generar de nuevo el HTML autónomo:

```bash
npm run standalone
```

## Controles

- Selecciona cualquier nivel desde el menú. «Jugar» empieza en Despegue.
- Dibuja con ratón, lápiz o dedo. El juego ajusta los trazos aproximados a segmentos o figuras y activa el intento al soltar el pincel.
- Pulsa **Ver ejemplo** dentro de cada nivel para ver una solución dibujada sobre la escena. El ejemplo no gasta tinta ni completa el nivel por ti. Puedes ocultarlo desde el mismo botón; en la mayoría de escenas también se oculta al empezar a dibujar.
- Usa **Deshacer** para quitar el último trazo y **Reiniciar** para empezar ese nivel de nuevo.

| Escena | Construcción geométrica |
| --- | --- |
| Despegue | Dos segmentos que rodean un cometa; longitud y pendiente |
| Impulso vectorial | Vector de lanzamiento y trayectoria parabólica |
| Un salto con ingenio | Rampa, inclinación y punto de caída |
| El peso justo | Rectángulo, base × altura y área medida en vivo |
| Bloquea los rayos | Intersección entre defensas y tres láseres |
| Polígonos lejanos | Hexágono de seis lados |
| Núcleo cósmico | Órbita cerrada, radio y perímetro |

## Código

`index.html` conserva la interfaz ilustrada original. `src/playable.js` conecta el pincel, Nilo, los niveles y las pistas. `src/geometry/brushMath.js`, `routePuzzle.js` y `shapeRecognition.js` calculan las propiedades geométricas. `scripts/make-standalone.mjs` genera el archivo para presentar.

```bash
npm run lint
npm test
npm run standalone
```

Consulta [reglas de niveles](docs/LEVEL_DESIGN.md), [arquitectura](docs/ARCHITECTURE.md), [diseño pedagógico](docs/DISENO_PEDAGOGICO.md) y [demostración](docs/DEMO_PRESENTACION.md).

## Entrega de Unidad I

`docs/entrega_u1/` contiene el informe, manuales, presentación, declaración de IA, ficha y evidencia RSU; los documentos editables están en `editables/`. El ZIP final `IIAD65_G04_U1.zip` incluye una copia autónoma del juego. La constancia RSU entregada tiene la línea de firma vacía; la ficha requiere firma docente y confirmación de nombres/roles. El informe distingue la demostración realizada de una evaluación de aprendizaje, que sigue pendiente.
