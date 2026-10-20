"""Generate editable course deliverables from the current Astro-Trazos build.

Run with the bundled Codex workspace Python runtime. Source PDFs supplied by
the user are copied separately; this script never alters their assertions.
"""
from pathlib import Path
from shutil import copy2
import json
from docx import Document
from docx.shared import Cm, Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pptx import Presentation
from pptx.util import Inches as PI, Pt as PP
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.text import PP_ALIGN

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "entrega_u1"
EDIT = OUT / "editables"
for folder in (OUT, EDIT): folder.mkdir(parents=True, exist_ok=True)
SHOT = ROOT / "docs" / "capturas"
FIG = OUT / "figuras"
BENCH = json.loads((OUT / 'benchmark_local.json').read_text(encoding='utf-8'))
NAVY = RGBColor(8, 31, 69)
BLUE = RGBColor(25, 86, 151)
GRAY = RGBColor(75, 85, 99)

def setup(doc, report=False):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.top_margin = sec.bottom_margin = sec.left_margin = sec.right_margin = Cm(2.5)
    styles = doc.styles
    normal = styles['Normal']; normal.font.name = 'Arial'; normal.font.size = Pt(12 if report else 10.5)
    normal.paragraph_format.line_spacing = 1.5 if report else 1.15
    normal.paragraph_format.space_after = Pt(7 if report else 6)
    for name, size in [('Title', 23), ('Heading 1', 16), ('Heading 2', 12)]:
        s = styles[name]; s.font.name = 'Arial'; s.font.size = Pt(size); s.font.bold = True; s.font.color.rgb = NAVY
    code = styles.add_style('Code', 1); code.font.name='Consolas'; code.font.size=Pt(8.5)
    code.paragraph_format.space_after=Pt(6); code.paragraph_format.line_spacing=1.05
    footer = sec.footer.paragraphs[0]; footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run('ASTRO-TRAZOS  •  UNAJMA  •  2026-II     |     Página ')
    field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)
    return doc

def title(doc, heading, subtitle, kind):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run('UNIVERSIDAD NACIONAL JOSÉ MARÍA ARGUEDAS').bold=True
    p=doc.add_paragraph('Computación Gráfica · Unidad I · IIAD65 · Grupo 04'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('\n')
    p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run(heading)
    p=doc.add_paragraph(subtitle); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('\n')
    p=doc.add_paragraph(f'Tipo de documento: {kind}\nVersión: 20 de octubre de 2026\nRepositorio: https://github.com/WILLIAMMDN/astro-trazos')
    doc.add_paragraph('Equipo consignado en el informe previo: Max William Medina Castro; Neil Angelo Hiyo Juarez Anderson; Allcca Mauycalla (nombre completo por confirmar).')
    doc.add_paragraph('Roles propuestos para la exposición: Max — integración y programación; Neil — diseño pedagógico y pruebas; Allcca — arte e interfaz. Confirmar distribución real con el grupo.')
    doc.add_paragraph('Docente: Mtro. Jhamer Anderson Rojas Silva.')
    p=doc.add_paragraph('Andahuaylas, Perú · 2026'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER

def para(doc, text): return doc.add_paragraph(text)
def h(doc, text, level=1): doc.add_heading(text, level)
def bullets(doc, items):
    for item in items: doc.add_paragraph(item, style='List Bullet')
def table(doc, heads, rows):
    t=doc.add_table(rows=1, cols=len(heads)); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for c,v in zip(t.rows[0].cells, heads): c.text=v
    for row in rows:
        cells=t.add_row().cells
        for c,v in zip(cells,row): c.text=str(v)
    return t
def pic(doc, name, caption, width=15.5):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(SHOT/name), width=Cm(width))
    p=doc.add_paragraph(caption); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for r in p.runs: r.italic=True; r.font.size=Pt(9)
def figure(doc, name, caption, width=15.5):
    p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(FIG/name),width=Cm(width))
    p=doc.add_paragraph(caption);p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for r in p.runs:r.italic=True;r.font.size=Pt(9)
def codeblock(doc, lines):
    doc.add_paragraph('\n'.join(lines),style='Code')
def page(doc): doc.add_page_break()
def save(doc, name): doc.save(EDIT/name)

