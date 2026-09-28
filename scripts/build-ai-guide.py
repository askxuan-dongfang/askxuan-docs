#!/usr/bin/env python3
"""Build the current AI Harness guide with the repository's handbook styling."""
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('handbooks', root / 'scripts/build-handbooks.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
book = {
    'id': 'AI', 'title': 'AI 智能体使用与验收',
    'subtitle': '多步执行 · 补充资料 · 报告追问 · 运营管理',
    'audience': '2026-09-29 · 用户 / 产品 / 运营 / 测试',
    'file': '问玄东方_AI智能体使用与验收.pdf',
    'sections': ['AI智能体使用与验收.md'],
    'intro': '说明 AI 问事 Harness 的操作方式、现有能力、管理员配置和可重复执行的验收步骤。区分产品能力、生产发布、真实验证与尚未交付的端差异。',
}
output = root / 'output/pdf'
output.mkdir(parents=True, exist_ok=True)
print(json.dumps(module.build(book, output), ensure_ascii=False))
