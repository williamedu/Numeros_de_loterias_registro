import json
import random
from collections import defaultdict, Counter
from datetime import datetime
import os

# Configuración del simulador
JSON_FILE_PATH = r"C:\Users\willi\OneDrive\Escritorio\New_Loteria_Resultados\Numeros_de_loterias_registro\json_Datos\lottery_data_super_kino.json"
COST_PER_GAME = 25  # Costo por jugada en pesos
NUMBERS_TO_PLAY = 10  # Números que jugamos por sorteo
TOTAL_NUMBERS = 80  # Rango de números (1-80)
WINNING_NUMBERS_PER_DRAW = 20  # Números que salen por sorteo

# Reglas de premios del Super Kino TV
PRIZE_TABLE = {
    10: 25_000_000,  # 10 aciertos: 25 millones
    9: 150_000,      # 9 aciertos: 150 mil
    8: 10_000,       # 8 aciertos: 10 mil
    7: 1_000,        # 7 aciertos: 1 mil
    6: 300,          # 6 aciertos: 300 pesos
    5: 60,           # 5 aciertos: 60 pesos
    0: 80,           # 0 aciertos: devolución de 80 pesos
}

def parse_date(date_str):
    """Convierte string de fecha a objeto datetime"""
    date_formats = [
        "%Y-%m-%d",      # 2021-02-17
        "%d/%m/%Y",      # 17/02/2021
        "%d-%m-%Y",      # 17-02-2021
        "%m/%d/%Y",      # 02/17/2021
        "%m-%d-%Y",      # 02-17-2021
        "%Y/%m/%d",      # 2021/02/17
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    print(f"⚠️ Formato de fecha no reconocido: {date_str}")
    return None

def load_historical_data(file_path):
    """Carga los datos históricos del archivo JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"❌ Error: El archivo {file_path} no es un JSON válido")
        return None

def extract_winning_numbers_from_history(data):
    """Extrae los números ganadores de cada sorteo del historial"""
    winning_draws = []
    
    for number, number_data in data.get("numbers", {}).items():
        history = number_data.get("history", [])
        
        for entry in history:
            date_str = entry["date"]
            date_obj = parse_date(date_str)
            
            if date_obj is None:
                continue
            
            # Buscar si ya tenemos un sorteo para esta fecha
            existing_draw = next((draw for draw in winning_draws if draw["date"] == date_str), None)
            
            if existing_draw:
                existing_draw["numbers"].add(int(number))
                existing_draw["date_obj"] = date_obj
            else:
                winning_draws.append({
                    "date": date_str,
                    "date_obj": date_obj,
                    "numbers": {int(number)}
                })
    
    # Filtrar solo sorteos que tengan exactamente 20 números
    complete_draws = [draw for draw in winning_draws if len(draw["numbers"]) == WINNING_NUMBERS_PER_DRAW]
    
    # Ordenar por fecha (más antiguos primero para simular cronológicamente)
    complete_draws.sort(key=lambda x: x["date_obj"])
    
    return complete_draws

def get_most_frequent_numbers(winning_draws, top_count=10):
    """Obtiene los números más frecuentes de todo el historial"""
    all_numbers = []
    
    # Recopilar todos los números ganadores del historial
    for draw in winning_draws:
        all_numbers.extend(draw["numbers"])
    
    # Contar frecuencias
    number_frequencies = Counter(all_numbers)
    
    # Obtener los más frecuentes
    most_frequent = number_frequencies.most_common(top_count)
    
    return [num for num, freq in most_frequent], dict(number_frequencies)

def count_matches(played_numbers, winning_numbers):
    """Cuenta las coincidencias entre números jugados y ganadores"""
    return len(played_numbers.intersection(winning_numbers))

def calculate_prize(matches):
    """Calcula el premio basado en el número de aciertos"""
    return PRIZE_TABLE.get(matches, 0)

def run_simulation(historical_data):
    """Ejecuta la simulación completa con los números más frecuentes"""
    print("📊 SIMULADOR DE SUPER KINO TV - NÚMEROS MÁS FRECUENTES")
    print("=" * 70)
    
    winning_draws = extract_winning_numbers_from_history(historical_data)
    
    if not winning_draws:
        print("❌ No se encontraron sorteos válidos en los datos históricos")
        return None
    
    total_draws = len(winning_draws)
    
    # Obtener los 10 números más frecuentes
    most_frequent_numbers, all_frequencies = get_most_frequent_numbers(winning_draws, NUMBERS_TO_PLAY)
    
    if len(most_frequent_numbers) < NUMBERS_TO_PLAY:
        print(f"❌ Error: Solo se encontraron {len(most_frequent_numbers)} números únicos")
        return None
    
    print(f"📊 Sorteos encontrados: {total_draws}")
    print(f"💰 Costo por jugada: ${COST_PER_GAME}")
    print(f"🎯 Estrategia: Siempre jugar los {NUMBERS_TO_PLAY} números más frecuentes")
    print("-" * 70)
    
    # Mostrar los números más frecuentes que se van a jugar
    print("🔥 NÚMEROS MÁS FRECUENTES SELECCIONADOS:")
    print("-" * 50)
    for i, num in enumerate(most_frequent_numbers, 1):
        freq = all_frequencies[num]
        percentage = (freq / sum(all_frequencies.values())) * 100
        print(f"{i:2d}. Número {num:2d}: {freq:,} apariciones ({percentage:.1f}%)")
    
    played_numbers_set = set(most_frequent_numbers)
    print(f"\n🎮 Números a jugar siempre: {sorted(most_frequent_numbers)}")
    print("-" * 70)
    
    # Contadores para estadísticas
    matches_count = defaultdict(int)
    total_spent = 0
    total_won = 0
    detailed_results = []
    
    print("🔄 Ejecutando simulación...")
    
    # Simular cada sorteo
    for i, draw in enumerate(winning_draws):
        winning_numbers = draw["numbers"]
        
        # Contar aciertos
        matches = count_matches(played_numbers_set, winning_numbers)
        
        # Calcular premio
        prize = calculate_prize(matches)
        net_gain = prize - COST_PER_GAME
        
        # Actualizar contadores
        matches_count[matches] += 1
        total_spent += COST_PER_GAME
        total_won += prize
        
        # Guardar detalles
        detailed_results.append({
            "draw_number": i + 1,
            "date": draw["date"],
            "played": sorted(most_frequent_numbers),
            "winning": sorted(list(winning_numbers)),
            "matches": matches,
            "prize": prize,
            "net_gain": net_gain,
            "winning_numbers_played": sorted(list(played_numbers_set.intersection(winning_numbers)))
        })
        
        # Mostrar progreso cada 50 sorteos
        if (i + 1) % 50 == 0:
            print(f"   Procesados {i + 1}/{total_draws} sorteos...")
    
    print("✅ Simulación completada!")
    print("\n" + "=" * 70)
    
    # RESULTADOS FINALES
    print("📈 RESULTADOS DE LA SIMULACIÓN")
    print("=" * 70)
    
    # Distribución de aciertos
    print("🎯 DISTRIBUCIÓN DE ACIERTOS:")
    print("-" * 50)
    for matches in range(11):  # 0 a 10 aciertos
        count = matches_count[matches]
        percentage = (count / total_draws) * 100 if total_draws > 0 else 0
        prize = PRIZE_TABLE.get(matches, 0)
        
        print(f"{matches:2d} aciertos: {count:,} veces ({percentage:5.1f}%) - Premio: ${prize:,}")
    
    # Resumen financiero
    print(f"\n💰 RESUMEN FINANCIERO:")
    print("-" * 50)
    total_net = total_won - total_spent
    roi_percentage = ((total_net / total_spent) * 100) if total_spent > 0 else 0
    
    print(f"Total gastado:     ${total_spent:,}")
    print(f"Total ganado:      ${total_won:,}")
    print(f"Balance final:     ${total_net:,}")
    print(f"ROI:               {roi_percentage:.2f}%")
    
    if total_net > 0:
        print(f"🎉 ¡GANANCIA! Obtuviste ${total_net:,} de beneficio")
    else:
        print(f"📉 PÉRDIDA: Perdiste ${abs(total_net):,}")
    
    # Estadísticas adicionales
    print(f"\n📊 ESTADÍSTICAS ADICIONALES:")
    print("-" * 50)
    
    winning_draws_count = sum(matches_count[i] for i in range(5, 11)) + matches_count[0]
    losing_draws_count = sum(matches_count[i] for i in range(1, 5))
    
    winning_percentage = (winning_draws_count / total_draws) * 100
    losing_percentage = (losing_draws_count / total_draws) * 100
    
    print(f"Total de sorteos jugados: {total_draws:,}")
    print(f"Jugadas ganadoras:   {winning_draws_count:,} ({winning_percentage:.1f}%)")
    print(f"Jugadas perdedoras:  {losing_draws_count:,} ({losing_percentage:.1f}%)")
    
    # Estadísticas de rendimiento de los números más frecuentes
    print(f"\n🔍 ANÁLISIS DE RENDIMIENTO:")
    print("-" * 50)
    
    # Calcular cuántas veces cada número más frecuente apareció en los sorteos
    frequent_number_hits = {}
    for num in most_frequent_numbers:
        hits = 0
        for draw in winning_draws:
            if num in draw["numbers"]:
                hits += 1
        frequent_number_hits[num] = hits
        hit_rate = (hits / total_draws) * 100
        print(f"Número {num:2d}: Apareció en {hits:,} sorteos ({hit_rate:.1f}%)")
    
    # Mejores y peores resultados
    if detailed_results:
        best_result = max(detailed_results, key=lambda x: x["net_gain"])
        worst_result = min(detailed_results, key=lambda x: x["net_gain"])
        
        print(f"\n🏆 MEJOR RESULTADO:")
        print(f"   Fecha: {best_result['date']}")
        print(f"   Aciertos: {best_result['matches']}")
        print(f"   Números acertados: {best_result['winning_numbers_played']}")
        print(f"   Premio: ${best_result['prize']:,}")
        print(f"   Ganancia neta: ${best_result['net_gain']:,}")
        
        print(f"\n💸 PEOR RESULTADO:")
        print(f"   Fecha: {worst_result['date']}")
        print(f"   Aciertos: {worst_result['matches']}")
        print(f"   Números acertados: {worst_result['winning_numbers_played']}")
        print(f"   Premio: ${worst_result['prize']:,}")
        print(f"   Pérdida neta: ${worst_result['net_gain']:,}")
    
    # Promedio de aciertos
    total_matches = sum(matches * count for matches, count in matches_count.items())
    avg_matches = total_matches / total_draws if total_draws > 0 else 0
    print(f"\n📊 Promedio de aciertos por sorteo: {avg_matches:.2f}")
    
    return {
        "total_draws": total_draws,
        "most_frequent_numbers": most_frequent_numbers,
        "number_frequencies": frequent_number_hits,
        "matches_distribution": dict(matches_count),
        "total_spent": total_spent,
        "total_won": total_won,
        "net_result": total_net,
        "roi_percentage": roi_percentage,
        "average_matches": avg_matches,
        "detailed_results": detailed_results
    }

def main():
    """Función principal"""
    if not os.path.exists(JSON_FILE_PATH):
        print(f"❌ Error: No se encontró el archivo {JSON_FILE_PATH}")
        print("   Asegúrate de que el archivo existe y la ruta es correcta")
        return
    
    historical_data = load_historical_data(JSON_FILE_PATH)
    if not historical_data:
        return
    
    results = run_simulation(historical_data)
    
    if results:
        print(f"\n✅ Simulación completada exitosamente!")
        print(f"📁 Sorteos analizados: {results['total_draws']:,}")
        print(f"🔥 Números más frecuentes: {results['most_frequent_numbers']}")
        print(f"📊 Promedio de aciertos: {results['average_matches']:.2f}")
        
        # Opción para guardar resultados detallados
        save_results = input("\n¿Deseas guardar los resultados detallados? (s/n): ").lower()
        if save_results == 's':
            output_file = f"simulacion_numeros_frecuentes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    # Convertir datetime objects a strings para JSON
                    results_to_save = results.copy()
                    for result in results_to_save['detailed_results']:
                        if 'date_obj' in result:
                            del result['date_obj']
                    
                    json.dump(results_to_save, f, indent=2, ensure_ascii=False)
                print(f"📄 Resultados guardados en: {output_file}")
            except Exception as e:
                print(f"❌ Error al guardar resultados: {e}")

if __name__ == "__main__":
    main()