// =====================================================================
// NEWS ANALYZER - SCRIPT PRINCIPAL DE LA APLICACIÓN
// =====================================================================

// =====================================================================
// CONFIGURACIÓN DEL DARK MODE
// =====================================================================
// Dark mode toggle functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const html = document.documentElement;

// Lee preferencia guardada: 'dark' | 'light' | null
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
// =====================================================================
// COMPARTIR Y DESCARGAR REPORTE
// =====================================================================
function setupShareAndDownload() {
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');

    // --- Compartir ---
    if (shareBtn) {
        shareBtn.onclick = function () {
            // Capturar valores en tiempo real
            const title = document.getElementById('result-title')?.textContent || '';
            const badge = document.getElementById('confidence-badge')?.textContent || '';
            const prob = document.getElementById('result-prob')?.textContent || '';
            const description = document.getElementById('result-description')?.textContent || '';
            
            // Obtener el contenido extraído más reciente
            let preview = '';
            if (window.currentExtractedPreview) {
                preview = window.currentExtractedPreview;
            } else {
                // Fallback a los elementos del DOM
                preview = document.getElementById('url-preview-content')?.textContent || 
                         document.getElementById('news-text')?.value || '';
            }
            
            const shareText = `📰 TruthLens\n\nResultado: ${title} (${badge})\nConfianza: ${prob}\n\n${description}\n\nExtracto:\n${preview}`;
            if (navigator.share) {
                navigator.share({
                    title: 'Reporte TruthLens',
                    text: shareText
                }).catch(() => {});
            } else {
                // Fallback: copiar al portapapeles
                navigator.clipboard.writeText(shareText).then(() => {
                    Swal.fire({
                        title: 'Copiado',
                        text: 'Reporte copiado al portapapeles.',
                        icon: 'success',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white'
                    });
                });
            }
        };
    }

    // --- Descargar ---
    if (downloadBtn) {
        downloadBtn.onclick = function () {
            // Capturar valores en tiempo real
            const title = document.getElementById('result-title')?.textContent || '';
            const badge = document.getElementById('confidence-badge')?.textContent || '';
            const prob = document.getElementById('result-prob')?.textContent || '';
            const description = document.getElementById('result-description')?.textContent || '';
            
            // Obtener el contenido extraído más reciente
            let preview = '';
            if (window.currentExtractedPreview) {
                preview = window.currentExtractedPreview;
            } else {
                // Fallback a los elementos del DOM
                preview = document.getElementById('url-preview-content')?.textContent || 
                         document.getElementById('news-text')?.value || '';
            }
            
            // Incluir información de debug si está disponible
            let debugInfo = '';
            if (window.currentDebugInfo && window.currentPredictionInfo) {
                debugInfo = `\n\nInformación de Debug:\n` +
                           `- Método: ${window.currentDebugInfo.extraction_method || 'Desconocido'}\n` +
                           `- Predicción BERT: ${window.currentDebugInfo.bert_says || 'N/A'}\n` +
                           `- Confianza: ${window.currentPredictionInfo.confidence || 0}%\n` +
                           `- Prob. Fake: ${(window.currentDebugInfo.probability_fake * 100).toFixed(1)}%\n` +
                           `- Prob. Real: ${(window.currentDebugInfo.probability_true * 100).toFixed(1)}%`;
            }
            
            const report = `Reporte TruthLens\n====================\n\nResultado: ${title} (${badge})\nConfianza: ${prob}\n\n${description}\n\nExtracto:\n${preview}${debugInfo}\n\nFecha: ${new Date().toLocaleString()}`;
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_truthlens.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        };
    }
}

