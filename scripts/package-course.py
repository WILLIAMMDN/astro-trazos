"""Build the course's requested IIAD65_G04_U1.zip structure."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parents[1]
docs=root/'docs'/'entrega_u1'
target=Path.home()/'Downloads'/'IIAD65_G04_U1.zip'
prefix='IIAD65_G04_U1/'
code_files=['index.html','package.json','package-lock.json','README.md','THIRD_PARTY_NOTICES.md','eslint.config.js']
source_dirs=['src','public','tests','scripts','docs/art','docs/capturas','docs/entrega_u1/figuras']
artifact_files=['2_Informe.pdf','3_Manual_Usuario.pdf','4_Manual_Tecnico.pdf',
    '5_Video_Demostracion.mp4','6_Presentacion.pdf','7_Evidencias_RSU.pdf',
    '7_Constancia_DAEMON_sin_firma.pdf','8_Ficha_Proyecto.pdf','9_Declaracion_IA.pdf',
    'LEEME_ENTREGA.md']
with ZipFile(target,'w',compression=ZIP_DEFLATED,compresslevel=1,allowZip64=True) as z:
    for name in code_files:z.write(root/name,prefix+'1_Codigo/'+name)
    for folder in source_dirs:
        for file in (root/folder).rglob('*'):
            if file.is_file():z.write(file,prefix+'1_Codigo/'+file.relative_to(root).as_posix())
    z.write(root/'dist'/'Astro-Trazos-Presentacion.html',prefix+'1_Codigo/dist/Astro-Trazos-Presentacion.html')
    z.write(docs/'benchmark_local.json',prefix+'1_Codigo/docs/entrega_u1/benchmark_local.json')
    z.writestr(prefix+'1_Codigo/REPOSITORIO.txt','https://github.com/WILLIAMMDN/astro-trazos\n')
    for name in artifact_files:
        file=docs/name
        if not file.exists():raise FileNotFoundError(file)
        z.write(file,prefix+name)
    z.write(docs/'editables'/'6_Presentacion.pptx',prefix+'6_Presentacion.pptx')
    z.write(docs/'editables'/'5_Guion_Demostracion.docx',prefix+'5_Guion_Demostracion.docx')
print(target,round(target.stat().st_size/1024**2,1),'MiB')
