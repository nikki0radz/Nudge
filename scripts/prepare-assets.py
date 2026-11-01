import pathlib,sys,re,shutil
root=pathlib.Path(sys.argv[1]);dest=pathlib.Path(sys.argv[2]);dest.mkdir(parents=True,exist_ok=True)
for path in root.iterdir():
 if path.is_file() and (path.suffix in ('.js','.css','.svg','.webmanifest','.json') or path.name=='index.html') and path.name not in ('package.json','update.json'):
  shutil.copy2(path,dest/path.name)
# The APK carries its own trusted offline UI; it never loads remote executable app code.
p=dest/'index.html';s=p.read_text();s=re.sub(r'\?v=\d+','',s);p.write_text(s)
p=dest/'app.js';s=p.read_text().replace("if('serviceWorker'in navigator)","if(!window.NudgeNative&&'serviceWorker'in navigator)");p.write_text(s)
