#!/usr/bin/env python3
"""Lit les PDF du dossier sujets/ et écrit sujets-ajouts.js.
Nom d'un fichier : classe_series_matiere_annee_detail.pdf
Exemple : tle_C-D_physique_2021_evaluation-2-dchang.pdf
 - classe : 2nde, 1ere, tle (aussi 3e, 4e, 5e, 6e, bepc)
 - series : lettres séparées par un tiret (C-D, A, A-C-D, TI, F4BE-F4BA...)
 - matiere : voir MAT ci-dessous (sinon le nom est mis en majuscule initiale)
 - annee : 4 chiffres, ou na si inconnue
 - detail : facultatif, mots séparés par des tirets"""
import os, json, sys
DOSSIER, SORTIE = "sujets", "sujets-ajouts.js"
CL = {"2nde": "Seconde", "1ere": "Première", "tle": "Terminale", "3e": "Troisième",
      "4e": "Quatrième", "5e": "Cinquième", "6e": "Sixième", "bepc": "BEPC"}
MAT = {"maths": "Mathématiques", "physique": "Physique", "chimie": "Chimie", "svteehb": "SVTEEHB",
       "informatique": "Informatique", "geographie": "Géographie", "histoire": "Histoire",
       "histoire-geographie": "Histoire-Géographie", "ecm": "ECM", "philosophie": "Philosophie",
       "francais": "Français", "langue-francaise": "Langue française",
       "litterature-francaise": "Littérature française", "anglais": "Anglais",
       "allemand": "Allemand", "espagnol": "Espagnol", "topographie": "Topographie", "metre": "Métré", "dessin": "Dessin", "pct": "PCT"}
out, bad = [], []
for f in sorted(os.listdir(DOSSIER)) if os.path.isdir(DOSSIER) else []:
    if not f.lower().endswith(".pdf"):
        continue
    p = f[:-4].split("_")
    if len(p) < 4 or p[0].lower() not in CL or not (p[3].isdigit() and len(p[3]) == 4 or p[3].lower() == "na"):
        bad.append(f); continue
    e = {"matiere": MAT.get(p[2].lower(), p[2].replace("-", " ").capitalize()),
         "classe": CL[p[0].lower()], "serie": [s.upper() for s in p[1].split("-") if s],
         "acces": "gratuit", "lien": DOSSIER + "/" + f}
    if p[3].isdigit(): e["annee"] = int(p[3])
    if len(p) > 4 and p[4]: e["detail"] = p[4].replace("-", " ").capitalize()
    out.append(e)
with open(SORTIE, "w", encoding="utf-8") as g:
    g.write("/* Généré automatiquement depuis le dossier sujets/. Ne pas modifier à la main. */\nconst SUJETS_AJOUTS=[\n"
            + ",\n".join(json.dumps(e, ensure_ascii=False) for e in out) + "\n];\n")
print(len(out), "sujets classés")
for f in bad: print("NOM INCORRECT, ignoré :", f, file=sys.stderr)

# Sitemap (page d'accueil, mentions légales et tous les PDF)
BASE = "https://lordgaithan76-afk.github.io/archive-sujets/"
import datetime
jour = datetime.date.today().isoformat()
urls = [BASE, BASE + "mentions-legales.html"] + [BASE + e["lien"] for e in out]
with open("sitemap.xml", "w", encoding="utf-8") as g2:
    g2.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
             + "\n".join("<url><loc>%s</loc><lastmod>%s</lastmod></url>" % (u, jour) for u in urls) + "\n</urlset>\n")
