import os
import re
import json
import logging
import requests
import joblib
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("medicalbot.helper")


class MedicalRetriever:
    """
    High-performance vector retriever over the Gale Encyclopedia of Medicine.
    Caches TF-IDF matrices for sub-second retrieval.
    """
    _instance = None
    _index_data = None

    @classmethod
    def get_instance(cls, index_path="Data/medical_index.joblib", pdf_path="Data/Medical_book.pdf"):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.init_index(index_path, pdf_path)
        return cls._instance

    def init_index(self, index_path="Data/medical_index.joblib", pdf_path="Data/Medical_book.pdf"):
        if os.path.exists(index_path):
            try:
                self._index_data = joblib.load(index_path)
                logger.info(f"Loaded medical index from {index_path} ({len(self._index_data['chunks'])} chunks)")
                return
            except Exception as e:
                logger.warning(f"Error loading {index_path}: {e}. Rebuilding index...")

        # Build index if not present
        from build_index import build_medical_index
        self._index_data = build_medical_index(pdf_path, index_path)

    def retrieve(self, query: str, k: int = 3):
        if not self._index_data:
            return []

        vectorizer = self._index_data["vectorizer"]
        matrix = self._index_data["matrix"]
        chunks = self._index_data["chunks"]

        q_clean = re.sub(r"[^\w\s]", " ", query).strip()
        q_vec = vectorizer.transform([q_clean])
        sims = cosine_similarity(q_vec, matrix)[0]

        top_indices = sims.argsort()[-k:][::-1]
        results = []
        for idx in top_indices:
            score = float(sims[idx])
            chunk = chunks[idx]
            results.append({
                "page": chunk["page"],
                "text": chunk["text"],
                "score": score
            })
        return results


def call_gemini(prompt: str, api_key: str) -> str:
    """Invokes Google Gemini API with candidate fallbacks."""
    candidate_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"]
    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 300}
        }
        try:
            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text
        except Exception:
            continue
    raise RuntimeError("Gemini API call failed or quota exceeded.")


