#!/usr/bin/env python3
"""Build handbook diagrams from current design tokens, not product screenshots.

Requires reportlab, Pillow and pdftoppm. Example:
  python3 scripts/build-handbook-plates.py --frontend ../askXuan-frontend \
    --screenshots /path/to/current-public-screenshots
Only six PNG diagrams and optional byte-identical JPEG screenshot copies are
delivered. Intermediate PDFs live in an automatically removed temporary folder.
"""
import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

W, H = 1400, 950
PAPER, INK, MUTED, GOLD, LINE = '#F6F3EC', '#253E36', '#66736C', '#84673D', '#D5D9CE'
CURRENT = '问玄东方 0.0.1 · 当前设计规范'


class Plate:
    def __init__(self, path, number, title, subtitle):
        self.c = canvas.Canvas(str(path), pagesize=(W, H), pageCompression=1)
        self.c.setTitle(title)
        self.c.setAuthor('问玄东方产品手册')
        self.rect(0, 0, W, H, PAPER)
        self.text(number, 56, 39, 18, GOLD)
        self.text(title, 56, 70, 36, INK, 'Brand')
        self.text(subtitle, 56, 124, 20, MUTED)
        self.line(56, 161, 1344, 161)
        self.text('规范示意 · 非产品截图', 1088, 43, 18, GOLD)
        self.line(56, 895, 1344, 895)
        self.text(CURRENT, 56, 916, 17, MUTED)
        self.text('问玄东方 / 视觉设计与交互手册', 1000, 916, 17, MUTED)

    def rect(self, x, y, w, h, fill, radius=0, stroke=None):
        assert 0 <= x <= W and 0 <= y <= H and x+w <= W+.1 and y+h <= H+.1
        c = self.c
        c.setFillColor(HexColor(fill) if isinstance(fill, str) else fill)
        c.setStrokeColor(HexColor(stroke or fill) if isinstance(stroke or fill, str) else (stroke or fill))
        if radius:
            c.roundRect(x, H-y-h, w, h, radius, stroke=bool(stroke), fill=1)
        else:
            c.rect(x, H-y-h, w, h, stroke=bool(stroke), fill=1)

    def line(self, x1, y1, x2, y2, color=LINE):
        self.c.setStrokeColor(HexColor(color))
        self.c.setLineWidth(1)
        self.c.line(x1, H-y1, x2, H-y2)

    def text(self, value, x, y, size=22, color=INK, font='Body', max_width=None):
        width = pdfmetrics.stringWidth(value, font, size)
        assert x >= 0 and x+width <= W+.1, (value, x, width)
        assert y-size >= 0 and y+size <= H, (value, y)
        if max_width is not None:
            assert width <= max_width+.1, (value, width, max_width)
        self.c.setFillColor(HexColor(color))
        self.c.setFont(font, size)
        self.c.drawString(x, H-y-size*.82, value)

    def para(self, value, x, y, width, size=22, color=INK, leading=None, max_height=None):
        leading = leading or size*1.55
        lines = []
        for paragraph in value.split('\n'):
            line = ''
            for ch in paragraph:
                if line and pdfmetrics.stringWidth(line+ch, 'Body', size) > width:
                    lines.append(line)
                    line = ch
                else:
                    line += ch
            lines.append(line)
        if max_height is not None:
            assert len(lines)*leading <= max_height+.1, (value, len(lines)*leading, max_height)
        for n, line in enumerate(lines):
            self.text(line, x, y+n*leading, size, color, max_width=width)
        return y+len(lines)*leading

    def image(self, path, x, y, width, height):
        self.c.drawImage(str(path), x, H-y-height, width, height, mask='auto', preserveAspectRatio=True, anchor='c')

    def finish(self):
        self.c.showPage()
        self.c.save()


