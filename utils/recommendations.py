"""
Funciones para generar recomendaciones basadas en los resultados del modelo
"""

def get_recommendation(result):
    """Genera recomendaciones basadas en los resultados del modelo"""
    prob_fake = result.get('probability_fake', 0.5)
    prob_true = result.get('probability_true', 0.5)
    diff = result.get('probability_difference', 0)
    
    if diff < 0.2:
        return "⚠️ Resultado INCIERTO - Verificar con fuentes adicionales"
    elif prob_fake > 0.9:
        return "🚨 ALTA probabilidad de fake news - Desconfiar"
    elif prob_fake > 0.8:
        return "⚠️ PROBABLE fake news - Verificar cuidadosamente"
    elif prob_fake > 0.6:
        return "🤔 POSIBLE fake news - Investigar más"
    elif prob_true > 0.8:
        return "✅ PROBABLE noticia real - Pero siempre verificar"
    else:
        return "🔍 Resultado ambiguo - Aplicar criterio periodístico"
