"""Build an allowlisted runtime ZIP; never package the project directory recursively."""
from pathlib import Path
import hashlib, json, re, tempfile, zipfile, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
LOCALES = ['en', 'ja', 'ko', 'zh_CN', 'zh_TW', 'es', 'pt_BR']
FILES = ['LICENSE', 'manifest.json', 'core.js', 'content.js', 'i18n.js', 'i18n-data.js',
         'popup.html', 'popup.css', 'popup.js'] + [f'_locales/{x}/messages.json' for x in LOCALES] + [f'icons/icon{x}.png' for x in [16,32,48,128]]
m = json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
assert re.fullmatch(r'\d+\.\d+\.\d+', m['version'])
version=m['version']
assert json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version']==version
lock=json.loads((ROOT/'package-lock.json').read_text(encoding='utf-8'))
assert lock['version']==lock['packages']['']['version']==version
subprocess.run([sys.executable,str(ROOT/'tools/sync-tooltip-policy.py'),'--check'],check=True)
policy=(ROOT/'tools/tooltip-policy.js').read_text(encoding='utf-8').rstrip()
embedded='\n'.join('  '+line if line else '' for line in policy.splitlines())
assert embedded in (ROOT/'content.js').read_text(encoding='utf-8')
assert m['name'] == 'Colors for ChatGPT (by marusin)'
assert len(FILES) == len(set(FILES)) == 20
refs = list(m['icons'].values()) + list(m['action']['default_icon'].values()) + [m['action']['default_popup']]
for cs in m['content_scripts']: refs += cs.get('js', []) + cs.get('css', [])
html = (ROOT/'popup.html').read_text(encoding='utf-8')
refs += re.findall(r'<script[^>]+src="([^"]+)"', html)
refs += re.findall(r'<link[^>]+href="([^"]+)"', html)
assert all(x in FILES for x in refs), refs
for x in FILES: assert (ROOT/x).is_file(), x
for locale in LOCALES:
    d = json.loads((ROOT/f'_locales/{locale}/messages.json').read_text(encoding='utf-8'))
    assert d['appName']['message'] == m['name']
    assert d['appDescription']['message'] == (ROOT/f'store-listing/{locale}/summary.txt').read_text(encoding='utf-8').strip()
out = ROOT/'releases'; out.mkdir(exist_ok=True)
archive = out/f"colors-for-chatgpt-{m['version']}.zip"
# Fixed timestamps and explicit paths make repeated builds byte-identical.
import io
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name in sorted(FILES):
        info = zipfile.ZipInfo(name, date_time=(1980,1,1,0,0,0))
        info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
        z.writestr(info, (ROOT/name).read_bytes(), compresslevel=9)
data = buffer.getvalue()
if archive.exists():
    assert archive.read_bytes() == data, 'Existing ZIP differs: preserve it and choose a new artifact name.'
else: archive.write_bytes(data)
extracted = Path(tempfile.mkdtemp(prefix=f'colors-for-chatgpt-{version}-package-'))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert z.namelist() == sorted(FILES)
    for name in z.namelist():
        target = extracted/name
        assert target.resolve().is_relative_to(extracted.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(z.read(name))
        assert target.read_bytes() == (ROOT/name).read_bytes()
sha = hashlib.sha256(data).hexdigest()
(archive.with_suffix('.zip.sha256')).write_text(f'{sha}  {archive.name}\n', encoding='utf-8')
(archive.with_suffix('.files.txt')).write_text('\n'.join(sorted(FILES))+'\n', encoding='utf-8')
report = {'embeddedPolicyCheck':'PASS','policySourceSha256':hashlib.sha256(policy.encode()).hexdigest(),'version':m['version'], 'archive':str(archive), 'sha256':sha, 'bytes':len(data),
          'fileCount':len(FILES), 'extractedDirectory':str(extracted), 'referenceCheck':'PASS',
          'crcAndSourceEquality':'PASS', 'files':[{'path':x,'sha256':hashlib.sha256((ROOT/x).read_bytes()).hexdigest()} for x in sorted(FILES)]}
(out/f'package-{version}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'},ensure_ascii=False))
