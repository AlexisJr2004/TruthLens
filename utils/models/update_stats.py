import os
import json
from datetime import datetime

STATS_FILE = 'src/static/stats_analisis.json'

def cargar_stats():
    if not os.path.exists(STATS_FILE):
        hoy = datetime.now().strftime('%Y-%m-%d')
        stats = {
            'total_analisis': 0,
            'analisis_diarios': {hoy: 0},
            'total_fakes': 0,
            'fakes_diarios': {hoy: 0},
            'total_correctos': 0,
            'total_predicciones': 0
        }
        guardar_stats(stats)
        return stats
    try:
        with open(STATS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, ValueError):
        print("Archivo JSON corrupto o vacío. Creando uno nuevo.")
        hoy = datetime.now().strftime('%Y-%m-%d')
        stats = {
            'total_analisis': 0,
            'analisis_diarios': {hoy: 0},
            'total_fakes': 0,
            'fakes_diarios': {hoy: 0},
            'total_correctos': 0,
            'total_predicciones': 0
        }
        guardar_stats(stats)
        return stats

def guardar_stats(stats):
    print("Guardando estadísticas:", stats)
    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

def registrar_analisis(es_fake, es_correcto):
    stats = cargar_stats()
    hoy = datetime.now().strftime('%Y-%m-%d')
    # Total análisis
    stats['total_analisis'] += 1
    # Análisis diarios
    stats['analisis_diarios'][hoy] = stats['analisis_diarios'].get(hoy, 0) + 1
    # Fakes
    if es_fake:
        print("fake detectado")
        print("Incrementando total_fakes")
        stats['total_fakes'] += 1
        stats['fakes_diarios'][hoy] = stats['fakes_diarios'].get(hoy, 0) + 1
    # Precisión
    stats['total_predicciones'] += 1
    if es_correcto:
        print("predicción correcta")
        print("Incrementando total_correctos")
        stats['total_correctos'] += 1
    guardar_stats(stats)

def obtener_total_analisis():
    return cargar_stats().get('total_analisis', 0)

def obtener_analisis_hoy():
    hoy = datetime.now().strftime('%Y-%m-%d')
    return cargar_stats().get('analisis_diarios', {}).get(hoy, 0)

def obtener_total_fakes():
    return cargar_stats().get('total_fakes', 0)

def obtener_fakes_hoy():
    hoy = datetime.now().strftime('%Y-%m-%d')
    return cargar_stats().get('fakes_diarios', {}).get(hoy, 0)