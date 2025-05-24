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
            // Agrupar apariciones por fecha (eliminar duplicados del mismo día)
            const dateMap = new Map();
            
            data.history.forEach(entry => {
                const dateKey = entry.date;
                if (!dateMap.has(dateKey)) {
                    // Si es la primera vez que vemos esta fecha, guardarla
                    dateMap.set(dateKey, {
                        date: entry.date,
                        dateObj: parseDate(entry.date),
                        positions: [entry.position], // Array de posiciones donde apareció
                        daysAgo: entry.daysAgo
                    });
                } else {
                    // Si ya existe esta fecha, solo añadir la posición
                    const existing = dateMap.get(dateKey);
                    if (!existing.positions.includes(entry.position)) {
                        existing.positions.push(entry.position);
                    }
                }
            });
            
            // Convertir el Map a array y filtrar fechas válidas
            const uniqueAppearances = Array.from(dateMap.values())
                .filter(entry => entry.dateObj !== null)
                .sort((a, b) => b.dateObj - a.dateObj); // Ordenar por fecha (más reciente primero)
            
            if (uniqueAppearances.length > 0) {
                appearancesMap[number] = uniqueAppearances;
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
                    // Verificar si ya pasaron más de 10 días desde la segunda aparición
                    const daysSinceSecond = daysDifference(chronoSecond.dateObj, today);
                    if (daysSinceSecond > 10) {
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
                            daysRemaining: Math.max(0, 10 - daysSinceSecond),
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
 * Buscar tercera aparición dentro de 10 días después de la segunda
 */
function findThirdAppearance(appearances, secondDate, startIndex) {
    for (let k = 0; k < appearances.length; k++) {
        const potentialThird = appearances[k];
        const daysFromSecond = daysDifference(secondDate, potentialThird.dateObj);
        
        // La tercera aparición debe ser DESPUÉS de la segunda fecha (más reciente)
        if (potentialThird.dateObj > secondDate && daysFromSecond <= 10) {
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
    
    // Calcular estadísticas por día de aparición del tercer número
    calculateDayByDayStatistics();
    
    // Ordenar candidatos activos por días restantes (menos días primero)
    strategyData.activeCandidates.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    // Asignar categorías de probabilidad a candidatos activos
    assignProbabilityCategories();
    
    // Ordenar historial por fecha (más reciente primero)
    strategyData.predictionHistory.sort((a, b) => b.firstDateObj - a.firstDateObj);
    
    // COMENTAR ESTA LÍNEA PARA MOSTRAR TODO EL HISTORIAL:
    // strategyData.predictionHistory = strategyData.predictionHistory.slice(0, 20);
}

/**
 * Calcular estadísticas de qué día aparece el tercer número
 */
function calculateDayByDayStatistics() {
    const dayStats = {};
    
    // Inicializar estadísticas para días 1-10
    for (let day = 1; day <= 10; day++) {
        dayStats[day] = { count: 0, percentage: 0 };
    }
    
    // Contar en qué día apareció cada tercer número exitoso
    const successfulPatterns = strategyData.predictionHistory.filter(entry => entry.success);
    
    successfulPatterns.forEach(pattern => {
        const daysAfterSecond = daysDifference(pattern.secondDateObj, parseDate(pattern.thirdDate));
        if (daysAfterSecond >= 1 && daysAfterSecond <= 10) {
            dayStats[daysAfterSecond].count++;
        }
    });
    
    // Calcular porcentajes
    const totalSuccessful = successfulPatterns.length;
    if (totalSuccessful > 0) {
        for (let day = 1; day <= 10; day++) {
            dayStats[day].percentage = Math.round((dayStats[day].count / totalSuccessful) * 100);
        }
    }
    
    strategyData.dayByDayStats = dayStats;
}

/**
 * Asignar categorías de probabilidad a candidatos activos
 */
function assignProbabilityCategories() {
    if (!strategyData.dayByDayStats) return;
    
    strategyData.activeCandidates.forEach(candidate => {
        const todayDay = candidate.daysSinceSecond; // Día de hoy
        const tomorrowDay = candidate.daysSinceSecond + 1; // Día de mañana
        
        // Probabilidad de hoy
        let todayProbability = 0;
        if (todayDay >= 1 && todayDay <= 10) {
            todayProbability = strategyData.dayByDayStats[todayDay]?.percentage || 0;
        }
        
        // Probabilidad de mañana
        let tomorrowProbability = 0;
        if (tomorrowDay >= 1 && tomorrowDay <= 10) {
            tomorrowProbability = strategyData.dayByDayStats[tomorrowDay]?.percentage || 0;
        }
        
        // Usar la probabilidad de hoy para categorizar el color del candidato
        const dayPercentage = todayProbability;
        
        // Categorizar según porcentaje de hoy
        if (dayPercentage >= 11) {
            candidate.probabilityCategory = 'high';
            candidate.probabilityColor = 'green';
            candidate.probabilityText = 'Alta';
        } else if (dayPercentage >= 6) {
            candidate.probabilityCategory = 'medium';
            candidate.probabilityColor = 'yellow';
            candidate.probabilityText = 'Media';
        } else {
            candidate.probabilityCategory = 'low';
            candidate.probabilityColor = 'red';
            candidate.probabilityText = 'Baja';
        }
        
        candidate.todayProbability = todayProbability;
        candidate.tomorrowProbability = tomorrowProbability;
        candidate.todayDay = todayDay;
        candidate.tomorrowDay = tomorrowDay;
    });
}

/**
 * Actualizar la visualización de la estrategia en el HTML
 */
function updateStrategyDisplay() {
    updateStatisticsDisplay();
    updateDayByDayDisplay();
    updateActiveCandidatesDisplay();
    updatePredictionHistoryDisplay();
}

/**
 * Actualizar estadísticas por día
 */
function updateDayByDayDisplay() {
    // Buscar si existe el contenedor para estadísticas por día
    const dayStatsContainer = document.getElementById('dayByDayStats');
    if (!dayStatsContainer || !strategyData.dayByDayStats) return;
    
    // Crear HTML para estadísticas por día
    let dayStatsHTML = '<div class="grid grid-cols-5 md:grid-cols-10 gap-2">';
    
    for (let day = 1; day <= 10; day++) {
        const stats = strategyData.dayByDayStats[day];
        const percentage = stats.percentage;
        
        // Determinar color basado en porcentaje
        let colorClass = 'bg-red-100 border-red-300 text-red-700'; // Baja
        if (percentage >= 11) {
            colorClass = 'bg-green-100 border-green-300 text-green-700'; // Alta
        } else if (percentage >= 6) {
            colorClass = 'bg-yellow-100 border-yellow-300 text-yellow-700'; // Media
        }
        
        dayStatsHTML += `
            <div class="${colorClass} border rounded-lg p-2 text-center text-xs">
                <div class="font-bold">Día ${day}</div>
                <div>${percentage}%</div>
                <div class="text-xs">(${stats.count})</div>
            </div>
        `;
    }
    
    dayStatsHTML += '</div>';
    dayStatsContainer.innerHTML = dayStatsHTML;
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
    candidatesList.innerHTML = strategyData.activeCandidates.map(candidate => {
        // Determinar clases de color según la probabilidad
        let borderColor = 'border-red-400';
        let bgGradient = 'from-red-50 to-red-100';
        let badgeColor = 'bg-red-500';
        
        if (candidate.probabilityColor === 'green') {
            borderColor = 'border-green-400';
            bgGradient = 'from-green-50 to-green-100';
            badgeColor = 'bg-green-500';
        } else if (candidate.probabilityColor === 'yellow') {
            borderColor = 'border-yellow-400';
            bgGradient = 'from-yellow-50 to-yellow-100';
            badgeColor = 'bg-yellow-500';
        }
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-2xl font-bold text-gray-800">${candidate.number}</span>
                    <div class="flex flex-col items-end space-y-1">
                        <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full">
                            ${candidate.daysRemaining} días restantes
                        </span>
                        <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full">
                            Hoy: ${candidate.todayProbability}%
                        </span>
                    </div>
                </div>
                <div class="text-sm text-gray-700 space-y-1 mb-3">
                    <div>• Salió por <strong>primera vez</strong> el <strong>${candidate.firstDate}</strong></div>
                    <div>• Salió por <strong>segunda vez</strong> el <strong>${candidate.secondDate}</strong></div>
                    <div class="text-blue-600">• <strong>Esperando 3ra aparición</strong> (${candidate.daysSinceSecond} días desde la 2da vez)</div>
                    <div class="text-purple-600 font-medium">• Probabilidad para mañana: <strong>${candidate.tomorrowProbability}%</strong></div>
                </div>
                <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div class="${badgeColor} h-2 rounded-full" style="width: ${((10 - candidate.daysRemaining) / 10) * 100}%"></div>
                </div>
            </div>
        `;
    }).join('');
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
                        <div class="text-red-600">• <strong>No completó el patrón</strong> - No salió en los siguientes 10 días</div>
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