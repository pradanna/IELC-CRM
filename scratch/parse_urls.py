import re

with open(r'C:\Users\Pradana Mahendra\.gemini\antigravity-ide\brain\bbb71da0-d7f5-48c2-9004-1d20d3d4d250\.system_generated\steps\919\content.md', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'data-embed-doc-id="([^"]+)"', text)
for doc_id in set(matches):
    pos = text.find(doc_id)
    around = text[max(0, pos-600):min(len(text), pos+600)]
    clean = re.sub(r'<[^>]+>', ' ', around)
    clean = ' '.join(clean.split())
    print(f'ID: {doc_id}')
    print(f'Context: {clean}\n')
