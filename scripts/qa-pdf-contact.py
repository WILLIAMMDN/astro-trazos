from pathlib import Path
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

root=Path('docs/entrega_u1')
files=['2_Informe.pdf','3_Manual_Usuario.pdf','4_Manual_Tecnico.pdf','5_Guion_Demostracion.pdf','8_Ficha_Proyecto.pdf','9_Declaracion_IA.pdf']
pages=[]
for name in files:
    doc=pdfium.PdfDocument(root/name)
    for j in range(len(doc)):pages.append((name,j,doc[j].render(scale=.5).to_pil().convert('RGB')))
for start in range(0,len(pages),12):
    canvas=Image.new('RGB',(1200,1320),'#d4dce5');draw=ImageDraw.Draw(canvas)
    for k,(name,j,im) in enumerate(pages[start:start+12]):
        im.thumbnail((270,380));x=(k%4)*300+15;y=(k//4)*440+25
        canvas.paste(im,(x,y));draw.text((x,y-18),f'{name} {j+1}',fill='black')
    canvas.save(root/f'qa_contact_{start//12+1}.png')
