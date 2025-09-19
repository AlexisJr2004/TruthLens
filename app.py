# IMPORTACIONES Y CONFIGURACIÓN INICIAL
from flask import Flask, render_template, request, jsonify
import torch
import re
import os
from io import BytesIO
import requests

# Cargar variables de entorno desde .env
from dotenv import load_dotenv
load_dotenv()  # Carga las variables del archivo .env

# Importaciones para BERT
from transformers import AutoTokenizer, AutoModelForSequenceClassification

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

# CONFIGURACIÓN DE LA APLICACIÓN FLASK
app = Flask(__name__, template_folder="src/templates", static_folder="src/static")

# CONSTANTES Y CONFIGURACIÓN
BERT_MODEL_PATH = os.getenv("BERT_MODEL_PATH", os.path.join("models", "truthlens_bert_model")) # Configuración del modelo BERT

# Configuración OCR.Space API
OCR_API_KEY = os.getenv("OCR_SPACE_API_KEY")
OCR_API_URL = os.getenv("OCR_API_URL")

# Configuración Flask
FLASK_ENV = os.getenv("FLASK_ENV", "development")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"

# CLASE TRUTHLENS BERT
class TruthLensBERT:
    def __init__(self, model_path=BERT_MODEL_PATH):
        """Inicializa el modelo BERT entrenado"""
        print(f"🔥 Cargando modelo BERT desde: {model_path}")
        
        # Verificar que existe el modelo
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Modelo BERT no encontrado en: {model_path}")
        
        # Configurar device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"📱 Usando device: {self.device}")
        
        # Cargar tokenizer y modelo
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            self.model.to(self.device)
            self.model.eval()
            print("✅ Modelo BERT cargado exitosamente")
        except Exception as e:
            print(f"❌ Error cargando modelo BERT: {str(e)}")
            raise
    
    def clean_text(self, text):
        """Limpia el texto igual que en entrenamiento"""
        if not text:
            return ""
        # Aplicar misma limpieza que en entrenamiento
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        text = re.sub(r'@\w+|#\w+', '', text)
        text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def predict(self, headline, text="", threshold=0.7):
        """Predice si una noticia es falsa o verdadera con umbral ajustable"""
        try:
            # Combinar y limpiar texto (igual que en entrenamiento)
            headline_clean = self.clean_text(headline)
            text_clean = self.clean_text(text)
            # Repetir headline para darle más peso (como en entrenamiento)
            combined_text = f"{headline_clean} {headline_clean} {text_clean}"
            
            # Tokenizar
            inputs = self.tokenizer(
                combined_text,
                truncation=True,
                padding='max_length',
                max_length=512,
                return_tensors="pt"
            )
            
            # Mover a device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Predecir
            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
                prob_fake = probabilities[0][1].item()
                prob_true = probabilities[0][0].item()
                
                # 🎯 CALIBRACIÓN INTELIGENTE
                # Si las probabilidades están muy cerca, ser más conservador
                prob_diff = abs(prob_fake - prob_true)
                
                if prob_diff < 0.3:  # Decisión incierta
                    adjusted_threshold = 0.85  # Ser muy conservador
                    decision_confidence = "LOW"
                elif prob_diff < 0.5:  # Decisión moderada
                    adjusted_threshold = 0.75  # Moderadamente conservador
                    decision_confidence = "MEDIUM"
                else:  # Decisión clara
                    adjusted_threshold = 0.65  # Usar umbral normal
                    decision_confidence = "HIGH"
                
                # Aplicar umbral calibrado
                if prob_fake >= adjusted_threshold:
                    prediction = 1  # Fake
                    confidence = prob_fake
                else:
                    prediction = 0  # True
                    confidence = prob_true
                
                # Raw prediction (sin calibración)
                raw_prediction = 1 if prob_fake > prob_true else 0
            
            return {
                'prediction': 'Fake' if prediction == 1 else 'True',
                'label': prediction,
                'confidence': confidence,
                'probability_fake': prob_fake,
                'probability_true': prob_true,
                'threshold_used': adjusted_threshold,
                'raw_prediction': raw_prediction,
                'decision_confidence': decision_confidence,
                'probability_difference': prob_diff,
                'calibration_applied': adjusted_threshold != threshold
            }
        except Exception as e:
            print(f"❌ Error en predicción BERT: {str(e)}")
            # Fallback a respuesta segura
            return {
                'prediction': 'Error',
                'label': -1,
                'confidence': 0.0,
                'probability_fake': 0.5,
                'probability_true': 0.5,
                'error': str(e)
            }