# Report — the eleven parts follow the teacher's required order.
d=setup(Document(), report=True)
title(d, '1. ASTRO-TRAZOS', 'Videojuego 2D educativo con geometría dibujada', 'Informe técnico de avance')
page(d)
h(d,'2. Resumen')
para(d,'Astro-Trazos es un videojuego 2D para estudiantes de 9 a 12 años que convierte trazos dibujados en construcciones geométricas funcionales. El jugador crea rutas, vectores, rampas, rectángulos, barreras, polígonos y órbitas. Cada escena muestra medidas y una consecuencia visual: el personaje se desplaza, una trayectoria cae, la balanza reacciona o un rayo se detiene en una intersección. El proyecto responde a la necesidad de explorar geometría mediante ensayo, observación y corrección dentro de un entorno lúdico. La versión actual contiene siete escenas seleccionables, pistas visuales opcionales y una copia HTML autónoma para demostración sin conexión. Su implementación usa SVG y JavaScript modular; integra transformaciones homogéneas de 3 × 3, recorte Cohen–Sutherland al viewport y detección de colisiones de segmentos con descarte AABB. La verificación automatizada actual comprende 17 pruebas y la ejecución de lint. El 18 de octubre de 2026 se documentó una jornada virtual de demostración con siete estudiantes de la Academia Virtual DAEMON. Esta evidencia acredita la actividad, pero no establece una mejora de aprendizaje medida. El trabajo pendiente incluye observación pedagógica con una rúbrica antes/después y validación presencial en el Laboratorio 05.')
h(d,'3. Introducción')
para(d,'Los conceptos de longitud, ángulo, área, intersección y polígono suelen verse como resultados numéricos. Aquí se presentan como propiedades de objetos que el alumno construye con el pincel. La pregunta de diseño es si una forma creada y ajustada por el estudiante puede explicar una consecuencia del juego con claridad suficiente para volver a intentarlo.')
para(d,'Objetivo general: desarrollar un videojuego 2D educativo que use algoritmos de computación gráfica para que niños de 9 a 12 años experimenten con propiedades geométricas. Objetivos específicos: (a) implementar transformaciones, clipping y colisiones; (b) relacionar cada construcción con una medida observable; (c) ofrecer ejemplos visuales opcionales; (d) comprobar la ejecución y documentar la intervención RSU.')
h(d,'4. Marco teórico')
para(d,'Un punto plano se representa como p = (x, y, 1). Una transformación afín se aplica como p′ = T·R·S·p, donde T traslada, R rota y S escala. En el juego, esta composición coloca y anima a Nilo en cada escena. El recorte Cohen–Sutherland asigna códigos de región a los extremos y conserva la parte de cada segmento dentro del viewport. Esto evita dibujar trazos fuera de la escena.')
para(d,'p′ = T(x,y) · R(θ) · S(sx,sy) · p.                                           (1)')
para(d,'Una colisión entre segmentos se calcula con parámetros p + t·r y q + u·s. Cuando el producto cruzado de r y s es distinto de cero y t,u pertenecen a [0,1], existe un cruce. Una caja envolvente AABB descarta pares imposibles antes de calcular la intersección precisa. Para un rectángulo, A = base × altura; las longitudes del nivel se expresan en unidades de la escena, no en centímetros físicos.')
para(d,'t = ((q − p) × s) / (r × s),    u = ((q − p) × r) / (r × s).                    (2)')
para(d,'A = base × altura; 40 u × 30 u = 1200 u².                                  (3)')
h(d,'5. Análisis y diseño')
para(d,'Beneficiarios previstos: escolares de 9 a 12 años. La interacción principal usa ratón, táctil o lápiz. Los trazos imperfectos se aproximan a la primitiva del nivel: segmento, rectángulo en pasos de 5 u, hexágono o curva orbital. El ejemplo visual enseña una solución posible sin gastar tinta y sin completar el nivel. Al soltar el pincel se evalúa el intento y se activa la simulación aunque falle.')
para(d,'Tabla 1. Relación entre las escenas y los conceptos. Fuente: elaboración propia a partir del juego.')
table(d,['Escena','Propiedad','Respuesta visible'],[
 ('Despegue','Longitud y pendiente de dos segmentos','Nilo sigue la ruta y evita o toca el cometa'),
 ('Impulso vectorial','Vector y ángulo','Trayectoria parabólica y aterrizaje'),
 ('Un salto con ingenio','Ángulo de rampa','Predicción de caída y salto'),
 ('El peso justo','Base, altura y área','Producto en vivo y balanza'),
 ('Bloquea los rayos','Intersección de segmentos','Cada rayo se detiene en el cruce'),
 ('Polígonos lejanos','Hexágono cerrado','Escudo de seis lados'),
 ('Núcleo cósmico','Radio y perímetro','Órbita cerrada alrededor del núcleo')])
