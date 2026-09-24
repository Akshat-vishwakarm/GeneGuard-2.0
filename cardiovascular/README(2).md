# GeneGuard — Cardiovascular Risk Assessment

GeneGuard is an **AI/ML-powered cardiovascular risk assessment web application** built with Flask and a trained Random Forest machine-learning model.

The current version takes basic health and lifestyle information from a user, performs preprocessing and feature engineering, predicts cardiovascular risk, and provides an interpretable result using SHAP-based feature contributions.

> **Important:** GeneGuard is an educational/research project and is **not a medical diagnostic tool**. Predictions should not replace professional medical advice, diagnosis, or treatment.

---

## ✨ Features

- 🫀 Cardiovascular risk prediction using a trained **Random Forest Classifier**
- 🌐 Flask-based web interface
- 📊 Risk probability and risk category
- 🔍 SHAP-based explanation of the model prediction
- 📏 Automatic BMI calculation
- 🩺 Blood-pressure feature engineering
- 🔄 Height conversion: **cm ↔ feet/inches**
- ⚖️ Weight conversion: **kg ↔ lbs**
- ✅ Input validation for health measurements
- 📄 Human-readable cardiovascular assessment report
- 🧪 Automated Flask integration tests
- 💾 Saved ML model and preprocessing artifacts for inference without retraining

---

## 🧠 Machine Learning

The current GeneGuard cardiovascular module uses a **Random Forest Classifier** with preprocessing through a Scikit-learn pipeline.

### Model performance

| Metric | Current Version |
|---|---:|
| Test Accuracy | **73%** |
| Model | Random Forest |
| Cross-validation | Stratified 5-Fold |
| Hyperparameter tuning | GridSearchCV |
| Explainability | SHAP |

The model is trained using a train/test split with stratification. Hyperparameters are selected using `GridSearchCV` with ROC-AUC scoring.

### Feature engineering

The application derives additional features before prediction:

- **Age in years**
- **BMI**
- **Pulse pressure**
- **Blood-pressure ratio**

The model uses the following feature groups:

**Numerical**
- Age
- Height
- Weight
- Systolic blood pressure (`ap_hi`)
- Diastolic blood pressure (`ap_lo`)
- BMI
- Pulse pressure
- Blood-pressure ratio

**Categorical**
- Gender
- Cholesterol level
- Glucose level
- Smoking
- Alcohol intake
- Physical activity

---

## 🔬 Explainability with SHAP

GeneGuard does not only return a prediction.

The application uses **SHAP (SHapley Additive exPlanations)** to identify the most influential features for an individual prediction.

The result can show factors such as:

- Age
- BMI
- Blood pressure
- Cholesterol
- Glucose
- Lifestyle-related variables

Each important feature is classified according to whether its model contribution is associated with an increase or decrease in the predicted risk.

---

## 🏗️ Project Architecture

```text
User
  │
  ▼
Flask Web Interface
  │
  ▼
Input Validation
  │
  ├── Unit Conversion
  ├── Categorical Mapping
  └── Feature Engineering
          │
          ▼
   Saved ML Pipeline
          │
          ├── StandardScaler
          ├── OneHotEncoder
          └── Random Forest
          │
          ▼
   Risk Probability
          │
          ├── Risk Category
          └── SHAP Explanation
                  │
                  ▼
        Cardiovascular Report
```

---

## 📁 Project Structure

```text
cardioo/
│
├── app.py
├── cardiovascular_model.py
├── train_and_save_model.py
├── test_app.py
│
├── CARDIO.ipynb
├── cardio_data_processed.xls
│
├── cardiovascular_model.pkl
├── cardiovascular_features.pkl
├── cardiovascular_threshold.pkl
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── result.html
│   ├── report.html
│   ├── 404.html
│   └── 500.html
│
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## ⚙️ How It Works

### 1. User enters health information

Required inputs include:

- Age
- Gender
- Height
- Weight
- Systolic blood pressure
- Diastolic blood pressure

Additional lifestyle/health inputs include:

- Cholesterol
- Glucose
- Smoking
- Alcohol intake
- Physical activity

### 2. Input preprocessing

GeneGuard validates the submitted values and converts units when necessary.

For example:

```text
5 ft 8 in → 172.72 cm
176 lbs   → 79.83 kg
```

### 3. Feature engineering

The application calculates:

```text
BMI = weight / height²

Pulse Pressure = Systolic BP - Diastolic BP

BP Ratio = Systolic BP / Diastolic BP
```

### 4. ML prediction

The saved Scikit-learn pipeline processes the input and generates a cardiovascular risk probability.

### 5. Risk interpretation

The application currently groups predictions into:

```text
< 35%       → Lower Predicted Risk
35% – 59.9% → Moderate Predicted Risk
≥ 60%       → Elevated Predicted Risk
```

These are application-level prediction categories, **not clinical risk classifications**.

### 6. Explanation

SHAP is used to identify the features with the largest contribution to the individual prediction.

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY/cardioo
```

