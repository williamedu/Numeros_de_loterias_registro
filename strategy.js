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
    
    // LIMITAR A MÁXIMO 5 NÚMEROS FRÍOS
    simplifiedData.coldNumbers = numbersWithData.slice(0, 5); // Solo los TOP 5 más fríos
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
    // FILTRAR SOLO LOS QUE SE HAN REPETIDO MÁS DE 1 VEZ Y LIMITAR A 5
    simplifiedData.repeatedNumbers = Object.entries(repeatedData)
        .map(([number, data]) => ({
            number: number,
            occurrences: data.occurrences,
            dates: data.dates,
            lastOccurrence: data.dates[0] // La primera fecha es la más reciente
        }))
        .filter(item => item.occurrences > 1) // SOLO LOS QUE SE HAN REPETIDO MÁS DE 1 VEZ
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 5); // LIMITAR A MÁXIMO 5 NÚMEROS
    
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
    
    // Actualizar contador - MOSTRAR EL NÚMERO REAL DE ELEMENTOS (MÁXIMO 5)
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
        // Verificar si es número ganador (apareció en el último sorteo)
        const lastDrawDate = window.lotteryData && window.lotteryData.lastUpdated ? 
                            window.lotteryData.lastUpdated.split(' ')[0] : null;
        const isWinner = lastDrawDate && numberData.dates.includes(lastDrawDate);
        
        // Determinar color según frecuencia de repetición o si es ganador
        let bgGradient, borderColor, badgeColor;
        
        if (isWinner) {
            // Color morado para números ganadores
            bgGradient = 'from-purple-100 to-purple-200';
            borderColor = 'border-purple-500';
            badgeColor = 'bg-purple-500';
        } else if (numberData.occurrences >= 5) {
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
        
        const rankText = isWinner ? '🏆' : `#${index + 1}`;
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-3 ${isWinner ? 'shadow-lg' : ''}">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm ${isWinner ? 'text-purple-600' : 'text-purple-600'} font-bold w-6">${rankText}</span>
                        <span class="text-xl font-bold ${isWinner ? 'text-purple-800' : 'text-gray-800'}">${numberData.number}</span>
                    </div>
                    <span class="text-xs ${badgeColor} text-white px-2 py-1 rounded-full font-medium">
                        ${numberData.occurrences}x
                    </span>
                </div>
                <div class="text-sm ${isWinner ? 'text-purple-700' : 'text-gray-700'} space-y-1">
                    <div><strong>Apariciones:</strong> ${numberData.dates.slice(0, 3).join(', ')}${numberData.dates.length > 3 ? '...' : ''}</div>
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
    
    // Actualizar contador - MOSTRAR EL NÚMERO REAL DE ELEMENTOS (MÁXIMO 5)
    if (coldCount) {
        coldCount.textContent = simplifiedData.coldNumbers.length;
    }
    
    if (simplifiedData.coldNumbers.length === 0) {
        coldNumbersList.innerHTML = '<div class="text-center text-gray-500 p-4">No hay datos de números fríos</div>';
        return;
    }
    
    // Crear HTML para números fríos con diseño compacto
    coldNumbersList.innerHTML = simplifiedData.coldNumbers.map((numberData, index) => {
        // Verificar si es número ganador (apareció en el último sorteo)
        const lastDrawDate = window.lotteryData && window.lotteryData.lastUpdated ? 
                            window.lotteryData.lastUpdated.split(' ')[0] : null;
        const isWinner = lastDrawDate && numberData.lastSeen === lastDrawDate;
        
        // Determinar color según el ranking o si es ganador
        let bgGradient, borderColor;
        
        if (isWinner) {
            // Color morado para números ganadores
            bgGradient = 'from-purple-100 to-purple-200';
            borderColor = 'border-purple-500';
        } else if (index < 2) {
            bgGradient = 'from-red-50 to-red-100';
            borderColor = 'border-red-500';
        } else if (index < 4) {
            bgGradient = 'from-orange-50 to-orange-100';
            borderColor = 'border-orange-500';
        } else {
            bgGradient = 'from-yellow-50 to-yellow-100';
            borderColor = 'border-yellow-500';
        }
        
        // Texto especial para números ganadores
        const daysText = isWinner ? '¡GANADOR!' : `${numberData.daysSinceSeen}d`;
        const rankText = isWinner ? '🏆' : `#${index + 1}`;
        const lastSeenText = isWinner ? `${lastDrawDate} (ÚLTIMO SORTEO)` : numberData.lastSeen;
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg p-3 ${isWinner ? 'shadow-lg' : ''}">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm ${isWinner ? 'text-purple-600' : 'text-blue-600'} font-bold w-6">${rankText}</span>
                        <span class="text-xl font-bold ${isWinner ? 'text-purple-800' : 'text-gray-800'}">${numberData.number}</span>
                    </div>
                    <span class="text-xs ${isWinner ? 'bg-purple-500' : 'bg-blue-500'} text-white px-2 py-1 rounded-full">
                        ${daysText}
                    </span>
                </div>
                <div class="text-sm ${isWinner ? 'text-purple-700' : 'text-gray-700'}">
                    <div><strong>Última aparición:</strong> ${lastSeenText}</div>
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