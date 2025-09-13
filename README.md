# TruthLens: Verificador Inteligente de Noticias

Aplicación web con Flask + Frontend moderno para analizar noticias y detectar posible desinformación usando un modelo de Machine Learning entrenado. Incluye análisis de texto, subida de archivos (PDF/DOCX/TXT), OCR para imágenes, entrada por voz, modo oscuro, efectos visuales y un panel con historial reciente.

- Backend: [app.py](app.py) (Flask)
- Entrenamiento: [train.py](train.py) (scikit-learn + TF‑IDF)
- Frontend: [templates/index.html](templates/index.html), [static/main.js](static/main.js), [static/style.css](static/style.css)
- Modelos: [models/fake_news_model.pkl](models/fake_news_model.pkl), [models/vectorizer.pkl](models/vectorizer.pkl)

---

## Características

- Análisis de noticias (texto libre, archivo o imagen con OCR).
- Modelo Random Forest optimizado con GridSearchCV sobre TF‑IDF.
- Interfaz moderna con:
  - Modo oscuro y efectos “glass/neon”.
  - Pantalla de precarga con animación.
  - Partículas animadas de fondo.
  - Medidor de confianza y tarjeta de resultados.
  - Entrada por voz (Web Speech API).
  - Historial reciente (no persistente) y acciones rápidas.
  - Diseño responsive con barra lateral móvil.
- Extracción de texto:
  - PDF (PyPDF2), DOCX (python-docx), TXT (varias codificaciones).
  - Imágenes vía OCR.space (requiere API key).

---

## Estructura del Proyecto

```
.
├── app.py                # API Flask para predicciones y OCR
├── train.py              # Entrenamiento del modelo (TF-IDF + RandomForest + GridSearchCV)
├── train.csv             # Conjunto de datos de entrenamiento (ver formato abajo)
├── models/               # Artefactos del modelo
│   ├── fake_news_model.pkl
│   └── vectorizer.pkl
├── templates/
│   └── index.html        # UI principal
├── static/
│   ├── style.css         # Estilos (modo oscuro, glass, preloader, partículas)
│   ├── main.js           # Lógica de UI (voz, OCR, historial, análisis)
│   └── img/
│       ├── carga.gif     # Loader del preloader
│       └── logo.png      # Favicon/logo
└── requirements.txt
```

---

## Requisitos

- Python 3.9+ recomendado
- Dependencias (ver [requirements.txt](requirements.txt)):
  - Flask==2.2.5
  - pandas==2.1.2
  - joblib==1.3.2
  - numpy==1.26.4
  - scikit-learn==1.2.2
  - PyPDF2==3.0.1
  - python-docx==1.1.2

