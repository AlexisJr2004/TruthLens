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

    // --- Descargar (PDF profesional) ---
    if (downloadBtn) {
        downloadBtn.onclick = function () {
            (async function () {
                try {
                    // Capturar valores en tiempo real
                    const title = document.getElementById('result-title')?.textContent || '';
                    const badge = document.getElementById('confidence-badge')?.textContent || '';
                    const prob = document.getElementById('result-prob')?.textContent || '';
                    const description = document.getElementById('result-description')?.textContent || '';

                    // Obtener el contenido extraído más reciente (preview)
                    let preview = '';
                    if (window.currentExtractedPreview) {
                        preview = window.currentExtractedPreview;
                    } else {
                        preview = document.getElementById('url-preview-content')?.textContent || 
                                document.getElementById('news-text')?.value || '';
                    }

                    // Info de debug / predicción
                    const debugInfo = window.currentDebugInfo || {};
                    const predInfo = window.currentPredictionInfo || {};

                    // Helper: formatea la info de debug/predicción en texto profesional
                    function formatDebug(debugObj, predObj) {
                        let out = '';
                        if (predObj && Object.keys(predObj).length) {
                            out += `ANÁLISIS PREDICTIVO\n`;
                            out += `═══════════════════════════════════════════════════\n\n`;
                            out += `• Resultado de la predicción: ${predObj.prediction || 'N/A'}\n`;
                            out += `• Nivel de confianza: ${predObj.confidence || 0}%\n`;
                            out += `• Probabilidad de fake news: ${predObj.fakePercent || 0}%\n`;
                            out += `• Probabilidad de noticia real: ${predObj.truePercent || 0}%\n`;
                            out += `• Etiqueta clasificatoria: ${predObj.label || 'N/A'}\n\n`;
                        }

                        if (debugObj && Object.keys(debugObj).length) {
                            out += `METADATOS TÉCNICOS\n`;
                            out += `═══════════════════════════════════════════════════\n\n`;
                            out += `• Método de extracción: ${debugObj.extraction_method || 'Desconocido'}\n`;
                            out += `• Análisis BERT: ${debugObj.bert_says || 'N/A'}\n`;
                            out += `• Decisión final: ${debugObj.final_decision || 'N/A'}\n`;
                            out += `• Umbral aplicado: ${debugObj.threshold_used || 'N/A'}\n`;
                            out += `• Confianza de decisión: ${debugObj.decision_confidence || 'N/A'}\n`;
                            out += `• Calibración aplicada: ${debugObj.calibration_applied ? 'SÍ' : 'NO'}\n`;
                            if (debugObj.recommendation) out += `• Recomendación: ${debugObj.recommendation}\n`;

                            out += `\nESTADÍSTICAS DEL CONTENIDO\n`;
                            out += `═══════════════════════════════════════════════════\n\n`;
                            out += `• Longitud del título: ${debugObj.title_length || 0} caracteres\n`;
                            out += `• Longitud del contenido: ${debugObj.text_length || 0} caracteres\n`;
                            out += `• Longitud total combinada: ${debugObj.combined_length || 0} caracteres\n`;

                            if (debugObj.truncation_applied !== undefined) {
                                out += `\nPROCESAMIENTO APLICADO\n`;
                                out += `═══════════════════════════════════════════════════\n\n`;
                                out += `• Truncado aplicado: ${debugObj.truncation_applied ? 'SÍ' : 'NO'}\n`;
                                out += `• Longitud original: ${debugObj.original_content_length || 'N/A'}\n`;
                                out += `• Longitud truncada: ${debugObj.truncated_content_length || 'N/A'}\n`;
                                if (debugObj.optimization_applied) out += `• Optimización: ${debugObj.optimization_applied}\n`;
                            }

                            if (debugObj.text_preview) {
                                out += `\nEXTRACCIÓN OCR\n`;
                                out += `═══════════════════════════════════════════════════\n\n`;
                                out += `${debugObj.text_preview}\n`;
                            }
                        }

                        return out || 'No hay información técnica disponible en este momento.';
                    }

                    // Construir contenedor de reporte profesional (SIN MARCA DE AGUA)
                    const reportEl = document.createElement('div');
                    reportEl.style.boxSizing = 'border-box';
                    reportEl.style.width = '700px';
                    reportEl.style.padding = '25px 30px';
                    reportEl.style.fontFamily = "'Arial', sans-serif";
                    reportEl.style.fontSize = '11px';
                    reportEl.style.color = '#1a1a1a';
                    reportEl.style.background = '#ffffff';
                    reportEl.style.lineHeight = '1.3';
                    reportEl.style.letterSpacing = '0.1px';
                    reportEl.style.position = 'relative';

                    // Detectar color desde el badge para elementos acentuados
                    let badgeColor = '#2c3e50';
                    const badgeEl = document.getElementById('confidence-badge');
                    if (badgeEl) {
                        badgeColor = window.getComputedStyle(badgeEl).backgroundColor || '#2c3e50';
                    }

                    // Paleta corporativa profesional
                    const colorMap = {
                        'rgb(244, 67, 54)': '#c0392b', // Rojo corporativo
                        'rgb(76, 175, 80)': '#27ae60', // Verde corporativo
                        'rgb(33, 150, 243)': '#2980b9', // Azul corporativo
                        'rgb(255, 193, 7)': '#d35400' // Ámbar corporativo
                    };

                    if (colorMap[badgeColor]) {
                        badgeColor = colorMap[badgeColor];
                    }

                    // Función de escape
                    const esc = typeof sanitizeText === 'function' ? sanitizeText : (s) => {
                        const d = document.createElement('div');
                        d.textContent = s;
                        return d.innerHTML;
                    };

                    const currentDate = new Date();
                    const formattedDate = currentDate.toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // HTML SIN marca de agua (para que no aparezca en la web)
                    reportEl.innerHTML = `
                        <!-- Letterhead Professional -->
                        <div style="border-bottom: 2px solid #bdc3c7; padding-bottom: 15px; margin-bottom: 20px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="width: 70%; vertical-align: top;">
                                        <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #2c3e50; 
                                                font-family: Arial, sans-serif; letter-spacing: 1px;">TRUTHLENS AI</h1>
                                        <div style="font-size: 10px; color: #7f8c8d; margin-top: 3px; font-style: italic;">
                                            Sistema de Verificación de Contenidos
                                        </div>
                                    </td>
                                    <td style="text-align: right; vertical-align: top;">
                                        <div style="font-size: 9px; color: #95a5a6; line-height: 1.2;">
                                            <div>Reporte ID: TL-${currentDate.getFullYear()}${(currentDate.getMonth()+1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                                            <div>${formattedDate}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Executive Summary -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="font-size: 14px; font-weight: 600; color: #2c3e50; margin: 0 0 12px 0; 
                                    border-left: 3px solid ${badgeColor}; padding-left: 10px; 
                                    text-transform: uppercase; letter-spacing: 0.5px;">
                                Resumen Ejecutivo
                            </h2>
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                                <tr>
                                    <td style="width: 30%; vertical-align: top; padding: 8px 0; font-weight: 600; 
                                            color: #34495e; font-size: 10px;">Estado del Análisis:</td>
                                    <td style="padding: 8px 0;">
                                        <span style="background: ${badgeColor}; color: white; padding: 4px 10px; 
                                                    border-radius: 2px; font-size: 10px; font-weight: 600; 
                                                    letter-spacing: 0.3px;">${esc(badge)}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="vertical-align: top; padding: 6px 0; font-weight: 600; 
                                            color: #34495e; font-size: 10px;">Nivel de Confianza:</td>
                                    <td style="padding: 6px 0; color: ${badgeColor}; font-weight: 500; 
                                            font-size: 11px;">${esc(prob)}</td>
                                </tr>
                                <tr>
                                    <td style="vertical-align: top; padding: 6px 0; font-weight: 600; 
                                            color: #34495e; font-size: 10px;">Título Analizado:</td>
                                    <td style="padding: 6px 0; font-size: 11px;">${esc(title)}</td>
                                </tr>
                            </table>
                            <div style="background: #f8f9fa; padding: 15px; border-left: 3px solid ${badgeColor}; 
                                    margin-top: 10px;">
                                <div style="font-size: 11px; color: #2c3e50; font-style: italic; line-height: 1.3;">
                                    "${esc(description)}"
                                </div>
                            </div>
                        </div>

                        <!-- Content Analysis -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="font-size: 14px; font-weight: 600; color: #2c3e50; margin: 0 0 10px 0; 
                                    border-left: 3px solid ${badgeColor}; padding-left: 10px; 
                                    text-transform: uppercase; letter-spacing: 0.5px;">
                                Contenido Verificado
                            </h2>
                            <div style="background: #fafbfc; border: 1px solid #e1e4e8; padding: 15px;">
                                <div style="font-size: 10px; color: #6a737d; margin-bottom: 8px; font-weight: 600;">
                                    EXTRACTO DEL CONTENIDO ORIGINAL
                                </div>
                                <pre style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; 
                                        max-width: 100%; max-height: 180px; overflow: auto; margin: 0; 
                                        font-family: 'Courier New', monospace; font-size: 9px; line-height: 1.2; 
                                        color: #24292e; background: transparent; border: none; padding: 0;">${esc(preview)}</pre>
                            </div>
                        </div>

                        <!-- Technical Specifications -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="font-size: 14px; font-weight: 600; color: #2c3e50; margin: 0 0 10px 0; 
                                    border-left: 3px solid ${badgeColor}; padding-left: 10px; 
                                    text-transform: uppercase; letter-spacing: 0.5px;">
                                Especificaciones Técnicas
                            </h2>
                            <div style="background: #fafbfc; border: 1px solid #e1e4e8; padding: 15px;">
                                <div style="font-size: 10px; color: #6a737d; margin-bottom: 8px; font-weight: 600;">
                                    DATOS DEL PROCESO DE ANÁLISIS
                                </div>
                                <pre style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; 
                                        max-width: 100%; margin: 0; font-family: 'Courier New', monospace; 
                                        font-size: 8px; line-height: 1.1; color: #24292e; background: transparent; 
                                        border: none; padding: 0;">${esc(formatDebug(debugInfo, predInfo))}</pre>
                            </div>
                        </div>

                        <!-- Signature Section -->
                        <div style="margin-bottom: 30px; margin-top: 35px;">
                            <h2 style="font-size: 14px; font-weight: 600; color: #2c3e50; margin: 0 0 15px 0; 
                                    border-left: 3px solid ${badgeColor}; padding-left: 10px; 
                                    text-transform: uppercase; letter-spacing: 0.5px;">
                                Autorización y Responsabilidad
                            </h2>
                            <div style="text-align: center; padding: 25px 0; border: 1px solid #e1e4e8; 
                                    background: #fafbfc; margin-top: 20px;">
                                <div style="border-top: 1px solid #2c3e50; width: 250px; margin: 0 auto 15px auto;"></div>
                                <div style="font-size: 12px; font-weight: 600; color: #2c3e50; margin-bottom: 3px; 
                                        text-transform: uppercase; letter-spacing: 0.8px;">
                                    ${(() => {
                                        const responsables = [
                                            'Javier Omar Haro Soledispa',
                                            'Steven Alexander Nieto Durán', 
                                            'Marcelo Alberto Romero Jara',
                                            'César Josué Quevedo Macay'
                                        ];
                                        const randomIndex = Math.floor(Math.random() * responsables.length);
                                        return responsables[randomIndex];
                                    })()}
                                </div>
                                <div style="font-size: 10px; color: #7f8c8d; margin-bottom: 3px;">
                                    C.I: 0956847312
                                </div>
                                <div style="font-size: 11px; font-weight: 600; color: #34495e; 
                                        text-transform: uppercase; letter-spacing: 1px;">
                                    Director de Análisis de Credibilidad
                                </div>
                                <div style="font-size: 9px; color: #95a5a6; margin-top: 5px; 
                                        font-style: italic;">
                                    TruthLens AI - División de Verificación Digital
                                </div>
                            </div>

                            <br><br><br>
                            
                            <!-- Disclaimer profesional -->
                            <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; 
                                    border-left: 3px solid #e74c3c; font-size: 8px; color: #34495e; 
                                    line-height: 1.4;">
                                <div style="font-weight: 600; margin-bottom: 5px; color: #e74c3c; 
                                        text-transform: uppercase; letter-spacing: 0.5px;">
                                    Aviso Legal y Limitaciones
                                </div>
                                Este reporte ha sido generado mediante inteligencia artificial y algoritmos de procesamiento de lenguaje natural. 
                                Los resultados representan un análisis probabilístico basado en patrones detectados en el contenido analizado. 
                                Se recomienda corroborar la información a través de fuentes adicionales y ejercer criterio periodístico independiente. 
                                TruthLens AI no se responsabiliza por decisiones editoriales basadas únicamente en este análisis automatizado.
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="border-top: 1px solid #bdc3c7; padding-top: 15px; margin-top: 20px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 9px; color: #7f8c8d;">
                                <tr>
                                    <td style="width: 50%; vertical-align: top;">
                                        <div style="font-weight: 600; margin-bottom: 3px;">TRUTHLENS AI</div>
                                        <div>Sistema de Verificación de Contenidos Digitales</div>
                                        <div>${window.location.hostname}</div>
                                    </td>
                                    <td style="text-align: right; vertical-align: top;">
                                        <div style="font-weight: 600; margin-bottom: 3px;">INFORMACIÓN DEL DOCUMENTO</div>
                                        <div>Generado: ${currentDate.toLocaleString()}</div>
                                        <div>Usuario: ${navigator.userAgent.split(' ')[0]}</div>
                                        <div>Confidencialidad: Uso Interno</div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    `;

                    // Añadir al DOM (fuera de la pantalla para no mostrarse en la web)
                    reportEl.style.position = 'fixed';
                    reportEl.style.left = '-9999px';
                    document.body.appendChild(reportEl);

                    // Generar PDF profesional
                    const { jsPDF } = window.jspdf || {};
                    if (!jsPDF) throw new Error('jsPDF no está cargado.');

                    // Esperar carga de imágenes
                    const imgs = reportEl.querySelectorAll("img");
                    await Promise.all(Array.from(imgs).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(res => {
                            img.onload = res;
                            img.onerror = res;
                        });
                    }));

                    // Renderizar a canvas con alta calidad
                    const canvas = await html2canvas(reportEl, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#FFFFFF',
                        quality: 1
                    });

                    const imgWidth = 555;
                    const pageHeight = 842;
                    const pageWidth = 595;
                    const pdf = new jsPDF("p", "pt", "a4");

                    // Metadatos profesionales
                    pdf.setProperties({
                        title: `TruthLens AI - Reporte de Verificación - ${title.substring(0, 40)}`,
                        subject: 'Análisis de credibilidad de contenidos digitales',
                        author: 'TruthLens AI System',
                        creator: 'TruthLens AI Platform',
                        keywords: 'verificación, fake news, inteligencia artificial, credibilidad, contenido digital',
                        creationDate: currentDate
                    });

                    // Función para añadir marca de agua SOLO AL PDF (aparece encima del contenido)
                    function addWatermark(pdf) {
                        pdf.saveGraphicsState();
                        
                        // Configurar transparencia para la marca de agua (más visible pero sutil)
                        pdf.setGState(pdf.GState({ opacity: 0.15 }));
                        pdf.setFontSize(90);
                        pdf.setFont("arial", "bold");
                        pdf.setTextColor(44, 62, 80);
                        
                        // Centrar en la página y rotar -45 grados
                        const centerX = pageWidth / 2;
                        const centerY = pageHeight / 2;
                        
                        pdf.text("TRUTHLENS", centerX, centerY, {
                            align: 'center',
                            angle: -45
                        });
                        
                        pdf.restoreGraphicsState();
                    }

                    // Configuración de paginación profesional
                    const pageCanvasHeight = canvas.width * (pageHeight / imgWidth);
                    let remainingHeight = canvas.height;
                    let position = 0;
                    let page = 0;

                    while (remainingHeight > 0) {
                        const pageCanvas = document.createElement("canvas");
                        pageCanvas.width = canvas.width;
                        pageCanvas.height = Math.min(pageCanvasHeight, remainingHeight);
                        
                        const ctx = pageCanvas.getContext("2d");
                        ctx.drawImage(
                            canvas,
                            0, position, canvas.width, pageCanvas.height,
                            0, 0, canvas.width, pageCanvas.height
                        );

                        const pageData = pageCanvas.toDataURL("image/png", 1.0);

                        if (page > 0) pdf.addPage();

                        // Añadir el contenido del reporte PRIMERO
                        pdf.addImage(pageData, "PNG", 20, 20, imgWidth, 
                                pageCanvas.height * (imgWidth / canvas.width));

                        // DESPUÉS añadir la marca de agua ENCIMA del contenido
                        addWatermark(pdf);

                        // Footer corporativo en cada página
                        pdf.setFontSize(7);
                        pdf.setTextColor(100, 100, 100);
                        pdf.text(`TruthLens AI - Reporte de Verificación - Página ${page + 1}`, 
                            pageWidth / 2, pageHeight - 15, { align: 'center' });
                        pdf.text("Confidencial - Uso Interno", 40, pageHeight - 15);
                        pdf.text(`${currentDate.toLocaleDateString()}`, pageWidth - 40, 
                            pageHeight - 15, { align: 'right' });

                        remainingHeight -= pageCanvasHeight;
                        position += pageCanvasHeight;
                        page++;
                    }

                    // Nombre de archivo corporativo
                    const fileName = `TruthLens_Report_${currentDate.getFullYear()}${(currentDate.getMonth()+1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}_${currentDate.getHours()}${currentDate.getMinutes()}.pdf`;

                    pdf.save(fileName);

                    // Limpieza - remover el elemento del DOM
                    if (reportEl && reportEl.parentNode) {
                        reportEl.parentNode.removeChild(reportEl);
                    }

                } catch (err) {
                    console.error('Error generando PDF:', err);
                    Swal.fire({
                        title: 'Error en Generación de Reporte',
                        text: 'No se pudo generar el documento PDF. Por favor, intente nuevamente.',
                        icon: 'error',
                        background: 'rgba(0,0,0,0.9)',
                        color: 'white',
                        confirmButtonText: 'Entendido'
                    });
                }
            })();
        };
    }
}