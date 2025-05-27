#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análisis de efectividad de la estrategia con 6 candidatos o menos
Incluye simulación de jugadas con todas las combinaciones posibles
Ejecutar desde la carpeta raíz del proyecto donde está la carpeta json_Datos/
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from itertools import combinations

def parse_date(date_str):
    """Convertir string de fecha a objeto datetime"""
    try:
        day, month, year = date_str.split('-')
        return datetime(int(year), int(month), int(day))
    except:
        return None

def days_difference(date1, date2):
    """Calcular diferencia en días entre dos fechas"""
    return abs((date2 - date1).days)

def create_number_appearances_map(lottery_data):
    """Crear mapa de apariciones de números con fechas ordenadas"""
    appearances_map = {}
    
    for number, data in lottery_data['numbers'].items():
        if 'history' in data and data['history']:
            date_map = {}
            
            for entry in data['history']:
                date_key = entry['date']
                if date_key not in date_map:
                    date_obj = parse_date(entry['date'])
                    if date_obj:
                        date_map[date_key] = {
                            'date': entry['date'],
                            'dateObj': date_obj,
                            'positions': [entry['position']],
                            'daysAgo': entry['daysAgo']
                        }
                else:
                    if entry['position'] not in date_map[date_key]['positions']:
                        date_map[date_key]['positions'].append(entry['position'])
            
            unique_appearances = list(date_map.values())
            unique_appearances.sort(key=lambda x: x['dateObj'], reverse=True)
            
            if unique_appearances:
                appearances_map[number] = unique_appearances
    
    return appearances_map

def get_winning_numbers_for_date(date, number_appearances):
    """Obtener números ganadores para una fecha específica"""
    winning_numbers = []
    
    for number, appearances in number_appearances.items():
        for appearance in appearances:
            if appearance['date'] == date:
                winning_numbers.append({
                    'number': number,
                    'positions': appearance['positions']
                })
                break
    
    return winning_numbers

def find_valid_candidates_for_number(number, appearances, target_date):
    """Encontrar candidatos válidos para un número específico en una fecha objetivo"""
    candidates = []
    completed_patterns = []
    
    for i in range(len(appearances) - 1):
        first_appearance = appearances[i]
        
        for j in range(i + 1, len(appearances)):
            second_appearance = appearances[j]
            days_between = days_difference(first_appearance['dateObj'], second_appearance['dateObj'])
            
            if days_between <= 10:
                # Ordenar cronológicamente
                if first_appearance['dateObj'] > second_appearance['dateObj']:
                    chrono_first = second_appearance
                    chrono_second = first_appearance
                else:
                    chrono_first = first_appearance
                    chrono_second = second_appearance
                
                # Verificar si ya fue usado
                is_already_used = any(
                    pattern['firstDate'] == chrono_first['date'] and pattern['secondDate'] == chrono_second['date']
                    for pattern in completed_patterns
                )
                
                if is_already_used:
                    continue
                
                # Buscar tercera aparición
                third_appearance = None
                for k in range(len(appearances)):
                    potential_third = appearances[k]
                    days_from_second = days_difference(chrono_second['dateObj'], potential_third['dateObj'])
                    
                    if (potential_third['dateObj'] > chrono_second['dateObj'] and 
                        potential_third['dateObj'] < target_date and 
                        days_from_second <= 10):
                        
                        is_used_in_completed = any(
                            pattern.get('thirdDate') == potential_third['date']
                            for pattern in completed_patterns
                        )
                        
                        if not is_used_in_completed:
                            third_appearance = potential_third
                            break
                
                if third_appearance:
                    # Patrón completado
                    completed_pattern = {
                        'number': number,
                        'firstDate': chrono_first['date'],
                        'secondDate': chrono_second['date'],
                        'thirdDate': third_appearance['date'],
                        'completed': True
                    }
                    completed_patterns.append(completed_pattern)
                else:
                    # Verificar si está activo
                    days_since_second = days_difference(chrono_second['dateObj'], target_date)
                    
                    if target_date > chrono_second['dateObj'] and days_since_second <= 10:
                        candidates.append({
                            'number': number,
                            'firstDate': chrono_first['date'],
                            'secondDate': chrono_second['date'],
                            'daysSinceSecond': days_since_second,
                            'daysRemaining': max(0, 10 - days_since_second)
                        })
                
                break
    
    return candidates

def get_candidates_at_date(target_date, number_appearances):
    """Obtener candidatos activos en una fecha específica"""
    active_candidates = []
    
    for number, appearances in number_appearances.items():
        if len(appearances) < 2:
            continue
        
        candidates_for_number = find_valid_candidates_for_number(number, appearances, target_date)
        active_candidates.extend(candidates_for_number)
    
    return active_candidates

