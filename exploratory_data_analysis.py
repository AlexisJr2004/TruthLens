"""
Script completo para analizar datasets antes del entrenamiento del modelo.
Adaptado para entorno local con guardado automático de reportes y gráficos.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud
import re
from collections import Counter
import warnings
import os
from datetime import datetime
warnings.filterwarnings('ignore')

# Configuración para entorno local
plt.style.use('default')
sns.set_palette("husl")
plt.rcParams['figure.dpi'] = 100
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['savefig.bbox'] = 'tight'

# Crear directorio de salida
OUTPUT_DIR = "data/eda_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Archivo de reporte
REPORT_FILE = os.path.join(OUTPUT_DIR, f"eda_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

def write_to_report(text):
    """Escribe texto al archivo de reporte"""
    with open(REPORT_FILE, 'a', encoding='utf-8') as f:
        f.write(text + '\n')
    print(text)

def load_and_basic_info(file_path, dataset_name):
    """Carga dataset y muestra información básica"""
    header_text = f"\n{'='*60}\n📊 ANÁLISIS DE {dataset_name.upper()}\n{'='*60}"
    write_to_report(header_text)
    
    df = pd.read_excel(file_path).fillna("")
    
    info_text = [
        f"📁 Archivo: {file_path}",
        f"📏 Dimensiones: {df.shape[0]} filas x {df.shape[1]} columnas",
        f"💾 Memoria: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB",
        f"\n📋 Información de columnas:"
    ]
    
    for line in info_text:
        write_to_report(line)
    
    for col in df.columns:
        non_empty = (df[col].astype(str) != '').sum()
        col_info = f"  • {col}: {non_empty}/{len(df)} valores no vacíos ({non_empty/len(df)*100:.1f}%)"
        write_to_report(col_info)
    
    write_to_report(f"\n🏷️ Distribución de categorías:")
    category_dist = df['Category'].value_counts()
    write_to_report(str(category_dist))
    balance_info = f"Balance: {category_dist.min()/category_dist.max()*100:.1f}%"
    write_to_report(balance_info)
    
    return df

def analyze_text_statistics(df, dataset_name):
    """Analiza estadísticas de texto"""
    header_text = f"\n📝 ESTADÍSTICAS DE TEXTO - {dataset_name}\n{'-' * 50}"
    write_to_report(header_text)
    
    # Longitudes de texto
    df['headline_length'] = df['Headline'].astype(str).str.len()
    df['text_length'] = df['Text'].astype(str).str.len()
    df['total_length'] = df['headline_length'] + df['text_length']
    
    # Conteo de palabras
    df['headline_words'] = df['Headline'].astype(str).apply(lambda x: len(x.split()))
    df['text_words'] = df['Text'].astype(str).apply(lambda x: len(x.split()))
    df['total_words'] = df['headline_words'] + df['text_words']
    
    # Estadísticas por categoría
    stats_cols = ['headline_length', 'text_length', 'total_length', 
                  'headline_words', 'text_words', 'total_words']
    
    for col in stats_cols:
        write_to_report(f"\n{col.replace('_', ' ').title()}:")
        by_category = df.groupby('Category')[col].agg(['mean', 'median', 'std', 'min', 'max'])
        write_to_report(str(by_category.round(2)))

def plot_distributions(df, dataset_name):
    """Crea gráficos de distribución"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle(f'Distribuciones de Texto - {dataset_name}', fontsize=16, fontweight='bold')
    
    metrics = [
        ('headline_length', 'Longitud Titular'),
        ('text_length', 'Longitud Texto'),
        ('total_length', 'Longitud Total'),
        ('headline_words', 'Palabras Titular'),
        ('text_words', 'Palabras Texto'),
        ('total_words', 'Palabras Total')
    ]
    
    for idx, (col, title) in enumerate(metrics):
        ax = axes[idx//3, idx%3]
        
        for category in ['True', 'Fake']:
            data = df[df['Category'] == category][col]
            ax.hist(data, alpha=0.7, label=category, bins=30, density=True)
        
        ax.set_title(title, fontweight='bold')
        ax.set_xlabel('Valor')
        ax.set_ylabel('Densidad')
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    # Guardar gráfico
    filename = f"distribuciones_{dataset_name.lower().replace(' ', '_')}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    write_to_report(f"📊 Gráfico guardado: {filepath}")
    plt.close()  # Cerrar para liberar memoria

def analyze_sources_topics(df, dataset_name):
    """Analiza fuentes y temas"""
    header_text = f"\n📰 ANÁLISIS DE FUENTES Y TEMAS - {dataset_name}\n{'-' * 50}"
    write_to_report(header_text)
    
    # Top fuentes
    write_to_report("\n🔝 Top 10 Fuentes:")
    top_sources = df['Source'].value_counts().head(10)
    write_to_report(str(top_sources))
    
    # Fuentes por categoría
    write_to_report("\n🎯 Fuentes por Categoría (Top 5 cada una):")
    for category in ['True', 'Fake']:
        write_to_report(f"\n{category} News:")
        cat_sources = df[df['Category'] == category]['Source'].value_counts().head(5)
        write_to_report(str(cat_sources))
    
    # Top temas
    write_to_report("\n📚 Top 10 Temas:")
    top_topics = df['Topic'].value_counts().head(10)
    write_to_report(str(top_topics))

def plot_categorical_analysis(df, dataset_name):
    """Gráficos de análisis categórico"""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle(f'Análisis Categórico - {dataset_name}', fontsize=16, fontweight='bold')
    
    # Distribución de categorías
    ax1 = axes[0, 0]
    category_counts = df['Category'].value_counts()
    colors = ['#2E8B57', '#DC143C']  # Verde para True, Rojo para Fake
    ax1.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%',
            colors=colors, startangle=90)
    ax1.set_title('Distribución de Categorías', fontweight='bold')
    
    # Top 10 fuentes
    ax2 = axes[0, 1]
    top_sources = df['Source'].value_counts().head(10)
    ax2.barh(range(len(top_sources)), top_sources.values)
    ax2.set_yticks(range(len(top_sources)))
    ax2.set_yticklabels(top_sources.index)
    ax2.set_title('Top 10 Fuentes', fontweight='bold')
    ax2.set_xlabel('Número de Artículos')
    
    # Top 10 temas
    ax3 = axes[1, 0]
    top_topics = df['Topic'].value_counts().head(10)
    ax3.bar(range(len(top_topics)), top_topics.values)
    ax3.set_xticks(range(len(top_topics)))
    ax3.set_xticklabels(top_topics.index, rotation=45, ha='right')
    ax3.set_title('Top 10 Temas', fontweight='bold')
    ax3.set_ylabel('Número de Artículos')
    
    # Longitud promedio por categoría
    ax4 = axes[1, 1]
    length_by_category = df.groupby('Category')['total_words'].mean()
    colors_bar = ['#2E8B57' if cat == 'True' else '#DC143C' for cat in length_by_category.index]
    ax4.bar(length_by_category.index, length_by_category.values, color=colors_bar)
    ax4.set_title('Promedio de Palabras por Categoría', fontweight='bold')
    ax4.set_ylabel('Palabras Promedio')
    
    plt.tight_layout()
    
    # Guardar gráfico
    filename = f"analisis_categorico_{dataset_name.lower().replace(' ', '_')}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    write_to_report(f"📊 Gráfico guardado: {filepath}")
    plt.close()  # Cerrar para liberar memoria

