import os

src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))

# List of specific dynamic pages that need the Edge runtime
dynamic_pages = [
    'app/page.tsx', # Corresponding to /index
    'app/courses/[id]/page.tsx',
    'app/courses/[id]/final/page.tsx',
    'app/courses/[id]/lessons/[lessonId]/page.tsx',
    'app/dashboard/coding/[challengeId]/page.tsx',
    'app/verify/certificate/[code]/page.tsx'
]

files_to_modify = []

# 1. Collect all API route files
api_dir = os.path.join(src_dir, 'app', 'api')
for root, _, files in os.walk(api_dir):
    for file in files:
        if file in ('route.ts', 'route.tsx'):
            files_to_modify.append(os.path.join(root, file))

# 2. Collect specific dynamic pages
for page in dynamic_pages:
    page_path = os.path.join(src_dir, page)
    if os.path.exists(page_path):
        files_to_modify.append(page_path)

modified_count = 0

for filepath in files_to_modify:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if edge runtime is already declared
    if 'runtime = \'edge\'' in content or 'runtime = "edge"' in content:
        continue
    
    # Determine insertion point
    # If the file starts with "use client", place it on line 3 (line 1: "use client", line 2: blank, line 3: runtime)
    if content.startswith('"use client"') or content.startswith("'use client'"):
        # Split by first newline
        lines = content.split('\n', 1)
        first_line = lines[0]
        rest = lines[1] if len(lines) > 1 else ""
        
        # Prepend runtime to the rest, keeping a blank line
        new_content = f"{first_line}\n\nexport const runtime = 'edge'\n\n{rest.lstrip()}"
    else:
        # Prepend directly to the start of the file
        new_content = f"export const runtime = 'edge'\n\n{content}"
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    modified_count += 1
    print(f"Added Edge runtime to: {os.path.relpath(filepath, src_dir)}")

print(f"Successfully configured {modified_count} files for Edge Runtime compatibility.")
