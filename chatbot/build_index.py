import os
import re
import time
import joblib
import pypdf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def build_medical_index(pdf_path="Data/Medical_book.pdf", output_path="Data/medical_index.joblib"):
    print(f"Reading {pdf_path}...")
    t0 = time.time()
    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"Total pages: {total_pages}")
    
    chunks = []
    for p_idx, page in enumerate(reader.pages):
        try:
            txt = page.extract_text() or ""
            clean_txt = re.sub(r"\s+", " ", txt).strip()
            if not clean_txt:
                continue
            # 500-char chunks with overlap
            for i in range(0, len(clean_txt), 450):
                ch = clean_txt[i:i+550].strip()
                if len(ch) > 80:
                    chunks.append({"page": p_idx + 1, "text": ch})
        except Exception as e:
            continue
        
        if (p_idx + 1) % 100 == 0 or (p_idx + 1) == total_pages:
            print(f"Processed {p_idx + 1}/{total_pages} pages ({len(chunks)} chunks)...")

    print(f"Fitting vector index over {len(chunks)} text chunks...")
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=35000,
        sublinear_tf=True
    )
    matrix = vectorizer.fit_transform([c["text"] for c in chunks])
    
    data = {
        "chunks": chunks,
        "vectorizer": vectorizer,
        "matrix": matrix,
        "total_pages": total_pages,
        "build_time": time.time() - t0
    }
    
    print(f"Saving index to {output_path}...")
    joblib.dump(data, output_path, compress=3)
    print(f"Index built successfully in {time.time() - t0:.2f} seconds!")
    return data

if __name__ == "__main__":
    build_medical_index()
