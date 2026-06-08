import json
import base64
import gzip
import re
import os

def repack():
    js_uuid = "b62e6c20-5318-4666-a23f-8023975464f7"
    js_file = "scratch/unpacked_seniors/b62e6c20-5318-4666-a23f-8023975464f7.js"
    template_file = "scratch/unpacked_seniors/template.html"

    # 1. Read and compress the updated JS
    with open(js_file, 'rb') as f:
        js_content = f.read()
    compressed_js = gzip.compress(js_content)
    base64_js = base64.b64encode(compressed_js).decode('utf-8')
    print(f"Compressed JS: {len(js_content)} -> {len(compressed_js)} bytes (base64 length: {len(base64_js)})")

    # 2. Read the template HTML
    with open(template_file, 'r', encoding='utf-8') as f:
        template_html = f.read()

    targets = [
        'public/seniors.html',
        'iCanCall Seniors Landing (standalone).html'
    ]

    for target in targets:
        if not os.path.exists(target):
            print(f"Target file {target} does not exist. Skipping.")
            continue

        with open(target, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update the manifest JSON block
        manifest_match = re.search(r'<script type="__bundler/manifest">([\s\S]*?)</script>', content)
        if not manifest_match:
            print(f"Error: Manifest not found in {target}")
            continue

        manifest = json.loads(manifest_match.group(1).strip())
        if js_uuid in manifest:
            manifest[js_uuid]['data'] = base64_js
            print(f"Updated JS asset {js_uuid} in {target}'s manifest.")
        else:
            print(f"Error: JS uuid {js_uuid} not found in manifest of {target}")
            continue

        # Reassemble the manifest block
        new_manifest_json = json.dumps(manifest, ensure_ascii=False)
        # We don't need to do any special escaping for manifest JSON since it has no closing script tags,
        # but to be safe we match standard formatting.
        content = content[:manifest_match.start(1)] + new_manifest_json + content[manifest_match.end(1):]

        # Reload content to get fresh regex match indices after modification
        # Update the template block
        template_match = re.search(r'<script type="__bundler/template">([\s\S]*?)</script>', content)
        if not template_match:
            print(f"Error: Template block not found in {target}")
            continue

        # Serialize template back to JSON
        new_template_json = json.dumps(template_html, ensure_ascii=False)
        # Escape all forward slashes to prevent browser parsing errors (specifically </script>)
        new_template_json = new_template_json.replace('/', '\\/')

        content = content[:template_match.start(1)] + new_template_json + content[template_match.end(1):]

        # Write repacked file
        with open(target, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully repacked and updated {target}")

if __name__ == '__main__':
    repack()
