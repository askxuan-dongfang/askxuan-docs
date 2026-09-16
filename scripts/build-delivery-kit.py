#!/usr/bin/env python3
"""Build stakeholder PDFs and a credential-free distributable kit from maintained sources."""
from pathlib import Path
import importlib.util,json,hashlib,csv,zipfile,shutil,argparse,re
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('handbooks',ROOT/'scripts/build-handbooks.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
BOOKS=[
 {'id':'05','title':'产品交付与上手指南','subtitle':'认识产品 · 角色协作 · 完成一次任务','audience':'产品负责人 · 需求提出方 · 业务试用人员','intro':'从用户入口走到完整交付。用当前产品规则解释如何注册、发现、预约、执行、核对回执和创作定制，并明确各端差异。'},
 {'id':'06','title':'全平台测试与验收手册','subtitle':'测试准备 · 66 个场景 · 留证与放行','audience':'测试负责人 · 产品与需求验收人 · 技术支持','intro':'提供前置条件、操作步骤、通过条件和证据要求。按端执行、按需求追踪，明确区分本轮结果、历史证据与待验证依赖。'},
 {'id':'07','title':'需求范围与追踪矩阵','subtitle':'22 项需求 · 责任边界 · 变更与签收','audience':'需求负责人 · 产品经理 · 开发与测试','intro':'把业务规则、当前实现、验收用例和证据关联起来。用明确的差异与签收条件管理交付，避免以功能存在代替验收完成。'},
 {'id':'08','title':'投资侧产品与验证说明','subtitle':'产品价值 · 商业假设 · 验证关卡','audience':'投资沟通参与者 · 合作决策人 · 产品负责人','intro':'说明产品解决的问题、差异化设计、商业化路径与验证材料。已知事实、假设和待补充数据分别呈现，不以演示数据替代经营结果。'},
]
for b in BOOKS:b.update(file='问玄东方_'+b['title']+'.pdf',sections=['../delivery/'+b['title']+'.md'])
# Keep each test's conditions, steps, assertions and evidence on the same page.
original_parse=h.parse
def delivery_parse(path,book,seq,links):
 flows=original_parse(path,book,seq,links)
 if book['id']!='06':return flows
 result=[];i=0
 while i<len(flows):
  flow=flows[i]
  if isinstance(flow,h.Paragraph) and re.match(r'^T\d{2} ·',flow.getPlainText()):
   group=flows[i:i+5]
   assert len(group)==5 and all(isinstance(x,h.Paragraph) for x in group) and group[-1].getPlainText().startswith('证据：')
   result.append(h.KeepTogether(group));i+=5
  else:result.append(flow);i+=1
 return result
h.parse=delivery_parse
ap=argparse.ArgumentParser();ap.add_argument('--package-only',action='store_true');ap.add_argument('--book',choices=['05','06','07','08']);args=ap.parse_args()
out=ROOT/'output/pdf/交付套件';out.mkdir(parents=True,exist_ok=True)
cases=json.loads((ROOT/'docs/delivery/test-cases.json').read_text());assert len(cases)==66 and len({r['id'] for r in cases})==66
reqs=list(csv.DictReader((ROOT/'docs/delivery/需求追踪矩阵.csv').open()));assert len(reqs)==22
for r in reqs:assert {x.strip() for x in r['用例ID'].split(',')}=={x['id'] for x in cases if x['requirement']==r['需求ID']}
for r in cases:assert f"**{r['id']} ·" in (ROOT/'docs/delivery/全平台测试与验收手册.md').read_text()
results=[]
for b in BOOKS:
 if not args.package_only and (not args.book or args.book==b['id']):h.build(b,out)
 p=out/b['file'];results.append({'file':p.name,'pages':len(PdfReader(p).pages),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':f"docs/delivery/{b['title']}.md",'source_sha256':hashlib.sha256((ROOT/'docs/delivery'/f"{b['title']}.md").read_bytes()).hexdigest()})
(out/'manifest.json').write_text(json.dumps({'edition':'0.0.1','date':'2026-09-16','books':results,'test_scenarios':66,'requirements':22,'execution_status':'not_executed_in_this_delivery'},ensure_ascii=False,indent=2)+'\n')
# Explicit allowlist: no original artifacts, credentials, tokens or raw deployment logs.
base=ROOT/'output/delivery/问玄东方_产品测试交付包_20260916';base.mkdir(parents=True,exist_ok=True)
files={ROOT/'docs/delivery/README.md':'开始阅读.md',out/'manifest.json':'交付清单.json'}
for b in BOOKS:files[out/b['file']]='核心交付/'+b['file']
for b in h.BOOKS:files[ROOT/'output/pdf'/b['file']]='配套手册/'+b['file']
for name in ['测试执行记录.csv','需求追踪矩阵.csv','缺陷与复验记录.csv']:files[ROOT/'docs/delivery'/name]='执行模板/'+name
for b in BOOKS:files[ROOT/'docs/delivery'/f"{b['title']}.md"]='正文/'+b['title']+'.md'
for name in ['h5-home-20260916.png','ios-home-20260916.png']:files[ROOT/'docs/assets/0.0.1'/name]='assets/0.0.1/'+name
files[ROOT/'docs/delivery/test-cases.json']='执行模板/test-cases.json'
qa=ROOT/'docs/delivery/文档检查.json'
if qa.exists():files[qa]='文档检查.json'
allowed=set(files.values())|{'文件校验.json'}
for old in base.rglob('*'):
 if old.is_file() and str(old.relative_to(base)) not in allowed:raise SystemExit('Unexpected file in package: '+str(old))
for src,dst in files.items():
 target=base/dst;target.parent.mkdir(parents=True,exist_ok=True)
 if dst=='开始阅读.md':
  text=src.read_text().replace('../../output/pdf/交付套件/','核心交付/')
  for b in BOOKS:text=text.replace(']('+b['title']+'.md)','](正文/'+b['title']+'.md)')
  for name in ['测试执行记录.csv','需求追踪矩阵.csv','缺陷与复验记录.csv']:text=text.replace(']('+name+')','](执行模板/'+name+')')
  target.write_text(text)
 else:shutil.copyfile(src,target)
checks={dst:hashlib.sha256((base/dst).read_bytes()).hexdigest() for dst in files.values()};(base/'文件校验.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
archive=base.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for p in sorted(base.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(base.parent))
print(json.dumps({'books':results,'archive':str(archive),'files':len(checks)+1},ensure_ascii=False,indent=2))