pic(d,'01_menu.png','Figura 1. Menú real de la versión evaluada. Fuente: captura propia, 20/10/2026.',14.5)
h(d,'6. Implementación')
para(d,'La interfaz ilustrada y las escenas SVG viven en index.html. src/playable.js administra eventos del pincel, estado, tinta, animaciones, pistas, mediciones y simulaciones. src/geometry contiene simplificación, reconocimiento de formas y reglas de ruta. src/math/Mat3.js compone transformaciones. src/clipping/CohenSutherland.js recorta los trazos antes de convertirlos a rutas visibles. src/collision/Collisions.js ofrece AABB e intersección de segmentos para las barreras láser.')
para(d,'Flujo: entrada del puntero → puntos crudos → simplificación/ajuste → cálculo de magnitudes → evaluación de la escena → animación y retroalimentación. En El peso justo, el arrastre cuantiza base y altura a múltiplos de 5 u; se muestra A = b·h mientras el jugador ajusta. La figura de 40 u × 30 u produce 1200 u². En Bloquea los rayos, la intersección calculada recorta visualmente cada haz y decide si la defensa funciona.')
pic(d,'09_peso_construccion.png','Figura 2. Medidas de base, altura y área durante la construcción. Fuente: captura propia, 20/10/2026.',14.5)
h(d,'7. Pruebas y resultados')
para(d,'Se ejecutaron npm test y npm run lint en Node 24.15.0. Resultado registrado: 17 pruebas aprobadas y lint sin errores. Las pruebas cubren ajuste de trazos, reglas de ruta, reconocimiento de formas, matrices, clipping y colisiones. Una prueba manual en Chrome verificó que el arrastre de la escena de área construye 40 u × 30 u = 1200 u² y que la interfaz no emite errores de página. También se generó una copia HTML autónoma.')
para(d,'Tabla 2. Verificación funcional. Fuente: ejecución local del proyecto, 20/10/2026.')
table(d,['Criterio','Resultado actual','Alcance'],[
 ('Escenas seleccionables','7 de 7','Verificado en el menú'),
 ('Pruebas automatizadas','17 aprobadas','Lógica y algoritmos gráficos'),
 ('Lint','Sin errores','Código src/ y tests/'),
 ('Portabilidad','HTML autónomo generado','Abrir en Chrome/Edge; falta prueba en Lab 05'),
 ('Aprendizaje medido','Sin medición','Requiere instrumento pedagógico')])
para(d,'La fidelidad de la medición depende de la escala de cada escena y de la cuantización del pincel. Las unidades u son unidades internas; las etiquetas de píxeles corresponden al espacio SVG. No se presenta una cifra de FPS del Laboratorio 05 porque no se realizó esa medición en su equipo.')
para(d,'Tabla 3. Tiempo local de 100 000 llamadas en Node 24.15.0, mediana de cinco rondas tras calentamiento. Fuente: scripts/bench-graphics.mjs y benchmark_local.json.')
table(d,['Operación','Tiempo','Alcance'],[
 ('Matriz 3×3 y punto',f'{BENCH["matrix"]} ms','Sin SVG'),
 ('Clipping de segmento',f'{BENCH["clipping"]} ms','Sin renderizado'),
 ('Intersección de segmentos',f'{BENCH["intersection"]} ms','Sin FPS')])
para(d,'Estos tiempos de algoritmos excluyen renderizado y no representan FPS del juego ni del Laboratorio 05.')
h(d,'8. Responsabilidad social universitaria')
para(d,'La evidencia proporcionada por el equipo documenta la Jornada Especial de Geometría Digital «Aprender geometría a través del juego», realizada por Google Meet el 18 de octubre de 2026 para siete estudiantes de la Academia Virtual DAEMON. Registra capturas del menú, un desafío de bloqueo de rayos y un nivel completado; la lista usa códigos E-01 a E-07 para proteger identidades. La constancia identifica a William Medina como responsable de DAEMON y miembro del equipo universitario. La línea de firma del documento entregado está vacía. Las autorizaciones familiares se declaran en el expediente, sin adjuntar formularios individuales. Estas piezas deben revisarse según el criterio del docente.')
para(d,'La actividad fue una demostración interactiva; las evidencias recibidas no contienen una evaluación pre y post ni permiten inferir un efecto causal en el aprendizaje. Se propone una sesión posterior con dos problemas equivalentes, una rúbrica de explicación de medidas y registro anónimo de intentos.')
para(d,'Ética y uso responsable: el juego no recopila datos personales. Las capturas del expediente muestran al expositor y usan códigos para los alumnos; cualquier autorización familiar original debe conservarse de forma privada. Los recursos visuales y tipográficos se documentan en ARTE_GENERADO.md y THIRD_PARTY_NOTICES.md.')
h(d,'9. Conclusiones y trabajo futuro')
bullets(d,[
 'Se implementaron siete escenas donde la geometría dibujada altera el comportamiento del juego.',
 'La transformación de Nilo, el clipping del trazo y las colisiones de láser cumplen las técnicas gráficas exigidas.',
 'La lógica automática pasó 17 pruebas; la medición de aprendizaje y el ensayo en Lab 05 continúan pendientes.',
 'Para la entrega final se debe completar la firma de la constancia y de la ficha, confirmar roles y verificar que cada integrante pueda explicar su contribución.'])
