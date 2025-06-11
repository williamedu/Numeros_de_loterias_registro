// primera-dia-override.js - Override específico para La Primera Día
// Este archivo reorganiza el orden de los números ganadores solo para La Primera Día (3 números)

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de La Primera Día
    const lotteryType = document.documentElement.getAttribute('data-lottery');
    console.log('Lottery type detectado:', lotteryType); // Debug
    
    if (lotteryType === 'primera_dia') {
        console.log('La Primera Día detectado - Aplicando override de orden de números');
        
        let isProcessing = false; // Flag para evitar loops infinitos
        let lastProcessedContent = ''; // Para detectar cambios reales
        
        // Función para aplicar la reorganización de números
        function applyNumberInversion() {
            if (isProcessing) return; // Evitar loop infinito
            
            const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
            
            if (winningNumbersDisplay && winningNumbersDisplay.children.length === 3) {
                const currentContent = winningNumbersDisplay.innerHTML;
                
                // Solo procesar si el contenido realmente cambió
                if (currentContent !== lastProcessedContent && !currentContent.includes('data-inverted')) {
                    console.log('=== INICIO DE REORGANIZACIÓN ===');
                    console.log('Detectado cambio real, aplicando reorganización');
                    
                    isProcessing = true; // Bloquear procesamiento
                    
                    const numberElements = Array.from(winningNumbersDisplay.children);
                    console.log('Número total de elementos encontrados:', numberElements.length);
                    
                    const firstNumber = numberElements[0].cloneNode(true);
                    const secondNumber = numberElements[1].cloneNode(true);
                    const thirdNumber = numberElements[2].cloneNode(true);
                    
                    // Log de números originales
                    console.log('Números originales (posición 1, 2, 3):');
                    console.log('  Posición 1:', firstNumber.textContent);
                    console.log('  Posición 2:', secondNumber.textContent);
                    console.log('  Posición 3:', thirdNumber.textContent);
                    console.log('Orden original completo:', [firstNumber.textContent, secondNumber.textContent, thirdNumber.textContent].join(' '));
                    
                    // Marcar como reorganizado para evitar re-procesamiento
                    firstNumber.setAttribute('data-inverted', 'true');
                    secondNumber.setAttribute('data-inverted', 'true');
                    thirdNumber.setAttribute('data-inverted', 'true');
                    
                    // Limpiar el contenedor
                    winningNumbersDisplay.innerHTML = '';
                    console.log('Contenedor limpiado');
                    
                    // Agregar en el orden específico que queremos: segundo, tercero, primero
                    // Ejemplo: si viene 75 92 00 → queremos 92 00 75
                    console.log('Reorganizando en orden: segundo, tercero, primero');
                    console.log('  Agregando en posición 1:', secondNumber.textContent, '(era posición 2)');
                    winningNumbersDisplay.appendChild(secondNumber); // va primero
                    
                    console.log('  Agregando en posición 2:', thirdNumber.textContent, '(era posición 3)');
                    winningNumbersDisplay.appendChild(thirdNumber);  // va segundo  
                    
                    console.log('  Agregando en posición 3:', firstNumber.textContent, '(era posición 1)');
                    winningNumbersDisplay.appendChild(firstNumber);  // va tercero
                    
                    // Verificar resultado final
                    setTimeout(() => {
                        const finalNumbers = Array.from(winningNumbersDisplay.children).map(el => el.textContent);
                        console.log('Resultado final:', finalNumbers.join(' '));
                        console.log('=== FIN DE REORGANIZACIÓN ===');
                    }, 50);
                    
                    lastProcessedContent = winningNumbersDisplay.innerHTML;
                    console.log('Orden reorganizado aplicado exitosamente para La Primera Día');
                    
                    // Desbloquear después de un momento
                    setTimeout(() => {
                        isProcessing = false;
                    }, 100);
                }
            } else {
                console.log('No se encontraron 3 números o el contenedor no existe');
                if (winningNumbersDisplay) {
                    console.log('Números encontrados:', winningNumbersDisplay.children.length);
                } else {
                    console.log('Contenedor winningNumbersDisplay no encontrado');
                }
            }
        }
        
        // Observador para detectar cambios
        function setupObserver() {
            const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
            
            if (winningNumbersDisplay) {
                const observer = new MutationObserver(function(mutations) {
                    // Solo procesar si no estamos ya procesando
                    if (!isProcessing) {
                        console.log('Mutation detectada, aplicando reorganización');
                        applyNumberInversion();
                    }
                });
                
                observer.observe(winningNumbersDisplay, {
                    childList: true,
                    subtree: false // Solo cambios directos, no en hijos
                });
                
                console.log('Observer configurado para La Primera Día');
            } else {
                console.log('ERROR: No se pudo configurar observer - elemento winningNumbersDisplay no encontrado');
            }
        }
        
        // Aplicar reorganización inmediata si ya hay números
        function applyImmediateInversion() {
            setTimeout(() => {
                console.log('Intentando aplicar reorganización inmediata...');
                applyNumberInversion();
            }, 500);
        }
        
        // Inicializar
        setupObserver();
        applyImmediateInversion();
        
        // Reintentos por si los datos tardan en cargar
        setTimeout(() => {
            console.log('Reintento 1 - aplicando reorganización...');
            applyImmediateInversion();
        }, 1000);
        setTimeout(() => {
            console.log('Reintento 2 - aplicando reorganización...');
            applyImmediateInversion();
        }, 2000);
    } else {
        console.log('La Primera Día NO detectado. Lottery type actual:', lotteryType);
    }
});