def plate_colors(path, tokens, frontend):
    p = Plate(path, '01 / COLOR', '两套主题，同一套语义', '界面颜色完整对照；色块叠加在各自主题表面上，边框透明度按源码保留。')
    light, dark = tokens['themes']['light']['color'], tokens['color']
    rows = [('bg','primary','页面底'),('bg','secondary','主表面'),('bg','tertiary','次表面'),('bg','elevated','提升表面'),
            ('brand','default','品牌 / 主操作'),('brand','light','品牌亮'),('brand','dark','品牌深'),
            ('accent','default','点缀'),('accent','light','点缀亮'),('accent','dark','点缀深'),
            ('cinnabar','default','朱砂'),('cinnabar','light','朱砂亮'),
            ('text','primary','主文字'),('text','secondary','次文字'),('text','tertiary','弱文字'),
            ('text','onBrand','品牌上文字'),('text','onAccent','点缀上文字'),
            ('state','success','成功'),('state','warning','警告'),('state','error','错误'),('state','info','信息'),
            ('border','default','普通边框'),('border','strong','强边框'),('border','divider','分隔线')]
    p.text('语义角色', 65, 183, 23, INK, 'Brand')
    for x, palette, title in [(340,light,'东方浅色'),(850,dark,'深棕朱砂')]:
        p.rect(x-15, 176, 509, 697, palette['bg']['secondary'], 14)
        fg = palette['text']['primary']
        p.text(title, x, 187, 24, fg, 'Brand')
        for i,(group,key,label) in enumerate(rows):
            y = 225+i*26
            raw = palette[group][key]
            color = raw
            if raw.startswith('rgba'):
                nums=[float(v.strip()) for v in raw[5:-1].split(',')]
                color=Color(nums[0]/255,nums[1]/255,nums[2]/255,alpha=nums[3])
                raw='#'+''.join(f'{int(n+.5):02X}' for n in nums[:3])+f'{int(nums[3]*255+.5):02X}'
            p.rect(x, y, 45, 19, color, 3, palette['border']['strong'].startswith('#') and palette['border']['strong'] or None)
            p.text(raw, x+61, y-1, 19, fg)
    for i,(_,_,label) in enumerate(rows):
        p.text(label, 65, 224+i*26, 20)
    p.finish()


def plate_logos(path, tokens, frontend):
    p = Plate(path, '02 / BRAND', '六种身份，共同笔意', '正式母版 PNG 等比引用；页内标识与 AppIcon / favicon 分开使用。')
    names=[('customer','问玄东方','日出山川'),('master','法师工作台','一灯明心'),('temple','寺院管理台','檐下安宁'),
           ('shop','商城管理台','相遇成环'),('platform','统一运营管理台','四方有序'),('atelier','东方珠作','一珠一念')]
    for theme,y,bg,fg,accent in [('light',188,'#FFFDF8','#244C43','#987342'),('dark',491,'#241A17','#E5CCA3','#D98B70')]:
        p.rect(56,y,1288,280,bg,18)
        for i,(role,name,idea) in enumerate(names):
            x=64+i*213
            p.image(frontend/f'packages/brand/assets/logo-{role}-{theme}.png',x+40,y+25,124,124)
            size=20 if role=='platform' else 22
            tx=x+(204-pdfmetrics.stringWidth(name,'Brand',size))/2
            p.text(name,tx,y+171,size,fg,'Brand')
            p.text(idea,x+61,y+211,19,accent)
    p.text('页内：96×96 SVG / 512px 透明 PNG', 67, 801, 22)
    p.text('应用：1024px 不透明方图；系统负责裁切', 715, 801, 22)
    p.text('跟随应用实际主题；不拉伸、不裁圆、不再套底壳。', 67, 846, 22, MUTED)
    p.finish()


