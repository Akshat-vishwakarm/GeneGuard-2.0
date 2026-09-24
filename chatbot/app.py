try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
import os
import sys

# Add chatbot root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from src.helper import MedicalRetriever, generate_medical_response

app = Flask(__name__)
CORS(app)

# API Keys
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Initialize medical knowledge retriever
index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Data", "medical_index.joblib")
pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Data", "Medical_book.pdf")
retriever = MedicalRetriever.get_instance(index_path=index_path, pdf_path=pdf_path)


@app.route("/")
@app.route("/chatbot")
def index():
    return render_template('chat.html')



@app.route("/get", methods=["GET", "POST"])
def chat():
    if request.method == "POST":
        msg = request.form.get("msg", "")
    else:
        msg = request.args.get("msg", "")

    if not msg or not msg.strip():
        return "Please ask a medical question."

    # Retrieve context from medical reference encyclopedia
    retrieved_chunks = retriever.retrieve(msg, k=3)

    # Generate answer using Gemini / OpenAI / Gale Encyclopedia synthesis
    answer = generate_medical_response(
        query=msg,
        retrieved_chunks=retrieved_chunks,
        gemini_api_key=GEMINI_API_KEY,
        openai_api_key=OPENAI_API_KEY
    )

    return str(answer)


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    msg = data.get("message") or data.get("msg") or ""

    if not msg.strip():
        return jsonify({"error": "Empty message"}), 400

    retrieved = retriever.retrieve(msg, k=3)
    answer = generate_medical_response(
        query=msg,
        retrieved_chunks=retrieved,
        gemini_api_key=GEMINI_API_KEY,
        openai_api_key=OPENAI_API_KEY
    )

    return jsonify({
        "query": msg,
        "answer": answer,
        "sources": [{"page": c["page"], "score": round(c["score"], 3)} for c in retrieved]
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    print(f"[Medical Chatbot] Starting server on http://localhost:{port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
