#!/usr/bin/env python3
"""Build four source-linked handbooks. See docs/guides/手册目录.md for prerequisites."""
from pathlib import Path
import os, re, html, json, hashlib, argparse
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    PageBreak, Table, TableStyle, Image, KeepTogether, Flowable, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents
from PIL import Image as PILImage

ROOT=Path(__file__).resolve().parents[1]
VERSION=(ROOT/'VERSION').read_text().strip()
ASSETS=ROOT/'docs/assets'/VERSION
FRONTEND=Path(os.environ.get('ASKXUAN_FRONTEND', str(ROOT.parent/'askXuan-frontend')))
BODY=Path(os.environ.get('HANDBOOK_BODY_FONT','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
BRAND=Path(os.environ.get('HANDBOOK_BRAND_FONT',str(FRONTEND/'packages/design-tokens/fonts/AskXuanSerif-Semibold.ttf')))
for name,path in [('Body',BODY),('Brand',BRAND)]:
    if not path.exists(): raise SystemExit(f'Missing font {path}; set HANDBOOK_{name.upper()}_FONT')
    pdfmetrics.registerFont(TTFont(name,str(path)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Brand',italic='Body',boldItalic='Brand')
PINE=colors.HexColor('#244C43'); GOLD=colors.HexColor('#987342'); CREAM=colors.HexColor('#F6F3EC'); INK=colors.HexColor('#253E36'); MUTED=colors.HexColor('#66736C'); LINE=colors.HexColor('#DCDDD2')
PAGE=(595.276,841.89); WIDTH=495.276
ST={
 'body':ParagraphStyle('body',fontName='Body',fontSize=10.2,leading=16.8,textColor=INK,spaceAfter=8,wordWrap='CJK',allowWidows=0,allowOrphans=0),
 'h1':ParagraphStyle('h1',fontName='Brand',fontSize=24,leading=34,textColor=PINE,spaceBefore=6,spaceAfter=17,keepWithNext=True,wordWrap='CJK'),
 'h2':ParagraphStyle('h2',fontName='Brand',fontSize=16,leading=24,textColor=PINE,spaceBefore=17,spaceAfter=10,keepWithNext=True,wordWrap='CJK'),
 'h3':ParagraphStyle('h3',fontName='Brand',fontSize=12,leading=19,textColor=PINE,spaceBefore=12,spaceAfter=7,keepWithNext=True,wordWrap='CJK'),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=9,leading=14,textColor=INK,wordWrap='CJK',spaceAfter=0),
 'th':ParagraphStyle('th',fontName='Brand',fontSize=9,leading=14,textColor=colors.white,wordWrap='CJK'),
 'caption':ParagraphStyle('caption',fontName='Body',fontSize=8.2,leading=13,textColor=MUTED,spaceBefore=6,spaceAfter=14,wordWrap='CJK'),
 'quote':ParagraphStyle('quote',fontName='Body',fontSize=9.7,leading=16,textColor=PINE,leftIndent=12,rightIndent=10,borderColor=LINE,borderWidth=.5,borderPadding=9,backColor=colors.HexColor('#EFEDE3'),spaceBefore=6,spaceAfter=12,wordWrap='CJK'),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8.5,leading=14,textColor=MUTED,wordWrap='CJK',spaceAfter=7),
}
BOOKS=[
 {'id':'01','title':'产品使用手册','subtitle':'从初次使用到创作、交流与履约','audience':'用户 · 法师 · 平台与寺院运营','file':'问玄东方_产品使用手册.pdf','sections':['产品使用手册.md','manual/DIY创作与定制.md','manual/咨询与交流.md','manual/订单积分与活动.md','manual/法师与后台操作.md','manual/代码核对索引.md'],'intro':'按任务查阅当前入口与操作，区分保存、发布、支付和履约。覆盖 H5、两款 iOS 与管理入口，并明确端差异和演示功能边界。'},
 {'id':'02','title':'视觉设计与交互手册','subtitle':'东方色调 · 现代秩序 · 克制动效','audience':'产品 · 设计 · 开发 · 测试','file':'问玄东方_视觉设计与交互手册.pdf','sections':['视觉设计与交互手册.md'],'intro':'完整收录浅深主题、六枚品牌标识、字体层级、布局、组件状态与动效。当前页面截图与规范示意分开标注，供设计及实现共同使用。','chapter_breaks':True},
 {'id':'03','title':'运营与合作手册','subtitle':'从合作准备到可核验的交付','audience':'平台运营 · 供给伙伴 · 项目负责人','file':'问玄东方_运营与合作手册.pdf','sections':['运营与合作手册.md'],'intro':'面向实际交付的工作手册：角色、供给、审核、履约、售后、指标、试点与合作约定。目标和假设不作为既有经营结果。'},
 {'id':'04','title':'竞品研究与产品决策手册','subtitle':'天机阁 / 佑愿天机 / 佑愿好物','audience':'产品 · 设计 · 运营 · 商业决策','file':'天机阁与佑愿天机_竞品研究与产品决策手册.pdf','sections':['竞品研究与产品决策手册.md'],'intro':'核对官方页面与通用规则，区分可见事实和费用模型。以证据状态组织观察，并转化为问玄东方可执行的产品取舍。','chapter_breaks':True},
]

def clean(s):
    return s.replace('\u2011','-').replace('—','-').replace('–','-').replace('\u00a0',' ')

def inline(s,links=None):
    s=clean(s)
    # Typography uses the embedded brand font for emphasis; no synthetic bold.
    stash=[]
    def link(m):
        label,url=m.groups()
        if url.startswith(('https://','http://')):
            if links is not None: links.setdefault(url,label)
            value=f'<link href="{html.escape(url,quote=True)}" color="#84673D">{html.escape(label)}</link>'
        else: value=html.escape(label)
        stash.append(value); return f'ZZLINKTOKEN{len(stash)-1}ZZ'
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,s)
    s=html.escape(s)
    s=re.sub(r'`([^`]+)`',lambda m:f'<font color="#84673D">{m.group(1)}</font>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'\1',s)
    for i,v in enumerate(stash): s=s.replace(f'ZZLINKTOKEN{i}ZZ',v)
    return s

class Cover(Flowable):
    def __init__(self,book): super().__init__();self.book=book;self.width=WIDTH;self.height=709
    def draw(self):
        c=self.canv;b=self.book
        c.setFillColor(PINE);c.roundRect(0,548,66,26,13,fill=1,stroke=0)
        c.setFont('Body',10);c.setFillColor(CREAM);c.drawCentredString(33,556,'VOLUME '+b['id'])
        c.setStrokeColor(colors.HexColor('#DDD2B8'));c.setLineWidth(.6)
        for r in (97,111,125):c.circle(378,550,r,stroke=1,fill=0)
        c.setFillColor(GOLD);c.circle(378,675,4,fill=1,stroke=0)
        logo=FRONTEND/'packages/brand/assets/logo-customer-light.png'
        if logo.exists(): c.drawImage(str(logo),321,493,114,114,mask='auto')
        c.setFillColor(PINE);c.setFont('Brand',19);c.drawString(0,477,'问玄东方')
        p=Paragraph(b['title'],ParagraphStyle('cover',fontName='Brand',fontSize=32,leading=45,textColor=PINE,wordWrap='CJK'))
        _,h=p.wrap(450,200);p.drawOn(c,0,423-h)
        c.setFillColor(GOLD);c.setFont('Body',11);c.drawString(0,293,b['subtitle'])
        c.setStrokeColor(GOLD);c.line(0,270,WIDTH,270)
        p=Paragraph(b['intro'],ST['body']);_,h=p.wrap(395,120);p.drawOn(c,0,231-h)
        c.setFont('Body',9.3);c.setFillColor(MUTED);c.drawString(0,94,b['audience'])
        c.setFont('Body',10);c.drawString(0,66,VERSION+'  /  产品手册系列')
        c.setFont('Body',8.5);c.drawString(0,41,'当前实现、操作说明与证据边界')

class HandbookDoc(BaseDocTemplate):
    def __init__(self,path,book):
        super().__init__(str(path),pagesize=PAGE,rightMargin=50,leftMargin=50,topMargin=61,bottomMargin=54,title='问玄东方 · '+book['title'],author='问玄东方',subject=VERSION+' · '+book['subtitle'],pageCompression=1)
        self.book=book;self.addPageTemplates(PageTemplate(id='body',frames=[Frame(50,54,WIDTH,727,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.page))
    def page(self,c,d):
        c.saveState();c.setFillColor(CREAM);c.rect(0,0,*PAGE,fill=1,stroke=0)
        if d.page>1:
            c.setFillColor(MUTED);c.setFont('Body',8);c.drawString(50,807,'问玄东方  /  '+self.book['title'])
            c.setStrokeColor(LINE);c.line(50,797,545.276,797)
        c.setFont('Body',8);c.setFillColor(MUTED);c.drawString(50,29,VERSION+'    ·    '+self.book['id'])
        c.drawRightString(545.276,29,f'{d.page:02d}');c.restoreState()
    def afterFlowable(self,f):
        if hasattr(f,'toc_info'):
            level,title,key=f.toc_info;self.canv.bookmarkPage(key);self.canv.addOutlineEntry(title,key,level=level,closed=False);self.notify('TOCEntry',(level,title,self.page,key))

def heading(text,level,key,toclevel=None):
    p=Paragraph(inline(text),ST['h'+str(min(level,3))])
    if toclevel is not None:p.toc_info=(toclevel,clean(text),key)
    return p

def table(rows,links):
    n=len(rows[0]); rows=[r[:n]+['']*max(0,n-len(r)) for r in rows]
    # Balance semantic name columns against explanation columns.
    if n==2: weights=[.28,.72]
    elif n==3: weights=[.22,.36,.42]
    elif n==4: weights=[.24,.21,.21,.34]
    else: weights=[1/n]*n
    data=[[Paragraph(inline(cell,links),ST['th' if i==0 else 'cell']) for cell in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=[WIDTH*x for x in weights],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PINE),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#FFFDF8'),colors.HexColor('#EFEDE3')]),('LINEBELOW',(0,0),(-1,0),.5,GOLD),('LINEBELOW',(0,1),(-1,-1),.3,LINE)]));t.spaceAfter=12
    if len(rows)<=6 and t.wrap(WIDTH,1000)[1]<360:return KeepTogether([t])
    return t

def figures(items,base):
    out=[]
    # Pair screenshots only, preserve larger diagrams as independent plates.
    groups=[];i=0
    while i<len(items):
        a=items[i]; path=(base/a[1]).resolve(); size=PILImage.open(path).size
        if i+1<len(items) and size[0]<size[1]:
            b=items[i+1];s2=PILImage.open((base/b[1]).resolve()).size
            if s2[0]<s2[1]:groups.append([a,b]);i+=2;continue
        groups.append([a]);i+=1
    for group in groups:
        cells=[]
        for caption,name in group:
            path=(base/name).resolve();w,h=PILImage.open(path).size
            mw=235 if len(group)==2 else (190 if w/h<.7 else WIDTH)
            scale=min(mw/w,545/h);im=Image(str(path),width=w*scale,height=h*scale)
            cells.append([im,Paragraph(inline(caption),ST['caption'])])
        if len(cells)==2:
            row=Table([cells],colWidths=[WIDTH/2]*2);row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]));out.append(KeepTogether([Spacer(1,8),row,Spacer(1,8)]))
        else:out.append(KeepTogether([Spacer(1,8),*cells[0],Spacer(1,8)]))
    return out

def parse(path,book,seq,links):
    lines=path.read_text().splitlines();out=[];i=0;section=0
    while i<len(lines):
        line=lines[i].strip()
        if not line or line=='---' or line.startswith('[返回') or re.match(r'^\[[^\]]+\]\((?!https?://)[^)]+\)$',line):i+=1;continue
        if line.startswith('# '):
            title=line[2:]
            if seq==0:title='开始使用' if book['id']=='01' else '阅读说明'
            out.append(heading(title,1,f'{book["id"]}-{seq}-start',0 if book['id']=='01' else None));i+=1;continue
        m=re.match(r'^(#{2,4}) (.+)',line)
        if m:
            level=len(m[1]);section+=1
            if level==2 and (book.get('chapter_breaks') or m[2].startswith('附录 ')):out.append(PageBreak())
            out.append(heading(m[2],2 if level==2 else 3,f'{book["id"]}-{seq}-{section}',(1 if book['id']=='01' else 0) if level==2 else None));i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=lines[i].strip().strip('|').split('|')
                if not all(re.match(r'^\s*:?-+:?\s*$',c) for c in row): rows.append([c.strip() for c in row])
                i+=1
            if rows:out.append(table(rows,links))
            continue
        if line.startswith('!['):
            imgs=[]
            while i<len(lines):
                found=re.findall(r'!\[([^\]]*)\]\(([^)]+)\)',lines[i])
                if found:imgs.extend(found);i+=1
                elif not lines[i].strip() and i+1<len(lines) and lines[i+1].strip().startswith('!['):i+=1
                else:break
            groups=figures(imgs,path.parent)
            k=i
            while k<len(lines) and not lines[k].strip():k+=1
            if k<len(lines) and re.match(r'^\*?图\s*\d+',lines[k].strip()):
                cap=Paragraph(inline(lines[k].strip(),links),ST['caption'])
                groups[-1]=KeepTogether([*groups[-1]._content,cap]);i=k+1
            out.extend(groups);continue
        if line.startswith('```'):
            block=[];i+=1
            while i<len(lines) and not lines[i].strip().startswith('```'):block.append(lines[i]);i+=1
            out.append(Paragraph('<br/>'.join(inline(x,links) for x in block),ST['quote']));i+=1;continue
        if line.startswith('>'):
            block=[]
            while i<len(lines) and lines[i].strip().startswith('>'):block.append(lines[i].strip().lstrip('>').strip());i+=1
            out.append(Paragraph(inline(' '.join(block),links),ST['quote']));continue
        if re.match(r'^([-*]|\d+\.)\s+',line):
            marker=re.match(r'^([-*]|\d+\.)\s+(.*)',line)
            prefix='• ' if marker[1] in ['-','*'] else marker[1]+' '
            out.append(Paragraph(inline(prefix+marker[2],links),ST['body']));i+=1;continue
        parts=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||>|!\[|```|[-*] |\d+\. )',lines[i].strip()):parts.append(lines[i].strip());i+=1
        out.append(Paragraph(inline(' '.join(parts),links),ST['body']))
    return out

def build(book,outdir):
    links={};story=[Cover(book),PageBreak(),heading('阅读导航',1,'contents')]
    story.append(Paragraph('目录页码可点击跳转；PDF 书签按章节组织。正文中的金色链接指向官方来源或核对资料。',ST['small']))
    toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc0',fontName='Brand',fontSize=10.3,leading=17,spaceBefore=8,textColor=PINE),ParagraphStyle('toc1',fontName='Body',fontSize=9,leading=15,leftIndent=15,spaceBefore=3,textColor=MUTED)];toc.dotsMinLevel=0;story += [toc,PageBreak()]
    for seq,name in enumerate(book['sections']):
        if seq:story.append(PageBreak())
        story+=parse(ROOT/'docs/guides'/name,book,seq,links)
        if book['id']=='01' and seq==0 and (ASSETS/'h5-home-light.jpg').exists():
            story += [PageBreak(),heading('界面速览',2,'productscreens'),*figures([('H5 信众首页 · 浅色 · 2026-09-13 实际页面','h5-home-light.jpg'),('H5 信众首页 · 深色 · 同日实际页面','h5-home-dark.jpg')],ASSETS)]
    if links:
        story.extend([PageBreak(),heading('来源链接',1,'sources')])
        story.append(Paragraph('为便于离线阅读后追溯，列出正文直接引用的外部来源。竞品网页可能更新，适用日期和证据层级以对应章节为准。',ST['small']))
        for url,label in links.items():story.append(Paragraph(inline(f'[{label}]({url})')+'<br/><font size="7.8" color="#66736C">'+html.escape(url)+'</font>',ST['body']))
    # Merge headings into existing keep groups so short tables/figures cannot strand a heading.
    grouped=[]
    for flow in story:
        if isinstance(flow,KeepTogether) and grouped and isinstance(grouped[-1],Paragraph) and grouped[-1].getKeepWithNext():
            head=grouped.pop();head.keepWithNext=False;grouped.append(KeepTogether([head,*flow._content]))
        else:grouped.append(flow)
    path=outdir/book['file'];HandbookDoc(path,book).multiBuild(grouped,maxPasses=5)
    return {'file':book['file'],'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source_files':book['sections']}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=ROOT/'output/pdf');ap.add_argument('--book',choices=['01','02','03','04']);args=ap.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    result=[build(b,args.output) for b in BOOKS if not args.book or args.book==b['id']]
    if args.book and (args.output/'manifest.json').exists():
        previous=json.loads((args.output/'manifest.json').read_text())['books']
        updated={x['file']:x for x in previous+result}
        result=[updated[b['file']] for b in BOOKS if b['file'] in updated]
    (args.output/'manifest.json').write_text(json.dumps({'edition':VERSION,'books':result},ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
