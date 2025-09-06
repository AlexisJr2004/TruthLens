// Initialize particles
const particlesContainer = document.getElementById("particles");
for (let i = 0; i < 50; i++) {
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.style.left = Math.random() * 100 + "%";
  particle.style.animationDelay = Math.random() * 20 + "s";
  particle.style.animationDuration = 15 + Math.random() * 10 + "s";
  particlesContainer.appendChild(particle);
}

// DOM Elements
const analyzeBtn = document.getElementById("analyze-btn");
const sampleBtn = document.getElementById("sample-btn");
const clearBtn = document.getElementById("clear-btn");
const textArea = document.getElementById("news-text");
const charCount = document.getElementById("char-count");
const loading = document.getElementById("loading");
const resultCard = document.getElementById("result-card");
const resultTitle = document.getElementById("result-title");
const resultProb = document.getElementById("result-prob");
const confidenceBadge = document.getElementById("confidence-badge");
const confidenceFill = document.getElementById("confidence-fill");
const resultDescription = document.getElementById("result-description");
const mlScore = document.getElementById("ml-score");
const sentiment = document.getElementById("sentiment");
const riskLevel = document.getElementById("risk-level");
const historyDiv = document.getElementById("history");
const emptyHistory = document.getElementById("empty-history");

// Sample news
const samples = [
  {
    text: "Científicos descubren cura milagrosa para todas las enfermedades usando cristales mágicos encontrados en la Atlántida. Los gobiernos mundiales intentan ocultar este descubrimiento revolucionario.",
    isFake: true,
  },
  {
    text: "El Banco Central Europeo anuncia un ajuste de 0.25 puntos en las tasas de interés como medida preventiva ante los indicadores de inflación del último trimestre, según comunicado oficial publicado hoy.",
    isFake: false,
  },
];

let currentSample = 0;

// Character counter
textArea.addEventListener("input", () => {
  const count = textArea.value.length;
  charCount.textContent = count;
  if (count > 5000) {
    charCount.classList.add("text-red-500");
  } else {
    charCount.classList.remove("text-red-500");
  }
});

// Clear button
clearBtn.addEventListener("click", () => {
  textArea.value = "";
  charCount.textContent = "0";
  resultCard.classList.add("hidden");
});

// Sample button
sampleBtn.addEventListener("click", () => {
  const sample = samples[currentSample];
  textArea.value = sample.text;
  charCount.textContent = sample.text.length;
  currentSample = (currentSample + 1) % samples.length;
});

// Analyze button
analyzeBtn.addEventListener("click", async () => {
  const text = textArea.value.trim();

  if (!text) {
    Swal.fire({
      icon: "warning",
      title: "Texto requerido",
      text: "Por favor, introduce un texto para analizar.",
      confirmButtonColor: "#3b82f6",
    });
    return;
  }

  if (text.length > 5000) {
    Swal.fire({
      icon: "error",
      title: "Texto demasiado largo",
      text: "El texto no debe superar los 5000 caracteres.",
      confirmButtonColor: "#ef4444",
    });
    return;
  }

  // Show loading animation
  analyzeBtn.disabled = true;
  loading.classList.remove("hidden");
  resultCard.classList.add("hidden");

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor.");
    }

    const data = await response.json();
    const isFake = data.label === 1;
    const probability = data.probability;

    // Simulate a delay for the loading animation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update result card
    if (isFake) {
      resultTitle.textContent = "⚠️ Contenido Sospechoso";
      resultTitle.className = "text-2xl font-bold text-red-400";
      confidenceBadge.textContent = "FAKE NEWS";
      confidenceBadge.className =
        "px-4 py-2 rounded-full text-sm font-semibold bg-red-500 bg-opacity-20 text-red-400 border border-red-500";
      confidenceFill.style.background =
        "linear-gradient(90deg, #ef4444, #dc2626)";
      resultDescription.textContent =
        "El análisis detecta múltiples indicadores de contenido potencialmente falso o engañoso. Se recomienda verificar con fuentes confiables.";
      mlScore.textContent = (probability * 100).toFixed(0) + "%";
      sentiment.textContent = "Negativo";
      riskLevel.textContent = "Alto";
    } else {
      resultTitle.textContent = "✓ Contenido Confiable";
      resultTitle.className = "text-2xl font-bold text-green-400";
      confidenceBadge.textContent = "VERIFICADO";
      confidenceBadge.className =
        "px-4 py-2 rounded-full text-sm font-semibold bg-green-500 bg-opacity-20 text-green-400 border border-green-500";
      confidenceFill.style.background =
        "linear-gradient(90deg, #10b981, #059669)";
      resultDescription.textContent =
        "El contenido parece ser legítimo según nuestro análisis. Los patrones detectados coinciden con fuentes confiables.";
      mlScore.textContent = ((1 - probability) * 100).toFixed(0) + "%";
      sentiment.textContent = "Neutral";
      riskLevel.textContent = "Bajo";
    }

    resultProb.textContent = (probability * 100).toFixed(1) + "%";
    confidenceFill.style.width = (probability * 100) + "%";

    // Add to history
    addToHistory(text, isFake, probability);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Ocurrió un error al analizar el texto. Por favor, inténtalo de nuevo.",
      confirmButtonColor: "#ef4444",
    });
    console.error(error);
  } finally {
    // Hide loading animation and show result
    loading.classList.add("hidden");
    resultCard.classList.remove("hidden");
    analyzeBtn.disabled = false;
  }
});


// Add to history function
function addToHistory(text, isFake, probability) {
  emptyHistory.classList.add("hidden");

  const entry = document.createElement("div");
  entry.className =
    "glass rounded-xl p-4 mb-3 hover:bg-white hover:bg-opacity-5 transition-all cursor-pointer";

  const date = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  entry.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-gray-500">${date}</span>
                    <span class="text-xs font-semibold ${
                      isFake ? "text-red-400" : "text-green-400"
                    }">
                        ${(probability * 100).toFixed(0)}%
                    </span>
                </div>
                <p class="text-sm text-gray-300 line-clamp-2">
                    ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}
                </p>
                <div class="flex items-center mt-2">
                    <span class="px-2 py-1 rounded-full text-xs ${
                      isFake
                        ? "bg-red-500 bg-opacity-20 text-red-400"
                        : "bg-green-500 bg-opacity-20 text-green-400"
                    }">
                        ${isFake ? "Sospechoso" : "Confiable"}
                    </span>
                </div>
            `;

  entry.addEventListener("click", () => {
    textArea.value = text;
    charCount.textContent = text.length;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  historyDiv.insertBefore(entry, historyDiv.firstChild);

  // Keep only last 5 entries
  while (historyDiv.children.length > 5) {
    historyDiv.removeChild(historyDiv.lastChild);
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to analyze
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    analyzeBtn.click();
  }
  // Ctrl/Cmd + L to clear
  if ((e.ctrlKey || e.metaKey) && e.key === "l") {
    e.preventDefault();
    clearBtn.click();
  }
});
