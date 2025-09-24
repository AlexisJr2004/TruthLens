// =====================================================================
// CHATBOT DE PREGUNTAS FRECUENTES MEJORADO
// =====================================================================
document.addEventListener('DOMContentLoaded', function () {
    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    let currentCategory = null;
    let conversationHistory = [];

    // Función para agregar mensaje al historial
    function addToHistory(type, content, category = null) {
        conversationHistory.push({ type, content, category, timestamp: Date.now() });
    }

    // Función para crear un elemento de mensaje
    function createMessageElement(type, content, className = '') {
        const div = document.createElement('div');
        div.className = `message-item ${className}`;
        
        if (type === 'user') {
            div.className += ' text-right mb-3';
            div.innerHTML = `
                <div class="inline-block bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-md max-w-xs shadow-lg">
                    <p class="text-sm font-medium">${content}</p>
                </div>
            `;
        } else if (type === 'bot') {
            div.className += ' text-left mb-4';
            div.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <i class="fas fa-robot text-white text-xs"></i>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-md max-w-sm shadow-md">
                        <p class="text-sm leading-relaxed">${content}</p>
                    </div>
                </div>
            `;
        }
        return div;
    }

    // Función para mostrar opciones de categorías principales
    function showMainCategories() {
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'categories-options mt-4 space-y-2';
        
        const categories = Object.keys(FAQ_CATEGORIES);
        categoriesDiv.innerHTML = `
            <div class="text-center mb-3">
                <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">Selecciona una categoría:</p>
            </div>
            ${categories.map(category => 
                `<button class="category-btn w-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 text-purple-700 dark:text-purple-300 rounded-xl px-4 py-3 text-left hover:from-purple-100 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border border-purple-200 dark:border-gray-600 hover:shadow-md" data-category="${category}">
                    <i class="fas ${FAQ_CATEGORIES[category].icon} mr-3 text-purple-500"></i>
                    <span class="font-medium">${FAQ_CATEGORIES[category].title}</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">${FAQ_CATEGORIES[category].description}</span>
                </button>`
            ).join('')}
        `;
        
        chatbotMessages.appendChild(categoriesDiv);
        smoothScrollToBottom();

        // Agregar eventos a los botones de categoría
        categoriesDiv.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const category = this.getAttribute('data-category');
                currentCategory = category;
                showCategoryQuestions(category);
            });
        });
    }

    // Función para mostrar preguntas de una categoría específica
    function showCategoryQuestions(category) {
        const userDiv = createMessageElement('user', FAQ_CATEGORIES[category].title);
        chatbotMessages.appendChild(userDiv);
        addToHistory('user', FAQ_CATEGORIES[category].title, category);

        setTimeout(() => {
            const botResponse = createMessageElement('bot', `Aquí tienes las preguntas sobre ${FAQ_CATEGORIES[category].title.toLowerCase()}:`);
            chatbotMessages.appendChild(botResponse);
            addToHistory('bot', `Preguntas sobre ${FAQ_CATEGORIES[category].title}`, category);

            const questionsDiv = document.createElement('div');
            questionsDiv.className = 'questions-options mt-3 space-y-2';
            
            const questions = FAQ_CATEGORIES[category].questions;
            questionsDiv.innerHTML = questions.map((questionIdx, index) => 
                `<button class="question-btn w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-sm" data-idx="${questionIdx}">
                    <span class="font-medium text-sm">${FAQS[questionIdx].question}</span>
                </button>`
            ).join('');
            
            // Agregar botón para volver a las categorías principales
            questionsDiv.innerHTML += `
                <button class="back-to-main-btn w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl px-4 py-2 text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 mt-3">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Volver a categorías principales
                </button>
            `;
            
            chatbotMessages.appendChild(questionsDiv);
            smoothScrollToBottom();

            // Eventos para preguntas
            questionsDiv.querySelectorAll('.question-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.getAttribute('data-idx'));
                    showAnswer(idx);
                });
            });

            // Evento para volver a categorías principales
            questionsDiv.querySelector('.back-to-main-btn').addEventListener('click', function () {
                currentCategory = null;
                const userDiv = createMessageElement('user', 'Ver todas las categorías');
                chatbotMessages.appendChild(userDiv);
                setTimeout(() => {
                    const botDiv = createMessageElement('bot', '¡Perfecto! Te muestro todas las categorías disponibles:');
                    chatbotMessages.appendChild(botDiv);
                    showMainCategories();
                }, 500);
            });

        }, 600);
    }

    // Función para mostrar respuesta y preguntas relacionadas
    function showAnswer(idx) {
        const faq = FAQS[idx];
        
        // Mostrar pregunta seleccionada
        const userDiv = createMessageElement('user', faq.question);
        chatbotMessages.appendChild(userDiv);
        addToHistory('user', faq.question);

        setTimeout(() => {
            // Mostrar respuesta
            const botDiv = createMessageElement('bot', faq.answer);
            chatbotMessages.appendChild(botDiv);
            addToHistory('bot', faq.answer);

            // Mostrar preguntas relacionadas si existen
            if (faq.related && faq.related.length > 0) {
                setTimeout(() => {
                    const relatedDiv = document.createElement('div');
                    relatedDiv.className = 'related-questions mt-4 p-4 bg-purple-50 dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-gray-600';
                    
                    relatedDiv.innerHTML = `
                        <div class="flex items-center mb-3">
                            <i class="fas fa-lightbulb text-purple-500 mr-2"></i>
                            <span class="font-medium text-purple-700 dark:text-purple-300 text-sm">También te puede interesar:</span>
                        </div>
                        <div class="space-y-2">
                            ${faq.related.map(relatedIdx => 
                                `<button class="related-btn w-full text-left bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-purple-100 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600" data-idx="${relatedIdx}">
                                    ${FAQS[relatedIdx].question}
                                </button>`
                            ).join('')}
                        </div>
                        <div class="mt-3 pt-3 border-t border-purple-200 dark:border-gray-600 space-y-2">
                            <button class="back-category-btn w-full bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 rounded-lg px-3 py-2 text-sm hover:bg-purple-200 dark:hover:bg-gray-600 transition-all duration-200">
                                <i class="fas fa-list mr-2"></i>
                                Ver más preguntas de esta categoría
                            </button>
                            <button class="back-main-btn w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
                                <i class="fas fa-home mr-2"></i>
                                Volver al menú principal
                            </button>
                        </div>
                    `;
                    
                    chatbotMessages.appendChild(relatedDiv);
                    
                    // No hacer scroll automático para que el usuario pueda leer la respuesta
                    // smoothScrollToBottom();

                    // Eventos para preguntas relacionadas
                    relatedDiv.querySelectorAll('.related-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const relatedIdx = parseInt(this.getAttribute('data-idx'));
                            showAnswer(relatedIdx);
                        });
                    });

                    // Evento para volver a la categoría actual
                    relatedDiv.querySelector('.back-category-btn').addEventListener('click', function () {
                        if (currentCategory) {
                            showCategoryQuestions(currentCategory);
                        } else {
                            showMainCategories();
                        }
                    });

                    // Evento para volver al menú principal
                    relatedDiv.querySelector('.back-main-btn').addEventListener('click', function () {
                        currentCategory = null;
                        const userDiv = createMessageElement('user', 'Menú principal');
                        chatbotMessages.appendChild(userDiv);
                        setTimeout(() => {
                            const botDiv = createMessageElement('bot', '¡Hola de nuevo! ¿En qué más puedo ayudarte?');
                            chatbotMessages.appendChild(botDiv);
                            showMainCategories();
                        }, 500);
                    });

                }, 800);
            } else {
                // Si no hay preguntas relacionadas, mostrar opciones generales
                setTimeout(() => {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'general-options mt-4 space-y-2';
                    optionsDiv.innerHTML = `
                        <button class="back-category-btn w-full bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 rounded-lg px-3 py-2 text-sm hover:bg-purple-200 dark:hover:bg-gray-600 transition-all duration-200">
                            <i class="fas fa-list mr-2"></i>
                            Ver más preguntas de esta categoría
                        </button>
                        <button class="back-main-btn w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
                            <i class="fas fa-home mr-2"></i>
                            Volver al menú principal
                        </button>
                    `;
                    
                    chatbotMessages.appendChild(optionsDiv);

                    // Eventos similares a los anteriores
                    optionsDiv.querySelector('.back-category-btn').addEventListener('click', function () {
                        if (currentCategory) {
                            showCategoryQuestions(currentCategory);
                        } else {
                            showMainCategories();
                        }
                    });

                    optionsDiv.querySelector('.back-main-btn').addEventListener('click', function () {
                        currentCategory = null;
                        const userDiv = createMessageElement('user', 'Menú principal');
                        chatbotMessages.appendChild(userDiv);
                        setTimeout(() => {
                            const botDiv = createMessageElement('bot', '¡Hola de nuevo! ¿En qué más puedo ayudarte?');
                            chatbotMessages.appendChild(botDiv);
                            showMainCategories();
                        }, 500);
                    });

                }, 800);
            }

        }, 700);
    }

    // Función para scroll suave
    function smoothScrollToBottom() {
        setTimeout(() => {
            chatbotMessages.scrollTo({
                top: chatbotMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Función para iniciar el chatbot
    function startChatbot() {
        chatbotMessages.innerHTML = '';
        conversationHistory = [];
        currentCategory = null;
        
        // Mensaje de bienvenida
        const welcomeDiv = createMessageElement('bot', '¡Hola! Soy TruthLens AI, tu asistente para verificar contenido. ¿En qué puedo ayudarte hoy?');
        chatbotMessages.appendChild(welcomeDiv);
        addToHistory('bot', 'Mensaje de bienvenida');
        
        showMainCategories();
    }

    // Event Listeners principales
    chatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('opacity-100', 'pointer-events-auto');
        chatbotWindow.classList.remove('opacity-0', 'pointer-events-none');
        chatbotWindow.style.transform = 'scale(1)';
        startChatbot();
    });

    closeChatbot.addEventListener('click', () => {
        chatbotWindow.classList.remove('opacity-100', 'pointer-events-auto');
        chatbotWindow.classList.add('opacity-0', 'pointer-events-none');
        chatbotWindow.style.transform = 'scale(0.95)';
    });

    // Enviar mensaje manual (mejorado)
    if (chatbotForm) {
        chatbotForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const userMsg = chatbotInput.value.trim();
            if (!userMsg) return;

            // Mostrar mensaje del usuario
            const userDiv = createMessageElement('user', userMsg);
            chatbotMessages.appendChild(userDiv);
            addToHistory('user', userMsg);

            // Simular procesamiento
            setTimeout(() => {
                const processingDiv = createMessageElement('bot', '🤖 Analizando tu consulta...');
                chatbotMessages.appendChild(processingDiv);
                
                setTimeout(() => {
                    // Remover mensaje de procesamiento
                    processingDiv.remove();
                    
                    // Respuesta inteligente
                    const response = generateIntelligentResponse(userMsg);
                    const botDiv = createMessageElement('bot', response);
                    chatbotMessages.appendChild(botDiv);
                    addToHistory('bot', response);
                    
                    // Mostrar opciones para continuar
                    setTimeout(() => {
                        const optionsDiv = document.createElement('div');
                        optionsDiv.className = 'continue-options mt-3 space-y-2';
                        optionsDiv.innerHTML = `
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">¿Necesitas más ayuda?</p>
                            <button class="show-categories-btn w-full bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 rounded-lg px-3 py-2 text-sm hover:bg-purple-200 dark:hover:bg-gray-600 transition-all duration-200">
                                <i class="fas fa-list mr-2"></i>
                                Ver preguntas frecuentes
                            </button>
                        `;
                        
                        chatbotMessages.appendChild(optionsDiv);
                        
                        optionsDiv.querySelector('.show-categories-btn').addEventListener('click', function () {
                            showMainCategories();
                        });
                        
                    }, 1000);
                    
                }, 1500);
                
            }, 500);

            chatbotInput.value = '';
            smoothScrollToBottom();
        });
    }

    // Función para generar respuestas inteligentes
    function generateIntelligentResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        // Buscar coincidencias en las FAQs
        for (let i = 0; i < FAQS.length; i++) {
            const faq = FAQS[i];
            if (faq.keywords && faq.keywords.some(keyword => lowerMsg.includes(keyword.toLowerCase()))) {
                return faq.answer;
            }
        }
        
        // Respuestas por categorías de palabras clave
        if (lowerMsg.includes('funciona') || lowerMsg.includes('como')) {
            return 'TruthLens funciona analizando contenido usando algoritmos avanzados de IA. ¿Te gustaría conocer más detalles específicos?';
        }
        
        if (lowerMsg.includes('segur') || lowerMsg.includes('privacidad')) {
            return 'La seguridad es nuestra prioridad. Tus archivos se procesan de forma segura y no se almacenan permanentemente. ¿Tienes alguna preocupación específica sobre privacidad?';
        }
        
        if (lowerMsg.includes('gratis') || lowerMsg.includes('precio') || lowerMsg.includes('costo')) {
            return 'TruthLens es gratuito para uso personal y educativo. ¿Te interesa conocer las funcionalidades disponibles?';
        }
        
        // Respuesta por defecto
        return 'Gracias por tu consulta. Te recomiendo revisar nuestras preguntas frecuentes organizadas por categorías, donde probablemente encuentres la información que buscas.';
    }
});

// =====================================================================
// DATOS DE FAQ ORGANIZADOS POR CATEGORÍAS
// =====================================================================

const FAQ_CATEGORIES = {
    'funcionamiento': {
        title: 'Funcionamiento de TruthLens',
        description: 'Cómo funciona la plataforma',
        icon: 'fa-cogs',
        questions: [0, 3, 8, 10]
    },
    'archivos': {
        title: 'Tipos de Archivos',
        description: 'Qué archivos puedes analizar',
        icon: 'fa-file-alt',
        questions: [1, 4, 6]
    },
    'seguridad': {
        title: 'Seguridad y Privacidad',
        description: 'Protección de tus datos',
        icon: 'fa-shield-alt',
        questions: [2, 7]
    },
    'resultados': {
        title: 'Interpretación de Resultados',
        description: 'Cómo entender los análisis',
        icon: 'fa-chart-line',
        questions: [3, 5, 10]
    },
    'acceso': {
        title: 'Acceso y Disponibilidad',
        description: 'Cómo y dónde usar TruthLens',
        icon: 'fa-mobile-alt',
        questions: [9, 11]
    }
};

const FAQS = [
    {
        question: "¿Cómo funciona TruthLens?",
        answer: "TruthLens utiliza algoritmos avanzados de inteligencia artificial y procesamiento de lenguaje natural para analizar el contenido y detectar posibles noticias falsas o desinformación. El sistema evalúa múltiples factores como la coherencia, fuentes, y patrones lingüísticos.",
        keywords: ["funciona", "como", "algoritmo", "ia", "inteligencia artificial"],
        related: [8, 10, 3]
    },
    {
        question: "¿Qué tipos de archivos puedo analizar?",
        answer: "Puedes analizar una amplia variedad de contenido: archivos de texto (.txt, .doc, .docx), documentos PDF, imágenes con texto (usando OCR), y enlaces web de artículos o publicaciones públicas en redes sociales.",
        keywords: ["archivos", "tipos", "formatos", "pdf", "imagen", "texto"],
        related: [4, 6]
    },
    {
        question: "¿Es seguro subir mis archivos?",
        answer: "Absolutamente. Tus archivos se procesan de forma segura utilizando encriptación de extremo a extremo. No se almacenan permanentemente en nuestros servidores y se eliminan automáticamente después del análisis.",
        keywords: ["seguro", "seguridad", "privacidad", "archivos"],
        related: [7]
    },
    {
        question: "¿Qué significa el nivel de confianza?",
        answer: "El nivel de confianza es un porcentaje que indica la probabilidad de que el contenido sea verdadero según nuestro análisis de IA. Valores altos (>80%) sugieren contenido confiable, mientras que valores bajos (<40%) indican posible desinformación.",
        keywords: ["confianza", "porcentaje", "nivel", "resultado"],
        related: [0, 5, 10]
    },
    {
        question: "¿TruthLens puede detectar noticias falsas en imágenes?",
        answer: "Sí, TruthLens utiliza tecnología OCR (reconocimiento óptico de caracteres) para extraer texto de imágenes y luego aplica análisis semántico y verificación de hechos al contenido extraído.",
        keywords: ["imágenes", "ocr", "texto", "fotos", "reconocimiento"],
        related: [1, 8]
    },
    {
        question: "¿Qué hago si el resultado es dudoso?",
        answer: "Si obtienes un resultado con confianza media (40-80%), te recomendamos: 1) Verificar en fuentes adicionales confiables, 2) Consultar fact-checkers reconocidos, 3) Buscar la fuente original de la información, y 4) No compartir hasta estar seguro.",
        keywords: ["dudoso", "resultado", "verificar", "que hacer"],
        related: [3, 10]
    },
    {
        question: "¿Puedo analizar enlaces de redes sociales?",
        answer: "Sí, puedes analizar enlaces de publicaciones públicas en redes sociales como Twitter, Facebook, Instagram y LinkedIn, siempre que el contenido sea accesible públicamente y no requiera autenticación.",
        keywords: ["redes sociales", "enlaces", "twitter", "facebook", "instagram"],
        related: [1, 4]
    },
    {
        question: "¿TruthLens almacena mis datos?",
        answer: "No almacenamos tus datos personales ni el contenido que analizas. Toda la información se procesa temporalmente en memoria durante el análisis y se elimina inmediatamente después. Solo mantenemos estadísticas anónimas para mejorar el servicio.",
        keywords: ["almacena", "datos", "guarda", "información"],
        related: [2]
    },
    {
        question: "¿Qué tecnologías utiliza TruthLens?",
        answer: "TruthLens combina múltiples tecnologías: modelos de lenguaje natural (NLP), aprendizaje automático (ML), análisis semántico, verificación cruzada de fuentes, y algoritmos de detección de patrones para proporcionar análisis precisos.",
        keywords: ["tecnología", "nlp", "machine learning", "algoritmos"],
        related: [0, 4]
    },
    {
        question: "¿Puedo usar TruthLens desde mi móvil?",
        answer: "¡Por supuesto! TruthLens está completamente optimizado para dispositivos móviles. Puedes acceder desde cualquier navegador web en tu smartphone o tablet con la misma funcionalidad que en escritorio.",
        keywords: ["móvil", "celular", "smartphone", "tablet", "dispositivos"],
        related: [11]
    },
    {
        question: "¿Qué tipo de resultados obtendré?",
        answer: "Recibirás un análisis completo que incluye: nivel de confianza (0-100%), clasificación del contenido (Verdadero/Falso/Dudoso), explicación del análisis, fuentes consultadas si están disponibles, y recomendaciones específicas para verificar la información.",
        keywords: ["resultados", "análisis", "clasificación", "explicación"],
        related: [3, 5]
    },
    {
        question: "¿TruthLens es gratuito?",
        answer: "Sí, TruthLens es completamente gratuito para uso personal y educativo. Ofrecemos análisis ilimitados sin costo alguno como parte de nuestro compromiso con la lucha contra la desinformación.",
        keywords: ["gratuito", "gratis", "precio", "costo", "free"],
        related: []
    }
];