def clean_text_for_wordcloud(text):
    """Limpia texto para WordCloud"""
    if pd.isna(text):
        return ""
    # Remover URLs, números, caracteres especiales
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

def create_wordclouds(df, dataset_name):
    """Crea WordClouds para cada categoría"""
    header_text = f"\n☁️ CREANDO WORDCLOUDS - {dataset_name}\n{'-' * 50}"
    write_to_report(header_text)
    
    fig, axes = plt.subplots(2, 2, figsize=(20, 16))
    fig.suptitle(f'WordClouds - {dataset_name}', fontsize=20, fontweight='bold')
    
    categories = ['True', 'Fake']
    text_types = [
        ('Headline', 'Titulares'),
        ('combined', 'Texto Completo')
    ]
    
    # Combinar headline y text
    df['combined_text'] = (df['Headline'].astype(str) + ' ' + df['Text'].astype(str))
    
    for cat_idx, category in enumerate(categories):
        cat_data = df[df['Category'] == category]
        
        for text_idx, (col, label) in enumerate(text_types):
            ax = axes[cat_idx, text_idx]
            
            # Obtener texto según la columna
            if col == 'combined':
                text_data = cat_data['combined_text']
            else:
                text_data = cat_data[col]
            
            # Limpiar y combinar todo el texto
            all_text = ' '.join([clean_text_for_wordcloud(text) for text in text_data])
            
            if len(all_text.strip()) > 0:
                # Palabras comunes en español para excluir
                stopwords_es = {
                    'que', 'de', 'el', 'la', 'en', 'y', 'a', 'un', 'es', 'se', 'no', 
                    'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al',
                    'del', 'los', 'las', 'una', 'sur', 'también', 'hasta', 'fue',
                    'ser', 'ha', 'más', 'este', 'pero', 'todo', 'esta', 'si', 'ya',
                    'muy', 'cuando', 'así', 'sin', 'sobre', 'me', 'ese', 'donde'
                }
                
                # Colores según categoría
                colormap = 'Greens' if category == 'True' else 'Reds'
                
                wordcloud = WordCloud(
                    width=800, height=600,
                    background_color='white',
                    stopwords=stopwords_es,
                    max_words=100,
                    colormap=colormap,
                    relative_scaling=0.5,
                    random_state=42
                ).generate(all_text)
                
                ax.imshow(wordcloud, interpolation='bilinear')
                ax.set_title(f'{category} News - {label}', 
                           fontsize=14, fontweight='bold',
                           color='darkgreen' if category == 'True' else 'darkred')
            else:
                ax.text(0.5, 0.5, 'No hay texto suficiente', 
                       transform=ax.transAxes, ha='center', va='center')
                ax.set_title(f'{category} News - {label}', fontsize=14, fontweight='bold')
            
            ax.axis('off')
    
    plt.tight_layout()
    
    # Guardar gráfico
    filename = f"wordclouds_{dataset_name.lower().replace(' ', '_')}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    write_to_report(f"☁️ WordClouds guardados: {filepath}")
    plt.close()  # Cerrar para liberar memoria

