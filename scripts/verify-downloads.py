"""Check ZIP contents and source bytes without extracting or changing originals."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'assets/downloads/manifest.json').read_text())


def sha256(stream):
    checksum = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        checksum.update(chunk)
    return checksum.hexdigest()


for category in ['logos', 'carteles', 'plantillas']:
    package = manifest[category]
    archive = root / package['url']
    assert archive.stat().st_size == package['bytes']
    with archive.open('rb') as stream:
        assert sha256(stream) == package['sha256']
    with zipfile.ZipFile(archive) as bundle:
        expected = {entry['member'] for entry in package['files']}
        assert set(bundle.namelist()) == expected
        for entry in package['files']:
            source = root / entry['source']
            assert source.stat().st_size == entry['bytes']
            with source.open('rb') as stream:
                assert sha256(stream) == entry['sha256'], source
            # Reading every member also checks its ZIP CRC.
            with bundle.open(entry['member']) as stream:
                assert sha256(stream) == entry['sha256'], entry['member']
            assert not any(part.startswith('.') for part in Path(entry['member']).parts)
        assert not any(name.endswith(('.ttf', '.otf', '.woff', '.woff2')) for name in expected)
    print(f'{category}: ZIP válido, {len(expected)} archivos idénticos a los originales.', flush=True)

for resource in manifest['recursos']:
    with (root / resource['url']).open('rb') as stream:
        assert sha256(stream) == resource['sha256']
print('Recursos: SVG original íntegro.', flush=True)
actions = [entry for entry in manifest['plantillas']['files'] if entry['source'].lower().endswith('.atn')]
assert len(actions) == 1
print('Acción Photoshop ATN incluida y verificada byte a byte.', flush=True)
