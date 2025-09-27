# 🔍 TruthLens
### Sistema Inteligente de Verificación de Noticias con BERT

<div align="center">
  <img src="src/static/img/logo.png" alt="TruthLens Logo" width="200">
</div>

**TruthLens** es una aplicación web avanzada que utiliza inteligencia artificial para detectar noticias falsas en tiempo real. Desarrollado con un modelo BERT ajustado finamente para el español, ofrece análisis local, privado y confiable de contenido noticioso.

---

## 🌟 Características Principales

- **Modelo BERT Personalizado**: Fine-tuned específicamente para noticias en español
- **Procesamiento 100% Local**: Sin envío de datos a servicios externos
- **Interfaz Moderna**: Web app responsive con dark mode
- **Múltiples Formatos**: Análisis de texto, PDF, DOCX, TXT y URLs
- **OCR Opcional**: Extracción de texto desde imágenes
- **Métricas en Tiempo Real**: Estadísticas de uso y precisión
- **Alta Precisión**: 83.05% de accuracy con F1-score de 0.826

---

## 🏗️ Arquitectura del Proyecto

```
TruthLens/
├── app.py                    # Aplicación Flask principal
├── exploratory_data_analysis.py  # Script EDA completo
├── requirements.txt          # Dependencias Python
├── config/
│   ├── settings.py             # Configuración centralizada
│   └── __init__.py
├── data/
│   ├── train.xlsx              # Dataset de entrenamiento
│   └── development.xlsx        # Dataset de validación
├── models/                  # Directorio del modelo BERT (crear después del entrenamiento)
│   └── truthlens_bert_model/   # Modelo entrenado
│       ├── config.json
│       ├── model.safetensors
│       ├── tokenizer.json
│       └── vocab.txt
├── src/
│   ├── static/
│   │   ├── style.css        # Estilos personalizados
│   │   ├── main.js          # Lógica principal frontend
│   │   ├── chatbot.js       # Sistema de recomendaciones
│   │   ├── reportPDF.js     # Generación de reportes
│   │   ├── stats_analisis.json  # Estadísticas de uso
│   │   ├── examples.json    # Ejemplos predefinidos
│   │   └── img/
│   │       ├── logo.png
│   │       └── carga.gif
│   └── templates/
│       └── index.html       # Interfaz principal
├── utils/
│   ├── file_extractors.py   # Extracción de texto de archivos
│   ├── news_scraper.py      # Web scraping de noticias
│   ├── recommendations.py   # Sistema de recomendaciones
│   ├── response_helpers.py  # Utilidades de respuesta API
│   └── models/
│       ├── model_manager.py    # Gestión lazy loading de modelos
│       ├── truthlens_bert.py   # Clase del modelo BERT
│       └── update_stats.py     # Actualización de estadísticas
├── temp/                   # Archivos temporales (auto-generado)
│   └── news_content_*.json     # Cache de contenido web
├── .env                     # Variables de entorno (crear desde .env.example)
├── .env.example            # Plantilla de configuración
└── .gitignore              # Archivos ignorados por Git
```

---

## 🚀 Instalación y Configuración

### 1. **Prerrequisitos**
```bash
# Python 3.8+ requerido
python --version

# Git (para clonar el repositorio)
git --version
```

### 2. **Clonar el Repositorio**
```bash
git clone https://github.com/AlexisJr2004/TruthLens.git
cd TruthLens
```

### 3. **Crear Entorno Virtual**
```bash
# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate
```

### 4. **Instalar Dependencias**
```bash
pip install -r requirements.txt
```

### 5. **Configurar Variables de Entorno**
```bash
# Copiar plantilla de configuración
cp .env.example .env

# Editar .env con tus configuraciones
# Para OCR (opcional):
OCR_SPACE_API_KEY=tu_api_key_de_ocr_space
```

### 6. **Entrenar el Modelo BERT** ⚠️ **IMPORTANTE**