def analyze_suspicious_patterns(df, dataset_name):
    """Analiza patrones sospechosos en el texto"""
    header_text = f"\n🔍 ANÁLISIS DE PATRONES SOSPECHOSOS - {dataset_name}\n{'-' * 50}"
    write_to_report(header_text)
    
    # Palabras/frases típicas de fake news
    suspicious_patterns = {
        'clickbait': ['increíble', 'impactante', 'no vas a creer', 'te sorprenderá', 
                     'secreto', 'oculto', 'revelado', 'milagroso'],
        'urgency': ['urgente', 'última hora', 'rompe', 'exclusivo', 'bomba'],
        'emotional': ['indignante', 'escandaloso', 'terrible', 'horror', 'shock'],
        'conspiracy': ['conspir', 'oculta', 'verdad', 'mentira', 'engaño', 'manipul']
    }
    
    # Combinar texto para análisis
    df['full_text'] = (df['Headline'].astype(str) + ' ' + df['Text'].astype(str)).str.lower()
    
    pattern_results = {}
    
    for pattern_name, words in suspicious_patterns.items():
        write_to_report(f"\n🎯 Patrón: {pattern_name.upper()}")
        pattern_counts = {'True': 0, 'Fake': 0}
        
        for category in ['True', 'Fake']:
            cat_texts = df[df['Category'] == category]['full_text']
            count = sum(cat_texts.str.contains('|'.join(words), na=False))
            pattern_counts[category] = count
            percentage = (count / len(cat_texts)) * 100
            write_to_report(f"  {category}: {count} artículos ({percentage:.1f}%)")
        
        pattern_results[pattern_name] = pattern_counts
    
    return pattern_results

