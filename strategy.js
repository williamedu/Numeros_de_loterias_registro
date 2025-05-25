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
    },
    multipleCoincidences: {
        twoNumbers: [],
        threeNumbers: [],
        statistics: {
            totalTwoNumberCoincidences: 0,
            totalThreeNumberCoincidences: 0,
            rateOfTwoNumberCoincidences: 0,
            rateOfThreeNumberCoincidences: 0,
            totalSorteosAnalyzed: 0
        }
    },
    // AGREGAR ESTAS NUEVAS PROPIEDADES:
    allSorteos: [], // Todos los sorteos analizados
    filteredCoincidences: [] // Coincidencias filtradas
};

/**
 * Función principal para inicializar la estrategia de 3 números
 * Se llama desde main.js después de cargar los datos
 */
function initThreeNumberStrategy(lotteryData) {
    // Solo mostrar la sección si la lotería tiene exactamente 3 posiciones
    if (lotteryData.positionsCount === 3) {
        analyzeThreeNumberPattern(lotteryData);
        analyzeMultipleCoincidences(lotteryData);
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
    // Resetear datos de estrategia (solo la parte básica)
    strategyData.activeCandidates = [];
    strategyData.predictionHistory = [];
    strategyData.statistics = {
        totalPredictions: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        successRate: 0
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
 * NUEVA FUNCIÓN: Analizar coincidencias múltiples
 */
/**
 * NUEVA FUNCIÓN: Analizar coincidencias múltiples
 */
function analyzeMultipleCoincidences(lotteryData) {
    // Resetear datos de coincidencias múltiples
    strategyData.multipleCoincidences = {
        twoNumbers: [],
        threeNumbers: [],
        statistics: {
            totalTwoNumberCoincidences: 0,
            totalThreeNumberCoincidences: 0,
            rateOfTwoNumberCoincidences: 0,
            rateOfThreeNumberCoincidences: 0,
            totalSorteosAnalyzed: 0
        }
    };
    
    // Resetear todos los sorteos
    strategyData.allSorteos = [];

    // Crear mapa de apariciones
    const numberAppearances = createNumberAppearancesMap(lotteryData);
    
    // Crear un conjunto de todas las fechas de sorteos
    const allSorteosDates = new Set();
    
    // Recopilar todas las fechas únicas de todos los números
    for (const [number, appearances] of Object.entries(numberAppearances)) {
        appearances.forEach(appearance => {
            allSorteosDates.add(appearance.date);
        });
    }
    
    // Convertir a array y ordenar cronológicamente (más antigua primero)
    const sortedDates = Array.from(allSorteosDates)
        .map(dateStr => ({
            dateStr: dateStr,
            dateObj: parseDate(dateStr)
        }))
        .filter(item => item.dateObj !== null)
        .sort((a, b) => a.dateObj - b.dateObj);

    console.log(`Analizando ${sortedDates.length} sorteos para coincidencias múltiples...`);
    
    // Analizar cada fecha de sorteo
    sortedDates.forEach((sorteoInfo, index) => {
        const sorteoDate = sorteoInfo.dateStr;
        const sorteoDateObj = sorteoInfo.dateObj;
        
        // Obtener números ganadores de este sorteo
        const winningNumbers = getWinningNumbersForDate(sorteoDate, numberAppearances);
        
        if (winningNumbers.length === 0) return; // Si no hay números ganadores para esta fecha, continuar
        
        // Obtener candidatos activos en esta fecha
        const activeCandidatesAtDate = getCandidatesAtDate(sorteoDateObj, numberAppearances);
        
        // Verificar coincidencias (incluir todos los sorteos, incluso con 0 candidatos)
        const coincidences = checkCoincidencesInDraw(winningNumbers, activeCandidatesAtDate);
        
        // NUEVO: Crear registro completo del sorteo
        const sorteoData = {
            date: sorteoDate,
            dateObj: sorteoDateObj,
            winningNumbers: winningNumbers,
            candidatesAtTime: activeCandidatesAtDate.map(c => c.number),
            coincidences: coincidences.matchingNumbers,
            coincidenceCount: coincidences.coincidenceCount,
            type: coincidences.coincidenceCount === 0 ? "no_coincidences" :
                  coincidences.coincidenceCount === 1 ? "one_number" :
                  coincidences.coincidenceCount === 2 ? "two_numbers" : "three_numbers",
            candidateDetails: coincidences.candidateDetails,
            totalCandidates: activeCandidatesAtDate.length
        };
        
        // Agregar a todos los sorteos
        strategyData.allSorteos.push(sorteoData);
        
        // Solo registrar en estadísticas si hay candidatos activos
        if (activeCandidatesAtDate.length >= 2 && coincidences.coincidenceCount >= 2) {
            if (coincidences.coincidenceCount === 2) {
                strategyData.multipleCoincidences.twoNumbers.push(sorteoData);
                strategyData.multipleCoincidences.statistics.totalTwoNumberCoincidences++;
            } else if (coincidences.coincidenceCount === 3) {
                strategyData.multipleCoincidences.threeNumbers.push(sorteoData);
                strategyData.multipleCoincidences.statistics.totalThreeNumberCoincidences++;
            }
        }
        
        strategyData.multipleCoincidences.statistics.totalSorteosAnalyzed++;
    });
    
    // Calcular tasas
    const totalAnalyzed = strategyData.multipleCoincidences.statistics.totalSorteosAnalyzed;
    if (totalAnalyzed > 0) {
        strategyData.multipleCoincidences.statistics.rateOfTwoNumberCoincidences = 
            Math.round((strategyData.multipleCoincidences.statistics.totalTwoNumberCoincidences / totalAnalyzed) * 100);
        strategyData.multipleCoincidences.statistics.rateOfThreeNumberCoincidences = 
            Math.round((strategyData.multipleCoincidences.statistics.totalThreeNumberCoincidences / totalAnalyzed) * 100);
    }
    
    // Ordenar todos los sorteos por fecha (más reciente primero)
    strategyData.allSorteos.sort((a, b) => b.dateObj - a.dateObj);
    
    // Inicializar con todos los sorteos
    strategyData.filteredCoincidences = [...strategyData.allSorteos];
    
    console.log('Análisis de coincidencias múltiples completado:', strategyData.multipleCoincidences.statistics);
    console.log('Total sorteos analizados:', strategyData.allSorteos.length);
}
/**
 * Obtener números ganadores para una fecha específica
 */
function getWinningNumbersForDate(date, numberAppearances) {
    const winningNumbers = [];
    
    for (const [number, appearances] of Object.entries(numberAppearances)) {
        const appearanceOnDate = appearances.find(app => app.date === date);
        if (appearanceOnDate) {
            winningNumbers.push({
                number: number,
                positions: appearanceOnDate.positions
            });
        }
    }
    
    return winningNumbers;
}

/**
 * Obtener candidatos activos en una fecha específica
 */
function getCandidatesAtDate(targetDate, numberAppearances) {
    const activeCandidates = [];
    
    for (const [number, appearances] of Object.entries(numberAppearances)) {
        if (appearances.length < 2) continue;
        
        // Buscar patrones de 2 apariciones dentro de 10 días que estén activos en la fecha objetivo
        for (let i = 0; i < appearances.length - 1; i++) {
            const firstAppearance = appearances[i];
            
            for (let j = i + 1; j < appearances.length; j++) {
                const secondAppearance = appearances[j];
                const daysBetween = daysDifference(firstAppearance.dateObj, secondAppearance.dateObj);
                
                if (daysBetween <= 10) {
                    // Ordenar cronológicamente
                    const chronoFirst = firstAppearance.dateObj > secondAppearance.dateObj ? secondAppearance : firstAppearance;
                    const chronoSecond = firstAppearance.dateObj > secondAppearance.dateObj ? firstAppearance : secondAppearance;
                    
                    // Verificar si en la fecha objetivo, este número era candidato activo
                    const daysSinceSecond = daysDifference(chronoSecond.dateObj, targetDate);
                    
                    // El número es candidato activo si:
                    // 1. La fecha objetivo es DESPUÉS de la segunda aparición
                    // 2. Han pasado menos de 10 días desde la segunda aparición
                    // 3. No ha salido una tercera vez aún
                    if (targetDate >= chronoSecond.dateObj && daysSinceSecond <= 10) {
                        // Verificar que no haya salido una tercera vez antes de la fecha objetivo
                        const hasThirdAppearance = appearances.some(app => 
                            app.dateObj > chronoSecond.dateObj && app.dateObj <= targetDate
                        );
                        
                        if (!hasThirdAppearance) {
                            activeCandidates.push({
                                number: number,
                                firstDate: chronoFirst.date,
                                secondDate: chronoSecond.date,
                                daysSinceSecond: daysSinceSecond,
                                daysRemaining: Math.max(0, 10 - daysSinceSecond),
                                firstDateObj: chronoFirst.dateObj,
                                secondDateObj: chronoSecond.dateObj
                            });
                        }
                    }
                    
                    break; // Solo considerar el primer patrón válido para este número
                }
            }
        }
    }
    
    return activeCandidates;
}

/**
 * Verificar coincidencias entre números ganadores y candidatos activos
 */
function checkCoincidencesInDraw(winningNumbers, activeCandidates) {
    const matchingNumbers = [];
    const candidateDetails = [];
    
    // Crear un set de números ganadores para búsqueda rápida
    const winningNumbersSet = new Set(winningNumbers.map(w => w.number));
    
    // Verificar cada candidato activo
    activeCandidates.forEach(candidate => {
        if (winningNumbersSet.has(candidate.number)) {
            matchingNumbers.push(candidate.number);
            
            // Encontrar en qué posición salió
            const winningNumberData = winningNumbers.find(w => w.number === candidate.number);
            
            candidateDetails.push({
                number: candidate.number,
                daysSinceSecond: candidate.daysSinceSecond,
                daysRemaining: candidate.daysRemaining,
                firstDate: candidate.firstDate,
                secondDate: candidate.secondDate,
                positions: winningNumberData ? winningNumberData.positions : []
            });
        }
    });
    
    return {
        matchingNumbers: matchingNumbers,
        coincidenceCount: matchingNumbers.length,
        candidateDetails: candidateDetails
    };
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
    updateMultipleCoincidencesDisplay();
    
    // AGREGAR ESTAS LÍNEAS:
    setupCoincidenceFilters();
    updateCoincidencesCounter();
    updateFilteredCoincidencesList();
}

/**
 * NUEVA FUNCIÓN: Actualizar visualización de coincidencias múltiples
 */
function updateMultipleCoincidencesDisplay() {
    // Actualizar estadísticas de coincidencias múltiples
    const twoNumberCoincidences = document.getElementById('twoNumberCoincidences');
    const threeNumberCoincidences = document.getElementById('threeNumberCoincidences');
    const twoNumberRate = document.getElementById('twoNumberRate');
    const threeNumberRate = document.getElementById('threeNumberRate');
    
    if (twoNumberCoincidences) {
        twoNumberCoincidences.textContent = strategyData.multipleCoincidences.statistics.totalTwoNumberCoincidences;
    }
    
    if (threeNumberCoincidences) {
        threeNumberCoincidences.textContent = strategyData.multipleCoincidences.statistics.totalThreeNumberCoincidences;
    }
    
    if (twoNumberRate) {
        twoNumberRate.textContent = `${strategyData.multipleCoincidences.statistics.rateOfTwoNumberCoincidences}%`;
    }
    
    if (threeNumberRate) {
        threeNumberRate.textContent = `${strategyData.multipleCoincidences.statistics.rateOfThreeNumberCoincidences}%`;
    }
    
    // Actualizar lista de coincidencias
    const coincidencesList = document.getElementById('coincidencesList');
    if (coincidencesList) {
        updateCoincidencesList();
    }
}


/**
 * Actualizar lista de coincidencias (ahora usa la versión filtrada)
 */
function updateCoincidencesList() {
    // Esta función ahora delega a la nueva función de filtrado
    updateFilteredCoincidencesList();
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

/**
 * NUEVA FUNCIÓN: Configurar eventos de filtros
 */
function setupCoincidenceFilters() {
    const filterRadios = document.querySelectorAll('input[name="coincidenceFilter"]');
    
    filterRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                filterCoincidences(e.target.value);
            }
        });
    });
}