# =====================================================================
# VERIFICACIÓN E INICIALIZACIÓN DEL MODELO
# =====================================================================
print("🚀 Iniciando TruthLens con modelo BERT...")

try:
    # Inicializar modelo BERT
    truth_lens_model = TruthLensBERT()
    print("✅ TruthLens BERT inicializado correctamente")
except Exception as e:
    print(f"❌ Error inicializando TruthLens BERT: {str(e)}")
    print("⚠️ Verifica que el modelo esté en 'models/truthlens_bert_model/'")
    raise

# =====================================================================
# INICIALIZACIÓN DEL SCRAPER DE NOTICIAS
# =====================================================================
news_extractor = NewsExtractor()

# =====================================================================
# FUNCIONES AUXILIARES
# =====================================================================
def get_recommendation(result):
    """Genera recomendaciones basadas en los resultados del modelo"""
    prob_fake = result.get('probability_fake', 0.5)
    prob_true = result.get('probability_true', 0.5)
    diff = result.get('probability_difference', 0)
    
    if diff < 0.2:
        return "⚠️ Resultado INCIERTO - Verificar con fuentes adicionales"
    elif prob_fake > 0.9:
        return "🚨 ALTA probabilidad de fake news - Desconfiar"
    elif prob_fake > 0.8:
        return "⚠️ PROBABLE fake news - Verificar cuidadosamente"
    elif prob_fake > 0.6:
        return "🤔 POSIBLE fake news - Investigar más"
    elif prob_true > 0.8:
        return "✅ PROBABLE noticia real - Pero siempre verificar"
    else:
        return "🔍 Resultado ambiguo - Aplicar criterio periodístico"

def clean_text(text):
    """Limpia el texto eliminando URLs y caracteres no deseados - Wrapper para compatibilidad"""
    if not text:
        return ""
    return truth_lens_model.clean_text(text)

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
    """Realiza la predicción usando el modelo BERT"""
    try:
        # Usar el modelo BERT para predicción
        result = truth_lens_model.predict(text, "")
        
        # Mantener compatibilidad con código existente
        pred = result['label']
        prob = result.get('probability_fake', 0.5)
        
        return pred, prob
    except Exception as e:
        print(f"❌ Error en perform_prediction: {str(e)}")
        # Fallback seguro
        return 0, 0.5

def analyze_news_content(title, content, description):
    """
    Analiza el contenido de una noticia usando BERT
    Optimizado para el modelo entrenado
    """
    try:
        # Limpiar cada componente
        title_clean = clean_text(title) if title else ""
        content_clean = clean_text(content) if content else ""
        description_clean = clean_text(description) if description else ""
        
        # Crear texto combinado optimizado para BERT
        text_parts = []
        if title_clean:
            text_parts.append(title_clean)
        if description_clean:
            text_parts.append(description_clean)
        if content_clean:
            text_parts.append(content_clean)
        
        combined_text = " ".join(text_parts)
        
        # Si no hay contenido suficiente, retornar valores por defecto
        if len(combined_text.strip()) < 10:
            return None, None, {
                'title_analysis': None,
                'content_length': 0,
                'has_description': bool(description_clean),
                'error': 'Insufficient content'
            }
        
        # Usar BERT directamente para mejor análisis
        result = truth_lens_model.predict(title_clean, content_clean + " " + description_clean)
        
        # Extraer predicción y probabilidad
        pred = result['label']
        prob = result.get('probability_fake', 0.5)
        confidence = result.get('confidence', 0.0)
        
        # Métricas adicionales para el análisis
        analysis_metrics = {
            'title_analysis': 'suspicious' if title_clean and any(word in title_clean.lower() for word in 
                ['increíble', 'milagroso', 'secreto', 'oculto', 'médicos odian', 'truco', 'no quieren que sepas', 
                 'impactante', 'revelado', 'bomba', 'exclusivo']) else 'normal',
            'content_length': len(content_clean),
            'has_description': bool(description_clean),
            'combined_text_length': len(combined_text),
            'bert_confidence': confidence,
            'model_type': 'BERT',
            'accuracy_estimate': '83%',
            # Información adicional del modelo BERT
            'probability_fake': result.get('probability_fake', 0.5),
            'probability_true': result.get('probability_true', 0.5),
            'threshold_used': result.get('threshold_used', 0.7),
            'decision_confidence': result.get('decision_confidence', 'UNKNOWN'),
            'calibration_applied': result.get('calibration_applied', False),
            'recommendation': get_recommendation(result)
        }
        
        return pred, prob, analysis_metrics
        
    except Exception as e:
        print(f"❌ Error en analyze_news_content: {str(e)}")
        return None, None, {
            'error': str(e),
            'title_analysis': 'error',
            'content_length': 0,
            'has_description': False
        }

