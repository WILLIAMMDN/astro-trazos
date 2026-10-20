"""Render the course's editable DOCX files to A4 PDFs without LibreOffice."""
from pathlib import Path
from io import BytesIO
from html import escape
from docx import Document
from docx.oxml.ns import qn
from docx.table import Table as DocTable
from docx.text.paragraph import Paragraph
from reportlab.platypus import SimpleDocTemplate, Paragraph as P, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage

ROOT=Path(__file__).resolve().parents[1]
EDIT=ROOT/'docs'/'entrega_u1'/'editables'
OUT=ROOT/'docs'/'entrega_u1'
pdfmetrics.registerFont(TTFont('Arial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold','C:/Windows/Fonts/arialbd.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyCourse',fontName='Arial',fontSize=10.5,leading=15,spaceAfter=7,textColor=colors.HexColor('#263344')))
styles.add(ParagraphStyle(name='ReportCourse',parent=styles['BodyCourse'],fontSize=12,leading=18,spaceAfter=9))
styles.add(ParagraphStyle(name='H1Course',fontName='Arial-Bold',fontSize=16,leading=20,spaceBefore=12,spaceAfter=9,textColor=colors.HexColor('#102E53'),keepWithNext=True))
styles.add(ParagraphStyle(name='H2Course',parent=styles['H1Course'],fontSize=13))
styles.add(ParagraphStyle(name='TitleCourse',fontName='Arial-Bold',fontSize=23,leading=29,spaceAfter=15,alignment=TA_CENTER,textColor=colors.HexColor('#102E53')))
styles.add(ParagraphStyle(name='CenterCourse',parent=styles['BodyCourse'],alignment=TA_CENTER))
styles.add(ParagraphStyle(name='CaptionCourse',fontName='Arial',fontSize=8.5,leading=12,alignment=TA_CENTER,textColor=colors.HexColor('#4B5563'),spaceAfter=9))
styles.add(ParagraphStyle(name='CellCourse',fontName='Arial',fontSize=8.5,leading=11))

def paragraph_text(p):
    return escape(p.text).replace('\n','<br/>')

def has_break(p):
    return bool(p._p.xpath('.//w:br[@w:type="page"]'))

def embedded_image(doc,p):
    blips=p._p.xpath('.//a:blip')
    if not blips:return None
    rid=blips[0].get(qn('r:embed'))
    if not rid:return None
    blob=doc.part.related_parts[rid].blob
    im=PILImage.open(BytesIO(blob)); w,h=im.size
    maxw=440; maxh=295; f=min(maxw/w,maxh/h)
    buf=BytesIO(blob); buf.seek(0)
    return Image(buf,width=w*f,height=h*f)

def footer(canvas,doc):
    canvas.saveState(); canvas.setFont('Arial',8); canvas.setFillColor(colors.HexColor('#63758A'))
    canvas.drawCentredString(A4[0]/2,36,f'ASTRO-TRAZOS · UNAJMA · 2026-II     |     Página {doc.page}')
    canvas.restoreState()

for file in EDIT.glob('*.docx'):
    src=Document(file); report=file.name.startswith('2_'); flow=[]
    for child in src.element.body.iterchildren():
        if child.tag==qn('w:p'):
            p=Paragraph(child,src)
            if has_break(p):flow.append(PageBreak());continue
            img=embedded_image(src,p)
            if img:flow.append(img);continue
            txt=paragraph_text(p)
            if not txt.strip():flow.append(Spacer(1,10));continue
            sty=p.style.name
            which='ReportCourse' if report else 'BodyCourse'
            if sty=='Title':which='TitleCourse'
            elif sty=='Heading 1':which='H1Course'
            elif sty=='Heading 2':which='H2Course'
            elif p.alignment==1:which='CenterCourse'
            elif 'Figura ' in p.text:which='CaptionCourse'
            flow.append(P(txt,styles[which]))
        elif child.tag==qn('w:tbl'):
            t=DocTable(child,src)
            data=[]
            for row in t.rows:
                data.append([P(escape(c.text).replace('\n','<br/>'),styles['CellCourse']) for c in row.cells])
            if not data:continue
            widths=[(A4[0]-142)/len(data[0])]*len(data[0])
            tb=Table(data,colWidths=widths,repeatRows=1,hAlign='CENTER')
            tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#D9EAF8')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#91A8BC')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6)]))
            flow += [tb,Spacer(1,10)]
    out=OUT/(file.stem+'.pdf')
    pdf=SimpleDocTemplate(str(out),pagesize=A4,leftMargin=71,rightMargin=71,topMargin=71,bottomMargin=71,title=file.stem,author='Equipo Astro-Trazos')
    pdf.build(flow,onFirstPage=footer,onLaterPages=footer)
    print(out.name,out.stat().st_size)