### 2. Create a virtual environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install flask pandas numpy scikit-learn joblib shap
```

---

## ▶️ Run the Application

From the project directory:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

---

## 🧪 Run Tests

The project includes Flask integration tests covering:

- Home page
- Valid prediction
- Feet/inches conversion
- Pounds/kg conversion
- Missing required fields
- Invalid blood-pressure values
- Report generation

Run:

```bash
python -m unittest test_app.py
```

---

## 🔌 API Usage

The `/predict` endpoint accepts POST requests.

Example JSON:

```json
{
  "age": "50",
  "gender": "male",
  "height": "170",
  "height_unit": "cm",
  "weight": "80",
  "weight_unit": "kg",
  "ap_hi": "130",
  "ap_lo": "85",
  "cholesterol": "normal",
  "gluc": "normal",
  "smoke": "no",
  "alco": "no",
  "active": "yes"
}
```

Example request:

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": "50",
    "gender": "male",
    "height": "170",
    "height_unit": "cm",
    "weight": "80",
    "weight_unit": "kg",
    "ap_hi": "130",
    "ap_lo": "85",
    "cholesterol": "normal",
    "gluc": "normal",
    "smoke": "no",
    "alco": "no",
    "active": "yes"
  }'
```

The response includes:

```text
status
prediction
risk_probability
risk_percentage
threshold
risk_label
risk_category
risk_description
model_accuracy
explanation
patient_data
```

---

## 📄 Model Artifacts

The repository contains the trained model artifacts required for inference:

### `cardiovascular_model.pkl`

Saved Scikit-learn pipeline containing:

- Feature preprocessing
- StandardScaler
- OneHotEncoder
- Random Forest classifier

### `cardiovascular_features.pkl`

Stores the expected feature order used by the model.

### `cardiovascular_threshold.pkl`

Stores the decision threshold selected during model development.

---

## 🧪 Training the Model

To retrain the model:

```bash
python train_and_save_model.py
```

The training pipeline:

1. Loads the processed cardiovascular dataset
2. Creates engineered features
3. Splits data into training and testing sets
4. Builds a preprocessing pipeline
5. Performs Random Forest hyperparameter tuning
6. Evaluates test accuracy and ROC-AUC
7. Finds a decision threshold using cross-validation and F1 score
8. Saves the trained model artifacts

---

## 🛡️ Input Validation

GeneGuard validates important inputs before making a prediction.

Examples:

- Age must be within a realistic range
- Height must be within a realistic range
- Weight must be within a realistic range
- Blood pressure must be numeric
- Systolic pressure must be greater than diastolic pressure
- Supported height and weight units are converted automatically

This helps prevent invalid inputs from reaching the model.

---

## 🔐 Privacy

The current project is designed as a local Flask application.

Avoid entering real sensitive health information into a publicly deployed version unless appropriate security, privacy, authentication, encryption, data-retention, and regulatory requirements have been implemented.

---

## ⚠️ Medical Disclaimer

GeneGuard is a **machine-learning research/educational project**.

The prediction is generated from the model and the information supplied by the user. A 73% test accuracy means the model is not perfectly accurate and should **not** be used to diagnose cardiovascular disease or make medical decisions.

If you have symptoms, concerns, or abnormal measurements, consult a qualified healthcare professional.

---

## 🔮 Future Improvements

Planned/improvable areas include:

- [ ] Improve model accuracy and generalization
- [ ] Evaluate precision, recall, F1-score and ROC-AUC more extensively
- [ ] Add confusion matrix and calibration analysis
- [ ] Compare Random Forest with XGBoost/LightGBM and other models
- [ ] Improve SHAP visualization
- [ ] Add downloadable PDF reports
- [ ] Add user authentication
- [ ] Add secure patient history
- [ ] Add database integration
- [ ] Add model versioning
- [ ] Add Docker deployment
- [ ] Add CI/CD with automated testing
- [ ] Add a production WSGI server
- [ ] Improve clinical validation with appropriate medical datasets and expert review

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Core development |
| Flask | Web application |
| Pandas | Data processing |
| NumPy | Numerical computation |
| Scikit-learn | Machine learning |
| Random Forest | Classification |
| SHAP | Model explainability |
| Joblib | Model serialization |
| HTML/CSS/JavaScript | Frontend |
| Jupyter Notebook | Model experimentation |

---

## 👨‍💻 Author

**Akshat Vishwakarma**

AI/ML Engineering Student

Interested in:

- Machine Learning
- Data Science
- AI Engineering
- Computer Vision
- Healthcare AI
- Full-Stack ML Applications

---

## ⭐ If You Find This Project Useful

Consider giving the repository a ⭐ on GitHub and sharing feedback or suggestions for improving the model and application.

---

### Project Status

**Current version:** Cardiovascular Risk Assessment MVP

**Prediction engine:** Trained Random Forest ML model

**Current reported test accuracy:** **73%**

**External generative AI APIs:** **Not required for cardiovascular prediction**
