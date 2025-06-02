// strategy.js - Lógica para la Estrategia de los 3 Números
// Variables globales para la estrategia
let strategyData = {
    activeCandidates: [],
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
    // Resetear datos de estrategia
    strategyData.activeCandidates = [];
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
    
    // Lista de patrones completados para evitar superposiciones
    const completedPatterns = [];
    
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
                
                // Verificar si este par ya fue usado en un patrón completado
                const isAlreadyUsed = completedPatterns.some(pattern => 
                    (pattern.firstDate === chronoFirst.date && pattern.secondDate === chronoSecond.date) ||
                    isOverlappingPattern(pattern, chronoFirst, chronoSecond)
                );
                
                if (isAlreadyUsed) continue;
                
                // Encontramos 2 apariciones en 10 días
                const pattern = {
                    number: number,
                    firstDate: chronoFirst.date,
                    secondDate: chronoSecond.date,
                    daysBetween: daysBetween,
                    firstDateObj: chronoFirst.dateObj,
                    secondDateObj: chronoSecond.dateObj
                };
                
                // Buscar si hay una tercera aparición en los siguientes 10 días después de la segunda
                const thirdAppearance = findThirdAppearanceExcludingUsed(appearances, chronoSecond.dateObj, completedPatterns);
                
                if (thirdAppearance) {
                    // Patrón completado exitosamente
                    const daysToThird = daysDifference(chronoFirst.dateObj, thirdAppearance.dateObj);
                    
                    const completedPattern = {
                        ...pattern,
                        thirdDate: thirdAppearance.date,
                        thirdDateObj: thirdAppearance.dateObj,
                        daysToThird: daysToThird,
                        success: true,
                        status: 'completed'
                    };
                    
                    strategyData.statistics.successfulPredictions++;
                    
                    // Agregar a patrones completados para evitar superposiciones futuras
                    completedPatterns.push(completedPattern);
                    
                } else {
                    // Verificar si ya pasaron más de 10 días desde la segunda aparición
                    const daysSinceSecond = daysDifference(chronoSecond.dateObj, today);
                    if (daysSinceSecond > 10) {
                        // Patrón falló
                        strategyData.statistics.failedPredictions++;
                        
                        // Agregar a patrones completados (fallidos) para evitar reutilización
                        completedPatterns.push({
                            ...pattern,
                            thirdDate: null,
                            success: false,
                            status: 'failed'
                        });
                        
                    } else {
                        // Patrón activo - candidato actual (solo si no se superpone con patrones completados)
                        const isOverlapping = completedPatterns.some(completedPattern => 
                            isOverlappingPattern(completedPattern, chronoFirst, chronoSecond)
                        );
                        
                        if (!isOverlapping) {
                            strategyData.activeCandidates.push({
                                ...pattern,
                                daysSinceSecond: daysSinceSecond,
                                daysRemaining: Math.max(0, 10 - daysSinceSecond),
                                status: 'active'
                            });
                        }
                    }
                }
                
                strategyData.statistics.totalPredictions++;
                break; // Solo contar el primer patrón válido para este índice i
            }
        }
    }
}

/**
 * Verificar si dos patrones se superponen temporalmente
 */
function isOverlappingPattern(completedPattern, newFirst, newSecond) {
    if (!completedPattern.thirdDateObj) return false;
    
    // Un patrón se superpone si cualquiera de las nuevas fechas está dentro del rango del patrón completado
    const completedStart = completedPattern.firstDateObj;
    const completedEnd = new Date(completedPattern.thirdDateObj.getTime() + (10 * 24 * 60 * 60 * 1000)); // +10 días después del tercero
    
    return (newFirst.dateObj >= completedStart && newFirst.dateObj <= completedEnd) ||
           (newSecond.dateObj >= completedStart && newSecond.dateObj <= completedEnd);
}

/**
 * Buscar tercera aparición excluyendo las que están en patrones completados
 */
