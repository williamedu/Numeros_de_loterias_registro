// main-multi.js - Script para loterías con múltiples números ganadores (5, 6, 9, 20, etc.)
// Adaptado para loterías donde la posición no importa

// Variables globales
let lotteryData = null;
let lotteryName = "super_kino"; // Valor predeterminado

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
        if (pageUrl.includes('super_kino.html')) {
            lotteryName = "super_kino";
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
        
        // Inicializar la estrategia si está disponible
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
        numbersContainer.className = 'flex justify-center flex-wrap gap-2 mb-2';
        
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
    console.log('=== DEBUG: updateLastDrawInfo ===');
    
    // Para loterías multi-número, usar directamente el array winningNumbers
    const winningNumbers = [];
    
    if (lotteryData?.winningNumbers && lotteryData.winningNumbers.length > 0) {
        console.log('Usando array winningNumbers del JSON:', lotteryData.winningNumbers);
        for (const winnerData of lotteryData.winningNumbers) {
            if (winnerData.number) {
                winningNumbers.push(winnerData.number);
                console.log(`Número ganador: ${winnerData.number}`);
            }
        }
    }
    
    // Actualizar tarjeta del último sorteo conocido
    const lastKnownDrawDate = document.getElementById('lastKnownDrawDate');
    const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
    
    if (lastKnownDrawDate && lotteryData.winningNumbers && lotteryData.winningNumbers[0]?.date) {
        lastKnownDrawDate.textContent = lotteryData.winningNumbers[0].date;
    } else if (lastKnownDrawDate && lotteryData.lastUpdated) {
        const lastDrawDate = lotteryData.lastUpdated.split(' ')[0];
        lastKnownDrawDate.textContent = lastDrawDate;
    }
    
    if (winningNumbersDisplay) {
        if (winningNumbers.length > 0) {
            // Obtener fecha de hoy para determinar el color
            const today = new Date();
            const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
            const sorteoDate = lotteryData.winningNumbers?.[0]?.date || lotteryData.lastUpdated?.split(' ')[0];
            
            console.log('Fecha de hoy:', todayFormatted);
            console.log('Fecha del sorteo:', sorteoDate);
            
            // Determinar color según si es de hoy o anterior
            const isToday = sorteoDate === todayFormatted;
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
    
    // Obtener los filtros actuales (sin filtro de posición)
    const sortBy = document.getElementById('sortBy')?.value || 'number';
    const searchTerm = document.getElementById('numberSearch')?.value?.trim() || '';
    
    // Filtrar números
    let filteredNumbers = Object.values(lotteryData.numbers);
    
    // Aplicar filtro de búsqueda
    if (searchTerm.length >= 1) {
        const searchTerms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
        
        if (searchTerms.length > 0) {
            filteredNumbers = filteredNumbers.filter(num => {
                return searchTerms.some(term => {
                    let normalizedTerm = term;
                    if (/^\d{1}$/.test(term)) {
                        normalizedTerm = '0' + term;
                    }
                    
                    return num.number.includes(normalizedTerm) || 
                        (num.number.startsWith('0') && num.number.substring(1) === term);
                });
            });
        }
    }
    
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
        // Ordenar por frecuencia total (suma de todas las posiciones)
        filteredNumbers.sort((a, b) => {
            let freqA = 0;
            let freqB = 0;
            
            // Sumar todas las posiciones para obtener frecuencia total
            if (a.positions) {
                Object.values(a.positions).forEach(val => freqA += val || 0);
            }
            if (b.positions) {
                Object.values(b.positions).forEach(val => freqB += val || 0);
            }
            
            return freqB - freqA;
        });
    }
    
    // Actualizar contador de números filtrados
    const filteredCount = document.getElementById('filteredCount');
    if (filteredCount) {
        filteredCount.textContent = filteredNumbers.length;
    }
    
    // Obtener lista de números ganadores para comparación
    const currentWinningNumbers = lotteryData.winningNumbers ? 
        lotteryData.winningNumbers.map(w => w.number) : [];
    
    // Renderizar cada número en la cuadrícula
    filteredNumbers.forEach(num => {
        // Determinar si es un número ganador
        const isWinningNumber = currentWinningNumbers.includes(num.number);
        
        // Obtener fecha de hoy en formato DD-MM-YYYY
        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        
        let heatClass;
        if (isWinningNumber) {
            // Verificar si el sorteo es de hoy
            const sorteoDate = lotteryData.winningNumbers?.[0]?.date;
            if (sorteoDate === todayFormatted) {
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
            const sorteoDate = lotteryData.winningNumbers?.[0]?.date;
            if (sorteoDate === todayFormatted) {
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

// Función para mostrar detalles de un número (SIN posiciones)
function showNumberDetails(number) {
    const numberDetails = document.getElementById('numberDetails');
    if (!numberDetails) return;
    
    // Calcular frecuencia total sumando todas las posiciones
    let frequency = 0;
    if (number.positions) {
        Object.values(number.positions).forEach(val => {
            frequency += val || 0;
        });
    }
    
    // Usar el período de análisis directamente del JSON
    let analysisPeriod = lotteryData.analysisPeriodFormatted || 
                        (lotteryData.analysisPeriod ? `${lotteryData.analysisPeriod} días` : '0 días');
    
    // Verificar si el número es ganador actual
    let winnerInfo = '';
    const currentWinningNumbers = lotteryData.winningNumbers ? 
        lotteryData.winningNumbers.map(w => w.number) : [];
    const isCurrentWinner = currentWinningNumbers.includes(number.number);
    
    if (isCurrentWinner) {
        // Obtener fecha de hoy en formato DD-MM-YYYY
        const today = new Date();
        const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        const sorteoDate = lotteryData.winningNumbers?.[0]?.date;
        
        if (sorteoDate === todayFormatted) {
            // Número ganador de hoy
            winnerInfo = `
                <div class="bg-gradient-to-r from-green-800 to-green-700 border-2 border-green-500 text-green-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg shadow-green-500/20">
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-trophy text-2xl text-green-400 mr-2"></i>
                        <div class="font-bold text-lg">¡GANADOR DE HOY!</div>
                    </div>
                    <div class="text-sm text-center text-green-200">
                        Este número salió en el sorteo de hoy (${sorteoDate})
                    </div>
                </div>
            `;
        } else {
            // Número ganador de días anteriores
            winnerInfo = `
                <div class="bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-500 text-gray-100 rounded-lg p-4 max-w-xs mx-auto mt-4 shadow-lg shadow-gray-500/20">
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-trophy text-2xl text-gray-400 mr-2"></i>
                        <div class="font-bold text-lg">¡ÚLTIMO GANADOR!</div>
                    </div>
                    <div class="text-sm text-center text-gray-200">
                        Este número salió en el último sorteo (${sorteoDate})
                    </div>
                </div>
            `;
        }
    }
    
    // Verificar si el número está repetido en los últimos 30 días
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
    
    // Crear sección de historial de apariciones (SIN posiciones)
    let historyInfo = '';
    if (number.history && number.history.length > 0) {
        // Ordenar el historial por fecha (de más reciente a más antiguo)
        const sortedHistory = [...number.history].sort((a, b) => a.daysAgo - b.daysAgo);
        
        const historyItems = sortedHistory.map(item => {
            return `<div class="grid grid-cols-2 text-sm border-b border-slate-600 py-1 text-gray-300">
                <div class="text-blue-300">${item.date}</div>
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
        // Si no tenemos historial en la estructura de datos, mostrar mensaje
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
    
    // Construir el HTML de detalles (SIN información de posiciones)
    numberDetails.innerHTML = `
        <div class="fade-in overflow-y-auto">
            <div class="text-lg text-gray-400 mb-2">Análisis de los últimos ${analysisPeriod}</div>
            <div class="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${number.number}</div>
            <div class="text-lg mb-6 text-gray-200">
                ${frequency === 0 ? 
                    '<span class="text-red-400">Nunca ha salido</span>' : 
                    `<span class="text-green-400">Ha salido ${frequency} veces en total</span>`
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
    
    // Asegurar altura fija y scroll
    const detailsPanel = numberDetails.closest('.bg-gradient-to-br');
    const numbersPanel = document.querySelector('.lg\\:col-span-2 .bg-gradient-to-br');
    
    if (detailsPanel && !detailsPanel.classList.contains('fixed-height-panel')) {
        detailsPanel.classList.add('fixed-height-panel');
        
        if (numbersPanel) {
            const numbersHeight = numbersPanel.offsetHeight;
            detailsPanel.style.height = `${numbersHeight}px`;
        } else {
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
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-red-900 to-red-800 border border-red-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-red-100">${num.number}</span>
                <span class="text-sm text-red-300 bg-red-700 px-2 py-1 rounded-full">${num.daysSinceSeen} días</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números repetidos
    const repeatedNumbersList = document.getElementById('repeatedNumbersList');
    if (repeatedNumbersList && lotteryData.repeatedInLast30Days) {
        const repeatedNumbers = Object.entries(lotteryData.repeatedInLast30Days)
            .map(([num, data]) => ({ number: num, ...data }))
            .sort((a, b) => b.occurrences - a.occurrences);
        
        repeatedNumbersList.innerHTML = repeatedNumbers.slice(0, 5).map(num => `
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-green-100">${num.number}</span>
                <span class="text-sm text-green-300 bg-green-700 px-2 py-1 rounded-full">${num.occurrences} veces</span>
            </div>
        `).join('');
    }
    
    // Actualizar lista de números ganadores actuales
    const currentWinnersList = document.getElementById('currentWinnersList');
    if (currentWinnersList && lotteryData.winningNumbers && lotteryData.winningNumbers.length > 0) {
        currentWinnersList.innerHTML = lotteryData.winningNumbers.map(num => `
            <div class="flex justify-between items-center p-2 bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                <span class="font-medium text-purple-100">${num.number}</span>
                <span class="text-sm text-purple-300 bg-purple-700 px-2 py-1 rounded-full">Ganador</span>
            </div>
        `).join('');
        
        // Mostrar la fecha del sorteo si existe
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
    const numbersPanel = document.querySelector('.lg\\:col-span-2 .bg-gradient-to-br');
    const detailsPanel = document.querySelector('.bg-gradient-to-br.sticky');
    
    if (numbersPanel && detailsPanel) {
        const numbersHeight = numbersPanel.offsetHeight;
        detailsPanel.classList.add('fixed-height-panel');
        detailsPanel.style.height = `${numbersHeight}px`;
        detailsPanel.style.overflowY = 'auto';
    }
}

// Funciones para gestionar los eventos de la interfaz (SIN filtro de posición)
function setupEventListeners() {
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
    if (showAllBtn && sortBy && numberSearch) {
        showAllBtn.addEventListener('click', () => {
            numberSearch.value = '';
            sortBy.value = 'number';
            renderNumbersGrid();
        });
    }
    
    // Botón de actualizar datos
    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            showLoading('Actualizando datos...');
            setTimeout(() => {
                location.reload();
            }, 1000);
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