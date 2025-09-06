# app.py
from flask import Flask, render_template, request, jsonify
import joblib
import re
import os

app = Flask(__name__, template_folder="templates", static_folder="static")

MODEL_PATH = os.path.join("models", "fake_news_model.pkl")
VECT_PATH = os.path.join("models", "vectorizer.pkl")

if not os.path.exists(MODEL_PATH) or not os.path.exists(VECT_PATH):
    raise FileNotFoundError("Asegúrate de haber ejecutado train.py y tener models/fake_news_model.pkl y models/vectorizer.pkl")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECT_PATH)

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', ' ', text)
    return text.lower()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(force=True)
    text = payload.get("text", "")
    text_clean = clean_text(text)
    X = vectorizer.transform([text_clean])
    pred = int(model.predict(X)[0])
    prob = None
    try:
        prob = float(model.predict_proba(X)[0][1])
    except Exception:
        prob = None

    return jsonify({
        "prediction": "Fake" if pred == 1 else "Real",
        "label": pred,
        "probability": prob
    })

if __name__ == "__main__":
    app.run(debug=True)