h(d,'10. Referencias (APA 7)')
for ref in [
 'Eck, D. J. (2023). Introduction to computer graphics (Version 1.4). Hobart and William Smith Colleges. https://math.hws.edu/graphicsbook/',
 'Guha, S. (2022). Computer graphics through OpenGL: From theory to experiments (3rd ed.). CRC Press.',
 'Hearn, D., & Baker, M. P. (2006). Computer graphics with OpenGL (3rd ed.). Pearson.',
 'Hughes, J. F., van Dam, A., McGuire, M., Sklar, D. F., Foley, J. D., Feiner, S. K., & Akeley, K. (2014). Computer graphics: Principles and practice (3rd ed.). Addison-Wesley.',
 'Rojas Silva, J. A. (2026). Indicaciones del Proyecto Unidad I: Computación Gráfica [Guía de curso]. Universidad Nacional José María Arguedas.']:
    para(d,ref)
h(d,'11. Anexos')
para(d,'A. Repositorio y código: https://github.com/WILLIAMMDN/astro-trazos. B. Manual de usuario y manual técnico adjuntos. C. Capturas de las siete escenas en docs/capturas. D. Expediente RSU original de ocho páginas y constancia aportada por el equipo. E. Declaración de uso de IA. F. Comandos de reproducción: npm ci, npm test, npm run lint, npm run standalone.')
save(d,'2_Informe.docx')

# User manual: seven deliberate pages; each screen screenshot comes from running build.
d=setup(Document()); title(d,'ASTRO-TRAZOS','Dibuja · prueba · descubre geometría','Manual de usuario')
page(d); h(d,'1. Qué es y qué necesitas')
para(d,'Astro-Trazos es un juego de geometría para edades aproximadas de 9 a 12 años. Dibujas directamente sobre cada mapa. El juego interpreta el trazo y muestra qué ocurre con su forma y sus medidas. Puedes abrir cualquier nivel desde el menú.')
bullets(d,['Equipo con Windows, macOS o Linux y navegador Chrome o Edge actualizado.','Ratón, panel táctil, pantalla táctil o lápiz; pantalla de 1280 × 720 recomendada.','Para usar el archivo Astro-Trazos-Presentacion.html no se requiere Internet ni instalar Node. El rendimiento en Lab. 05 aún debe verificarse.'])
h(d,'2. Inicio rápido')
for s in ['Descarga la entrega y descomprime el ZIP en una carpeta.','Abre 1_Codigo/dist/Astro-Trazos-Presentacion.html en Chrome o Edge.','Pulsa Jugar para iniciar Despegue o selecciona una tarjeta de nivel.','Lee el objetivo visible, dibuja con el pincel y suelta para ver el resultado.','Usa Ver ejemplo si necesitas observar una construcción posible.']:
    d.add_paragraph(s,style='List Number')
pic(d,'01_menu.png','Figura 1. Elige un nivel desde el menú.',14.7)
page(d); h(d,'3. Controles y lectura de la pantalla')
table(d,['Control','Acción'],[('Arrastrar sobre el mapa','Dibujar o ajustar una figura'),('Ver ejemplo','Mostrar u ocultar pista visual'),('Deshacer / Z','Retirar el último trazo'),('Borrar / Reiniciar / R','Empezar la escena otra vez'),('Jugar','Probar la construcción cuando la escena lo indique'),('Pausa / Esc','Abrir o cerrar el menú de pausa')])
para(d,'La barra «Tinta restante» muestra el recurso que queda. Las medidas junto a tu construcción expresan unidades internas del juego. Las estrellas en el menú señalan avances; los niveles permanecen disponibles.')
pic(d,'02_despegue.png','Figura 2. Objetivo, mapa y tinta visible en Despegue.',14.7)
page(d); h(d,'4. Primer recorrido: ruta y vector')
para(d,'Despegue: observa el inicio, el cohete y el cometa. Dibuja dos segmentos conectados que creen una ruta libre. Cuando termines, Nilo la recorre; si hay un choque, cambia el punto intermedio. La longitud y la inclinación modifican el recorrido.')
para(d,'Impulso vectorial: dibuja una flecha desde la plataforma. Su dirección y longitud determinan el movimiento inicial. Observa la trayectoria y cambia el extremo si no aterriza donde esperabas.')
pic(d,'03_vector.png','Figura 3. Escena de vector y trayectoria.',14.7)
page(d); h(d,'5. Rampa y área: ejemplo completo')
para(d,'Un salto con ingenio: dibuja una rampa hacia la pieza. La escena muestra el ángulo; al probar, la orientación cambia el salto de Nilo.')
para(d,'El peso justo: objetivo 1200 u². Piensa en dos factores de 1200, por ejemplo 40 × 30. Arrastra de una esquina a la opuesta. La base y altura cambian en pasos de 5 u y el área aparece durante el arrastre. Suelta al ver 40 u, 30 u y 1200 u²; la balanza comprueba el peso.')
pic(d,'09_peso_construccion.png','Figura 4. Ejemplo: 40 u × 30 u = 1200 u².',14.7)
page(d); h(d,'6. Defensas, escudos y órbitas')
para(d,'Bloquea los rayos: dibuja barreras que crucen cada rayo rojo. El punto donde se cruzan detiene el láser. Una barrera que no toca el haz no lo bloquea.')
para(d,'Polígonos lejanos: conecta seis esquinas para formar un escudo hexagonal cerrado. Núcleo cósmico: dibuja una órbita cerrada alrededor del centro, manteniendo una distancia similar durante el recorrido.')
pic(d,'06_rayos.png','Figura 5. Las defensas cortan los láseres en su intersección.',14.7)
page(d); h(d,'7. Galería de las otras escenas')
para(d,'Estas pantallas completan el recorrido visual de los siete desafíos. En cada una, el objetivo aparece arriba y la tinta disponible a la derecha.')
pic(d,'04_salto.png','Figura 6. Salto: construye una rampa y observa su ángulo.',13)
pic(d,'07_poligonos.png','Figura 7. Polígonos: une seis vértices para cerrar el escudo.',13)
page(d); h(d,'8. Órbita y cierre del recorrido')
para(d,'En Núcleo cósmico, comienza en una marca, rodea el centro y vuelve al inicio. Observa si el radio se mantuvo casi constante y si el contorno quedó cerrado. Puedes volver al menú y repetir cualquier nivel.')
pic(d,'08_orbita.png','Figura 8. Órbita: radio y cierre alrededor del núcleo.',14.7)
page(d); h(d,'9. Problemas frecuentes y apoyo')
table(d,['Situación','Qué hacer'],[('No se dibuja','Empieza dentro del área del mapa y mantén presionado mientras arrastras.'),('La figura no parece correcta','Usa Deshacer; dibuja un gesto continuo y observa el ajuste final.'),('Se acabó la tinta','Pulsa Reiniciar o Borrar para recuperar el depósito.'),('No se abre el HTML','Extrae el ZIP y abre el archivo con Chrome/Edge.'),('No sé cómo empezar','Pulsa Ver ejemplo; después dibuja tu propia solución.')])
para(d,'Contacto del proyecto: https://github.com/WILLIAMMDN/astro-trazos/issues. Para la presentación, usa el archivo HTML autónomo incluido en el paquete.')
save(d,'3_Manual_Usuario.docx')

