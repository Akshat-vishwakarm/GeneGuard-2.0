🧬 GeneGuard

AI-powered genetic, family-health & disease-risk analysis platform with a Medical RAG chatbot.

GeneGuard combines personal health data, family medical history, disease-specific machine-learning models, medical-report extraction, family-risk analysis, and Retrieval-Augmented Generation (RAG) into one platform.

Live Demo: https://gene-guard-2-0-frontend.vercel.app/

🔬 Architecture

Personal Health Data
        +
Family Health History
        +
Medical Reports
        ↓
Disease-Specific ML Models
        ↓
Personal Model Outputs
        ↓
Family Risk Engine
        ↓
Gemini Interpretation
        ↓
Final GeneGuard Report

GeneGuard uses separate models for separate disease domains rather than one universal classifier.

🧠 Individual Disease Models

❤️ Cardiovascular Model

A dedicated cardiovascular classification pipeline using tabular clinical data.

Main features

Age

Sex

Chest pain type

Resting blood pressure

Cholesterol

Fasting blood sugar

Resting ECG

Maximum heart rate

Exercise-induced angina

Oldpeak

Slope

CA

Thal

Tuned Random Forest

n_estimators = 200
max_depth = 10
min_samples_leaf = 2
min_samples_split = 2

Recorded evaluation:

Accuracy  ≈ 73.90%
Precision ≈ 77.44%
Recall    ≈ 66.51%
F1 Score  ≈ 71.56%
ROC-AUC   ≈ 80.22%

The cardiovascular model is a research/prototype model and is not clinically validated.

🩸 Metabolic Disease Model

GeneGuard contains an independent metabolic model designed around metabolic indicators such as:

Glucose

HbA1c

Total cholesterol

LDL

HDL

Triglycerides

Fasting insulin

HOMA-IR

BMI

Body measurements

Other features supported by the trained model

The metabolic model has its own feature schema and preprocessing pipeline.

🩺 Hypertension Model

A separate hypertension/blood-pressure model is used for blood-pressure related analysis.

Relevant features can include:

Systolic BP

Diastolic BP

Age

Sex

BMI

Resting heart rate

Metabolic indicators

Smoking/activity variables where supported

Relevant medical history

The hypertension model is kept separate from the cardiovascular model because they represent different prediction tasks.

🦋 Thyroid Disease Model

GeneGuard includes a dedicated thyroid classification model.

The thyroid feature space includes variables such as:

TSH

T3

T4

T4U

FTI

Thyroxine medication

Antithyroid medication

Goitre

Thyroid surgery

Hypothyroidism/hyperthyroidism query fields

Pregnancy-related fields

Other thyroid-dataset indicators

Important development note

The thyroid module has undergone experimentation with synthetic training data. Extremely high evaluation results from those experiments must not be interpreted as clinical accuracy.

The intended production approach is to use the real thyroid dataset with a reproducible preprocessing + model pipeline.

🧬 Hereditary Cancer Model

GeneGuard includes a separate cancer/hereditary-risk module.

Its feature space can include:

Age

Gender

Genetic-risk indicator

Smoking

Passive smoking

Alcohol exposure

Obesity

Occupational hazards

Chronic lung disease

Chest pain

Chronic fatigue

Unexplained weight loss

Shortness of breath

Wheezing

Persistent cough

Coughing blood

Swallowing difficulty

Clubbing

Other validated cancer-related features

The project is designed to support hereditary cancer categories such as:

BRCA1/BRCA2-related hereditary cancer

Lynch syndrome

Familial adenomatous polyposis

The exact target and feature schema remain specific to the individual trained model.

🧪 Disease-Specific Modeling Strategy

GeneGuard does not send every available health field to every model.

Common Health Data
       ↓
Feature Mapping
       ↓
Disease-Specific Feature Schema
       ↓
Original Preprocessing
       ↓
Disease Model
       ↓
Model Output

