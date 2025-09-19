"""
Configuración centralizada para TruthLens
"""

import os
from dotenv import load_dotenv

load_dotenv() # Cargar variables de entorno desde .env

# CONFIGURACIÓN DEL MODELO BERT
BERT_MODEL_PATH = os.getenv("BERT_MODEL_PATH", os.path.join("models", "truthlens_bert_model"))

# CONFIGURACIÓN OCR.SPACE API
OCR_API_KEY = os.getenv("OCR_SPACE_API_KEY")
OCR_API_URL = os.getenv("OCR_API_URL")

# CONFIGURACIÓN FLASK
FLASK_ENV = os.getenv("FLASK_ENV", "development")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"

# CONFIGURACIÓN DE TEMPLATES Y STATIC
TEMPLATE_FOLDER = "src/templates"
STATIC_FOLDER = "src/static"

# INFORMACIÓN DEL MODELO
MODEL_INFO = {
    "type": "BERT",
    "accuracy": "83.05%",
    "f1_score": "0.826"
}
