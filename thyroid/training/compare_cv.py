import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectKBest, f_classif

# Load dataset
df = pd.read_csv('thyroid/data/hypothyroid_1.csv')
df.columns = [c.lower().replace(' ', '_') for c in df.columns]
df['binaryclass'] = df['binaryclass'].replace({'P': 1, 'N': 0}).astype(int)
y = df['binaryclass']
X = df.drop(columns=['binaryclass', 'tbg'])
X.replace('?', np.nan, inplace=True)

num_cols = ['age', 'tsh', 't3', 'tt4', 't4u', 'fti']
for col in num_cols:
    X[col] = pd.to_numeric(X[col], errors='coerce')

cat_cols = [c for c in X.columns if c not in num_cols]

# Stratified split - 80% train, 20% untouched test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def eval_pipe(name, pipe):
    scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=['accuracy', 'roc_auc', 'f1_macro'])
    print(f"{name}:")
    print(f"  Accuracy : {scores['test_accuracy'].mean():.4f} +/- {scores['test_accuracy'].std():.4f}")
    print(f"  ROC-AUC  : {scores['test_roc_auc'].mean():.4f} +/- {scores['test_roc_auc'].std():.4f}")
    print(f"  F1-Macro : {scores['test_f1_macro'].mean():.4f} +/- {scores['test_f1_macro'].std():.4f}")

pre_knn = ColumnTransformer([
    ('num', KNNImputer(n_neighbors=5), num_cols),
    ('cat', Pipeline([('imp', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), cat_cols)
])

# 1. Baseline
eval_pipe('1. Baseline (KNN, All Features, No Selector)', Pipeline([
    ('prep', pre_knn),
    ('rf', RandomForestClassifier(n_estimators=200, min_samples_split=10, min_samples_leaf=1, random_state=42))
]))

# 2. Balanced class weight
eval_pipe('2. Balanced (KNN, class_weight=balanced)', Pipeline([
    ('prep', pre_knn),
    ('rf', RandomForestClassifier(n_estimators=200, min_samples_split=10, min_samples_leaf=1, class_weight='balanced', random_state=42))
]))

# 3. With SelectKBest(k=25)
eval_pipe('3. SelectKBest(k=25)', Pipeline([
    ('prep', pre_knn),
    ('sel', SelectKBest(f_classif, k=25)),
    ('rf', RandomForestClassifier(n_estimators=200, min_samples_split=10, min_samples_leaf=1, random_state=42))
]))

# 4. SimpleImputer(median)
pre_median = ColumnTransformer([
    ('num', SimpleImputer(strategy='median'), num_cols),
    ('cat', Pipeline([('imp', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), cat_cols)
])
eval_pipe('4. SimpleImputer(median) vs KNN', Pipeline([
    ('prep', pre_median),
    ('rf', RandomForestClassifier(n_estimators=200, min_samples_split=10, min_samples_leaf=1, random_state=42))
]))
