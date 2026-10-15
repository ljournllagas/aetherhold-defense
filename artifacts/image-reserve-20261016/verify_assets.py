"""Validate source art and companion files; never modify image pixels."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
jobs = json.loads((root / 'generation-jobs.json').read_text(encoding='utf-8'))
assert manifest['scope'] == {'victories': 10, 'relics': 10, 'livingArchive': 7}
assert len(manifest['assets']) == 27
assert len({a['id'] for a in manifest['assets']}) == 27
assert {j['id'] for j in jobs} == {a['id'] for a in manifest['assets']}
for kind, count in [('victory', 10), ('relic', 10), ('archive', 7)]:
    assert sum(a['kind'] == kind for a in manifest['assets']) == count, kind
for reference in json.loads((root / 'references/index.json').read_text(encoding='utf-8')):
    assert hashlib.sha256((root / reference['copy']).read_bytes()).hexdigest() == reference['sha256'], reference['copy']
gallery = (root / 'index.html').read_text(encoding='utf-8')
results = []
for asset in manifest['assets']:
    path = root / asset['master']
    assert asset['master'] in gallery, 'Stale gallery: ' + asset['id']
    integration = (root / asset['integrationPrompt']).read_text(encoding='utf-8')
    assert asset['master'] in integration, 'Stale integration prompt: ' + asset['id']
    assert (root / asset['promptFile']).is_file(), 'Missing generation prompt: ' + asset['id']
    if not path.is_file():
        results.append({'id': asset['id'], 'status': 'missing'})
        continue
    with Image.open(path) as im:
        im.load()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        original = Path(asset['source'])
        source_match = hashlib.sha256(original.read_bytes()).hexdigest() == digest if original.is_file() else None
        assert source_match is not False, 'Source copy mismatch: ' + asset['id']
        alpha = im.getchannel('A') if 'A' in im.getbands() else None
        bounds = alpha.getbbox() if alpha else (0, 0, im.width, im.height)
        solid = alpha.point(lambda v: 255 if v >= 16 else 0).getbbox() if alpha else bounds
        extrema = alpha.getextrema() if alpha else None
        issues = []
        wide = asset['kind'] == 'victory' or asset.get('role') in ['vista', 'terrain']
        aspect = 1672 / 940 if wide else 1
        if abs(im.width / im.height - aspect) > 0.02:
            issues.append('unexpected aspect ratio')
        if min(im.size) < 512:
            issues.append('insufficient master resolution')
        if not bounds:
            issues.append('empty image')
        if asset['transparent'] and (not extrema or extrema[0] != 0 or extrema[1] == 0):
            issues.append('missing usable transparency')
        if asset['transparent'] and bounds and (bounds[0] == 0 or bounds[1] == 0 or bounds[2] == im.width or bounds[3] == im.height):
            issues.append('raw alpha touches canvas edge; inspect clipping or residue')
        if asset['transparent'] and solid and (solid[0] == 0 or solid[1] == 0 or solid[2] == im.width or solid[3] == im.height):
            issues.append('solid alpha touches canvas edge; inspect clipping')
        results.append({'id': asset['id'], 'path': asset['master'], 'size': list(im.size), 'mode': im.mode, 'alphaBounds': bounds, 'alphaBoundsAt16': solid, 'alphaExtrema': extrema, 'sha256': digest, 'sourceCopyVerified': source_match, 'issues': issues, 'fileCheck': 'review' if issues else 'pass', 'visualReview': asset['status'], 'runtimeIntegration': 'not performed'})
report = {'expected': 27, 'present': sum('sha256' in a for a in results), 'assets': results}
(root / 'file-validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'expected': 27, 'present': report['present'], 'review': sum(bool(a.get('issues')) for a in results)}))
assert report['present'] == 27, 'Package incomplete; inspect saved queue before resuming.'
