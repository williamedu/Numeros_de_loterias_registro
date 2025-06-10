import json
import os
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import calendar

class LotteryHistoricalAnalyzer:
    def __init__(self, json_file_path):
        """
        Inicializar el analizador histórico de lotería
        
        Args:
            json_file_path (str): Ruta al archivo JSON con los datos de la lotería
        """
        self.json_file_path = json_file_path
        self.lottery_data = None
        self.historical_draws = defaultdict(list)  # fecha -> lista de sorteos
        self.years_with_data = set()
        
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
            
            return True
            
        except Exception as e:
            print(f"❌ Error al cargar el archivo JSON: {e}")
            return False
    
    def build_historical_data(self):
        """Construir base de datos histórica organizada por fechas"""
        if not self.lottery_data:
            return
            
        print("🔄 Construyendo base de datos histórica...")
        
        # Diccionario para agrupar por fecha
        draws_by_date = defaultdict(list)
        expected_positions = self.lottery_data.get('positionsCount', 2)
        
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
        
        # Procesar cada fecha y crear sorteos limpios
        valid_draws = 0
        
        for date_str, numbers in draws_by_date.items():
            try:
                # Parsear fecha
                date_obj = datetime.strptime(date_str, "%d-%m-%Y")
                self.years_with_data.add(date_obj.year)
                
                # Ordenar por posición y filtrar
                numbers_sorted = sorted(numbers, key=lambda x: x['position'])
                numbers_filtered = numbers_sorted[:expected_positions]
                
                # Extraer números únicos
                drawn_numbers = []
                seen_numbers = set()
                
                for item in numbers_filtered:
                    num = item['number']
                    if num not in seen_numbers:
                        drawn_numbers.append(num)
                        seen_numbers.add(num)
                
                # Solo agregar si tenemos exactamente el número esperado de números únicos
                if len(drawn_numbers) == expected_positions:
                    # Crear clave de fecha sin año para comparaciones
                    date_key = f"{date_obj.day:02d}-{date_obj.month:02d}"
                    
                    self.historical_draws[date_str] = {
                        'date_obj': date_obj,
                        'date_key': date_key,  # DD-MM para comparaciones
                        'numbers': drawn_numbers,
                        'year': date_obj.year,
                        'month': date_obj.month,
                        'day': date_obj.day
                    }
                    valid_draws += 1
                    
            except Exception as e:
                print(f"⚠️  Error procesando fecha {date_str}: {e}")
        
        years_list = sorted(list(self.years_with_data))
        print(f"✅ Base histórica construida:")
        print(f"   • Sorteos válidos: {valid_draws}")
        print(f"   • Años con datos: {len(years_list)} ({years_list[0]} - {years_list[-1]})")
        print(f"   • Rango de años: {', '.join(map(str, years_list))}")
    
    def get_date_range_for_analysis(self, target_date, days_before=7, days_after=7):
        """
        Obtener rango de fechas para análisis (ventana de días)
        
        Args:
            target_date (datetime): Fecha objetivo
            days_before (int): Días antes a incluir
            days_after (int): Días después a incluir
        
        Returns:
            list: Lista de fechas (día-mes) en el rango
        """
        date_keys = []
        
        # Generar rango de fechas
        start_date = target_date - timedelta(days=days_before)
        end_date = target_date + timedelta(days=days_after)
        
        current_date = start_date
        while current_date <= end_date:
            date_key = f"{current_date.day:02d}-{current_date.month:02d}"
            date_keys.append({
                'date_key': date_key,
                'date_obj': current_date,
                'relative_days': (current_date - target_date).days
            })
            current_date += timedelta(days=1)
        
        return date_keys
    
    def analyze_historical_patterns(self, target_date=None, days_window=7):
        """
        Analizar patrones históricos para una fecha específica
        
        Args:
            target_date (datetime): Fecha objetivo (por defecto hoy)
            days_window (int): Ventana de días (±N días)
        """
        if target_date is None:
            target_date = datetime.now()
        
        print(f"\n🎯 ANÁLISIS HISTÓRICO PARA EL {target_date.strftime('%d de %B de %Y')}")
        print("=" * 70)
        print(f"📅 Ventana de análisis: ±{days_window} días")
        
        # Obtener rango de fechas para análisis
        date_range = self.get_date_range_for_analysis(target_date, days_window, days_window)
        
        # Agrupar hallazgos por año
        findings_by_year = defaultdict(list)
        all_numbers_found = []
        
        print(f"\n🔍 Buscando sorteos en fechas similares de años anteriores...")
        print(f"Rango: {date_range[0]['date_obj'].strftime('%d/%m')} - {date_range[-1]['date_obj'].strftime('%d/%m')}")
        print()
        
        # Buscar en cada año histórico
        for year in sorted(self.years_with_data):
            if year >= target_date.year:  # Saltar año actual y futuros
                continue
                
            year_findings = []
            
            # Buscar sorteos en el rango de fechas de ese año
            for date_info in date_range:
                date_key = date_info['date_key']
                target_year_date = f"{date_info['date_obj'].day:02d}-{date_info['date_obj'].month:02d}-{year}"
                
                if target_year_date in self.historical_draws:
                    draw_data = self.historical_draws[target_year_date]
                    year_findings.append({
                        'date': target_year_date,
                        'numbers': draw_data['numbers'],
                        'relative_days': date_info['relative_days']
                    })
                    all_numbers_found.extend(draw_data['numbers'])
            
            if year_findings:
                findings_by_year[year] = year_findings
        
        # Mostrar resultados por año
        total_draws_found = 0
        for year in sorted(findings_by_year.keys(), reverse=True):
            year_draws = findings_by_year[year]
            total_draws_found += len(year_draws)
            
            print(f"📅 AÑO {year} - {len(year_draws)} sorteo(s) encontrado(s):")
            
            for draw in sorted(year_draws, key=lambda x: x['relative_days']):
                numbers_str = " - ".join(draw['numbers'])
                relative_text = self.get_relative_day_text(draw['relative_days'])
                
                print(f"   • {draw['date']}: [{numbers_str}] ({relative_text})")
            print()
        
        print(f"📊 RESUMEN:")
        print(f"   • Total de sorteos encontrados: {total_draws_found}")
        print(f"   • Años con coincidencias: {len(findings_by_year)}")
        
        # Analizar coincidencias de números
        if all_numbers_found:
            self.analyze_number_coincidences(all_numbers_found, target_date, days_window)
        
        return findings_by_year
    
    def get_relative_day_text(self, relative_days):
        """Convertir días relativos a texto descriptivo"""
        if relative_days == 0:
            return "mismo día"
        elif relative_days == 1:
            return "1 día después"
        elif relative_days == -1:
            return "1 día antes"
        elif relative_days > 0:
            return f"{relative_days} días después"
        else:
            return f"{abs(relative_days)} días antes"
    
    def analyze_number_coincidences(self, all_numbers, target_date, days_window):
        """Analizar qué números aparecieron más frecuentemente en fechas similares"""
        print(f"\n🔢 ANÁLISIS DE NÚMEROS MÁS FRECUENTES")
        print("=" * 50)
        
        # Contar frecuencia de números
        number_counter = Counter(all_numbers)
        total_numbers = len(all_numbers)
        
        # Mostrar números más frecuentes
        print(f"Total de números encontrados: {total_numbers}")
        print()
        
        print("🏆 Números que más aparecieron en fechas similares:")
        for i, (number, count) in enumerate(number_counter.most_common(15), 1):
            percentage = (count / total_numbers) * 100
            print(f"#{i:2d}. Número {number}: {count} veces ({percentage:.1f}%)")
        
        # Identificar números "calientes" (que aparecieron múltiples veces)
        hot_numbers = [num for num, count in number_counter.items() if count >= 2]
        
        if hot_numbers:
            print(f"\n🔥 NÚMEROS 'CALIENTES' (aparecieron 2+ veces):")
            for num in sorted(hot_numbers):
                count = number_counter[num]
                print(f"   • {num}: {count} apariciones")
        
        # Buscar patrones de parejas
        self.analyze_historical_pairs(all_numbers)
    
    def analyze_historical_pairs(self, all_numbers):
        """Analizar parejas que aparecieron en fechas históricas similares"""
        print(f"\n👥 ANÁLISIS DE PAREJAS HISTÓRICAS")
        print("=" * 40)
        
        # Reconstruir sorteos para encontrar parejas
        # Nota: Esta es una aproximación ya que mezclamos números de diferentes sorteos
        # Para un análisis más preciso, necesitaríamos agrupar por sorteo individual
        
        # Contar parejas basándose en números que aparecieron juntos frecuentemente
        number_counter = Counter(all_numbers)
        frequent_numbers = [num for num, count in number_counter.items() if count >= 2]
        
        if len(frequent_numbers) >= 2:
            print("🔗 Números que podrían formar buenas parejas (basado en frecuencia histórica):")
            
            # Crear parejas de números frecuentes
            from itertools import combinations
            potential_pairs = list(combinations(sorted(frequent_numbers), 2))
            
            for i, (num1, num2) in enumerate(potential_pairs[:10], 1):
                count1 = number_counter[num1]
                count2 = number_counter[num2]
                combined_strength = count1 + count2
                
                print(f"   {i}. {num1}-{num2} (fortaleza: {num1}×{count1} + {num2}×{count2} = {combined_strength})")
        else:
            print("📊 No hay suficientes números frecuentes para sugerir parejas")
    
    def interactive_analysis(self):
        """Modo interactivo para análisis histórico"""
        if not self.load_data():
            return
            
        print("⏳ Construyendo base de datos histórica...")
        self.build_historical_data()
        
        if not self.historical_draws:
            print("❌ No se encontraron datos históricos válidos")
            return
        
        print(f"\n🎰 ANALIZADOR HISTÓRICO - {self.lottery_data.get('lotteryName', 'Lotería')}")
        print("=" * 70)
        
        while True:
            print(f"\n{'='*70}")
            print("Opciones de análisis histórico:")
            print("1. Analizar patrones para HOY")
            print("2. Analizar patrones para fecha específica")
            print("3. Cambiar ventana de días (actual: ±7 días)")
            print("4. Ver años disponibles en los datos")
            print("5. Análisis rápido de mañana")
            print("6. Salir")
            print("-" * 50)
            
            try:
                choice = input("Selecciona una opción (1-6): ").strip()
                current_window = getattr(self, 'current_window', 7)
                
                if choice == '1':
                    today = datetime.now()
                    self.analyze_historical_patterns(today, current_window)
                
                elif choice == '2':
                    print("\n📅 Ingresa la fecha a analizar:")
                    day = input("Día (1-31): ").strip()
                    month = input("Mes (1-12): ").strip()
                    year = input("Año (opcional, por defecto año actual): ").strip()
                    
                    try:
                        day = int(day)
                        month = int(month)
                        year = int(year) if year else datetime.now().year
                        
                        target_date = datetime(year, month, day)
                        self.analyze_historical_patterns(target_date, current_window)
                        
                    except ValueError:
                        print("❌ Fecha inválida")
                
                elif choice == '3':
                    try:
                        new_window = input(f"Ventana actual: ±{current_window} días. Nueva ventana: ").strip()
                        new_window = int(new_window)
                        if 1 <= new_window <= 30:
                            self.current_window = new_window
                            print(f"✅ Ventana cambiada a ±{new_window} días")
                        else:
                            print("❌ Ventana debe estar entre 1 y 30 días")
                    except ValueError:
                        print("❌ Ingresa un número válido")
                
                elif choice == '4':
                    print(f"\n📊 Años disponibles en los datos:")
                    years_list = sorted(list(self.years_with_data))
                    print(f"   • Rango: {years_list[0]} - {years_list[-1]}")
                    print(f"   • Total: {len(years_list)} años")
                    print(f"   • Años: {', '.join(map(str, years_list))}")
                    
                    # Mostrar estadísticas por año
                    print(f"\n📅 Sorteos por año:")
                    year_counts = defaultdict(int)
                    for draw_data in self.historical_draws.values():
                        year_counts[draw_data['year']] += 1
                    
                    for year in sorted(year_counts.keys()):
                        print(f"   • {year}: {year_counts[year]} sorteos")
                
                elif choice == '5':
                    tomorrow = datetime.now() + timedelta(days=1)
                    print(f"\n🔮 Análisis para mañana ({tomorrow.strftime('%d/%m/%Y')}):")
                    self.analyze_historical_patterns(tomorrow, current_window)
                
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
    print("📅 ANALIZADOR DE PATRONES HISTÓRICOS POR FECHAS")
    print("=" * 60)
    print("🔍 Encuentra qué números salieron en fechas similares de años anteriores")
    print()
    
    # Configurar ruta del archivo JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    json_file = os.path.join(parent_dir, "json_Datos", "lottery_data_super_pale.json")
    
    print(f"📁 Buscando archivo: {json_file}")
    
    # Crear instancia del analizador
    analyzer = LotteryHistoricalAnalyzer(json_file)
    
    # Iniciar modo interactivo
    analyzer.interactive_analysis()

if __name__ == "__main__":
    main()