"""Draw two course diagrams from the implemented modules and input pipeline."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out=Path(__file__).resolve().parents[1]/'docs'/'entrega_u1'/'figuras'
out.mkdir(parents=True,exist_ok=True)
font='C:/Windows/Fonts/arial.ttf'; bold='C:/Windows/Fonts/arialbd.ttf'
F=ImageFont.truetype(font,30); B=ImageFont.truetype(bold,32); S=ImageFont.truetype(font,24)

def canvas():
    im=Image.new('RGB',(1500,600),'#f3f8fd'); d=ImageDraw.Draw(im)
    return im,d
def box(d,xy,title,detail,color='#dceefe'):
    d.rounded_rectangle(xy,radius=22,fill=color,outline='#245782',width=4)
    x1,y1,x2,y2=xy
    for content,y,font,fill in [(title,y1+20,B,'#0c284d'),(detail,y1+82,S,'#29445e')]:
        bounds=d.multiline_textbbox((0,0),content,font=font,spacing=8,align='center')
        d.multiline_text(((x1+x2-bounds[2])/2,y),content,font=font,fill=fill,align='center',spacing=8)
def arrow(d,a,b):
    d.line([a,b],fill='#138eae',width=8)
    bx,by=b;ax,ay=a;import math
    t=math.atan2(by-ay,bx-ax)
    pts=[b,(bx-23*math.cos(t-.48),by-23*math.sin(t-.48)),(bx-23*math.cos(t+.48),by-23*math.sin(t+.48))]
    d.polygon(pts,fill='#138eae')

im,d=canvas();d.text((750,32),'Arquitectura de módulos',font=B,fill='#0c284d',anchor='mt')
box(d,(40,130,300,300),'index.html','Escenas SVG\ny controles')
box(d,(390,130,710,300),'playable.js','Estado, pincel,\nHUD y simulación')
box(d,(800,100,1160,270),'geometry/','Ajuste, medidas,\nruta y figuras')
box(d,(800,330,1160,500),'math / clipping /\ncollision','Transformación, recorte\ne intersección')
box(d,(1220,190,1470,400),'SVG + HUD','Resultado visible\ny retroalimentación','#dff7e8')
arrow(d,(300,215),(390,215));arrow(d,(710,185),(800,185));arrow(d,(710,260),(800,390));arrow(d,(1160,250),(1220,260));arrow(d,(1160,415),(1220,345))
im.save(out/'arquitectura.png')

im,d=canvas();d.text((750,32),'Pipeline de construcción geométrica',font=B,fill='#0c284d',anchor='mt')
xs=[(45,105,275,290),(335,105,565,290),(625,105,855,290),(915,105,1145,290),(1205,105,1455,290)]
labels=[('Puntero','Coordenadas\nen viewBox'),('Ajuste','Segmento,\nrectángulo\no polígono'),('Medidas','Longitud, ángulo\ny área o cruce'),('Evaluación','Regla y objetivo\ndel nivel'),('Salida','Animación SVG\ny explicación')]
for xy,(head,detail) in zip(xs,labels):box(d,xy,head,detail)
for left,right in zip(xs,xs[1:]):arrow(d,(left[2],195),(right[0],195))
box(d,(460,365,1040,535),'Recorte visible','Cohen–Sutherland limita los segmentos al viewport;\nno cambia la medida interna del intento.','#fff1d5')
arrow(d,(740,290),(740,365))
im.save(out/'pipeline.png')
print(out)
