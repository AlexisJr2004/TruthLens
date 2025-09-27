// =====================================================================
// NEWS ANALYZER - APLICACIÓN DE ANÁLISIS DE NOTICIAS
// =====================================================================

// =====================================================================
// 1. CONFIGURACIÓN Y CONSTANTES
// =====================================================================

const CONFIG = {
    PARTICLE_COUNT: 50,
    MAX_HISTORY_ITEMS: 15,
    MAX_FILE_SIZE_MB: 8,
    CHAR_LIMITS: {
        WARNING: 6000,
        DANGER: 8000
    },
    CONFIDENCE_THRESHOLDS: {
        HIGH: 70,
        MEDIUM: 40
    }
};

// =====================================================================
// 2. VARIABLES GLOBALES
// =====================================================================

let INPUT_MODE = 'text'; // 'text' | 'file' | 'image' | 'url'
let EXAMPLES_DATA = null; // Cache para los ejemplos

// =====================================================================
// 3. UTILIDADES PRINCIPALES
// =====================================================================

/**
 * Sanitiza texto para prevenir XSS
 */
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Obtiene el contenedor del historial
 */
function getHistoryContainer() {
    return document.getElementById('history');
}

/**
 * Carga historial desde almacenamiento (sin persistencia)
 */
function loadHistoryFromStorage() {
    return [];
}

/**
 * Guarda historial en almacenamiento (sin persistencia)
 */
function saveHistoryToStorage(history) {
    // Sin persistencia: no hacer nada
}

// =====================================================================
// 4. GESTIÓN DE EJEMPLOS
// =====================================================================

/**
 * Carga datos de ejemplos desde el servidor
 */
async function loadExamplesData() {
    if (EXAMPLES_DATA) return EXAMPLES_DATA;
    
    try {
        const response = await fetch('/static/examples.json');
        if (!response.ok) throw new Error('No se pudieron cargar los ejemplos');
        EXAMPLES_DATA = await response.json();
        return EXAMPLES_DATA;
    } catch (error) {
        console.warn('Error cargando ejemplos:', error);
        // Fallback con ejemplos embebidos
        EXAMPLES_DATA = {
            fake_examples: [
                {
                    title: "¡INCREÍBLE! Médicos ocultan cura milagrosa del cáncer",
                    content: "Los médicos no quieren que sepas este truco secreto que cura el cáncer en solo 3 días..."
                }
            ],
            real_examples: [
                {
                    title: "Nuevo tratamiento para diabetes tipo 2 muestra resultados prometedores",
                    content: "Investigadores de la Universidad de Harvard publicaron en Nature Medicine..."
                }
            ]
        };
        return EXAMPLES_DATA;
    }
}

/**
 * Obtiene un ejemplo aleatorio
 */
function getRandomExample() {
    if (!EXAMPLES_DATA) return null;
    
    const allExamples = [
        ...EXAMPLES_DATA.fake_examples,
        ...EXAMPLES_DATA.real_examples
    ];
    
    const randomIndex = Math.floor(Math.random() * allExamples.length);
    return allExamples[randomIndex];
}

// =====================================================================
// 5. INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================================

/**
 * Función principal de inicialización
 */
function initializeApplication() {
    initializePreloader();
    createParticles();
    initializeSidebar();
    initializeCharacterCounter();
    initializeAnalysisControls();
    initializeSampleText();
    initializeClearButton();
    initializeVoiceInput();
    initializeQuickActions();
    initializeFileMode();
    initializeUrlMode();
    hydrateHistoryUI();
    
    // Precargar ejemplos en background
    loadExamplesData().catch(console.warn);
}

/**
 * Inicializa el preloader con animación de fade-out
 */
function initializePreloader() {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    
    setTimeout(() => {
        pre.classList.add('fade-out');
        setTimeout(() => { 
            pre.style.display = 'none'; 
        }, 450);
    }, 1000);
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeApplication);

// =====================================================================
// 6. SISTEMA DE PARTÍCULAS
// =====================================================================

/**
 * Crea las partículas animadas del fondo
 */
function createParticles() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = Math.random() * 15 + 10 + 's';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particles.appendChild(particle);
    }
}

// =====================================================================
// 7. GESTIÓN DEL TEMA (DARK MODE)
// =====================================================================

/**
 * Inicializa el sistema de tema oscuro/claro
 */
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const html = document.documentElement;

    if (!darkModeToggle) return;

    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        html.classList.add('dark');
        darkModeToggle.checked = true;
    } else if (savedTheme === 'light') {
        html.classList.remove('dark');
        darkModeToggle.checked = false;
    } else {
        // Predeterminado: claro
        html.classList.remove('dark');
        darkModeToggle.checked = false;
    }

    // Event listener para cambios
    darkModeToggle.addEventListener('change', function () {
        if (this.checked) {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });
}

// =====================================================================
// 8. BOTÓN DE SCROLL TO TOP
// =====================================================================

/**
 * Inicializa el botón de ir arriba
 */
function initializeScrollTopButton() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Inicializar dark mode y scroll button cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    initializeDarkMode();
    initializeScrollTopButton();
});

// =====================================================================
// 9. FUNCIONALIDAD DE LA BARRA LATERAL
// =====================================================================

