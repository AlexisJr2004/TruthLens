# TruthLens: Verificador Inteligente de Noticias

## Descripción
TruthLens es una aplicación que utiliza inteligencia artificial para analizar noticias y determinar si son verdaderas o falsas. El proyecto combina un modelo de Machine Learning entrenado con datos reales y una interfaz de usuario intuitiva para ofrecer análisis rápidos y precisos.

---

## Características
- **Análisis de noticias falsas y verdaderas**: Detecta contenido falso con alta precisión.
- **Interfaz amigable**: Permite a los usuarios ingresar noticias y obtener resultados instantáneos.
- **Modelo optimizado**: Utiliza Random Forest con hiperparámetros ajustados.
- **Historial de análisis**: Guarda los últimos análisis realizados.

---

## Estructura del Proyecto
```
.
├── app.py                # API Flask para predicciones
├── train.py              # Script para entrenar el modelo
├── train.csv             # Conjunto de datos de entrenamiento
├── models/               # Modelos entrenados y vectorizador
│   ├── fake_news_model.pkl
│   └── vectorizer.pkl
├── templates/            # Archivos HTML
│   └── index.html
├── static/               # Archivos estáticos (CSS, JS, imágenes)
│   ├── style.css
│   ├── main.js
│   └── img/
│       └── logo.png
└── README.md             # Documentación del proyecto
```

---

## Instalación
1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   ```
2. Navega al directorio del proyecto:
   ```bash
   cd fake-news-projec
   ```
3. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```

---

## Uso
### Entrenar el Modelo
1. Asegúrate de que el archivo `train.csv` contiene datos válidos.
2. Ejecuta el script de entrenamiento:
   ```bash
   python train.py
   ```
3. Los modelos entrenados se guardarán en la carpeta `models/`.

### Ejecutar la Aplicación
1. Inicia el servidor Flask:
   ```bash
   python app.py
   ```
2. Abre tu navegador y ve a `http://127.0.0.1:5000`.
3. Ingresa una noticia en el área de texto y haz clic en "Analizar" para obtener los resultados.

---

## Conjunto de Datos
El archivo `train.csv` contiene ejemplos de noticias falsas y verdaderas con el siguiente formato:
```
title,text,label
"Noticia falsa","El gobierno ha prohibido el uso de internet",0
"Noticia verdadera","Se ha descubierto una nueva vacuna contra el virus",1
```
- **title**: Título de la noticia.
- **text**: Contenido de la noticia.
- **label**: Etiqueta (0 para noticias falsas, 1 para noticias verdaderas).

---

## Tecnologías Utilizadas
- **Python**: Lenguaje principal.
- **Flask**: Framework para la API.
- **Scikit-learn**: Entrenamiento y evaluación del modelo.
- **HTML, CSS, JavaScript**: Interfaz de usuario.

---

## Mejoras Futuras
- Ampliar el conjunto de datos con más ejemplos variados.
- Implementar más algoritmos de Machine Learning para comparar resultados.
- Desplegar la aplicación en un servidor en la nube.

---

## Contribuciones
¡Las contribuciones son bienvenidas! Si deseas mejorar este proyecto, por favor abre un issue o envía un pull request.

---

## Licencia
Este proyecto está bajo la Licencia MIT. Puedes consultar el archivo `LICENSE` para más detalles.