# Technical manual, seven sections/pages.
d=setup(Document()); title(d,'ASTRO-TRAZOS','Arquitectura, algoritmos y reproducción','Manual técnico')
page(d); h(d,'1. Plataforma y estructura')
para(d,'Aplicación cliente con HTML, CSS, SVG y JavaScript ES modules. Herramientas verificadas: Node 24.15.0, Vite 8.3.4, Vitest 5.0.5 y ESLint 10.13.0. No usa backend ni datos personales. La versión autónoma empaqueta los recursos para abrirse localmente.')
para(d,'Tabla 1. Módulos principales y responsabilidad. Fuente: código del proyecto.')
table(d,['Ruta','Responsabilidad'],[('index.html','Escenas ilustradas y controles'),('src/playable.js','Entrada, estados, simulaciones y HUD'),('src/geometry/','Métricas, rutas y reconocimiento'),('src/math/Mat3.js','Transformaciones 2D homogéneas'),('src/clipping/CohenSutherland.js','Recorte al viewport'),('src/collision/Collisions.js','AABB e intersección'),('tests/','Pruebas automatizadas'),('scripts/make-standalone.mjs','HTML autónomo')])
page(d); h(d,'2. Arquitectura y flujo gráfico')
para(d,'Arquitectura: navegador → eventos pointer → estado de escena → ajuste geométrico → evaluador de nivel → animación SVG → HUD. El menú, la escena activa, el modal de pausa y el resultado son estados de la interfaz. Los trazos se almacenan por escena y se pueden deshacer o borrar.')
para(d,'Pipeline de dibujo: (1) capturar coordenadas del puntero en el viewBox; (2) simplificar puntos y reconocer la intención geométrica; (3) cuantizar o ajustar cuando corresponde; (4) calcular longitud, ángulo, área o intersección; (5) recortar lo visible al viewport; (6) evaluar condiciones; (7) animar el resultado. La pista visual se dibuja en una capa separada y no altera el estado.')
figure(d,'arquitectura.png','Figura 1. Módulos implementados y sus dependencias. Fuente: elaboración propia.',14.5)
figure(d,'pipeline.png','Figura 2. Del gesto al resultado visual. Fuente: elaboración propia.',14.5)
page(d); h(d,'3. Transformaciones y clipping')
para(d,'Mat3 representa matrices afines 3 × 3. La composición usada para Nilo es M = T(x,y)·R(θ)·S(sx,sy). Se aplica a un punto homogéneo [x,y,1]ᵀ. El orden coloca al personaje, orienta su pose y ajusta su escala sin cambiar la geometría original del sprite.')
para(d,'M = T(x,y) · R(θ) · S(sx,sy).                                          (1)')
codeblock(d,['// src/playable.js: composición afín para ubicar a Nilo',
 'const matrix = Mat3.multiply(Mat3.multiply(',
 '  Mat3.translation(x, y), Mat3.rotation(tilt * Math.PI / 180)),',
 '  Mat3.scale(scale, scale));'])
