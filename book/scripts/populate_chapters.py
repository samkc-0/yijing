import json
import os
import re

data_dir = 'data'
files = os.listdir(data_dir)
files = [f for f in files if f.endswith('.json')]
files.sort()

chapters = {}
for filename in files:
    match = re.match(r'^(\d+)_', filename)
    if match:
        number = match.group(1)
        with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
            content = json.load(f)
            chapters[number] = content

# Sort chapters by key
sorted_chapters = {k: chapters[k] for k in sorted(chapters.keys())}

print(json.dumps(sorted_chapters, ensure_ascii=False, indent=2))
