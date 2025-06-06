import json
import random
from collections import defaultdict
import os

# Configuración del simulador
JSON_FILE_PATH = r"C:\Users\Acer\Desktop\Pyhton_Projects\Numeros_de_loterias_registro\json_Datos\lottery_data_super_kino.json"  # Ruta al archivo JSON
COST_PER_GAME = 25  # Costo por jugada en pesos
NUMBERS_TO_PLAY = 10  # Números que jugamos por sorteo
TOTAL_NUMBERS = 80  # Rango de números (1-80)
WINNING_NUMBERS_PER_DRAW = 20  # Números que salen por sorteo
PLAYERS = 500  # Número de jugadores/jugadas por sorteo (cambia esto para simular múltiples jugadores)

# Reglas de premios del Super Kino TV
PRIZE_TABLE = {
    10: 25_000_000,  # 10 aciertos: 25 millones
    9: 150_000,      # 9 aciertos: 150 mil
    8: 10_000,       # 8 aciertos: 10 mil
    7: 1_000,        # 7 aciertos: 1 mil
    6: 300,          # 6 aciertos: 300 pesos
    5: 60,           # 5 aciertos: 60 pesos
    0: 80,           # 0 aciertos: devolución de 80 pesos
    # 1, 2, 3, 4 aciertos no ganan nada
}

def generate_random_numbers(count, max_number):
    """Genera números aleatorios únicos"""
    return set(random.sample(range(1, max_number + 1), count))

def count_matches(played_numbers, winning_numbers):
    """Cuenta las coincidencias entre números jugados y ganadores"""
    return len(played_numbers.intersection(winning_numbers))

def calculate_prize(matches):
    """Calcula el premio basado en el número de aciertos"""
    return PRIZE_TABLE.get(matches, 0)