/**
 * NUEVA FUNCIÓN: Filtrar coincidencias
 */
function filterCoincidences(filterValue) {
    const allSorteos = strategyData.allSorteos;
    
    if (filterValue === 'all') {
        strategyData.filteredCoincidences = [...allSorteos];
    } else {
        const targetCount = parseInt(filterValue);
        strategyData.filteredCoincidences = allSorteos.filter(sorteo => 
            sorteo.coincidenceCount === targetCount
        );
    }
    
    // Actualizar la visualización
    updateFilteredCoincidencesList();
    updateCoincidencesCounter();
}

/**
 * NUEVA FUNCIÓN: Actualizar contador de coincidencias filtradas
 */
function updateCoincidencesCounter() {
    const filteredCountElement = document.getElementById('filteredCoincidencesCount');
    const totalCountElement = document.getElementById('totalCoincidencesCount');
    
    if (filteredCountElement) {
        filteredCountElement.textContent = strategyData.filteredCoincidences.length;
    }
    
    if (totalCountElement) {
        totalCountElement.textContent = strategyData.allSorteos.length;
    }
}

/**
 * NUEVA FUNCIÓN: Actualizar lista de coincidencias filtradas
 */
function updateFilteredCoincidencesList() {
    const coincidencesList = document.getElementById('coincidencesList');
    const noCoincidencesMessage = document.getElementById('noCoincidencesMessage');
    
    if (!coincidencesList) return;
    
    if (strategyData.filteredCoincidences.length === 0) {
        coincidencesList.innerHTML = '';
        if (noCoincidencesMessage) noCoincidencesMessage.classList.remove('hidden');
        return;
    }
    
    if (noCoincidencesMessage) noCoincidencesMessage.classList.add('hidden');
    
    // Crear HTML para cada sorteo filtrado
    coincidencesList.innerHTML = strategyData.filteredCoincidences.map(sorteo => {
        return createSorteoHTML(sorteo);
    }).join('');
}