def check_coincidences_in_draw(winning_numbers, active_candidates):
    """Verificar coincidencias entre números ganadores y candidatos activos"""
    winning_numbers_set = {w['number'] for w in winning_numbers}
    matching_numbers = []
    
    for candidate in active_candidates:
        if candidate['number'] in winning_numbers_set:
            matching_numbers.append(candidate['number'])
    
    return {
        'matchingNumbers': matching_numbers,
        'coincidenceCount': len(matching_numbers)
    }

def calculate_winnings(coincidences_count, bet_amount=10):
    """Calcular ganancias según el número de coincidencias"""
    # Los premios se calculan proporcionalmente al monto apostado
    multiplier = bet_amount / 10  # Factor de multiplicación basado en RD$10 base
    
    if coincidences_count == 3:
        return int(30000 * multiplier)  # RD$30,000 por cada RD$10 apostado
    elif coincidences_count == 2:
        return int(600 * multiplier)    # RD$600 por cada RD$10 apostado
    elif coincidences_count == 1:
        return bet_amount               # Devolución del monto apostado
    else:
        return 0                        # Sin premio

def generate_all_combinations(candidates, winning_numbers, bet_amount=10, debug=False):
    """Generar todas las combinaciones posibles de 3 números de los candidatos"""
    candidate_numbers = [c['number'] if isinstance(c, dict) else c for c in candidates]
    winning_set = {w['number'] if isinstance(w, dict) else w for w in winning_numbers}
    
    all_combinations = list(combinations(candidate_numbers, 3))
    bet_results = []
    
    if debug:
        print(f"\n🔍 DEBUG - Combinaciones para sorteo:")
        print(f"Candidatos: {candidate_numbers}")
        print(f"Ganadores: {list(winning_set)}")
        print(f"Total combinaciones: {len(all_combinations)}")
    
    coincidence_count = {0: 0, 1: 0, 2: 0, 3: 0}
    
    for combo in all_combinations:
        coincidences = len(set(combo) & winning_set)
        winnings = calculate_winnings(coincidences, bet_amount)
        coincidence_count[coincidences] += 1
        
        bet_results.append({
            'combination': combo,
            'coincidences': coincidences,
            'winnings': winnings,
            'net_result': winnings - bet_amount  # Resta el costo de la apuesta
        })
    
    if debug:
        for i in range(4):
            if coincidence_count[i] > 0:
                print(f"  {i} coincidencias: {coincidence_count[i]} combinaciones")
                if i == 3:
                    triple_combos = [bet['combination'] for bet in bet_results if bet['coincidences'] == 3]
                    print(f"    Combinaciones ganadoras: {triple_combos}")
    
    return bet_results

def debug_combination_calculation(candidates, winning_numbers, bet_amount=10):
    """Función de debug para verificar cálculos de combinaciones"""
    print(f"\n🔍 DEBUG - Análisis detallado:")
    print(f"Candidatos: {[c['number'] if isinstance(c, dict) else c for c in candidates]}")
    print(f"Ganadores: {[w['number'] if isinstance(w, dict) else w for w in winning_numbers]}")
    
    # Generar combinaciones
    candidate_numbers = [c['number'] if isinstance(c, dict) else c for c in candidates]
    winning_set = {w['number'] if isinstance(w, dict) else w for w in winning_numbers}
    
    all_combinations = list(combinations(candidate_numbers, 3))
    
    print(f"Total de combinaciones C({len(candidate_numbers)}, 3) = {len(all_combinations)}")
    
    # Analizar cada combinación
    coincidence_breakdown = {0: [], 1: [], 2: [], 3: []}
    
    for combo in all_combinations:
        coincidences = len(set(combo) & winning_set)
        coincidence_breakdown[coincidences].append(combo)
    
    for i in range(4):
        count = len(coincidence_breakdown[i])
        if count > 0:
            print(f"{i} coincidencias: {count} combinaciones")
            if i == 3:  # Mostrar todas las combinaciones ganadoras
                print(f"  Combinaciones ganadoras: {coincidence_breakdown[i]}")
            elif i > 0 and count <= 5:  # Mostrar algunas si no son muchas
                print(f"  Ejemplos: {coincidence_breakdown[i][:3]}")
    
    return len(all_combinations), coincidence_breakdown
    """Generar todas las combinaciones posibles de 3 números de los candidatos"""
    candidate_numbers = [c['number'] for c in candidates]
    winning_set = {w['number'] for w in winning_numbers}
    
    all_combinations = list(combinations(candidate_numbers, 3))
    bet_results = []
    
    for combo in all_combinations:
        coincidences = len(set(combo) & winning_set)
        winnings = calculate_winnings(coincidences, bet_amount)
        
        bet_results.append({
            'combination': combo,
            'coincidences': coincidences,
            'winnings': winnings,
            'net_result': winnings - bet_amount  # Resta el costo de la apuesta
        })
    
    return bet_results

