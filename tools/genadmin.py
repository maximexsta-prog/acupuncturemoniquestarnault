#!/usr/bin/env python3
"""Regenere le coffre de la page /admin apres un changement de mot de passe.

L'adresse de l'atelier de redaction n'est pas ecrite en clair dans
admin/index.html : elle est chiffree avec le mot de passe. Ce script produit
les trois valeurs a recopier dans l'objet COFFRE de cette page.

    pip install cryptography
    python3 tools/genadmin.py "mon-nouveau-mot-de-passe"

Puis recopier salt, iv et ct dans admin/index.html.
Le mot de passe lui-meme n'est stocke nulle part : s'il est perdu, il faut
relancer ce script pour en definir un nouveau.
"""

import sys
import json
import base64
import hashlib
import secrets

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except Exception as e:                                   # pragma: no cover
    sys.exit("cryptography est requis : pip install cryptography\n(%s)" % e)

URL = 'https://monique-atelier.vercel.app/blog'
ITER = 310000                                            # doit correspondre a admin/index.html


def coffre(mot_de_passe, url=URL, iterations=ITER):
    sel = secrets.token_bytes(16)
    iv = secrets.token_bytes(12)
    cle = hashlib.pbkdf2_hmac('sha256', mot_de_passe.encode(), sel, iterations, 32)
    chiffre = AESGCM(cle).encrypt(iv, url.encode(), None)
    b64 = lambda b: base64.b64encode(b).decode()
    return {'salt': b64(sel), 'iv': b64(iv), 'ct': b64(chiffre), 'iter': iterations}


if __name__ == '__main__':
    if len(sys.argv) != 2 or not sys.argv[1]:
        sys.exit('usage : python3 tools/genadmin.py "mot-de-passe"')
    print(json.dumps(coffre(sys.argv[1]), indent=2))