/**
 * Inicializa la barra lateral y su comportamiento
 */
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (!sidebarToggle || !sidebar || !overlay) return;

    // Toggle barra lateral
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    // Cerrar con overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Elementos de navegación
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// =====================================================================
// 10. CONTADOR DE CARACTERES
// =====================================================================

/**
 * Inicializa el contador de caracteres dinámico
 */
function initializeCharacterCounter() {
    const textarea = document.getElementById('news-text');
    const titleInput = document.getElementById('news-title');
    const charCount = document.getElementById('char-count');

    if (!textarea || !titleInput || !charCount) return;

    function updateCounter() {
        const textCount = textarea.value.length;
        const titleCount = titleInput.value.length;
        const totalCount = textCount + titleCount;
        
        charCount.textContent = totalCount.toLocaleString();

        // Cambiar color según límites
        if (totalCount > CONFIG.CHAR_LIMITS.DANGER) {
            charCount.style.color = '#ef4444';
        } else if (totalCount > CONFIG.CHAR_LIMITS.WARNING) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
    }

    textarea.addEventListener('input', updateCounter);
    titleInput.addEventListener('input', updateCounter);
}

// =====================================================================
// 11. ANÁLISIS DE TEXTO PRINCIPAL
// =====================================================================

/**
 * Función principal para analizar texto/archivos/URLs
 */
async function analyzeText() {
    const loading = document.getElementById('loading');
    const resultCard = document.getElementById('result-card');
    const textarea = document.getElementById('news-text');
    const titleInput = document.getElementById('news-title');
    const newsFile = document.getElementById('news-file');
    const imageFile = document.getElementById('image-file');
    const urlInput = document.getElementById('news-url');

    // Limpiar datos previos
    window.currentDebugInfo = {};
    window.currentPredictionInfo = {};
    window.currentExtractedPreview = '';

    // Cerrar panel de debug
    closeDebugPanel();

    let response, payload;
    let ctx = { typedText: '', typedTitle: '', file: null, img: null, url: '' };

    loading.classList.remove('hidden');
    resultCard.classList.add('hidden');

    try {
        // Determinar tipo de análisis y hacer petición
        ({ response, ctx } = await makeAnalysisRequest(ctx, newsFile, imageFile, urlInput, textarea, titleInput));

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error en el servidor');
        }
        
        payload = await response.json();

        // Procesar y mostrar resultados
        const results = processAnalysisResults(payload, titleInput, textarea);
        displayResults(results);

        // Manejar contenido específico por tipo
        handleSpecificContent(payload, textarea);

        // Agregar al historial
        const historyText = getHistoryText(payload, ctx);
        addToHistory(historyText, { 
            probability: results.fakePercent, 
            prediction: payload.prediction,
            label: payload.label 
        });
        
        resultCard.classList.remove('hidden');
        
    } catch (e) {
        handleAnalysisError(e, resultCard);
    } finally {
        loading.classList.add('hidden');
    }
}

/**
 * Realiza la petición de análisis según el modo actual
 */
async function makeAnalysisRequest(ctx, newsFile, imageFile, urlInput, textarea, titleInput) {
    let response;

    if (INPUT_MODE === 'file') {
        const file = newsFile.files?.[0];
        if (!file) throw new Error('Selecciona un archivo primero.');
        ctx.file = file;
        const form = new FormData();
        form.append('file', file);
        response = await fetch('/predict', { method: 'POST', body: form });
    } else if (INPUT_MODE === 'image') {
        const img = imageFile.files?.[0];
        if (!img) throw new Error('Selecciona una imagen primero.');
        ctx.img = img;
        const form = new FormData();
        form.append('image', img);
        response = await fetch('/ocr_predict', { method: 'POST', body: form });
    } else if (INPUT_MODE === 'url') {
        const url = (urlInput.value || '').trim();
        if (!url) throw new Error('Ingresa una URL válida.');
        ctx.url = url;
        response = await fetch('/analyze_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
    } else {
        const text = (textarea.value || '').trim();
        const title = (titleInput.value || '').trim();
        
        if (!text && !title) throw new Error('Ingresa al menos un título o contenido para analizar.');
        
        ctx.typedText = text;
        ctx.typedTitle = title;
        
        response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: title,
                text: text 
            })
        });
    }

    return { response, ctx };
}

/**
 * Procesa los resultados del análisis
 */
function processAnalysisResults(payload, titleInput, textarea) {
    const percent = Math.round((payload.probability || 0) * 100);
    const fakePercent = percent;
    const truePercent = 100 - percent;

    // Guardar información de debug
    window.currentDebugInfo = payload.debug_info || {};
    window.currentPredictionInfo = {
        prediction: payload.prediction,
        label: payload.label,
        confidence: Math.round((payload.confidence || 0) * 100),
        fakePercent: fakePercent,
        truePercent: truePercent
    };
    
    // Guardar contenido extraído
    if (payload.extracted_preview) {
        window.currentExtractedPreview = payload.extracted_preview;
    } else if (payload.text) {
        window.currentExtractedPreview = payload.text;
    } else if (INPUT_MODE === 'text') {
        const title = titleInput?.value || '';
        const text = textarea?.value || '';
        window.currentExtractedPreview = title ? `${title}\n\n${text}` : text;
    } else {
        window.currentExtractedPreview = 'Contenido analizado';
    }

    return {
        fakePercent: fakePercent,
        truePercent: truePercent,
        prediction: payload.prediction || 'Unknown',
        label: payload.label,
        sentiment: payload.label === 1 ? 'Negativo' : 'Positivo',
        riskLevel: payload.label === 1 ? 'Alto' : 'Bajo',
        mlScore: payload.probability || 0,
        confidence: Math.round((payload.confidence || 0) * 100)
    };
}

