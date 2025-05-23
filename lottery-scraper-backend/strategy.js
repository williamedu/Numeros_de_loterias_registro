// strategy.js - Lógica para la Estrategia de los 3 Números

// Variables globales para la estrategia
let strategyData = {
    activeCandidates: [],
    predictionHistory: [],
    statistics: {
        totalPredictions: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        successRate: 0
    }
};

/**
 * Función principal para inicializar la estrategia de 3 números
 * Se llama desde main.js después de cargar los datos
 */
function initThreeNumberStrategy(lotteryData) {
    // Solo mostrar la sección si la lotería tiene exactamente 3 posiciones
    if (lotteryData.positionsCount === 3) {
        analyzeThreeNumberPattern(lotteryData);
        updateStrategyDisplay();
        showStrategySection();
    } else {
        hideStrategySection();
    }
}

/**
 * Mostrar la sección de estrategia
 */
function showStrategySection() {
    const strategySection = document.getElementById('threeNumberStrategy');
    if (strategySection) {
        strategySection.classList.remove('hidden');
    }
}

/**
 * Ocultar la sección de estrategia
 */
function hideStrategySection() {
    const strategySection = document.getElementById('threeNumberStrategy');
    if (strategySection) {
        strategySection.classList.add('hidden');
    }
}

/**
 * Analizar el patrón de 3 números en los datos históricos
 */
function analyzeThreeNumberPattern(lotteryData) {
    // Resetear datos de estrategia
    strategyData = {
        activeCandidates: [],
        predictionHistory: [],
        statistics: {
            totalPredictions: 0,
            successfulPredictions: 0,
            failedPredictions: 0,
            successRate: 0
        }
    };

    // Obtener fecha actual
    const today = new Date();
    
    // Crear un mapa de todas las apariciones de números con fechas
    const numberAppearances = createNumberAppearancesMap(lotteryData);
    
    // Analizar cada número para encontrar patrones
    for (const [number, appearances] of Object.entries(numberAppearances)) {
        analyzeNumberPattern(number, appearances, today);
    }
    
    // Calcular estadísticas finales
    calculateFinalStatistics();
}

/**
 * Crear un mapa de apariciones de números con fechas ordenadas
 */
function createNumberAppearancesMap(lotteryData) {
    const appearancesMap = {};
    
    // Recorrer el historial de cada número
    for (const [number, data] of Object.entries(lotteryData.numbers)) {
        if (data.history && data.history.length > 0) {
            // Ordenar apariciones por fecha (más reciente primero)
            const sortedHistory = data.history
                .map(entry => ({
                    ...entry,
                    dateObj: parseDate(entry.date)
                }))
                .filter(entry => entry.dateObj !== null)
                .sort((a, b) => b.dateObj - a.dateObj);
            
            if (sortedHistory.length > 0) {
                appearancesMap[number] = sortedHistory;
            }
        }
    }
    
    return appearancesMap;
}

/**
 * Convertir string de fecha a objeto Date
 */