/**
 * NUEVA FUNCIÓN: Crear HTML para un sorteo
 */
function createSorteoHTML(sorteo) {
    const coincidenceCount = sorteo.coincidenceCount;
    
    // Determinar colores y texto según el número de coincidencias
    let borderColor, bgGradient, iconColor, badgeColor, typeText, icon;
    
    switch (coincidenceCount) {
        case 0:
            borderColor = 'border-gray-400';
            bgGradient = 'from-gray-50 to-gray-100';
            iconColor = 'text-gray-600';
            badgeColor = 'bg-gray-500';
            typeText = 'SIN COINCIDENCIAS';
            icon = 'fas fa-times';
            break;
        case 1:
            borderColor = 'border-yellow-400';
            bgGradient = 'from-yellow-50 to-yellow-100';
            iconColor = 'text-yellow-600';
            badgeColor = 'bg-yellow-500';
            typeText = 'UNA COINCIDENCIA';
            icon = 'fas fa-star';
            break;
        case 2:
            borderColor = 'border-blue-400';
            bgGradient = 'from-blue-50 to-indigo-50';
            iconColor = 'text-blue-600';
            badgeColor = 'bg-blue-500';
            typeText = 'DOBLE COINCIDENCIA';
            icon = 'fas fa-bullseye';
            break;
        case 3:
            borderColor = 'border-purple-400';
            bgGradient = 'from-purple-50 to-pink-50';
            iconColor = 'text-purple-600';
            badgeColor = 'bg-purple-500';
            typeText = 'TRIPLE COINCIDENCIA';
            icon = 'fas fa-crown';
            break;
        default:
            borderColor = 'border-green-400';
            bgGradient = 'from-green-50 to-green-100';
            iconColor = 'text-green-600';
            badgeColor = 'bg-green-500';
            typeText = 'MÚLTIPLE COINCIDENCIA';
            icon = 'fas fa-fire';
    }
    
    // Crear detalles de candidatos solo si hay coincidencias
    let candidateDetailsHTML = '';
    if (sorteo.candidateDetails && sorteo.candidateDetails.length > 0) {
        candidateDetailsHTML = `
            <div class="bg-white bg-opacity-50 rounded p-3">
                <div class="text-sm font-medium text-gray-800 mb-2">Detalles de los números que coincidieron:</div>
                ${sorteo.candidateDetails.map(candidate => `
                    <div class="text-sm text-gray-700 mb-1">
                        • <strong>${candidate.number}</strong>: Esperaba ${candidate.daysRemaining} días, 
                        salió en posición(es): ${candidate.positions.join(', ')}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center">
                    <i class="${icon} ${iconColor} mr-2"></i>
                    <span class="font-bold text-gray-800">${typeText}</span>
                </div>
                <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full">
                    ${sorteo.date}
                </span>
            </div>
            
            <div class="mb-3">
                <div class="text-sm text-gray-700 mb-2">
                    <strong>Números ganadores:</strong> ${sorteo.winningNumbers.map(w => w.number).join(', ')}
                </div>
                <div class="text-sm text-gray-700 mb-2">
                    <strong>Candidatos activos:</strong> ${sorteo.candidatesAtTime.length > 0 ? sorteo.candidatesAtTime.join(', ') : 'Ninguno'}
                </div>
                <div class="text-sm font-medium ${coincidenceCount > 0 ? 'text-green-700' : 'text-gray-600'}">
                    <strong>Coincidencias (${sorteo.coincidenceCount}):</strong> ${sorteo.coincidences.length > 0 ? sorteo.coincidences.join(', ') : 'Ninguna'}
                </div>
            </div>
            
            ${candidateDetailsHTML}
        </div>
    `;
}

// Exponer funciones globalmente para que main.js pueda acceder
window.strategyFunctions = {
    initThreeNumberStrategy,
    showStrategySection,
    hideStrategySection
};