/**
 * Maneja contenido específico según el tipo de análisis
 */
function handleSpecificContent(payload, textarea) {
    // Si es imagen, volcar texto extraído
    if (INPUT_MODE === 'image' && payload.text) {
        textarea.value = payload.text;
        textarea.dispatchEvent(new Event('input'));
    }

    // Si es URL, mostrar preview
    if (INPUT_MODE === 'url' && payload.extracted_preview) {
        const preview = document.getElementById('url-preview');
        const previewContent = document.getElementById('url-preview-content');
        if (preview && previewContent) {
            previewContent.textContent = payload.extracted_preview;
            preview.classList.remove('hidden');
        }
    }
}

/**
 * Obtiene el texto para el historial según el contexto
 */
function getHistoryText(payload, ctx) {
    if (INPUT_MODE === 'text') {
        return ctx.typedTitle ? `${ctx.typedTitle}: ${ctx.typedText}`.trim() : ctx.typedText;
    } else if (INPUT_MODE === 'file') {
        return payload.extracted_preview || (ctx.file?.name || 'Archivo analizado');
    } else if (INPUT_MODE === 'image') {
        return payload.extracted_preview || payload.text || (ctx.img?.name || 'Imagen analizada');
    } else if (INPUT_MODE === 'url') {
        return payload.article_data?.title || ctx.url || 'URL analizada';
    }
    return 'Contenido analizado';
}

/**
 * Maneja errores durante el análisis
 */
function handleAnalysisError(error, resultCard) {
    Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo completar el análisis.',
        icon: 'error',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white'
    });
    
    resultCard.classList.add('hidden');
}

/**
 * Inicializa los controles de análisis
 */
function initializeAnalysisControls() {
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeText);
    }
}

// =====================================================================
// 12. VISUALIZACIÓN DE RESULTADOS
// =====================================================================

/**
 * Muestra los resultados del análisis en la interfaz
 */
function displayResults(results) {
    const title = document.getElementById('result-title');
    const badge = document.getElementById('confidence-badge');
    const prob = document.getElementById('result-prob');
    const fill = document.getElementById('confidence-fill');
    const description = document.getElementById('result-description');
    const mlScore = document.getElementById('ml-score');
    const sentiment = document.getElementById('sentiment');
    const riskLevel = document.getElementById('risk-level');

    if (!title || !badge || !prob || !fill || !description) return;

    const fakePercent = results.fakePercent || 0;
    const prediction = results.prediction || 'Unknown';
    
    // Configurar visualización según predicción
    configureResultDisplay(prediction, fakePercent, results, title, badge, description, fill);

    // Mostrar métricas
    prob.textContent = (results.confidence || 0) + '%';
    fill.style.width = (results.confidence || 0) + '%';
    
    if (mlScore) mlScore.textContent = (results.mlScore || 0).toFixed(3);
    if (sentiment) sentiment.textContent = results.sentiment || 'Neutro';
    if (riskLevel) riskLevel.textContent = results.riskLevel || 'Medio';

    // Configurar funcionalidades adicionales
    setupShareAndDownload();
    setupDebugButton();
}

/**
 * Configura la visualización de resultados según la predicción
 */
