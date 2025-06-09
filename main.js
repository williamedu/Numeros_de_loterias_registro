// main.js - Script principal para la aplicación de Analizador de Loterías

// Variables globales
let lotteryData = null;
let lotteryName = "Gana_mas"; // Valor predeterminado

// Función para inicializar la aplicación
async function initApp() {
    try {
        // Determinar qué lotería mostrar basado en el atributo data-lottery del elemento html
        const htmlElement = document.documentElement;
        if (htmlElement.hasAttribute('data-lottery')) {
            lotteryName = htmlElement.getAttribute('data-lottery');
        }
        
        // Otra opción: determinar la lotería basado en la URL
        const pageUrl = window.location.pathname;
        if (pageUrl.includes('loteria_nacional.html')) {
            lotteryName = "Loteria_Nacional";
        } else if (pageUrl.includes('gana_mas.html') || pageUrl === '/index.html' || pageUrl === '/') {
            lotteryName = "Gana_mas";
        }
        
        // Mostrar indicador de carga
        showLoading('Cargando datos de la lotería...');
        
        // Cargar los datos JSON específicos para esta lotería
        const jsonFileName = `../json_Datos/lottery_data_${lotteryName}.json`;


        const response = await fetch(jsonFileName);
        if (!response.ok) {
            throw new Error(`Error al cargar datos: ${response.status}`);
        }
        
        lotteryData = await response.json();
        
        // Actualizar el título de la página
        document.title = `Análisis de ${lotteryData.lotteryName || lotteryName}`;
        
        // Actualizar el nombre de la lotería en el header si existe
        const lotteryTitle = document.getElementById('lotteryTitle');
        if (lotteryTitle && lotteryData.lotteryName) {
            lotteryTitle.textContent = lotteryData.lotteryName;
        }
        
        // Actualizar la fecha de última actualización
        updateLastUpdatedInfo();
        
        // Mostrar los números ganadores en el encabezado si existe el contenedor
        displayWinningNumbers();
        
        // Actualizar período de análisis
        updateAnalysisPeriod();
        
        // Actualizar card de último sorteo
        updateLastDrawInfo();
        
        // Renderizar la cuadrícula de números
        renderNumbersGrid();
        
        // Actualizar listas de números fríos y repetidos
        updateNumbersLists();
        
        // Inicializar eventos de la interfaz
        setupEventListeners();

        // 🔥 AGREGAR ESTA LÍNEA AQUÍ:
        setupPositionFilter(lotteryData.positionsCount || 3);
        
        // Inicializar los gráficos usando las funciones de charts.js
        //if (window.chartFunctions && window.chartFunctions.initCharts) {
           // window.chartFunctions.initCharts(lotteryData);
      //  }
        
        // AÑADIR ESTAS LÍNEAS JUSTO DESPUÉS:
// Inicializar la estrategia de 3 números
        if (window.simplifiedFunctions && window.simplifiedFunctions.initSimplifiedAnalysis) {
            window.simplifiedFunctions.initSimplifiedAnalysis(lotteryData);
        }    
        // Ocultar indicador de carga
        hideLoading();
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        hideLoading();
        alert('Error al cargar los datos. Por favor, inténtelo de nuevo más tarde.');
    }
}

// Función para configurar dinámicamente las opciones de posición
function setupPositionFilter(positionsCount) {
    const positionFilter = document.getElementById('positionFilter');
    if (!positionFilter) return;
    
    // Limpiar opciones existentes excepto "Cualquier posición"
    positionFilter.innerHTML = '<option value="any">Cualquier posición</option>';
    
    // Agregar opciones según el número de posiciones
    const positionNames = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta'];
    const positionValues = ['1ra', '2da', '3ra', '4ta', '5ta', '6ta'];
    
    for (let i = 0; i < positionsCount; i++) {
        const option = document.createElement('option');
        option.value = positionValues[i];
        option.textContent = `${positionNames[i]} posición`;
        positionFilter.appendChild(option);
    }
    
    // Para Super Palé específicamente, cambiar los textos
    const lotteryType = document.documentElement.getAttribute('data-lottery');
    if (lotteryType === 'super_pale' && positionsCount === 2) {
        if (positionFilter.children.length >= 3) {
            positionFilter.children[1].textContent = 'Primer número (Quiniela)';
            positionFilter.children[2].textContent = 'Segundo número (Lotería Nacional)';
        }
    }
}

