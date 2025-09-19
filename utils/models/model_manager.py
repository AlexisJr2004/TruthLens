"""
Gestor de modelos con lazy loading
"""
from config.settings import BERT_MODEL_PATH
from utils.models.truthlens_bert import TruthLensBERT
from utils.news_scraper import NewsExtractor

# Variables globales para lazy loading
_truth_lens_model = None
_news_extractor = None

def get_truth_lens_model():
    """Lazy loading del modelo BERT - se carga solo cuando se necesita"""
    global _truth_lens_model
    
    if _truth_lens_model is None:
        print("🚀 Cargando modelo BERT (primera vez)...")
        try:
            _truth_lens_model = TruthLensBERT(BERT_MODEL_PATH)
            print("✅ TruthLens BERT inicializado correctamente")
        except Exception as e:
            print(f"❌ Error inicializando TruthLens BERT: {str(e)}")
            print("⚠️ Verifica que el modelo esté en 'models/truthlens_bert_model/'")
            raise
    
    return _truth_lens_model

def get_news_extractor():
    """Lazy loading del news extractor"""
    global _news_extractor
    
    if _news_extractor is None:
        _news_extractor = NewsExtractor()
        print("✅ NewsExtractor inicializado correctamente")
    
    return _news_extractor