function configureResultDisplay(prediction, fakePercent, results, title, badge, description, fill) {
    if (prediction === 'Fake' || results.label === 1) {
        // ES FAKE NEWS
        if (fakePercent >= 90) {
            setResultStyle(title, badge, description, fill, {
                titleText: 'Posible Desinformación',
                titleClass: 'text-2xl font-bold text-red-400',
                badgeText: 'FALSO',
                badgeClass: 'px-4 py-2 rounded-full text-sm font-bold bg-red-500 bg-opacity-20 text-red-400',
                descText: 'El análisis detectó múltiples indicadores de desinformación. Se recomienda extrema precaución.',
                gradient: 'linear-gradient(90deg, #ef4444, #dc2626)'
            });
        } else if (fakePercent >= 60) {
            setResultStyle(title, badge, description, fill, {
                titleText: 'Probablemente Falso',
                titleClass: 'text-2xl font-bold text-orange-400',
                badgeText: 'SOSPECHOSO',
                badgeClass: 'px-4 py-2 rounded-full text-sm font-bold bg-orange-500 bg-opacity-20 text-orange-400',
                descText: 'El contenido presenta características típicas de desinformación. Verificar con fuentes confiables.',
                gradient: 'linear-gradient(90deg, #f97316, #ea580c)'
            });
        } else {
            setResultStyle(title, badge, description, fill, {
                titleText: 'Requiere Verificación',
                titleClass: 'text-2xl font-bold text-yellow-400',
                badgeText: 'DUDOSO',
                badgeClass: 'px-4 py-2 rounded-full text-sm font-bold bg-yellow-500 bg-opacity-20 text-yellow-400',
                descText: 'El modelo detectó señales mixtas. Se recomienda verificar con fuentes adicionales.',
                gradient: 'linear-gradient(90deg, #f59e0b, #d97706)'
            });
        }
    } else {
        // ES VERDADERO
        const truePercent = results.truePercent || (100 - fakePercent);
        if (truePercent >= 80) {
            setResultStyle(title, badge, description, fill, {
                titleText: 'Contenido Confiable',
                titleClass: 'text-2xl font-bold text-green-400',
                badgeText: 'VERIFICADO',
                badgeClass: 'px-4 py-2 rounded-full text-sm font-bold bg-green-500 bg-opacity-20 text-green-400',
                descText: 'El análisis indica que este contenido presenta características de información confiable y verificable.',
                gradient: 'linear-gradient(90deg, #10b981, #059669)'
            });
        } else {
            setResultStyle(title, badge, description, fill, {
                titleText: 'Parcialmente Confiable',
                titleClass: 'text-2xl font-bold text-blue-400',
                badgeText: 'REVISAR',
                badgeClass: 'px-4 py-2 rounded-full text-sm font-bold bg-blue-500 bg-opacity-20 text-blue-400',
                descText: 'El contenido parece legítimo pero presenta algunas inconsistencias menores.',
                gradient: 'linear-gradient(90deg, #3b82f6, #2563eb)'
            });
        }
    }
}

/**
 * Aplica estilos a los elementos de resultado
 */
function setResultStyle(title, badge, description, fill, styles) {
    title.textContent = styles.titleText;
    title.className = styles.titleClass;
    badge.textContent = styles.badgeText;
    badge.className = styles.badgeClass;
    description.textContent = styles.descText;
    fill.style.background = styles.gradient;
}

// =====================================================================
// 13. PANEL DE DEBUG
// =====================================================================

/**
 * Configura el botón y panel de debug
 */
function setupDebugButton() {
    const debugBtn = document.getElementById('debug-btn');
    const debugPanel = document.getElementById('debug-panel');
    const debugContent = document.getElementById('debug-content');

    if (!debugBtn || !debugPanel || !debugContent) return;

    debugBtn.onclick = function () {
        const isVisible = !debugPanel.classList.contains('hidden');
        
        if (isVisible) {
            closeDebugPanel();
        } else {
            openDebugPanel();
        }
    };
}

/**
 * Abre el panel de debug
 */
function openDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    const debugContent = document.getElementById('debug-content');
    const debugBtn = document.getElementById('debug-btn');

    const debugInfo = window.currentDebugInfo || {};
    const predInfo = window.currentPredictionInfo || {};
    
    const analysisType = debugInfo.extraction_method || 'Texto Manual';
    const isUrl = analysisType === 'URL Scraping';
    const isOcr = analysisType === 'OCR';
    
    const debugHtml = generateSimpleDebugContent(predInfo, debugInfo, analysisType, isUrl, isOcr);
    
    debugContent.innerHTML = debugHtml;
    debugPanel.classList.remove('hidden');
    debugBtn.innerHTML = '<i class="fas fa-times text-purple-600 dark:text-purple-300"></i><span class="text-purple-700 dark:text-purple-200 font-semibold">Ocultar Debug</span>';
}

/**
 * Cierra el panel de debug
 */
function closeDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    const debugBtn = document.getElementById('debug-btn');

    if (debugPanel && debugBtn) {
        debugPanel.classList.add('hidden');
        debugBtn.innerHTML = '<i class="fas fa-code text-purple-600 dark:text-purple-300"></i><span class="text-purple-700 dark:text-purple-200 font-semibold">Ver Debug</span>';
    }
}

/**
 * Genera el contenido del panel de debug
 */