// Función para mostrar los números ganadores en el encabezado
function displayWinningNumbers() {
    const winningNumbersContainer = document.getElementById('currentWinningNumbers');
    if (!winningNumbersContainer) return; // Si no existe el contenedor, salir
    
    // Limpiar el contenedor
    winningNumbersContainer.innerHTML = '';
    
    if (lotteryData && lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        // Crear un título para los números ganadores
        const titleElement = document.createElement('div');
        titleElement.className = 'text-lg font-semibold mb-2';
        titleElement.textContent = 'Números Ganadores:';
        winningNumbersContainer.appendChild(titleElement);
        
        // Crear un contenedor para los números
        const numbersContainer = document.createElement('div');
        numbersContainer.className = 'flex justify-center space-x-2 mb-2';
        
        // Añadir cada número
        lotteryData.winningNumbers.forEach(numData => {
            const numberElement = document.createElement('span');
            numberElement.className = 'number-ball bg-primary text-white';
            numberElement.textContent = numData.number;
            numbersContainer.appendChild(numberElement);
        });
        
        winningNumbersContainer.appendChild(numbersContainer);
        
        // Añadir la fecha del sorteo
        if (lotteryData.winningNumbers[0].date) {
            const dateElement = document.createElement('div');
            dateElement.className = 'text-sm text-gray-500';
            dateElement.textContent = `Fecha del sorteo: ${lotteryData.winningNumbers[0].date}`;
            winningNumbersContainer.appendChild(dateElement);
        }
    } else {
        // Si no hay números ganadores, mostrar mensaje
        winningNumbersContainer.innerHTML = '<p class="text-gray-500">No hay datos de números ganadores disponibles.</p>';
    }
}

// Función para actualizar la información de última actualización
function updateLastUpdatedInfo() {
    const lastDrawDate = document.getElementById('lastDrawDate');
    if (lastDrawDate && lotteryData.lastUpdated) {
        lastDrawDate.textContent = lotteryData.lastUpdated.split(' ')[0]; // Solo la fecha, sin la hora
    }
}

// Función para actualizar el período de análisis
function updateAnalysisPeriod() {
    const analysisPeriod = document.getElementById('analysisPeriod');
    if (analysisPeriod && lotteryData.analysisPeriod) {
        const days = lotteryData.analysisPeriod;
        const years = Math.floor(days / 365);
        const remainingDaysAfterYears = days % 365;
        const months = Math.floor(remainingDaysAfterYears / 30);
        const remainingDays = remainingDaysAfterYears % 30;
        
        let periodText = '';
        if (years > 0) periodText += `${years} año${years > 1 ? 's' : ''} `;
        if (months > 0) periodText += `${months} mes${months > 1 ? 'es' : ''} `;
        if (remainingDays > 0 || (years === 0 && months === 0)) {
            periodText += `${remainingDays} día${remainingDays !== 1 ? 's' : ''}`;
        }
        
        analysisPeriod.textContent = periodText.trim();
    }
}

