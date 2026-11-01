#!/usr/bin/env python3
"""Create a signed preview snapshot. Publish preview/ only to test visual changes.
Requires cryptography, NUDGE_KEYSTORE and NUDGE_STORE_PASSWORD; secrets never enter output.
"""
import argparse,base64,hashlib,json,os,pathlib,subprocess,sys,tempfile,shutil
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
ROOT=pathlib.Path(__file__).resolve().parent.parent
FILES=('index.html','style.css','timing.js','people-core.js','intent.js','engine.js','ai-client.js','recording.js','photos.js','people.js','calendar.js','receipts.js','native.js','backups.js','app.js','icon.svg','manifest.webmanifest')
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,default=ROOT);source=parser.parse_args().source.resolve()
 key,cert,_=load_key_and_certificates(pathlib.Path(os.environ['NUDGE_KEYSTORE']).read_bytes(),os.environ['NUDGE_STORE_PASSWORD'].encode())
 with tempfile.TemporaryDirectory() as temp:
  stage=pathlib.Path(temp);subprocess.run([sys.executable,str(ROOT/'scripts/prepare-assets.py'),str(source),str(stage)],check=True)
  records=[{'path':name,'sha256':hashlib.sha256((stage/name).read_bytes()).hexdigest(),'size':(stage/name).stat().st_size} for name in FILES]
  revision=hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest()[:12]
  payload=json.dumps({'revision':revision,'minimumNativeVersion':3,'files':records},separators=(',',':')).encode()
  signature=key.sign(b'NUDGE_UI_PREVIEW_V1\n'+payload,padding.PKCS1v15(),hashes.SHA256())
  target=ROOT/'preview';target.mkdir(exist_ok=True)
  for name in FILES:shutil.copy2(stage/name,target/name)
  (target/'manifest.json').write_text(json.dumps({'payload':base64.b64encode(payload).decode(),'signature':base64.b64encode(signature).decode()},separators=(',',':'))+'\n')
  print('Signed preview '+revision+' prepared. Publish preview/ without changing update.json for visual-only rounds.')
if __name__=='__main__':main()