function generateSimpleDebugContent(predInfo, debugInfo, analysisType, isUrl, isOcr) {
    const confidence = predInfo.confidence || 0;
    const fakePercent = predInfo.fakePercent || 0;
    const prediction = predInfo.prediction || 'N/A';
    
    return `
        <div class="space-y-6">
            <!-- Resultados del Modelo -->
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-brain text-purple-500 dark:text-purple-400 mr-3"></i>
                    Resultados del Modelo
                </h5>
                <div class="space-y-3">
                    <div class="debug-item-simple">
                        <span class="text-purple-600 dark:text-purple-300">Predicción:</span>
                        <span class="debug-badge-simple ${getBadgeClass(prediction)}">${prediction}</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-purple-600 dark:text-purple-300">Confianza:</span>
                        <span class="text-gray-900 dark:text-white font-medium">${confidence}%</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-purple-600 dark:text-purple-300">Probabilidad Fake:</span>
                        <span class="text-gray-900 dark:text-white font-medium">${fakePercent}%</span>
                    </div>
                </div>
            </div>

            <!-- Análisis Técnico -->
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-cogs text-blue-500 dark:text-blue-400 mr-3"></i>
                    Análisis Técnico
                </h5>
                <div class="space-y-2">
                    <div class="debug-item-simple">
                        <span class="text-blue-600 dark:text-blue-300">BERT dice:</span>
                        <span class="text-gray-900 dark:text-white">${debugInfo.bert_says || 'N/A'}</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-blue-600 dark:text-blue-300">Decisión final:</span>
                        <span class="text-gray-900 dark:text-white">${debugInfo.final_decision || 'N/A'}</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-blue-600 dark:text-blue-300">Umbral usado:</span>
                        <span class="text-gray-900 dark:text-white">${debugInfo.threshold_used || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Métricas del Contenido -->
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-ruler text-green-500 dark:text-green-400 mr-3"></i>
                    Métricas del Contenido
                </h5>
                <div class="grid grid-cols-3 gap-4">
                    <div class="debug-metric-simple">
                        <div class="text-green-600 dark:text-green-300 text-sm">Título</div>
                        <div class="text-gray-900 dark:text-white font-medium">${(debugInfo.title_length || 0).toLocaleString()}</div>
                    </div>
                    <div class="debug-metric-simple">
                        <div class="text-green-600 dark:text-green-300 text-sm">Contenido</div>
                        <div class="text-gray-900 dark:text-white font-medium">${(debugInfo.text_length || 0).toLocaleString()}</div>
                    </div>
                    <div class="debug-metric-simple">
                        <div class="text-green-600 dark:text-green-300 text-sm">Total</div>
                        <div class="text-gray-900 dark:text-white font-medium">${((debugInfo.title_length || 0) + (debugInfo.text_length || 0)).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            ${generateTypeSpecificContent(debugInfo, analysisType, isUrl, isOcr)}
            
            ${debugInfo.recommendation ? `
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-3 flex items-center">
                    <i class="fas fa-lightbulb text-gray-600 dark:text-gray-400 mr-3"></i>
                    Recomendación
                </h5>
                <div class="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-60 p-3 rounded-lg border-l-4 border-gray-500 dark:border-gray-500">
                    ${debugInfo.recommendation}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Genera contenido específico según el tipo de análisis
 */
function generateTypeSpecificContent(debugInfo, analysisType, isUrl, isOcr) {
    if (isUrl) {
        return `
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-globe text-cyan-500 dark:text-cyan-400 mr-3"></i>
                    Análisis por URL
                </h5>
                <div class="space-y-2">
                    <div class="debug-item-simple">
                        <span class="text-cyan-600 dark:text-cyan-300">Contenido original:</span>
                        <span class="text-gray-900 dark:text-white">${(debugInfo.original_content_length || 0).toLocaleString()} caracteres</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-cyan-600 dark:text-cyan-300">Optimizado a:</span>
                        <span class="text-gray-900 dark:text-white">${(debugInfo.truncated_content_length || 0).toLocaleString()} caracteres</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-cyan-600 dark:text-cyan-300">Truncado:</span>
                        <span class="text-gray-900 dark:text-white ${debugInfo.truncation_applied ? 'text-yellow-600 dark:text-yellow-300' : 'text-green-600 dark:text-green-300'}">
                            ${debugInfo.truncation_applied ? 'Sí' : 'No'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    } else if (isOcr) {
        return `
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-image text-orange-500 dark:text-orange-400 mr-3"></i>
                    Análisis por OCR
                </h5>
                <div class="space-y-2">
                    <div class="debug-item-simple">
                        <span class="text-orange-600 dark:text-orange-300">Método:</span>
                        <span class="text-gray-900 dark:text-white">OCR.space API</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-orange-600 dark:text-orange-300">Texto extraído:</span>
                        <span class="text-gray-900 dark:text-white">${(debugInfo.text_length || 0).toLocaleString()} caracteres</span>
                    </div>
                </div>
            </div>
        `;
    } else if (analysisType === 'Archivo subido') {
        return `
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-file-alt text-indigo-500 dark:text-indigo-400 mr-3"></i>
                    Análisis por Archivo
                </h5>
                <div class="space-y-2">
                    <div class="debug-item-simple">
                        <span class="text-indigo-600 dark:text-indigo-300">Procesamiento:</span>
                        <span class="text-gray-900 dark:text-white">Separación automática de título y contenido</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="debug-section-simple">
                <h5 class="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-keyboard text-pink-500 dark:text-pink-400 mr-3"></i>
                    Análisis Manual
                </h5>
                <div class="space-y-2">
                    <div class="debug-item-simple">
                        <span class="text-pink-600 dark:text-pink-300">Tipo:</span>
                        <span class="text-gray-900 dark:text-white">Texto ingresado directamente</span>
                    </div>
                    <div class="debug-item-simple">
                        <span class="text-pink-600 dark:text-pink-300">Separación:</span>
                        <span class="text-gray-900 dark:text-white">Título y contenido procesados por separado</span>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Obtiene la clase CSS para el badge según la predicción
 */
function getBadgeClass(prediction) {
    if (prediction === 'Fake') return 'badge-danger';
    if (prediction === 'Real') return 'badge-success';
    return 'badge-warning';
}

// =====================================================================
// 14. GESTIÓN DE MODOS DE ENTRADA
// =====================================================================

/**
 * Inicializa el modo de archivos y sus controles
 */
function initializeFileMode() {
    const fileBtn = document.getElementById('file-mode-btn');
    const textMode = document.getElementById('text-mode');
    const fileMode = document.getElementById('file-mode');
    const imageMode = document.getElementById('image-mode');
    const urlMode = document.getElementById('url-mode');
    const newsFile = document.getElementById('news-file');
    const imageFile = document.getElementById('image-file');
    const fileDrop = document.getElementById('file-dropzone');
    const imageDrop = document.getElementById('image-dropzone');
    const fileInfo = document.getElementById('file-info');
    const imageInfo = document.getElementById('image-info');

    if (!fileBtn) return;

    /**
     * Actualiza el texto del botón según el modo actual
     */
    function updateButton() {
        if (INPUT_MODE === 'text') {
            fileBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Subir Archivo';
        } else {
            fileBtn.innerHTML = '<i class="fas fa-keyboard mr-2"></i>Analizar texto';
        }
    }
    
    /**
     * Cambia el modo de entrada de la aplicación
     */
    function setMode(mode) {
        INPUT_MODE = mode;
        const sampleBtn = document.getElementById('sample-btn');
        
        // Controlar visibilidad de elementos
        if (textMode) textMode.classList.toggle('hidden', mode !== 'text');
        if (textMode) textMode.classList.toggle('block', mode === 'text');
        if (fileMode) fileMode.classList.toggle('hidden', mode !== 'file');
        if (imageMode) imageMode.classList.toggle('hidden', mode !== 'image');
        if (urlMode) urlMode.classList.toggle('hidden', mode !== 'url');
        
        // Ocultar botón "Ejemplo" para archivos, imágenes y URLs
        if (sampleBtn) {
            if (mode === 'file' || mode === 'image' || mode === 'url') {
                sampleBtn.style.display = 'none';
            } else {
                sampleBtn.style.display = 'flex';
            }
        }
        
        updateButton();
    }
    
    // Exponer funciones para otros módulos
    window.__setInputMode = setMode;
    window.__updateInputButton = updateButton;

    // Toggle con el botón
    fileBtn.addEventListener('click', () => {
        if (INPUT_MODE === 'text') {
            setMode('file');
            if (newsFile) {
                newsFile.value = '';
                if (fileInfo) fileInfo.classList.add('hidden');
                setTimeout(() => newsFile.click(), 0);
            }
        } else {
            setMode('text');
        }
    });

    // Configurar dropzones
    setupDropzones(fileDrop, imageDrop, newsFile, imageFile);
    
    // Configurar listeners de archivos
    setupFileListeners(newsFile, imageFile, fileInfo, imageInfo);

    // Estado inicial
    setMode('text');
}

/**
 * Configura las zonas de drag & drop
 */
function setupDropzones(fileDrop, imageDrop, newsFile, imageFile) {
    // Click en dropzones
    fileDrop?.addEventListener('click', () => newsFile?.click());
    imageDrop?.addEventListener('click', () => imageFile?.click());

    // Función auxiliar para Drag & Drop
    function wireDnD(dropEl, onFile) {
        if (!dropEl) return;
        
        ['dragenter', 'dragover'].forEach(e =>
            dropEl.addEventListener(e, ev => { 
                ev.preventDefault(); 
                dropEl.classList.add('border-purple-500'); 
            })
        );
        
        ['dragleave', 'drop'].forEach(e =>
            dropEl.addEventListener(e, ev => { 
                ev.preventDefault(); 
                dropEl.classList.remove('border-purple-500'); 
            })
        );
        
        dropEl.addEventListener('drop', ev => {
            const dtFile = ev.dataTransfer?.files?.[0];
            if (dtFile) onFile(dtFile);
        });
    }
    
    // Configurar drag & drop para archivos
    wireDnD(fileDrop, (f) => {
        Swal.fire({ 
            title: 'Archivo detectado', 
            text: 'Usa clic para seleccionar el archivo.', 
            icon: 'info', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white' 
        });
    });
    
    // Configurar drag & drop para imágenes
    wireDnD(imageDrop, (f) => {
        Swal.fire({ 
            title: 'Imagen detectada', 
            text: 'Usa clic para seleccionar la imagen.', 
            icon: 'info', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white' 
        });
    });
}

/**
 * Configura los listeners para mostrar información de archivos
 */
function setupFileListeners(newsFile, imageFile, fileInfo, imageInfo) {
    // Mostrar info del archivo seleccionado
    newsFile?.addEventListener('change', () => {
        const f = newsFile.files?.[0];
        if (f && fileInfo) {
            fileInfo.textContent = `${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`;
            fileInfo.classList.remove('hidden');
        } else if (fileInfo) {
            fileInfo.classList.add('hidden');
        }
    });
    
    // Mostrar info de la imagen seleccionada
    imageFile?.addEventListener('change', () => {
        const f = imageFile.files?.[0];
        if (f && imageInfo) {
            imageInfo.textContent = `${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`;
            imageInfo.classList.remove('hidden');
        } else if (imageInfo) {
            imageInfo.classList.add('hidden');
        }
    });
}

/**
 * Inicializa el modo URL
 */
function initializeUrlMode() {
    const urlBtn = document.getElementById('url-mode-btn');
    const urlInput = document.getElementById('news-url');
    const urlPreview = document.getElementById('url-preview');

    if (!urlBtn) return;

    // Toggle al modo URL
    urlBtn.addEventListener('click', () => {
        if (window.__setInputMode) {
            window.__setInputMode('url');
        }
        if (urlInput) {
            urlInput.focus();
        }
        // Limpiar preview previo
        if (urlPreview) {
            urlPreview.classList.add('hidden');
        }
    });

    // Validación básica de URL en tiempo real
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            const url = urlInput.value.trim();
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                urlInput.style.borderColor = '#f59e0b';
            } else {
                urlInput.style.borderColor = '';
            }
        });
    }
}

