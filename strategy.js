// updated_strategy.js - Adaptado para la nueva estructura HTML de Pega 3 Más
// Variables globales simplificadas
let simplifiedData = {
    coldNumbers: [],
    hotNumbers: [],
    repeatedNumbers: [],
    statistics: {
        totalNumbers: 0,
        numbersWithData: 0,
        averageDaysSinceSeen: 0,
        maxDaysSinceSeen: 0,
        minDaysSinceSeen: 0
    }
};

/**
 * Función principal para inicializar el análisis simplificado
 * Se llama desde main.js después de cargar los datos
 */
function initSimplifiedAnalysis(lotteryData) {
    console.log('Iniciando análisis simplificado para Pega 3 Más...');
    
    analyzeColdHotNumbers(lotteryData);
    analyzeRepeatedNumbers(lotteryData);
    updateSimplifiedDisplay();
    
    console.log('Análisis simplificado completado');
}

/**
 * Analizar números fríos y calientes basado en días sin salir
 */
function analyzeColdHotNumbers(lotteryData) {
    console.log('Analizando números fríos y calientes...');
    
    const numbersWithData = [];
    let totalDays = 0;
    let countWithData = 0;
    
    // Extraer datos de números con información de última aparición
    for (const [number, data] of Object.entries(lotteryData.numbers)) {
        if (data.daysSinceSeen !== null && data.daysSinceSeen !== undefined) {
            numbersWithData.push({
                number: number,
                daysSinceSeen: data.daysSinceSeen,
                lastSeen: data.lastSeen || 'N/A',
                totalAppearances: data.positions ? 
                    Object.values(data.positions).reduce((sum, count) => sum + count, 0) : 0
            });
            
            totalDays += data.daysSinceSeen;
            countWithData++;
        }
    }
    
    // Ordenar por días sin salir
    numbersWithData.sort((a, b) => b.daysSinceSeen - a.daysSinceSeen);
    
    // Separar en números fríos (más días sin salir) y calientes (menos días sin salir)
    simplifiedData.coldNumbers = numbersWithData.slice(0, 15); // Top 15 más fríos
    simplifiedData.hotNumbers = numbersWithData.slice(-20).reverse(); // Top 20 más calientes
    
    // Calcular estadísticas
    simplifiedData.statistics = {
        totalNumbers: Object.keys(lotteryData.numbers).length,
        numbersWithData: countWithData,
        averageDaysSinceSeen: countWithData > 0 ? Math.round(totalDays / countWithData) : 0,
        maxDaysSinceSeen: numbersWithData.length > 0 ? numbersWithData[0].daysSinceSeen : 0,
        minDaysSinceSeen: numbersWithData.length > 0 ? numbersWithData[numbersWithData.length - 1].daysSinceSeen : 0
    };
    
    console.log('Análisis de números fríos/calientes completado:', {
        totalAnalyzados: countWithData,
        numeroMasFrio: simplifiedData.coldNumbers[0]?.number,
        diasMasFrio: simplifiedData.coldNumbers[0]?.daysSinceSeen,
        numeroMasCaliente: simplifiedData.hotNumbers[0]?.number,
        diasMasCaliente: simplifiedData.hotNumbers[0]?.daysSinceSeen
    });
}

/**
 * Analizar números repetidos en los últimos 30 días
 */
function analyzeRepeatedNumbers(lotteryData) {
    console.log('Analizando números repetidos en últimos 30 días...');
    
    if (!lotteryData.repeatedInLast30Days) {
        console.log('No hay datos de números repetidos en últimos 30 días');
        simplifiedData.repeatedNumbers = [];
        return;
    }
    
    const repeatedData = lotteryData.repeatedInLast30Days;
    
    // Convertir a array y ordenar por número de ocurrencias
    simplifiedData.repeatedNumbers = Object.entries(repeatedData)
        .map(([number, data]) => ({
            number: number,
            occurrences: data.occurrences,
            dates: data.dates,
            lastOccurrence: data.dates[0] // La primera fecha es la más reciente
        }))
        .sort((a, b) => b.occurrences - a.occurrences);
    
    console.log('Análisis de números repetidos completado:', {
        totalRepetidos: simplifiedData.repeatedNumbers.length,
        masRepetido: simplifiedData.repeatedNumbers[0]?.number,
        vecesRepetido: simplifiedData.repeatedNumbers[0]?.occurrences
    });
}

/**
 * Actualizar la visualización simplificada - ADAPTADO PARA NUEVA ESTRUCTURA
 */
function updateSimplifiedDisplay() {
    updateRepeatedNumbersDisplay();
    updateColdNumbersDisplay();
    updateTopStatsDisplay(); // Actualizar estadísticas del header
}

/**
 * Actualizar visualización de números repetidos - NUEVA UBICACIÓN
 */