para(d,'Cohen–Sutherland asigna códigos de región izquierdo, derecho, superior e inferior. Si ambos extremos tienen código cero, acepta el segmento; si comparten un bit externo, lo rechaza; en otro caso, calcula la intersección con el borde y repite. Los caminos del pincel usan este recorte antes de formar su ruta SVG visible.')
codeblock(d,['// src/clipping/CohenSutherland.js: rechazo trivial',
 'if (!(ca | cb)) return [a, b];  // ambos dentro del viewport',
 'if (ca & cb) return null;       // fuera por el mismo lado'])
para(d,'Archivos clave: src/math/Mat3.js, src/clipping/CohenSutherland.js y función clippedLinePath en src/playable.js. El viewBox es el sistema común para entrada y dibujo.')
page(d); h(d,'4. Colisiones y matemáticas jugables')
para(d,'El segmento A(t)=p+t·r y B(u)=q+u·s se cruza cuando 0≤t,u≤1. Se obtiene t=(q−p)×s/(r×s) y u=(q−p)×r/(r×s). Si r×s≈0, el caso paralelo no produce cruce único. Una prueba AABB descarta segmentos separados antes de calcular t y u. El láser termina en la primera intersección encontrada.')
para(d,'t = ((q−p)×s)/(r×s); u = ((q−p)×r)/(r×s).                           (2)')
codeblock(d,['// src/collision/Collisions.js: tramo de intersección exacta',
 'if (Math.abs(den) < 1e-9) return null; // paralelas',
 'if (t < 0 || t > 1 || u < 0 || u > 1) return null;',
 'return { x: a.x + t*(b.x-a.x), y: a.y + t*(b.y-a.y), t, u };'])
para(d,'Área: A=b·h; la escena cuantiza dimensiones a 5 u para hacer construible el valor 1200 u². Vector: componentes Δx,Δy y ángulo atan2. Rampa: inclinación atan2(−Δy,Δx). Órbita: cierre del contorno y dispersión de radios. Polígono: número de lados y cierre. La lógica de cada escena está en src/playable.js; los cálculos reutilizables están en src/geometry/.')
para(d,'A = base × altura = 40 u × 30 u = 1200 u².                         (3)')
pic(d,'06_rayos.png','Figura 3. Láseres con colisiones entre segmentos. Fuente: captura propia, 20/10/2026.',13.5)
page(d); h(d,'5. Instalación y construcción')
for s in ['Clonar: git clone https://github.com/WILLIAMMDN/astro-trazos.git','Entrar a la carpeta: cd astro-trazos','Instalar dependencias reproducibles: npm ci','Servidor de desarrollo: npm run dev','Comprobaciones: npm run lint y npm test','Empaquetar demo: npm run standalone','Abrir dist/Astro-Trazos-Presentacion.html en Chrome o Edge.']:
    para(d,s)
para(d,'No editar manualmente dist: es generado y está ignorado por Git. La carpeta 1_Codigo del ZIP incluye una copia lista para la exposición.')
page(d); h(d,'6. Pruebas, rendimiento y límites')
para(d,'Al 20 de octubre de 2026 se verificaron 17 pruebas Vitest aprobadas y ESLint sin errores. Se comprobó manualmente el arrastre de 40 u × 30 u en Chrome. La medición de FPS y la ejecución en los equipos concretos del Laboratorio 05 siguen pendientes; una cifra obtenida en un navegador automatizado no sustituye esa prueba.')
para(d,'Tabla 2. Rendimiento local de algoritmos en Node v24.15.0, Windows. Cada tiempo es la mediana de cinco rondas de 100 000 llamadas tras calentamiento. Fuente: scripts/bench-graphics.mjs.')
table(d,['Operación','Tiempo local','Alcance'],[
 ('Matriz 3×3 y punto',f'{BENCH["matrix"]} ms','Sin SVG'),
 ('Clipping de segmento',f'{BENCH["clipping"]} ms','Sin renderizado'),
 ('Intersección de segmentos',f'{BENCH["intersection"]} ms','Sin FPS')])
para(d,'Límites: las unidades dependen del espacio de escena, el reconocimiento aproxima trazos, y aún no hay evaluación controlada de aprendizaje. La adaptación a pantallas pequeñas y dispositivos antiguos requiere prueba adicional. No se recogen datos personales de niños en el juego.')
pic(d,'08_orbita.png','Figura 4. Escena orbital de la versión actual. Fuente: captura propia, 20/10/2026.',14)
page(d); h(d,'7. Mantenimiento y trazabilidad')
para(d,'Para agregar una escena: definir su SVG y objetivos, registrar estado y tinta en playable.js, implementar ajuste geométrico y evaluación, añadir al menú y crear pruebas de las condiciones matemáticas. Mantener el arte original y las fuentes en docs/ARTE_GENERADO.md y THIRD_PARTY_NOTICES.md. Revisar git log para contribuciones reales; no atribuir commits inexistentes.')
para(d,'Diagrama lógico: puntero → brushMath / shapeRecognition → evaluador → collision/Mat3/clipping → SVG + retroalimentación. Referencias de curso y fórmulas constan en el informe técnico.')
save(d,'4_Manual_Tecnico.docx')