function findThirdAppearanceExcludingUsed(appearances, secondDate, completedPatterns) {
    for (let k = 0; k < appearances.length; k++) {
        const potentialThird = appearances[k];
        const daysFromSecond = daysDifference(secondDate, potentialThird.dateObj);
        
        // La tercera aparición debe ser DESPUÉS de la segunda fecha (más reciente)
        if (potentialThird.dateObj > secondDate && daysFromSecond <= 10) {
            // Verificar que esta aparición no esté ya usada en un patrón completado
            const isUsedInCompleted = completedPatterns.some(pattern => 
                pattern.thirdDate === potentialThird.date
            );
            
            if (!isUsedInCompleted) {
                return potentialThird;
            }
        }
    }
    return null;
}

/**
 * Analizar coincidencias múltiples
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
        
        // Crear registro completo del sorteo
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
    strategyData.filteredCoincidences = strategyData.allSorteos.slice(0, 45);

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
        
        // Aplicar la misma lógica de patrones independientes que en analyzeNumberPattern
        const candidatesForThisNumber = findValidCandidatesForNumber(number, appearances, targetDate);
        activeCandidates.push(...candidatesForThisNumber);
    }
    
    return activeCandidates;
}

/**
 * Encontrar candidatos válidos para un número específico en una fecha objetivo
 */