def plate_typography(path, tokens, frontend):
    p = Plate(path, '03 / TYPOGRAPHY', '标题有气质，正文与数字清楚', '示例用于比较文字角色；字号标签来自源码，图版不是设备像素截图。')
    p.rect(56,185,1288,214,'#FFFDF8',18)
    p.text('让每一次探索，有迹可循',86,213,40,INK,'Brand')
    p.text('正文、输入和操作使用无衬线，让信息保持连贯。',86,277,26)
    p.text('¥12,345.67   /   1,024 积分',86,330,35)
    for x,title in [(56,'Web / CSS 像素角色'),(727,'iOS / Dynamic Type 角色')]:
        p.text(title,x,437,27,INK,'Brand')
    left=[('11 / 12 / 13px','小标签 / 说明 / 标签'),('14 / 15 / 16px','正文 / 控件 / 阅读'),('17 / 18 / 20px','导航 / 卡片 / 区块'),('24 / 28 / 32px','页面 / 主视觉 / 展示'),('36 / 48px','统计数字；明确单位')]
    right=[('caption2 / caption','默认 11 / 12pt'),('footnote / subheadline','默认 13 / 15pt'),('body','阅读默认 17pt'),('标题 relativeTo','衬线随语义字号缩放'),('数字 ScaledMetric','系统无衬线 + 等宽数字')]
    for x,rows in [(56,left),(727,right)]:
        for i,(a,b) in enumerate(rows):
            y=487+i*54
            p.line(x,y+42,x+615,y+42)
            p.text(a,x,y,22)
            p.text(b,x+305,y,20,MUTED,max_width=310)
    p.rect(56,789,1288,77,'#EFEDE3',12)
    p.text('字重 400 / 500 / 600',77,805,21)
    p.text('标题 1.5 · 正文 1.7 · 阅读 1.9 · 控件 1.5',430,805,21)
    p.text('iOS 默认字号可增长；H5 触控输入采用至少 16px，金额不使用装饰字距。',77,838,20,MUTED)
    p.finish()


def plate_motion(path, tokens, frontend):
    p = Plate(path, '04 / MOTION', '短反馈，保留原生节奏', '动效描述状态变化；减少动态效果时保留内容、结果与可操作性。')
    for x,title,curve,rows in [(56,'Web','(.2, .7, .2, 1)',[('按下 / fast',120),('变化 / standard',200),('进入 / enter',280),('退出 / exit',160)]),
                                (722,'iOS','(.2, .8, .2, 1)',[('按下 / press',120),('选择 / selection',200),('呈现 / reveal',280)])]:
        p.rect(x,185,622,364,'#FFFDF8',18)
        p.text(title,x+24,209,28,INK,'Brand')
        p.text(curve,x+214,219,21,MUTED)
        for i,(label,ms) in enumerate(rows):
            y=278+i*59
            p.text(label,x+24,y,20)
            p.rect(x+219,y+1,300,21,'#EFEDE3',6)
            p.rect(x+219,y+1,ms,21,'#284D43' if x==56 else '#84673D',6)
            p.text(str(ms)+'ms',x+531,y,18)
    p.text('Web 落稳曲线：(.22, 1, .36, 1)',80,569,20,MUTED)
    p.text('原生导航 / sheet 由系统控制；无统一 160ms 退出。',742,569,20,MUTED)
    p.rect(56,616,622,244,'#2A1E1A',18)
    p.rect(722,616,622,244,'#2A1E1A',18)
    for x,title,body in [(56,'Web：prefers-reduced-motion','取消位移、延迟和重复装饰；\n通用时长 .01ms，弹层可立即关闭。\n焦点返回与滚动锁仍正常完成。'),(722,'iOS：减少动态效果','取消缩放、数字与入场过渡；\n保留即时明暗反馈和系统操作。\nDynamic Type 不受动画开关影响。')]:
        p.text(title,x+24,643,24,'#F0E6DA','Brand')
        p.para(body,x+24,697,567,22,'#C5B097',max_height=150)
    p.finish()


def button(p,x,y,w,label,kind='primary'):
    bg,fg={'primary':('#284D43','#FFFFFF'),'secondary':('#FFFDF8','#84673D'),'disabled':('#D7DDD3','#69756E')}[kind]
    p.rect(x,y,w,47,bg,9,LINE if kind=='secondary' else None)
    text_width=pdfmetrics.stringWidth(label,'Body',21)
    p.text(label,x+(w-text_width)/2,y+13,21,fg)