// Función para actualizar la información del último sorteo
function updateLastDrawInfo() {
    // Encontrar números ganadores (los que aparecieron en el último sorteo)
    const winningNumbers = [];
    
    console.log('=== DEBUG: updateLastDrawInfo ===');
    console.log('lotteryData.lastUpdated:', lotteryData?.lastUpdated);
    
    if (lotteryData && lotteryData.numbers && lotteryData.lastUpdated) {
        // Obtener la fecha del último sorteo (solo la fecha, sin la hora)
        const lastDrawDate = lotteryData.lastUpdated.split(' ')[0];
        console.log('lastDrawDate extraído:', lastDrawDate);
        
        // Revisar algunos números para debug
        let debugCount = 0;
        for (const [number, data] of Object.entries(lotteryData.numbers)) {
            if (debugCount < 5) {
                console.log(`Número ${number}:`, {
                    lastSeen: data.lastSeen,
                    daysSinceSeen: data.daysSinceSeen
                });
                debugCount++;
            }
            
            // Verificar si el número apareció en la fecha del último sorteo
            if (data.lastSeen === lastDrawDate) {
                winningNumbers.push(number);
                console.log(`¡Número ganador encontrado: ${number}!`);
            }
        }
        
        console.log('Números ganadores encontrados:', winningNumbers);
    }
    
    // Si no encontramos números ganadores con lastSeen, intentemos otra estrategia
    if (winningNumbers.length === 0 && lotteryData?.numbers) {
        console.log('No se encontraron ganadores con lastSeen, probando con daysSinceSeen = 0');
        for (const [number, data] of Object.entries(lotteryData.numbers)) {
            if (data.daysSinceSeen === 0) {
                winningNumbers.push(number);
                console.log(`Número con 0 días encontrado: ${number}`);
            }
        }
    }
    
    // Si aún no encontramos números, usar el array winningNumbers del JSON
    if (winningNumbers.length === 0 && lotteryData?.winningNumbers) {
        console.log('Usando array winningNumbers del JSON:', lotteryData.winningNumbers);
        for (const winnerData of lotteryData.winningNumbers) {
            if (winnerData.number) {
                winningNumbers.push(winnerData.number);
                console.log(`Número del array winningNumbers: ${winnerData.number}`);
            }
        }
    }
    
    // Actualizar tarjeta del último sorteo conocido
    const lastKnownDrawDate = document.getElementById('lastKnownDrawDate');
    const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
    
    if (lastKnownDrawDate && lotteryData.lastUpdated) {
        const lastDrawDate = lotteryData.lastUpdated.split(' ')[0];
        lastKnownDrawDate.textContent = lastDrawDate;
    }
    
    if (winningNumbersDisplay) {
        if (winningNumbers.length > 0) {
            // Obtener fecha de hoy para determinar el color
            const today = new Date();
            const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
            const lastDrawDate = lotteryData.lastUpdated.split(' ')[0];
            
            console.log('Fecha de hoy:', todayFormatted);
            console.log('Fecha último sorteo:', lastDrawDate);
            
            // Determinar color según si es de hoy o anterior
            const isToday = lastDrawDate === todayFormatted;
            const bgColor = isToday ? 'bg-green-500' : 'bg-gray-500';
            
            console.log('Es hoy?', isToday, '- Color:', bgColor);
            
            winningNumbersDisplay.innerHTML = winningNumbers.map(number => 
                `<span class="${bgColor} text-white text-xl px-5 py-3 rounded-full font-bold shadow-lg border-2 border-white">${number}</span>`
            ).join('');
        } else {
            console.log('No se encontraron números ganadores, mostrando "No disponibles"');
            winningNumbersDisplay.innerHTML = '<span class="text-gray-400 text-sm">No disponibles</span>';
        }
    }
    
    console.log('=== FIN DEBUG ===');
}
// Función para renderizar la cuadrícula de números
function renderNumbersGrid() {
    const numbersGrid = document.getElementById('numbersGrid');
    if (!numbersGrid) return;
    
    // Limpiar la cuadrícula
    numbersGrid.innerHTML = '';
    
    // Obtener los filtros actuales
    const positionFilter = document.getElementById('positionFilter')?.value || 'any';
    const sortBy = document.getElementById('sortBy')?.value || 'number'; // Cambiado a 'number' como valor predeterminado
    const searchTerm = document.getElementById('numberSearch')?.value?.trim() || '';
    
    // Filtrar y ordenar números
    let filteredNumbers = Object.values(lotteryData.numbers);
    
    // Aplicar filtro de posición
    if (positionFilter !== 'any') {
        filteredNumbers = filteredNumbers.filter(num => {
            // Mapear los valores españoles a los valores internos del JSON
            let internalPosition;
            switch(positionFilter) {
                case '1ra':
                    internalPosition = 'first';
                    break;
                case '2da':
                    internalPosition = 'second';
                    break;
                case '3ra':
                    internalPosition = 'third';
                    break;
                default:
                    internalPosition = positionFilter;
            }
            
            // Verificar si la propiedad positions existe y si el valor para esa posición es mayor que 0
            return num.positions && num.positions[internalPosition] > 0;
        });
    }
    
    // Aplicar filtro de búsqueda
    if (searchTerm.length >= 1) {
        // Dividir el término de búsqueda por comas y eliminar espacios
        const searchTerms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
        
        if (searchTerms.length > 0) {
            filteredNumbers = filteredNumbers.filter(num => {
                // Verificar si el número coincide con alguno de los términos de búsqueda
                return searchTerms.some(term => {
                    // Normalizar el término (añadir cero inicial si es necesario)
                    let normalizedTerm = term;
                    if (/^\d{1}$/.test(term)) {
                        normalizedTerm = '0' + term;  // Añadir cero inicial a términos de un solo dígito
                    }
                    
                    // Buscar coincidencia
                    return num.number.includes(normalizedTerm) || 
                        // También buscar sin cero inicial
                        (num.number.startsWith('0') && num.number.substring(1) === term);
                });
            });
        }
    }
    
    // Obtener los nombres de las posiciones para calcular frecuencia
    const positions = lotteryData.positionsCount || 3;
    const positionNames = ["first", "second", "third", "fourth", "fifth", "sixth"];
    
    // Aplicar ordenamiento
    if (sortBy === 'days') {
        // Ordenar por días sin salir (de mayor a menor)
        filteredNumbers.sort((a, b) => {
            if (b.daysSinceSeen === null) return -1;
            if (a.daysSinceSeen === null) return 1;
            return b.daysSinceSeen - a.daysSinceSeen;
        });
    } else if (sortBy === 'number') {
        // Ordenar por número
        filteredNumbers.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    } else if (sortBy === 'frequency') {
        // Ordenar por frecuencia total
        filteredNumbers.sort((a, b) => {
            // Calcular frecuencia total para cada número
            let freqA = 0;
            let freqB = 0;
            
            for (let i = 0; i < positions; i++) {
                const posName = i < positionNames.length ? positionNames[i] : `position_${i+1}`;
                if (a.positions && a.positions[posName]) freqA += a.positions[posName];
                if (b.positions && b.positions[posName]) freqB += b.positions[posName];
            }
            
            return freqB - freqA;
        });
    }
    
    // Actualizar contador de números filtrados
    const filteredCount = document.getElementById('filteredCount');
    if (filteredCount) {
        filteredCount.textContent = filteredNumbers.length;
    }
    
    // Renderizar cada número en la cuadrícula
    filteredNumbers.forEach(num => {
        // Determinar si es un número ganador (apareció en el último sorteo)
        const lastDrawDate = lotteryData.lastUpdated ? lotteryData.lastUpdated.split(' ')[0] : null;
        const isWinningNumber = lastDrawDate && num.lastSeen === lastDrawDate;
        
        // Obtener fecha de hoy en formato DD-MM-YYYY
        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        
        let heatClass;
        if (isWinningNumber) {
            // Verificar si el último sorteo es de hoy
            if (lastDrawDate === todayFormatted) {
                // Verde circular - números ganadores de hoy
                heatClass = 'winner-today';
            } else {
                // Gris circular - números ganadores de días anteriores
                heatClass = 'winner-old';
            }
        } else {
            // Determinar la clase de color basada en días sin salir (heatmap normal)
            const days = num.daysSinceSeen !== null ? num.daysSinceSeen : 1000;
            const heatLevel = Math.min(Math.floor(days / 10), 10);
            heatClass = `heatmap-${heatLevel}`;
        }
        
        // Crear el elemento div para el número
        const numElement = document.createElement('div');
        numElement.className = `number-cell ${heatClass} rounded-lg p-2 text-center cursor-pointer flex flex-col items-center justify-center transition-all duration-300`;
        numElement.id = `num-${num.number}`;
        
        // Determinar el texto de días
        let daysText;
        if (isWinningNumber) {
            if (lastDrawDate === todayFormatted) {
                daysText = '¡HOY!';
            } else {
                daysText = '¡GANADOR!';
            }
        } else {
            daysText = num.daysSinceSeen !== null ? `${num.daysSinceSeen} días` : 'Nunca';
        }
        
        // Añadir contenido HTML
        numElement.innerHTML = `
            <span class="text-lg font-bold">${num.number}</span>
            <span class="text-xs ${isWinningNumber ? 'font-semibold' : ''}">${daysText}</span>
        `;
        
        // Añadir evento de clic para mostrar detalles
        numElement.addEventListener('click', () => showNumberDetails(num));
        
        // Añadir a la cuadrícula
        numbersGrid.appendChild(numElement);
    });
}

