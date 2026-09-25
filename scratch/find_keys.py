import os, re

pattern = re.compile(r"['\"][ABCDabcd]['\"]")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'vendor' in root or 'storage' in root:
        continue
    for f in files:
        if f.endswith(('.php', '.json', '.md', '.csv', '.txt')):
            path = os.path.join(root, f)
            try:
                with open(path, encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    matches = pattern.findall(content)
                    if len(matches) > 30 and 'toefl' in content.lower():
                        print(f"File with many ABCD and 'toefl': {path} (matches: {len(matches)})")
            except Exception as e:
                pass