function updateRepeatedNumbersDisplay() {
    const repeatedNumbersList = document.getElementById('repeatedNumbersList');
    const repeatedCount = document.getElementById('repeatedCount');
    const noRepeatedMessage = document.getElementById('noRepeatedMessage');
    
    if (!repeatedNumbersList) {
        console.log('No se encontró el elemento repeatedNumbersList');
        return;
    }
    
    // Actualizar contador
    if (repeatedCount) {
        repeatedCount.textContent = simplifiedData.repeatedNumbers.length;
    }
    
    // Si no hay números repetidos
    if (simplifiedData.repeatedNumbers.length === 0) {
        repeatedNumbersList.innerHTML = '';
        if (noRepeatedMessage) {
            noRepeatedMessage.classList.remove('hidden');
        }
        return;
    }
    
    // Ocultar mensaje de "no hay datos" si existe
    if (noRepeatedMessage) {
        noRepeatedMessage.classList.add('hidden');
    }
    
    // Crear HTML para números repetidos con diseño compacto
    repeatedNumbersList.innerHTML = simplifiedData.repeatedNumbers.map((numberData, index) => {
        // Determinar color según frecuencia de repetición
        let bgGradient, borderColor, badgeColor;
        
        if (numberData.occurrences >= 5) {
            bgGradient = 'from-purple-50 to-purple-100';
            borderColor = 'border-purple-500';
            badgeColor = 'bg-purple-500';
        } else if (numberData.occurrences >= 3) {
            bgGradient = 'from-indigo-50 to-indigo-100';
            borderColor = 'border-indigo-500';
            badgeColor = 'bg-indigo-500';
        } else {
            bgGradient = 'from-blue-50 to-blue-100';
            borderColor = 'border-blue-500';
            badgeColor = 'bg-blue-500';
        }
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-purple-600 font-bold w-6">#${index + 1}</span>
                        <span class="text-xl font-bold text-gray-800">${numberData.number}</span>
                    </div>
                    <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full font-medium">
                        ${numberData.occurrences}x
                    </span>
                </div>
                <div class="text-sm text-gray-700 space-y-1">
                    <div><strong>Última aparición:</strong> ${numberData.lastOccurrence}</div>
                </div>
                <div class="bg-white bg-opacity-50 rounded p-2 mt-2">
                    <div class="text-xs text-gray-600 mb-1">Fechas recientes:</div>
                    <div class="text-xs text-gray-700">
                        ${numberData.dates.slice(0, 3).join(', ')}
                        ${numberData.dates.length > 3 ? '...' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Actualizar visualización de números fríos - NUEVA UBICACIÓN
 */
function updateColdNumbersDisplay() {
    const coldNumbersList = document.getElementById('coldNumbersList');
    const coldCount = document.getElementById('coldCount');
    
    if (!coldNumbersList) {
        console.log('No se encontró el elemento coldNumbersList');
        return;
    }
    
    // Actualizar contador
    if (coldCount) {
        coldCount.textContent = simplifiedData.coldNumbers.length;
    }
    
    if (simplifiedData.coldNumbers.length === 0) {
        coldNumbersList.innerHTML = '<div class="text-center text-gray-500 p-4">No hay datos de números fríos</div>';
        return;
    }
    
    // Crear HTML para números fríos con diseño compacto
    coldNumbersList.innerHTML = simplifiedData.coldNumbers.map((numberData, index) => {
        // Determinar color según el ranking
        let bgGradient, borderColor;
        
        if (index < 5) {
            bgGradient = 'from-red-50 to-red-100';
            borderColor = 'border-red-500';
        } else if (index < 10) {
            bgGradient = 'from-orange-50 to-orange-100';
            borderColor = 'border-orange-500';
        } else {
            bgGradient = 'from-yellow-50 to-yellow-100';
            borderColor = 'border-yellow-500';
        }
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-blue-600 font-bold w-6">#${index + 1}</span>
                        <span class="text-xl font-bold text-gray-800">${numberData.number}</span>
                    </div>
                    <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        ${numberData.daysSinceSeen}d
                    </span>
                </div>
                <div class="text-sm text-gray-700 space-y-1">
                    <div><strong>Última aparición:</strong> ${numberData.lastSeen}</div>
                    <div><strong>Total apariciones:</strong> ${numberData.totalAppearances}</div>
                </div>
                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-red-500 h-2 rounded-full" 
                         style="width: ${Math.min((numberData.daysSinceSeen / simplifiedData.statistics.maxDaysSinceSeen) * 100, 100)}%">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Actualizar estadísticas del header superior
 */
function updateTopStatsDisplay() {
    // Actualizar estadísticas en el header superior
    const mostRepeatedElement = document.getElementById('mostRepeatedNumber');
    const coldestNumberElement = document.getElementById('coldestNumber');
    
    // Número más repetido
    if (mostRepeatedElement && simplifiedData.repeatedNumbers.length > 0) {
        const mostRepeated = simplifiedData.repeatedNumbers[0];
        mostRepeatedElement.textContent = `${mostRepeated.number} (${mostRepeated.occurrences} veces)`;
    } else if (mostRepeatedElement) {
        mostRepeatedElement.textContent = '-- (0 veces)';
    }
    
    // Número más frío
    if (coldestNumberElement && simplifiedData.coldNumbers.length > 0) {
        const coldest = simplifiedData.coldNumbers[0];
        coldestNumberElement.textContent = `${coldest.number} (${coldest.daysSinceSeen} días)`;
    } else if (coldestNumberElement) {
        coldestNumberElement.textContent = '-- (0 días)';
    }
}

// Exponer funciones globalmente para que main.js pueda acceder
window.simplifiedFunctions = {
    initSimplifiedAnalysis,
    updateSimplifiedDisplay,
    updateRepeatedNumbersDisplay,
    updateColdNumbersDisplay,
    updateTopStatsDisplay
};

console.log("Script actualizado cargado - Adaptado para nueva estructura HTML");
console.log("Funciones disponibles:", Object.keys(window.simplifiedFunctions));