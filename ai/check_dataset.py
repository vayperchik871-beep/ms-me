import json
with open("D:/петка/ai/train_dataset.jsonl") as f:
    lines = f.readlines()
print(f"Total examples: {len(lines)}")
data = json.loads(lines[0])
print(f"System: {data['messages'][0]['content'][:60]}...")
print(f"First user: {data['messages'][1]['content'][:50]}...")
bad = ['LLM', 'нейросеть', 'fine-tune', 'модель ', 'AI', 'language model']
found = False
for li, line in enumerate(lines):
    d = json.loads(line)
    for m in d['messages']:
        if m['role'] == 'assistant':
            for b in bad:
                if b.lower() in m['content'].lower():
                    print(f"WARN: line {li+1} says '{b}'")
                    found = True
if not found:
    print("No bad words in assistant responses!")
print("Dataset OK!")