// Función para mostrar detalles de un número - TEMA OSCURO COMPLETO
function showNumberDetails(number) {
    const numberDetails = document.getElementById('numberDetails');
    if (!numberDetails) return;
    
    // Obtener nombres de posiciones
    const positions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
    const positionsCount = lotteryData.positionsCount || 3; // Default a 3 si no está definido
    
    // Calcular frecuencia total sumando todas las posiciones disponibles
    let frequency = 0;
    let positionsText = [];
    
    for (let i = 0; i < positionsCount; i++) {
        const posName = i < positions.length ? positions[i] : `position_${i+1}`;
        if (number.positions && number.positions[posName] !== undefined) {
            frequency += number.positions[posName];
            // Convertir nombre de posición para mostrar
            let displayName;
            switch(posName) {
                case 'first': displayName = '1ra'; break;
                case 'second': displayName = '2da'; break;
                case 'third': displayName = '3ra'; break;
                default: displayName = posName;
            }
            // Nuevo formato: "X veces en Yra"
            if (number.positions[posName] > 0) {
                positionsText.push(`${number.positions[posName]} veces en ${displayName}`);
            }
        }
    }
    
    // Usar el período de análisis directamente del JSON
    // Usar el período de análisis formateado si está disponible, sino usar el número
    let analysisPeriod = lotteryData.analysisPeriodFormatted || 
                        (lotteryData.analysisPeriod ? `${lotteryData.analysisPeriod} días` : '0 días');
    
    // Verificar si el número es ganador actual (apareció en el último sorteo)
    let winnerInfo = '';
    const lastDrawDate = lotteryData.lastUpdated ? lotteryData.lastUpdated.split(' ')[0] : null;
    const isCurrentWinner = lastDrawDate && number.lastSeen === lastDrawDate;
    
    if (isCurrentWinner) {
        // Obtener fecha de hoy en formato DD-MM-YYYY
        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        
        if (lastDrawDate === todayFormatted) {
            // Número ganador de hoy - TEMA OSCURO
            winnerInfo = `
                <div class="bg-gradient-to-r from-green-800 to-green-700 border-2 border-green-500 text-green-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg shadow-green-500/20">
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-trophy text-2xl text-green-400 mr-2"></i>
                        <div class="font-bold text-lg">¡GANADOR DE HOY!</div>
                    </div>
                    <div class="text-sm text-center text-green-200">
                        Este número salió en el sorteo de hoy (${lastDrawDate})
                    </div>
                </div>
            `;
        } else {
            // Número ganador de días anteriores - TEMA OSCURO
            winnerInfo = `
                <div class="bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-500 text-gray-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg shadow-gray-500/20">
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-trophy text-2xl text-gray-400 mr-2"></i>
                        <div class="font-bold text-lg">¡ÚLTIMO GANADOR!</div>
                    </div>
                    <div class="text-sm text-center text-gray-200">
                        Este número salió en el último sorteo (${lastDrawDate})
                    </div>
                </div>
            `;
        }
    } else if (lotteryData.winningNumbers && lotteryData.winningNumbers.some(n => n.number === number.number)) {
        // Verificación adicional con el array de números ganadores si existe - TEMA OSCURO
        const winningNumber = lotteryData.winningNumbers.find(n => n.number === number.number);
        winnerInfo = `
            <div class="bg-gradient-to-r from-green-800 to-green-700 border border-green-600 text-green-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg">
                <div class="font-medium mb-1 text-green-200">¡Número Ganador Actual!</div>
                <div class="text-sm text-green-300">Posición: ${winningNumber.position}</div>
                <div class="text-sm text-green-300">Fecha: ${winningNumber.date}</div>
            </div>
        `;
    }
    
    // Verificar si el número está repetido en los últimos 30 días - TEMA OSCURO
    let repeatedInfo = '';
    if (lotteryData.repeatedInLast30Days && lotteryData.repeatedInLast30Days[number.number]) {
        const repeated = lotteryData.repeatedInLast30Days[number.number];
        repeatedInfo = `
            <div class="bg-gradient-to-r from-blue-800 to-blue-700 border border-blue-600 text-blue-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg">
                <div class="font-medium mb-1 text-blue-200">Repetido en los últimos 30 días:</div>
                <div class="text-sm text-blue-300">${repeated.occurrences} veces</div>
                <div class="text-xs mt-1 text-blue-400">Fechas: ${repeated.dates.join(', ')}</div>
            </div>
        `;
    }
    
    // Crear sección de historial de apariciones - TEMA OSCURO
    let historyInfo = '';
    if (number.history && number.history.length > 0) {
        // Ordenar el historial por fecha (de más reciente a más antiguo)
        const sortedHistory = [...number.history].sort((a, b) => a.daysAgo - b.daysAgo);
        
        const historyItems = sortedHistory.map(item => {
            // Convertir posición numérica a formato español
            let positionDisplay;
            switch(item.position) {
                case 1: positionDisplay = '1ra'; break;
                case 2: positionDisplay = '2da'; break;
                case 3: positionDisplay = '3ra'; break;
                default: positionDisplay = `${item.position}ª`;
            }
            
            return `<div class="grid grid-cols-3 text-sm border-b border-slate-600 py-1 text-gray-300">
                <div class="text-blue-300">${item.date}</div>
                <div class="text-purple-300">${positionDisplay} posición</div>
                <div class="text-gray-400">Hace ${item.daysAgo} días</div>
            </div>`;
        }).join('');
        
        historyInfo = `
            <div class="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-4 max-w-md mx-auto mt-4 shadow-lg">
                <div class="font-medium mb-2 text-gray-200">Historial completo:</div>
                <div class="max-h-48 overflow-y-auto bg-slate-900 rounded p-2 border border-slate-600">
                    ${historyItems}
                </div>
            </div>
        `;
    } else {
        // Si no tenemos historial en la estructura de datos, mostrar mensaje - TEMA OSCURO
        if (number.lastSeen) {
            historyInfo = `
                <div class="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-4 max-w-md mx-auto mt-4 shadow-lg">
                    <div class="font-medium mb-2 text-gray-200">Historial de apariciones:</div>
                    <p class="text-sm text-gray-300 mb-2">Este número ha salido ${frequency} veces en los últimos ${analysisPeriod}.</p>
                    <p class="text-sm text-gray-400">
                        Para ver el historial detallado, actualice los datos con el botón "Actualizar Datos" 
                        en la parte superior de la página.
                    </p>
                </div>
            `;
        }
    }
    
    // Construir el HTML de detalles - TEMA OSCURO COMPLETO
    numberDetails.innerHTML = `
        <div class="fade-in overflow-y-auto">
            <div class="text-lg text-gray-400 mb-2">Análisis de los últimos ${analysisPeriod}</div>
            <div class="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${number.number}</div>
            <div class="text-lg mb-6 text-gray-200">
                ${frequency === 0 ? 
                    '<span class="text-red-400">Nunca ha salido</span>' : 
                    `<span class="text-green-400">Ha salido ${frequency} veces:</span><br><span class="text-gray-300">${positionsText.join('<br>')}</span>`
                }
            </div>
            
            ${winnerInfo}
            
            ${number.lastSeen ? `
                <div class="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg">
                    <div class="font-medium mb-1 text-gray-200">Última vez:</div>
                    <div class="text-sm text-blue-300">${number.lastSeen}</div>
                    <div class="text-xs text-gray-400">(hace ${number.daysSinceSeen} días)</div>
                </div>
            ` : ''}
            
            ${repeatedInfo}
            
            ${historyInfo}
        </div>
    `;
    
    // Asegurarse de que el contenedor principal tiene altura fija
    const detailsPanel = numberDetails.closest('.bg-gradient-to-br');
    const numbersPanel = document.querySelector('.lg\\:col-span-2 .bg-gradient-to-br');
    
    if (detailsPanel && !detailsPanel.classList.contains('fixed-height-panel')) {
        detailsPanel.classList.add('fixed-height-panel');
        
        // Obtener la altura del panel de números y aplicarla al panel de detalles
        if (numbersPanel) {
            const numbersHeight = numbersPanel.offsetHeight;
            detailsPanel.style.height = `${numbersHeight}px`;
        } else {
            // Altura predeterminada si no se puede obtener la del panel de números
            detailsPanel.style.height = '600px';
        }
        
        detailsPanel.style.overflowY = 'auto';
    }
    
    // Hacer scroll hacia arriba del panel
    if (detailsPanel) {
        detailsPanel.scrollTop = 0;
    }
}