def simulate_betting_strategy(sorteos_with_six_or_less, bet_amount=10, debug=False):
    """Simular la estrategia de apuestas para todos los sorteos con 6 candidatos o menos"""
    simulation_results = {
        'bet_amount': bet_amount,
        'total_sorteos': 0,
        'total_combinations': 0,
        'total_invested': 0,
        'total_winnings': 0,
        'net_result': 0,
        'winning_bets': 0,
        'losing_bets': 0,
        'break_even_bets': 0,
        'results_by_coincidences': {0: 0, 1: 0, 2: 0, 3: 0},
        'detailed_results': []
    }
    
    debug_count = 0
    
    for sorteo in sorteos_with_six_or_less:
        # Simular que tenemos los candidatos y números ganadores
        candidates = [{'number': num} for num in sorteo['candidatesAtTime']]
        winning_numbers = [{'number': num} for num in sorteo['winningNumbers']]
        
        # Debug para los primeros 2 sorteos si está activado
        show_debug = debug and debug_count < 2
        if show_debug:
            print(f"\n📅 SORTEO DEBUG {debug_count + 1}: {sorteo['date']}")
            debug_count += 1
        
        # Generar todas las combinaciones posibles
        bet_results = generate_all_combinations(candidates, winning_numbers, bet_amount, show_debug)
        
        # Calcular estadísticas para este sorteo
        sorteo_invested = len(bet_results) * bet_amount
        sorteo_winnings = sum(bet['winnings'] for bet in bet_results)
        sorteo_net = sorteo_winnings - sorteo_invested
        
        # Contar tipos de apuestas
        winning_bets = sum(1 for bet in bet_results if bet['net_result'] > 0)
        losing_bets = sum(1 for bet in bet_results if bet['net_result'] < 0)
        break_even_bets = sum(1 for bet in bet_results if bet['net_result'] == 0)
        
        # Contar por coincidencias
        coincidences_count = {0: 0, 1: 0, 2: 0, 3: 0}
        for bet in bet_results:
            coincidences_count[bet['coincidences']] += 1
        
        if show_debug:
            print(f"  💰 Invertido: RD${sorteo_invested:,}, Ganado: RD${sorteo_winnings:,}, Neto: RD${sorteo_net:,}")
        
        # Guardar resultado detallado
        sorteo_result = {
            'date': sorteo['date'],
            'candidates': sorteo['candidatesAtTime'],
            'winning_numbers': sorteo['winningNumbers'],
            'total_combinations': len(bet_results),
            'invested': sorteo_invested,
            'winnings': sorteo_winnings,
            'net_result': sorteo_net,
            'winning_bets': winning_bets,
            'losing_bets': losing_bets,
            'break_even_bets': break_even_bets,
            'coincidences_breakdown': coincidences_count
        }
        
        simulation_results['detailed_results'].append(sorteo_result)
        
        # Acumular totales
        simulation_results['total_sorteos'] += 1
        simulation_results['total_combinations'] += len(bet_results)
        simulation_results['total_invested'] += sorteo_invested
        simulation_results['total_winnings'] += sorteo_winnings
        simulation_results['winning_bets'] += winning_bets
        simulation_results['losing_bets'] += losing_bets
        simulation_results['break_even_bets'] += break_even_bets
        
        for coincidences, count in coincidences_count.items():
            simulation_results['results_by_coincidences'][coincidences] += count
    
    simulation_results['net_result'] = simulation_results['total_winnings'] - simulation_results['total_invested']
    
    return simulation_results