def plate_components(path,tokens,frontend):
    p=Plate(path,'05 / COMPONENTS','状态完整，操作才清楚','规范示意：沿用现有语义与组件规则；不代表某个页面已逐项验收。')
    for x,title in [(56,'按钮'),(495,'输入'),(934,'选择与状态')]:
        p.rect(x,187,410,300,'#FFFDF8',16)
        p.text(title,x+23,211,27,INK,'Brand')
    button(p,79,266,364,'继续操作')
    button(p,79,328,364,'◌  处理中…')
    button(p,79,390,364,'暂不可用','disabled')
    p.text('保留尺寸；处理中禁用重复提交',80,457,18,MUTED)
    for y,label,border in [(266,'正常输入',LINE),(328,'已聚焦','#84673D'),(390,'请补充必填信息','#A04B3A')]:
        p.rect(518,y,364,47,'#F6F3EC',9,border)
        p.text(label,531,y+13,21,'#A04B3A' if y==390 else MUTED)
    p.text('名称独立可读；错误与字段关联',519,457,18,MUTED)
    button(p,957,266,168,'已选','primary');button(p,1139,266,181,'未选','secondary')
    p.text('●  已完成',959,341,23,'#357052')
    p.text('●  待处理',1133,341,23,'#906D37')
    p.text('!   未能加载，请重试',959,399,23,'#A04B3A')
    p.text('文字 + 形状，不只靠颜色识别',959,457,18,MUTED)
    p.rect(56,519,837,344,'#FFFDF8',16)
    p.text('数据表：初次加载使用静态骨架',80,544,26,INK,'Brand')
    p.rect(79,594,791,40,'#EFEDE3',6)
    p.text('名称 / 内容',94,605,19,MUTED);p.text('状态',569,605,19,MUTED);p.text('操作',755,605,19,MUTED)
    for i in range(5):
        y=652+i*35
        p.rect(94,y,235+(i%2)*60,11,'#E7E7DA',5)
        p.rect(569,y,93,11,'#E7E7DA',5)
        p.rect(755,y,72,11,'#E7E7DA',5)
    p.rect(919,519,425,344,'#FFFDF8',16)
    p.text('空 / 错误 / 弹层',943,544,26,INK,'Brand')
    p.para('暂无记录\n说明原因，并提供可执行下一步。\n\n请求失败不是“0 条”。\n弹层关闭后恢复焦点与滚动。',943,596,375,22,max_height=245)
    p.finish()


