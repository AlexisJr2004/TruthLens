# TruthLens: Verificador Inteligente de Noticias

Aplicación web con Flask + Frontend moderno para analizar noticias y detectar posible desinformación usando un modelo de Machine Learning entrenado. Incluye análisis de texto, subida de archivos (PDF/DOCX/TXT), OCR para imágenes, entrada por voz, modo oscuro, efectos visuales y un panel con historial reciente.

**¡NUEVO!**  
Ahora TruthLens utiliza un modelo BERT propio para español, con arquitectura modular, endpoints avanzados y análisis exploratorio de datos.

- Backend: [app.py](app.py) (Flask, BERT, endpoints avanzados)
- Exploratorio: [exploratory_data_analysis.py](exploratory_data_analysis.py) (EDA automático)
- Configuración: [config/settings.py](config/settings.py)
- Utilidades: [utils/](utils/) (extracción, scraping, helpers, recomendaciones, stats)
- Modelos: [models/truthlens_bert_model/](models/truthlens_bert_model/) (BERT fine-tuned)
- Frontend: [src/templates/index.html](src/templates/index.html), [src/static/main.js](src/static/main.js), [src/static/style.css](src/static/style.css)

---

## Características

- Análisis de noticias (texto libre, archivo, imagen con OCR y URL).
- **Modelo BERT fine-tuned** para español.
- Interfaz moderna con:
  - Modo oscuro y efectos “glass/neon”.
  - Pantalla de precarga con animación.
  - Partículas animadas de fondo.
  - Medidor de confianza y tarjeta de resultados.
  - Entrada por voz (Web Speech API).
  - Historial reciente y estadísticas en tiempo real.
  - Diseño responsive con barra lateral móvil.
- Extracción de texto:
  - PDF (PyPDF2), DOCX (python-docx), TXT.
  - Imágenes vía OCR.space (requiere API key).
  - Scraping inteligente de URLs.
- Modularización: código organizado en módulos para modelos, extracción, helpers y recomendaciones.
- **Análisis exploratorio**: script dedicado para EDA con generación automática de reportes y gráficos.

---

## Estructura del Proyecto

```
.
├── app.py                      # API Flask principal (BERT, endpoints, OCR, URL)
├── exploratory_data_analysis.py # Script EDA para datasets
├── config/
│   └── settings.py             # Configuración global (paths, API keys, modelo)
├── utils/
│   ├── file_extractors.py      # Extracción de texto de archivos
│   ├── news_scraper.py         # Scraper de noticias por URL
│   ├── response_helpers.py     # Helpers para respuestas JSON
│   ├── recommendations.py      # Sugerencias y recomendaciones
│   └── models/
│       ├── model_manager.py    # Carga y gestión del modelo BERT
│       ├── truthlens_bert.py   # Lógica de predicción BERT
│       └── update_stats.py     # Estadísticas de uso
├── models/
│   └── truthlens_bert_model/   # Artefactos del modelo BERT (config, tokenizer, pesos)
├── data/
│   ├── train.xlsx
│   ├── development.xlsx
│   └── eda_outputs/            # Reportes y gráficos generados por EDA
├── src/
│   ├── static/                 # JS, CSS, imágenes
│   └── templates/              # HTML principal
└── requirements.txt
```

---

## Requisitos

- Python 3.9+ recomendado
- Dependencias principales (ver [requirements.txt](requirements.txt)):
  - Flask
  - pandas
  - numpy
  - scikit-learn
  - PyPDF2
  - python-docx
  - wordcloud
  - matplotlib
  - seaborn
  - transformers (para BERT)
  - requests

---

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd TruthLens
pip install -r requirements.txt
```

Configura tu API key de OCR (opcional):

- Linux/macOS:
  ```bash
  export OCR_SPACE_API_KEY="TU_API_KEY"
  ```
- Windows (PowerShell):
  ```powershell
  $env:OCR_SPACE_API_KEY="TU_API_KEY"
  ```

---

## Conjunto de Datos

Archivos principales:  
- [data/train.xlsx](data/train.xlsx)  
- [data/development.xlsx](data/development.xlsx)

Columnas esperadas:
```
Headline,Text,Category
"Titular","Cuerpo de la noticia","Fake"|"Real"
```

---

## Entrenamiento y Modelo

- El modelo BERT se encuentra en `models/truthlens_bert_model/`.
- Para reentrenar o analizar datos, usa `exploratory_data_analysis.py` y adapta el pipeline según tus necesidades.

---

## Ejecutar la Aplicación

Asegúrate de tener el modelo BERT en `models/truthlens_bert_model/`. Luego:

```bash
python app.py
```

Abre [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## API

**Endpoints principales:**

- `POST /predict`
  - Analiza texto o archivo (PDF/DOCX/TXT).
  - JSON:
    ```json
    { "text": "Contenido a analizar", "title": "Opcional" }
    ```
  - o multipart/form-data con campo `file`.
  - Respuesta:
    ```json
    {
      "prediction": "Fake" | "Real",
      "confidence": 0.0-1.0,
      "debug_info": {...},
      "extracted_preview": "..."
    }
    ```

- `POST /analyze_url`
  - Analiza una noticia desde una URL.
  - JSON:
    ```json
    { "url": "https://..." }
    ```
  - Respuesta: igual a `/predict`, incluye metadatos del artículo.

- `POST /ocr_predict`
  - Analiza imagen (PNG/JPG/JPEG) vía OCR.
  - multipart/form-data con campo `image`.
  - Respuesta: igual a `/predict`, incluye texto extraído.

- `GET /stats`
  - Devuelve estadísticas de uso (total de análisis, fakes, etc.).

---

## Análisis Exploratorio

Ejecuta:

```bash
python exploratory_data_analysis.py
```

Genera reportes y gráficos en `data/eda_outputs/`.

---

## Frontend

- HTML: `src/templates/index.html`
- JS/CSS: `src/static/`
- Incluye lógica para modo oscuro, partículas, entrada por voz, historial y visualización de resultados.

---

## Roadmap

- Persistencia del historial y estadísticas.
- Mejoras en el pipeline NLP y comparativa de modelos.
- Despliegue cloud y CI/CD.
- Tests unitarios y de integración.

---

## Contribuciones

¡Bienvenidas! Abre un issue o PR.

---

## Licencia

MIT. Consulta `LICENSE` si está disponible en el repositorio.