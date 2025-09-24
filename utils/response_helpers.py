"""
Funciones auxiliares para generar respuestas de la API
"""
from utils.recommendations import get_recommendation

def create_debug_info(result, title="", text="", extraction_method="Manual", file_info="", **kwargs):
    """
    Crea la información de debug estándar para todas las rutas
    
    Args:
        result: Resultado del modelo BERT
        title: Título del contenido
        text: Texto del contenido  
        extraction_method: Método de extracción usado
        file_info: Información del archivo (si aplica)
        **kwargs: Campos adicionales específicos por ruta
    
    Returns:
        dict: Diccionario con información de debug
    """
    combined_text = f"{title} {text}".strip()
    
    # Determinar el tipo de separación aplicada
    separation_info = "NO"
    if title and text:
        separation_info = "SÍ"
    elif title and not text:
        separation_info = "Solo título"
    elif not title and text:
        separation_info = "Solo contenido"
    
    debug_data = {
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
        "content_separation": separation_info,
        "has_title": bool(title),
        "has_content": bool(text),
    }
    
    # Agregar file_info solo si existe
    if file_info:
        debug_data["file_info"] = file_info
    
    # Agregar campos adicionales específicos de cada ruta
    debug_data.update(kwargs)
    
    return debug_data

def create_standard_response(result, **response_fields):
    """
    Crea la respuesta estándar común para todas las rutas
    
    Args:
        result: Resultado del modelo BERT
        **response_fields: Campos adicionales para la respuesta
    
    Returns:
        dict: Diccionario con respuesta base
    """
    from config.settings import MODEL_INFO
    
    base_response = {
        "prediction": result['prediction'],
        "label": result['label'],
        "probability": result.get('probability_fake', 0.5),
        "confidence": result.get('confidence', 0.0),
        "model_info": MODEL_INFO,
    }
    
    # Agregar campos adicionales
    base_response.update(response_fields)
    
    return base_response

def create_error_response(error_message, status_code=500):
    """
    Crea una respuesta de error estandarizada
    
    Args:
        error_message: Mensaje de error
        status_code: Código de estado HTTP
    
    Returns:
        tuple: (dict, int) para jsonify
    """
    return {"error": error_message}, status_code
