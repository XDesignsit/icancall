import json
import base64
import gzip
import re
import os

target = 'iCanCall Dashboard (standalone).html'
js_file = 'extracted_designs/icancall_dashboard/79f5ca2f-9df1-48ab-b4c6-485ae45e820e.js'
js_uuid = '79f5ca2f-9df1-48ab-b4c6-485ae45e820e'

def repack_dashboard():
    print(f"\n--- Repacking Dashboard Standalone ---")
    
    # 1. Read and compress the updated JS
    with open(js_file, 'rb') as f:
        js_content = f.read()
    compressed_js = gzip.compress(js_content)
    base64_js = base64.b64encode(compressed_js).decode('utf-8')
    print(f"Compressed JS: {len(js_content)} -> {len(compressed_js)} bytes")

    if not os.path.exists(target):
        print(f"Error: Target file {target} does not exist.")
        return

    with open(target, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update the manifest JSON block
    manifest_match = re.search(r'<script type="__bundler/manifest">([\s\S]*?)</script>', content)
    if not manifest_match:
        print(f"Error: Manifest not found in {target}")
        return

    manifest = json.loads(manifest_match.group(1).strip())
    if js_uuid in manifest:
        manifest[js_uuid]['data'] = base64_js
        print(f"Updated JS asset {js_uuid} in {target}'s manifest.")
    else:
        print(f"Error: JS uuid {js_uuid} not found in manifest of {target}")
        return

    # Reassemble the manifest block
    new_manifest_json = json.dumps(manifest, ensure_ascii=False)
    content = content[:manifest_match.start(1)] + new_manifest_json + content[manifest_match.end(1):]

    # Write repacked file
    with open(target, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully repacked and updated {target}")

if __name__ == '__main__':
    repack_dashboard()
