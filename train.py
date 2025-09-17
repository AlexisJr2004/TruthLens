# train.py (versión adaptada a Excel)
import os
import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

os.makedirs("models", exist_ok=True)

def clean_text(text):
    """Limpieza básica: quitar URLs, caracteres no alfabéticos (mantener tildes y ñ)."""
    if pd.isna(text):
        return ""
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]", " ", text)
    return text.lower()

def main():
    # =========================
    # 1. Cargar datasets
    # =========================
    print("📂 Cargando datasets...")
    train_df = pd.read_excel("data/train.xlsx").fillna("")
    dev_df   = pd.read_excel("data/development.xlsx").fillna("")
    # =========================
    # 2. Preparar texto
    # =========================
    for df in [train_df, dev_df]:
        df["text_combined"] = (df["Headline"].astype(str) + " " + df["Text"].astype(str)).apply(clean_text)

    # Etiquetas
    y_train = train_df["Category"].map({"True": 0, "Fake": 1}).astype(int)
    y_dev   = dev_df["Category"].map({"True": 0, "Fake": 1}).astype(int)

    X_train = train_df["text_combined"]
    X_dev   = dev_df["text_combined"]

    # =========================
    # 3. Vectorización TF-IDF
    # =========================
    print("🔤 Vectorizando texto...")
    vectorizer = TfidfVectorizer(ngram_range=(1,2), max_df=0.9, max_features=20000)
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_dev_tfidf   = vectorizer.transform(X_dev)

    # =========================
    # 4. Entrenamiento modelo
    # =========================
    print("🌲 Entrenando modelo RandomForest...")
    model = RandomForestClassifier(
        n_estimators=200, max_depth=None, random_state=42, n_jobs=-1
    )
    model.fit(X_train_tfidf, y_train)

    # =========================
    # 5. Evaluación en dev
    # =========================
    print("\n📊 Evaluación en data/development.xlsx")
    y_pred = model.predict(X_dev_tfidf)
    print(classification_report(y_dev, y_pred, target_names=["True", "Fake"]))

    # =========================
    # 6. Guardado de modelo
    # =========================
    print("\n💾 Guardando modelo...")
    joblib.dump(model, "models/fake_news_model.pkl")
    joblib.dump(vectorizer, "models/vectorizer.pkl")
    print("✅ ¡Modelo y vectorizador guardados en /models!")

    # =========================
    # 7. Predicción en test
    # =========================
    print("\n🔮 Generando predicciones en data/test.xlsx...")
    test_df = pd.read_excel("data/test.xlsx").fillna("")
    test_df["text_combined"] = (test_df["HEADLINE"].astype(str) + " " + test_df["TEXT"].astype(str)).apply(clean_text)

    X_test_tfidf = vectorizer.transform(test_df["text_combined"])
    test_preds = model.predict(X_test_tfidf)

    test_df["Prediction"] = ["True" if p == 0 else "Fake" for p in test_preds]

    # Guardar resultados
    test_df.to_excel("data/submission.xlsx", index=False)
    print("📁 Archivo de salida: data/submission.xlsx")

if __name__ == "__main__":
    main()
