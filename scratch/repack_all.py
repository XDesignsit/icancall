import json
import base64
import gzip
import re
import os

configs = [
    {
        'name': 'parents',
        'js_uuid': '61b29d69-e725-4072-9983-c8e66644aee2',
        'js_file': 'scratch/unpacked_parents/61b29d69-e725-4072-9983-c8e66644aee2.js',
        'template_file': 'scratch/unpacked_parents/template.html',
        'targets': ['public/parents.html', 'iCanCall Parents Landing (standalone).html']
    },
    {
        'name': 'seniors',
        'js_uuid': 'b62e6c20-5318-4666-a23f-8023975464f7',
        'js_file': 'scratch/unpacked_seniors/b62e6c20-5318-4666-a23f-8023975464f7.js',
        'template_file': 'scratch/unpacked_seniors/template.html',
        'targets': ['public/seniors.html', 'iCanCall Seniors Landing (standalone).html']
    },
    {
        'name': 'caregivers',
        'js_uuid': '3f873d16-1dde-47a7-b09b-2f21ae6a5c3b',
        'js_file': 'scratch/unpacked_caregivers/3f873d16-1dde-47a7-b09b-2f21ae6a5c3b.js',
        'template_file': 'scratch/unpacked_caregivers/template.html',
        'targets': ['public/caregivers.html', 'iCanCall Caregivers Landing (standalone).html']
    }
]

def repack_all():
    for config in configs:
        name = config['name']
        js_uuid = config['js_uuid']
        js_file = config['js_file']
        template_file = config['template_file']
        targets = config['targets']

        print(f"\n--- Repacking {name} ---")

        # 1. Read and compress the updated JS
        with open(js_file, 'rb') as f:
            js_content = f.read()
        compressed_js = gzip.compress(js_content)
        base64_js = base64.b64encode(compressed_js).decode('utf-8')
        print(f"Compressed JS: {len(js_content)} -> {len(compressed_js)} bytes (base64 length: {len(base64_js)})")

        # 2. Read the template HTML
        with open(template_file, 'r', encoding='utf-8') as f:
            template_html = f.read()

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
            content = content[:manifest_match.start(1)] + new_manifest_json + content[manifest_match.end(1):]

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
    repack_all()
