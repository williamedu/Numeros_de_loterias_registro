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
        const jsonFileName = `json_Datos/lottery_data_${lotteryName}.json`;

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
        
        // Actualizar estadísticas generales
        updateStatsSummary();
        
        // Renderizar la cuadrícula de números
        renderNumbersGrid();
        
        // Actualizar listas de números fríos y repetidos
        updateNumbersLists();
        
        // Inicializar eventos de la interfaz
        setupEventListeners();
        
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

// Función para actualizar el resumen de estadísticas
function updateStatsSummary() {
    // Actualizar el número de sorteos
    const totalDraws = document.getElementById('totalDraws');
    if (totalDraws) {
        // Usar el número de posiciones de la lotería para calcular el total de sorteos
        const positions = lotteryData.positionsCount || 3; // Default a 3 si no está definido
        totalDraws.textContent = Math.round(lotteryData.totalProcessed / positions);
    }
    
    // Actualizar el número más frío
    const coldestNumber = document.getElementById('coldestNumber');
    if (coldestNumber && lotteryData.coldestNumbers && lotteryData.coldestNumbers.length > 0) {
        const coldest = lotteryData.coldestNumbers[0];
        coldestNumber.textContent = `${coldest.number} (${coldest.daysSinceSeen} días)`;
    }
    
    // Actualizar el número más repetido en los últimos 30 días
    const mostRepeatedNumber = document.getElementById('mostRepeatedNumber');
    if (mostRepeatedNumber) {
        // Encontrar el número más repetido
        let maxRepeated = { number: '--', occurrences: 0 };
        for (const [num, data] of Object.entries(lotteryData.repeatedInLast30Days)) {
            if (data.occurrences > maxRepeated.occurrences) {
                maxRepeated = { number: num, occurrences: data.occurrences };
            }
        }
        
        mostRepeatedNumber.textContent = `${maxRepeated.number} (${maxRepeated.occurrences} veces)`;
    }
    
    // Actualizar números ganadores en la sección de resumen si existe
    const winningNumbersSummary = document.getElementById('winningNumbersSummary');
    if (winningNumbersSummary && lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        const numbersStr = lotteryData.winningNumbers.map(n => n.number).join(', ');
        winningNumbersSummary.textContent = numbersStr;
        
        // Mostrar la fecha del sorteo si existe
        const winningDateSummary = document.getElementById('winningDateSummary');
        if (winningDateSummary && lotteryData.winningNumbers[0].date) {
            winningDateSummary.textContent = lotteryData.winningNumbers[0].date;
        }
    }
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
            // Verificar si la propiedad positions existe y si el valor para esa posición es mayor que 0
            return num.positions && num.positions[positionFilter] > 0;
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
    
    // Comprobar si algún número es ganador para resaltarlo
    const winningNumbersSet = new Set();
    if (lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        lotteryData.winningNumbers.forEach(numData => {
            winningNumbersSet.add(numData.number);
        });
    }
    
    // Renderizar cada número en la cuadrícula
    filteredNumbers.forEach(num => {
        // Determinar la clase de color basada en días sin salir
        const days = num.daysSinceSeen !== null ? num.daysSinceSeen : 1000;
        const heatLevel = Math.min(Math.floor(days / 10), 10);
        let heatClass = `heatmap-${heatLevel}`;
        
        // Si el número es un número ganador actual, aplicar clase especial
        const isWinningNumber = winningNumbersSet.has(num.number);
        if (isWinningNumber) {
            heatClass = 'winner-highlight'; // Esta clase debe estar definida en CSS
        }
        
        // Crear el elemento div para el número
        const numElement = document.createElement('div');
        numElement.className = `number-cell ${heatClass} rounded-lg p-2 text-center cursor-pointer flex flex-col items-center justify-center`;
        numElement.id = `num-${num.number}`;
        
        // Determinar el texto de días
        const daysText = num.daysSinceSeen !== null ? `${num.daysSinceSeen} días` : 'Nunca';
        
        // Añadir contenido HTML
        numElement.innerHTML = `
            <span class="text-lg font-bold">${num.number}</span>
            <span class="text-xs">${daysText}</span>
        `;
        
        // Añadir evento de clic para mostrar detalles
        numElement.addEventListener('click', () => showNumberDetails(num));
        
        // Añadir a la cuadrícula
        numbersGrid.appendChild(numElement);
    });
}

