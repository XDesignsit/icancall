# Builds public/pets.html and the root standalone copy from the Parents bundle.
# Usage: python3 -I scratch/pets-landing/build.py .   (then copy the standalone to pCloud + Google Drive)
import base64, gzip, json, re, sys, uuid
from pathlib import Path

repo = Path(sys.argv[1])
here = Path(__file__).parent
src = (repo / 'public/parents.html').read_text(encoding='utf8')

def swap(s, old, new, count=1):
    assert s.count(old) >= 1, f'missing: {old[:70]!r}'
    return s.replace(old, new, count)

TITLE_OLD = 'iCanCall for Parents — One number your child will never forget.'
TITLE_NEW = 'iCanCall for Pets — A microchip number that never goes out of date.'
DESC_NEW = ("Put one iCanCall number on your pet's microchip. Move or change phones and it still reaches you. "
            "Plans for dogs, cats and parrots from $29 a year.")

# ---- template markup ----
m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', src, re.S)
tpl = json.loads(m.group(2))

tpl = swap(tpl, TITLE_OLD, TITLE_NEW)
tpl = swap(tpl, '<title>', f'<meta name="description" content="{DESC_NEW}">\n<title>')
a, b = tpl.index('<main id="top">'), tpl.index('</main>') + len('</main>')
tpl = tpl[:a] + (here / 'main.html').read_text(encoding='utf8').strip() + tpl[b:]

nav_old = tpl[tpl.index('<nav class="nav">'):tpl.index('</nav>') + len('</nav>')]
tpl = swap(tpl, nav_old, '''<nav class="nav">
      <a href="#lesson">Why chips fail</a>
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#parrots">Parrots</a>
      <a href="#faq">Questions</a>
    </nav>''')

tpl = swap(tpl, 'One memorable number that always connects your child to a grown-up who loves them — from any phone, anywhere.',
           "One lost-pet number on your pet's microchip that always reaches you, even after you move or change phones.")
tpl = swap(tpl, '<li><a href="#lesson">One number</a></li>',
           '<li><a href="#lesson">Why chips fail</a></li>\n          <li><a href="#parrots">Parrots</a></li>')
contacts_old = tpl[tpl.index('window.IC_DEFAULT_CONTACTS'):tpl.index('];', tpl.index('window.IC_DEFAULT_CONTACTS')) + 2]
tpl = swap(tpl, contacts_old, '''window.IC_DEFAULT_CONTACTS = [
    { name: 'Jamie', rel: 'Owner', available: false },
    { name: 'Alex', rel: 'Partner', available: true },
    { name: 'Mrs. Chen', rel: 'Neighbor', available: true },
  ];''')
# Pets copy translations, merged into the page's DICT_MAP (Pets entries win, e.g. "Annual" as a plan name)
tr = json.loads((here / 'translations.json').read_text(encoding='utf8'))
keys = set(next(iter(tr.values()))['text'])
assert all(set(v['text']) == keys for v in tr.values()), 'translation keys differ between languages'
merge_js = ('     const PETS_DICT = ' + json.dumps(tr, ensure_ascii=False) + ';\n'
            '     for (const [l, d] of Object.entries(PETS_DICT)) {\n'
            '       const t = DICT_MAP[l]; if (!t) continue;\n'
            '       Object.assign(t.text, d.text);\n'
            '       Object.assign(t.attrs, d.attrs);\n'
            '     }\n\n')
tpl = swap(tpl, '     function translateDOM', merge_js + '     function translateDOM')

css_end = tpl.index('</style>\n</head>')
tpl = tpl[:css_end] + (here / 'pets.css').read_text(encoding='utf8') + tpl[css_end:]

# ---- interactions script ----
man = json.loads(re.search(r'<script type="__bundler/manifest">(.*?)</script>', src, re.S).group(1))
(old_id, asset), = man.items()
js = gzip.decompress(base64.b64decode(asset['data'])).decode()
js = swap(js, "let mode = 'cascade';", "let mode = 'menu';")
js = js.replace('(415) 200-CARE', '(415) 200-PAWS')
js = swap(js, 'Thanks for calling. Choose who to reach:', 'Thanks for calling about a found pet. Choose who to reach:')
js = swap(js, 'Add up to six trusted contacts to build your circle.', 'Add up to six contacts for the caller menu.')
run_old = js[js.index('  async function run() {'):js.index('  // honor reduced motion')]
js = swap(js, run_old, (here / 'demo_run.js').read_text(encoding='utf8'))

new_id = str(uuid.uuid5(uuid.NAMESPACE_URL, 'icancall/pets'))  # stable, so rebuilds don't churn
tpl = swap(tpl, f'<script src="{old_id}"></script>', f'<script src="{new_id}"></script>')
data = base64.b64encode(gzip.compress(js.encode(), mtime=0)).decode()
new_man = {new_id: {**asset, 'data': data}}

def enc(s):  # keep '</' out of the raw script block, like the Concord export
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')

out = src
out = re.sub(r'(<script type="__bundler/manifest">).*?(</script>)', lambda x: x.group(1) + json.dumps(new_man) + x.group(2), out, count=1, flags=re.S)
out = re.sub(r'(<script type="__bundler/template">).*?(</script>)', lambda x: x.group(1) + enc(tpl) + x.group(2), out, count=1, flags=re.S)
out = swap(out, TITLE_OLD, TITLE_NEW)
out = re.sub(r'(<meta name="description" content=")[^"]*', lambda x: x.group(1) + DESC_NEW, out, count=1)

# self-checks: round-trips, no leftover parent copy, no emoji
t2 = json.loads(re.search(r'<script type="__bundler/template">(.*?)</script>', out, re.S).group(1))
assert t2 == tpl
j2 = gzip.decompress(base64.b64decode(json.loads(re.search(r'<script type="__bundler/manifest">(.*?)</script>', out, re.S).group(1))[new_id]['data'])).decode()
assert j2 == js
body = tpl[tpl.index('<body>'):tpl.index('const DICT_MAP')]
for bad in ('your child', 'Grandma', '200-CARE', 'Essential', 'plan=pro'):
    assert bad not in body, bad
assert not re.search('[\U0001F300-\U0001FAFF☀-➿]', (here / 'main.html').read_text() + js[-3000:]), 'emoji'

(repo / 'public/pets.html').write_text(out, encoding='utf8')

# standalone copy: same page, links point at the sibling standalone files
std_links = {
    'href="/"': 'href="iCanCall Landing Page (standalone).html"',
    'href="/parents"': 'href="iCanCall Parents Landing (standalone).html"',
    'href="/seniors"': 'href="iCanCall Seniors Landing (standalone).html"',
    'href="/caregivers"': 'href="iCanCall Caregivers Landing (standalone).html"',
    'href="/comparison-chart"': 'href="ICanCall_Comparison_Chart.html"',
}
stpl = tpl
for k, v in std_links.items():
    stpl = stpl.replace(k, v)
stpl = stpl.replace('href="/signup?', 'href="iCanCall Signup (standalone).html?')
std = re.sub(r'(<script type="__bundler/template">).*?(</script>)', lambda x: x.group(1) + enc(stpl) + x.group(2), out, count=1, flags=re.S)
(repo / 'iCanCall Pets Landing (standalone).html').write_text(std, encoding='utf8')
print('ok', len(out), len(std))
