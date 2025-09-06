# train.py
import os
import re
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

os.makedirs("models", exist_ok=True)

def clean_text(text):
    if pd.isna(text):
        return ""
    # quitar URLs, caracteres no alfabéticos (mantener tildes y ñ)
    text = re.sub(r'http\\S+', '', text)
    text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]', ' ', text)
    return text.lower()

def main():
    try:
        print("Cargando dataset (train.csv)...")
        df = pd.read_csv("train.csv")
        if df.empty:
            raise ValueError("El archivo train.csv está vacío.")
        df = df.fillna('')
        # unir título + texto si el dataset los tiene
        if 'title' in df.columns:
            X = (df['title'].astype(str) + " " + df['text'].astype(str)).apply(clean_text)
        else:
            X = df['text'].astype(str).apply(clean_text)
        y = df['label'].astype(int)
    except Exception as e:
        print(f"Error al cargar el dataset: {e}")
        return

    try:
        print("Dividiendo dataset...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError as e:
        print("Error al dividir el dataset: ", e)
        return

    print("Vectorizando con TF-IDF...")
    vectorizer = TfidfVectorizer(stop_words='english', max_df=0.8, max_features=20000)
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    print("Optimizando hiperparámetros con GridSearchCV...")
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5],
    }
    model = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=3, scoring='f1')

    print("Entrenando modelo...")
    model.fit(X_train_tfidf, y_train)

    print("Mejores hiperparámetros:", model.best_params_)

    print("Evaluando modelo...")
    y_pred = model.predict(X_test_tfidf)
    print(classification_report(y_test, y_pred))

    print("Guardando modelos en /models ...")
    joblib.dump(model.best_estimator_, "models/fake_news_model.pkl")
    joblib.dump(vectorizer, "models/vectorizer.pkl")
    print("¡Listo!")

if __name__ == "__main__":
    main()