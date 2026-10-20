# Entrega Unidad I · Astro-Trazos

**Curso:** Computación Gráfica (IIAD65) · **Grupo:** 04 · **Fecha de preparación:** 20/10/2026.

| Numeral solicitado | Archivo de esta carpeta |
| --- | --- |
| 1. Código | Repositorio GitHub y `1_Codigo/` dentro de `IIAD65_G04_U1.zip` |
| 2. Informe técnico | `2_Informe.pdf` |
| 3. Manual de usuario | `3_Manual_Usuario.pdf` (7 páginas) |
| 4. Manual técnico | `4_Manual_Tecnico.pdf` (8 páginas) |
| 5. Video de demostración | `5_Video_Demostracion.mp4` y guion editable/PDF |
| 6. Presentación | `editables/6_Presentacion.pptx` y `6_Presentacion.pdf` |
| 7. Evidencia RSU | `7_Evidencias_RSU.pdf` y constancia aparte |
| 8. Ficha de proyecto | `8_Ficha_Proyecto.pdf` |
| 9. Declaración de IA | `9_Declaracion_IA.pdf` (1 página) |

Los archivos DOCX y PPTX de `editables/` facilitan revisión y corrección. Las capturas usadas en los materiales están en `../capturas/`. El juego autónomo se genera con `npm run standalone` y se incluye en el ZIP.

## Pendientes que requieren validación humana

- **Constancia DAEMON:** el PDF entregado por el equipo contiene línea de firma vacía. Obtener la firma auténtica del responsable si el docente la exige.
- **Ficha Anexo A:** falta la firma del docente y confirmar el nombre completo y las funciones de todos los integrantes. No se atribuyeron aportes de Git sin evidencia.
- **RSU:** el expediente declara autorizaciones familiares comunicadas por DAEMON y registra siete estudiantes con códigos. Conservar los permisos originales en un lugar privado; evitar publicar identidades de menores.
- **Aprendizaje:** la jornada documenta la actividad, pero no incluye medición antes/después. El informe no afirma mejora de aprendizaje.
- **Laboratorio 05:** falta ejecutar la copia autónoma y medir rendimiento en sus equipos.

## Verificación reproducible

```text
npm ci
npm run lint
npm test
npm run standalone
```

Resultado local registrado: **17 pruebas aprobadas** y lint sin errores con Node 24.15.0.