// =====================================================================
// 15. FUNCIONALIDADES DE TEXTO
// =====================================================================

/**
 * Inicializa el botón de texto de ejemplo
 */
function initializeSampleText() {
    const sampleBtn = document.getElementById('sample-btn');
    if (!sampleBtn) return;

    sampleBtn.addEventListener('click', async () => {
        const textarea = document.getElementById('news-text');
        const titleInput = document.getElementById('news-title');
        
        if (!textarea || !titleInput) return;
        
        // Mostrar estado de carga
        const originalContent = sampleBtn.innerHTML;
        sampleBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-yellow-600 dark:text-yellow-400"></i><span>Cargando...</span>';
        sampleBtn.disabled = true;
        
        try {
            // Cargar ejemplos si no están cargados
            await loadExamplesData();
            
            // Obtener ejemplo aleatorio
            const example = getRandomExample();
            
            if (example) {
                titleInput.value = example.title;
                textarea.value = example.content;
                
                // Disparar eventos para actualizar contadores
                titleInput.dispatchEvent(new Event('input'));
                textarea.dispatchEvent(new Event('input'));
            } else {
                throw new Error('No se pudo obtener ejemplo');
            }
        } catch (error) {
            console.error('Error cargando ejemplo:', error);
            
            // Fallback al ejemplo original
            const sampleTitle = `¡INCREÍBLE! Médicos ocultan cura milagrosa del cáncer`;
            const sampleText = `Los médicos no quieren que sepas este truco secreto que cura el cáncer en solo 3 días. Esta increíble solución natural elimina tumores en 24 horas y está disponible en tu cocina. Miles de médicos están furiosos por este simple truco que podría acabar con la industria médica para siempre. El gobierno oculta esta información porque las farmacéuticas perderían millones. ¡Descubre el secreto que puede salvarte la vida antes de que lo borren!`;

            titleInput.value = sampleTitle;
            textarea.value = sampleText;
            
            titleInput.dispatchEvent(new Event('input'));
            textarea.dispatchEvent(new Event('input'));
        } finally {
            // Restaurar botón
            sampleBtn.innerHTML = originalContent;
            sampleBtn.disabled = false;
        }
    });
}

