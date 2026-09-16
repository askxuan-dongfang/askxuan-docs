#!/usr/bin/env python3
"""Verify delivery traceability, PDF contents and archive hashes; does not run product tests."""
from pathlib import Path
import csv,json,re,hashlib,zipfile,io
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'docs/delivery'
cases=json.loads((D/'test-cases.json').read_text());assert len(cases)==66
ids={r['id'] for r in cases};assert len(ids)==66 and ids=={f'T{i:02}' for i in range(1,67)}
execution=list(csv.DictReader((D/'测试执行记录.csv').open()));assert len(execution)==66
mapping={'用例ID':'id','需求ID':'requirement','优先级':'priority','适用端':'surface','前置条件':'precondition','操作步骤':'steps','预期结果':'expected','所需证据':'evidence'}
md=(D/'全平台测试与验收手册.md').read_text()
for row,case in zip(execution,cases):
 assert all(row[c]==case[k] for c,k in mapping.items())
 assert row['结论']=='未执行' and not row['实际结果'] and not row['证据位置']
 assert md.count('**'+case['id']+' ·')==1
 assert all(case[k] in md for k in ['precondition','steps','expected','evidence'])
reqs=list(csv.DictReader((D/'需求追踪矩阵.csv').open()));assert len(reqs)==22
assert {r['需求ID'] for r in reqs}=={c['requirement'] for c in cases}
for r in reqs:assert {v.strip() for v in r['用例ID'].split(',')}=={c['id'] for c in cases if c['requirement']==r['需求ID']}
manifest=json.loads((ROOT/'output/pdf/交付套件/manifest.json').read_text())
for b in manifest['books']:
 p=ROOT/'output/pdf/交付套件'/b['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==b['sha256']
 assert hashlib.sha256((ROOT/b['source']).read_bytes()).hexdigest()==b['source_sha256']
 if '测试' in p.name:
  text='\n'.join(x.extract_text() or '' for x in PdfReader(p).pages)
  assert all(re.search(r'\b'+i+r'\b',text) for i in ids)
  for page in PdfReader(p).pages:
   t=page.extract_text() or '';starts=re.findall(r'\bT\d{2}\s*·',t)
   assert len(starts)==t.count('执行结论：未执行。'), 'Test case split across pages'
archive=ROOT/'output/delivery/问玄东方_产品测试交付包_20260916.zip'
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 root=z.namelist()[0].split('/')[0]+'/'
 checks=json.loads(z.read(root+'文件校验.json'));assert len(z.namelist())==len(checks)+1
 for name,digest in checks.items():assert hashlib.sha256(z.read(root+name)).hexdigest()==digest
 pdfs=[n for n in z.namelist() if n.endswith('.pdf')];assert len(pdfs)==8
 total=sum(len(PdfReader(io.BytesIO(z.read(n))).pages) for n in pdfs)
 for name in z.namelist():
  if name.endswith('.md'):
   s=z.read(name).decode()
   for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',s):
    if not target.startswith(('http:','https:','#')):
     import posixpath
     path=posixpath.normpath(posixpath.join(posixpath.dirname(name),target.split('#')[0]));assert path in z.namelist(),(name,target)
print(json.dumps({'test_cases':len(cases),'requirements':len(reqs),'all_new_cases':'未执行','core_pdf_pages':sum(b['pages'] for b in manifest['books']),'package_pdfs':len(pdfs),'package_pdf_pages':total,'archive_integrity':'passed','source_pdf_hashes':'passed','traceability':'passed','test_cases_kept_on_single_pages':True},ensure_ascii=False,indent=2))
