import os
import re

standalone_files = [
    'iCanCall 404 (standalone).html',
    'iCanCall Dashboard (standalone).html',
    'iCanCall Landing Page (standalone).html',
    'iCanCall Signup (standalone).html',
    'iCanCall Super Admin (standalone).html',
    'iCanCall Coming Soon (standalone).html',
    'ICanCall_Comparison_Chart.html'
]

sync_dirs = [
    '/Users/admin/pCloud Drive/G Drive/KSC/Website FIles/Pages/',
    '/Users/admin/Library/CloudStorage/GoogleDrive-aj@digitalrepandreviews.com/My Drive/pCloud Hellion/Clients/KSC/Website FIles/Pages/'
]

def get_concord_project_id():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('NEXT_PUBLIC_CONCORD_PROJECT_ID='):
                    return line.strip().split('=', 1)[1].strip()
    return None

def process_html_content(content, concord_id):
    concord_pattern = r'<!-- CONCORD_COOKIE_CONSENT_START -->[\s\S]*?<!-- CONCORD_COOKIE_CONSENT_END -->'
    
    # Check if the marker blocks are already present
    if not re.search(concord_pattern, content):
        # Insert markers right after the <head> tag
        head_match = re.search(r'(<head[^>]*>)', content, re.IGNORECASE)
        if head_match:
            marker_block = '\n<!-- CONCORD_COOKIE_CONSENT_START -->\n<!-- CONCORD_COOKIE_CONSENT_END -->'
            content = content[:head_match.end()] + marker_block + content[head_match.end():]
        else:
            print("Warning: <head> tag not found, skipping insertion.")
            return content

    # Now replace or remove the script in the block
    if concord_id and concord_id != 'YOUR_CONCORD_PROJECT_ID' and concord_id != '':
        replacement = f'<!-- CONCORD_COOKIE_CONSENT_START -->\n<script src="https://api.concord.tech/site-v1/{concord_id}/site-client"></script>\n<!-- CONCORD_COOKIE_CONSENT_END -->'
        content = re.sub(concord_pattern, replacement, content)
    else:
        # If no valid project ID, remove block entirely
        content = re.sub(concord_pattern, '', content)
        
    return content

def main():
    concord_id = get_concord_project_id()
    project_root = os.path.dirname(os.path.dirname(__file__))
    
    print(f"Concord Project ID: {concord_id}")
    
    # 1. Update files in project root
    for filename in standalone_files:
        filepath = os.path.join(project_root, filename)
        if os.path.exists(filepath):
            print(f"Processing root file: {filename}")
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = process_html_content(content, concord_id)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filename}")
        else:
            print(f"File not found in root: {filename}")

    # 2. Update files in sync directories
    for sync_dir in sync_dirs:
        if os.path.exists(sync_dir):
            print(f"Sync directory found: {sync_dir}")
            for filename in standalone_files:
                filepath = os.path.join(sync_dir, filename)
                if os.path.exists(filepath):
                    print(f"Processing synced file: {filename}")
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = process_html_content(content, concord_id)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated sync file: {filename}")
                else:
                    print(f"File not found in sync dir: {filename}")
        else:
            print(f"Sync directory not found/mounted: {sync_dir}")

if __name__ == '__main__':
    main()