// =====================================================================
// PANEL DE DEBUG
// =====================================================================
function setupDebugButton() {
    const debugBtn = document.getElementById('debug-btn');
    const debugPanel = document.getElementById('debug-panel');
    const debugContent = document.getElementById('debug-content');

    if (!debugBtn || !debugPanel || !debugContent) return;

    debugBtn.onclick = function () {
        const isVisible = !debugPanel.classList.contains('hidden');
        
        if (isVisible) {
            debugPanel.classList.add('hidden');
            debugBtn.innerHTML = '<i class="fas fa-code"></i><span>Ver Debug</span>';
        } else {
            // Mostrar información de debug
            const debugInfo = window.currentDebugInfo || {};
            const predInfo = window.currentPredictionInfo || {};
            
            // Detectar tipo de análisis
            const analysisType = debugInfo.extraction_method || 'Texto Manual';
            const isUrl = analysisType === 'URL Scraping';
            const isOcr = analysisType === 'OCR';
            
            let debugHtml = `
                <div class="text-yellow-400 font-bold mb-2">📊 RESULTADOS DEL MODELO:</div>
                <div>• Predicción: <span class="text-white">${predInfo.prediction || 'N/A'}</span></div>
                <div>• Confianza: <span class="text-white">${(predInfo.confidence || 0)}%</span></div>
                <div>• Probabilidad Fake: <span class="text-white">${(predInfo.fakePercent || 0)}%</span></div>
                <div>• Label: <span class="text-white">${predInfo.label}</span></div>
                
                <div class="text-yellow-400 font-bold mt-4 mb-2">🔍 DEBUG INTERNO:</div>
                <div>• BERT dice: <span class="text-white">${debugInfo.bert_says || 'N/A'}</span></div>
                <div>• Decisión final: <span class="text-white">${debugInfo.final_decision || 'N/A'}</span></div>
                <div>• Umbral usado: <span class="text-white">${debugInfo.threshold_used || 'N/A'}</span></div>
                <div>• Confianza decisión: <span class="text-white">${debugInfo.decision_confidence || 'N/A'}</span></div>
                <div>• Calibración aplicada: <span class="text-white">${debugInfo.calibration_applied || 'N/A'}</span></div>
                
                <div class="text-yellow-400 font-bold mt-4 mb-2">💡 RECOMENDACIÓN:</div>
                <div class="text-white">${debugInfo.recommendation || 'N/A'}</div>
                
                <div class="text-yellow-400 font-bold mt-4 mb-2">📏 LONGITUDES:</div>
                <div>• Título: <span class="text-white">${debugInfo.title_length || 0} chars</span></div>
                <div>• Contenido: <span class="text-white">${debugInfo.text_length || 0} chars</span></div>
                <div>• Total: <span class="text-white">${debugInfo.combined_length || 0} chars</span></div>
            `;
            
            // Información específica según el tipo de análisis
            if (isUrl) {
                debugHtml += `
                    <div class="text-yellow-400 font-bold mt-4 mb-2">🌐 ANÁLISIS POR URL:</div>
                    <div>• Contenido original: <span class="text-white">${debugInfo.original_content_length || 0} chars</span></div>
                    <div>• Contenido truncado: <span class="text-white">${debugInfo.truncated_content_length || 0} chars</span></div>
                    <div>• Truncado aplicado: <span class="text-white">${debugInfo.truncation_applied ? 'SÍ' : 'NO'}</span></div>
                    <div>• Optimización: <span class="text-white">${debugInfo.optimization_applied || 'N/A'}</span></div>
                `;
            } else if (isOcr) {
                debugHtml += `
                    <div class="text-yellow-400 font-bold mt-4 mb-2">📸 ANÁLISIS POR IMAGEN (OCR):</div>
                    <div>• Método extracción: <span class="text-white">OCR.space API</span></div>
                    <div>• Texto detectado: <span class="text-white">${debugInfo.text_length || 0} chars</span></div>
                    <div>• Vista previa: <span class="text-white">${debugInfo.text_preview || 'N/A'}</span></div>
                `;
            } else if (analysisType === 'Archivo subido') {
                debugHtml += `
                    <div class="text-yellow-400 font-bold mt-4 mb-2">📄 ANÁLISIS POR ARCHIVO:</div>
                    <div>• ${debugInfo.file_info ? `<span class="text-white">${debugInfo.file_info}</span>` : '<span class="text-white">Información no disponible</span>'}</div>
                    <div>• Título extraído: <span class="text-white">${debugInfo.title_length || 0} chars</span></div>
                    <div>• Contenido extraído: <span class="text-white">${debugInfo.text_length || 0} chars</span></div>
                    <div>• Separación automática: <span class="text-white">Título + Contenido</span></div>
                `;
            } else {
                debugHtml += `
                    <div class="text-yellow-400 font-bold mt-4 mb-2">✍️ ANÁLISIS MANUAL:</div>
                    <div>• Tipo entrada: <span class="text-white">Texto directo</span></div>
                    <div>• Separación título/contenido: <span class="text-white">SÍ</span></div>
                `;
            }
            
            debugContent.innerHTML = debugHtml;
            
            debugPanel.classList.remove('hidden');
            debugBtn.innerHTML = '<i class="fas fa-times"></i><span>Ocultar Debug</span>';
        }
    };
}

