// super-pale-override.js - Override específico para Super Palé
// Este archivo invierte el orden de los números ganadores solo para Super Palé

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de Super Palé
    const lotteryType = document.documentElement.getAttribute('data-lottery');
    
    if (lotteryType === 'super_pale') {
        console.log('Super Palé detectado - Aplicando override de orden de números');
        
        let isProcessing = false; // Flag para evitar loops infinitos
        let lastProcessedContent = ''; // Para detectar cambios reales
        
        // Función para aplicar la inversión de números
        function applyNumberInversion() {
            if (isProcessing) return; // Evitar loop infinito
            
            const winningNumbersDisplay = document.getElementById('winningNumbersDisplay');
            
            if (winningNumbersDisplay && winningNumbersDisplay.children.length === 2) {
                const currentContent = winningNumbersDisplay.innerHTML;
                
                // Solo procesar si el contenido realmente cambió
                if (currentContent !== lastProcessedContent && !currentContent.includes('data-inverted')) {
                    console.log('Detectado cambio real, aplicando inversión');
                    
                    isProcessing = true; // Bloquear procesamiento
                    
                    const numberElements = Array.from(winningNumbersDisplay.children);
                    const firstNumber = numberElements[0].cloneNode(true);
                    const secondNumber = numberElements[1].cloneNode(true);
                    
                    // Marcar como invertido para evitar re-procesamiento
                    firstNumber.setAttribute('data-inverted', 'true');
                    secondNumber.setAttribute('data-inverted', 'true');
                    
                    // Limpiar el contenedor
                    winningNumbersDisplay.innerHTML = '';
                    
                    // Agregar en orden invertido (segundo primero, primero segundo)
                    winningNumbersDisplay.appendChild(secondNumber);
                    winningNumbersDisplay.appendChild(firstNumber);
                    
                    lastProcessedContent = winningNumbersDisplay.innerHTML;
                    console.log('Orden invertido aplicado exitosamente');
                    
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
                
                console.log('Observer configurado para Super Palé');
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