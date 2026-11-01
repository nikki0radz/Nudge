import base64,hashlib,json,pathlib,zipfile
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization.pkcs7 import load_der_pkcs7_certificates
from cryptography.exceptions import InvalidSignature
root=pathlib.Path(__file__).resolve().parent.parent
version=json.loads((root/'update.json').read_text())['versionName']
with zipfile.ZipFile(root/'downloads'/('nudge-'+version+'.apk')) as apk:
 cert=load_der_pkcs7_certificates(apk.read('META-INF/NUDGE.RSA'))[0]
envelope=json.loads((root/'preview/manifest.json').read_text());payload=base64.b64decode(envelope['payload']);signature=base64.b64decode(envelope['signature']);key=cert.public_key()
key.verify(signature,b'NUDGE_UI_PREVIEW_V1\n'+payload,padding.PKCS1v15(),hashes.SHA256())
try:key.verify(signature,b'NUDGE_UI_PREVIEW_V1\n'+payload+b' ',padding.PKCS1v15(),hashes.SHA256());raise AssertionError('Tampered preview accepted')
except InvalidSignature:pass
manifest=json.loads(payload);seen=set()
for f in manifest['files']:
 assert f['path'] not in seen and '/' not in f['path'];seen.add(f['path']);data=(root/'preview'/f['path']).read_bytes();assert len(data)==f['size'];assert hashlib.sha256(data).hexdigest()==f['sha256'];assert hashlib.sha256(data+b'changed').hexdigest()!=f['sha256']
assert 'index.html' in seen and 'native.js' in seen
print('Preview signature matches the installed APK signer; tampering fails; every file hash and size matches.')
