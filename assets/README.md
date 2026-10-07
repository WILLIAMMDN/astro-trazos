# Assets

La producción visual se divide en fuente editable y export final.

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

El runtime **no debe depender de `assets/source`**.

Reglas:
- revisar `docs/art/ART_BIBLE.md`;
- seguir `docs/art/ASSET_PIPELINE.md`;
- comprobar `docs/art/ASSET_MANIFEST.md`;
- registrar assets externos en `THIRD_PARTY_NOTICES.md`;
- registrar apoyo de IA en `docs/art/AI_USAGE.md`.

No integrar assets generados o descargados sin limpieza, revisión visual y procedencia.