def generate_comprehensive_report(train_df, dev_df):
    """Genera reporte completo"""
    header_text = f"\n{'='*80}\n📋 REPORTE INTEGRAL DE DATASETS\n{'='*80}"
    write_to_report(header_text)
    
    total_train = len(train_df)
    total_dev = len(dev_df)
    total_samples = total_train + total_dev
    
    summary_text = [
        f"📊 Resumen General:",
        f"  • Total muestras de entrenamiento: {total_train:,}",
        f"  • Total muestras de desarrollo: {total_dev:,}",
        f"  • Total muestras combinadas: {total_samples:,}"
    ]
    
    for line in summary_text:
        write_to_report(line)
    
    # Balance general
    train_balance = train_df['Category'].value_counts()
    dev_balance = dev_df['Category'].value_counts()
    
    balance_text = [
        f"\n⚖️ Balance de Clases:",
        f"  Entrenamiento - True: {train_balance.get('True', 0)} | Fake: {train_balance.get('Fake', 0)}",
        f"  Desarrollo - True: {dev_balance.get('True', 0)} | Fake: {dev_balance.get('Fake', 0)}"
    ]
    
    for line in balance_text:
        write_to_report(line)
    
    # Recomendaciones
    write_to_report(f"\n💡 Recomendaciones para el Modelo:")
    
    if total_samples < 10000:
        write_to_report("  ⚠️ Dataset pequeño: Considerar data augmentation o transfer learning")
    elif total_samples > 50000:
        write_to_report("  ✅ Dataset grande: Ideal para modelos complejos como BERT")
    
    train_ratio = min(train_balance) / max(train_balance)
    if train_ratio < 0.7:
        write_to_report("  ⚠️ Desbalance significativo: Usar class_weight o técnicas de balanceo")
    else:
        write_to_report("  ✅ Buen balance de clases")
    
    avg_length = (train_df['total_words'].mean() + dev_df['total_words'].mean()) / 2
    if avg_length > 500:
        write_to_report("  📝 Textos largos: Considerar modelos que manejen secuencias largas")
    elif avg_length < 50:
        write_to_report("  📝 Textos cortos: Modelos simples pueden ser suficientes")
    
    recommendations = [
        f"\n🚀 Próximos Pasos Recomendados:",
        "  1. Implementar data cleaning avanzado",
        "  2. Considerar BERT fine-tuning para máxima precisión",
        "  3. Implementar validación cruzada estratificada",
        "  4. Usar métricas balanceadas (F1-score, ROC-AUC)"
    ]
    
    for line in recommendations:
        write_to_report(line)

def main():
    """Función principal de análisis"""
    # Inicializar archivo de reporte
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    header = f"ANÁLISIS EXPLORATORIO DE DATOS - DETECCIÓN DE FAKE NEWS\n"
    header += f"{'='*80}\n"
    header += f"Fecha y hora: {timestamp}\n"
    header += f"Directorio de salida: {OUTPUT_DIR}\n"
    header += f"{'='*80}"
    
    write_to_report(header)
    
    try:
        # Cargar datasets
        train_df = load_and_basic_info("data/train.xlsx", "ENTRENAMIENTO")
        dev_df = load_and_basic_info("data/development.xlsx", "DESARROLLO")
        
        # Análisis detallado para cada dataset
        for df, name in [(train_df, "ENTRENAMIENTO"), (dev_df, "DESARROLLO")]:
            analyze_text_statistics(df, name)
            plot_distributions(df, name)
            analyze_sources_topics(df, name)
            plot_categorical_analysis(df, name)
            create_wordclouds(df, name)
            analyze_suspicious_patterns(df, name)
        
        # Reporte integral
        generate_comprehensive_report(train_df, dev_df)
        
        final_message = [
            f"\n✅ Análisis completado exitosamente!",
            f"📊 Reporte completo guardado en: {REPORT_FILE}",
            f"🖼️ Gráficos guardados en: {OUTPUT_DIR}",
            f"� Archivos generados:",
            f"  - Reporte de texto: {os.path.basename(REPORT_FILE)}",
            f"  - Distribuciones (entrenamiento): distribuciones_entrenamiento.png",
            f"  - Distribuciones (desarrollo): distribuciones_desarrollo.png", 
            f"  - Análisis categórico (entrenamiento): analisis_categorico_entrenamiento.png",
            f"  - Análisis categórico (desarrollo): analisis_categorico_desarrollo.png",
            f"  - WordClouds (entrenamiento): wordclouds_entrenamiento.png",
            f"  - WordClouds (desarrollo): wordclouds_desarrollo.png"
        ]
        
        for line in final_message:
            write_to_report(line)
        
    except Exception as e:
        error_msg = [
            f"❌ Error durante el análisis: {str(e)}",
            "Verifica que los archivos data/train.xlsx y data/development.xlsx existan."
        ]
        for line in error_msg:
            write_to_report(line)

if __name__ == "__main__":
    # Instalar dependencias si no están disponibles
    try:
        import wordcloud
    except ImportError:
        print("📦 Instalando WordCloud...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "wordcloud"])
        from wordcloud import WordCloud
    
    main()
