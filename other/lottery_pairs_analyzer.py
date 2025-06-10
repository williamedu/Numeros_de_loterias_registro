import json
import os
from datetime import datetime
from collections import defaultdict, Counter
from itertools import combinations

class LotteryPairsAnalyzer:
    def __init__(self, json_file_path):
        """
        Inicializar el analizador de parejas de lotería
        
        Args:
            json_file_path (str): Ruta al archivo JSON con los datos de la lotería
        """
        self.json_file_path = json_file_path
        self.lottery_data = None
        self.combinations_history = []
        self.pairs_counter = Counter()
        self.pairs_details = defaultdict(list)
        
    def load_data(self):
        """Cargar datos del archivo JSON"""
        try:
            if not os.path.exists(self.json_file_path):
                print(f"❌ Error: No se encontró el archivo {self.json_file_path}")
                return False
                
            with open(self.json_file_path, 'r', encoding='utf-8') as f:
                self.lottery_data = json.load(f)
                
            print(f"✅ Datos cargados exitosamente")
            print(f"📊 Lotería: {self.lottery_data.get('lotteryName', 'N/A')}")
            print(f"📅 Última actualización: {self.lottery_data.get('lastUpdated', 'N/A')}")
            print(f"🔢 Total números procesados: {self.lottery_data.get('totalProcessed', 0)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error al cargar el archivo JSON: {e}")
            return False
    
    def build_combinations_history(self):
        """Construir historial de todas las combinaciones que han salido"""
        if not self.lottery_data:
            return
            
        # Diccionario para agrupar por fecha
        draws_by_date = defaultdict(list)
        
        # Recorrer todos los números y su historial
        for number, data in self.lottery_data.get('numbers', {}).items():
            history = data.get('history', [])
            
            for entry in history:
                date = entry['date']
                position = entry['position']
                days_ago = entry.get('daysAgo', 0)
                draws_by_date[date].append({
                    'number': number,
                    'position': position,
                    'daysAgo': days_ago
                })
        
        # Configuración esperada de posiciones basada en el tipo de lotería
        expected_positions = self.lottery_data.get('positionsCount', 2)
        print(f"🎯 Configuración: {expected_positions} posiciones por sorteo")
        
        # Procesar cada sorteo
        total_draws = 0
        valid_draws = 0
        
        for date, numbers in draws_by_date.items():
            # Ordenar por posición
            numbers_sorted = sorted(numbers, key=lambda x: x['position'])
            
            # Filtrar solo las primeras N posiciones (según la configuración)
            numbers_filtered = numbers_sorted[:expected_positions]
            
            # Extraer solo los números y eliminar duplicados manteniendo el orden
            drawn_numbers = []
            seen_numbers = set()
            
            for item in numbers_filtered:
                num = item['number']
                if num not in seen_numbers:
                    drawn_numbers.append(num)
                    seen_numbers.add(num)
            
            days_ago = numbers_sorted[0]['daysAgo'] if numbers_sorted else 0
            total_draws += 1
            
            # Solo agregar si tenemos exactamente el número esperado de números únicos
            if len(drawn_numbers) == expected_positions:
                self.combinations_history.append({
                    'date': date,
                    'numbers': drawn_numbers,
                    'daysAgo': days_ago
                })
                valid_draws += 1
            else:
                # Debug: mostrar algunos sorteos problemáticos
                if total_draws <= 5:
                    all_numbers = [item['number'] for item in numbers_sorted]
                    print(f"⚠️  Sorteo {date}: Esperado {expected_positions} números únicos, encontrado {len(drawn_numbers)} únicos de {len(all_numbers)} total: {all_numbers}")
        
        # Ordenar por fecha (más reciente primero)
        self.combinations_history.sort(key=lambda x: datetime.strptime(x['date'], "%d-%m-%Y"), reverse=True)
        
        print(f"🎲 Sorteos procesados: {total_draws}")
        print(f"✅ Sorteos válidos: {valid_draws} (con exactamente {expected_positions} números únicos)")
        print(f"⚠️  Sorteos descartados: {total_draws - valid_draws}")
        
        if valid_draws < total_draws * 0.5:  # Si más del 50% se descartó
            print(f"\n🔍 DIAGNÓSTICO: Se descartaron muchos sorteos. Esto puede indicar:")
            print(f"   • Datos duplicados en el JSON")
            print(f"   • Configuración incorrecta de posiciones")
            print(f"   • Problema en el scraping original")
            
            # Mostrar una muestra de datos para diagnóstico
            if self.combinations_history:
                print(f"\n📋 Muestra de sorteos válidos encontrados:")
                for i, draw in enumerate(self.combinations_history[:3]):
                    print(f"   {i+1}. {draw['date']}: {' - '.join(draw['numbers'])}")
        
        print(f"🎯 Historial construido con {len(self.combinations_history)} sorteos válidos")
    
    def analyze_pairs(self):
        """Analizar todas las parejas que han salido y contar repeticiones"""
        print("\n🔍 Analizando parejas...")
        
        total_pairs_found = 0
        identical_pairs_ignored = 0
        
        for draw in self.combinations_history:
            drawn_numbers = draw['numbers']
            date = draw['date']
            days_ago = draw['daysAgo']
            
            # Generar todas las combinaciones de parejas posibles del sorteo
            for pair in combinations(drawn_numbers, 2):
                # Ignorar parejas idénticas (ej: 20-20)
                if pair[0] == pair[1]:
                    identical_pairs_ignored += 1
                    continue
                
                # Ordenar la pareja para mantener consistencia (ej: (05,12) siempre será (05,12) y no (12,05))
                sorted_pair = tuple(sorted(pair))
                
                # Contar la pareja
                self.pairs_counter[sorted_pair] += 1
                total_pairs_found += 1
                
                # Guardar detalles de la aparición
                self.pairs_details[sorted_pair].append({
                    'date': date,
                    'complete_draw': drawn_numbers,
                    'daysAgo': days_ago
                })
        
        print(f"✅ Análisis completado:")
        print(f"   • Parejas válidas encontradas: {total_pairs_found}")
        print(f"   • Parejas idénticas ignoradas: {identical_pairs_ignored}")
        print(f"   • Parejas únicas diferentes: {len(self.pairs_counter)}")
        
        if len(self.pairs_counter) == 0:
            print(f"\n❌ No se encontraron parejas válidas. Posibles problemas:")
            print(f"   • Todos los sorteos tienen números idénticos")
            print(f"   • Problema en la estructura de datos")
            print(f"   • Configuración incorrecta de posiciones")
    
    def show_most_repeated_pairs(self, limit=20):
        """Mostrar las parejas más repetidas"""
        print(f"\n🏆 TOP {limit} PAREJAS MÁS REPETIDAS (NÚMEROS DIFERENTES)")
        print("=" * 70)
        
        # Filtrar solo parejas con números diferentes
        valid_pairs = {pair: count for pair, count in self.pairs_counter.items() 
                      if pair[0] != pair[1]}
        
        if not valid_pairs:
            print("❌ No se encontraron parejas válidas con números diferentes")
            return
        
        # Obtener parejas ordenadas por frecuencia
        most_common_pairs = Counter(valid_pairs).most_common(limit)
        
        print(f"📊 Total de parejas diferentes encontradas: {len(valid_pairs)}")
        print()
        
        for i, (pair, count) in enumerate(most_common_pairs, 1):
            num1, num2 = pair
            print(f"#{i:2d}. Pareja {num1}-{num2}: {count} veces")
            
            # Mostrar detalles de las apariciones más recientes
            details = self.pairs_details[pair]
            details_sorted = sorted(details, key=lambda x: datetime.strptime(x['date'], "%d-%m-%Y"), reverse=True)
            
            print(f"     🎯 Apariciones más recientes:")
            for j, detail in enumerate(details_sorted[:3], 1):  # Mostrar solo las 3 más recientes
                numbers_str = " - ".join(detail['complete_draw'])
                print(f"        {j}. {detail['date']}: [{numbers_str}] (hace {detail['daysAgo']} días)")
            
            if len(details) > 3:
                print(f"        ... y {len(details) - 3} apariciones más")
            
            print()
        
        # Mostrar estadísticas adicionales
        if valid_pairs:
            max_count = max(valid_pairs.values())
            min_count = min(valid_pairs.values())
            avg_count = sum(valid_pairs.values()) / len(valid_pairs)
            
            print(f"📈 Estadísticas de parejas:")
            print(f"   • Pareja más repetida: {max_count} veces")
            print(f"   • Pareja menos repetida: {min_count} veces")
            print(f"   • Promedio de repeticiones: {avg_count:.1f} veces")
    
    def show_pairs_by_frequency(self):
        """Mostrar estadísticas de parejas agrupadas por frecuencia"""
        print(f"\n📊 ESTADÍSTICAS DE FRECUENCIA DE PAREJAS")
        print("=" * 50)
        
        # Agrupar por frecuencia
        frequency_groups = defaultdict(list)
        for pair, count in self.pairs_counter.items():
            frequency_groups[count].append(pair)
        
        # Mostrar estadísticas
        total_pairs = len(self.pairs_counter)
        print(f"Total de parejas únicas encontradas: {total_pairs}")
        print()
        
        # Ordenar por frecuencia (de mayor a menor)
        for frequency in sorted(frequency_groups.keys(), reverse=True):
            pairs_list = frequency_groups[frequency]
            percentage = (len(pairs_list) / total_pairs) * 100
            
            print(f"🔢 Parejas que salieron {frequency} veces: {len(pairs_list)} parejas ({percentage:.1f}%)")
            
            if frequency >= 5:  # Mostrar ejemplos para frecuencias altas
                examples = pairs_list[:5]  # Primeros 5 ejemplos
                examples_str = ", ".join([f"{p[0]}-{p[1]}" for p in examples])
                print(f"     Ejemplos: {examples_str}")
                if len(pairs_list) > 5:
                    print(f"     ... y {len(pairs_list) - 5} más")
            print()
    
    def search_specific_pair(self, num1, num2):
        """Buscar una pareja específica y mostrar su historial completo"""
        num1 = str(num1).zfill(2)
        num2 = str(num2).zfill(2)
        
        # Crear la pareja ordenada
        pair = tuple(sorted([num1, num2]))
        
        print(f"\n🔍 HISTORIAL COMPLETO DE LA PAREJA {pair[0]}-{pair[1]}")
        print("=" * 60)
        
        if pair not in self.pairs_counter:
            print(f"❌ La pareja {pair[0]}-{pair[1]} nunca ha salido junta")
            return
        
        count = self.pairs_counter[pair]
        details = self.pairs_details[pair]
        
        print(f"✅ La pareja {pair[0]}-{pair[1]} ha salido {count} veces")
        print()
        
        # Ordenar por fecha (más reciente primero)
        details_sorted = sorted(details, key=lambda x: datetime.strptime(x['date'], "%d-%m-%Y"), reverse=True)
        
        print("📅 Historial completo de apariciones:")
        for i, detail in enumerate(details_sorted, 1):
            numbers_str = " - ".join(detail['complete_draw'])
            print(f"  {i:2d}. {detail['date']}: [{numbers_str}] (hace {detail['daysAgo']} días)")
        
        # Calcular estadísticas adicionales
        most_recent = details_sorted[0]
        oldest = details_sorted[-1]
        
        print(f"\n📊 Estadísticas:")
        print(f"  • Total apariciones: {count}")
        print(f"  • Primera aparición: {oldest['date']} (hace {oldest['daysAgo']} días)")
        print(f"  • Última aparición: {most_recent['date']} (hace {most_recent['daysAgo']} días)")
        
        # Calcular frecuencia promedio
        if count > 1:
            days_between = oldest['daysAgo'] - most_recent['daysAgo']
            if days_between > 0:
                avg_frequency = days_between / (count - 1)
                print(f"  • Frecuencia promedio: cada {avg_frequency:.1f} días")
    
    def show_recent_pairs(self, days=30):
        """Mostrar parejas que han salido en los últimos N días"""
        print(f"\n⏰ PAREJAS QUE HAN SALIDO EN LOS ÚLTIMOS {days} DÍAS")
        print("=" * 60)
        
        recent_pairs = Counter()
        recent_details = defaultdict(list)
        
        for draw in self.combinations_history:
            if draw['daysAgo'] <= days:
                drawn_numbers = draw['numbers']
                
                # Generar parejas del sorteo
                for pair in combinations(drawn_numbers, 2):
                    sorted_pair = tuple(sorted(pair))
                    recent_pairs[sorted_pair] += 1
                    recent_details[sorted_pair].append({
                        'date': draw['date'],
                        'complete_draw': drawn_numbers,
                        'daysAgo': draw['daysAgo']
                    })
        
        if not recent_pairs:
            print(f"❌ No se encontraron parejas en los últimos {days} días")
            return
        
        print(f"✅ Se encontraron {len(recent_pairs)} parejas únicas en los últimos {days} días")
        print()
        
        # Mostrar parejas ordenadas por frecuencia
        for i, (pair, count) in enumerate(recent_pairs.most_common(15), 1):
            num1, num2 = pair
            print(f"#{i:2d}. Pareja {num1}-{num2}: {count} veces")
            
            # Mostrar fechas
            details = recent_details[pair]
            dates = [d['date'] for d in sorted(details, key=lambda x: x['daysAgo'])]
            print(f"     📅 Fechas: {', '.join(dates)}")
            print()
    
    def interactive_mode(self):
        """Modo interactivo para análisis de parejas"""
        if not self.load_data():
            return
            
        print("\n⏳ Construyendo historial de sorteos...")
        self.build_combinations_history()
        
        print("⏳ Analizando parejas...")
        self.analyze_pairs()
        
        print(f"\n🎰 ANALIZADOR DE PAREJAS - {self.lottery_data.get('lotteryName', 'Lotería')}")
        print("=" * 70)
        
        while True:
            print(f"\n{'='*70}")
            print("Opciones:")
            print("1. Ver parejas más repetidas (TOP 20)")
            print("2. Ver estadísticas de frecuencia")
            print("3. Buscar pareja específica")
            print("4. Ver parejas recientes (últimos 30 días)")
            print("5. Cambiar límite de TOP parejas")
            print("6. Salir")
            print("-" * 50)
            
            try:
                choice = input("Selecciona una opción (1-6): ").strip()
                
                if choice == '1':
                    self.show_most_repeated_pairs(20)
                
                elif choice == '2':
                    self.show_pairs_by_frequency()
                
                elif choice == '3':
                    print("\n🔍 Buscar pareja específica:")
                    num1 = input("Ingresa el primer número (00-99): ").strip()
                    num2 = input("Ingresa el segundo número (00-99): ").strip()
                    
                    try:
                        n1 = int(num1)
                        n2 = int(num2)
                        
                        if 0 <= n1 <= 99 and 0 <= n2 <= 99:
                            if n1 != n2:
                                self.search_specific_pair(num1, num2)
                            else:
                                print("❌ Los números deben ser diferentes")
                        else:
                            print("❌ Los números deben estar entre 00 y 99")
                            
                    except ValueError:
                        print("❌ Ingresa números válidos")
                
                elif choice == '4':
                    days = input("¿Cuántos días atrás revisar? (por defecto 30): ").strip()
                    try:
                        days = int(days) if days else 30
                        self.show_recent_pairs(days)
                    except ValueError:
                        self.show_recent_pairs(30)
                
                elif choice == '5':
                    limit = input("¿Cuántas parejas mostrar en el TOP? (por defecto 20): ").strip()
                    try:
                        limit = int(limit) if limit else 20
                        self.show_most_repeated_pairs(limit)
                    except ValueError:
                        self.show_most_repeated_pairs(20)
                
                elif choice == '6':
                    print("👋 ¡Hasta luego!")
                    break
                
                else:
                    print("❌ Opción no válida")
                    
            except KeyboardInterrupt:
                print("\n👋 ¡Hasta luego!")
                break

def main():
    """Función principal"""
    print("🎰 ANALIZADOR DE PAREJAS MÁS REPETIDAS EN LOTERÍA")
    print("=" * 60)
    
    # Configurar ruta del archivo JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    json_file = os.path.join(parent_dir, "json_Datos", "lottery_data_super_pale.json")
    
    # También puedes especificar la ruta manualmente:
    # json_file = "ruta/completa/al/archivo/lottery_data_super_pale.json"
    
    print(f"📁 Buscando archivo: {json_file}")
    
    # Crear instancia del analizador
    analyzer = LotteryPairsAnalyzer(json_file)
    
    # Iniciar modo interactivo
    analyzer.interactive_mode()

if __name__ == "__main__":
    main()