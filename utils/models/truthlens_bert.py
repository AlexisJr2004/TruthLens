"""
Clase TruthLensBERT para predicción de noticias falsas
"""
import torch
import re
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification

class TruthLensBERT:
    """Modelo BERT entrenado para detectar noticias falsas"""
    
    def __init__(self, model_path):
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
