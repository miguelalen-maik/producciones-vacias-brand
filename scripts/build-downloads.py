"""Build static download packs from existing source assets, without modifying them."""
from pathlib import Path
import hashlib
import json
import re
import unicodedata
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DESTINATION = ROOT / 'assets' / 'downloads'
DESTINATION.mkdir(exist_ok=True)


def files(folder):
    return sorted(path for path in (ROOT / 'assets' / folder).rglob('*')
                  if path.is_file() and not any(part.startswith('.') for part in path.relative_to(ROOT).parts))


def safe_name(name):
    text = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9.]+', '-', text).strip('-')


def digest(path):
    checksum = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            checksum.update(chunk)
    return checksum.hexdigest()


def archive(filename, entries):
    destination = DESTINATION / filename
    pending = destination.with_suffix('.zip.part')
    manifest = []
    names = set()
    print(f'Preparando {filename} ({len(entries)} archivos)…', flush=True)
    with zipfile.ZipFile(pending, 'w', compression=zipfile.ZIP_DEFLATED,
                         compresslevel=6, allowZip64=True) as bundle:
        for source, member in entries:
            if member in names:
                raise ValueError(f'Nombre duplicado: {member}')
            names.add(member)
            before = source.stat()
            checksum = hashlib.sha256()
            info = zipfile.ZipInfo(member, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            with source.open('rb') as original, bundle.open(info, 'w', force_zip64=True) as packed:
                for chunk in iter(lambda: original.read(1024 * 1024), b''):
                    checksum.update(chunk)
                    packed.write(chunk)
            after = source.stat()
            if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                raise RuntimeError(f'El archivo cambió durante el empaquetado: {source}')
            manifest.append({'source': source.relative_to(ROOT).as_posix(), 'member': member,
                             'bytes': after.st_size, 'sha256': checksum.hexdigest()})
            print(f'  {member}', flush=True)
    pending.replace(destination)
    print(f'Creado {filename}: {destination.stat().st_size:,} bytes', flush=True)
    return {'url': destination.relative_to(ROOT).as_posix(), 'bytes': destination.stat().st_size,
            'sha256': digest(destination), 'files': manifest}


logos = []
for source in files('logos'):
    orientation = 'horizontal' if 'horizontal' in source.stem.lower() else 'principal'
    logos.append((source, f'Logos/{orientation}/{source.suffix[1:].lower()}/{safe_name(source.name)}'))
posters = [(source, 'Carteles/' + '/'.join(safe_name(part) for part in source.relative_to(ROOT / 'assets' / 'carteles').parts))
           for source in files('carteles')]
templates = [(source, f'Plantillas-y-Acciones/{folder}/{safe_name(source.name)}')
             for folder in ['plantillas', 'photoshop-actions'] for source in files(folder)]

manifest = {
    'logos': archive('producciones-vacias-logos.zip', logos),
    'carteles': archive('producciones-vacias-carteles.zip', posters),
    'plantillas': archive('producciones-vacias-plantillas-y-acciones.zip', templates),
    'recursos': [{'url': source.relative_to(ROOT).as_posix(), 'bytes': source.stat().st_size,
                  'sha256': digest(source)} for source in files('recursos')],
}
(DESTINATION / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('Manifiesto de contenido y hashes guardado.', flush=True)
