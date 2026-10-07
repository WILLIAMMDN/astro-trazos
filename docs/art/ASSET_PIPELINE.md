# Pipeline de producción visual

## Flujo oficial
**Concept → master → limpieza/vectorización → export → optimización → integración → revisión ingame.**

### 1. Concept
Las imágenes conceptuales sirven como dirección, no como sprites finales.

### 2. Master
Herramientas sugeridas:
- Figma: UI, HUD, iconos, layout y componentes.
- Inkscape/Affinity/Illustrator: assets vectoriales limpios.
- Krita/Photoshop/Affinity Photo: texturas, fondos y limpieza raster.

### 3. IA generativa
Puede acelerar:
- concepts;
- fondos;
- variaciones de rocas/plantas;
- exploración de props.

No debe ser la fuente final sin revisión para:
- personaje canónico;
- UI;
- iconos funcionales;
- assets que deban coincidir frame a frame.

Proceso obligatorio para IA:
1. usar referencia canónica;
2. seleccionar una variante;
3. limpiar bordes/proporciones;
4. recolorear a la paleta;
5. eliminar artefactos;
6. exportar;
7. registrar procedencia en AI_USAGE.md.

### 4. Formatos
| Categoría | Fuente | Juego |
|---|---|---|
| UI / iconos | Figma/SVG | SVG o PNG |
| personaje | SVG/Krita | PNG/WebP transparente |
| props | SVG/raster | PNG/WebP |
| fondos | raster master | WebP |
| partículas simples | código/SVG | procedural/SVG |
| audio | WAV master | OGG/MP3 |

## Resolución
- Canvas lógico: **1280×720**.
- Diseñar fondos a mínimo 1920×1080 cuando deban cubrir toda pantalla.
- Personaje master: 512×512 por pose; export 192–256 px por frame.
- Iconos UI: master SVG; fallback PNG 2× si fuera necesario.

## Organización
```
assets/
  source/
    characters/
    environment/
    backgrounds/
    ui/
    fx/
  export/
    characters/
    environment/
    backgrounds/
    ui/
    fx/
  audio/
  manifests/
```

No referenciar `assets/source` desde el juego. El runtime consume solamente `assets/export` y `assets/audio`.

## Checklist de integración
- [ ] Respeta ART_BIBLE.md
- [ ] Nombre correcto
- [ ] Transparencia limpia
- [ ] Tamaño razonable
- [ ] Licencia/procedencia registrada
- [ ] Probado a 1280×720
- [ ] Probado sobre fondo claro y oscuro
- [ ] No reduce legibilidad del puzzle
