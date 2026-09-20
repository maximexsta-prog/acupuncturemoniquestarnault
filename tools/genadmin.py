import sys, os, json, base64, hashlib, secrets
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pylibs'))
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

URL  = 'https://monique-atelier.vercel.app/blog'
ITER = 310000

mdp = sys.argv[1] if len(sys.argv) > 1 else None
if not mdp:
    mots = ['lotus','cedre','riviere','saison','bambou','argile','sentier','aiguille']
    mdp = '%s-%s-%d' % (secrets.choice(mots), secrets.choice(mots), secrets.randbelow(90)+10)

salt = secrets.token_bytes(16)
iv   = secrets.token_bytes(12)
key  = hashlib.pbkdf2_hmac('sha256', mdp.encode(), salt, ITER, 32)
ct   = AESGCM(key).encrypt(iv, URL.encode(), None)

b64 = lambda b: base64.b64encode(b).decode()
print(json.dumps({'mdp': mdp, 'salt': b64(salt), 'iv': b64(iv), 'ct': b64(ct), 'iter': ITER}, indent=2))