darkModeToggle.addEventListener('change', function () {
    if (this.checked) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
});

// =====================================================================
// CONFIGURACIÓN Y CONSTANTES
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
// VARIABLES GLOBALES
// =====================================================================
let INPUT_MODE = 'text'; // 'text' | 'file' | 'image' | 'url'

// =====================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================================
function initializeApplication() {
    initializePreloader(); // <- añadir
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
}
// Preloader (1s y fade-out)
function initializePreloader() {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    // Espera 1s y aplica fade-out; luego quita del flujo
    setTimeout(() => {
        pre.classList.add('fade-out');
        setTimeout(() => { pre.style.display = 'none'; }, 450);
    }, 1000);
}

document.addEventListener('DOMContentLoaded', initializeApplication);

// =====================================================================
// FUNCIONES DE UTILIDAD
// =====================================================================
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getHistoryContainer() {
    return document.getElementById('history');
}

function loadHistoryFromStorage() {
    // Sin persistencia: siempre vacío
    return [];
}

function saveHistoryToStorage(history) {
    // Sin persistencia: no hacer nada
}

// =====================================================================
// SISTEMA DE PARTÍCULAS
// =====================================================================
function createParticles() {
    const particles = document.getElementById('particles');
    const particleCount = CONFIG.PARTICLE_COUNT;

    for (let i = 0; i < particleCount; i++) {
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
// FUNCIONALIDAD DE LA BARRA LATERAL
// =====================================================================
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    // Funcionalidad de alternar barra lateral
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    // Clic en overlay para cerrar barra lateral
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Elementos de navegación de la barra lateral
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// =====================================================================
// FUNCIONALIDAD DEL CONTADOR DE CARACTERES
// =====================================================================
function initializeCharacterCounter() {
    const textarea = document.getElementById('news-text');
    const titleInput = document.getElementById('news-title');
    const charCount = document.getElementById('char-count');

    function updateCounter() {
        const textCount = textarea.value.length;
        const titleCount = titleInput.value.length;
        const totalCount = textCount + titleCount;
        
        charCount.textContent = totalCount.toLocaleString();

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
// FUNCIONALIDAD DE ANÁLISIS DE TEXTO
// =====================================================================
async function analyzeText() {
    const loading = document.getElementById('loading');
    const resultCard = document.getElementById('result-card');
    const textarea = document.getElementById('news-text');
    const titleInput = document.getElementById('news-title');
    const newsFile = document.getElementById('news-file');
    const imageFile = document.getElementById('image-file');
    const urlInput = document.getElementById('news-url');

    // Limpiar datos de análisis anterior
    window.currentDebugInfo = {};
    window.currentPredictionInfo = {};
    window.currentExtractedPreview = '';

    // Cerrar panel de debug automáticamente al iniciar nuevo análisis
    const debugPanel = document.getElementById('debug-panel');
    const debugBtn = document.getElementById('debug-btn');
    if (debugPanel && debugBtn) {
        debugPanel.classList.add('hidden');
        debugBtn.innerHTML = '<i class="fas fa-code"></i><span>Ver Debug</span>';
    }

    let response, payload;
    // Datos de contexto para decidir qué guardar en historial
    let ctx = { typedText: '', typedTitle: '', file: null, img: null, url: '' };

    loading.classList.remove('hidden');
    resultCard.classList.add('hidden');

    try {
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
            // Modo texto: enviar título y contenido por separado
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

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error en el servidor');
        }
        payload = await response.json();

        const percent = Math.round((payload.probability || 0) * 100);
        
        // CORRECCIÓN: payload.probability es la probabilidad de ser FAKE
        // Para la visualización necesitamos probabilidad de ser VERDADERO
        const fakePercent = percent;
        const truePercent = 100 - percent;

        // Guardar información de debug para mostrar
        window.currentDebugInfo = payload.debug_info || {};
        window.currentPredictionInfo = {
            prediction: payload.prediction,
            label: payload.label,
            confidence: Math.round((payload.confidence || 0) * 100),  // Convertir a porcentaje
            fakePercent: fakePercent,
            truePercent: truePercent
        };
        
        // Guardar el contenido extraído para exportar
        if (payload.extracted_preview) {
            window.currentExtractedPreview = payload.extracted_preview;
        } else if (payload.text) {
            window.currentExtractedPreview = payload.text;
        } else if (INPUT_MODE === 'text') {
            // Para texto manual, combinar título y contenido
            const title = titleInput?.value || '';
            const text = textarea?.value || '';
            window.currentExtractedPreview = title ? `${title}\n\n${text}` : text;
        } else {
            window.currentExtractedPreview = 'Contenido analizado';
        }

        displayResults({
            fakePercent: fakePercent,
            truePercent: truePercent,
            prediction: payload.prediction || 'Unknown',
            label: payload.label,
            sentiment: payload.label === 1 ? 'Negativo' : 'Positivo',
            riskLevel: payload.label === 1 ? 'Alto' : 'Bajo',
            mlScore: payload.probability || 0,
            confidence: Math.round((payload.confidence || 0) * 100)  // Convertir a porcentaje
        });

        // Si es imagen, volcar el texto extraído al textarea
        if (INPUT_MODE === 'image' && payload.text) {
            textarea.value = payload.text;
            textarea.dispatchEvent(new Event('input'));
        }

        // Si es URL, mostrar preview del contenido extraído
        if (INPUT_MODE === 'url' && payload.extracted_preview) {
            const preview = document.getElementById('url-preview');
            const previewContent = document.getElementById('url-preview-content');
            if (preview && previewContent) {
                previewContent.textContent = payload.extracted_preview;
                preview.classList.remove('hidden');
            }
        }

        // Decidir el texto que se guarda en el historial
        let historyText = '';
        if (INPUT_MODE === 'text') {
            // Combinar título y contenido para el historial
            historyText = ctx.typedTitle ? `${ctx.typedTitle}: ${ctx.typedText}`.trim() : ctx.typedText;
        } else if (INPUT_MODE === 'file') {
            historyText = payload.extracted_preview || (ctx.file?.name || 'Archivo analizado');
        } else if (INPUT_MODE === 'image') {
            historyText = payload.extracted_preview || payload.text || (ctx.img?.name || 'Imagen analizada');
        } else if (INPUT_MODE === 'url') {
            historyText = payload.article_data?.title || ctx.url || 'URL analizada';
        }
        addToHistory(historyText, { 
            probability: fakePercent, 
            prediction: payload.prediction,
            label: payload.label 
        });
    } catch (e) {
        Swal.fire({
            title: 'Error',
            text: e.message || 'No se pudo completar el análisis.',
            icon: 'error',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
        });
    } finally {
        loading.classList.add('hidden');
        resultCard.classList.remove('hidden');
    }
}

function initializeAnalysisControls() {
    const analyzeBtn = document.getElementById('analyze-btn');
    
    // Mostrar animación de carga mientras se analiza la noticia
    analyzeBtn.addEventListener('click', analyzeText);
}

// =====================================================================
// MODO DE CARGA DE ARCHIVOS
// =====================================================================
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

    function updateButton() {
        if (INPUT_MODE === 'text') {
            fileBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Subir Archivo';
        } else {
            fileBtn.innerHTML = '<i class="fas fa-keyboard mr-2"></i>Analizar texto';
        }
    }
    
    function setMode(mode) {
        INPUT_MODE = mode;
        textMode.classList.toggle('hidden', mode !== 'text');
        textMode.classList.toggle('block', mode === 'text');
        fileMode.classList.toggle('hidden', mode !== 'file');
        imageMode.classList.toggle('hidden', mode !== 'image');
        if (urlMode) urlMode.classList.toggle('hidden', mode !== 'url');
        updateButton();
    }
    
    // Exponer para otros inicializadores
    window.__setInputMode = setMode;
    window.__updateInputButton = updateButton;

    // Toggle con el botón
    fileBtn.addEventListener('click', () => {
        if (INPUT_MODE === 'text') {
            setMode('file');
            newsFile.value = '';
            fileInfo.classList.add('hidden');
            // Abrir selector al entrar a modo archivo
            setTimeout(() => newsFile.click(), 0);
        } else {
            // Volver a texto desde archivo, imagen o URL
            setMode('text');
        }
    });

    // Dropzones (click)
    fileDrop?.addEventListener('click', () => newsFile.click());
    imageDrop?.addEventListener('click', () => imageFile.click());

    // Funciones auxiliares para Drag & Drop
    function wireDnD(dropEl, onFile) {
        if (!dropEl) return;
        ['dragenter', 'dragover'].forEach(e =>
            dropEl.addEventListener(e, ev => { ev.preventDefault(); dropEl.classList.add('border-purple-500'); })
        );
        ['dragleave', 'drop'].forEach(e =>
            dropEl.addEventListener(e, ev => { ev.preventDefault(); dropEl.classList.remove('border-purple-500'); })
        );
        dropEl.addEventListener('drop', ev => {
            const dtFile = ev.dataTransfer?.files?.[0];
            if (dtFile) onFile(dtFile);
        });
    }
    
    wireDnD(fileDrop, (f) => {
        newsFile.files = new DataTransfer().files; // reset
        // No se puede asignar File directamente a input; pedimos al usuario usar click
        Swal.fire({ title: 'Archivo detectado', text: 'Usa clic para seleccionar el archivo.', icon: 'info', background: 'rgba(0,0,0,0.8)', color: 'white' });
    });
    
    wireDnD(imageDrop, (f) => {
        imageFile.files = new DataTransfer().files; // reset
        Swal.fire({ title: 'Imagen detectada', text: 'Usa clic para seleccionar la imagen.', icon: 'info', background: 'rgba(0,0,0,0.8)', color: 'white' });
    });

    // Mostrar info seleccionada
    newsFile.addEventListener('change', () => {
        const f = newsFile.files?.[0];
        if (f) {
            fileInfo.textContent = `${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`;
            fileInfo.classList.remove('hidden');
        } else {
            fileInfo.classList.add('hidden');
        }
    });
    
    imageFile.addEventListener('change', () => {
        const f = imageFile.files?.[0];
        if (f) {
            imageInfo.textContent = `${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`;
            imageInfo.classList.remove('hidden');
        } else {
            imageInfo.classList.add('hidden');
        }
    });

    // Estado inicial
    setMode('text');
}

// =====================================================================
// MODO URL
// =====================================================================
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
                urlInput.style.borderColor = '#f59e0b'; // amarillo de advertencia
            } else {
                urlInput.style.borderColor = ''; // resetear
            }
        });
    }
}

