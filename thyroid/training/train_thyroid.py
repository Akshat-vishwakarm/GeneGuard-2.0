"""
GeneGuard Thyroid ML Training Pipeline
---------------------------------------
Reproducible, leak-free training pipeline using the real UCI hypothyroid dataset (hypothyroid_1.csv).
Performs 80/20 stratified split before any preprocessing, ColumnTransformer with KNNImputer,
OneHotEncoder, RandomForestClassifier, and comprehensive evaluation on an untouched test set.
"""

import os
import json
import shutil
import numpy as np
import pandas as pd
import pickle

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "hypothyroid_1.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
EVAL_DIR = os.path.join(BASE_DIR, "evaluation")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

# 1. Archive old synthetic model if present
old_model_path = os.path.join(BASE_DIR, "model.pkl")
old_archive_path = os.path.join(BASE_DIR, "model_old_synthetic.pkl")
if os.path.exists(old_model_path) and not os.path.exists(old_archive_path):
    shutil.copyfile(old_model_path, old_archive_path)
    print(f"[Archive] Archived old model to {old_archive_path}")

# 2. Load Real Dataset
print(f"[Data] Loading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
df.columns = [c.lower().replace(' ', '_') for c in df.columns]

# Target mapping:
# In hypothyroid_1.csv:
# 'N' = 291 patients with markedly elevated TSH (> 6 mIU/L), low TT4 -> Thyroid Disorder Signal
# 'P' = 3481 patients with normal TSH (median 1.2), normal TT4 -> Normal Thyroid Function Signal
# In the notebook: 'N' -> 0, 'P' -> 1
df['binaryclass'] = df['binaryclass'].replace({'P': 1, 'N': 0}).astype(int)
y = df['binaryclass']

# Features (drop target and 100% missing tbg)
X = df.drop(columns=['binaryclass', 'tbg'])
X.replace('?', np.nan, inplace=True)

num_cols = ['age', 'tsh', 't3', 'tt4', 't4u', 'fti']
for col in num_cols:
    X[col] = pd.to_numeric(X[col], errors='coerce')

cat_cols = [c for c in X.columns if c not in num_cols]

print(f"[Data] Total samples: {len(X)}, Features: {X.shape[1]}")
print(f"[Data] Target counts: Class 0 (Disorder): {(y == 0).sum()}, Class 1 (Normal): {(y == 1).sum()}")

# 3. Stratified Train / Test Split (Untouched Test Set)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"[Split] Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples (Untouched)")

# 4. Construct Scikit-Learn Pipeline
num_transformer = Pipeline(steps=[
    ('imputer', KNNImputer(n_neighbors=5))
])

cat_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer(transformers=[
    ('num', num_transformer, num_cols),
    ('cat', cat_transformer, cat_cols)
])

rf_model = RandomForestClassifier(
    n_estimators=200,
    min_samples_split=10,
    min_samples_leaf=1,
    max_depth=None,
    random_state=42
)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', rf_model)
])

# 5. 5-Fold Stratified Cross-Validation on Training Data ONLY
print("[Cross-Validation] Running 5-fold Stratified CV on training set...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(
    pipeline, X_train, y_train, cv=cv,
    scoring=['accuracy', 'roc_auc', 'f1_macro', 'precision_macro', 'recall_macro']
)

cv_metrics = {
    "cv_accuracy_mean": float(np.mean(cv_results['test_accuracy'])),
    "cv_accuracy_std": float(np.std(cv_results['test_accuracy'])),
    "cv_roc_auc_mean": float(np.mean(cv_results['test_roc_auc'])),
    "cv_roc_auc_std": float(np.std(cv_results['test_roc_auc'])),
    "cv_f1_macro_mean": float(np.mean(cv_results['test_f1_macro'])),
    "cv_f1_macro_std": float(np.std(cv_results['test_f1_macro'])),
    "cv_precision_macro_mean": float(np.mean(cv_results['test_precision_macro'])),
    "cv_recall_macro_mean": float(np.mean(cv_results['test_recall_macro']))
}
print(f"[CV Metrics] Accuracy: {cv_metrics['cv_accuracy_mean']:.4f}, ROC-AUC: {cv_metrics['cv_roc_auc_mean']:.4f}, F1: {cv_metrics['cv_f1_macro_mean']:.4f}")

# 6. Fit Final Pipeline on Full Training Set
print("[Train] Fitting full pipeline on training set...")
pipeline.fit(X_train, y_train)

# 7. Evaluate on Completely Untouched Test Set
print("[Test] Evaluating final pipeline on untouched test set...")
y_pred = pipeline.predict(X_test)
y_probs = pipeline.predict_proba(X_test)

# Class 1 (Normal) prob is col 1; Class 0 (Disorder) prob is col 0
y_prob_class1 = y_probs[:, 1]
y_prob_class0 = y_probs[:, 0]

cm = confusion_matrix(y_test, y_pred).tolist()
cr = classification_report(y_test, y_pred, output_dict=True)

test_acc = float(accuracy_score(y_test, y_pred))
test_roc_auc = float(roc_auc_score(y_test, y_prob_class1))
test_pr_auc_class1 = float(average_precision_score(y_test, y_prob_class1))
test_pr_auc_class0 = float(average_precision_score(1 - y_test, y_prob_class0))
brier = float(brier_score_loss(y_test, y_prob_class1))

print(f"[Test Metrics] Accuracy: {test_acc:.4f}, ROC-AUC: {test_roc_auc:.4f}, Brier Loss: {brier:.4f}")
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 8. Save Metrics
metrics_payload = {
    "model_name": "GeneGuard Thyroid ML Pipeline",
    "dataset": "UCI Hypothyroid Dataset (hypothyroid_1.csv)",
    "target": "binaryclass (0: Elevated Thyroid Disorder Signal / N, 1: Normal Thyroid Function Signal / P)",
    "version": "1.0",
    "classes": [int(c) for c in pipeline.classes_],
    "features": list(X.columns),
    "numeric_features": num_cols,
    "categorical_features": cat_cols,
    "train_samples": int(X_train.shape[0]),
    "test_samples": int(X_test.shape[0]),
    "cross_validation_5fold": cv_metrics,
    "untouched_test_evaluation": {
        "accuracy": test_acc,
        "roc_auc": test_roc_auc,
        "pr_auc_class_0_disorder": test_pr_auc_class0,
        "pr_auc_class_1_normal": test_pr_auc_class1,
        "brier_score_loss": brier,
        "confusion_matrix": cm,
        "classification_report": cr
    }
}

metrics_path = os.path.join(EVAL_DIR, "thyroid_model_metrics.json")
with open(metrics_path, "w") as f:
    json.dump(metrics_payload, f, indent=2)
print(f"[Save] Saved metrics to {metrics_path}")

# 9. Save Complete Trained Pipeline
pipeline_save_path = os.path.join(MODEL_DIR, "gene_guard_thyroid_pipeline.pkl")
with open(pipeline_save_path, "wb") as f:
    pickle.dump(pipeline, f)
print(f"[Save] Saved complete trained pipeline to {pipeline_save_path}")

# Also replace root thyroid/model.pkl with the real pipeline so legacy loaders load the new pipeline
root_model_path = os.path.join(BASE_DIR, "model.pkl")
with open(root_model_path, "wb") as f:
    pickle.dump(pipeline, f)
print(f"[Save] Updated {root_model_path} with production pipeline.")