/**
 * Inicializa el botón limpiar
 */
function initializeClearButton() {
    const clearBtn = document.getElementById('clear-btn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
        const textarea = document.getElementById('news-text');
        const titleInput = document.getElementById('news-title');
        const urlInput = document.getElementById('news-url');
        const urlPreview = document.getElementById('url-preview');
        const resultCard = document.getElementById('result-card');
        
        // Limpiar campos de texto
        if (textarea) {
            textarea.value = '';
            textarea.dispatchEvent(new Event('input'));
        }
        if (titleInput) {
            titleInput.value = '';
            titleInput.dispatchEvent(new Event('input'));
        }
        
        // Limpiar URL input y preview
        if (urlInput) {
            urlInput.value = '';
            urlInput.style.borderColor = '';
        }
        if (urlPreview) {
            urlPreview.classList.add('hidden');
        }
        
        // Volver al modo texto
        if (window.__setInputMode) {
            window.__setInputMode('text');
        }
        
        // Ocultar resultados
        if (resultCard) {
            resultCard.classList.add('hidden');
        }
    });
}

// =====================================================================
// 16. ENTRADA POR VOZ
// =====================================================================

/**
 * Inicializa la funcionalidad de entrada por voz
 */
function initializeVoiceInput() {
    const voiceInputBtn = document.getElementById('voice-input');
    const newsTextarea = document.getElementById('news-text');

    if (!voiceInputBtn || !newsTextarea) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let isListening = false;

        voiceInputBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                isListening = false;
                voiceInputBtn.classList.remove('text-red-400');
                voiceInputBtn.classList.add('text-gray-400');
            } else {
                recognition.start();
                isListening = true;
                voiceInputBtn.classList.remove('text-gray-400');
                voiceInputBtn.classList.add('text-red-400');
            }
        });

        recognition.addEventListener('result', (event) => {
            const transcript = event.results[0][0].transcript;
            newsTextarea.value += transcript + ' ';
            newsTextarea.dispatchEvent(new Event('input'));
        });

        recognition.addEventListener('end', () => {
            isListening = false;
            voiceInputBtn.classList.remove('text-red-400');
            voiceInputBtn.classList.add('text-gray-400');
        });

        recognition.addEventListener('error', (event) => {
            Swal.fire({
                title: 'Error de reconocimiento',
                text: `Ocurrió un error: ${event.error}`,
                icon: 'error',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white'
            });
        });
    } else {
        voiceInputBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'No compatible',
                text: 'Tu navegador no soporta la entrada por voz.',
                icon: 'warning',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white'
            });
        });
    }
}