For example:

Cardiovascular → cardiovascular features
Metabolic      → metabolic features
Hypertension   → BP/validated features
Thyroid        → thyroid features
Cancer         → cancer-related trained features

This prevents unrelated fields from being incorrectly passed to a model.

👨‍👩‍👧‍👦 Family Health Network

Users can build an interactive family health network:

                 Grandfather
                      │
                   Father
                      │
Brother ──────────── Me ──────────── Mother
                                      │
                              Maternal Grandfather

Family members can contain:

Relationship

Age / age at death

Sex

Alive / deceased / unknown

Diagnosed conditions

Age at diagnosis

Symptoms

Health information

Optional medical reports

Unknown information is represented as null / unknown, not automatically as 0.

📊 Family Risk Engine

GeneGuard separates personal prediction from family-aware analysis.

Personal Health Data
        ↓
Personal Disease Model
        ↓
P(personal)

When a validated family-aware mechanism is available:

Personal Model Output
        +
Family History
        ↓
Family Risk Engine
        ↓
P(family-aware)
        ↓
Change in percentage points

The system does not add arbitrary percentages for affected relatives.

If a valid family-aware model/evidence mechanism is unavailable, the numerical family adjustment remains unavailable rather than being fabricated.

📄 Medical Report Intelligence

Optional medical reports can be uploaded as PDF/JPG/PNG.

Medical Report
      ↓
OCR / Document Extraction
      ↓
Test & Value Identification
      ↓
Unit Normalization
      ↓
User Verification
      ↓
Structured Health Data
      ↓
Disease-Specific Models

Report extraction is data extraction, not disease prediction.

A single report can provide inputs to multiple disease models, but each model receives only the fields relevant to its own trained schema.

🩺 Medical RAG Chatbot

GeneGuard also includes a Retrieval-Augmented Generation medical chatbot using the Gale Encyclopedia of Medicine as its knowledge base.

The LLM is not directly fine-tuned on the book.

Instead, the book is converted into searchable chunks and vector embeddings, stored in Pinecone, and retrieved dynamically when the user asks a question.

🔬 RAG Pipeline

Gale Encyclopedia of Medicine
            ↓
      Text Extraction
            ↓
   Recursive Text Chunking
            ↓
    Hugging Face Embeddings
      all-MiniLM-L6-v2
            ↓
      384D Embeddings
            ↓
        Pinecone
     Vector Database
            ↓
      Semantic Search
     Cosine Similarity
            ↓
    Relevant Medical Context
            ↓
       OpenAI LLM
            ↓
      Generated Response

🧠 Medical RAG Techniques

RAG

Retrieves relevant medical knowledge before generating an answer.

Recursive Character Text Splitting

Breaks the encyclopedia into smaller searchable chunks.

Sentence Embeddings

all-MiniLM-L6-v2 converts text into 384-dimensional vectors.

Vector Database

Pinecone stores and indexes the medical embeddings.

Semantic Search

Retrieves information based on meaning rather than exact keyword matching.

Cosine Similarity

Measures similarity between the query embedding and stored medical vectors.

LLM Generation

The OpenAI LLM uses retrieved medical context to generate the response.

LangChain

Connects document processing, embeddings, retrieval, and generation.

Flask

Provides the backend/web interface for the chatbot.

🤖 AI Responsibilities

GeneGuard separates its AI layers:

Disease-Specific ML
        ↓
Numerical Prediction
        ↓
Family Risk Engine
        ↓
Validated Family-Aware Output
        ↓
Gemini
        ↓
Interpretation / Explanation

For medical knowledge questions:

User Question
      ↓
RAG Retrieval
      ↓
Pinecone
      ↓
Medical Context
      ↓
OpenAI LLM
      ↓
Chatbot Response

Gemini should not invent or overwrite ML probabilities.

The RAG chatbot retrieves medical knowledge instead of directly training the LLM on the encyclopedia.

