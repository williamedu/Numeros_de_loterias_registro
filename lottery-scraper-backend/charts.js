// charts.js - Funciones para crear y actualizar gráficos

// Función para inicializar todos los gráficos
function initCharts(lotteryData) {
    // Verificar que los datos están cargados
    if (!lotteryData || !lotteryData.numbers) return;
    
    // 1. Gráfico de distribución de días sin salir
    createDaysDistributionChart(lotteryData);
    
    // 2. Gráfico de frecuencia por posición para los números más frecuentes
    createFrequencyByPositionChart(lotteryData);
}

// Función para crear gráfico de distribución de días sin salir
function createDaysDistributionChart(lotteryData) {
    const ctx = document.getElementById('daysDistributionChart').getContext('2d');
    
    // Limpiar el canvas si ya existe un gráfico
    if (window.daysDistributionChartInstance) {
        window.daysDistributionChartInstance.destroy();
    }
    
    // Definir rangos de días
    const ranges = [
        '0-10', '11-20', '21-30', '31-40', '41-50', 
        '51-60', '61-70', '71-80', '81-90', '91-100', '100+'
    ];
    
    // Contar números en cada rango
    const counts = Array(ranges.length).fill(0);
    
    // Analizar cada número
    for (const num in lotteryData.numbers) {
        const days = lotteryData.numbers[num].daysSinceSeen;
        
        if (days !== null) {
            // Determinar en qué rango cae este número
            const rangeIndex = Math.min(Math.floor(days / 10), ranges.length - 1);
            counts[rangeIndex]++;
        } else {
            // Si nunca ha salido, ponerlo en el último rango (100+)
            counts[ranges.length - 1]++;
        }
    }
    
    // Colores para el gráfico (degradado de verde a azul)
    const colors = [
        '#f0fff4', '#c6f6d5', '#9ae6b4', '#68d391', '#48bb78',
        '#38a169', '#2f855a', '#276749', '#22543d', '#1c4532', '#1a365d'
    ];
    
    // Crear el gráfico
    window.daysDistributionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges,
            datasets: [{
                label: 'Cantidad de números',
                data: counts,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} números`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de números'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Días sin salir'
                    }
                }
            }
        }
    });
}

// Función para crear gráfico de frecuencia por posición
function createFrequencyByPositionChart(lotteryData) {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    
    // Limpiar el canvas si ya existe un gráfico
    if (window.frequencyChartInstance) {
        window.frequencyChartInstance.destroy();
    }
    
    // Calcular frecuencia total para cada número
    const numberFrequencies = [];
    for (const num in lotteryData.numbers) {
        const data = lotteryData.numbers[num];
        const total = data.positions.first + data.positions.second + data.positions.third;
        
        if (total > 0) {
            numberFrequencies.push({
                number: num,
                total: total,
                first: data.positions.first,
                second: data.positions.second,
                third: data.positions.third
            });
        }
    }
    
    // Ordenar por frecuencia total (de mayor a menor)
    numberFrequencies.sort((a, b) => b.total - a.total);
    
    // Tomar los 10 números más frecuentes
    const topNumbers = numberFrequencies.slice(0, 10);
    
    // Preparar datos para el gráfico
    const labels = topNumbers.map(item => item.number);
    const firstPos = topNumbers.map(item => item.first);
    const secondPos = topNumbers.map(item => item.second);
    const thirdPos = topNumbers.map(item => item.third);
    
    // Crear el gráfico
    window.frequencyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '1ª Posición',
                    data: firstPos,
                    backgroundColor: '#4299e1',
                    borderColor: '#3182ce',
                    borderWidth: 1
                },
                {
                    label: '2ª Posición',
                    data: secondPos,
                    backgroundColor: '#48bb78',
                    borderColor: '#38a169',
                    borderWidth: 1
                },
                {
                    label: '3ª Posición',
                    data: thirdPos,
                    backgroundColor: '#ed8936',
                    borderColor: '#dd6b20',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${label}: ${context.parsed.y} veces`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Top 10 números más frecuentes por posición'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Veces que ha salido'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Número'
                    }
                }
            }
        }
    });
}

// Exponer funciones para que sean accesibles desde main.js
window.chartFunctions = {
    initCharts,
    createDaysDistributionChart,
    createFrequencyByPositionChart
};