// Función para mostrar detalles de un número
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
            positionsText.push(`${number.positions[posName]}/${posName}`);
        }
    }
    
    // Usar el período de análisis directamente del JSON
    // Usar el período de análisis formateado si está disponible, sino usar el número
    let analysisPeriod = lotteryData.analysisPeriodFormatted || 
                        (lotteryData.analysisPeriod ? `${lotteryData.analysisPeriod} días` : '0 días');
    
    // Verificar si el número es ganador actual
    let winnerInfo = '';
    if (lotteryData.winningNumbers && lotteryData.winningNumbers.some(n => n.number === number.number)) {
        const winningNumber = lotteryData.winningNumbers.find(n => n.number === number.number);
        winnerInfo = `
            <div class="bg-green-200 text-green-800 rounded-lg p-4 max-w-xs mx-auto mt-4">
                <div class="font-medium mb-1">¡Número Ganador Actual!</div>
                <div class="text-sm">Posición: ${winningNumber.position}</div>
                <div class="text-sm">Fecha: ${winningNumber.date}</div>
            </div>
        `;
    }
    
    // Verificar si el número está repetido en los últimos 30 días
    let repeatedInfo = '';
    if (lotteryData.repeatedInLast30Days && lotteryData.repeatedInLast30Days[number.number]) {
        const repeated = lotteryData.repeatedInLast30Days[number.number];
        repeatedInfo = `
            <div class="bg-green-100 rounded-lg p-4 max-w-xs mx-auto mt-4">
                <div class="font-medium mb-1">Repetido en los últimos 30 días:</div>
                <div class="text-sm">${repeated.occurrences} veces</div>
                <div class="text-xs mt-1">Fechas: ${repeated.dates.join(', ')}</div>
            </div>
        `;
    }
    
    // Crear sección de historial de apariciones
    let historyInfo = '';
    if (number.history && number.history.length > 0) {
        // Ordenar el historial por fecha (de más reciente a más antiguo)
        const sortedHistory = [...number.history].sort((a, b) => a.daysAgo - b.daysAgo);
        
        const historyItems = sortedHistory.map(item => 
            `<div class="grid grid-cols-3 text-sm border-b border-gray-100 py-1">
                <div>${item.date}</div>
                <div>${item.position}ª posición</div>
                <div>Hace ${item.daysAgo} días</div>
            </div>`
        ).join('');
        
        historyInfo = `
            <div class="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mt-4">
                <div class="font-medium mb-2">Historial completo:</div>
                <div class="max-h-48 overflow-y-auto">
                    ${historyItems}
                </div>
            </div>
        `;
    } else {
        // Si no tenemos historial en la estructura de datos, mostrar mensaje
        if (number.lastSeen) {
            historyInfo = `
                <div class="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mt-4">
                    <div class="font-medium mb-2">Historial de apariciones:</div>
                    <p class="text-sm text-gray-600 mb-2">Este número ha salido ${frequency} veces en los últimos ${analysisPeriod} días.</p>
                    <p class="text-sm">
                        Para ver el historial detallado, actualice los datos con el botón "Actualizar Datos" 
                        en la parte superior de la página.
                    </p>
                </div>
            `;
        }
    }
    
    // Construir el HTML de detalles
    numberDetails.innerHTML = `
        <div class="fade-in overflow-y-auto">
            <div class="text-lg text-gray-600 mb-2">Análisis de los últimos ${analysisPeriod} </div>
            <div class="text-5xl font-bold mb-2">${number.number}</div>
            <div class="text-lg mb-6">
                ${frequency === 0 ? 'Nunca ha salido' : 
                  `Ha salido ${frequency} veces (${positionsText.join('/')})`}
            </div>
            
            ${winnerInfo}
            
            ${number.lastSeen ? `
                <div class="bg-gray-100 rounded-lg p-4 max-w-xs mx-auto">
                    <div class="font-medium mb-1">Última vez:</div>
                    <div class="text-sm">${number.lastSeen} (hace ${number.daysSinceSeen} días)</div>
                </div>
            ` : ''}
            
            ${repeatedInfo}
            
            ${historyInfo}
        </div>
    `;
    
    // Asegurarse de que el contenedor principal tiene altura fija
    const detailsPanel = numberDetails.closest('.bg-white.rounded-lg.shadow-lg.p-6');
    const numbersPanel = document.querySelector('.lg\\:col-span-2 .bg-white.rounded-lg.shadow-lg.p-6');
    
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

// Función para actualizar las listas de números fríos y repetidos
function updateNumbersLists() {
    // Actualizar lista de números fríos
    const coldNumbersList = document.getElementById('coldNumbersList');
    if (coldNumbersList && lotteryData.coldestNumbers) {
        coldNumbersList.innerHTML = lotteryData.coldestNumbers.slice(0, 5).map(num => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span class="font-medium">${num.number}</span>
                <span class="text-sm text-gray-600">${num.daysSinceSeen} días</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números repetidos
    const repeatedNumbersList = document.getElementById('repeatedNumbersList');
    if (repeatedNumbersList && lotteryData.repeatedInLast30Days) {
        // Convertir objeto a array y ordenar por número de ocurrencias
        const repeatedNumbers = Object.entries(lotteryData.repeatedInLast30Days)
            .map(([num, data]) => ({ number: num, ...data }))
            .sort((a, b) => b.occurrences - a.occurrences);
        
        // Mostrar los primeros 5 números repetidos
        repeatedNumbersList.innerHTML = repeatedNumbers.slice(0, 5).map(num => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span class="font-medium">${num.number}</span>
                <span class="text-sm text-gray-600">${num.occurrences} veces</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números ganadores actuales
    const currentWinnersList = document.getElementById('currentWinnersList');
    if (currentWinnersList && lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        currentWinnersList.innerHTML = lotteryData.winningNumbers.map(num => `
            <div class="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span class="font-medium">${num.number}</span>
                <span class="text-sm text-gray-600">Pos. ${num.position}</span>
            </div>
        `).join('');
        
        // Mostrar la fecha del sorteo si existe
        if (lotteryData.winningNumbers[0].date) {
            const dateDisplay = document.createElement('div');
            dateDisplay.className = 'text-sm text-gray-500 mt-2 text-center';
            dateDisplay.textContent = `Sorteo: ${lotteryData.winningNumbers[0].date}`;
            currentWinnersList.appendChild(dateDisplay);
        }
    } else if (currentWinnersList) {
        currentWinnersList.innerHTML = '<p class="text-sm text-gray-500 text-center">No hay datos disponibles</p>';
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
            const positions = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
            
            // Asegurarse de que el selector solo tiene la opción "any"
            positionFilter.innerHTML = '<option value="any">Cualquier posición</option>';
            
            // Añadir opciones para cada posición
            for (let i = 0; i < lotteryData.positionsCount; i++) {
                const posName = i < positions.length ? positions[i] : `position_${i+1}`;
                const posLabel = i < positions.length 
                    ? ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta'][i] 
                    : `Posición ${i+1}`;
                
                const option = document.createElement('option');
                option.value = posName;
                option.textContent = `${posLabel} posición`;
                positionFilter.appendChild(option);
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