# 🚀 Deploying GeneGuard 2.0 to Vercel

GeneGuard is pre-configured for deployment on **Vercel** with full Single-Page Application (SPA) routing, video background streaming headers, and dynamic API configuration.

---

## ⚡ Quick Deployment (2 Options)

### Option 1: Automatic Monorepo Root (Zero-Config)
The repository includes a root `vercel.json` and `package.json`. You can import the repository directly into Vercel without changing any directory settings!

1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository: **`Akshat-vishwakarm/GeneGuard-2.0`**.
3. Leave **Root Directory** as `./`.
4. Click **Deploy**.

---

### Option 2: Frontend Directory (Recommended Standard)
If you prefer building directly from the frontend directory:

1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository: **`Akshat-vishwakarm/GeneGuard-2.0`**.
3. In the **Project Settings**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select **`frontend`**.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Click **Deploy**.

---

## 🌐 Connecting the Python ML Backend

GeneGuard's frontend connects to the multi-disease ML models and family pedigree engine via the API.

### Environment Variable in Vercel
In your Vercel Project Dashboard:
1. Navigate to **Settings** &rarr; **Environment Variables**.
2. Add:
   * **Key**: `VITE_API_BASE_URL`
   * **Value**: `https://your-backend-service.onrender.com/api` (URL of your deployed backend)
3. Redeploy the project (or push a new commit) for the environment variable to take effect.

> **Note**: For local development on `localhost`, GeneGuard automatically falls back to `http://localhost:5000/api` without needing any environment variable.

---

## 🩺 Deploying the Backend (Free Tier Options)

The Python Flask backend (`backend/app.py`) can be deployed to:

### 1. Render (Recommended - Free Web Service)
1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect `Akshat-vishwakarm/GeneGuard-2.0`.
3. Configure:
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn -w 2 -b 0.0.0.0:$PORT app:app` (or `python app.py`)
4. Copy your Render URL (e.g. `https://geneguard-api.onrender.com`) and paste `https://geneguard-api.onrender.com/api` as `VITE_API_BASE_URL` in Vercel!

### 2. Railway
1. Go to [railway.app](https://railway.app) &rarr; **New Project** &rarr; **Deploy from GitHub repo**.
2. Set Root Directory to `/backend`.
3. Add a Start Command or let Railway auto-detect Python.

---

## 📁 Key Deployment Files Created

* **[`frontend/vercel.json`](file:///frontend/vercel.json)**: SPA rewrite routing (`/(.*) -> /index.html`) + HTTP Range request & caching headers for video backgrounds (`.mp4`, `.webm`).
* **[`vercel.json`](file:///vercel.json)**: Root-level Vercel orchestration linking root builds to `frontend/dist`.
* **[`package.json`](file:///package.json)**: Root build runner (`npm run build --prefix frontend`).
* **[`frontend/src/utils/apiConfig.js`](file:///frontend/src/utils/apiConfig.js)**: Centralized cloud API resolver (`VITE_API_BASE_URL` with local fallback).
* **[`frontend/.env.example`](file:///frontend/.env.example)**: Environment variable template.