---

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd fake-news-projec
pip install -r requirements.txt
```

Configura tu API key de OCR (opcional, solo si usarás análisis de imágenes):

- Linux/macOS:
  ```bash
  export OCR_SPACE_API_KEY="TU_API_KEY"
  ```
- Windows (PowerShell):
  ```powershell
  $env:OCR_SPACE_API_KEY="TU_API_KEY"
  ```

Si no estableces la variable, se usará el valor por defecto definido en [app.py](app.py).

---

## Conjunto de Datos

Archivo: [train.csv](train.csv) con columnas:

```
title,text,label
"Titular","Cuerpo de la noticia",1
```

- title: Título de la noticia.
- text: Contenido de la noticia.
- label: 1 = contenido sospechoso (fake), 0 = contenido confiable.

Nota: El preprocesamiento preserva tildes y eñes y elimina URLs/caracteres no alfabéticos. Ver [`clean_text`](train.py).

---

## Entrenamiento del Modelo

Ejecuta:

```bash
python train.py
```

Qué hace [train.py](train.py):

- Limpia el texto con [`clean_text`](train.py).
- Une título + texto si existe columna title.
- Vectoriza con `TfidfVectorizer` (max_features=20000, stop_words='english').
- Optimiza un `RandomForestClassifier` con `GridSearchCV` (F1-score, cv=3).
- Guarda:
  - Modelo: [models/fake_news_model.pkl](models/fake_news_model.pkl)
  - Vectorizador: [models/vectorizer.pkl](models/vectorizer.pkl)

Se imprime el reporte de clasificación sobre el conjunto de test.

---

## Ejecutar la Aplicación

Asegúrate de tener [models/fake_news_model.pkl](models/fake_news_model.pkl) y [models/vectorizer.pkl](models/vectorizer.pkl). Luego:

```bash
python app.py
```

Abre http://127.0.0.1:5000

Si los modelos no existen, [app.py](app.py) mostrará un error indicando que ejecutes `train.py`.

---

## API

Backend: [app.py](app.py)

- POST /predict
  - JSON:
    ```json
    {
      "text": "Contenido a analizar"
    }
    ```
  - o multipart/form-data con campo file (PDF/DOCX/TXT).
  - Respuesta:
    ```json
    {
      "prediction": "Fake" | "Real",
      "label": 1 | 0,
      "probability": 0.0-1.0,
      "extracted_preview": "Primeros 180 caracteres..."
    }
    ```

- POST /ocr_predict
  - multipart/form-data con campo image (PNG/JPG/JPEG).
  - Usa OCR.space con `OCR_SPACE_API_KEY`.
  - Respuesta:
    ```json
    {
      "prediction": "Fake" | "Real",
      "label": 1 | 0,
      "probability": 0.0-1.0,
      "text": "Texto extraído por OCR",
      "extracted_preview": "Primeros 180 caracteres..."
    }
    ```

Predicción interna: [`perform_prediction`](app.py) aplica [`clean_text`](app.py), vectoriza con el TF‑IDF cargado y usa `predict`/`predict_proba` del modelo.

---

## Frontend

- HTML principal: [templates/index.html](templates/index.html)
- Estilos y efectos: [static/style.css](static/style.css)
  - Modo oscuro (clase `html.dark`), efectos glass/neon, partículas, preloader.
- Lógica UI: [static/main.js](static/main.js)
  - Inicialización: [`initializeApplication`](static/main.js) crea partículas, barra lateral móvil, contador de caracteres, botones, modos de entrada y preloader.
  - Análisis: [`analyzeText`](static/main.js) llama a `/predict` o `/ocr_predict` según el modo (texto/archivo/imagen) y muestra resultados con [`displayResults`](static/main.js).
  - Modos de entrada: texto, archivo (PDF/DOCX/TXT) y imagen (OCR). Gestión con [`initializeFileMode`](static/main.js).
  - Entrada por voz: [`initializeVoiceInput`](static/main.js) (Web Speech API, Chrome recomendado).
  - Historial: [`addToHistory`](static/main.js) renderiza hasta 15 entradas (no persistente).
  - UI:
    - Preloader con [static/img/carga.gif](static/img/carga.gif).
    - Medidor de confianza y badges por umbrales configurables.
    - Contador de caracteres (avisos a partir de 6.000/8.000; límite visual ~10.000).

Sugerencia: para el toggle de modo oscuro, asegúrate de incluir un `<input type="checkbox" id="dark-mode-toggle" />` dentro del label de la barra superior si deseas el cambio manual (la lógica ya está en [`static/main.js`](static/main.js)).

---

## Ejemplos rápidos (cURL)

- Texto:
  ```bash
  curl -X POST http://127.0.0.1:5000/predict \
    -H "Content-Type: application/json" \
    -d '{"text":"Ejemplo de noticia para analizar"}'
  ```

- Archivo:
  ```bash
  curl -X POST http://127.0.0.1:5000/predict \
    -F "file=@/ruta/a/archivo.pdf"
  ```

- Imagen (OCR):
  ```bash
  curl -X POST http://127.0.0.1:5000/ocr_predict \
    -F "image=@/ruta/a/imagen.jpg"
  ```

---

## Configuración

- Variables de entorno:
  - `OCR_SPACE_API_KEY`: API key para OCR.space (requerida para /ocr_predict).
- Puertos/Debug: modificar en [app.py](app.py) si es necesario (`app.run(debug=True)`).

---

## Problemas comunes

- “Asegúrate de haber ejecutado train.py…”: ejecuta `python train.py` para generar los artefactos en [models/](models/).
- OCR falla: revisa conectividad, API key y tamaño/formato de la imagen.
- Voz no disponible: el navegador no soporta Web Speech API (usa Chrome).
- Límite de caracteres: la UI muestra avisos a partir de 6k/8k y un límite visual de ~10k.
- Arrastrar/soltar archivos: la UI guía a usar el selector (limitación de seguridad del navegador).

---

## Roadmap (Mejoras futuras)

- Persistencia del historial (localStorage/servidor).
- Afinar stopwords en español y mejoras de NLP.
- Comparativa de múltiples modelos (LR, SVM, etc.).
- Despliegue en la nube y CI/CD.
- Tests unitarios y de integración.

---

## Contribuciones

¡Bienvenidas! Abre un issue o PR.

---

## Licencia

MIT. Consulta `LICENSE` si está disponible en el repositorio.
