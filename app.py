# =====================================================================
# NEWS ANALYZER - APLICACIÓN FLASK PRINCIPAL
# =====================================================================

# =====================================================================
# IMPORTACIONES Y CONFIGURACIÓN INICIAL
# =====================================================================
from flask import Flask, render_template, request, jsonify
import joblib
import re
import os
from io import BytesIO
import requests

# Importar el scraper de noticias
from utils.news_scraper import NewsExtractor

# Dependencias opcionales para extracción de texto
try:
    import PyPDF2  # type: ignore
except Exception:
    PyPDF2 = None

try:
    from docx import Document  # type: ignore
except Exception:
    Document = None


# =====================================================================
# CONFIGURACIÓN DE LA APLICACIÓN FLASK
# =====================================================================
app = Flask(__name__, template_folder="templates", static_folder="static")

# =====================================================================
# CONSTANTES Y CONFIGURACIÓN
# =====================================================================
MODEL_PATH = os.path.join("models", "fake_news_model.pkl")
VECT_PATH = os.path.join("models", "vectorizer.pkl")

OCR_API_KEY = os.getenv("OCR_SPACE_API_KEY", "K87492476688957")
OCR_API_URL = "https://api.ocr.space/parse/image"

# =====================================================================
# VERIFICACIÓN DE ARCHIVOS DE MODELO
# =====================================================================
if not os.path.exists(MODEL_PATH) or not os.path.exists(VECT_PATH):
    raise FileNotFoundError("Asegúrate de haber ejecutado train.py y tener models/fake_news_model.pkl y models/vectorizer.pkl")

# =====================================================================
# CARGA DE MODELOS
# =====================================================================
model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECT_PATH)

# =====================================================================
# INICIALIZACIÓN DEL SCRAPER DE NOTICIAS
# =====================================================================
news_extractor = NewsExtractor()

# =====================================================================
# FUNCIONES AUXILIARES
# =====================================================================
def clean_text(text):
    """Limpia el texto eliminando URLs y caracteres no deseados"""
    if not text:
        return ""
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', ' ', text)
    return text.lower()

def extract_text_from_file(filename, content):
    """Extrae texto de diferentes tipos de archivos"""
    filename_lower = filename.lower()
    
    if filename_lower.endswith('.pdf'):
        if not PyPDF2:
            return None, "PyPDF2 no instalado en el servidor"
        return extract_text_from_pdf(content), None
        
    elif filename_lower.endswith('.docx'):
        if not Document:
            return None, "python-docx no instalado en el servidor"
        return extract_text_from_docx(content), None
        
    elif filename_lower.endswith('.txt'):
        return extract_text_from_txt(content), None
        
    else:
        return None, "Formato no soportado. Use PDF, DOCX o TXT"

def extract_text_from_pdf(content):
    """Extrae texto de archivos PDF"""
    reader = PyPDF2.PdfReader(BytesIO(content))
    pages_text = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception:
            pages_text.append("")
    return "\n".join(pages_text)

def extract_text_from_docx(content):
    """Extrae texto de archivos DOCX"""
    doc = Document(BytesIO(content))
    return "\n".join([p.text for p in doc.paragraphs])

def extract_text_from_txt(content):
    """Extrae texto de archivos TXT con diferentes codificaciones"""
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(enc)
        except Exception:
            continue
    return ""

def perform_prediction(text):
    """Realiza la predicción usando el modelo cargado"""
    text_clean = clean_text(text)
    X = vectorizer.transform([text_clean])
    pred = int(model.predict(X)[0])
    
    try:
        prob = float(model.predict_proba(X)[0][1])
    except Exception:
        prob = None
        
    return pred, prob

def analyze_news_content(title, content, description):
    """
    Analiza el contenido de una noticia combinando título, contenido y descripción
    Pondera los diferentes elementos según su importancia
    """
    # Limpiar cada componente
    title_clean = clean_text(title) if title else ""
    content_clean = clean_text(content) if content else ""
    description_clean = clean_text(description) if description else ""
    
    # Crear texto combinado con ponderación
    # El título tiene mayor peso ya que es donde suelen estar las señales más obvias de fake news
    combined_text = ""
    
    if title_clean:
        # Repetir el título para darle más peso en el análisis
        combined_text += title_clean + " " + title_clean + " "
    
    if description_clean:
        # La descripción también es importante
        combined_text += description_clean + " "
    
    if content_clean:
        # El contenido completa el análisis
        combined_text += content_clean
    
    # Si no hay contenido suficiente, retornar valores por defecto
    if len(combined_text.strip()) < 10:
        return None, None, {
            'title_analysis': None,
            'content_length': 0,
            'has_description': bool(description_clean)
        }
    
    # Realizar predicción en el texto combinado
    pred, prob = perform_prediction(combined_text)
    
    # Métricas adicionales para el análisis
    analysis_metrics = {
        'title_analysis': 'suspicious' if title_clean and any(word in title_clean.lower() for word in 
            ['increíble', 'milagroso', 'secreto', 'oculto', 'médicos odian', 'truco', 'no quieren que sepas']) else 'normal',
        'content_length': len(content_clean),
        'has_description': bool(description_clean),
        'combined_text_length': len(combined_text)
    }
    
    return pred, prob, analysis_metrics

