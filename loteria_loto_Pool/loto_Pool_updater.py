from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime, timedelta
from collections import defaultdict
import json
import os
import time
import random
import sys

# Configuración de la lotería
LOTTERY_NAME = "loto_Pool"  # Nombre para el archivo (sin espacios ni caracteres especiales)
LOTTERY_URL_PARAM = "leidsa/loto-pool"  # Parámetro para la URL en loteriasdominicanas.com
LOTTERY_DISPLAY_NAME = "Loto Pool"  # Nombre para mostrar en la salida (puede tener espacios)
NUMBER_OF_POSITIONS = 5  # Número de posiciones (ej: 3 para Gana Más)

# Configuración del scraping
TOTAL_ITERATIONS = 10  # Número de iteraciones (páginas a visitar)
DAYS_TO_GO_BACK = 8  # Días a retroceder entre cada iteración
WAIT_TIMEOUT = 15  # Tiempo máximo de espera para elementos (segundos)
PAUSE_AFTER_PAGE_LOAD = 2  # Segundos de pausa después de cargar cada página
MIN_NUMBER = 1  # Número mínimo (algunas loterías comienzan desde 1 en lugar de 0)
MAX_NUMBER = 31  # Número máximo

# Definir la ruta absoluta a la carpeta del proyecto
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)  # Carpeta padre
JSON_DIR = os.path.join(PARENT_DIR, "json_Datos")
JSON_FILE = os.path.join(JSON_DIR, f"lottery_data_{LOTTERY_NAME}.json")

# Y agregar esta verificación para crear la carpeta si no existe:
if not os.path.exists(JSON_DIR):
    try:
        os.makedirs(JSON_DIR)
        print(f"Carpeta {JSON_DIR} creada correctamente")
    except Exception as e:
        print(f"Error al crear carpeta {JSON_DIR}: {e}")

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

def calculate_analysis_period(numbers_data, today):
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

