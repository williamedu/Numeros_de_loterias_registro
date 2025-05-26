#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análisis de efectividad de la estrategia con 6 candidatos o menos
Ejecutar desde la carpeta raíz del proyecto donde está la carpeta json_Datos/
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

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

def analyze_lottery_data():
    """Función principal para analizar los datos de la lotería"""
    
    # Ruta directa al archivo JSON
    json_file = r"C:\Users\willi\OneDrive\Escritorio\New_Loteria_Resultados\Numeros_de_loterias_registro\json_Datos\lottery_data_Pega_3_Mas.json"
    
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
    
    # Filtrar sorteos con 6 candidatos o menos
    sorteos_with_six_or_less = [s for s in all_sorteos if s['totalCandidates'] <= 6 and s['totalCandidates'] > 0]
    
    # Categorizar por coincidencias
    stats = {0: 0, 1: 0, 2: 0, 3: 0}
    
    for sorteo in sorteos_with_six_or_less:
        coincidencias = min(sorteo['coincidenceCount'], 3)
        stats[coincidencias] += 1
    
    total_with_six_or_less = len(sorteos_with_six_or_less)
    total_general = len(all_sorteos)
    
    # Calcular estadísticas
    at_least_one = stats[1] + stats[2] + stats[3]
    at_least_two = stats[2] + stats[3]
    exactly_three = stats[3]
    
    # Mostrar resultados
    print('\n=== ANÁLISIS DE EFECTIVIDAD CON 6 CANDIDATOS O MENOS ===\n')
    
    print('📈 RESUMEN ESTADÍSTICO:')
    print(f'Total de sorteos analizados: {total_general}')
    print(f'Total con ≤6 candidatos: {total_with_six_or_less} sorteos ({(total_with_six_or_less/total_general)*100:.1f}%)\n')
    
    print('POR CATEGORÍA DE COINCIDENCIAS:')
    print('┌─────────────────┬──────────┬─────────────┬────────────┐')
    print('│   Coincidencias │ Cantidad │ Porcentaje  │ Efectividad│')
    print('├─────────────────┼──────────┼─────────────┼────────────┤')
    
    # Mostrar estadísticas por categoría
    for i in range(4):
        count = stats[i]
        pct = (count / total_with_six_or_less * 100) if total_with_six_or_less > 0 else 0
        
        if i == 0:
            label = '0 coincidencias'
            efectividad = '     -     '
        else:
            label = f'{i} coincidencia{"s" if i > 1 else ""}'
            efectividad = f'{pct:6.1f}%'
        
        print(f'│ {label:<15} │{count:8}  │{pct:9.1f}%    │{efectividad:>10}  │')
    
    print('├─────────────────┼──────────┼─────────────┼────────────┤')
    
    # Resumen de efectividad
    pct_at_least_one = (at_least_one / total_with_six_or_less * 100) if total_with_six_or_less > 0 else 0
    pct_at_least_two = (at_least_two / total_with_six_or_less * 100) if total_with_six_or_less > 0 else 0
    pct_exactly_three = (exactly_three / total_with_six_or_less * 100) if total_with_six_or_less > 0 else 0
    
    print(f'│ AL MENOS 1      │{at_least_one:8}  │{pct_at_least_one:9.1f}%    │{pct_at_least_one:6.1f}%    │')
    print(f'│ AL MENOS 2      │{at_least_two:8}  │{pct_at_least_two:9.1f}%    │{pct_at_least_two:6.1f}%    │')
    print(f'│ TRIPLE EXACTO   │{exactly_three:8}  │{pct_exactly_three:9.1f}%    │{pct_exactly_three:6.1f}%    │')
    
    print('└─────────────────┴──────────┴─────────────┴────────────┘\n')
    
    print('🎯 CONCLUSIÓN:')
    print(f'Cuando hay 6 candidatos o menos, la estrategia tiene una efectividad del {pct_at_least_one:.1f}%')
    print(f'de acertar al menos 1 número, y un {pct_at_least_two:.1f}% de acertar 2 o más números.')
    
    # Información adicional
    if total_with_six_or_less > 0:
        avg_candidates = sum(s['totalCandidates'] for s in sorteos_with_six_or_less) / total_with_six_or_less
        exactly_six = len([s for s in sorteos_with_six_or_less if s['totalCandidates'] == 6])
        one_to_three = len([s for s in sorteos_with_six_or_less if s['totalCandidates'] <= 3])
        four_to_six = len([s for s in sorteos_with_six_or_less if 4 <= s['totalCandidates'] <= 6])
        
        print('\n📝 INFORMACIÓN ADICIONAL:')
        print(f'• Promedio de candidatos en estos sorteos: {avg_candidates:.1f}')
        print(f'• Sorteos con exactamente 6 candidatos: {exactly_six}')
        print(f'• Sorteos con 1-3 candidatos: {one_to_three}')
        print(f'• Sorteos con 4-6 candidatos: {four_to_six}')

if __name__ == "__main__":
    analyze_lottery_data()