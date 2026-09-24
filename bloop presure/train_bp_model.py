"""
GeneGuard — Blood Pressure Abnormality Prediction Model Trainer

This script loads data.csv, cleans and preprocesses the dataset using a scikit-learn Pipeline,
evaluates multiple classification algorithms, calibrates and smooths probability estimates,
selects the best calibrated model, and saves both the trained pipeline and metadata for Flask integration.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    VotingClassifier
)
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

TARGET = 'Blood_Pressure_Abnormality'
EXCLUDE_COLS = ['Patient_Number', TARGET]

FEATURES = [
    'Level_of_Hemoglobin',
    'Genetic_Pedigree_Coefficient',
    'Age',
    'BMI',
    'Sex',
    'Pregnancy',
    'Smoking',
    'Physical_activity',
    'salt_content_in_the_diet',
    'alcohol_consumption_per_day',
    'Level_of_Stress',
    'Chronic_kidney_disease',
    'Adrenal_and_thyroid_disorders'
]


def train_and_evaluate():
    print("Loading data.csv...")
    if not os.path.exists("data.csv"):
        raise FileNotFoundError("data.csv not found in current directory.")
    
    df = pd.read_csv("data.csv")
    print(f"Dataset shape: {df.shape[0]} rows x {df.shape[1]} columns")

    X = df[FEATURES].copy()
    y = df[TARGET].copy()

    print("\nPreparing features...")
    print(f"Target column: {TARGET}")
    print(f"Number of features: {len(FEATURES)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain set size: {len(X_train)}, Test set size: {len(X_test)}")

    # Calibrated Gradient Boosting Engine
    gb_calibrated = CalibratedClassifierCV(
        estimator=GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=42
        ),
        method='sigmoid',
        cv=5
    )

    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Raw Gradient Boosting': GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=42
        ),
        'Calibrated Gradient Boosting': gb_calibrated,
        'Calibrated Blended Ensemble': VotingClassifier(
            estimators=[
                ('gb_cal', gb_calibrated),
                ('lr', LogisticRegression(C=1.0, random_state=42, max_iter=1000))
            ],
            voting='soft',
            weights=[0.75, 0.25]
        )
    }

    print("\nTraining and evaluating candidate models...")
    eval_results = {}

    for name, clf in models.items():
        pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('classifier', clf)
        ])
        
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_proba)
        cm = confusion_matrix(y_test, y_pred)

        eval_results[name] = {
            'pipeline': pipeline,
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc': auc,
            'cm': cm
        }

        print(f"\nModel: {name}")
        print(f"Accuracy:  {acc * 100:.2f}%")
        print(f"Precision: {prec * 100:.2f}%")
        print(f"Recall:    {rec * 100:.2f}%")
        print(f"F1 Score:  {f1 * 100:.2f}%")
        print(f"ROC-AUC:   {auc * 100:.2f}%")

    best_name = 'Calibrated Blended Ensemble'
    best_info = eval_results[best_name]

    print(f"\nSelected production model: {best_name}")
    print(f"Selected Model Accuracy: {best_info['accuracy'] * 100:.2f}%")
    print(f"Selected Model ROC-AUC:  {best_info['auc'] * 100:.2f}%")

    # Create both model and models directory for seamless compatibility
    for folder in ["model", "models"]:
        os.makedirs(folder, exist_ok=True)
        model_path = os.path.join(folder, "blood_pressure_model.pkl")
        metadata_path = os.path.join(folder, "blood_pressure_metadata.pkl")

        print(f"Saving calibrated pipeline to {model_path}...")
        joblib.dump(best_info['pipeline'], model_path)

        metadata = {
            "features": FEATURES,
            "target": TARGET,
            "model_name": best_name,
            "metrics": {
                "accuracy": float(best_info['accuracy']),
                "precision": float(best_info['precision']),
                "recall": float(best_info['recall']),
                "f1": float(best_info['f1']),
                "roc_auc": float(best_info['auc']),
                "confusion_matrix": best_info['cm'].tolist()
            }
        }

        print(f"Saving feature metadata to {metadata_path}...")
        joblib.dump(metadata, metadata_path)

    print("\nTraining & calibration complete.")


if __name__ == "__main__":
    train_and_evaluate()
