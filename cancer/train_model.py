import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

def train_and_save_model(data_path="Cancer.csv", model_path="model.joblib"):
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Drop Patient Id if exists
    if "Patient Id" in df.columns:
        df = df.drop(columns=["Patient Id"])
    
    # Target variable mapping
    # Low -> 0, Medium -> 1, High -> 2
    level_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
    df['Target'] = df['Level'].map(level_mapping)
    
    feature_columns = [col for col in df.columns if col not in ['Level', 'Target']]
    
    X = df[feature_columns]
    y = df['Target']
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train Random Forest Classifier
    rf_model = RandomForestClassifier(n_estimators=150, random_state=42, max_depth=10)
    rf_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete. Test Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))
    
    # Feature importances
    importances = dict(zip(feature_columns, rf_model.feature_importances_))
    
    model_payload = {
        'model': rf_model,
        'feature_columns': feature_columns,
        'feature_importances': importances,
        'level_mapping': level_mapping,
        'reverse_mapping': {0: 'Low', 1: 'Medium', 2: 'High'}
    }
    
    joblib.dump(model_payload, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == "__main__":
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "Cancer.csv")
    model_path = os.path.join(base_dir, "model.joblib")
    train_and_save_model(csv_path, model_path)