# =====================================================================
# RUTAS PRINCIPALES
# =====================================================================
@app.route("/")
def index():
    """Ruta principal que sirve la página de inicio"""
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    """Endpoint para predecir si una noticia es falsa o real"""
    text = ""

    # 1) Si viene un archivo (multipart/form-data)
    if 'file' in request.files:
        f = request.files['file']
        filename = (f.filename or '').lower()
        content = f.read()

        if not content:
            return jsonify({"error": "Archivo vacío"}), 400

        text, error = extract_text_from_file(filename, content)
        if error:
            return jsonify({"error": error}), 400

    else:
        # 2) Si no hay archivo, intentar JSON {'text': '...'}
        payload = request.get_json(silent=True) or {}
        text = payload.get("text", "")

    # Validación
    if not text or not text.strip():
        return jsonify({"error": "No se encontró texto para analizar"}), 400

    # Realizar predicción
    pred, prob = perform_prediction(text)

    return jsonify({
        "prediction": "Fake" if pred == 1 else "Real",
        "label": pred,
        "probability": prob,
        "extracted_preview": (text[:180] + '...') if text else None
    })

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
    """Endpoint para analizar una noticia desde una URL"""
    payload = request.get_json(silent=True) or {}
    url = payload.get("url", "").strip()
    
    if not url:
        return jsonify({"error": "Se requiere una URL válida"}), 400
    
    # Validar formato básico de URL
    if not (url.startswith('http://') or url.startswith('https://')):
        url = 'https://' + url
    
    try:
        # Extraer contenido usando el scraper
        article_data = news_extractor.extract_content(url)
        
        if not article_data:
            return jsonify({"error": "No se pudo extraer el contenido de la URL"}), 400
        
        # Obtener los componentes de la noticia
        title = article_data.get('title', '')
        content = article_data.get('content', '')
        description = article_data.get('description', '')
        author = article_data.get('author', '')
        publish_date = article_data.get('publish_date', '')
        
        # Verificar que hay contenido suficiente para analizar
        if not any([title, content, description]) or len(title + content + description) < 20:
            return jsonify({"error": "No se encontró contenido suficiente para analizar en la URL"}), 400
        
        # Realizar análisis combinado
        pred, prob, metrics = analyze_news_content(title, content, description)
        
        if pred is None:
            return jsonify({"error": "No se pudo analizar el contenido extraído"}), 400
        
        # Crear preview del contenido extraído
        preview_parts = []
        if title: preview_parts.append(f"Título: {title[:100]}...")
        if description: preview_parts.append(f"Descripción: {description[:100]}...")
        if content: preview_parts.append(f"Contenido: {content[:200]}...")
        
        extracted_preview = " | ".join(preview_parts)
        
        return jsonify({
            "prediction": "Fake" if pred == 1 else "Real",
            "label": pred,
            "probability": prob,
            "url": url,
            "article_data": {
                "title": title,
                "author": author,
                "publish_date": publish_date,
                "description": description,
                "content_length": len(content),
                "images_count": len(article_data.get('images', []))
            },
            "analysis_metrics": metrics,
            "extracted_preview": extracted_preview
        })
        
    except requests.RequestException as e:
        return jsonify({"error": f"Error al acceder a la URL: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"Error al procesar la noticia: {str(e)}"}), 500

@app.route("/ocr_predict", methods=["POST"])
def ocr_predict():
    """Endpoint para procesar imágenes con OCR y predecir"""
    if 'image' not in request.files:
        return jsonify({"error": "No se encontró la imagen"}), 400
        
    f = request.files['image']
    content = f.read()
    
    if not content:
        return jsonify({"error": "Imagen vacía"}), 400

    # Procesar con OCR
    try:
        ocr = requests.post(OCR_API_URL, 
                           files={'file': (f.filename or 'image.jpg', content)},
                           data={'apikey': OCR_API_KEY, 
                                 'language': 'spa', 
                                 'isOverlayRequired': False}, 
                           timeout=30)
    except requests.RequestException as e:
        return jsonify({"error": f"Fallo OCR: {str(e)}"}), 502
        
    if ocr.status_code != 200:
        return jsonify({"error": f"OCR.space devolvió {ocr.status_code}"}), 502
        
    data = ocr.json()
    results = data.get('ParsedResults') or []
    text = (results[0].get('ParsedText') or '').strip() if results else ''
    
    if not text:
        return jsonify({"error": "No se detectó texto en la imagen"}), 400

    # Realizar predicción
    pred, prob = perform_prediction(text)

    return jsonify({
        "prediction": "Fake" if pred == 1 else "Real",
        "label": pred,
        "probability": prob,
        "text": text,
        "extracted_preview": (text[:180] + '...')
    })

# =====================================================================
# EJECUCIÓN PRINCIPAL
# =====================================================================
if __name__ == "__main__":
    app.run(debug=True)