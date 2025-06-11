// gana-mas-override.js - Override específico para Gana Más
// Este archivo invierte el orden de los números ganadores solo para Gana Más (3 números)

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de Gana Más
    const lotteryType = document.documentElement.getAttribute('data-lottery');
    
    if (lotteryType === 'gana_mas') {
        console.log('Gana Más detectado - Aplicando override de orden de números');
        
        let isProcessing = false; // Flag para evitar loops infinitos
        let lastProcessedContent = ''; // Para detectar cambios reales
        
        // Función para aplicar la inversión de números
        function applyNumberInversion() {
            if (isProcessing) return; // Evitar loop infinito
            
            const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
            
            if (winningNumbersDisplay && winningNumbersDisplay.children.length === 3) {
                const currentContent = winningNumbersDisplay.innerHTML;
                
                // Solo procesar si el contenido realmente cambió
                if (currentContent !== lastProcessedContent && !currentContent.includes('data-inverted')) {
                    console.log('Detectado cambio real, aplicando inversión');
                    
                    isProcessing = true; // Bloquear procesamiento
                    
                    const numberElements = Array.from(winningNumbersDisplay.children);
                    const firstNumber = numberElements[0].cloneNode(true);
                    const secondNumber = numberElements[1].cloneNode(true);
                    const thirdNumber = numberElements[2].cloneNode(true);
                    
                    // Marcar como invertido para evitar re-procesamiento
                    firstNumber.setAttribute('data-inverted', 'true');
                    secondNumber.setAttribute('data-inverted', 'true');
                    thirdNumber.setAttribute('data-inverted', 'true');
                    
                    // Limpiar el contenedor
                    winningNumbersDisplay.innerHTML = '';
                    
                    // Agregar en orden invertido (tercero, segundo, primero)
                    // Ejemplo: 68 93 06 → 06 93 68
                    winningNumbersDisplay.appendChild(thirdNumber);
                    winningNumbersDisplay.appendChild(secondNumber);
                    winningNumbersDisplay.appendChild(firstNumber);
                    
                    lastProcessedContent = winningNumbersDisplay.innerHTML;
                    console.log('Orden invertido aplicado exitosamente para Gana Más');
                    
                    // Desbloquear después de un momento
                    setTimeout(() => {
                        isProcessing = false;
                    }, 100);
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
                        applyNumberInversion();
                    }
                });
                
                observer.observe(winningNumbersDisplay, {
                    childList: true,
                    subtree: false // Solo cambios directos, no en hijos
                });
                
                console.log('Observer configurado para Gana Más');
            }
        }
        
        // Aplicar inversión inmediata si ya hay números
        function applyImmediateInversion() {
            setTimeout(() => {
                applyNumberInversion();
            }, 500);
        }
        
        // Inicializar
        setupObserver();
        applyImmediateInversion();
        
        // Reintentos por si los datos tardan en cargar
        setTimeout(applyImmediateInversion, 1000);
        setTimeout(applyImmediateInversion, 2000);
    }
});