🛠️ Tech Stack

Machine Learning

Python

Pandas

NumPy

Scikit-learn

Random Forest

LightGBM

TensorFlow / Keras

SHAP

Medical RAG

LangChain

Pinecone

Hugging Face

all-MiniLM-L6-v2

OpenAI

Vector Embeddings

Cosine Similarity

Backend

Flask

Python APIs

ML inference pipelines

Frontend

React

Responsive UI

Interactive family network

Transparent glass UI

Deployment

Vercel

GitHub

🚀 Features

🧬 Personal health profile

👨‍👩‍👧‍👦 Interactive family health network

❤️ Cardiovascular ML analysis

🩸 Metabolic analysis

🩺 Hypertension analysis

🦋 Thyroid analysis

🧬 Hereditary cancer analysis

📄 Medical report extraction

📊 Disease-specific model outputs

👨‍👩‍👧 Family-risk analysis

🤖 Gemini-based interpretation

📚 Medical RAG chatbot

🔎 Semantic medical retrieval

🧠 SHAP explainability where implemented

🌐 Vercel deployment

⚙️ End-to-End GeneGuard Workflow

                    USER
                     │
                     ▼
             Personal Health Data
                     │
                     ▼
             Build Family Network
                     │
                     ▼
             Upload Medical Reports
                     │
                     ▼
             Verify Extracted Data
                     │
                     ▼
          ┌───────────────────────┐
          │ Disease-Specific ML   │
          │ Models                │
          └───────────┬───────────┘
                      │
                      ▼
              Personal Results
                      │
                      ▼
             Family Risk Engine
                      │
                      ▼
             Combined Analysis
                      │
                      ▼
             Gemini Interpretation
                      │
                      ▼
              Final GeneGuard Report

📴 Offline Capability

GeneGuard is designed so that its trained disease-specific ML models can run locally without an internet connection.

The trained model artifacts and their required inference components are included within the project. Once the application and its dependencies are installed, the core ML inference does not require an external model-hosting service.

Local GeneGuard Application
          ↓
Local Health Data
          ↓
Local Preprocessing
          ↓
Local Trained Model
          ↓
Local Prediction

This means the core disease-model inference can operate without sending patient inputs to an external ML service.

Important distinction

The core trained ML models can run offline, but features that depend on external services may still require internet access, including:

Gemini API interpretation

OpenAI-powered Medical RAG generation

Pinecone vector-database retrieval

Vercel-hosted deployment

Any other external API or cloud service used by the application

So the offline capability specifically refers to the locally stored trained ML models and their inference pipeline, not every feature of the complete cloud-connected application.

🔐 Design & Safety Principles

Each disease model has its own feature schema.

Unknown medical information is not automatically treated as zero.

Medical reports are extracted and verified before being used.

ML probabilities are not manually modified.

Family-history percentages are not arbitrarily assigned.

Gemini is an interpretation layer, not the numerical ML engine.

RAG retrieves medical knowledge instead of fine-tuning the LLM on the book.

Outputs are for research/educational use and are not clinical diagnoses.

📚 Knowledge Base

Gale Encyclopedia of Medicine

The encyclopedia is processed into searchable chunks and stored as vector embeddings. Relevant content is retrieved dynamically for medical chatbot queries.

🌐 Live Demo

GeneGuard 2.0

https://gene-guard-2-0-frontend.vercel.app/

⚠️ Disclaimer

GeneGuard is a research and educational project.

Its machine-learning predictions, family-history analysis, medical-report extraction, and chatbot responses are not a substitute for professional medical diagnosis, treatment, or clinical decision-making.

👨‍💻 Project Stack

Python
React
Flask
Scikit-learn
LightGBM
TensorFlow / Keras
LangChain
Pinecone
Hugging Face
OpenAI
Gemini
Vercel

⭐ GeneGuard — AI Genetic & Family Health Analysis Platform
