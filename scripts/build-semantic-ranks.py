#!/usr/bin/env python3
"""Generate ranked semantic similarities for MARÉ's static semantic game."""
import json
import re
import unicodedata
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "contexto.js").read_text(encoding="utf8")
base = json.loads(re.search(r"const BANK=(\[.*?\]);", source, re.S).group(1))
extra = json.loads(re.search(r"BANK\.push\(\.\.\.(\[.*?\])\);", source, re.S).group(1))
bank = base + extra
def norm(w):
    return "".join(c for c in unicodedata.normalize("NFD", w.upper()) if unicodedata.category(c) != "Mn")
words = sorted({norm(x) for group in bank for x in group})
# Five-letter lexicon broadens possible guesses while avoiding unrestricted noise.
words += sorted(set((ROOT / "palavras-ptbr-5.txt").read_text().split()) - set(words))
model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
model = SentenceTransformer(model_name)
embeddings = model.encode([w.lower() for w in words], batch_size=64, normalize_embeddings=True, show_progress_bar=True, convert_to_numpy=True)
indices = {w: i for i, w in enumerate(words)}
rankings = []
for group in bank:
    secret = group[0]
    similarity = embeddings @ embeddings[indices[secret]]
    order = np.argsort(-similarity, kind="stable")
    result = {words[int(i)]: rank + 1 for rank, i in enumerate(order)}
    assert result[secret] == 1
    rankings.append(result)
output = {"version": 1, "model": model_name, "vocabularySize": len(words), "rounds": rankings}
dest = ROOT / "data" / "semantic-ranks.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
print(f"Wrote {dest} with {len(rankings)} rounds and {len(words)} terms")