function findValidCandidatesForNumber(number, appearances, targetDate) {
    const candidates = [];
    const completedPatterns = [];
    
    // Primero, identificar todos los patrones completados hasta la fecha objetivo
    for (let i = 0; i < appearances.length - 1; i++) {
        const firstAppearance = appearances[i];
        
        for (let j = i + 1; j < appearances.length; j++) {
            const secondAppearance = appearances[j];
            const daysBetween = daysDifference(firstAppearance.dateObj, secondAppearance.dateObj);
            
            if (daysBetween <= 10) {
                // Ordenar cronológicamente
                const chronoFirst = firstAppearance.dateObj > secondAppearance.dateObj ? secondAppearance : firstAppearance;
                const chronoSecond = firstAppearance.dateObj > secondAppearance.dateObj ? firstAppearance : secondAppearance;
                
                // Verificar si este par ya fue usado en un patrón completado
                const isAlreadyUsed = completedPatterns.some(pattern => 
                    (pattern.firstDate === chronoFirst.date && pattern.secondDate === chronoSecond.date) ||
                    isOverlappingPatternForCandidate(pattern, chronoFirst, chronoSecond)
                );
                
                if (isAlreadyUsed) continue;
                
                // Buscar si hay una tercera aparición que complete el patrón ANTES O EN la fecha objetivo
                const thirdAppearance = findThirdAppearanceBeforeDate(appearances, chronoSecond.dateObj, targetDate, completedPatterns);
                
                if (thirdAppearance) {
                    // Patrón completado antes de la fecha objetivo
                    const completedPattern = {
                        number: number,
                        firstDate: chronoFirst.date,
                        secondDate: chronoSecond.date,
                        thirdDate: thirdAppearance.date,
                        firstDateObj: chronoFirst.dateObj,
                        secondDateObj: chronoSecond.dateObj,
                        thirdDateObj: thirdAppearance.dateObj,
                        completed: true
                    };
                    
                    completedPatterns.push(completedPattern);
                } else {
                    // Verificar si este patrón estaba activo en la fecha objetivo
                    const daysSinceSecond = daysDifference(chronoSecond.dateObj, targetDate);
                    
                    // El número es candidato activo si:
                    // 1. La fecha objetivo es DESPUÉS de la segunda aparición
                    // 2. Han pasado menos de 10 días desde la segunda aparición
                    // 3. No se superpone con patrones completados
                    if (targetDate > chronoSecond.dateObj && daysSinceSecond <= 10) {
                        const isOverlapping = completedPatterns.some(completedPattern => 
                            isOverlappingPatternForCandidate(completedPattern, chronoFirst, chronoSecond)
                        );
                        
                        if (!isOverlapping) {
                            candidates.push({
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
                }
                
                break; // Solo el primer patrón válido para este índice i
            }
        }
    }
    
    return candidates;
}

/**
 * Buscar tercera aparición que complete el patrón antes de la fecha objetivo
 */
function findThirdAppearanceBeforeDate(appearances, secondDate, targetDate, completedPatterns) {
    for (let k = 0; k < appearances.length; k++) {
        const potentialThird = appearances[k];
        const daysFromSecond = daysDifference(secondDate, potentialThird.dateObj);
        
        // La tercera aparición debe ser:
        // 1. DESPUÉS de la segunda fecha
        // 2. ANTES O EN la fecha objetivo
        // 3. Dentro de 10 días de la segunda aparición
        if (potentialThird.dateObj > secondDate && 
            potentialThird.dateObj < targetDate && 
            daysFromSecond <= 10) {
            
            // Verificar que esta aparición no esté ya usada en un patrón completado
            const isUsedInCompleted = completedPatterns.some(pattern => 
                pattern.thirdDate === potentialThird.date
            );
            
            if (!isUsedInCompleted) {
                return potentialThird;
            }
        }
    }
    return null;
}

/**
 * Verificar si dos patrones se superponen temporalmente (versión para candidatos)
 */
function isOverlappingPatternForCandidate(completedPattern, newFirst, newSecond) {
    if (!completedPattern.thirdDateObj) return false;
    
    // Un patrón se superpone si cualquiera de las nuevas fechas está dentro del rango del patrón completado
    const completedStart = completedPattern.firstDateObj;
    const completedEnd = new Date(completedPattern.thirdDateObj.getTime() + (10 * 24 * 60 * 60 * 1000)); // +10 días después del tercero
    
    return (newFirst.dateObj >= completedStart && newFirst.dateObj <= completedEnd) ||
           (newSecond.dateObj >= completedStart && newSecond.dateObj <= completedEnd);
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
}

/**
 * Calcular estadísticas de qué día aparece el tercer número (DESHABILITADO)
 */
function calculateDayByDayStatistics() {
    // Función deshabilitada - requiere historial de predicciones
    // Se puede reimplementar en el futuro si se necesita
    strategyData.dayByDayStats = null;
}

/**
 * Asignar categorías de color basadas SOLO en días restantes
 */
function assignProbabilityCategories() {
    strategyData.activeCandidates.forEach(candidate => {
        const daysRemaining = candidate.daysRemaining;
        
        // Sistema de colores simplificado basado en urgencia
        if (daysRemaining <= 3) {
            // CRÍTICO - Quedan pocos días (0-3 días)
            candidate.probabilityColor = 'red';
            candidate.urgencyLevel = 'critical';
            candidate.urgencyText = 'Crítico';
        } else if (daysRemaining <= 6) {
            // MEDIO - A mitad del período (4-6 días)
            candidate.probabilityColor = 'yellow';
            candidate.urgencyLevel = 'medium';
            candidate.urgencyText = 'Medio';
        } else {
            // RECIENTE - Acaba de empezar el período (7-10 días)
            candidate.probabilityColor = 'green';
            candidate.urgencyLevel = 'recent';
            candidate.urgencyText = 'Reciente';
        }
        
        candidate.todayDay = candidate.daysSinceSecond;
    });
}

/**
 * Actualizar la visualización de la estrategia en el HTML
 */
function updateStrategyDisplay() {
    updateStatisticsDisplay();
    updateDayByDayDisplay();
    updateActiveCandidatesDisplay();
    updateMultipleCoincidencesDisplay();
    
    // Configurar filtros y actualizar listas
    setupCoincidenceFilters();
    updateCoincidencesCounter();
    updateFilteredCoincidencesList();
}

/**
 * Actualizar visualización de coincidencias múltiples
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
 * Actualizar lista de coincidencias (delega a la versión filtrada)
 */
function updateCoincidencesList() {
    updateFilteredCoincidencesList();
}

/**
 * Actualizar estadísticas por día (OCULTAR SECCIÓN COMPLETAMENTE)
 */
function updateDayByDayDisplay() {
    const dayStatsContainer = document.getElementById('dayByDayStats');
    if (!dayStatsContainer) return;
    
    // Ocultar completamente la sección padre de estadísticas por día
    const parentSection = dayStatsContainer.closest('.bg-gradient-to-r');
    if (parentSection) {
        parentSection.style.display = 'none';
    }
    
    // También vaciar el contenedor por si acaso
    dayStatsContainer.innerHTML = '';
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
 * Actualizar lista de candidatos activos (VERSIÓN SIMPLIFICADA)
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
        // Determinar colores según urgencia (días restantes)
        let borderColor, bgGradient, badgeColor, statusText;
        
        if (candidate.probabilityColor === 'red') {
            // CRÍTICO - Quedan pocos días
            borderColor = 'border-red-500';
            bgGradient = 'from-red-50 to-red-100';
            badgeColor = 'bg-red-500';
            statusText = 'CRÍTICO';
        } else if (candidate.probabilityColor === 'yellow') {
            // MEDIO - A mitad del período
            borderColor = 'border-yellow-500';
            bgGradient = 'from-yellow-50 to-yellow-100';
            badgeColor = 'bg-yellow-500';
            statusText = 'MEDIO';
        } else {
            // RECIENTE - Acaba de empezar
            borderColor = 'border-green-500';
            bgGradient = 'from-green-50 to-green-100';
            badgeColor = 'bg-green-500';
            statusText = 'RECIENTE';
        }
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-2xl font-bold text-gray-800">${candidate.number}</span>
                    <div class="flex flex-col items-end space-y-1">
                        <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full font-medium">
                            ${statusText}
                        </span>
                        <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full">
                            ${candidate.daysRemaining} días restantes
                        </span>
                    </div>
                </div>
                <div class="text-sm text-gray-700 space-y-1 mb-3">
                    <div>• Salió por <strong>primera vez</strong> el <strong>${candidate.firstDate}</strong></div>
                    <div>• Salió por <strong>segunda vez</strong> el <strong>${candidate.secondDate}</strong></div>
                    <div class="text-blue-600">• <strong>Esperando 3ra aparición</strong> (${candidate.daysSinceSecond} días desde la 2da vez)</div>
                </div>
                <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div class="${badgeColor} h-2 rounded-full" style="width: ${((10 - candidate.daysRemaining) / 10) * 100}%"></div>
                </div>
                <div class="mt-2 text-center">
                    <span class="text-xs text-gray-600">
                        Progreso: ${10 - candidate.daysRemaining}/10 días
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Configurar eventos de filtros
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
 * Filtrar coincidencias
 */
function filterCoincidences(filterValue) {
    const allSorteos = strategyData.allSorteos;
    
if (filterValue === 'all') {
    strategyData.filteredCoincidences = allSorteos.slice(0, 45);
} else {
    const targetCount = parseInt(filterValue);
    const filtered = allSorteos.filter(sorteo => sorteo.coincidenceCount === targetCount);
    strategyData.filteredCoincidences = filtered.slice(0, 45);
}
    
    // Actualizar visualización
    updateCoincidencesCounter();
    updateFilteredCoincidencesList();
}

/**
 * Actualizar contador de coincidencias filtradas
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
 * Actualizar lista de coincidencias filtradas (MÁXIMO 45 ELEMENTOS)
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
    
    // LIMITAR A 45 ELEMENTOS MÁXIMO
    const maxItems = 45;
    const itemsToShow = strategyData.filteredCoincidences.slice(0, maxItems);
    
    // Mostrar los elementos limitados
    coincidencesList.innerHTML = itemsToShow.map(sorteo => {
        return createSorteoHTML(sorteo);
    }).join('');
    
    // Si hay más de 45 elementos, agregar un mensaje indicativo
    if (strategyData.filteredCoincidences.length > maxItems) {
        const remainingCount = strategyData.filteredCoincidences.length - maxItems;
        coincidencesList.innerHTML += `
            <div class="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <p class="text-purple-700 font-medium">
                    <i class="fas fa-info-circle mr-2"></i>
                    Mostrando los primeros ${maxItems} sorteos más recientes
                </p>
                <p class="text-purple-600 text-sm mt-1">
                    (${remainingCount} sorteos adicionales no mostrados)
                </p>
            </div>
        `;
    }
}

/**
 * Crear HTML para un sorteo
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

console.log("Sistema de visualización actualizado:");
console.log("- Máximo 45 elementos por categoría");
console.log("- Sin paginación");
console.log("- Mensaje indicativo cuando hay más de 45 elementos");