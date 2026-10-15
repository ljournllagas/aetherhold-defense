"""Read-only image validation; writes measurements, never changes pixels."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert sum(manifest['scope'].values()) == 44, 'Authorized scope must remain 44 assets.'
assert len(manifest['assets']) == 44, 'Manifest is missing authorized assets; merge the complete queue.'
assert len({asset['id'] for asset in manifest['assets']}) == 44, 'Duplicate asset IDs.'
expected_groups = {'evolution': 14, 'sigil': 10, 'portrait': 10, 'finale': 1, 'map': 2, 'expansion': 7}
jobs = json.loads((root / 'generation-jobs.json').read_text(encoding='utf-8'))
assert {job['id'] for job in jobs} == {asset['id'] for asset in manifest['assets']}, 'Generation queue and manifest disagree.'
gallery = (root / 'index.html').read_text(encoding='utf-8')
for repair in json.loads((root / 'repair-queue.json').read_text(encoding='utf-8')):
    assert repair['status'] == 'resolved', 'Unfinished image repair: ' + repair['id']
    assert repair['selectedMaster'] == next(asset['master'] for asset in manifest['assets'] if asset['id'] == repair['id']), 'Repair selection mismatch.'
for reference in json.loads((root / 'references/index.json').read_text(encoding='utf-8')):
    assert hashlib.sha256((root / reference['copy']).read_bytes()).hexdigest() == reference['sha256'], 'Reference snapshot changed: ' + reference['copy']
for group, count in expected_groups.items():
    actual = sum((asset['id'].startswith('expansion') if group == 'expansion' else asset['id'].startswith(group + ':')) for asset in manifest['assets'])
    assert actual == count, 'Incorrect use-case coverage: ' + group
results = []
for asset in manifest['assets']:
    path = root / asset['master']
    assert asset['master'] in gallery, 'Gallery references stale master: ' + asset['id']
    integration_prompt = root / ('integration-prompts/' + asset['id'].replace(':', '-') + '.md')
    assert integration_prompt.is_file(), 'Missing integration prompt: ' + asset['id']
    assert asset['master'] in integration_prompt.read_text(encoding='utf-8'), 'Integration prompt references stale master: ' + asset['id']
    assert (root / ('prompts/' + path.stem + '.txt')).is_file(), 'Missing generation prompt: ' + asset['id']
    if not path.is_file():
        results.append({'id': asset['id'], 'status': 'missing'})
        continue
    with Image.open(path) as im:
        im.load()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        original = Path(asset['source'])
        source_copy_verified = hashlib.sha256(original.read_bytes()).hexdigest() == digest if original.is_file() else None
        assert source_copy_verified is not False, 'Master differs from generated original: ' + asset['id']
        alpha = im.getchannel('A') if 'A' in im.getbands() else None
        bounds = alpha.getbbox() if alpha else (0, 0, im.width, im.height)
        extrema = alpha.getextrema() if alpha else None
        solid_bounds = alpha.point(lambda value: 255 if value >= 16 else 0).getbbox() if alpha else bounds
        transparent_required = asset['id'].startswith(('evolution:', 'sigil:', 'expansion-tower:', 'expansion-enemy:', 'expansion-boss:'))
        issues = []
        wide = asset['id'].startswith(('finale:', 'map:', 'expansion-vista:', 'expansion-map:'))
        expected_aspect = 1672 / 940 if wide else 1
        if abs(im.width / im.height - expected_aspect) > 0.02:
            issues.append('unexpected aspect ratio for intended use')
        if min(im.size) < 512:
            issues.append('source resolution below master-art minimum')
        if not bounds:
            issues.append('empty image')
        if transparent_required and (not extrema or extrema[0] != 0 or extrema[1] == 0):
            issues.append('missing usable transparency')
        if transparent_required and bounds and (bounds[0] == 0 or bounds[1] == 0 or bounds[2] == im.width or bounds[3] == im.height):
            issues.append('occupied pixels touch canvas edge; inspect clipping')
        results.append({'id': asset['id'], 'path': asset['master'], 'size': list(im.size), 'mode': im.mode, 'alphaBounds': bounds, 'alphaBoundsAt16': solid_bounds, 'alphaExtrema': extrema, 'sha256': digest, 'sourceCopyVerified': source_copy_verified, 'fileCheck': 'pass' if not issues else 'review', 'issues': issues, 'visualReview': 'visual-review.md', 'runtimeIntegration': 'not performed'})
report = {'expected': len(manifest['assets']), 'present': sum('sha256' in item for item in results), 'assets': results}
(root / 'file-validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'expected': report['expected'], 'present': report['present'], 'review': sum(item.get('fileCheck') == 'review' for item in results)}))
assert report['present'] == report['expected'], 'Asset package is incomplete; resume missing items.'
