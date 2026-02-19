#!/usr/bin/env python3
import argparse
import json
import re
import sys


SKILL_KEYWORDS = [
    "python",
    "typescript",
    "javascript",
    "react",
    "next.js",
    "node",
    "sql",
    "docker",
    "kubernetes",
    "aws",
    "git",
    "figma",
    "excel",
]


def parse_text(text: str) -> dict:
    warnings = []

    try:
        import spacy  # type: ignore

        try:
            nlp = spacy.load("fr_core_news_md")
        except Exception:
            nlp = spacy.blank("fr")
            warnings.append("Mode degrade: modele fr_core_news_md indisponible")

        _ = nlp(text)
    except Exception:
        warnings.append("spaCy indisponible: extraction heuristique uniquement")

    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}", text)

    lowered = text.lower()
    skills = sorted({keyword for keyword in SKILL_KEYWORDS if keyword in lowered})

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    experience = []
    education = []

    for line in lines:
        if len(experience) < 3 and re.search(r"\b(stage|developpeur|ingenieur|consultant|chef de projet|alternance)\b", line.lower()):
            experience.append({"title": line, "company": "", "start": "", "end": ""})
        if len(education) < 3 and re.search(r"\b(master|licence|bachelor|diplome|ecole|universite)\b", line.lower()):
            education.append({"degree": line, "school": "", "year": ""})

    if not skills:
        warnings.append("Aucune competence detectee automatiquement")

    contact = {
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "location": "",
    }

    return {
        "skills": skills,
        "experience": experience,
        "education": education,
        "contact": contact,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Parseur CV FR (spaCy + heuristiques)")
    parser.add_argument("--text", help="Texte brut du CV")
    args = parser.parse_args()

    text = args.text if args.text is not None else sys.stdin.read()

    if not text or not text.strip():
        print(
            json.dumps(
                {
                    "skills": [],
                    "experience": [],
                    "education": [],
                    "contact": {"email": "", "phone": "", "location": ""},
                    "warnings": ["Texte CV vide"],
                }
            )
        )
        return 0

    print(json.dumps(parse_text(text), ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
