# IMPORTACIONES Y CONFIGURACIÓN INICIAL
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import requests
import os
import sys

# Configuración
from config.settings import (
    TEMPLATE_FOLDER, STATIC_FOLDER, 
    OCR_API_KEY, OCR_API_URL,
    FLASK_ENV, FLASK_DEBUG, BERT_MODEL_PATH,
    MODEL_INFO
)

# Utilidades modularizadas
from utils.models.model_manager import get_truth_lens_model, get_news_extractor
from utils.file_extractors import extract_text_from_file
from utils.response_helpers import create_debug_info, create_standard_response, create_error_response
from utils.models.update_stats import (
    cargar_stats, guardar_stats, registrar_analisis
)


# CONFIGURACIÓN DE LA APLICACIÓN FLASK
app = Flask(__name__, template_folder=TEMPLATE_FOLDER, static_folder=STATIC_FOLDER)

# RUTAS PRINCIPALES
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
            return jsonify(*create_error_response("Archivo vacío", 400))

        text, error = extract_text_from_file(filename, content)
        if error:
            return jsonify(*create_error_response(error, 400))
            
        # Para archivos: usar las primeras líneas como título, resto como contenido
        lines = text.split('\n')
        # Buscar la primera línea significativa como título
        title = ""
        content_lines = []
        
        for line in lines:
            line_clean = line.strip()
            if not title and line_clean and len(line_clean) > 10:
                title = line_clean[:100]  # Limitar título a 100 chars
            elif title:  # Ya tenemos título, el resto es contenido
                content_lines.append(line_clean)
        
        text = '\n'.join(content_lines)
        
        # Si no se encontró título adecuado, usar el nombre del archivo
        if not title:
            title = f"Documento: {f.filename or 'archivo'}"

    else:
        # 2) Si no hay archivo, intentar JSON {'text': '...', 'title': '...'}
        payload = request.get_json(silent=True) or {}
        text = payload.get("text", "")
        title = payload.get("title", "")
        # Si el usuario no proporciona título, analizamos solo el contenido; Esto evita la duplicación y es más transparente
            
    # Validación
    combined_text = f"{title} {text}".strip()
    if not combined_text or len(combined_text) < 5:
        return jsonify(*create_error_response("No se encontró texto suficiente para analizar", 400))

    # Realizar predicción con BERT usando título y contenido separados
    try:
        result = get_truth_lens_model().predict(title, text)
        # Determinar si la predicción es fake
        es_fake = (result.get('prediction', '').lower() == 'fake')
        # No hay ground truth, así que asumimos correcto si el modelo predice con alta confianza (>0.8)
        es_correcto = result.get('confidence', 0) > 0.8
        registrar_analisis(es_fake, es_correcto)
        # Determinar el tipo de entrada para debug
        is_file_upload = 'file' in request.files
        extraction_method = "Archivo subido" if is_file_upload else "Texto Manual"
        file_info = ""
        if is_file_upload and content:
            f = request.files['file']
            file_size_mb = len(content) / (1024 * 1024)  # Usar content ya leído
            file_info = f"Archivo: {f.filename or 'sin_nombre'} ({file_size_mb:.2f} MB)"
        
        response = create_standard_response(result) # Crear respuesta usando funciones auxiliares
        response["debug_info"] = create_debug_info(
            result, 
            title=title, 
            text=text, 
            extraction_method=extraction_method,
            file_info=file_info
        )
        response["extracted_preview"] = (combined_text[:180] + '...') if combined_text else None
        
        return jsonify(response)
    except Exception as e:
        return jsonify(*create_error_response(f"Error en predicción BERT: {str(e)}", 500))

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
    """Endpoint para analizar una noticia desde una URL"""
    payload = request.get_json(silent=True) or {}
    url = payload.get("url", "").strip()
    
    if not url:
        return jsonify(*create_error_response("Se requiere una URL válida", 400))
    
    # Validar formato básico de URL
    if not (url.startswith('http://') or url.startswith('https://')):
        url = 'https://' + url
    
    try:
        # Extraer contenido usando el scraper
        article_data = get_news_extractor().extract_content(url)
        
        if not article_data:
            return jsonify(*create_error_response("No se pudo extraer el contenido de la URL", 400))
        
        # Obtener los componentes de la noticia
        title = article_data.get('title', '')
        content = article_data.get('content', '')
        description = article_data.get('description', '')
        author = article_data.get('author', '')
        publish_date = article_data.get('publish_date', '')
        
        # Verificar que hay contenido suficiente para analizar
        if not any([title, content, description]) or len(title + content + description) < 20:
            return jsonify(*create_error_response("No se encontró contenido suficiente para analizar en la URL", 400))
        
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
        result = get_truth_lens_model().predict(title, content_truncated + " " + description)
        es_fake = (result.get('prediction', '').lower() == 'fake')
        es_correcto = result.get('confidence', 0) > 0.8
        registrar_analisis(es_fake, es_correcto)
        
        if not result or result.get('prediction') == 'Error':
            return jsonify(*create_error_response("No se pudo analizar el contenido extraído", 400))
        
        # Crear preview del contenido extraído
        preview_parts = []
        if title: preview_parts.append(f"Título: {title[:100]}...")
        if description: preview_parts.append(f"Descripción: {description[:100]}...")
        if content_truncated: preview_parts.append(f"Contenido: {content_truncated[:200]}...")
        
        extracted_preview = " | ".join(preview_parts)

        # Guardar el artículo completo en un archivo para referencia futura
        get_news_extractor().save_to_file(article_data)
        
        response = create_standard_response(result) # Crear respuesta usando funciones auxiliares
        response.update({
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
                **MODEL_INFO,
                "content_optimization": "Contenido limitado a 400-500 chars para BERT" if truncation_applied else "Contenido original usado"
            },
            "extracted_preview": extracted_preview
        })
        
        # Agregar debug_info con campos específicos para URL
        response["debug_info"] = create_debug_info(
            result,
            title=title,
            text=content_truncated,
            extraction_method="URL Scraping",
            # Campos específicos para análisis de URL
            original_content_length=len(content),
            truncated_content_length=len(content_truncated),
            truncation_applied=truncation_applied,
            optimization_applied="Smart truncation by paragraphs" if truncation_applied else "No truncation needed"
        )
        
        return jsonify(response)
        
    except requests.RequestException as e:
        return jsonify(*create_error_response(f"Error al acceder a la URL: {str(e)}", 502))
    except Exception as e:
        return jsonify(*create_error_response(f"Error al procesar la noticia: {str(e)}", 500))

