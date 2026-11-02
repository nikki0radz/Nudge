import pathlib,sys,re,shutil
root=pathlib.Path(sys.argv[1]);dest=pathlib.Path(sys.argv[2]);dest.mkdir(parents=True,exist_ok=True)
for path in root.iterdir():
 if path.is_file() and (path.suffix in ('.js','.css','.svg','.webmanifest','.json') or path.name=='index.html') and path.name not in ('package.json','update.json'):
  shutil.copy2(path,dest/path.name)
# Bundled UI is the stable fallback. Opt-in previews use separately signed snapshots.
p=dest/'index.html';s=p.read_text();s=re.sub(r'\?v=\d+','',s);p.write_text(s)
p=dest/'app.js';s=p.read_text().replace("if('serviceWorker'in navigator)","if(!window.NudgeNative&&'serviceWorker'in navigator)");p.write_text(s)

if (root/"assets").is_dir():
 shutil.copytree(root/"assets",dest/"assets",dirs_exist_ok=True)

# Package display-sized copies; retain the generated originals in the repository.
from PIL import Image
for sticker in (dest/"assets"/"stickers").glob("*.png"):
 image=Image.open(sticker);image.thumbnail((256,256));image.save(sticker,format="PNG",optimize=True)