def plate_order(path,tokens,frontend):
    p=Plate(path,'06 / DIY ORDERS','订单摘要与成交明细分层','合成演示数据，不对应真实订单；只说明当前卡片层次与金额语义。')
    p.rect(56,191,618,659,'#FFFDF8',18,LINE)
    p.rect(705,191,639,659,'#FFFDF8',18,LINE)
    p.text('订单 DEMO-001',82,220,19,MUTED)
    p.rect(533,213,115,33,'#EFEDE3',16);p.text('待发货',558,221,19,GOLD)
    p.line(82,265,648,265)
    p.image(frontend/'packages/brand/assets/logo-atelier-light.png',80,292,106,106)
    p.text('暖玉春山 · 专属手串',206,289,27,INK,'Brand')
    p.text('白玉 · 红玛瑙 · 银配件 等',206,337,21,MUTED)
    p.text('18 件材料 · 4 项选材',206,374,20,MUTED)
    p.rect(82,435,566,59,'#EFEDE3',10)
    p.text('作品已就绪，等待发货',100,454,22)
    p.text('订单金额',82,535,21,MUTED)
    p.text('¥328.00',82,574,39,GOLD)
    button(p,446,551,200,'收起详情','secondary')
    p.line(82,640,648,640)
    p.para('金额来自订单，不取当前商品价。\n材料件数含配件与绳线，不称“18颗珠”。\n物流和加持进度仅在真实记录存在时显示。',82,675,558,22,max_height=153)
    p.text('订单详情 / 材料明细',732,220,27,INK,'Brand')
    fees=[('材料费','¥298.00'),('加持费','¥30.00'),('订单合计','¥328.00')]
    for i,(name,price) in enumerate(fees):
        y=283+i*48
        p.text(name,732,y,22,MUTED);p.text(price,1162,y,22,GOLD)
    p.line(732,436,1318,436)
    p.text('材料 / 规格',732,460,20,MUTED);p.text('数量',1095,460,20,MUTED);p.text('成交小计',1210,460,20,MUTED)
    for i,(name,qty,price) in enumerate([('白玉 / 8mm','10','180.00'),('红玛瑙 / 8mm','6','72.00'),('银配件 / 隔珠','1','26.00'),('绳线 / 米色','1','20.00')]):
        y=514+i*52
        p.text(name,732,y,22);p.text(qty,1110,y,22);p.text('¥'+price,1210,y,21)
        p.line(732,y+37,1318,y+37)
    p.para('若仅有设计快照：显示无价材料说明。\n不将历史设计单价重算为本单成交价。',732,747,575,21,MUTED,max_height=75)
    p.finish()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frontend',type=Path,required=True)
    parser.add_argument('--screenshots',type=Path)
    args=parser.parse_args()
    frontend=args.frontend.resolve()
    docs=Path(__file__).resolve().parents[1]
    output=docs/'docs/assets/0.0.1'
    output.mkdir(parents=True,exist_ok=True)
    pdfmetrics.registerFont(TTFont('Brand',str(frontend/'packages/design-tokens/fonts/AskXuanSerif-Semibold.ttf')))
    pdfmetrics.registerFont(TTFont('Body','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
    tokens=json.loads((frontend/'packages/design-tokens/tokens.json').read_text())
    poppler=shutil.which('pdftoppm')
    if not poppler: raise RuntimeError('pdftoppm is required')
    builders=[('plate-01-colors',plate_colors),('plate-02-logos',plate_logos),('plate-03-typography',plate_typography),('plate-04-motion',plate_motion),('plate-05-components',plate_components),('plate-06-diy-orders',plate_order)]
    with tempfile.TemporaryDirectory(prefix='askxuan-handbook-plates-') as work:
        for name,builder in builders:
            pdf=Path(work)/(name+'.pdf')
            builder(pdf,tokens,frontend)
            subprocess.run([poppler,'-png','-singlefile','-r','72',str(pdf),str(output/name)],check=True,capture_output=True)
            with Image.open(output/(name+'.png')) as im:
                assert im.format=='PNG' and im.size==(W,H)
            print(f'{name}.png: {W}x{H}')
    if args.screenshots:
        # Temple navigation crops include account/business content: retain only
        # public handbook, never copy account data into it.
        names=[f'{base}-{theme}' for base in ['h5-home','h5-diy','h5-materials','admin-login'] for theme in ['light','dark']]+['h5-master-login-light']
        for name in names:
            source=args.screenshots/(name+'.jpg')
            with Image.open(source) as im:
                if im.format!='JPEG': raise ValueError(f'Expected original JPEG bytes: {source}')
            destination=output/(name+'.jpg')
            if source.resolve()!=destination.resolve():
                shutil.copyfile(source,destination)
            assert destination.read_bytes()==source.read_bytes()
            print(f'{name}.jpg: byte-identical screenshot copy')

    import hashlib
    manifest=[]
    for asset in sorted(output.iterdir()):
        if asset.suffix.lower() not in ['.png','.jpg']: continue
        with Image.open(asset) as image:
            manifest.append({'file':asset.name,'format':image.format,'size':list(image.size),'sha256':hashlib.sha256(asset.read_bytes()).hexdigest()})
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    main()