d=setup(Document()); h(d,'FICHA DEL PROYECTO · UNIDAD I')
para(d,'Computación Gráfica · IIAD65 · Grupo 04 · UNAJMA · 20 de octubre de 2026')
table(d,['Campo','Información'],[
 ('Curso y grupo','Computación Gráfica IIAD65 · Grupo 04'),
 ('Integrantes y roles propuestos','Max William Medina Castro — programación e integración; Neil Angelo Hiyo Juarez Anderson — diseño pedagógico y pruebas; Allcca Mauycalla [nombre completo pendiente] — arte e interfaz. Roles sugeridos para organizar la exposición; el equipo debe confirmarlos.'),
 ('Tema','Videojuego 2D educativo con sprites vectoriales'),
 ('Problema','La geometría suele enseñarse sin una consecuencia visual manipulable por el alumno.'),
 ('Objetivo','Construir y probar figuras geométricas dibujadas que alteren siete desafíos jugables.'),
 ('Tecnología','HTML, CSS, SVG, JavaScript, Vite, Vitest'),
 ('Algoritmos','Matrices afines 3 × 3, Cohen–Sutherland, AABB e intersección de segmentos, reconocimiento de formas'),
 ('Beneficiario RSU','Academia Virtual DAEMON; jornada virtual del 18/10/2026; siete estudiantes registrados por código'),
 ('Repositorio','https://github.com/WILLIAMMDN/astro-trazos'),
 ('Estado de validación','Pruebas automatizadas: 17 aprobadas. Lab 05 y evaluación de aprendizaje: pendientes.')])
para(d,'Firma del docente: ____________________________________    Fecha: ____________')
save(d,'8_Ficha_Proyecto.docx')

d=setup(Document()); h(d,'DECLARACIÓN DE USO DE IA')
para(d,'Astro-Trazos · Computación Gráfica · UNAJMA · Grupo 04 · 20 de octubre de 2026')
para(d,'El equipo declara el uso de ChatGPT/Codex como apoyo para revisar requisitos, proponer y editar código, elaborar textos de documentación, preparar pruebas y organizar la entrega. Algunas ilustraciones del juego se generaron o editaron con herramientas de imagen asistida por IA; sus fuentes y decisiones de integración se registran en docs/ARTE_GENERADO.md. La IA también ayudó a crear este documento y la presentación.')
para(d,'La selección de mecánicas, revisión del resultado, ejecución del juego y validación de las afirmaciones corresponden al equipo. Las pruebas automatizadas verifican lógica de software; no prueban aprendizaje en niños. La evidencia RSU se incorpora tal como fue aportada; la constancia tiene línea de firma pendiente. No se inventaron resultados, participantes ni contribuciones de Git.')
para(d,'Herramientas y uso específico: ChatGPT/Codex (programación y redacción); generador de imágenes asistido por IA (fondos/elementos visuales según bitácora de arte). El código fuente y los documentos editables permiten revisión humana. Cada integrante debe poder explicar los algoritmos y mostrar su aporte verificable.')
para(d,'Responsable de validación y firma del equipo: ____________________________________')
save(d,'9_Declaracion_IA.docx')

d=setup(Document()); title(d,'GUION DE DEMOSTRACIÓN','Video de 3–5 min y exposición de 8–12 min','Guion y lista de captura')
page(d)
table(d,['Tiempo','Acción real en pantalla','Concepto oral/subtítulo'],[
 ('0:00–0:25','Menú; mostrar siete escenas','Cada forma dibujada se convierte en una acción geométrica.'),
 ('0:25–1:05','Despegue y vector; usar pincel','Segmentos, dirección y trayectoria.'),
 ('1:05–2:10','El peso justo: arrastrar 40 × 30','La base por la altura construye 1200 u² y activa la balanza.'),
 ('2:10–3:05','Bloquea los rayos: dibujar defensas','La intersección real detiene cada láser.'),
 ('3:05–3:35','Mostrar escudo y órbita; pruebas','Siete escenas, 17 pruebas aprobadas.'),
 ('3:35–3:50','Cierre y RSU','Se documentó una jornada con siete estudiantes; aprendizaje aún por medir.')])
para(d,'Capturar el juego funcionando, no una maqueta. Subtitular los pasos. Para la exposición en vivo, reservar un minuto para abrir el HTML autónomo y otro para enseñar la estructura del repositorio y las pruebas.')
save(d,'5_Guion_Demostracion.docx')

