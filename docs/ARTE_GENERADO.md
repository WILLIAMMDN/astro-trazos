# Arte del juego

La referencia visual del menú fue aportada por el autor y se conserva en `public/assets/menu-referencia.png`. Los escenarios y el personaje se prepararon para esta versión con la herramienta integrada de generación de imágenes y se guardaron en `public/assets/`.

| Archivo | Función y guía visual |
| --- | --- |
| `despegue-papel.png` | Paisaje espacial de despegue, papercraft pintado, área libre para la viga |
| `vector-desierto.png` | Desierto espacial con pirámide y espacio libre para el lanzamiento |
| `salto-vacio.png` | Islas separadas por un abismo, sin rampa dibujada |
| `peso-vacio.png` | Balanza y puerta espacial, sin figura sobre la plataforma |
| `rayos-vacio.png` | Ruinas con sierras, emisores y portal, sin rayos ni defensas prehechos |
| `escudo-hexagono.png` | Escenario cósmico sin hexágono final |
| `nucleo-cosmico.png` | Núcleo espacial sin órbita resuelta |
| `nilo-explorador.png` | Pose de reposo del personaje con transparencia |
| `nilo-camina.png`, `nilo-salta.png`, `nilo-construye.png`, `nilo-celebra.png` | Poses activadas por movimiento, salto, pincel y victoria |
| `despegue-papel-sin-nilo.png`, `vector-desierto-sin-nilo.png`, `escudo-hexagono-sin-nilo.png`, `nucleo-cosmico-sin-nilo.png` | Versiones sin el personaje pintado en el fondo; evitan que se duplique al aparecer Nilo animado |

## Prompt final del personaje

> Create a single isolated full-body game character asset based on the small teal robot explorer on the left side of the supplied Astro-Trazos menu reference. Preserve the character identity: rounded faceted turquoise origami/papercraft head, tiny turquoise antenna with faceted tip, large expressive black-and-white eyes, small smile, subtle pink cheeks, compact white space-explorer torso with navy blue triangular emblem and navy glove/boot accents. Three-quarter view facing right, natural ready-to-walk pose, arms and legs distinct and legible for animation. Premium illustrated videogame asset with hand-cut paper edges, layered polygonal facets, painted texture, crisp navy ink outlines, warm highlights, polished studio lighting. Full body centered, feet visible, large character filling canvas, no ground, no shadow plane, no scenery, no stars, no UI, no text, no extra characters, no duplicates. Genuinely transparent alpha background and generous 5% transparent margin around silhouette.

La imagen del menú del autor sirvió como referencia de identidad del personaje. Los escenarios se generaron como fondos vacíos para que la geometría la aporte el jugador, siguiendo el estilo papercraft, la paleta y la composición de las cuatro referencias entregadas.

## Ediciones de esta revisión

Se usó la herramienta integrada `image_gen` con los cuatro escenarios originales como objetivos de edición. Prompt común: *Remove only the baked-in robot character from the left starting area; reconstruct the underlying paper terrain and sky; preserve the original composition, palette, lighting, props, and empty construction space; no new character, text, UI or completed geometry.* Se guardaron como archivos hermanos `*-sin-nilo.png` y se conservaron los fondos originales.

Para las poses se usó `nilo-explorador.png` como referencia y objetivo de edición con fondo alfa transparente. Prompt común: *Create one full-body transparent PNG game sprite of the same Nilo robot: identical turquoise faceted polygon head, single crystal antenna, huge black eyes with white highlights, pink cheeks, joyful mouth, cream chest with blue triangle, dark blue limbs and white shoes. Preserve proportions, cut-paper low-poly texture, navy outlines, palette and clean silhouette. No environment, ground, lettering, frame, other characters or duplicate limbs.*

| Pose | Variación del prompt |
| --- | --- |
| Camina | *Walking briskly to the right, one leg forward and one back, opposing arms swinging, focused happy expression.* |
| Salta | *Leaping upward and forward to the right, feet off ground, knees bent, arms raised for balance, excited face.* |
| Construye | *Holding a glowing cyan space stylus in the right hand, extended toward the right as if drawing a bridge, focused cheerful expression; no drawn structure.* |
| Celebra | *Both arms raised, one leg lifted, big delighted smile, playful victory pose.* |