# =====================================================================
# RUTAS PRINCIPALES
# =====================================================================
@app.route("/")
def index():
    """Ruta principal que sirve la página de inicio"""
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    """Endpoint para predecir si una noticia es falsa o real usando BERT"""
    text = ""
    title = ""
    content = None  # Inicializar para evitar errores

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
            
        # Para archivos: usar las primeras líneas como título, resto como contenido
        lines = text.split('\n')
        # Buscar la primera línea significativa como título
        title = ""
        content_lines = []
        
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if not title and line_clean and len(line_clean) > 10:
                title = line_clean[:100]  # Limitar título a 100 chars
            elif title:  # Ya tenemos título, el resto es contenido
                content_lines.append(line)
        
        text = '\n'.join(content_lines)
        
        # Si no se encontró título adecuado, usar el nombre del archivo
        if not title:
            title = f"Documento: {f.filename or 'archivo'}"

    else:
        # 2) Si no hay archivo, intentar JSON {'text': '...', 'title': '...'}
        payload = request.get_json(silent=True) or {}
        text = payload.get("text", "")
        title = payload.get("title", "")
        
        # Para compatibilidad hacia atrás, si no hay título pero hay texto
        if not title and text:
            # Si es solo texto, tratarlo como contenido completo
            title = text[:100] + "..." if len(text) > 100 else text
            
    # Validación
    combined_text = f"{title} {text}".strip()
    if not combined_text or len(combined_text) < 5:
        return jsonify({"error": "No se encontró texto suficiente para analizar"}), 400

    # Realizar predicción con BERT usando título y contenido separados
    try:
        result = truth_lens_model.predict(title, text)
        
        # Determinar el tipo de entrada para debug
        is_file_upload = 'file' in request.files
        extraction_method = "Archivo subido" if is_file_upload else "Texto Manual"
        file_info = ""
        if is_file_upload and content:
            f = request.files['file']
            file_size_mb = len(content) / (1024 * 1024)  # Usar content ya leído
            file_info = f"Archivo: {f.filename or 'sin_nombre'} ({file_size_mb:.2f} MB)"
        
        return jsonify({
            "prediction": result['prediction'],
            "label": result['label'],
            "probability": result.get('probability_fake', 0.5),
            "confidence": result.get('confidence', 0.0),
            "model_info": {
                "type": "BERT",
                "accuracy": "83.05%",
                "f1_score": "0.826"
            },
            # 🔍 DIAGNÓSTICO COMPLETO - Mostrar todo lo que devuelve BERT
            "debug_info": {
                "probability_true": result.get('probability_true', 0.5),
                "probability_fake": result.get('probability_fake', 0.5),
                "raw_prediction": result.get('raw_prediction', -1),
                "threshold_used": result.get('threshold_used', 0.7),
                "confidence_fake": result.get('probability_fake', 0.5),
                "confidence_true": result.get('probability_true', 0.5),
                "bert_says": "Fake" if result.get('raw_prediction') == 1 else "True",
                "final_decision": result['prediction'],
                "title_length": len(title),
                "text_length": len(text),
                "combined_length": len(combined_text),
                "title_preview": title[:50] + "..." if len(title) > 50 else title,
                "text_preview": text[:100] + "..." if len(text) > 100 else text,
                "decision_confidence": result.get('decision_confidence', 'UNKNOWN'),
                "probability_difference": result.get('probability_difference', 0),
                "calibration_applied": result.get('calibration_applied', False),
                "recommendation": get_recommendation(result),
                "extraction_method": extraction_method,
                "file_info": file_info
            },
            "extracted_preview": (combined_text[:180] + '...') if combined_text else None
        })
    except Exception as e:
        return jsonify({"error": f"Error en predicción BERT: {str(e)}"}), 500

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
        
        # 🎯 OPTIMIZACIÓN PARA BERT: Limitar contenido a 400-500 caracteres
        # Priorizar: título completo + descripción + primeros párrafos del contenido
        
        # Calcular límites inteligentes
        title_length = len(title)
        description_length = len(description)
        
        # Reservar espacio para título y descripción (son más importantes)
        reserved_space = title_length + description_length
        available_for_content = max(200, 500 - reserved_space)  # Mínimo 200 chars para contenido
        
        # Truncar contenido inteligentemente (por párrafos)
        content_truncated = content
        truncation_applied = False
        
        if len(content) > available_for_content:
            # Intentar cortar por párrafos primero
            paragraphs = content.split('\n\n')
            truncated_content = ""
            
            for paragraph in paragraphs:
                if len(truncated_content + paragraph) <= available_for_content:
                    truncated_content += paragraph + "\n\n"
                else:
                    # Si el párrafo completo no cabe, tomar solo parte
                    remaining_space = available_for_content - len(truncated_content)
                    if remaining_space > 50:  # Solo si queda espacio significativo
                        truncated_content += paragraph[:remaining_space] + "..."
                    break
            
            content_truncated = truncated_content.strip()
            truncation_applied = True
        
        # Realizar análisis con contenido optimizado usando BERT directamente
        result = truth_lens_model.predict(title, content_truncated + " " + description)
        
        if not result or result.get('prediction') == 'Error':
            return jsonify({"error": "No se pudo analizar el contenido extraído"}), 400
        
        # Crear preview del contenido extraído
        preview_parts = []
        if title: preview_parts.append(f"Título: {title[:100]}...")
        if description: preview_parts.append(f"Descripción: {description[:100]}...")
        if content_truncated: preview_parts.append(f"Contenido: {content_truncated[:200]}...")
        
        extracted_preview = " | ".join(preview_parts)

        # Guardar el artículo completo en un archivo para referencia futura
        news_extractor.save_to_file(article_data)
        
        return jsonify({
            "prediction": result['prediction'],
            "label": result['label'],
            "probability": result.get('probability_fake', 0.5),
            "confidence": result.get('confidence', 0.0),
            "url": url,
            "article_data": {
                "title": title,
                "author": author,
                "publish_date": publish_date,
                "description": description,
                "content_length": len(content),
                "content_truncated_length": len(content_truncated),
                "truncation_applied": truncation_applied,
                "images_count": len(article_data.get('images', []))
            },
            "model_info": {
                "type": "BERT",
                "accuracy": "83.05%",
                "f1_score": "0.826",
                "content_optimization": "Contenido limitado a 400-500 chars para BERT" if truncation_applied else "Contenido original usado"
            },
            # 🔍 DIAGNÓSTICO COMPLETO para URLs - Igual que en /predict
            "debug_info": {
                "probability_true": result.get('probability_true', 0.5),
                "probability_fake": result.get('probability_fake', 0.5),
                "raw_prediction": result.get('raw_prediction', -1),
                "threshold_used": result.get('threshold_used', 0.7),
                "confidence_fake": result.get('probability_fake', 0.5),
                "confidence_true": result.get('probability_true', 0.5),
                "bert_says": "Fake" if result.get('raw_prediction') == 1 else "True",
                "final_decision": result['prediction'],
                "title_length": len(title),
                "text_length": len(content_truncated),
                "combined_length": len(title) + len(description) + len(content_truncated),
                "title_preview": title[:50] + "..." if len(title) > 50 else title,
                "text_preview": content_truncated[:100] + "..." if len(content_truncated) > 100 else content_truncated,
                "decision_confidence": result.get('decision_confidence', 'UNKNOWN'),
                "probability_difference": result.get('probability_difference', 0),
                "calibration_applied": result.get('calibration_applied', False),
                "recommendation": get_recommendation(result),
                "extraction_method": "URL Scraping",
                "original_content_length": len(content),
                "truncated_content_length": len(content_truncated),
                "truncation_applied": truncation_applied,
                "optimization_applied": "Smart truncation by paragraphs" if truncation_applied else "No truncation needed"
            },
            "extracted_preview": extracted_preview
        })
        
    except requests.RequestException as e:
        return jsonify({"error": f"Error al acceder a la URL: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"Error al procesar la noticia: {str(e)}"}), 500

@app.route("/diagnose", methods=["POST"])
def diagnose():
    """Endpoint especial para diagnosticar en detalle cómo funciona el modelo"""
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "").strip()
    title = payload.get("title", "")
    
    if not text and not title:
        return jsonify({"error": "Se requiere texto o título para diagnosticar"}), 400
    
    try:
        # Usar la misma lógica que /predict para consistencia
        if not title and text:
            # Si solo hay texto, tratarlo como contenido completo
            title = text[:100] + "..." if len(text) > 100 else text
            
        # Obtener predicción completa usando la MISMA lógica que /predict
        result = truth_lens_model.predict(title, text)
        
        # Análisis adicional
        combined_text = f"{title} {text}".strip()
        text_clean = truth_lens_model.clean_text(combined_text)
        tokens = truth_lens_model.tokenizer.tokenize(text_clean)
        
        # Palabras que podrían estar influyendo
        suspicious_words = ['militar', 'escalada', 'pulverizado', 'cártel', 'droga', 'secreto', 'increíble', 'bomba', 'milagroso', 'oculto', 'truco']
        found_words = [word for word in suspicious_words if word.lower() in text_clean.lower()]
        
        return jsonify({
            "text_analysis": {
                "original_length": len(combined_text),
                "cleaned_length": len(text_clean),
                "num_tokens": len(tokens),
                "tokens_preview": tokens[:20],
                "suspicious_words_found": found_words,
                "title_length": len(title),
                "content_length": len(text)
            },
            "model_response": {
                "raw_probabilities": {
                    "fake": result.get('probability_fake', 0),
                    "true": result.get('probability_true', 0)
                },
                "threshold_used": result.get('threshold_used', 0.7),
                "decision_confidence": result.get('decision_confidence', 'UNKNOWN'),
                "calibration_applied": result.get('calibration_applied', False)
            },
            "final_decision": {
                "prediction": result['prediction'],
                "confidence": result.get('confidence', 0),
                "recommendation": get_recommendation(result)
            },
            "interpretation": {
                "what_bert_thinks": f"BERT cree que es {result.get('probability_fake', 0):.1%} fake",
                "what_we_decided": f"Decidimos: {result['prediction']}",
                "why": f"Usamos umbral {result.get('threshold_used', 0.7):.2f} porque la diferencia de probabilidades es {result.get('probability_difference', 0):.2f}",
                "consistency_check": "✅ CONSISTENTE con endpoint /predict"
            }
        })
    except Exception as e:
        return jsonify({"error": f"Error en diagnóstico: {str(e)}"}), 500

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

    # Realizar predicción con BERT
    try:
        result = truth_lens_model.predict(text, "")
        
        return jsonify({
            "prediction": result['prediction'],
            "label": result['label'],
            "probability": result.get('probability_fake', 0.5),
            "confidence": result.get('confidence', 0.0),
            "text": text,
            "model_info": {
                "type": "BERT",
                "accuracy": "83.05%",
                "f1_score": "0.826"
            },
            # 🔍 DIAGNÓSTICO COMPLETO - Igual que en /predict
            "debug_info": {
                "probability_true": result.get('probability_true', 0.5),
                "probability_fake": result.get('probability_fake', 0.5),
                "raw_prediction": result.get('raw_prediction', -1),
                "threshold_used": result.get('threshold_used', 0.7),
                "confidence_fake": result.get('probability_fake', 0.5),
                "confidence_true": result.get('probability_true', 0.5),
                "bert_says": "Fake" if result.get('raw_prediction') == 1 else "True",
                "final_decision": result['prediction'],
                "title_length": 0,  # OCR no tiene título separado
                "text_length": len(text),
                "combined_length": len(text),
                "title_preview": "",
                "text_preview": text[:100] + "..." if len(text) > 100 else text,
                "decision_confidence": result.get('decision_confidence', 'UNKNOWN'),
                "probability_difference": result.get('probability_difference', 0),
                "calibration_applied": result.get('calibration_applied', False),
                "recommendation": get_recommendation(result),
                "extraction_method": "OCR"
            },
            "extracted_preview": (text[:180] + '...') if len(text) > 180 else text
        })
    except Exception as e:
        return jsonify({"error": f"Error en predicción BERT: {str(e)}"}), 500

# EJECUCIÓN PRINCIPAL
if __name__ == "__main__":
    print("🚀 Iniciando TruthLens Flask App...")
    print(f"🔧 Entorno: {FLASK_ENV}")
    print(f"🐛 Debug: {FLASK_DEBUG}")
    print(f"🤖 Modelo BERT: {BERT_MODEL_PATH}")
    print(f"🔍 OCR API: {'Configurado' if OCR_API_KEY else 'No configurado'}")
    
    app.run(debug=FLASK_DEBUG)