# Presentation: 10 large-format slides, screenshots as evidence, no stock art.
prs=Presentation(); prs.slide_width=PI(13.333); prs.slide_height=PI(7.5)
def slide(title, subtitle='', img=None, points=None):
    s=prs.slides.add_slide(prs.slide_layouts[6]); bg=s.background.fill; bg.solid(); bg.fore_color.rgb=PRGB(8,24,54)
    tb=s.shapes.add_textbox(PI(.65),PI(.35),PI(12),PI(.8)); p=tb.text_frame.paragraphs[0]; p.text=title; p.font.name='Arial'; p.font.size=PP(30); p.font.bold=True; p.font.color.rgb=PRGB(255,230,174)
    if subtitle:
        t=s.shapes.add_textbox(PI(.68),PI(1.18),PI(12),PI(.6)); p=t.text_frame.paragraphs[0]; p.text=subtitle; p.font.size=PP(16); p.font.color.rgb=PRGB(218,234,255)
    if img:
        s.shapes.add_picture(str(SHOT/img),PI(.7),PI(1.88),width=PI(8.3),height=PI(4.67))
    if points:
        x=PI(9.25) if img else PI(.85); w=PI(3.4) if img else PI(11.7)
        box=s.shapes.add_textbox(x,PI(1.85),w,PI(4.9)); tf=box.text_frame; tf.word_wrap=True
        for i,point in enumerate(points):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.text='• '+point; p.font.name='Arial'; p.font.size=PP(18 if img else 23); p.font.color.rgb=PRGB(247,249,255); p.space_after=PP(18)
    f=s.shapes.add_textbox(PI(.7),PI(7.05),PI(12),PI(.2)); p=f.text_frame.paragraphs[0]; p.text=f'ASTRO-TRAZOS  ·  UNAJMA 2026-II                                         {len(prs.slides):02d}/10'; p.font.size=PP(10); p.font.color.rgb=PRGB(148,189,227)
slide('Astro-Trazos','Geometría en movimiento · Proyecto de Computación Gráfica', '01_menu.png',['Grupo 04','Siete escenas jugables','Niños de 9 a 12 años'])
slide('Problema y propósito','Que una construcción geométrica produzca un resultado visible', '02_despegue.png',['Dibujar','Probar','Observar','Ajustar'])
slide('Mecánica central','El pincel crea objetos medibles', '03_vector.png',['Trazos aproximados se ajustan','Las medidas gobiernan la simulación','El error también se pone a prueba'])
slide('Siete desafíos','Una propiedad distinta en cada escena',None,['Ruta: longitud y pendiente   •   Vector: dirección','Rampa: ángulo   •   Balanza: área','Láseres: intersección   •   Escudo: polígono','Órbita: radio y cierre'])
slide('Ejemplo: El peso justo','40 u × 30 u = 1200 u²', '09_peso_construccion.png',['Medidas mientras arrastras','Pasos de 5 unidades','La balanza reacciona al área'])
slide('Intersección que funciona','Una barrera detiene un láser donde lo cruza', '06_rayos.png',['AABB descarta pares lejanos','Intersección calcula el punto','El haz termina en ese punto'])
slide('Algoritmos gráficos','Técnicas solicitadas para el tema 7',None,['Transformación: M = T · R · S (matriz 3 × 3)','Clipping: Cohen–Sutherland; c₁ & c₂ ≠ 0 → rechazar','Colisión: t = ((q−p) × s) / (r × s)','Área: A = base × altura'])
slide('Arquitectura y verificación','Del puntero al resultado', '07_poligonos.png',['Puntero → ajuste → medida → evaluación → animación','Node 24 · Vite 8 · Vitest 5','17 pruebas aprobadas · lint limpio'])
slide('RSU documentada','Jornada virtual del 18 de octubre de 2026',None,['Academia Virtual DAEMON','Siete estudiantes identificados por códigos','Capturas de menú, desafío y cierre','Sin medición de aprendizaje pre/post'])
slide('Demostración y próximos pasos','Construir, explicar y comprobar', '08_orbita.png',['Demo sin conexión disponible','Ensayo pendiente en Laboratorio 05','Rúbrica de aprendizaje por aplicar','Firma de constancia pendiente'])
prs.save(EDIT/'6_Presentacion.pptx')

source=Path(r'C:\Users\MEDINA\Downloads\7_Evidencias_RSU_Astro_Trazos_UNAJMA_FINAL_7_PARTICIPANTES.pdf')
if source.exists(): copy2(source, OUT/'7_Evidencias_RSU.pdf')
cert=Path(r'C:\Users\MEDINA\Downloads\Constancia_DAEMON_FINAL_7_PARTICIPANTES.pdf')
if cert.exists(): copy2(cert, OUT/'7_Constancia_DAEMON_sin_firma.pdf')
print(f'Created editable deliverables in {EDIT}')
