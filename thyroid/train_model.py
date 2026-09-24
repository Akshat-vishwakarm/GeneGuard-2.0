import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

np.random.seed(42)
n_samples = 3000

# Synthetic feature generation
sex = np.random.choice([0, 1], size=n_samples) # 0: female, 1: male

# Normal distributions with realistic thyroid conditions
# Healthy vs Abnormal thyroid parameters
is_disorder = np.random.choice([0, 1], size=n_samples, p=[0.75, 0.25])

tsh = np.where(is_disorder == 1, np.random.uniform(5.0, 45.0, size=n_samples), np.random.uniform(0.4, 4.2, size=n_samples))
t3 = np.where(is_disorder == 1, np.random.uniform(0.1, 0.7, size=n_samples), np.random.uniform(0.8, 2.2, size=n_samples))
tt4 = np.where(is_disorder == 1, np.random.uniform(1.0, 4.5, size=n_samples), np.random.uniform(5.0, 12.5, size=n_samples))
t4u = np.random.uniform(0.7, 1.3, size=n_samples)
fti = tt4 / t4u * 10

on_thyroxine = np.where(is_disorder == 1, np.random.choice([0, 1], size=n_samples, p=[0.4, 0.6]), np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05]))
query_on_thyroxine = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
on_antithyroid_medication = np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05])
pregnant = np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05])
thyroid_surgery = np.where(is_disorder == 1, np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3]), np.random.choice([0, 1], size=n_samples, p=[0.98, 0.02]))
query_hypothyroid = np.where(is_disorder == 1, np.random.choice([0, 1], size=n_samples, p=[0.3, 0.7]), np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05]))
query_hyperthyroid = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
lithium = np.random.choice([0, 1], size=n_samples, p=[0.98, 0.02])
goitre = np.where(is_disorder == 1, np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3]), np.random.choice([0, 1], size=n_samples, p=[0.99, 0.01]))
tumor = np.random.choice([0, 1], size=n_samples, p=[0.97, 0.03])
hypopituitary = np.random.choice([0, 1], size=n_samples, p=[0.99, 0.01])
psych = np.random.choice([0, 1], size=n_samples, p=[0.95, 0.05])

tsh_measured = np.ones(n_samples)
t3_measured = np.ones(n_samples)
tt4_measured = np.ones(n_samples)
t4u_measured = np.ones(n_samples)
fti_measured = np.ones(n_samples)

referral_source_SVHC = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
referral_source_SVI = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
referral_source_other = np.random.choice([0, 1], size=n_samples, p=[0.6, 0.4])

X = np.column_stack([
    sex, tsh, t3, tt4, t4u, fti,
    on_thyroxine, query_on_thyroxine, on_antithyroid_medication, pregnant,
    thyroid_surgery, query_hypothyroid, query_hyperthyroid,
    lithium, goitre, tumor, hypopituitary, psych,
    tsh_measured, t3_measured, tt4_measured, t4u_measured,
    fti_measured, referral_source_SVHC, referral_source_SVI,
    referral_source_other
])

y = is_disorder

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("model.pkl trained and saved successfully!")