// =====================================================================
// 17. BOTONES DE ACCIÓN RÁPIDA
// =====================================================================

/**
 * Inicializa los botones de acción rápida
 */
function initializeQuickActions() {
    const imageInput = document.getElementById('image-file');
    const quickUrlBtn = document.getElementById('quick-url-btn');
    const quickFileBtn = document.getElementById('quick-file-btn');
    const quickTextBtn = document.getElementById('quick-text-btn');
    
    // Botón específico para Verificar URL
    if (quickUrlBtn) {
        quickUrlBtn.addEventListener('click', () => {
            if (window.__setInputMode) {
                window.__setInputMode('url');
            }
            const urlInput = document.getElementById('news-url');
            if (urlInput) {
                urlInput.focus();
            }
        });
    }
    
    // Botón para Subir Archivos
    if (quickFileBtn) {
        quickFileBtn.addEventListener('click', () => {
            if (window.__setInputMode) {
                window.__setInputMode('file');
            }
            if (window.__updateInputButton) {
                window.__updateInputButton();
            }
            const newsFile = document.getElementById('news-file');
            if (newsFile) {
                newsFile.click();
            }
        });
    }
    
    // Botón para Analizar Texto
    if (quickTextBtn) {
        quickTextBtn.addEventListener('click', () => {
            if (window.__setInputMode) {
                window.__setInputMode('text');
            }
            if (window.__updateInputButton) {
                window.__updateInputButton();
            }
            setTimeout(() => {
                const textarea = document.getElementById('news-text');
                if (textarea) textarea.focus();
            }, 100);
        });
    }
    
    // Otros botones de acción rápida
    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.querySelector('span')?.textContent?.trim();
            if (action === 'Analizar Imagen') {
                if (window.__setInputMode) window.__setInputMode('image');
                if (window.__updateInputButton) window.__updateInputButton();
                if (imageInput) {
                    imageInput.value = '';
                    imageInput.click();
                }
            }
        });
    });
}

// =====================================================================
// 18. GESTIÓN DEL HISTORIAL
// =====================================================================

/**
 * Renderiza un elemento del historial en la interfaz
 */
function renderHistoryItem(container, entry) {
    const probability = Number(entry.probability) || 0;
    const prediction = entry.prediction || 'Unknown';
    const label = entry.label;
    
    let color = 'yellow-400';
    let title = 'Requiere verificación';
    let statusText = 'dudoso';
    
    // Determinar estilo según predicción
    if (prediction === 'Fake' || label === 1) {
        if (probability >= 90) {
            color = 'red-400';
            title = 'Posible desinformación';
            statusText = 'fake';
        } else if (probability >= 60) {
            color = 'orange-400';
            title = 'Probablemente falso';
            statusText = 'sospechoso';
        } else {
            color = 'yellow-400';
            title = 'Requiere verificación';
            statusText = 'dudoso';
        }
    } else {
        const truePercent = 100 - probability;
        if (truePercent >= 80) {
            color = 'green-400';
            title = 'Noticia verificada';
            statusText = 'verificado';
        } else {
            color = 'blue-400';
            title = 'Parcialmente confiable';
            statusText = 'revisar';
        }
    }

    const snippetRaw = entry.text || '';
    const snippet = snippetRaw.length > 90 ? snippetRaw.slice(0, 87) + '…' : snippetRaw;
    const safeSnippet = sanitizeText(snippet);

    const card = document.createElement('div');
    card.className = 'flex items-center space-x-3 p-3 glass rounded-xl';
    card.innerHTML = `
        <div class="w-3 h-3 bg-${color} rounded-full"></div>
        <div class="flex-1">
            <div class="text-sm font-medium">${title}</div>
            <div class="text-xs text-gray-400">${entry.time || new Date().toLocaleTimeString()} • ${probability}% fake</div>
            <div class="text-xs text-gray-300 mt-1">${safeSnippet}</div>
        </div>
    `;
    container.prepend(card);
}

/**
 * Inicializa la interfaz del historial
 */
function hydrateHistoryUI() {
    const container = getHistoryContainer();
    if (!container) return;
    
    const empty = document.getElementById('empty-history');
    if (empty) empty.classList.remove('hidden');
}

/**
 * Agrega una entrada al historial
 */
function addToHistory(text, result) {
    const container = getHistoryContainer();
    if (!container) {
        console.warn('Contenedor de historial no encontrado (id="history").');
        return;
    }

    const entry = {
        text: text || '',
        probability: Number(result.probability) || 0,
        time: new Date().toLocaleTimeString(),
        prediction: result.prediction || 'Unknown',
        label: result.label
    };

    // Ocultar placeholder si existe
    const empty = document.getElementById('empty-history');
    if (empty) empty.classList.add('hidden');

    // Renderizar en UI
    renderHistoryItem(container, entry);

    // Mantener máximo de elementos
    while (container.children.length > CONFIG.MAX_HISTORY_ITEMS) {
        container.removeChild(container.lastElementChild);
    }
}