function parseDate(dateStr) {
    try {
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
}

/**
 * Calcular diferencia en días entre dos fechas
 */
function daysDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Analizar el patrón para un número específico
 */
function analyzeNumberPattern(number, appearances, today) {
    if (appearances.length < 2) return; // Necesitamos al menos 2 apariciones
    
    // Buscar grupos de 2 apariciones dentro de 10 días
    for (let i = 0; i < appearances.length - 1; i++) {
        const firstAppearance = appearances[i];
        
        // Buscar segunda aparición dentro de los siguientes 10 días (hacia atrás en el tiempo)
        for (let j = i + 1; j < appearances.length; j++) {
            const secondAppearance = appearances[j];
            const daysBetween = daysDifference(firstAppearance.dateObj, secondAppearance.dateObj);
            
            if (daysBetween <= 10) {
                // Ordenar correctamente: la más antigua es la primera cronológicamente
                const chronoFirst = firstAppearance.dateObj > secondAppearance.dateObj ? secondAppearance : firstAppearance;
                const chronoSecond = firstAppearance.dateObj > secondAppearance.dateObj ? firstAppearance : secondAppearance;
                
                // Encontramos 2 apariciones en 10 días
                const pattern = {
                    number: number,
                    firstDate: chronoFirst.date,
                    secondDate: chronoSecond.date,
                    daysBetween: daysBetween,
                    firstDateObj: chronoFirst.dateObj,
                    secondDateObj: chronoSecond.dateObj
                };
                
                // Buscar si hay una tercera aparición en los siguientes 7 días después de la segunda
                const thirdAppearance = findThirdAppearance(appearances, chronoSecond.dateObj, 0);
                
                if (thirdAppearance) {
                    // Patrón completado exitosamente
                    const daysToThird = daysDifference(chronoFirst.dateObj, thirdAppearance.dateObj);
                    strategyData.predictionHistory.push({
                        ...pattern,
                        thirdDate: thirdAppearance.date,
                        daysToThird: daysToThird,
                        success: true,
                        status: 'completed'
                    });
                    strategyData.statistics.successfulPredictions++;
                } else {
                    // Verificar si ya pasaron más de 7 días desde la segunda aparición
                    const daysSinceSecond = daysDifference(chronoSecond.dateObj, today);
                    if (daysSinceSecond > 7) {
                        // Patrón falló
                        strategyData.predictionHistory.push({
                            ...pattern,
                            thirdDate: null,
                            daysToThird: null,
                            success: false,
                            status: 'failed'
                        });
                        strategyData.statistics.failedPredictions++;
                    } else {
                        // Patrón activo - candidato actual
                        strategyData.activeCandidates.push({
                            ...pattern,
                            daysSinceSecond: daysSinceSecond,
                            daysRemaining: Math.max(0, 7 - daysSinceSecond),
                            status: 'active'
                        });
                    }
                }
                
                strategyData.statistics.totalPredictions++;
                break; // Solo contar el primer patrón válido para este número
            }
        }
    }
}

/**
 * Buscar tercera aparición dentro de 7 días después de la segunda
 */
function findThirdAppearance(appearances, secondDate, startIndex) {
    for (let k = 0; k < appearances.length; k++) {
        const potentialThird = appearances[k];
        const daysFromSecond = daysDifference(secondDate, potentialThird.dateObj);
        
        // La tercera aparición debe ser DESPUÉS de la segunda fecha (más reciente)
        if (potentialThird.dateObj > secondDate && daysFromSecond <= 7) {
            return potentialThird;
        }
    }
    return null;
}

/**
 * Calcular estadísticas finales
 */
function calculateFinalStatistics() {
    const { totalPredictions, successfulPredictions } = strategyData.statistics;
    
    if (totalPredictions > 0) {
        strategyData.statistics.successRate = Math.round((successfulPredictions / totalPredictions) * 100);
    }
    
    // Ordenar candidatos activos por días restantes (menos días primero)
    strategyData.activeCandidates.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    // Ordenar historial por fecha (más reciente primero)
    strategyData.predictionHistory.sort((a, b) => b.firstDateObj - a.firstDateObj);
    
    // Limitar historial a los últimos 20 patrones
    strategyData.predictionHistory = strategyData.predictionHistory.slice(0, 20);
}

/**
 * Actualizar la visualización de la estrategia en el HTML
 */
function updateStrategyDisplay() {
    updateStatisticsDisplay();
    updateActiveCandidatesDisplay();
    updatePredictionHistoryDisplay();
}

/**
 * Actualizar estadísticas de precisión
 */
function updateStatisticsDisplay() {
    const { successRate, successfulPredictions, failedPredictions } = strategyData.statistics;
    
    // Actualizar tasa de éxito
    const successRateElement = document.getElementById('successRate');
    if (successRateElement) {
        successRateElement.textContent = `${successRate}%`;
        successRateElement.className = successRate >= 60 ? 'text-2xl font-bold text-green-600' : 
                                       successRate >= 40 ? 'text-2xl font-bold text-yellow-600' : 
                                       'text-2xl font-bold text-red-600';
    }
    
    // Actualizar predicciones correctas
    const successesElement = document.getElementById('totalSuccesses');
    if (successesElement) {
        successesElement.textContent = successfulPredictions;
    }
    
    // Actualizar predicciones fallidas
    const failuresElement = document.getElementById('totalFailures');
    if (failuresElement) {
        failuresElement.textContent = failedPredictions;
    }
}

/**
 * Actualizar lista de candidatos activos
 */
function updateActiveCandidatesDisplay() {
    const candidatesList = document.getElementById('activeCandidatesList');
    const candidatesCount = document.getElementById('activeCandidatesCount');
    const noCandidatesMessage = document.getElementById('noCandidatesMessage');
    
    if (!candidatesList || !candidatesCount) return;
    
    // Actualizar contador
    candidatesCount.textContent = strategyData.activeCandidates.length;
    
    if (strategyData.activeCandidates.length === 0) {
        candidatesList.innerHTML = '';
        if (noCandidatesMessage) noCandidatesMessage.classList.remove('hidden');
        return;
    }
    
    if (noCandidatesMessage) noCandidatesMessage.classList.add('hidden');
    
    // Crear HTML para cada candidato
    candidatesList.innerHTML = strategyData.activeCandidates.map(candidate => `
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-warning rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <span class="text-2xl font-bold text-gray-800">${candidate.number}</span>
                <span class="text-xs bg-warning text-white px-2 py-1 rounded-full">
                    ${candidate.daysRemaining} días restantes
                </span>
            </div>
            <div class="text-sm text-gray-700 space-y-1 mb-3">
                <div>• Salió por <strong>primera vez</strong> el <strong>${candidate.firstDate}</strong></div>
                <div>• Salió por <strong>segunda vez</strong> el <strong>${candidate.secondDate}</strong></div>
                <div class="text-blue-600">• <strong>Esperando 3ra aparición</strong> (${candidate.daysSinceSecond} días desde la 2da vez)</div>
            </div>
            <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div class="bg-warning h-2 rounded-full" style="width: ${((7 - candidate.daysRemaining) / 7) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

/**
 * Actualizar historial de predicciones
 */
function updatePredictionHistoryDisplay() {
    const historyList = document.getElementById('predictionHistoryList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    
    if (!historyList) return;
    
    if (strategyData.predictionHistory.length === 0) {
        historyList.innerHTML = '';
        if (noHistoryMessage) noHistoryMessage.classList.remove('hidden');
        return;
    }
    
    if (noHistoryMessage) noHistoryMessage.classList.add('hidden');
    
    // Crear HTML para el historial
    historyList.innerHTML = strategyData.predictionHistory.map(entry => {
        const isSuccess = entry.success;
        const statusClass = isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const iconClass = isSuccess ? 'fas fa-check-circle text-green-600' : 'fas fa-times-circle text-red-600';
        const statusText = isSuccess ? 'ÉXITO' : 'FALLO';
        
        // Calcular días después de la segunda aparición para el patrón exitoso
        let daysAfterSecond = '';
        if (isSuccess && entry.thirdDate) {
            const daysFromSecondToThird = daysDifference(entry.secondDateObj, parseDate(entry.thirdDate));
            daysAfterSecond = `${daysFromSecondToThird} días después de salir por segunda vez`;
        }
        
        return `
            <div class="${statusClass} border rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center">
                        <span class="text-xl font-bold text-gray-800 mr-3">${entry.number}</span>
                        <span class="flex items-center text-sm">
                            <i class="${iconClass} mr-1"></i>
                            ${statusText}
                        </span>
                    </div>
                    <span class="text-xs text-gray-500">Días totales: ${isSuccess ? entry.daysToThird : '--'}</span>
                </div>
                <div class="text-sm text-gray-700 space-y-1">
                    <div>• Salió por <strong>primera vez</strong> el <strong>${entry.firstDate}</strong></div>
                    <div>• Salió por <strong>segunda vez</strong> el <strong>${entry.secondDate}</strong></div>
                    ${isSuccess ? `
                        <div class="text-green-700">• <strong>Salió por tercera vez para completar el patrón</strong> el <strong>${entry.thirdDate}</strong> (${daysAfterSecond})</div>
                    ` : `
                        <div class="text-red-600">• <strong>No completó el patrón</strong> - No salió en los siguientes 7 días</div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// Exponer funciones globalmente para que main.js pueda acceder
window.strategyFunctions = {
    initThreeNumberStrategy,
    showStrategySection,
    hideStrategySection
};