def load_historical_data(file_path):
    """Carga los datos históricos del archivo JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: El archivo {file_path} no es un JSON válido")
        return None

def extract_winning_numbers_from_history(data):
    """Extrae los números ganadores de cada sorteo del historial"""
    winning_draws = []
    
    # Buscar en todos los números para encontrar sus historiales
    for number, number_data in data.get("numbers", {}).items():
        history = number_data.get("history", [])
        
        # Agrupar por fecha
        for entry in history:
            date = entry["date"]
            # Buscar si ya tenemos un sorteo para esta fecha
            existing_draw = next((draw for draw in winning_draws if draw["date"] == date), None)
            
            if existing_draw:
                existing_draw["numbers"].add(int(number))
            else:
                winning_draws.append({
                    "date": date,
                    "numbers": {int(number)}
                })
    
    # Filtrar solo sorteos que tengan exactamente 20 números
    complete_draws = [draw for draw in winning_draws if len(draw["numbers"]) == WINNING_NUMBERS_PER_DRAW]
    
    # Ordenar por fecha (más recientes primero)
    complete_draws.sort(key=lambda x: x["date"], reverse=True)
    
    return complete_draws

def run_simulation(historical_data):
    """Ejecuta la simulación completa"""
    print("🎲 SIMULADOR DE SUPER KINO TV - NÚMEROS ALEATORIOS")
    print("=" * 60)
    
    # Extraer datos históricos
    winning_draws = extract_winning_numbers_from_history(historical_data)
    
    if not winning_draws:
        print("❌ No se encontraron sorteos válidos en los datos históricos")
        return
    
    total_draws = len(winning_draws)
    total_games = total_draws * PLAYERS  # Total de jugadas = sorteos × jugadores
    
    print(f"📊 Sorteos encontrados: {total_draws}")
    print(f"👥 Jugadores por sorteo: {PLAYERS:,}")
    print(f"🎮 Total de jugadas: {total_games:,}")
    print(f"💰 Costo por jugada: {COST_PER_GAME} pesos")
    print(f"🎯 Jugando {NUMBERS_TO_PLAY} números por sorteo")
    print("-" * 60)
    
    # Configurar seed para reproducibilidad (opcional)
    # random.seed(42)  # Descomenta esta línea si quieres resultados reproducibles
    
    # Contadores para estadísticas
    matches_count = defaultdict(int)  # Contador de aciertos
    total_spent = 0
    total_won = 0
    detailed_results = []
    
    print("🔄 Ejecutando simulación...")
    
    # Simular cada sorteo
    for i, draw in enumerate(winning_draws):
        winning_numbers = draw["numbers"]
        
        # Simular múltiples jugadores por sorteo
        for player in range(PLAYERS):
            # Generar números aleatorios para este jugador
            played_numbers = generate_random_numbers(NUMBERS_TO_PLAY, TOTAL_NUMBERS)
            
            # Contar aciertos
            matches = count_matches(played_numbers, winning_numbers)
            
            # Calcular premio
            prize = calculate_prize(matches)
            net_gain = prize - COST_PER_GAME
            
            # Actualizar contadores
            matches_count[matches] += 1
            total_spent += COST_PER_GAME
            total_won += prize
            
            # Guardar detalles solo para el primer jugador para evitar memoria excesiva
            if player == 0:
                detailed_results.append({
                    "draw_number": i + 1,
                    "date": draw["date"],
                    "played": sorted(list(played_numbers)),
                    "winning": sorted(list(winning_numbers)),
                    "matches": matches,
                    "prize": prize,
                    "net_gain": net_gain
                })
        
        # Mostrar progreso cada 100 sorteos
        if (i + 1) % 100 == 0:
            games_processed = (i + 1) * PLAYERS
            print(f"   Procesados {i + 1}/{total_draws} sorteos ({games_processed:,} jugadas)...")
    
    print("✅ Simulación completada!")
    print("\n" + "=" * 60)
    
    # RESULTADOS FINALES
    print("📈 RESULTADOS DE LA SIMULACIÓN")
    print("=" * 60)
    
    # Distribución de aciertos
    print("🎯 DISTRIBUCIÓN DE ACIERTOS:")
    print("-" * 40)
    total_games_played = sum(matches_count.values())
    for matches in range(11):  # 0 a 10 aciertos
        count = matches_count[matches]
        percentage = (count / total_games_played) * 100 if total_games_played > 0 else 0
        prize = PRIZE_TABLE.get(matches, 0)
        
        print(f"{matches:2d} aciertos: {count:,} veces ({percentage:5.1f}%) - Premio: {prize:,} pesos")
    
    # Resumen financiero
    print("\n💰 RESUMEN FINANCIERO:")
    print("-" * 40)
    total_net = total_won - total_spent
    roi_percentage = ((total_net / total_spent) * 100) if total_spent > 0 else 0
    
    print(f"Total gastado:     {total_spent:,} pesos")
    print(f"Total ganado:      {total_won:,} pesos")
    print(f"Balance final:     {total_net:,} pesos")
    print(f"ROI:               {roi_percentage:.2f}%")
    
    if total_net > 0:
        print(f"🎉 ¡GANANCIA! Obtuviste {total_net:,} pesos de beneficio")
    else:
        print(f"📉 PÉRDIDA: Perdiste {abs(total_net):,} pesos")
    
    # Estadísticas adicionales
    print("\n📊 ESTADÍSTICAS ADICIONALES:")
    print("-" * 40)
    
    winning_draws_count = sum(matches_count[i] for i in range(5, 11)) + matches_count[0]
    losing_draws_count = sum(matches_count[i] for i in range(1, 5))
    
    winning_percentage = (winning_draws_count / total_games_played) * 100
    losing_percentage = (losing_draws_count / total_games_played) * 100
    
    print(f"Jugadas ganadoras:   {winning_draws_count:,} ({winning_percentage:.1f}%)")
    print(f"Jugadas perdedoras:  {losing_draws_count:,} ({losing_percentage:.1f}%)")
    
    if PLAYERS > 1:
        print(f"Jugadas por sorteo:  {PLAYERS:,}")
        print(f"Total de sorteos:    {total_draws:,}")
    
    # Mejores y peores resultados
    if detailed_results:
        best_result = max(detailed_results, key=lambda x: x["net_gain"])
        worst_result = min(detailed_results, key=lambda x: x["net_gain"])
        
        print(f"\n🏆 MEJOR RESULTADO:")
        print(f"   Fecha: {best_result['date']}")
        print(f"   Aciertos: {best_result['matches']}")
        print(f"   Premio: {best_result['prize']:,} pesos")
        print(f"   Ganancia neta: {best_result['net_gain']:,} pesos")
        
        print(f"\n💸 PEOR RESULTADO:")
        print(f"   Fecha: {worst_result['date']}")
        print(f"   Aciertos: {worst_result['matches']}")
        print(f"   Premio: {worst_result['prize']:,} pesos")
        print(f"   Pérdida neta: {worst_result['net_gain']:,} pesos")
    
    # Análisis de probabilidades teóricas vs reales
    print(f"\n🧮 ANÁLISIS DE PROBABILIDADES:")
    print("-" * 40)
    print("Comparación teórica vs simulación:")
    
    # Aquí podrías añadir cálculos de probabilidades teóricas si quisieras
    # Por simplicidad, solo mostramos los resultados obtenidos
    
    return {
        "total_draws": total_draws,
        "total_players": PLAYERS,
        "total_games": total_games_played,
        "matches_distribution": dict(matches_count),
        "total_spent": total_spent,
        "total_won": total_won,
        "net_result": total_net,
        "roi_percentage": roi_percentage,
        "detailed_results": detailed_results
    }

def main():
    """Función principal"""
    # Verificar si existe el archivo
    if not os.path.exists(JSON_FILE_PATH):
        print(f"❌ Error: No se encontró el archivo {JSON_FILE_PATH}")
        print("   Asegúrate de que el archivo existe y la ruta es correcta")
        return
    
    # Cargar datos históricos
    historical_data = load_historical_data(JSON_FILE_PATH)
    if not historical_data:
        return
    
    # Ejecutar simulación
    results = run_simulation(historical_data)
    
    if results:
        print(f"\n✅ Simulación completada exitosamente!")
        print(f"📁 Sorteos analizados: {results['total_draws']:,}")
        print(f"👥 Jugadores simulados: {results['total_players']:,}")
        print(f"🎮 Total de jugadas: {results['total_games']:,}")
        
        # Mostrar estadísticas de escala masiva si hay muchos jugadores
        if PLAYERS >= 10000:
            print(f"\n📊 ESCALA MASIVA - SIMULACIÓN DE {PLAYERS:,} JUGADORES:")
            print("-" * 50)
            avg_spent_per_player = results['total_spent'] / PLAYERS
            avg_won_per_player = results['total_won'] / PLAYERS
            avg_net_per_player = results['net_result'] / PLAYERS
            
            print(f"Gasto promedio por jugador:    {avg_spent_per_player:,.0f} pesos")
            print(f"Ganancia promedio por jugador: {avg_won_per_player:,.0f} pesos")
            print(f"Balance promedio por jugador:  {avg_net_per_player:,.0f} pesos")
        
        # Opcional: Guardar resultados detallados en un archivo
        # save_detailed_results = input("\n¿Guardar resultados detallados en archivo? (s/n): ")
        # if save_detailed_results.lower() == 's':
        #     output_file = "simulacion_resultados_detallados.json"
        #     with open(output_file, 'w', encoding='utf-8') as f:
        #         json.dump(results, f, indent=2, ensure_ascii=False)
        #     print(f"📄 Resultados guardados en: {output_file}")

if __name__ == "__main__":
    main()