// Función para actualizar las listas de números fríos y repetidos - TEMA OSCURO
function updateNumbersLists() {
    // Actualizar lista de números fríos - TEMA OSCURO
    const coldNumbersList = document.getElementById('coldNumbersList');
    if (coldNumbersList && lotteryData.coldestNumbers) {
        coldNumbersList.innerHTML = lotteryData.coldestNumbers.slice(0, 5).map(num => `
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-red-900 to-red-800 border border-red-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-red-100">${num.number}</span>
                <span class="text-sm text-red-300 bg-red-700 px-2 py-1 rounded-full">${num.daysSinceSeen} días</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números repetidos - TEMA OSCURO
    const repeatedNumbersList = document.getElementById('repeatedNumbersList');
    if (repeatedNumbersList && lotteryData.repeatedInLast30Days) {
        // Convertir objeto a array y ordenar por número de ocurrencias
        const repeatedNumbers = Object.entries(lotteryData.repeatedInLast30Days)
            .map(([num, data]) => ({ number: num, ...data }))
            .sort((a, b) => b.occurrences - a.occurrences);
        
        // Mostrar los primeros 5 números repetidos - TEMA OSCURO
        repeatedNumbersList.innerHTML = repeatedNumbers.slice(0, 5).map(num => `
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-green-100">${num.number}</span>
                <span class="text-sm text-green-300 bg-green-700 px-2 py-1 rounded-full">${num.occurrences} veces</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números ganadores actuales - TEMA OSCURO
    const currentWinnersList = document.getElementById('currentWinnersList');
    if (currentWinnersList && lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        currentWinnersList.innerHTML = lotteryData.winningNumbers.map(num => `
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-purple-100">${num.number}</span>
                <span class="text-sm text-purple-300 bg-purple-700 px-2 py-1 rounded-full">Pos. ${num.position}</span>
            </div>
        `).join('');
        
        // Mostrar la fecha del sorteo si existe - TEMA OSCURO
        if (lotteryData.winningNumbers[0].date) {
            const dateDisplay = document.createElement('div');
            dateDisplay.className = 'text-sm text-gray-400 mt-2 text-center';
            dateDisplay.textContent = `Sorteo: ${lotteryData.winningNumbers[0].date}`;
            currentWinnersList.appendChild(dateDisplay);
        }
    } else if (currentWinnersList) {
        currentWinnersList.innerHTML = '<p class="text-sm text-gray-400 text-center bg-slate-800 p-3 rounded-lg">No hay datos disponibles</p>';
    }
}

// Función para igualar la altura de los paneles
function equalizeDetailsPanelHeight() {
    const numbersPanel = document.querySelector('.lg\\:col-span-2 .bg-white.rounded-lg.shadow-lg.p-6');
    const detailsPanel = document.querySelector('.bg-white.rounded-lg.shadow-lg.p-6.sticky');
    
    if (numbersPanel && detailsPanel) {
        const numbersHeight = numbersPanel.offsetHeight;
        detailsPanel.classList.add('fixed-height-panel');
        detailsPanel.style.height = `${numbersHeight}px`;
        detailsPanel.style.overflowY = 'auto';
    }
}

// Funciones para gestionar los eventos de la interfaz
function setupEventListeners() {
    // Filtro por posición
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
        // Actualizar opciones de filtro según las posiciones de la lotería
        if (lotteryData.positionsCount > 0) {
            // Mapeo de posiciones internas a nombres en español
            const positionMapping = {
                'first': { value: '1ra', label: 'Primera' },
                'second': { value: '2da', label: 'Segunda' },
                'third': { value: '3ra', label: 'Tercera' },
                'fourth': { value: '4ta', label: 'Cuarta' },
                'fifth': { value: '5ta', label: 'Quinta' },
                'sixth': { value: '6ta', label: 'Sexta' }
            };
            
            const positions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
            
            // Asegurarse de que el selector solo tiene la opción "any"
            positionFilter.innerHTML = '<option value="any">Cualquier posición</option>';
            
            // Añadir opciones para cada posición
            for (let i = 0; i < lotteryData.positionsCount; i++) {
                const posName = i < positions.length ? positions[i] : `position_${i+1}`;
                const mapping = positionMapping[posName];
                
                if (mapping) {
                    const option = document.createElement('option');
                    option.value = mapping.value;
                    option.textContent = `${mapping.label} posición`;
                    positionFilter.appendChild(option);
                } else {
                    const option = document.createElement('option');
                    option.value = posName;
                    option.textContent = `Posición ${i+1}`;
                    positionFilter.appendChild(option);
                }
            }
        }
        
        positionFilter.addEventListener('change', renderNumbersGrid);
    }
    
    // Ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', renderNumbersGrid);
    }
    
    // Búsqueda
    const numberSearch = document.getElementById('numberSearch');
    if (numberSearch) {
        numberSearch.addEventListener('input', renderNumbersGrid);
    }
    
    // Botón de limpiar búsqueda
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch && numberSearch) {
        clearSearch.addEventListener('click', () => {
            numberSearch.value = '';
            renderNumbersGrid();
        });
    }
    
    // Botón de mostrar todos
    const showAllBtn = document.getElementById('showAllBtn');
    if (showAllBtn && positionFilter && sortBy && numberSearch) {
        showAllBtn.addEventListener('click', () => {
            numberSearch.value = '';
            positionFilter.value = 'any';
            sortBy.value = 'number'; // Cambiado a 'number' para mostrar en orden numérico
            renderNumbersGrid();
        });
    }
    
    // Botón de actualizar datos
    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            // Aquí podrías implementar una funcionalidad para ejecutar el scraper,
            // pero por ahora solo recargamos la página
            showLoading('Actualizando datos...');
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
    }
    
    // Botón de actualizar números ganadores
    const updateWinnersBtn = document.getElementById('updateWinnersBtn');
    if (updateWinnersBtn) {
        updateWinnersBtn.addEventListener('click', () => {
            // Redirigir a una página de actualización de números ganadores o mostrar un modal
            const modal = document.getElementById('updateWinnersModal');
            if (modal) {
                modal.classList.remove('hidden');
            } else {
                alert('Esta función está en desarrollo. Por favor, actualice los números ganadores desde el script de actualización.');
            }
        });
    }
    
    // Botón de ayuda
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');
    
    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
        });
    }
    
    if (closeHelpModal && helpModal) {
        closeHelpModal.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
    }
    
    // Evento de cambio de tamaño de ventana para ajustar alturas
    window.addEventListener('resize', equalizeDetailsPanelHeight);
    
    // Aplicar igualdad de altura inicial
    setTimeout(equalizeDetailsPanelHeight, 100);
}

// Funciones para mostrar/ocultar el indicador de carga
function showLoading(message) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingIndicator) {
        if (loadingMessage && message) {
            loadingMessage.textContent = message;
        }
        loadingIndicator.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

// Inicializar la aplicación cuando se cargue el documento
document.addEventListener('DOMContentLoaded', initApp);