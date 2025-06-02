import json
import pandas as pd
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import statistics
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns

class LotteryPatternAnalyzer:
    def __init__(self, json_file_path):
        """Inicializar el analizador con los datos del archivo JSON"""
        self.json_file_path = json_file_path
        self.data = None
        self.historical_draws = []
        self.load_data()
        self.prepare_historical_data()
    
    def load_data(self):
        """Cargar datos desde el archivo JSON"""
        try:
            with open(self.json_file_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            print(f"✅ Datos cargados exitosamente")
            print(f"📊 Lotería: {self.data.get('lotteryName', 'N/A')}")
            print(f"📅 Última actualización: {self.data.get('lastUpdated', 'N/A')}")
            print(f"🔢 Total de números procesados: {self.data.get('totalProcessed', 'N/A')}")
        except Exception as e:
            print(f"❌ Error cargando datos: {e}")
            return False
        return True
    
    def prepare_historical_data(self):
        """Preparar datos históricos para análisis"""
        if not self.data or 'numbers' not in self.data:
            return
        
        # Extraer todos los sorteos del historial
        all_draws = []
        for number, number_data in self.data['numbers'].items():
            if 'history' in number_data and number_data['history']:
                for draw in number_data['history']:
                    all_draws.append({
                        'date': draw['date'],
                        'number': number,
                        'position': draw['position'],
                        'daysAgo': draw['daysAgo']
                    })
        
        # Agrupar por fecha para reconstruir sorteos completos
        draws_by_date = defaultdict(list)
        for draw in all_draws:
            draws_by_date[draw['date']].append(draw)
        
        # Crear lista de sorteos completos
        for date, numbers in draws_by_date.items():
            if len(numbers) == 3:  # Pega 3 tiene 3 posiciones
                sorted_numbers = sorted(numbers, key=lambda x: x['position'])
                self.historical_draws.append({
                    'date': date,
                    'numbers': [n['number'] for n in sorted_numbers],
                    'daysAgo': sorted_numbers[0]['daysAgo']
                })
        
        # Ordenar por fecha (más reciente primero)
        self.historical_draws.sort(key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y'), reverse=True)
        print(f"📈 Sorteos históricos preparados: {len(self.historical_draws)} sorteos completos")

    def analyze_frequency_patterns(self):
        """Análisis 1: Patrones de Frecuencia"""
        print("\n" + "="*60)
        print("🔍 ANÁLISIS 1: PATRONES DE FRECUENCIA")
        print("="*60)
        
        if not self.data or 'numbers' not in self.data:
            print("❌ No hay datos disponibles")
            return {}
        
        # Contar frecuencias totales
        frequencies = {}
        total_appearances = 0
        
        for number, data in self.data['numbers'].items():
            total_freq = sum(data['positions'].values()) if 'positions' in data else 0
            frequencies[number] = total_freq
            total_appearances += total_freq
        
        # Números más y menos frecuentes
        sorted_freq = sorted(frequencies.items(), key=lambda x: x[1], reverse=True)
        
        print(f"📊 Total de apariciones analizadas: {total_appearances}")
        print(f"📊 Promedio de apariciones por número: {total_appearances/100:.2f}")
        
        print("\n🔥 TOP 10 NÚMEROS MÁS FRECUENTES:")
        for i, (number, freq) in enumerate(sorted_freq[:10], 1):
            percentage = (freq / total_appearances * 100) if total_appearances > 0 else 0
            print(f"{i:2d}. Número {number}: {freq:3d} veces ({percentage:.2f}%)")
        
        print("\n🧊 TOP 10 NÚMEROS MENOS FRECUENTES:")
        for i, (number, freq) in enumerate(sorted_freq[-10:], 1):
            percentage = (freq / total_appearances * 100) if total_appearances > 0 else 0
            print(f"{i:2d}. Número {number}: {freq:3d} veces ({percentage:.2f}%)")
        
        # Análisis estadístico de frecuencias
        freq_values = list(frequencies.values())
        if freq_values:
            mean_freq = statistics.mean(freq_values)
            std_freq = statistics.stdev(freq_values) if len(freq_values) > 1 else 0
            
            print(f"\n📈 ESTADÍSTICAS DE FRECUENCIA:")
            print(f"   Media: {mean_freq:.2f}")
            print(f"   Desviación estándar: {std_freq:.2f}")
            print(f"   Coeficiente de variación: {(std_freq/mean_freq)*100:.2f}%")
            
            # Test de uniformidad (Chi-cuadrado)
            expected_freq = total_appearances / 100
            chi_stat = sum((freq - expected_freq)**2 / expected_freq for freq in freq_values)
            chi_critical = 123.225  # Chi-cuadrado crítico para 99 grados de libertad al 95%
            
            print(f"   Chi-cuadrado calculado: {chi_stat:.2f}")
            print(f"   Chi-cuadrado crítico (95%): {chi_critical:.2f}")
            print(f"   ¿Distribución uniforme?: {'❌ NO' if chi_stat > chi_critical else '✅ SÍ'}")
        
        return {
            'frequencies': frequencies,
            'most_frequent': sorted_freq[:10],
            'least_frequent': sorted_freq[-10:],
            'total_appearances': total_appearances,
            'uniformity_test': chi_stat > chi_critical if 'chi_stat' in locals() else None
        }

    def analyze_hot_cold_patterns(self):
        """Análisis 2: Números Calientes vs Fríos"""
        print("\n" + "="*60)
        print("🌡️  ANÁLISIS 2: NÚMEROS CALIENTES VS FRÍOS")
        print("="*60)
        
        if not self.data or 'numbers' not in self.data:
            return {}
        
        # Obtener números con sus días sin salir
        hot_cold_data = []
        for number, data in self.data['numbers'].items():
            if data.get('daysSinceSeen') is not None:
                hot_cold_data.append({
                    'number': number,
                    'days_since': data['daysSinceSeen'],
                    'last_seen': data.get('lastSeen', 'N/A')
                })
        
        if not hot_cold_data:
            print("❌ No hay datos de últimas apariciones")
            return {}
        
        # Ordenar por días sin salir
        hot_cold_data.sort(key=lambda x: x['days_since'])
        
        print("🔥 TOP 10 NÚMEROS MÁS CALIENTES (salieron recientemente):")
        for i, item in enumerate(hot_cold_data[:10], 1):
            print(f"{i:2d}. Número {item['number']}: {item['days_since']} días (último: {item['last_seen']})")
        
        print("\n🧊 TOP 10 NÚMEROS MÁS FRÍOS (no salen hace tiempo):")
        for i, item in enumerate(hot_cold_data[-10:], 1):
            print(f"{i:2d}. Número {item['number']}: {item['days_since']} días (último: {item['last_seen']})")
        
        # Estadísticas de días sin salir
        days_values = [item['days_since'] for item in hot_cold_data]
        print(f"\n📊 ESTADÍSTICAS DE DÍAS SIN SALIR:")
        print(f"   Promedio: {statistics.mean(days_values):.1f} días")
        print(f"   Mediana: {statistics.median(days_values):.1f} días")
        print(f"   Mínimo: {min(days_values)} días")
        print(f"   Máximo: {max(days_values)} días")
        
        return {
            'hot_numbers': hot_cold_data[:10],
            'cold_numbers': hot_cold_data[-10:],
            'stats': {
                'mean_days': statistics.mean(days_values),
                'median_days': statistics.median(days_values),
                'min_days': min(days_values),
                'max_days': max(days_values)
            }
        }

    def analyze_position_patterns(self):
        """Análisis 3: Patrones por Posición"""
        print("\n" + "="*60)
        print("📍 ANÁLISIS 3: PATRONES POR POSICIÓN")
        print("="*60)
        
        if not self.data or 'numbers' not in self.data:
            return {}
        
        positions = ['first', 'second', 'third']
        position_names = ['Primera', 'Segunda', 'Tercera']
        
        for i, (pos_key, pos_name) in enumerate(zip(positions, position_names)):
            print(f"\n🎯 {pos_name.upper()} POSICIÓN:")
            
            # Obtener frecuencias para esta posición
            pos_frequencies = []
            for number, data in self.data['numbers'].items():
                if 'positions' in data and pos_key in data['positions']:
                    freq = data['positions'][pos_key]
                    if freq > 0:
                        pos_frequencies.append((number, freq))
            
            if pos_frequencies:
                pos_frequencies.sort(key=lambda x: x[1], reverse=True)
                
                print(f"   Top 5 números más frecuentes:")
                for j, (number, freq) in enumerate(pos_frequencies[:5], 1):
                    total_pos_appearances = sum(f for _, f in pos_frequencies)
                    percentage = (freq / total_pos_appearances * 100) if total_pos_appearances > 0 else 0
                    print(f"   {j}. Número {number}: {freq} veces ({percentage:.2f}%)")
                
                # Estadísticas por posición
                freq_values = [f for _, f in pos_frequencies]
                print(f"   Total apariciones: {sum(freq_values)}")
                print(f"   Promedio por número activo: {statistics.mean(freq_values):.2f}")
                print(f"   Números que aparecieron: {len(pos_frequencies)}")
        
        return {'position_analysis': 'completed'}

    def analyze_consecutive_patterns(self):
        """Análisis 4: Números Consecutivos"""
        print("\n" + "="*60)
        print("🔗 ANÁLISIS 4: PATRONES DE NÚMEROS CONSECUTIVOS")
        print("="*60)
        
        if not self.historical_draws:
            print("❌ No hay datos de sorteos históricos")
            return {}
        
        consecutive_counts = {
            'two_consecutive': 0,
            'three_consecutive': 0,
            'total_draws': len(self.historical_draws)
        }
        
        consecutive_examples = []
        
        for draw in self.historical_draws:
            numbers = [int(n) for n in draw['numbers']]
            numbers.sort()
            
            # Verificar consecutivos
            has_two_consecutive = False
            has_three_consecutive = False
            
            # Verificar pares consecutivos
            for i in range(len(numbers) - 1):
                if numbers[i+1] - numbers[i] == 1:
                    has_two_consecutive = True
                    break
            
            # Verificar tres consecutivos
            if len(numbers) == 3:
                numbers.sort()
                if (numbers[1] - numbers[0] == 1) and (numbers[2] - numbers[1] == 1):
                    has_three_consecutive = True
                    consecutive_examples.append({
                        'date': draw['date'],
                        'numbers': draw['numbers'],
                        'type': 'three_consecutive'
                    })
            
            if has_two_consecutive:
                consecutive_counts['two_consecutive'] += 1
            if has_three_consecutive:
                consecutive_counts['three_consecutive'] += 1
        
        # Calcular porcentajes
        total = consecutive_counts['total_draws']
        two_consecutive_pct = (consecutive_counts['two_consecutive'] / total * 100) if total > 0 else 0
        three_consecutive_pct = (consecutive_counts['three_consecutive'] / total * 100) if total > 0 else 0
        
        print(f"📊 ESTADÍSTICAS DE NÚMEROS CONSECUTIVOS:")
        print(f"   Total de sorteos analizados: {total}")
        print(f"   Sorteos con al menos 2 números consecutivos: {consecutive_counts['two_consecutive']} ({two_consecutive_pct:.2f}%)")
        print(f"   Sorteos con 3 números consecutivos: {consecutive_counts['three_consecutive']} ({three_consecutive_pct:.2f}%)")
        
        if consecutive_examples:
            print(f"\n🎯 EJEMPLOS DE 3 NÚMEROS CONSECUTIVOS:")
            for example in consecutive_examples[:5]:  # Mostrar solo los primeros 5
                print(f"   {example['date']}: {'-'.join(example['numbers'])}")
        
        return consecutive_counts

    def analyze_sum_patterns(self):
        """Análisis 5: Patrones de Suma"""
        print("\n" + "="*60)
        print("➕ ANÁLISIS 5: PATRONES DE SUMA DE NÚMEROS")
        print("="*60)
        
        if not self.historical_draws:
            return {}
        
        sums = []
        for draw in self.historical_draws:
            total_sum = sum(int(n) for n in draw['numbers'])
            sums.append(total_sum)
        
        if not sums:
            print("❌ No hay datos de sumas")
            return {}
        
        # Estadísticas de sumas
        mean_sum = statistics.mean(sums)
        median_sum = statistics.median(sums)
        min_sum = min(sums)
        max_sum = max(sums)
        std_sum = statistics.stdev(sums) if len(sums) > 1 else 0
        
        print(f"📊 ESTADÍSTICAS DE SUMAS:")
        print(f"   Suma promedio: {mean_sum:.2f}")
        print(f"   Suma mediana: {median_sum:.1f}")
        print(f"   Suma mínima: {min_sum}")
        print(f"   Suma máxima: {max_sum}")
        print(f"   Desviación estándar: {std_sum:.2f}")
        
        # Distribución de sumas
        sum_counter = Counter(sums)
        most_common_sums = sum_counter.most_common(10)
        
        print(f"\n🎯 SUMAS MÁS FRECUENTES:")
        for i, (sum_val, count) in enumerate(most_common_sums, 1):
            percentage = (count / len(sums) * 100)
            print(f"   {i:2d}. Suma {sum_val}: {count} veces ({percentage:.2f}%)")
        
        return {
            'sum_stats': {
                'mean': mean_sum,
                'median': median_sum,
                'min': min_sum,
                'max': max_sum,
                'std': std_sum
            },
            'most_common_sums': most_common_sums
        }

    def analyze_gap_patterns(self):
        """Análisis 6: Patrones de Intervalos (Gaps)"""
        print("\n" + "="*60)
        print("📏 ANÁLISIS 6: PATRONES DE INTERVALOS ENTRE NÚMEROS")
        print("="*60)
        
        if not self.historical_draws:
            return {}
        
        gaps = []
        for draw in self.historical_draws:
            numbers = sorted([int(n) for n in draw['numbers']])
            # Calcular intervalos entre números consecutivos ordenados
            draw_gaps = [numbers[i+1] - numbers[i] for i in range(len(numbers)-1)]
            gaps.extend(draw_gaps)
        
        if not gaps:
            return {}
        
        # Estadísticas de intervalos
        mean_gap = statistics.mean(gaps)
        median_gap = statistics.median(gaps)
        
        print(f"📊 ESTADÍSTICAS DE INTERVALOS:")
        print(f"   Intervalo promedio: {mean_gap:.2f}")
        print(f"   Intervalo mediana: {median_gap:.1f}")
        print(f"   Intervalo mínimo: {min(gaps)}")
        print(f"   Intervalo máximo: {max(gaps)}")
        
        # Intervalos más comunes
        gap_counter = Counter(gaps)
        most_common_gaps = gap_counter.most_common(10)
        
        print(f"\n🎯 INTERVALOS MÁS FRECUENTES:")
        for i, (gap, count) in enumerate(most_common_gaps, 1):
            percentage = (count / len(gaps) * 100)
            print(f"   {i:2d}. Intervalo {gap}: {count} veces ({percentage:.2f}%)")
        
        return {
            'gap_stats': {
                'mean': mean_gap,
                'median': median_gap,
                'min': min(gaps),
                'max': max(gaps)
            },
            'most_common_gaps': most_common_gaps
        }

    def analyze_repetition_patterns(self):
        """Análisis 7: Patrones de Repetición Reciente"""
        print("\n" + "="*60)
        print("🔄 ANÁLISIS 7: PATRONES DE REPETICIÓN EN ÚLTIMOS 30 DÍAS")
        print("="*60)
        
        if not self.data or 'repeatedInLast30Days' not in self.data:
            print("❌ No hay datos de repeticiones recientes")
            return {}
        
        repeated_data = self.data['repeatedInLast30Days']
        
        if not repeated_data:
            print("📊 No hay números que se hayan repetido en los últimos 30 días")
            return {}
        
        print(f"📊 NÚMEROS REPETIDOS EN ÚLTIMOS 30 DÍAS: {len(repeated_data)} números")
        
        # Ordenar por número de ocurrencias
        sorted_repeated = sorted(repeated_data.items(), key=lambda x: x[1]['occurrences'], reverse=True)
        
        print(f"\n🔥 TOP NÚMEROS MÁS REPETIDOS:")
        for i, (number, data) in enumerate(sorted_repeated[:10], 1):
            occurrences = data['occurrences']
            dates = data['dates']
            print(f"   {i:2d}. Número {number}: {occurrences} veces")
            print(f"       Fechas: {', '.join(dates[:3])}{'...' if len(dates) > 3 else ''}")
        
        return {
            'total_repeated': len(repeated_data),
            'most_repeated': sorted_repeated[:10]
        }

    def generate_recommendations(self):
        """Generar recomendaciones basadas en patrones"""
        print("\n" + "="*60)
        print("💡 RECOMENDACIONES Y CONCLUSIONES")
        print("="*60)
        
        print("\n🎯 INTERPRETACIÓN DE PATRONES:")
        print("   • Los patrones mostrados son descriptivos, no predictivos")
        print("   • Cada sorteo es independiente de los anteriores")
        print("   • Las desviaciones de la uniformidad pueden ser casuales")
        
        print("\n⚠️  LIMITACIONES DEL ANÁLISIS:")
        print("   • Los patrones pasados NO garantizan resultados futuros")
        print("   • La aleatoriedad verdadera puede producir 'patrones' aparentes")
        print("   • Ningún método puede predecir números de lotería con certeza")
        
        print("\n📊 USO RECOMENDADO DE ESTE ANÁLISIS:")
        print("   • Para entender la distribución histórica de números")
        print("   • Como referencia estadística, no como predicción")
        print("   • Para verificar la aleatoriedad del sistema de sorteo")

    def run_complete_analysis(self):
        """Ejecutar análisis completo"""
        print("🎲 ANALIZADOR DE PATRONES DE LOTERÍA - PEGA 3 MÁS")
        print("="*60)
        
        try:
            # Ejecutar todos los análisis
            freq_results = self.analyze_frequency_patterns()
            hot_cold_results = self.analyze_hot_cold_patterns()
            position_results = self.analyze_position_patterns()
            consecutive_results = self.analyze_consecutive_patterns()
            sum_results = self.analyze_sum_patterns()
            gap_results = self.analyze_gap_patterns()
            repetition_results = self.analyze_repetition_patterns()
            
            # Generar recomendaciones
            self.generate_recommendations()
            
            print(f"\n✅ ANÁLISIS COMPLETADO EXITOSAMENTE")
            
        except Exception as e:
            print(f"❌ Error durante el análisis: {e}")

# Función principal
def main():
    # Ruta al archivo JSON
    json_file_path = r"C:\Users\willi\OneDrive\Escritorio\New_Loteria_Resultados\Numeros_de_loterias_registro\json_Datos\lottery_data_Pega_3_Mas.json"
    
    # Crear analizador y ejecutar análisis
    analyzer = LotteryPatternAnalyzer(json_file_path)
    analyzer.run_complete_analysis()

if __name__ == "__main__":
    main()