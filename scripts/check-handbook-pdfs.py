#!/usr/bin/env python3
"""Read-only structural checks and review renders; human inspection remains required."""
from pathlib import Path
import argparse,json,hashlib,subprocess
from pypdf import PdfReader
import pdfplumber
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=ROOT/'output/pdf');ap.add_argument('--output',type=Path,default=ROOT/'tmp/pdfs/0.0.1-review');ap.add_argument('--poppler',default='pdftoppm');ap.add_argument('--name',default='');args=ap.parse_args();args.output.mkdir(parents=True,exist_ok=True)
summary=[]
for pdf in sorted(args.input.glob('*.pdf')):
 if args.name and args.name not in pdf.name:continue
 stem=pdf.stem;folder=args.output/stem;folder.mkdir(exist_ok=True)
 r=PdfReader(pdf);item={'name':pdf.name,'pages':len(r.pages),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'outline_entries':0,'annotations':0,'out_of_bounds':[],'font_errors':[],'page_text_lengths':[]}
 def count(tree):return sum(count(x) if isinstance(x,list) else 1 for x in tree)
 item['outline_entries']=count(r.outline)
 for p in r.pages:item['annotations']+=len(p.get('/Annots',[]))
 with pdfplumber.open(pdf) as doc:
  for n,p in enumerate(doc.pages,1):
   txt=p.extract_text() or '';item['page_text_lengths'].append(len(txt))
   for ch in p.chars:
    if ch['x0']<25 or ch['x1']>p.width-25 or ch['top']<12 or ch['bottom']>p.height-12:item['out_of_bounds'].append({'page':n,'text':ch['text'],'bbox':[ch['x0'],ch['top'],ch['x1'],ch['bottom']]})
   if '\ufffd' in txt or '\x00' in txt:item['font_errors'].append(n)
 subprocess.run([args.poppler,'-r','105','-png',str(pdf),str(folder/'page')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 pages=sorted(folder.glob('page-*.png'))
 for start in range(0,len(pages),4):
  sheet=Image.new('RGB',(1300,1880),'#D7D7D2');d=ImageDraw.Draw(sheet)
  for i,p in enumerate(pages[start:start+4]):
   im=Image.open(p).convert('RGB');im.thumbnail((645,910));x=(i%2)*650;y=(i//2)*940;sheet.paste(im,(x,y));d.text((x+8,y+915),f'{start+i+1:02}',fill='black')
  sheet.save(folder/f'contact-{start//4+1:02}.jpg',quality=90)
 summary.append(item)
(args.output/'checks.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in i.items() if k!='page_text_lengths'} for i in summary],ensure_ascii=False,indent=2))
if any(i['out_of_bounds'] or i['font_errors'] or not i['outline_entries'] for i in summary):raise SystemExit(1)