// =====================================================================
// FUNCIONALIDAD DE TEXTO DE EJEMPLO
// =====================================================================
function initializeSampleText() {
    document.getElementById('sample-btn').addEventListener('click', () => {
        const textarea = document.getElementById('news-text');
        const titleInput = document.getElementById('news-title');
        
        const sampleTitle = `¡INCREÍBLE! Médicos ocultan cura milagrosa del cáncer`;
        const sampleText = `Los médicos no quieren que sepas este truco secreto que cura el cáncer en solo 3 días. Esta increíble solución natural elimina tumores en 24 horas y está disponible en tu cocina. Miles de médicos están furiosos por este simple truco que podría acabar con la industria médica para siempre. El gobierno oculta esta información porque las farmacéuticas perderían millones. ¡Descubre el secreto que puede salvarte la vida antes de que lo borren!`;

        titleInput.value = sampleTitle;
        textarea.value = sampleText;
        
        titleInput.dispatchEvent(new Event('input'));
        textarea.dispatchEvent(new Event('input'));
    });
}

// =====================================================================
// FUNCIONALIDAD DE BOTÓN LIMPIAR
// =====================================================================
function initializeClearButton() {
    document.getElementById('clear-btn').addEventListener('click', () => {
        const textarea = document.getElementById('news-text');
        const titleInput = document.getElementById('news-title');
        const urlInput = document.getElementById('news-url');
        const urlPreview = document.getElementById('url-preview');
        const resultCard = document.getElementById('result-card');
        
        // Limpiar campos de texto
        textarea.value = '';
        titleInput.value = '';
        textarea.dispatchEvent(new Event('input'));
        titleInput.dispatchEvent(new Event('input'));
        
        // Limpiar URL input y preview
        if (urlInput) {
            urlInput.value = '';
            urlInput.style.borderColor = '';
        }
        if (urlPreview) {
            urlPreview.classList.add('hidden');
        }
        
        // Ocultar resultados
        resultCard.classList.add('hidden');
    });
}

