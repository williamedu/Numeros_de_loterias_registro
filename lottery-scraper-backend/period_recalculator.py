import json
import os
from datetime import datetime

# Configuración
LOTTERY_NAME = "Pega_3_Mas"  # Cambia este nombre según la lotería que quieras actualizar
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(SCRIPT_DIR, "json_Datos")
JSON_FILE = os.path.join(JSON_DIR, f"lottery_data_{LOTTERY_NAME}.json")

def format_time_period(days):
    """Convertir días a formato legible (años, meses, días)"""
    if days <= 0:
        return "0 días"
    
    years = days // 365
    remaining_days = days % 365
    months = remaining_days // 30
    final_days = remaining_days % 30
    
    parts = []
    
    if years > 0:
        if years == 1:
            parts.append("1 año")
        else:
            parts.append(f"{years} años")
    
    if months > 0:
        if months == 1:
            parts.append("1 mes")
        else:
            parts.append(f"{months} meses")
    
    if final_days > 0:
        if final_days == 1:
            parts.append("1 día")
        else:
            parts.append(f"{final_days} días")
    
    if not parts:  # Si todo es 0, mostrar 0 días
        return "0 días"
    
    if len(parts) == 1:
        return parts[0]
    elif len(parts) == 2:
        return f"{parts[0]} y {parts[1]}"
    else:
        return f"{parts[0]}, {parts[1]} y {parts[2]}"

def calculate_analysis_period(numbers_data):
    """Calcular el período real de análisis basado en los datos históricos"""
    oldest_date = None
    newest_date = None
    
    for num_data in numbers_data.values():
        if num_data.get("history") and len(num_data["history"]) > 0:
            for entry in num_data["history"]:
                try:
                    entry_date = datetime.strptime(entry["date"], "%d-%m-%Y")
                    
                    if oldest_date is None or entry_date < oldest_date:
                        oldest_date = entry_date
                    
                    if newest_date is None or entry_date > newest_date:
                        newest_date = entry_date
                        
                except ValueError:
                    continue  # Saltar fechas con formato inválido
    
    if oldest_date and newest_date:
        analysis_days = (newest_date - oldest_date).days + 1  # +1 para incluir ambos días
        return analysis_days, oldest_date, newest_date
    else:
        # Si no hay datos históricos, usar un valor predeterminado
        return 0, None, None

def recalculate_period():
    """Recalcular y actualizar el período de análisis en el JSON"""
    
    print(f"=== Recalculador de Período de Análisis ===")
    print(f"Lotería: {LOTTERY_NAME}")
    print(f"Archivo: {JSON_FILE}")
    
    # Verificar que el archivo JSON existe
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: No se encontró el archivo JSON '{JSON_FILE}'")
        print("Verifica que el nombre de la lotería sea correcto y que el archivo exista.")
        return
    
    try:
        # Cargar datos existentes
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Archivo JSON cargado correctamente")
        
        # Mostrar período actual
        current_period = data.get("analysisPeriod", "No definido")
        current_formatted = data.get("analysisPeriodFormatted", "No disponible")
        print(f"📊 Período actual: {current_formatted} ({current_period} días)")
        
        # Recalcular período
        numbers_data = data.get("numbers", {})
        if not numbers_data:
            print("❌ Error: No se encontraron datos de números en el JSON")
            return
        
        analysis_days, oldest_date, newest_date = calculate_analysis_period(numbers_data)
        analysis_period_formatted = format_time_period(analysis_days)
        
        print(f"\n🔄 RECALCULANDO...")
        print(f"📅 Período recalculado: {analysis_days} días ({analysis_period_formatted})")
        
        if oldest_date and newest_date:
            print(f"📅 Rango de fechas: {oldest_date.strftime('%d-%m-%Y')} hasta {newest_date.strftime('%d-%m-%Y')}")
        
        # Actualizar los campos en el JSON
        data["analysisPeriod"] = analysis_days
        data["analysisPeriodFormatted"] = analysis_period_formatted
        
        if oldest_date and newest_date:
            data["analysisDateRange"] = {
                "startDate": oldest_date.strftime("%d-%m-%Y"),
                "endDate": newest_date.strftime("%d-%m-%Y")
            }
        
        # Actualizar la fecha de última actualización
        data["lastUpdated"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        
        # Guardar archivo actualizado
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ PERÍODO ACTUALIZADO CON ÉXITO")
        print(f"📊 Nuevo período: {analysis_period_formatted}")
        print(f"💾 Archivo guardado: {JSON_FILE}")
        print(f"🔄 Última actualización: {data['lastUpdated']}")
        
        # Mostrar comparación
        if current_period != "No definido" and current_period != analysis_days:
            print(f"\n📈 CAMBIO DETECTADO:")
            print(f"   Antes: {current_formatted}")
            print(f"   Ahora: {analysis_period_formatted}")
        elif current_period == analysis_days:
            print(f"\n✅ El período ya estaba correcto, pero ahora tienes el formato legible.")
        
    except json.JSONDecodeError:
        print(f"❌ Error: El archivo JSON está dañado o no es válido")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def main():
    """Función principal"""
    print("🚀 Iniciando recálculo de período de análisis...\n")
    recalculate_period()
    print("\n🎯 Proceso completado.")
    print("\n💡 Ahora puedes refrescar tu página web para ver el nuevo formato.")

if __name__ == "__main__":
    main()
