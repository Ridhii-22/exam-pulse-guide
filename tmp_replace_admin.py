from pathlib import Path
path = Path('src/lib/api/admin.functions.ts')
text = path.read_text(encoding='utf-8')
old = 'query = query.ilike("title", `%${input.search}%`);'
new = 'query = query.ilike("title", "%" + input.search + "%");'
print('old repr:', repr(old))
print('old len:', len(old))
line=text.splitlines()[158]
print('line 159 repr:', repr(line))
print('line 159 len:', len(line))
print('line[6:56] repr:', repr(line[6:56]))
print('line[6:56] len:', len(line[6:56]))
print('difference at index:', [i for i,(a,b) in enumerate(zip(old, line[6:56])) if a!=b])
print('occurrences before:', text.count(old))
text = text.replace(old, new)
print('occurrences after:', text.count(old))
path.write_text(text, encoding='utf-8')
