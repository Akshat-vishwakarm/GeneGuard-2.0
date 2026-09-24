import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib

def main():
    excel_path = 'Metabolic_Syndrome_1000_Patients_Pre_Post_6_Months.xlsx'
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Dataset file {excel_path} not found.")

    df = pd.read_excel(excel_path)

    target_col = 'Metabolic Syndrome Status (Post)'
    df[target_col] = df[target_col].astype(str).str.strip().str.lower()
    
    status_map = {
        'remission': 0,
        'not in remission': 1,
        'not_in_remission': 1,
        'active': 1,
        'present': 1
    }
    
    y = df[target_col].map(status_map)
    if y.isna().any():
        raise ValueError("Unmapped values found in target column.")
    y = y.astype(int)

    # Find insulin column name matching dataset string
    insulin_col = [c for c in df.columns if 'Fasting Insulin Pre' in c][0]

    features = [
        'Age (years)',
        'Height (cm)',
        'Waist Circumference Pre (cm)',
        'BMI Pre',
        'Body Fat Pre (kg)',
        'Skeletal Muscle Pre (kg)',
        'Total Cholesterol Pre (mg/dL)',
        'Triglycerides Pre (mg/dL)',
        'LDL Pre (mg/dL)',
        'HDL Pre (mg/dL)',
        'Systolic BP Pre (mmHg)',
        'Diastolic BP Pre (mmHg)',
        'Fasting Glucose Pre (mg/dL)',
        insulin_col,
        'HOMA-IR Pre'
    ]

    X = df[features].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42
    )

    # Oversampling minority class as in notebook code
    minority_mask = y_train == 1
    X_min = X_train[minority_mask]
    y_min = y_train[minority_mask]
    ratio = len(X_train[~minority_mask]) // len(X_min) if len(X_min) > 0 else 0

    if ratio > 1:
        X_min_os = pd.concat([X_min] * ratio, ignore_index=True)
        y_min_os = pd.concat([y_min] * ratio, ignore_index=True)
        X_train_bal = pd.concat([X_train, X_min_os], ignore_index=True)
        y_train_bal = pd.concat([y_train, y_min_os], ignore_index=True)
    else:
        X_train_bal = X_train
        y_train_bal = y_train

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_bal)
    X_test_scaled  = scaler.transform(X_test)

    rf_model = RandomForestClassifier(class_weight='balanced', random_state=42)
    rf_model.fit(X_train_scaled, y_train_bal)

    os.makedirs('model', exist_ok=True)
    joblib.dump(scaler, os.path.join('model', 'scaler.pkl'))
    joblib.dump(rf_model, os.path.join('model', 'metabolic_model.pkl'))

    print("Model and scaler exported successfully to model/ directory.")
    print(f"Train accuracy: {rf_model.score(X_train_scaled, y_train_bal):.4f}")
    print(f"Test accuracy:  {rf_model.score(X_test_scaled, y_test):.4f}")

if __name__ == '__main__':
    main()