def analyze_lottery_data():
    """Función principal para analizar los datos de la lotería"""
    
    # ============================================================
    # 🎯 VARIABLES CONFIGURABLES
    # ============================================================
    BET_AMOUNT = 100          # Monto de apuesta por combinación (RD$)
    MAX_CANDIDATES = 6    # Número máximo de candidatos activos para simulación
    DEBUG_MODE = False       # Activar para ver análisis detallado de algunos sorteos
    # Ejemplos MAX_CANDIDATES: 6, 8, 10, 12, etc.
    # NOTA: Con más candidatos, habrá más combinaciones y mayor inversión
    # ============================================================
    
    # Ruta directa al archivo JSON
    json_file = r"C:\Users\Admin\Desktop\New_Loterry\Numeros_de_loterias_registro\json_Datos\lottery_data_Pega_3_Mas.json"
    
    # Verificar que el archivo existe
    if not os.path.exists(json_file):
        print(f"❌ No se encontró el archivo en la ruta especificada:")
        print(f"   {json_file}")
        return
    
    print(f"📁 Archivo encontrado: {os.path.basename(json_file)}")
    print(f"📍 Ruta: {json_file}")
    
    print(f"📁 Cargando datos desde: {json_file}")
    
    # Cargar datos JSON
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            lottery_data = json.load(f)
    except Exception as e:
        print(f"❌ Error al cargar el archivo JSON: {e}")
        return
    
    # Verificar que sea una lotería de 3 posiciones
    if lottery_data.get('positionsCount', 0) != 3:
        print(f"❌ Este análisis solo funciona para loterías de 3 posiciones. Posiciones encontradas: {lottery_data.get('positionsCount', 'No especificado')}")
        return
    
    print(f"✅ Datos cargados: {lottery_data.get('lotteryName', 'Lotería desconocida')}")
    
    # Crear mapa de apariciones
    number_appearances = create_number_appearances_map(lottery_data)
    
    # Obtener todas las fechas únicas de sorteos
    all_dates = set()
    for number, appearances in number_appearances.items():
        for appearance in appearances:
            all_dates.add(appearance['date'])
    
    # Convertir a lista ordenada
    sorted_dates = []
    for date_str in all_dates:
        date_obj = parse_date(date_str)
        if date_obj:
            sorted_dates.append({'dateStr': date_str, 'dateObj': date_obj})
    
    sorted_dates.sort(key=lambda x: x['dateObj'])
    
    print(f"📊 Analizando {len(sorted_dates)} sorteos...")
    
    # Analizar cada sorteo
    all_sorteos = []
    
    for date_info in sorted_dates:
        date_str = date_info['dateStr']
        date_obj = date_info['dateObj']
        
        # Obtener números ganadores
        winning_numbers = get_winning_numbers_for_date(date_str, number_appearances)
        
        if not winning_numbers:
            continue
        
        # Obtener candidatos activos
        active_candidates = get_candidates_at_date(date_obj, number_appearances)
        
        # Verificar coincidencias
        coincidences = check_coincidences_in_draw(winning_numbers, active_candidates)
        
        sorteo_data = {
            'date': date_str,
            'winningNumbers': [w['number'] for w in winning_numbers],
            'candidatesAtTime': [c['number'] for c in active_candidates],
            'coincidences': coincidences['matchingNumbers'],
            'coincidenceCount': coincidences['coincidenceCount'],
            'totalCandidates': len(active_candidates)
        }
        
        all_sorteos.append(sorteo_data)
    
    # Filtrar sorteos con el número máximo de candidatos configurado
    sorteos_with_max_candidates = [s for s in all_sorteos if s['totalCandidates'] <= MAX_CANDIDATES and s['totalCandidates'] > 0]
    
    # También mantener el análisis original con 6 candidatos para comparación
    sorteos_with_six_or_less = [s for s in all_sorteos if s['totalCandidates'] <= 6 and s['totalCandidates'] > 0]
    
    # Categorizar por coincidencias (análisis original con 6 candidatos)
    stats = {0: 0, 1: 0, 2: 0, 3: 0}
    
    for sorteo in sorteos_with_six_or_less:
        coincidencias = min(sorteo['coincidenceCount'], 3)
        stats[coincidencias] += 1
    
    total_with_six_or_less = len(sorteos_with_six_or_less)
    total_general = len(all_sorteos)
    
    # Categorizar por coincidencias (análisis con candidatos configurados)
    stats_max = {0: 0, 1: 0, 2: 0, 3: 0}
    
    for sorteo in sorteos_with_max_candidates:
        coincidencias = min(sorteo['coincidenceCount'], 3)
        stats_max[coincidencias] += 1
    
    total_with_max_candidates = len(sorteos_with_max_candidates)
    
    # Calcular estadísticas
    at_least_one = stats[1] + stats[2] + stats[3]
    at_least_two = stats[2] + stats[3]
    exactly_three = stats[3]
    
    # Mostrar resultados del análisis principal
    print(f'\n=== ANÁLISIS DE EFECTIVIDAD CON {MAX_CANDIDATES} CANDIDATOS O MENOS ===\n')
    
    print('📈 RESUMEN ESTADÍSTICO:')
    print(f'Total de sorteos analizados: {total_general}')
    print(f'Total con ≤{MAX_CANDIDATES} candidatos: {total_with_max_candidates} sorteos ({(total_with_max_candidates/total_general)*100:.1f}%)\n')
    
    print('POR CATEGORÍA DE COINCIDENCIAS:')
    print('┌─────────────────┬──────────┬─────────────┬────────────┐')
    print('│   Coincidencias │ Cantidad │ Porcentaje  │ Efectividad│')
    print('├─────────────────┼──────────┼─────────────┼────────────┤')
    
    # Mostrar estadísticas por categoría usando MAX_CANDIDATES
    for i in range(4):
        count = stats_max[i]
        pct = (count / total_with_max_candidates * 100) if total_with_max_candidates > 0 else 0
        
        if i == 0:
            label = '0 coincidencias'
            efectividad = '     -     '
        else:
            label = f'{i} coincidencia{"s" if i > 1 else ""}'
            efectividad = f'{pct:6.1f}%'
        
        print(f'│ {label:<15} │{count:8}  │{pct:9.1f}%    │{efectividad:>10}  │')
    
    print('├─────────────────┼──────────┼─────────────┼────────────┤')
    
    # Resumen de efectividad para MAX_CANDIDATES
    at_least_one_max = stats_max[1] + stats_max[2] + stats_max[3]
    at_least_two_max = stats_max[2] + stats_max[3]
    exactly_three_max = stats_max[3]
    
    pct_at_least_one_max = (at_least_one_max / total_with_max_candidates * 100) if total_with_max_candidates > 0 else 0
    pct_at_least_two_max = (at_least_two_max / total_with_max_candidates * 100) if total_with_max_candidates > 0 else 0
    pct_exactly_three_max = (exactly_three_max / total_with_max_candidates * 100) if total_with_max_candidates > 0 else 0
    
    print(f'│ AL MENOS 1      │{at_least_one_max:8}  │{pct_at_least_one_max:9.1f}%    │{pct_at_least_one_max:6.1f}%    │')
    print(f'│ AL MENOS 2      │{at_least_two_max:8}  │{pct_at_least_two_max:9.1f}%    │{pct_at_least_two_max:6.1f}%    │')
    print(f'│ TRIPLE EXACTO   │{exactly_three_max:8}  │{pct_exactly_three_max:9.1f}%    │{pct_exactly_three_max:6.1f}%    │')
    
    print('└─────────────────┴──────────┴─────────────┴────────────┘\n')
    
    print('🎯 CONCLUSIÓN:')
    print(f'Cuando hay {MAX_CANDIDATES} candidatos o menos, la estrategia tiene una efectividad del {pct_at_least_one_max:.1f}%')
    print(f'de acertar al menos 1 número, y un {pct_at_least_two_max:.1f}% de acertar 2 o más números.')
    
    # Información adicional para MAX_CANDIDATES
    if total_with_max_candidates > 0:
        avg_candidates_max = sum(s['totalCandidates'] for s in sorteos_with_max_candidates) / total_with_max_candidates
        
        print(f'\n📝 INFORMACIÓN ADICIONAL PARA ≤{MAX_CANDIDATES} CANDIDATOS:')
        print(f'• Promedio de candidatos en estos sorteos: {avg_candidates_max:.1f}')
        print(f'• Total de sorteos válidos para simulación: {total_with_max_candidates}')
        
        # Distribución por rangos de candidatos
        ranges = {
            '1-3': len([s for s in sorteos_with_max_candidates if s['totalCandidates'] <= 3]),
            '4-6': len([s for s in sorteos_with_max_candidates if 4 <= s['totalCandidates'] <= 6]),
            '7-10': len([s for s in sorteos_with_max_candidates if 7 <= s['totalCandidates'] <= 10]),
            '11-15': len([s for s in sorteos_with_max_candidates if 11 <= s['totalCandidates'] <= 15]),
            '16-20': len([s for s in sorteos_with_max_candidates if 16 <= s['totalCandidates'] <= 20]),
            '21+': len([s for s in sorteos_with_max_candidates if s['totalCandidates'] > 20])
        }
        
        print(f'• Distribución por rangos:')
        for range_name, count in ranges.items():
            if count > 0:
                pct = (count / total_with_max_candidates * 100)
                print(f'  - {range_name} candidatos: {count} sorteos ({pct:.1f}%)')
    
    # Solo mostrar comparación con 6 si MAX_CANDIDATES es diferente de 6
    if MAX_CANDIDATES != 6 and total_with_six_or_less > 0:
        print(f'\n📊 COMPARACIÓN CON ESTRATEGIA DE 6 CANDIDATOS:')
        pct_at_least_one_six = (at_least_one / total_with_six_or_less * 100) if total_with_six_or_less > 0 else 0
        print(f'• Con ≤6 candidatos: {total_with_six_or_less} sorteos, efectividad {pct_at_least_one_six:.1f}%')
        print(f'• Con ≤{MAX_CANDIDATES} candidatos: {total_with_max_candidates} sorteos, efectividad {pct_at_least_one_max:.1f}%')
        
        opportunity_increase = ((total_with_max_candidates / total_with_six_or_less - 1) * 100) if total_with_six_or_less > 0 else 0
        print(f'• Aumento en oportunidades: {opportunity_increase:.1f}%')
    
    # NUEVA SECCIÓN: SIMULACIÓN DE JUGADAS
    print('\n' + '='*80)
    print('🎮 SIMULACIÓN DE JUGADAS CON TODAS LAS COMBINACIONES POSIBLES')
    print(f'💰 Monto de apuesta configurado: RD${BET_AMOUNT} por combinación')
    print(f'🎯 Máximo de candidatos activos: {MAX_CANDIDATES}')
    print('='*80)
    
    # Usar los sorteos con el número máximo de candidatos configurado
    sorteos_for_simulation = sorteos_with_max_candidates
    
    # Calcular el número total de combinaciones posibles
    from math import comb
    total_possible_combinations = 0
    for sorteo in sorteos_for_simulation:
        num_candidates = len(sorteo['candidatesAtTime'])
        if num_candidates >= 3:  # Necesitamos al menos 3 candidatos para hacer combinaciones de 3
            combinations_count = comb(num_candidates, 3)
            total_possible_combinations += combinations_count
    
    print(f'📊 Se analizarán {len(sorteos_for_simulation)} sorteos con ≤{MAX_CANDIDATES} candidatos')
    print(f'🎲 Total estimado de combinaciones: {total_possible_combinations:,}')
    print(f'💸 Inversión estimada total: RD${total_possible_combinations * BET_AMOUNT:,}')
    
    # Realizar simulación
    simulation_results = simulate_betting_strategy(sorteos_for_simulation, BET_AMOUNT, DEBUG_MODE)
    
    # Mostrar resultados de la simulación
    print('\n💰 RESUMEN FINANCIERO:')
    print(f'📊 Total de sorteos simulados: {simulation_results["total_sorteos"]}')
    print(f'🎯 Criterio usado: ≤{MAX_CANDIDATES} candidatos activos')
    print(f'🎲 Total de combinaciones jugadas: {simulation_results["total_combinations"]:,}')
    print(f'💸 Total invertido: RD${simulation_results["total_invested"]:,}')
    print(f'💵 Total ganado: RD${simulation_results["total_winnings"]:,}')
    print(f'📈 Resultado neto: {"+" if simulation_results["net_result"] >= 0 else ""}RD${simulation_results["net_result"]:,}')
    
    # Calcular ROI
    roi = (simulation_results["net_result"] / simulation_results["total_invested"] * 100) if simulation_results["total_invested"] > 0 else 0
    print(f'📊 ROI (Retorno de Inversión): {roi:.2f}%')
    
    print('\n🎯 DISTRIBUCIÓN DE RESULTADOS:')
    print('┌─────────────────┬──────────┬─────────────┬─────────────┐')
    print('│ Tipo de Apuesta │ Cantidad │ Porcentaje  │   Monto     │')
    print('├─────────────────┼──────────┼─────────────┼─────────────┤')
    
    total_bets = simulation_results["total_combinations"]
    
    # Apuestas ganadoras (calcular correctamente el monto)
    winning_pct = (simulation_results["winning_bets"] / total_bets * 100) if total_bets > 0 else 0
    
    # Calcular el monto real de ganancias (no las apuestas ganadoras)
    total_winnings_from_winning_bets = 0
    for res in simulation_results['detailed_results']:
        # Para cada sorteo, sumar solo las ganancias de las apuestas ganadoras
        candidates = [{'number': num} for num in res['candidates']]
        winning_numbers = [{'number': num} for num in res['winning_numbers']]
        
        if len(candidates) >= 3:
            bet_results = generate_all_combinations(candidates, winning_numbers, BET_AMOUNT)
            for bet in bet_results:
                if bet['net_result'] > 0:  # Solo apuestas ganadoras
                    total_winnings_from_winning_bets += bet['winnings']
    
    print(f'│ Ganadoras       │{simulation_results["winning_bets"]:8}  │{winning_pct:9.1f}%    │ RD${total_winnings_from_winning_bets:,}     │')
    
    # Apuestas perdedoras
    losing_pct = (simulation_results["losing_bets"] / total_bets * 100) if total_bets > 0 else 0
    losing_amount = simulation_results["losing_bets"] * BET_AMOUNT
    
    print(f'│ Perdedoras      │{simulation_results["losing_bets"]:8}  │{losing_pct:9.1f}%    │ RD${losing_amount:,}     │')
    
    # Apuestas en empate
    break_even_pct = (simulation_results["break_even_bets"] / total_bets * 100) if total_bets > 0 else 0
    break_even_amount = simulation_results["break_even_bets"] * BET_AMOUNT
    
    print(f'│ En empate       │{simulation_results["break_even_bets"]:8}  │{break_even_pct:9.1f}%    │ RD${break_even_amount:,}     │')
    
    print('└─────────────────┴──────────┴─────────────┴─────────────┘')
    
    print('\n🎲 DISTRIBUCIÓN POR COINCIDENCIAS:')
    print('┌─────────────────┬──────────┬─────────────┬─────────────┐')
    print('│   Coincidencias │ Cantidad │ Porcentaje  │   Premio    │')
    print('├─────────────────┼──────────┼─────────────┼─────────────┤')
    
    for coincidences in range(4):
        count = simulation_results["results_by_coincidences"][coincidences]
        pct = (count / total_bets * 100) if total_bets > 0 else 0
        prize = calculate_winnings(coincidences, BET_AMOUNT)
        
        print(f'│ {coincidences} coincidencia{"s" if coincidences != 1 else ""} │{count:8}  │{pct:9.1f}%    │ RD${prize:,}      │')
    
    print('└─────────────────┴──────────┴─────────────┴─────────────┘')
    
    # Análisis de rentabilidad
    print('\n📊 ANÁLISIS DE RENTABILIDAD:')
    print(f'🎯 Estrategia con ≤{MAX_CANDIDATES} candidatos activos:')
    if simulation_results["net_result"] > 0:
        print(f'✅ La estrategia habría sido RENTABLE con una ganancia de RD${simulation_results["net_result"]:,}')
    elif simulation_results["net_result"] == 0:
        print('⚖️  La estrategia habría resultado en EMPATE (sin ganancias ni pérdidas)')
    else:
        print(f'❌ La estrategia habría resultado en PÉRDIDAS de RD${abs(simulation_results["net_result"]):,}')
    
    # Promedio por sorteo
    avg_per_draw = simulation_results["net_result"] / simulation_results["total_sorteos"] if simulation_results["total_sorteos"] > 0 else 0
    print(f'💡 Resultado promedio por sorteo: {"+" if avg_per_draw >= 0 else ""}RD${avg_per_draw:.2f}')
    
    # Análisis detallado de combinaciones ganadoras
    triple_winners = simulation_results['results_by_coincidences'][3]
    triple_sorteos_count = len([res for res in simulation_results['detailed_results'] 
                               if res['coincidences_breakdown'][3] > 0])
    
    if triple_winners > 0:
        print(f'\n🏆 ANÁLISIS DE TRIPLES GANADORES:')
        print(f'• Total de combinaciones con 3 aciertos: {triple_winners:,}')
        print(f'• Sorteos con al menos un triple ganador: {triple_sorteos_count}')
        
        # Mostrar algunos ejemplos de sorteos con triples ganadores
        triple_sorteos = []
        for sorteo_result in simulation_results['detailed_results']:
            if sorteo_result['coincidences_breakdown'][3] > 0:
                triple_sorteos.append({
                    'date': sorteo_result['date'],
                    'candidates': sorteo_result['candidates'],
                    'winners': sorteo_result['winning_numbers'],
                    'triple_count': sorteo_result['coincidences_breakdown'][3],
                    'total_combinations': sorteo_result['total_combinations']
                })
        
        print(f'\n📋 EJEMPLOS DE SORTEOS CON TRIPLES GANADORES (máximo 5):')
        for i, sorteo in enumerate(triple_sorteos[:5]):  # Mostrar máximo 5 ejemplos
            print(f'   {i+1}. Fecha: {sorteo["date"]}')
            print(f'      Candidatos ({len(sorteo["candidates"])}): {sorteo["candidates"]}')
            print(f'      Ganadores: {sorteo["winners"]}')
            print(f'      Triples ganadores: {sorteo["triple_count"]} de {sorteo["total_combinations"]} combinaciones')
            
            # Calcular ganancia para este sorteo específico (verificar cálculo)
            candidates_for_calc = [{'number': num} for num in sorteo["candidates"]]
            winners_for_calc = [{'number': num} for num in sorteo["winners"]]
            bet_results_for_calc = generate_all_combinations(candidates_for_calc, winners_for_calc, BET_AMOUNT)
            
            total_ganancia_verificada = sum(bet['winnings'] for bet in bet_results_for_calc)
            inversion_sorteo_verificada = len(bet_results_for_calc) * BET_AMOUNT
            ganancia_neta_verificada = total_ganancia_verificada - inversion_sorteo_verificada
            
            print(f'      Ganancia neta del sorteo: RD${ganancia_neta_verificada:,}\n')
    else:
        print(f'\n🏆 ANÁLISIS DE TRIPLES GANADORES:')
        print(f'• No hubo combinaciones con 3 aciertos en este análisis')
    
    # Comparación de complejidad
    print(f'\n🔍 COMPARACIÓN DE COMPLEJIDAD:')
    if MAX_CANDIDATES != 6:
        # Calcular combinaciones para sorteos con ≤6 candidatos
        six_combinations = 0
        six_sorteos = 0
        for s in all_sorteos:
            if 3 <= len(s['candidatesAtTime']) <= 6:
                six_combinations += comb(len(s['candidatesAtTime']), 3)
                six_sorteos += 1
        
        max_combinations = simulation_results["total_combinations"]
        max_sorteos = simulation_results["total_sorteos"]
        
        print(f'• Estrategia ≤6 candidatos: {six_sorteos} sorteos, ~{six_combinations:,} combinaciones')
        print(f'• Estrategia ≤{MAX_CANDIDATES} candidatos: {max_sorteos} sorteos, {max_combinations:,} combinaciones')
        
        if six_combinations > 0:
            complexity_increase = (max_combinations / six_combinations - 1) * 100
            print(f'• Aumento en combinaciones: {complexity_increase:.1f}%')
            
        if six_sorteos > 0:
            opportunity_increase = (max_sorteos / six_sorteos - 1) * 100
            print(f'• Aumento en oportunidades: {opportunity_increase:.1f}%')
    else:
        print(f'• Configuración actual: estrategia con ≤{MAX_CANDIDATES} candidatos')
        print(f'• Total de sorteos: {simulation_results["total_sorteos"]}')
        print(f'• Total de combinaciones: {simulation_results["total_combinations"]:,}')
    
    # Verificación de lógica de combinaciones
    print(f'\n🔍 VERIFICACIÓN DE CÁLCULOS:')
    sample_sorteo = None
    for sorteo_result in simulation_results['detailed_results']:
        if len(sorteo_result['candidates']) >= 3:
            sample_sorteo = sorteo_result
            break
    
    if sample_sorteo:
        num_candidates = len(sample_sorteo['candidates'])
        expected_combinations = comb(num_candidates, 3)
        actual_combinations = sample_sorteo['total_combinations']
        
        print(f'• Ejemplo verificado: {num_candidates} candidatos')
        print(f'• Combinaciones esperadas C({num_candidates},3) = {expected_combinations}')
        print(f'• Combinaciones calculadas = {actual_combinations}')
        print(f'• ✅ Cálculo correcto: {expected_combinations == actual_combinations}')
    
    # Advertencia sobre complejidad
    if simulation_results["total_combinations"] > 50000:
        print(f'\n⚠️  ADVERTENCIA ALTA COMPLEJIDAD:')
        print(f'   Esta estrategia requiere {simulation_results["total_combinations"]:,} apuestas')
        print(f'   Inversión total: RD${simulation_results["total_invested"]:,}')
        print(f'   Considere reducir MAX_CANDIDATES para menor riesgo.')
    elif simulation_results["total_combinations"] > 10000:
        print(f'\n⚡ COMPLEJIDAD MEDIA:')
        print(f'   Estrategia requiere {simulation_results["total_combinations"]:,} apuestas')
        print(f'   Inversión total: RD${simulation_results["total_invested"]:,}')
    else:
        print(f'\n✅ COMPLEJIDAD BAJA:')
        print(f'   Estrategia manejable con {simulation_results["total_combinations"]:,} apuestas')
        print(f'   Inversión total: RD${simulation_results["total_invested"]:,}')
    
    # Mejor y peor sorteo (verificar cálculos)
    if simulation_results["detailed_results"]:
        print(f'\n📊 SORTEOS DESTACADOS:')
        
        # Recalcular mejor y peor sorteo para asegurar consistencia
        sorteos_con_ganancias = []
        for res in simulation_results["detailed_results"]:
            # Verificar ganancia neta real
            candidates_check = [{'number': num} for num in res['candidates']]
            winners_check = [{'number': num} for num in res['winning_numbers']]
            
            if len(candidates_check) >= 3:
                bet_results_check = generate_all_combinations(candidates_check, winners_check, BET_AMOUNT)
                total_ganancia_real = sum(bet['winnings'] for bet in bet_results_check)
                inversion_real = len(bet_results_check) * BET_AMOUNT
                ganancia_neta_real = total_ganancia_real - inversion_real
                
                sorteos_con_ganancias.append({
                    'date': res['date'],
                    'net_result': ganancia_neta_real,
                    'candidates': len(res['candidates']),
                    'combinations': len(bet_results_check),
                    'invested': inversion_real,
                    'won': total_ganancia_real
                })
        
        if sorteos_con_ganancias:
            best_sorteo = max(sorteos_con_ganancias, key=lambda x: x['net_result'])
            worst_sorteo = min(sorteos_con_ganancias, key=lambda x: x['net_result'])
            
            print(f'🏆 Mejor sorteo: {best_sorteo["date"]} ')
            print(f'   {best_sorteo["candidates"]} candidatos, {best_sorteo["combinations"]} combinaciones')
            print(f'   Invertido: RD${best_sorteo["invested"]:,}, Ganado: RD${best_sorteo["won"]:,}')
            print(f'   Ganancia neta: RD${best_sorteo["net_result"]:,}')
            
            print(f'\n💸 Peor sorteo: {worst_sorteo["date"]}')
            print(f'   {worst_sorteo["candidates"]} candidatos, {worst_sorteo["combinations"]} combinaciones')
            print(f'   Invertido: RD${worst_sorteo["invested"]:,}, Ganado: RD${worst_sorteo["won"]:,}')
            print(f'   Pérdida neta: RD${abs(worst_sorteo["net_result"]):,}')

if __name__ == "__main__":
    analyze_lottery_data()