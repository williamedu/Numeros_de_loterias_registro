#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Calculadora de rentabilidad para apostar a todas las combinaciones
cuando hay 6 candidatos activos en Pega 3 Más
"""

import math

def calculate_combinations(n, r):
    """Calcular combinaciones C(n,r) = n! / (r! * (n-r)!)"""
    return math.factorial(n) // (math.factorial(r) * math.factorial(n - r))

def calculate_pega3_profits():
    """Calcular costos y ganancias para estrategia con 6 candidatos"""
    
    # Datos del análisis
    total_sorteos_6_candidatos = 59
    coincidencias = {
        0: 39,  # 66.1%
        1: 15,  # 25.4%
        2: 4,   # 6.8%
        3: 1    # 1.7%
    }
    
    # Premios por RD$10 apostados
    premio_3_numeros = 30000  # RD$30,000
    premio_2_numeros = 600    # RD$600
    premio_1_numero = 10      # Se devuelve lo apostado RD$10
    premio_0_numeros = 0      # Se pierde todo
    
    # Con 6 candidatos, número de combinaciones posibles de 3
    candidatos = 6
    combinaciones_totales = calculate_combinations(candidatos, 3)
    
    print("=== CALCULADORA DE RENTABILIDAD PEGA 3 MÁS ===\n")
    print("🎯 ESCENARIO: Apostar a TODAS las combinaciones cuando hay 6 candidatos activos\n")
    
    print(f"📊 DATOS BASE:")
    print(f"• Candidatos activos: {candidatos}")
    print(f"• Combinaciones de 3 números: C({candidatos},3) = {combinaciones_totales}")
    print(f"• Costo por combinación: RD$10")
    print(f"• Costo total por sorteo: RD${combinaciones_totales * 10:,}")
    print(f"• Sorteos analizados con ≤6 candidatos: {total_sorteos_6_candidatos}")
    
    print(f"\n💰 PREMIOS POR COMBINACIÓN:")
    print(f"• 3 números: RD${premio_3_numeros:,}")
    print(f"• 2 números: RD${premio_2_numeros:,}")
    print(f"• 1 número: RD${premio_1_numero:,}")
    print(f"• 0 números: RD${premio_0_numeros:,}")
    
    # Calcular ganancias por tipo de resultado
    costo_por_sorteo = combinaciones_totales * 10
    
    print(f"\n📈 ANÁLISIS DE RESULTADOS:")
    print("┌─────────────────┬─────────┬──────────────┬─────────────────┬────────────────┐")
    print("│   Resultado     │ Veces   │ Ganancia     │ Ganancia Total  │ Pérd/Gan Neta  │")
    print("├─────────────────┼─────────┼──────────────┼─────────────────┼────────────────┤")
    
    ganancia_total = 0
    costo_total = total_sorteos_6_candidatos * costo_por_sorteo
    
    for coincidencia, cantidad in coincidencias.items():
        if coincidencia == 3:
            ganancia_individual = premio_3_numeros
            label = "3 coincidencias"
        elif coincidencia == 2:
            ganancia_individual = premio_2_numeros
            label = "2 coincidencias"
        elif coincidencia == 1:
            ganancia_individual = premio_1_numero
            label = "1 coincidencia"
        else:
            ganancia_individual = 0
            label = "0 coincidencias"
        
        ganancia_subtotal = cantidad * ganancia_individual
        perdida_ganancia_neta = ganancia_subtotal - (cantidad * costo_por_sorteo)
        ganancia_total += ganancia_subtotal
        
        print(f"│ {label:<15} │{cantidad:7}  │ RD${ganancia_individual:>10,} │ RD${ganancia_subtotal:>13,} │ RD${perdida_ganancia_neta:>12,} │")
    
    print("├─────────────────┼─────────┼──────────────┼─────────────────┼────────────────┤")
    
    perdida_neta_total = ganancia_total - costo_total
    
    print(f"│ TOTALES         │{total_sorteos_6_candidatos:7}  │      -       │ RD${ganancia_total:>13,} │ RD${perdida_neta_total:>12,} │")
    print("└─────────────────┴─────────┴──────────────┴─────────────────┴────────────────┘")
    
    print(f"\n💸 RESUMEN FINANCIERO DETALLADO:")
    print(f"╔═══════════════════════════════════════════════════════════════╗")
    print(f"║  📊 ANÁLISIS COMPLETO DE {total_sorteos_6_candidatos} SORTEOS CON 6 CANDIDATOS             ║")
    print(f"╠═══════════════════════════════════════════════════════════════╣")
    print(f"║  💰 DINERO GASTADO:                                           ║")
    print(f"║     • Costo por sorteo: RD${costo_por_sorteo:,} (20 combinaciones × RD$10)   ║")
    print(f"║     • Total sorteos jugados: {total_sorteos_6_candidatos} sorteos                         ║")
    print(f"║     • INVERSIÓN TOTAL: RD${costo_total:,}                          ║")
    print(f"║                                                               ║")
    print(f"║  🎁 DINERO GANADO:                                            ║")
    print(f"║     • {coincidencias[3]} triple(s) × RD${premio_3_numeros:,} = RD${coincidencias[3] * premio_3_numeros:,}               ║")
    print(f"║     • {coincidencias[2]} doble(s) × RD${premio_2_numeros:,} = RD${coincidencias[2] * premio_2_numeros:,}                     ║")
    print(f"║     • {coincidencias[1]} simple(s) × RD${premio_1_numero:,} = RD${coincidencias[1] * premio_1_numero:,}                       ║")
    print(f"║     • {coincidencias[0]} perdedor(es) × RD$0 = RD$0                         ║")
    print(f"║     • GANANCIAS TOTALES: RD${ganancia_total:,}                        ║")
    print(f"║                                                               ║")
    print(f"║  📈 RESULTADO FINAL:                                          ║")
    if perdida_neta_total >= 0:
        print(f"║     • Ganancias: RD${ganancia_total:,}                               ║")
        print(f"║     • Gastos: RD${costo_total:,}                                ║")
        print(f"║     • 💚 GANANCIA NETA: RD${perdida_neta_total:,}                      ║")
        print(f"║     • 📊 Rentabilidad: +{perdida_neta_total/costo_total*100:.1f}%                          ║")
    else:
        print(f"║     • Ganancias: RD${ganancia_total:,}                               ║")
        print(f"║     • Gastos: RD${costo_total:,}                                ║")
        print(f"║     • 💔 PÉRDIDA NETA: RD${abs(perdida_neta_total):,}                     ║")
        print(f"║     • 📊 Pérdida: -{abs(perdida_neta_total)/costo_total*100:.1f}%                           ║")
    print(f"╚═══════════════════════════════════════════════════════════════╝")
    
    # Análisis por sorteo promedio
    print(f"\n📊 PROMEDIO POR SORTEO:")
    costo_promedio = costo_total / total_sorteos_6_candidatos
    ganancia_promedio = ganancia_total / total_sorteos_6_candidatos
    resultado_promedio = perdida_neta_total / total_sorteos_6_candidatos
    
    print(f"• Costo promedio por sorteo: RD${costo_promedio:,.0f}")
    print(f"• Ganancia promedio por sorteo: RD${ganancia_promedio:,.0f}")
    print(f"• Resultado neto promedio: RD${resultado_promedio:,.0f}")
    
    # Análisis de break-even
    print(f"\n🎯 ANÁLISIS DE RENTABILIDAD:")
    print(f"• Para ser rentable necesitarías ganar al menos: RD${costo_por_sorteo:,} por sorteo")
    print(f"• Con 1 triple (3 números): RD${premio_3_numeros:,} - ¡GANANCIA MASIVA!")
    print(f"• Con 50 dobles (2 números): RD${50 * premio_2_numeros:,} - Ganancia decente")
    print(f"• Con 200 simples (1 número): RD${200 * premio_1_numero:,} - Break-even")
    
    # Probabilidades teóricas vs reales
    print(f"\n🔢 COMPARACIÓN PROBABILIDADES:")
    prob_teorica_triple = 1 / combinaciones_totales * 100
    prob_real_triple = coincidencias[3] / total_sorteos_6_candidatos * 100
    
    print(f"• Probabilidad teórica de triple: {prob_teorica_triple:.2f}%")
    print(f"• Probabilidad observada de triple: {prob_real_triple:.2f}%")
    print(f"• Factor de mejora: {prob_real_triple/prob_teorica_triple:.1f}x")
    
    print(f"\n🚨 CONCLUSIONES DETALLADAS:")
    if perdida_neta_total < 0:
        print("❌ ESTRATEGIA NO RENTABLE:")
        print(f"   💸 En {total_sorteos_6_candidatos} sorteos gastarías: RD${costo_total:,}")
        print(f"   💰 En {total_sorteos_6_candidatos} sorteos ganarías: RD${ganancia_total:,}")
        print(f"   💔 PÉRDIDA TOTAL: RD${abs(perdida_neta_total):,}")
        print(f"   📉 Pierdes RD${abs(resultado_promedio):,.0f} en promedio por sorteo")
        print(f"   🎲 Solo el {(coincidencias[2] + coincidencias[3])/total_sorteos_6_candidatos*100:.1f}% de las veces ganas algo significativo")
        print(f"   💡 Necesitarías {abs(perdida_neta_total)//premio_3_numeros + 1} triples más para ser rentable")
    else:
        print("✅ ESTRATEGIA RENTABLE:")
        print(f"   💸 En {total_sorteos_6_candidatos} sorteos gastarías: RD${costo_total:,}")
        print(f"   💰 En {total_sorteos_6_candidatos} sorteos ganarías: RD${ganancia_total:,}")
        print(f"   💚 GANANCIA TOTAL: RD${perdida_neta_total:,}")
        print(f"   📈 Ganas RD${resultado_promedio:,.0f} en promedio por sorteo")
        print(f"   🎯 Tasa de éxito significativo: {(coincidencias[2] + coincidencias[3])/total_sorteos_6_candidatos*100:.1f}%")
    
    # Desglose de capital necesario
    print(f"\n💰 CAPITAL REQUERIDO:")
    print(f"   🏦 Capital mínimo por sorteo: RD${costo_por_sorteo:,}")
    print(f"   📅 Para jugar 1 mes (8 sorteos aprox): RD${costo_por_sorteo * 8:,}")
    print(f"   📅 Para jugar 3 meses (24 sorteos aprox): RD${costo_por_sorteo * 24:,}")
    print(f"   📅 Para jugar 6 meses (48 sorteos aprox): RD${costo_por_sorteo * 48:,}")
    print(f"   📅 Para jugar 1 año (96 sorteos aprox): RD${costo_por_sorteo * 96:,}")
    
    # Escenarios de riesgo
    print(f"\n⚠️  ANÁLISIS DE RIESGO:")
    print(f"   🔴 Peor escenario: 10 sorteos sin ganar = -RD${costo_por_sorteo * 10:,}")
    print(f"   🟡 Escenario típico: Ganar 1 simple cada 4 sorteos")
    print(f"   🟢 Mejor escenario: 1 triple cada 59 sorteos = +RD${premio_3_numeros - costo_por_sorteo:,}")
    print(f"   📊 Variabilidad: Los resultados pueden ser muy irregulares")
    
    print(f"\n💡 RECOMENDACIÓN:")
    if perdida_neta_total < 0:
        print("🛑 NO recomendado apostar a todas las combinaciones.")
        print("   Considera apostar solo a los candidatos más prometedores.")
        print("   O esperar escenarios con menos candidatos (3-4 números).")
    else:
        print("✅ Estrategia viable, pero con riesgo alto.")
        print("   Considera el capital necesario y la variabilidad de resultados.")

if __name__ == "__main__":
    calculate_pega3_profits()