def configure_webdriver():
    """Configurar y devolver una instancia de WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")  # Desactivar imágenes
    chrome_options.add_argument("--headless")  # Ejecutar en modo headless

    # Añadir user-agent para evitar ser detectado como bot
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")

    # Opciones adicionales para mejorar la estabilidad
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-browser-side-navigation")
    chrome_options.add_argument("--dns-prefetch-disable")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver, WebDriverWait(driver, WAIT_TIMEOUT)

def load_existing_data():
    """Cargar datos existentes del archivo JSON"""
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo JSON '{JSON_FILE}'")
        print("Debe existir un archivo JSON con datos previos para poder actualizarlo.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: El archivo JSON '{JSON_FILE}' está dañado o no es válido.")
        sys.exit(1)

def get_date_from_string(date_str):
    """Convertir string de fecha a objeto datetime"""
    try:
        return datetime.strptime(date_str.split(" ")[0], "%d-%m-%Y")
    except:
        print(f"Error al convertir fecha: {date_str}")
        return None

def calculate_days_to_update(existing_data):
    """Calcular cuántos días necesitamos actualizar"""
    today = datetime.now()
    
    # Obtener la fecha de última actualización
    last_updated_str = existing_data.get("lastUpdated", "")
    last_updated_date = get_date_from_string(last_updated_str)
    
    # Obtener la fecha del último sorteo registrado
    latest_winning_date = None
    if existing_data.get("winningNumbers") and len(existing_data["winningNumbers"]) > 0:
        latest_winning_date_str = existing_data["winningNumbers"][0].get("date", "")
        latest_winning_date = get_date_from_string(latest_winning_date_str)
    
    if not latest_winning_date:
        print("Advertencia: No se encontró una fecha válida del último sorteo en el JSON.")
        print("Se asumirá que necesitamos 14 días de actualización.")
        days_to_update = 14
    else:
        days_to_update = (today - latest_winning_date).days
    
    print(f"Fecha actual: {today.strftime('%d-%m-%Y')}")
    if latest_winning_date:
        print(f"Fecha del último sorteo registrado: {latest_winning_date.strftime('%d-%m-%Y')}")
    print(f"Días a actualizar: {days_to_update}")
    
    return days_to_update, today

def update_lottery_data(existing_data, days_to_update, today):
    """Actualizar los datos de la lotería mediante web scraping"""
    driver, wait = configure_webdriver()
    
    try:
        # Preparar estructuras de datos
        numbers_data = existing_data["numbers"]
        
        # Estructura para seguimiento de repeticiones en los últimos 30 días
        last_30_days_occurrences = defaultdict(list)
        thirty_days_ago = today - timedelta(days=30)
        
        # Inicializar desde repeticiones existentes
        if "repeatedInLast30Days" in existing_data:
            for num, data in existing_data["repeatedInLast30Days"].items():
                for date_str in data.get("dates", []):
                    date_obj = get_date_from_string(date_str)
                    if date_obj and date_obj >= thirty_days_ago:
                        last_30_days_occurrences[num].append(date_str)
        
        # Variable para almacenar los números ganadores más recientes
        latest_winning_numbers = []
        latest_winning_date = None
        
        # Calcular número necesario de iteraciones (una iteración ~= 8 días)
        required_iterations = min((days_to_update // DAYS_TO_GO_BACK) + 2, MAX_ITERATIONS)
        
        print(f"Iniciando actualización de {LOTTERY_DISPLAY_NAME} con {required_iterations} iteraciones...")
        
        # Fecha inicial (hoy)
        current_date = today
        total_numbers_found = 0
        
        # Ciclo principal de iteraciones
        for iteration in range(1, required_iterations + 1):
            # Formatear fecha para URL
            url_date = current_date.strftime("%d-%m-%Y")
            url_year = current_date.year
            
            url = f"https://loteriasdominicanas.com/{LOTTERY_URL_PARAM}?date={url_date}"
            
            print(f"\nIteración {iteration}/{required_iterations} - Cargando fecha: {url_date}")
            
            # Intentar cargar la página con reintentos
            max_attempts = 3
            for attempt in range(1, max_attempts + 1):
                try:
                    driver.get(url)
                    # Pausa después de cargar la página
                    time.sleep(PAUSE_AFTER_PAGE_LOAD)
                    # Esperar a que aparezcan fechas o bloques
                    element_present = EC.presence_of_element_located((By.CSS_SELECTOR, ".session-date.px-2, .game-scores.p-2.ball-mode"))
                    wait.until(element_present)
                    break
                except Exception as e:
                    if attempt < max_attempts:
                        wait_time = random.uniform(2, 5)
                        print(f"Error al cargar la página (intento {attempt}/{max_attempts}): {str(e)}")
                        print(f"Reintentando en {wait_time:.1f} segundos...")
                        time.sleep(wait_time)
                    else:
                        print(f"Error al cargar la página después de {max_attempts} intentos: {str(e)}")
                        raise
            
            # Encontrar todas las fechas
            date_elements = driver.find_elements(By.CSS_SELECTOR, ".session-date.px-2")
            date_texts = [elem.text.strip() for elem in date_elements]
            print(f"Encontradas {len(date_texts)} fechas sin año: {date_texts}")
            
            # Encontrar todos los bloques de juego
            game_blocks = driver.find_elements(By.CSS_SELECTOR, ".game-scores.p-2.ball-mode")
            print(f"Encontrados {len(game_blocks)} bloques de juego")
            
            # Si no hay suficientes elementos, continuar
            if len(date_elements) == 0 or len(game_blocks) == 0:
                print("No se encontraron suficientes elementos en esta página.")
                current_date = current_date - timedelta(days=DAYS_TO_GO_BACK)
                continue
            
            # Calcular las fechas completas con el año correcto
            complete_dates = []
            for date_text in date_texts:
                if len(date_text.split('-')) == 3:
                    # Ya tiene año
                    complete_dates.append(date_text)
                else:
                    # Extraer día y mes
                    day, month = map(int, date_text.split('-'))
                    
                    # Lógica para determinar el año correcto
                    if current_date.month == 1 and month == 12:
                        correct_year = url_year - 1
                    elif current_date.month == 12 and month == 1:
                        correct_year = url_year + 1
                    else:
                        correct_year = url_year
                    
                    complete_date = f"{date_text}-{correct_year}"
                    complete_dates.append(complete_date)
            
            print(f"Fechas con año corregido: {complete_dates}")
            
            # Procesar los bloques de juego
            min_length = min(len(date_elements), len(game_blocks))
            blocks_processed = 0
            
            for i in range(min_length):
                try:
                    # Obtener la fecha completa con año
                    complete_date = complete_dates[i]
                    
                    # Convertir a objeto datetime para comparar
                    block_date = datetime.strptime(complete_date, "%d-%m-%Y")
                    
                    # Obtener los números del bloque
                    block = game_blocks[i]
                    score_spans = block.find_elements(By.CSS_SELECTOR, "span.score")
                    
                    if len(score_spans) >= NUMBER_OF_POSITIONS:
                        # Extraer los números para cada posición
                        drawn_numbers = []
                        for j in range(NUMBER_OF_POSITIONS):
                            drawn_numbers.append(score_spans[j].text.strip())
                        
                        # Mostrar información del bloque
                        numbers_str = ", ".join(drawn_numbers)
                        print(f"  Bloque #{i+1} - Fecha: {complete_date} - Números: {numbers_str}")
                        blocks_processed += 1
                        
                        # Verificar que los números son válidos
                        valid_numbers = True
                        for num in drawn_numbers:
                            if not (num.isdigit() and len(num) <= 2):
                                print(f"    Número inválido: '{num}'")
                                valid_numbers = False
                        
                        if valid_numbers:
                            # Asegurarse de que los números tienen 2 dígitos
                            drawn_numbers = [num.zfill(2) for num in drawn_numbers]
                            
                            # Comprobar si estos resultados ya están en nuestros datos existentes
                            # Si tenemos esta fecha exacta en el historial de números ganadores, podemos saltarla
                            existing_date = False
                            if "winningNumbers" in existing_data:
                                for win_data in existing_data["winningNumbers"]:
                                    if win_data.get("date") == complete_date:
                                        existing_date = True
                                        break
                            
                            if existing_date:
                                print(f"    La fecha {complete_date} ya existe en los datos, saltando...")
                                continue
                            
                            # Guardar los números ganadores más recientes
                            if latest_winning_date is None or block_date > latest_winning_date:
                                latest_winning_numbers = drawn_numbers
                                latest_winning_date = block_date
                                print(f"Números ganadores más recientes actualizados: {numbers_str} ({complete_date})")
                            
                            # Calcular días desde hoy
                            days_diff = (today - block_date).days
                            
                            # Actualizar datos para cada número
                            position_names = ["first", "second", "third", "fourth", "fifth", "sixth"]
                            
                            for pos, num in enumerate(drawn_numbers, 1):
                                if num in numbers_data:
                                    # Si no hemos visto este número antes o esta fecha es más reciente
                                    if numbers_data[num]["lastSeen"] is None:
                                        # Primera vez que vemos este número
                                        numbers_data[num]["lastSeen"] = complete_date
                                        numbers_data[num]["daysSinceSeen"] = days_diff
                                    else:
                                        # Ya habíamos visto este número, comparar fechas
                                        last_seen_date = datetime.strptime(numbers_data[num]["lastSeen"], "%d-%m-%Y")
                                        if block_date > last_seen_date:
                                            # Esta aparición es más reciente
                                            numbers_data[num]["lastSeen"] = complete_date
                                            numbers_data[num]["daysSinceSeen"] = days_diff
                                    
                                    # Actualizar contador de posiciones
                                    pos_index = pos - 1
                                    if pos_index < len(position_names):
                                        position_key = position_names[pos_index]
                                    else:
                                        position_key = f"position_{pos}"
                                    
                                    numbers_data[num]["positions"][position_key] += 1
                                    
                                    # Añadir al historial de apariciones si no existe ya
                                    history_entry = {
                                        "date": complete_date,
                                        "position": pos,
                                        "daysAgo": days_diff
                                    }
                                    
                                    # Comprobar si esta entrada ya existe en el historial
                                    entry_exists = False
                                    for entry in numbers_data[num]["history"]:
                                        if entry.get("date") == complete_date and entry.get("position") == pos:
                                            entry_exists = True
                                            break
                                    
                                    if not entry_exists:
                                        numbers_data[num]["history"].append(history_entry)
                                        total_numbers_found += 1
                                    
                                    # Registrar ocurrencia para conteo de últimos 30 días
                                    if block_date >= thirty_days_ago:
                                        # Convertir datetime a string
                                        date_str = block_date.strftime("%d-%m-%Y")
                                        if date_str not in last_30_days_occurrences[num]:
                                            last_30_days_occurrences[num].append(date_str)
                    
                except Exception as e:
                    print(f"  Error procesando bloque #{i+1}: {str(e)}")
            
            print(f"Procesados {blocks_processed} bloques en esta iteración")
            
            # Verificar si ya hemos actualizado suficientes días
            if latest_winning_date and (today - latest_winning_date).days <= 1:
                print("Ya estamos al día con los resultados más recientes, deteniendo actualización.")
                break
            
            # Retroceder días para la próxima iteración
            current_date = current_date - timedelta(days=DAYS_TO_GO_BACK)
        
        # Actualizar los días sin salir para todos los números
        for num in numbers_data:
            if numbers_data[num]["lastSeen"]:
                last_seen_date = datetime.strptime(numbers_data[num]["lastSeen"], "%d-%m-%Y")
                numbers_data[num]["daysSinceSeen"] = (today - last_seen_date).days
        
        # RECALCULAR EL PERÍODO DE ANÁLISIS basado en los datos actualizados
        analysis_days, oldest_date, newest_date = calculate_analysis_period(numbers_data, today)
        analysis_period_formatted = format_time_period(analysis_days)
        
        print(f"\n--- PERÍODO DE ANÁLISIS RECALCULADO ---")
        print(f"Período total: {analysis_days} días ({analysis_period_formatted})")
        if oldest_date and newest_date:
            print(f"Desde: {oldest_date.strftime('%d-%m-%Y')} hasta: {newest_date.strftime('%d-%m-%Y')}")
        
        # Crear estructura para repeticiones en los últimos 30 días
        repeated_numbers = {}
        for num, dates in last_30_days_occurrences.items():
            if len(dates) >= 2:  # Solo números que aparecieron 2 o más veces
                repeated_numbers[num] = {
                    "occurrences": len(dates),
                    "dates": dates
                }
        
        # Actualizar estructura de datos
        existing_data["numbers"] = numbers_data
        existing_data["lastUpdated"] = today.strftime("%d-%m-%Y %H:%M:%S")
        existing_data["totalProcessed"] += total_numbers_found
        existing_data["repeatedInLast30Days"] = repeated_numbers
        
        # ACTUALIZAR EL PERÍODO DE ANÁLISIS en el JSON
        existing_data["analysisPeriod"] = analysis_days
        existing_data["analysisPeriodFormatted"] = analysis_period_formatted
        if oldest_date and newest_date:
            existing_data["analysisDateRange"] = {
                "startDate": oldest_date.strftime("%d-%m-%Y"),
                "endDate": newest_date.strftime("%d-%m-%Y")
            }
        
        # Calcular y actualizar números fríos y calientes
        numbers_with_values = [(num, data["daysSinceSeen"]) 
                                for num, data in numbers_data.items() 
                                if data["daysSinceSeen"] is not None]
        
        if numbers_with_values:
            # Ordenar por días sin salir (de más a menos)
            cold_numbers = sorted(numbers_with_values, key=lambda x: x[1], reverse=True)
            # Ordenar por días sin salir (de menos a más)
            hot_numbers = sorted(numbers_with_values, key=lambda x: x[1])
            
            # Actualizar los 10 números más fríos
            existing_data["coldestNumbers"] = []
            for num, days in cold_numbers[:10]:
                existing_data["coldestNumbers"].append({
                    "number": num,
                    "daysSinceSeen": days,
                    "lastSeen": numbers_data[num]["lastSeen"]
                })
            
            # Actualizar los 10 números más calientes
            existing_data["hottestNumbers"] = []
            for num, days in hot_numbers[:10]:
                existing_data["hottestNumbers"].append({
                    "number": num,
                    "daysSinceSeen": days,
                    "lastSeen": numbers_data[num]["lastSeen"]
                })
        
        # Actualizar los números ganadores más recientes
        if latest_winning_numbers and latest_winning_date:
            winning_date_str = latest_winning_date.strftime("%d-%m-%Y")
            existing_data["winningNumbers"] = []
            for idx, num in enumerate(latest_winning_numbers):
                existing_data["winningNumbers"].append({
                    "number": num,
                    "position": idx + 1,
                    "date": winning_date_str
                })
            print(f"Números ganadores actualizados en el JSON: {latest_winning_numbers} ({winning_date_str})")
        
        return existing_data, total_numbers_found
        
    finally:
        # Cerrar el navegador
        driver.quit()
        print("Navegador cerrado.")

def main():
    print(f"=== Actualizador de datos para {LOTTERY_DISPLAY_NAME} ===")
    
    # Verificar que el archivo JSON existe
    if not os.path.exists(JSON_FILE):
        print(f"Error: No se encontró el archivo JSON '{JSON_FILE}'")
        print("Debe existir un archivo JSON con datos previos para poder actualizarlo.")
        return
    
    # Cargar datos existentes
    existing_data = load_existing_data()
    print(f"Datos cargados del archivo: '{JSON_FILE}'")
    
    # Mostrar período actual antes de la actualización
    current_period = existing_data.get("analysisPeriod", 0)
    current_formatted = existing_data.get("analysisPeriodFormatted", "No disponible")
    print(f"Período de análisis actual: {current_formatted}")
    
    # Calcular días a actualizar
    days_to_update, today = calculate_days_to_update(existing_data)
    
    if days_to_update <= 0:
        print("Los datos ya están actualizados. No se requiere actualización.")
        return
    
    # Actualizar datos
    try:
        updated_data, new_numbers = update_lottery_data(existing_data, days_to_update, today)
        
        # Guardar datos actualizados
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nSe agregaron {new_numbers} nuevos resultados de números.")
        print(f"Período de análisis actualizado: {updated_data.get('analysisPeriodFormatted', 'No disponible')}")
        print(f"Datos actualizados guardados en '{JSON_FILE}'")
        print(f"¡Actualización de {LOTTERY_DISPLAY_NAME} completada con éxito!")
        
    except Exception as e:
        print(f"Error durante la actualización: {e}")
        print("La actualización no se completó correctamente.")

if __name__ == "__main__":
    main()