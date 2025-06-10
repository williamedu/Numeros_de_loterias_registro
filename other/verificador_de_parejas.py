import json
import os
from datetime import datetime
from collections import defaultdict

class LotteryChecker:
    def __init__(self, json_file_path):
        """
        Inicializar el verificador de lotería
        
        Args:
            json_file_path (str): Ruta al archivo JSON con los datos de la lotería
        """
        self.json_file_path = json_file_path
        self.lottery_data = None
        self.combinations_history = []
        
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
                draws_by_date[date].append({
                    'number': number,
                    'position': position
                })
        
        # Ordenar cada sorteo por posición y crear las combinaciones
        for date, numbers in draws_by_date.items():
            # Ordenar por posición
            numbers_sorted = sorted(numbers, key=lambda x: x['position'])
            
            # Extraer solo los números en orden
            drawn_numbers = [item['number'] for item in numbers_sorted]
            
            if len(drawn_numbers) >= 2:  # Asegurar que hay al menos 2 números
                self.combinations_history.append({
                    'date': date,
                    'numbers': drawn_numbers,
                    'daysAgo': numbers_sorted[0].get('daysAgo', 0)
                })
        
        # Ordenar por fecha (más reciente primero)
        self.combinations_history.sort(key=lambda x: datetime.strptime(x['date'], "%d-%m-%Y"), reverse=True)
        
        print(f"🎲 Se construyeron {len(self.combinations_history)} sorteos del historial")
    
    def check_combination(self, num1, num2):
        """
        Verificar si una combinación de 2 números ha salido
        
        Args:
            num1 (str): Primer número (formato "XX")
            num2 (str): Segundo número (formato "XX")
        """
        if not self.lottery_data:
            print("❌ Primero debes cargar los datos")
            return
        
        # Asegurar formato de 2 dígitos
        num1 = str(num1).zfill(2)
        num2 = str(num2).zfill(2)
        
        print(f"\n🔍 Buscando combinación: {num1} y {num2}")
        print("=" * 50)
        
        matches = []
        
        # Buscar en el historial de combinaciones
        for draw in self.combinations_history:
            drawn_numbers = draw['numbers']
            
            # Verificar si ambos números están en el sorteo (sin importar orden)
            if num1 in drawn_numbers and num2 in drawn_numbers:
                # Encontrar las posiciones
                pos1 = drawn_numbers.index(num1) + 1
                pos2 = drawn_numbers.index(num2) + 1
                
                matches.append({
                    'date': draw['date'],
                    'numbers': drawn_numbers,
                    'positions': f"{num1} en posición {pos1}, {num2} en posición {pos2}",
                    'daysAgo': draw.get('daysAgo', 0)
                })
        
        # Mostrar resultados
        if matches:
            print(f"✅ ¡Combinación encontrada! Salió {len(matches)} vez(es):")
            print()
            
            for i, match in enumerate(matches, 1):
                print(f"🎯 Aparición #{i}:")
                print(f"   📅 Fecha: {match['date']}")
                print(f"   🎲 Números completos: {' - '.join(match['numbers'])}")
                print(f"   📍 Posiciones: {match['positions']}")
                print(f"   ⏰ Hace {match['daysAgo']} días")
                print()
                
            # Estadísticas adicionales
            most_recent = matches[0]
            print(f"📊 Estadísticas:")
            print(f"   • Total de apariciones: {len(matches)}")
            print(f"   • Aparición más reciente: {most_recent['date']} (hace {most_recent['daysAgo']} días)")
            
        else:
            print(f"❌ La combinación {num1} y {num2} NO ha salido juntos")
            
            # Verificar si los números han salido por separado
            self.check_individual_numbers(num1, num2)
    
    def check_individual_numbers(self, num1, num2):
        """Verificar información individual de cada número"""
        print(f"\n📋 Información individual de los números:")
        print("-" * 40)
        
        for num in [num1, num2]:
            if num in self.lottery_data.get('numbers', {}):
                data = self.lottery_data['numbers'][num]
                last_seen = data.get('lastSeen')
                days_since = data.get('daysSinceSeen')
                total_appearances = len(data.get('history', []))
                
                print(f"🔢 Número {num}:")
                if last_seen:
                    print(f"   • Última aparición: {last_seen} (hace {days_since} días)")
                    print(f"   • Total apariciones: {total_appearances}")
                    
                    # Mostrar distribución por posiciones
                    positions = data.get('positions', {})
                    pos_info = []
                    for pos_name, count in positions.items():
                        if count > 0:
                            pos_info.append(f"{pos_name}: {count}")
                    
                    if pos_info:
                        print(f"   • Posiciones: {', '.join(pos_info)}")
                else:
                    print(f"   • Nunca ha salido")
                print()
    
    def show_recent_draws(self, limit=5):
        """Mostrar los sorteos más recientes"""
        print(f"\n🎲 Últimos {limit} sorteos:")
        print("=" * 50)
        
        for i, draw in enumerate(self.combinations_history[:limit], 1):
            print(f"#{i} - {draw['date']}: {' - '.join(draw['numbers'])} (hace {draw.get('daysAgo', 0)} días)")
    
    def interactive_mode(self):
        """Modo interactivo para consultas"""
        if not self.load_data():
            return
            
        self.build_combinations_history()
        
        print(f"\n🎰 VERIFICADOR DE COMBINACIONES - {self.lottery_data.get('lotteryName', 'Lotería')}")
        print("=" * 60)
        
        # Mostrar sorteos recientes
        self.show_recent_draws()
        
        while True:
            print(f"\n{'='*60}")
            print("Opciones:")
            print("1. Verificar combinación de 2 números")
            print("2. Ver últimos sorteos")
            print("3. Salir")
            print("-" * 30)
            
            try:
                choice = input("Selecciona una opción (1-3): ").strip()
                
                if choice == '1':
                    print("\n🔍 Verificar combinación:")
                    num1 = input("Ingresa el primer número (00-99): ").strip()
                    num2 = input("Ingresa el segundo número (00-99): ").strip()
                    
                    # Validar entrada
                    try:
                        n1 = int(num1)
                        n2 = int(num2)
                        
                        if 0 <= n1 <= 99 and 0 <= n2 <= 99:
                            if n1 != n2:
                                self.check_combination(num1, num2)
                            else:
                                print("❌ Los números deben ser diferentes")
                        else:
                            print("❌ Los números deben estar entre 00 y 99")
                            
                    except ValueError:
                        print("❌ Ingresa números válidos")
                
                elif choice == '2':
                    limit = input("¿Cuántos sorteos mostrar? (por defecto 10): ").strip()
                    try:
                        limit = int(limit) if limit else 10
                        self.show_recent_draws(limit)
                    except ValueError:
                        self.show_recent_draws(10)
                
                elif choice == '3':
                    print("👋 ¡Hasta luego!")
                    break
                
                else:
                    print("❌ Opción no válida")
                    
            except KeyboardInterrupt:
                print("\n👋 ¡Hasta luego!")
                break

def main():
    """Función principal"""
    print("🎰 VERIFICADOR DE COMBINACIONES DE LOTERÍA")
    print("=" * 50)
    
    # Configurar ruta del archivo JSON
    # Modificar esta ruta según tu estructura de carpetas
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    json_file = os.path.join(parent_dir, "json_Datos", "lottery_data_super_pale.json")
    
    # También puedes especificar la ruta manualmente:
    # json_file = "ruta/completa/al/archivo/lottery_data_super_pale.json"
    
    print(f"📁 Buscando archivo: {json_file}")
    
    # Crear instancia del verificador
    checker = LotteryChecker(json_file)
    
    # Iniciar modo interactivo
    checker.interactive_mode()

if __name__ == "__main__":
    main()