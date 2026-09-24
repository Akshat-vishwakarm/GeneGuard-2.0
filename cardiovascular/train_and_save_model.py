import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, cross_val_predict
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, accuracy_score, roc_auc_score

print("Loading dataset...")
data = pd.read_csv('cardio_data_processed.xls')

# Feature engineering matching CARDIO.ipynb exactly
data['age_years'] = data['age'] / 365.25
data['bmi'] = data['weight'] / ((data['height'] / 100) ** 2)
data['pulse_pressure'] = data['ap_hi'] - data['ap_lo']
data['bp_ratio'] = data['ap_hi'] / data['ap_lo']

features = [
    'age_years', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
    'cholesterol', 'gluc', 'smoke', 'alco', 'active',
    'bmi', 'pulse_pressure', 'bp_ratio'
]

X = data[features]
y = data['cardio']

print(f"Dataset shape: X={X.shape}, y={y.shape}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

numerical_features = [
    'age_years', 'height', 'weight', 'ap_hi', 'ap_lo',
    'bmi', 'pulse_pressure', 'bp_ratio'
]
categorical_features = [
    'gender', 'cholesterol', 'gluc', 'smoke', 'alco', 'active'
]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ]
)

rf_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(random_state=42))
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

param_grid = {
    'classifier__n_estimators': [100, 200],
    'classifier__max_depth': [10, 15],
    'classifier__min_samples_split': [2, 5],
    'classifier__min_samples_leaf': [1, 2]
}

print("Running GridSearchCV for Random Forest model...")
rf_grid = GridSearchCV(
    estimator=rf_pipeline,
    param_grid=param_grid,
    cv=cv,
    scoring='roc_auc',
    n_jobs=-1,
    verbose=1
)

rf_grid.fit(X_train, y_train)
best_rf_model = rf_grid.best_estimator_

print("Best Parameters:", rf_grid.best_params_)
print("Best CV ROC-AUC:", round(rf_grid.best_score_, 4))

test_pred = best_rf_model.predict(X_test)
test_prob = best_rf_model.predict_proba(X_test)[:, 1]
test_acc = accuracy_score(y_test, test_pred)
test_auc = roc_auc_score(y_test, test_prob)
print(f"Test Accuracy: {test_acc:.4f} (~{round(test_acc*100)}%)")
print(f"Test ROC-AUC : {test_auc:.4f}")

# Determine best decision threshold based on F1 score (matching CARDIO.ipynb logic)
cv_prob = cross_val_predict(
    best_rf_model, X_train, y_train, cv=cv, method='predict_proba', n_jobs=-1
)[:, 1]

thresholds = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
best_f1 = -1
final_threshold = 0.5

for t in thresholds:
    pred = (cv_prob >= t).astype(int)
    f1 = f1_score(y_train, pred, zero_division=0)
    if f1 > best_f1:
        best_f1 = f1
        final_threshold = float(t)

print(f"Selected Threshold: {final_threshold} (F1 Score: {best_f1:.4f})")

# Save exact model, threshold, and feature list
joblib.dump(best_rf_model, 'cardiovascular_model.pkl')
joblib.dump(final_threshold, 'cardiovascular_threshold.pkl')
joblib.dump(features, 'cardiovascular_features.pkl')

print("All artifacts dumped successfully:")
print(" - cardiovascular_model.pkl")
print(" - cardiovascular_threshold.pkl")
print(" - cardiovascular_features.pkl")