def call_openai(prompt: str, api_key: str) -> str:
    """Invokes OpenAI API."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "system", "content": "You are an assistant for question-answering tasks."},
                     {"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 250
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=12)
    if resp.status_code == 200:
        return resp.json()["choices"][0]["message"]["content"].strip()
    raise RuntimeError(f"OpenAI error {resp.status_code}: {resp.text}")


def format_to_bulletpoints(text: str) -> str:
    """
    Standardizes any medical answer into clean, structured bullet points.
    Preserves existing list points while ensuring each begins with '• '.
    Converts unstructured paragraphs into distinct bullet points.
    """
    if not text or not text.strip():
        return text

    # Remove generic label prefixes like 'Answer:', '**Key Points:**', etc.
    cleaned = re.sub(r'^(?:(?:\*\*Answer:?\*\*|Answer:?|\*\*Key Points:?\*\*|Key Points:?)\s*)+', '', text.strip(), flags=re.IGNORECASE)

    # Check if text already has bullet or list markers
    raw_lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]
    bullet_lines = []

    has_bullets = any(re.match(r'^[\*\-\•\d+\.]\s+', ln) for ln in raw_lines)
    if has_bullets:
        for ln in raw_lines:
            # Strip markdown list marker, dash, asterisk, or numbered prefix
            content = re.sub(r'^[\*\-\•]\s*|^\d+[\.\)]\s*', '', ln).strip()
            if content:
                bullet_lines.append(f"• {content}")
        if bullet_lines:
            return "\n".join(bullet_lines)

    # If it is a solid block/paragraph, split into coherent sentences
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if len(s.strip()) > 15]
    if len(sentences) >= 2:
        return "\n".join([f"• {s}" for s in sentences[:4]])
    elif len(sentences) == 1:
        return f"• {sentences[0]}"

    return f"• {cleaned}"


def extract_context_answer(query: str, retrieved_chunks: list) -> str:
    """
    Fallback extractive synthesizer from authoritative Gale Encyclopedia passages.
    Extracts 2-4 most relevant sentences answering the query and returns them as bullet points.
    """
    if not retrieved_chunks or retrieved_chunks[0].get("score", 0) < 0.05:
        return "• I could not find specific medical information answering that question in the reference database.\n• Please consult a licensed physician or specialist for personalized clinical guidance."

    # Split top chunks into sentences
    query_terms = set(re.findall(r"\w+", query.lower())) - {"what", "is", "the", "are", "how", "and", "a", "an", "of", "to", "for", "in"}
    all_sentences = []
    for c in retrieved_chunks:
        raw_text = c["text"]
        raw_text = re.sub(r"\s+", " ", raw_text).strip()
        sents = re.split(r"(?<=[.!?])\s+", raw_text)
        for s in sents:
            s_clean = s.strip()
            if len(s_clean) > 30 and len(s_clean) < 300:
                # Count matching query terms
                matches = sum(1 for t in query_terms if t in s_clean.lower())
                all_sentences.append((matches, s_clean, c["page"]))

    all_sentences.sort(key=lambda x: x[0], reverse=True)
    selected = []
    seen = set()
    for matches, s, page in all_sentences:
        if s not in seen and matches > 0:
            seen.add(s)
            selected.append(s)
            if len(selected) >= 3:
                break

    if not selected:
        # Fall back to first coherent sentences of top chunk
        top_text = retrieved_chunks[0]["text"]
        sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", top_text) if len(s.strip()) > 35]
        selected = sents[:3]

    return format_to_bulletpoints("\n".join(selected))


def generate_medical_response(query: str, retrieved_chunks: list, gemini_api_key: str = None, openai_api_key: str = None) -> str:
    """
    Generates a medically accurate answer formatted as bullet points using the retrieved context.
    Prioritizes Gemini / OpenAI, falling back gracefully to extractive synthesis.
    """
    context = "\n\n".join([f"[Source: Gale Encyclopedia of Medicine, Page {c['page']}]:\n{c['text']}" for c in retrieved_chunks])
    
    prompt = (
        "You are an assistant for medical question-answering tasks. "
        "Use the following pieces of retrieved context from the Gale Encyclopedia of Medicine to answer the question. "
        "If you don't know the answer, say that you don't know.\n\n"
        "FORMATTING INSTRUCTION:\n"
        "- Format your ENTIRE response strictly as 2 to 4 bullet points starting with '• '.\n"
        "- Each bullet point should highlight a key medical definition, clinical sign, cause, or diagnostic criteria.\n"
        "- Keep each bullet point concise, clear, and medically informative.\n"
        "- Do not write unbroken paragraphs.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer in bullet points:"
    )

    answer = None

    # 1. Try Gemini
    if gemini_api_key and len(gemini_api_key) > 10:
        try:
            answer = call_gemini(prompt, gemini_api_key)
        except Exception as e:
            logger.info(f"Gemini API unavailable ({e}), trying fallback...")

    # 2. Try OpenAI
    if not answer and openai_api_key and len(openai_api_key) > 10:
        try:
            answer = call_openai(prompt, openai_api_key)
        except Exception as e:
            logger.info(f"OpenAI API unavailable ({e}), trying fallback...")

    # 3. Direct synthesis from Gale Encyclopedia context
    if not answer:
        answer = extract_context_answer(query, retrieved_chunks)

    return format_to_bulletpoints(answer)



# Backward compatibility aliases
def load_pdf_file(data='Data/'):
    import pypdf
    docs = []
    if os.path.exists(data):
        for f in os.listdir(data):
            if f.endswith('.pdf'):
                r = pypdf.PdfReader(os.path.join(data, f))
                for idx, p in enumerate(r.pages):
                    docs.append({'page': idx + 1, 'text': p.extract_text()})
    return docs

def text_split(extracted_data):
    chunks = []
    for doc in extracted_data:
        t = doc.get('text', '')
        for i in range(0, len(t), 450):
            ch = t[i:i+500].strip()
            if len(ch) > 50:
                chunks.append({'page': doc.get('page'), 'text': ch})
    return chunks

def download_hugging_face_embeddings():
    return None