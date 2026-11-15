#!/usr/bin/env python3
"""Compare les fichiers du dépôt avec ce que le site affiche. Écrit rapport-depot.md.
 - fichiers PDF/images présents dans le dépôt mais cités nulle part (donc invisibles sur le site)
 - fichiers cités par le site mais absents du dépôt (liens cassés)
 - PDF du dossier sujets/ dont le nom ne respecte pas la règle de nommage"""
import os, re, urllib.parse
EXT = (".pdf", ".png", ".jpg", ".jpeg", ".webp")
IGN = {".git", ".github", "scripts", "node_modules"}
fichiers = []
for d, ds, fs in os.walk("."):
    ds[:] = [x for x in ds if x not in IGN]
    for f in fs:
        if f.lower().endswith(EXT) and not f.lower().startswith("icon"):
            fichiers.append(os.path.relpath(os.path.join(d, f), ".").replace("\\", "/"))
texte = ""
for s in ["index.html", "sujets.js", "sujets-ajouts.js", "documents.json", "bientot.html"]:
    if os.path.exists(s):
        texte += open(s, encoding="utf-8", errors="replace").read() + "\n"
dec = urllib.parse.unquote(texte)
invisibles = sorted(f for f in fichiers if f not in texte and f not in dec)
cites = set(re.findall(r'["\']([^"\'<>\\\s]+\.(?:pdf|png|jpe?g|webp))["\']', dec, re.I))
cites = {c for c in cites if not c.startswith(("http", "//", "data:")) and not c.lower().startswith("icon")}
cassés = sorted(c for c in cites if not os.path.exists(c))
CL = {"2nde", "1ere", "tle", "3e", "4e", "5e", "6e", "bepc"}
mauvais = []
if os.path.isdir("sujets"):
    for f in sorted(os.listdir("sujets")):
        if f.lower().endswith(".pdf"):
            p = f[:-4].split("_")
            if len(p) < 4 or p[0].lower() not in CL or not (p[3].isdigit() and len(p[3]) == 4 or p[3].lower() == "na"):
                mauvais.append(f)
nb_sujets = len([f for f in fichiers if f.startswith("sujets/")])
nb_liste = len(re.findall(r'"lien"', open("sujets-ajouts.js", encoding="utf-8").read())) if os.path.exists("sujets-ajouts.js") else 0
def bloc(titre, l):
    return "## %s (%d)\n" % (titre, len(l)) + ("\n".join("- " + x for x in l) if l else "Aucun.") + "\n"
rapport = ("# Rapport du dépôt\n\nFichiers PDF et images trouvés : %d\nPDF dans sujets/ : %d, sujets listés dans sujets-ajouts.js : %d\n\n" % (len(fichiers), nb_sujets, nb_liste)
           + bloc("Fichiers présents mais invisibles sur le site", invisibles) + "\n"
           + bloc("Fichiers cités par le site mais absents du dépôt", cassés) + "\n"
           + bloc("Noms de sujets incorrects (ignorés)", mauvais))
open("rapport-depot.md", "w", encoding="utf-8").write(rapport)
print(rapport)