// =====================================================================
// VISUALIZACIÓN DE RESULTADOS
// =====================================================================
function displayResults(results) {
    const title = document.getElementById('result-title');
    const badge = document.getElementById('confidence-badge');
    const prob = document.getElementById('result-prob');
    const fill = document.getElementById('confidence-fill');
    const description = document.getElementById('result-description');
    const mlScore = document.getElementById('ml-score');
    const sentiment = document.getElementById('sentiment');
    const riskLevel = document.getElementById('risk-level');

    const fakePercent = results.fakePercent || 0;
    const prediction = results.prediction || 'Unknown';
    
    // Lógica correcta: usar la predicción del modelo directamente
    if (prediction === 'Fake' || results.label === 1) {
        // ES FAKE NEWS
        if (fakePercent >= 90) {
            title.textContent = 'Posible Desinformación';
            title.className = 'text-2xl font-bold text-red-400';
            badge.textContent = 'FALSO';
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold bg-red-500 bg-opacity-20 text-red-400';
            description.textContent = 'El análisis detectó múltiples indicadores de desinformación. Se recomienda extrema precaución.';
            fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (fakePercent >= 60) {
            title.textContent = 'Probablemente Falso';
            title.className = 'text-2xl font-bold text-orange-400';
            badge.textContent = 'SOSPECHOSO';
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold bg-orange-500 bg-opacity-20 text-orange-400';
            description.textContent = 'El contenido presenta características típicas de desinformación. Verificar con fuentes confiables.';
            fill.style.background = 'linear-gradient(90deg, #f97316, #ea580c)';
        } else {
            title.textContent = 'Requiere Verificación';
            title.className = 'text-2xl font-bold text-yellow-400';
            badge.textContent = 'DUDOSO';
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold bg-yellow-500 bg-opacity-20 text-yellow-400';
            description.textContent = 'El modelo detectó señales mixtas. Se recomienda verificar con fuentes adicionales.';
            fill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        }
    } else {
        // ES VERDADERO
        const truePercent = results.truePercent || (100 - fakePercent);
        if (truePercent >= 80) {
            title.textContent = 'Contenido Confiable';
            title.className = 'text-2xl font-bold text-green-400';
            badge.textContent = 'VERIFICADO';
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold bg-green-500 bg-opacity-20 text-green-400';
            description.textContent = 'El análisis indica que este contenido presenta características de información confiable y verificable.';
            fill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else {
            title.textContent = 'Parcialmente Confiable';
            title.className = 'text-2xl font-bold text-blue-400';
            badge.textContent = 'REVISAR';
            badge.className = 'px-4 py-2 rounded-full text-sm font-bold bg-blue-500 bg-opacity-20 text-blue-400';
            description.textContent = 'El contenido parece legítimo pero presenta algunas inconsistencias menores.';
            fill.style.background = 'linear-gradient(90deg, #3b82f6, #2563eb)';
        }
    }

    // Mostrar el nivel de confianza del modelo (no la probabilidad de fake)
    prob.textContent = (results.confidence || 0) + '%';
    fill.style.width = (results.confidence || 0) + '%';
    mlScore.textContent = (results.mlScore || 0).toFixed(3);
    sentiment.textContent = results.sentiment || 'Neutro';
    riskLevel.textContent = results.riskLevel || 'Medio';

    // Llamar a la función de compartir/descargar solo cuando hay resultado
    setupShareAndDownload();
    setupDebugButton();
}

// =====================================================================
// FUNCIONALIDAD DE ENTRADA POR VOZ
// =====================================================================
function initializeVoiceInput() {
    const voiceInputBtn = document.getElementById('voice-input');
    const newsTextarea = document.getElementById('news-text');

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'es-ES'; // Configurar el idioma a español
        recognition.interimResults = false; // Solo resultados finales
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
// BOTONES DE ACCIÓN RÁPIDA
// =====================================================================
function initializeQuickActions() {
    const imageInput = document.getElementById('image-file');
    const quickUrlBtn = document.getElementById('quick-url-btn');
    
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
    
    // Otros botones de acción rápida
    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.querySelector('span')?.textContent?.trim();
            if (action === 'Analizar Imagen') {
                // Cambiar al modo imagen y abrir selector
                if (window.__setInputMode) window.__setInputMode('image');
                if (window.__updateInputButton) window.__updateInputButton();
                imageInput.value = '';
                imageInput.click();
            }
        });
    });
}