@app.route("/ocr_predict", methods=["POST"])
def ocr_predict():
    """Endpoint para procesar imágenes con OCR y predecir"""
    if 'image' not in request.files:
        return jsonify(*create_error_response("No se encontró la imagen", 400))
        
    f = request.files['image']
    content = f.read()
    
    if not content:
        return jsonify(*create_error_response("Imagen vacía", 400))

    # Procesar con OCR
    try:
        ocr = requests.post(OCR_API_URL, 
                           files={'file': (f.filename or 'image.jpg', content)},
                           data={'apikey': OCR_API_KEY, 
                                 'language': 'spa', 
                                 'isOverlayRequired': False}, 
                           timeout=30)
    except requests.RequestException as e:
        return jsonify(*create_error_response(f"Fallo OCR: {str(e)}", 502))
        
    if ocr.status_code != 200:
        return jsonify(*create_error_response(f"OCR.space devolvió {ocr.status_code}", 502))
        
    data = ocr.json()
    results = data.get('ParsedResults') or []
    text = (results[0].get('ParsedText') or '').strip() if results else ''
    
    if not text:
        return jsonify(*create_error_response("No se detectó texto en la imagen", 400))

    # Realizar predicción con BERT
    try:
        result = get_truth_lens_model().predict(text, "")
        es_fake = (result.get('prediction', '').lower() == 'fake')
        es_correcto = result.get('confidence', 0) > 0.8
        registrar_analisis(es_fake, es_correcto)
        
        # Crear respuesta usando funciones auxiliares
        response = create_standard_response(result)
        response.update({
            "text": text,
            "extracted_preview": (text[:180] + '...') if len(text) > 180 else text
        })
        
        # Agregar debug_info específico para OCR
        response["debug_info"] = create_debug_info(
            result,
            title="",  # OCR no tiene título separado
            text=text,
            extraction_method="OCR"
        )
        
        return jsonify(response)
    except Exception as e:
        return jsonify(*create_error_response(f"Error en predicción BERT: {str(e)}", 500))

# Ruta principal con stats
@app.route('/stats', methods=['GET'])
def get_stats():
    caller = request.args.get('caller', 'unknown')
    
    print(f"Fetching stats for /stats endpoint... Caller: {caller}")
    """Endpoint para obtener estadísticas en formato JSON"""
    stats = cargar_stats()
    hoy = datetime.now().strftime('%Y-%m-%d')
    return jsonify({
        'total_analisis': stats.get('total_analisis', 0),
        'analisis_hoy': stats.get('analisis_diarios', {}).get(hoy, 0),
        'total_fakes': stats.get('total_fakes', 0),
        'fakes_hoy': stats.get('fakes_diarios', {}).get(hoy, 0)
    })

# EJECUCIÓN PRINCIPAL
if __name__ == "__main__":
    # Evitar mensajes duplicados en el reloader de Flask
    import sys
    
    # Solo mostrar mensajes en el proceso principal, no en el reloader
    if not ('--reload' in sys.argv or os.environ.get('WERKZEUG_RUN_MAIN') == 'true'):
        print("🚀 Iniciando TruthLens Flask App...")
        print(f"🔧 Entorno: {FLASK_ENV}")
        print(f"🐛 Debug: {FLASK_DEBUG}")
        print(f"🤖 Modelo BERT: {BERT_MODEL_PATH}")
        print(f"🔍 OCR API: {'Configurado' if OCR_API_KEY else 'No configurado'}")
        print("⚡ Lazy loading habilitado - El modelo se cargará al primer uso")
    
    app.run(debug=FLASK_DEBUG)