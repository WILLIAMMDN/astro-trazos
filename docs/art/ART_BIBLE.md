# Astro-Trazos — Art Bible

Este documento es la fuente de verdad visual del proyecto. Los nuevos assets deben respetarlo antes de integrarse.

## 1. Identidad
**Papercraft espacial + geometría vectorial + cuaderno científico.**

La escena debe sentirse artesanal y cálida, pero con efectos modernos. El universo es 2D; la profundidad se consigue mediante capas, escala, sombra, parallax y composición.

## 2. Paleta canónica

| Token | HEX | Uso |
|---|---:|---|
| space-950 | #080C1D | fondo más profundo |
| space-900 | #101630 | cielo principal |
| space-700 | #24285A | nebulosas / planos medios |
| violet-500 | #5651A6 | acentos espaciales |
| paper-100 | #FFF7E8 | papel claro / UI |
| paper-300 | #E9D9BC | bordes y cartón |
| ink-400 | #63D8F2 | tinta vectorial |
| ink-300 | #83F0E3 | glow / acciones |
| alien-500 | #49B8AA | cuerpo del protagonista |
| danger-500 | #FF626B | láseres / peligro |
| goal-500 | #FFC857 | piezas / objetivos |
| terrain-500 | #789B67 | vegetación discreta |
| graphite | #22283A | texto y contorno |

No introducir nuevos colores saturados sin justificarlo.

## 3. Forma y contorno
- Personajes y props: siluetas simples y reconocibles.
- Radio visual habitual: 12–24 px en UI a resolución lógica 1280×720.
- Contorno ilustrado: 2–4 px equivalentes en gameplay.
- Evitar líneas negras puras; usar graphite.
- Sombras: suaves, cortas, con leve desplazamiento, nunca realismo fotográfico.

## 4. Textura
El papel se comunica con:
- grano muy ligero;
- recortes imperfectos;
- pequeñas variaciones de borde;
- sombras de contacto.

La textura nunca debe competir con la lectura del puzzle.

## 5. Tipografía
- **Título / displays:** Fredoka.
- **UI y datos geométricos:** Nunito Sans.
- Fuente de respaldo: system-ui, sans-serif.

Ambas familias deben incorporarse solamente después de registrar su licencia OFL en THIRD_PARTY_NOTICES.md.

## 6. Alien canónico
- Silueta pequeña, compacta, amistosa y geométrica.
- Cabeza grande: ~48% de la altura total.
- Ojos grandes y simples; boca mínima.
- Cuerpo turquesa/cian con detalles paper/graphite.
- Tamaño visible recomendado: 72–96 px de alto a 1280×720.
- Master art: 512×512 por pose.
- Export gameplay recomendado: frames de 192×192 o 256×256 con transparencia.

### Animaciones mínimas
| Estado | Frames objetivo |
|---|---:|
| idle | 4 |
| walk/run | 6 |
| fall | 2 |
| land | 3 |
| hurt/death | 4 |
| celebrate | 4 |

Priorizar consistencia sobre cantidad de frames.

## 7. Nave
La nave accidentada es el segundo elemento icónico. Debe combinar crema/papel, graphite y acentos cian. Sus piezas recuperables usan goal-500 y glow.

## 8. Tinta vectorial
Es la mecánica visual principal:
- núcleo: ink-400;
- halo: ink-300 con baja opacidad;
- extremos redondeados;
- partículas discretas;
- mostrar longitud/ángulo cerca del trazo mientras se dibuja;
- al soltar: pulso breve → solidificación → objeto físico.

## 9. Peligros
- Peligro siempre reconoce danger-500.
- Láser: núcleo claro + halo rojo/coral.
- Pinchos: papel/cartón con borde coral.
- No depender solo del color: sumar forma triangular, iconos o animación.

## 10. Fondos
Cada nivel puede usar hasta 4 capas:
1. estrellas / nebulosa muy lejana;
2. planeta o luna;
3. montañas / siluetas;
4. foreground decorativo.

Parallax recomendado aproximado: 0.05 / 0.15 / 0.35 / 1.10 respecto a cámara.

## 11. Reglas de consistencia
- No mezclar estilos pictóricos distintos.
- No integrar directamente un asset IA sin limpieza.
- Cada asset generado debe compararse con alien, nave, plataforma y UI canónicos.
- Evitar fotorealismo, 3D render, anime, pixel art o outlines incompatibles.
- Un asset que no parece pertenecer al mismo libro de papel no entra al juego.