El modelo BERT no se incluye en el repositorio debido a su tamaño. Debes entrenarlo:

#### **Google Colab**
1. Abrir el notebook en Colab: [TruthLens Notebook](https://drive.google.com/file/d/1eE9YHX5G1UZrKkH2aF5sES2vAcgZsXjf/view?usp=sharing)
2. Seguir las instrucciones del notebook
3. Descargar el modelo entrenado
4. Extraer en `models/truthlens_bert_model/`

### 7. **Crear Estructura de Modelos**
```bash
# Crear directorio de modelos
mkdir -p models/truthlens_bert_model

# Extraer modelo entrenado aquí
# La estructura debe ser:
# models/truthlens_bert_model/
# ├── config.json
# ├── model.safetensors
# ├── tokenizer.json
# ├── tokenizer_config.json
# ├── special_tokens_map.json
# ├── vocab.txt
# └── model_summary.json
```

---

## 🎮 Uso del Sistema

### **Iniciar la Aplicación**
```bash
# Ejecutar aplicación
python app.py

# Acceder en el navegador
# http://localhost:5000
```

### **Métodos de Análisis**

#### 1. **Análisis de Texto Libre**
- Pegar contenido directamente en el área de texto
- Incluir título y contenido para mejor precisión

#### 2. **Análisis de Archivos**
- Formatos soportados: PDF, DOCX, TXT
- Arrastrar y soltar o seleccionar archivo
- Extracción automática de texto

#### 3. **Análisis de URLs**
- Introducir enlace de noticia
- Scraping inteligente del contenido
- Análisis optimizado para BERT

#### 4. **Análisis de Imágenes (OCR)**
- Subir imagen con texto de noticia
- Requiere API key de OCR.space
- Extracción automática de texto

---

## 📊 Análisis Exploratorio de Datos (EDA)

### **Ejecutar Análisis Completo**
```bash
# Análisis automático de datasets
python exploratory_data_analysis.py

# Resultados en:
# data/eda_outputs/
# ├── eda_report_YYYYMMDD_HHMMSS.txt
# ├── distribuciones_entrenamiento.png
# ├── distribuciones_desarrollo.png
# ├── analisis_categorico_entrenamiento.png
# ├── analisis_categorico_desarrollo.png
# ├── wordclouds_entrenamiento.png
# └── wordclouds_desarrollo.png
```

### **Métricas del Dataset**
- **Total de muestras**: 971 (676 train + 295 dev)
- **Balance de clases**: 50/50 True/Fake
- **Idioma**: Español
- **Promedio de palabras**: ~400 palabras por artículo

---

## 📈 Rendimiento del Modelo

### **Métricas de Evaluación**

| Métrica | Valor | Descripción |
|---------|-------|-------------|
| **Accuracy** | 83.05% | Precisión general del modelo |
| **F1-Score** | 0.826 | Balance entre precisión y recall |
| **Precisión (True)** | 85.2% | Detección correcta de noticias verdaderas |
| **Precisión (Fake)** | 80.9% | Detección correcta de noticias falsas |
| **Recall (True)** | 82.1% | Cobertura de noticias verdaderas |
| **Recall (Fake)** | 84.2% | Cobertura de noticias falsas |

### **Calibración Inteligente**

El sistema implementa calibración adaptativa:
- **Alta Confianza** (diff > 0.5): Umbral conservador (0.65)
- **Confianza Media** (diff 0.3-0.5): Umbral moderado (0.75)
- **Baja Confianza** (diff < 0.3): Umbral estricto (0.85)

---

## 🔒 Privacidad y Seguridad

### **Procesamiento Local**
- ✅ Modelo BERT ejecutado localmente
- ✅ Sin envío de datos a terceros
- ✅ Análisis offline disponible
- ⚠️ OCR requiere servicio externo (opcional)

### **Datos Temporales**
- Archivos temporales en `/temp/`
- Auto-limpieza periódica
- Sin almacenamiento permanente de contenido usuario

---

## 🛠️ Configuración Avanzada

### **Variables de Entorno (.env)**
```bash
# Flask Configuration
FLASK_ENV=development          # development | production
FLASK_DEBUG=True              # True | False

# Model Configuration
BERT_MODEL_PATH=models/truthlens_bert_model

# OCR Configuration (opcional)
OCR_SPACE_API_KEY=tu_api_key
OCR_API_URL=https://api.ocr.space/parse/image
```

---

## 📚 Documentación Técnica

### **Arquitectura del Modelo**
- **Base**: `dccuchile/bert-base-spanish-wwm-uncased`
- **Capas**: 12 transformer layers
- **Parámetros**: ~110M parámetros
- **Vocabulario**: 31,002 tokens en español
- **Secuencia máxima**: 512 tokens

### **Pipeline de Procesamiento**
1. **Limpieza de texto**: Eliminación de URLs, caracteres especiales
2. **Tokenización**: BERT tokenizer con padding/truncating
3. **Inferencia**: Forward pass del modelo
4. **Calibración**: Ajuste dinámico de umbral
5. **Respuesta**: Formato JSON con metadatos

### **Optimizaciones Implementadas**
- Lazy loading del modelo
- Cacheo en memoria
- Selección automática GPU/CPU
- Procesamiento por lotes (batch processing)
- Truncado inteligente por párrafos

---

## 📖 Referencias y Dataset

### **Dataset Original**
- **Fuente**: [FakeNewsCorpusSpanish](https://github.com/jpposadas/FakeNewsCorpusSpanish)
- **Autor**: Posadas-Durán et al. (2019)
- **Licencia**: Académica/Investigación
- **Idioma**: Español

### **Modelo Base**
- **BERT Español**: `dccuchile/bert-base-spanish-wwm-uncased`
- **Desarrollado por**: Universidad de Chile
- **Pre-entrenado en**: Corpus masivo en español

### **Tecnologías Clave**
- **Framework ML**: PyTorch, Transformers (Hugging Face)
- **Web Framework**: Flask
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Análisis de Datos**: Pandas, Matplotlib, Seaborn
- **Scraping**: BeautifulSoup4, Requests
- **OCR**: OCR.space API

---

## 📄 Licencia y Términos de Uso

### **Uso Académico y Educativo**
Este proyecto está diseñado principalmente para:
- Investigación académica en NLP
- Educación en IA y detección de desinformación
- Desarrollo de herramientas de verificación

### **Limitaciones**
- No garantiza 100% de precisión
- Requiere validación humana para decisiones críticas
- Optimizado para noticias en español
- Dataset de entrenamiento limitado

### **Responsabilidad**
Los usuarios son responsables de:
- Verificar resultados independientemente
- No usar como única fuente de verdad
- Respetar derechos de autor del contenido analizado

---

## 👥 Créditos y Reconocimientos

### **Desarrollado por**
- **TruthLens Team** - Desarrollo principal
- **Posadas-Durán et al.** - Dataset original
- **Hugging Face** - Framework Transformers
- **Universidad de Chile** - Modelo BERT base

### **Contribuciones Especiales**
- Comunidad de investigadores en NLP español
- Desarrolladores de bibliotecas open source utilizadas
- Beta testers y usuarios que proporcionaron feedback

---

## 📞 Soporte y Contacto

### **Comunidad y Contribuciones**
- 🐛 **Issues**: Reportar bugs y solicitar características
- 🔄 **Pull Requests**: Contribuciones de código
- 💡 **Discussions**: Ideas y mejoras generales
- 📧 **Email**: snietod@unemi.edu.ec

---

**¿Listo para detectar fake news con IA? ¡Empieza instalando TruthLens!** 🚀

```bash
git clone https://github.com/AlexisJr2004/TruthLens.git
cd TruthLens
pip install -r requirements.txt
python app.py
```

*Desarrollado con ❤️ para combatir la desinformación*
