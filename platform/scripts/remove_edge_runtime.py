import os
import re

src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Patterns to match export const runtime = 'edge' or "edge" with optional semicolon
pattern = re.compile(r"^\s*export\s+const\s+runtime\s*=\s*['\"]edge['\"]\s*;?\s*$", re.MULTILINE)

modified_files = []

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if pattern.search(content):
                # Remove the matching line and any trailing empty lines if they were introduced
                new_content = pattern.sub('', content)
                # Clean up multiple consecutive newlines that might result from removal
                new_content = re.sub(r'\n\n\n+', '\n\n', new_content)
                # If it was at the very start of the file with a newline, strip it
                if new_content.startswith('\n'):
                    new_content = new_content.lstrip('\n')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                modified_files.append(filepath)

print(f"Successfully removed edge runtime from {len(modified_files)} files:")
for f in modified_files:
    print(f" - {os.path.relpath(f, src_dir)}")
