"""Render document pages and optimize source photos for the public MOU board."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageOps
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('--source', default='../MOU')
parser.add_argument('--out', default='.local/mou-public')
args = parser.parse_args()
root, output = Path(args.source).resolve(), Path(args.out)
output.mkdir(parents=True, exist_ok=True)
catalog = json.loads(Path('data/mou-catalog.json').read_text(encoding='utf-8'))
records = []
for agreement in catalog['agreements']:
    if agreement['reviewStatus'] != 'reviewed':
        continue
    for source in agreement['sources']:
        # Two scans of the same OCU agreement: display one complete copy.
        if agreement['key'] == 'ocu-20230425' and source['path'] == '한국열린_협약서.pdf':
            continue
        path = (root / source['path']).resolve()
        if not path.is_relative_to(root):
            raise ValueError('Source outside MOU directory')
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != source['sha256']:
            raise ValueError('Source changed since review')
        pages = len(PdfReader(path).pages) if path.suffix.lower() == '.pdf' else 1
        for page in range(1, pages + 1):
            target = output / f'{digest[:20]}-{page}.jpg'
            if path.suffix.lower() == '.pdf':
                render = output / f'render-{digest[:20]}-{page}'
                subprocess.run([shutil.which('pdftoppm'), '-f', str(page), '-l', str(page),
                                '-r', '140', '-singlefile', '-png', str(path), str(render)],
                               check=True, capture_output=True)
                image_path = render.with_suffix('.png')
            else:
                image_path = path
            with Image.open(image_path) as original:
                image = ImageOps.exif_transpose(original).convert('RGB')
                image.thumbnail((1800, 2400), Image.Resampling.LANCZOS)
                image.save(target, 'JPEG', quality=87, optimize=True)
                width, height = image.size
            if image_path != path:
                image_path.unlink()
            event = path.stem.startswith(('기장MOU', 'IMG_005')) or path.stem == '게시판'
            records.append({'agreementKey': agreement['key'], 'sourcePath': source['path'],
                            'page': page, 'path': target.as_posix(), 'isEvent': event,
                            'name': f"{agreement['partner']}_{'협약식' if event else '협약서'}_{page}.jpg",
                            'width': width, 'height': height,
                            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
records.sort(key=lambda row: (row['agreementKey'], not row['isEvent'], row['sourcePath'], row['page']))
(output / 'index.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Prepared {len(records)} public images for {len(set(row["agreementKey"] for row in records))} agreements.')
print(f'Total image bytes: {sum(Path(row["path"]).stat().st_size for row in records)}')