// =====================================================================
// GESTIÓN DEL HISTORIAL
// =====================================================================
function renderHistoryItem(container, entry) {
    const probability = Number(entry.probability) || 0;
    const prediction = entry.prediction || 'Unknown';
    const label = entry.label;
    
    let color = 'yellow-400';
    let title = 'Requiere verificación';
    let statusText = 'dudoso';
    
    // Usar la misma lógica que displayResults
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

function hydrateHistoryUI() {
    // Sin persistencia: solo asegurar placeholder visible al inicio
    const container = getHistoryContainer();
    if (!container) return;
    const empty = document.getElementById('empty-history');
    if (empty) empty.classList.remove('hidden');
}

function addToHistory(text, result) {
    const container = getHistoryContainer();
    if (!container) {
        console.warn('Contenedor de historial no encontrado (id="history").');
        return;
    }

    const entry = {
        text: text || '',
        probability: Number(result.probability) || 0,
        time: new Date().toLocaleTimeString()
    };

    // Ocultar placeholder si existe
    const empty = document.getElementById('empty-history');
    if (empty) empty.classList.add('hidden');

    // Pintar en UI
    renderHistoryItem(container, entry);

    // Mantener máximo 15 tarjetas en UI
    while (container.children.length > CONFIG.MAX_HISTORY_ITEMS) {
        container.removeChild(container.lastElementChild);
    }
}
