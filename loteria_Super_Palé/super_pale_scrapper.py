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

# Configuración de la lotería
LOTTERY_NAME = "super_pale"  # Nombre para el archivo (sin espacios ni caracteres especiales)
LOTTERY_URL_PARAM = "/loterias/leidsa/super-pale"  # Parámetro para la URL en loteriasdominicanas.com
LOTTERY_DISPLAY_NAME = "Super Palé"  # Nombre para mostrar en la salida (puede tener espacios)
NUMBER_OF_POSITIONS = 2  # Número de posiciones (ej: 3 para Gana Más)

# Configuración del scraping
TOTAL_ITERATIONS = 200  # Número de iteraciones (páginas a visitar)
DAYS_TO_GO_BACK = 8  # Días a retroceder entre cada iteración
WAIT_TIMEOUT = 15  # Tiempo máximo de espera para elementos (segundos)
PAUSE_AFTER_PAGE_LOAD = 2  # Segundos de pausa después de cargar cada página
MIN_NUMBER = 0  # Número mínimo (algunas loterías comienzan desde 1 en lugar de 0)
MAX_NUMBER = 99  # Número máximo

# Definir la ruta absoluta a la carpeta del proyecto
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)  # Carpeta padre
JSON_DIR = os.path.join(PARENT_DIR, "json_Datos")
JSON_FILE = os.path.join(JSON_DIR, f"lottery_data_{LOTTERY_NAME}.json")
OUTPUT_FILE = JSON_FILE

if not os.path.exists(JSON_DIR):
    try:
        os.makedirs(JSON_DIR)
        print(f"Carpeta {JSON_DIR} creada correctamente")
    except Exception as e:
        print(f"Error al crear carpeta {JSON_DIR}: {e}")

# Configurar opciones para Chrome
chrome_options = Options()
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-extensions")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--blink-settings=imagesEnabled=false")  # Desactivar imágenes
chrome_options.add_argument("--headless")  # Ejecutar en modo headless (sin interfaz gráfica)

# Añadir user-agent para evitar ser detectado como bot
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")

# Opciones adicionales para mejorar la estabilidad
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_argument("--disable-infobars")
chrome_options.add_argument("--disable-browser-side-navigation")
chrome_options.add_argument("--dns-prefetch-disable")

# Inicializar el driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
wait = WebDriverWait(driver, WAIT_TIMEOUT)

# Inicializar estructura de datos para los números
numbers_data = {}
for i in range(MIN_NUMBER, MAX_NUMBER + 1):  # El +1 asegura que incluya el 99
    num_str = str(i).zfill(2)
    
    # Crear estructura de posiciones dinámicamente según NUMBER_OF_POSITIONS
    positions = {}
    position_names = ["first", "second", "third", "fourth", "fifth", "sixth"]  # Nombres de posiciones
    for p in range(NUMBER_OF_POSITIONS):
        if p < len(position_names):
            positions[position_names[p]] = 0
        else:
            positions[f"position_{p+1}"] = 0
    
    numbers_data[num_str] = {
        "number": num_str,
        "lastSeen": None,
        "daysSinceSeen": None,
        "positions": positions,
        "history": []  # Añadido array para historial de apariciones
    }

# Estructura de datos para seguimiento de repeticiones en los últimos 30 días
last_30_days_occurrences = defaultdict(list)  # Número -> lista de fechas de aparición

# Variable para almacenar los números ganadores más recientes
latest_winning_numbers = []
latest_winning_date = None

try:
    # Fecha inicial (hoy)
    current_date = datetime.now()
    today = datetime.now()  # Guardamos la fecha actual para calcular días transcurridos
    thirty_days_ago = today - timedelta(days=30)  # Fecha límite para contar repeticiones
    
    # Seguimiento de números encontrados
    total_numbers_found = 0
    
    print(f"Iniciando análisis de {LOTTERY_DISPLAY_NAME} con {TOTAL_ITERATIONS} iteraciones...")
    print(f"Fecha actual: {today.strftime('%d-%m-%Y')}")
    print(f"Contando repeticiones desde: {thirty_days_ago.strftime('%d-%m-%Y')}")
    
    # Ciclo principal de iteraciones
    for iteration in range(1, TOTAL_ITERATIONS + 1):
        # Formatear fecha para URL
        url_date = current_date.strftime("%d-%m-%Y")
        url_year = current_date.year  # Año de la URL actual
        
        url = f"https://www.conectate.com.do{LOTTERY_URL_PARAM}?date={url_date}"
        
        print(f"\nIteración {iteration}/{TOTAL_ITERATIONS} - Cargando fecha: {url_date}")
        
        # Intentar cargar la página con reintentos
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                driver.get(url)
                
                # Pausa después de cargar la página para asegurar que todo cargue correctamente
                print(f"Esperando {PAUSE_AFTER_PAGE_LOAD} segundos después de cargar la página...")
                time.sleep(PAUSE_AFTER_PAGE_LOAD)
                
                # *** CAMBIO PRINCIPAL: NUEVOS SELECTORES ***
                # Esperar a que aparezcan fechas o bloques - usando los nuevos selectores CSS
                element_present = EC.presence_of_element_located((By.CSS_SELECTOR, ".session-date.session-badge, .game-scores.ball-mode"))
                wait.until(element_present)
                break  # Si llegamos aquí, la página cargó correctamente
            except Exception as e:
                if attempt < max_attempts:
                    wait_time = random.uniform(2, 5)
                    print(f"Error al cargar la página (intento {attempt}/{max_attempts}): {str(e)}")
                    print(f"Reintentando en {wait_time:.1f} segundos...")
                    time.sleep(wait_time)
                else:
                    print(f"Error al cargar la página después de {max_attempts} intentos: {str(e)}")
                    raise  # Re-lanzar la excepción después de agotar los intentos
        
        # Mostrar lo que estamos haciendo
        print("Buscando fechas y bloques de números...")
        
        # *** CAMBIO PRINCIPAL: NUEVOS SELECTORES CSS ***
        # Encontrar todas las fechas con el nuevo selector
        date_elements = driver.find_elements(By.CSS_SELECTOR, ".session-date.session-badge")
        date_texts = [elem.text.strip() for elem in date_elements]
        print(f"Encontradas {len(date_texts)} fechas sin año: {date_texts}")
        
        # Encontrar todos los bloques de juego con el nuevo selector
        game_blocks = driver.find_elements(By.CSS_SELECTOR, ".game-scores.ball-mode")
        print(f"Encontrados {len(game_blocks)} bloques de juego")
        
        # Si no hay suficientes elementos, continuar
        if len(date_elements) == 0 or len(game_blocks) == 0:
            print("No se encontraron suficientes elementos en esta página.")
            current_date = current_date - timedelta(days=DAYS_TO_GO_BACK)
            continue
        
        # Ahora vamos a procesar los bloques de juego
        min_length = min(len(date_elements), len(game_blocks))
        
        blocks_processed = 0
        print("\nProcesando bloques de juego:")
        
        # Calcular las fechas completas con el año correcto
        complete_dates = []
        for date_text in date_texts:
            if len(date_text.split('-')) == 3:
                # Ya tiene año
                complete_dates.append(date_text)
            else:
                # Extraer día y mes
                day, month = map(int, date_text.split('-'))
                
                # Si la fecha de la URL es enero y encontramos fechas de diciembre,
                # estas fechas deben ser del año anterior
                if current_date.month == 1 and month == 12:
                    correct_year = url_year - 1
                else:
                    # Si la fecha de la URL es diciembre y encontramos fechas de enero,
                    # estas fechas deben ser del año siguiente
                    if current_date.month == 12 and month == 1:
                        correct_year = url_year + 1
                    else:
                        # En otros casos, usar el mismo año que la URL
                        correct_year = url_year
                
                complete_date = f"{date_text}-{correct_year}"
                complete_dates.append(complete_date)
        
        print(f"Fechas con año corregido: {complete_dates}")
        
        for i in range(min_length):
            try:
                # Obtener la fecha completa con año
                complete_date = complete_dates[i]
                
                # Obtener los números del bloque
                block = game_blocks[i]
                # *** CAMBIO: MANTENER EL SELECTOR ORIGINAL PARA NÚMEROS ***
                score_spans = block.find_elements(By.CSS_SELECTOR, "span.score")
                
                if len(score_spans) >= NUMBER_OF_POSITIONS:
                    # Extraer los números para cada posición
                    drawn_numbers = []
                    for j in range(NUMBER_OF_POSITIONS):
                        drawn_numbers.append(score_spans[j].text.strip())
                    
                    # Crear string para mostrar los números
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
                        
                        try:
                            # Convertir la fecha a objeto datetime
                            block_date = datetime.strptime(complete_date, "%d-%m-%Y")
                            
                            # Guardar los números ganadores del primer bloque de la primera iteración
                            # (solo si no los hemos guardado antes o si esta fecha es más reciente)
                            if iteration == 1 and i == 0:
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
                                    
                                    # Añadir al historial de apariciones
                                    numbers_data[num]["history"].append({
                                        "date": complete_date,
                                        "position": pos,
                                        "daysAgo": days_diff
                                    })
                                    
                                    total_numbers_found += 1
                                    
                                    # Registrar ocurrencia para conteo de últimos 30 días
                                    if block_date >= thirty_days_ago:
                                        # Convertir datetime a string para poder serializarlo a JSON
                                        date_str = block_date.strftime("%d-%m-%Y")
                                        if date_str not in last_30_days_occurrences[num]:
                                            last_30_days_occurrences[num].append(date_str)
                                    
                        except Exception as e:
                            print(f"    Error procesando la fecha '{complete_date}': {str(e)}")
            except Exception as e:
                print(f"  Error procesando bloque #{i+1}: {str(e)}")
        
        print(f"Procesados {blocks_processed} bloques en esta iteración")
        
        # Retroceder días para la próxima iteración
        current_date = current_date - timedelta(days=DAYS_TO_GO_BACK)
    
    # Calcular estadísticas finales
    numbers_with_data = 0
    for num in numbers_data:
        if numbers_data[num]["lastSeen"] is not None:
            numbers_with_data += 1
    
    print("\n--- RESULTADOS FINALES ---")
    print(f"Total de números encontrados: {total_numbers_found}")
    print(f"Números con al menos una aparición: {numbers_with_data} de 100")
    
    # Añadir información de repeticiones a la estructura de datos
    repeated_numbers = {}
    for num, dates in last_30_days_occurrences.items():
        if len(dates) >= 2:  # Solo números que aparecieron 2 o más veces
            repeated_numbers[num] = {
                "occurrences": len(dates),
                "dates": dates
            }    
    # Crear estructura de datos final para guardar en JSON
    output_data = {
        "lotteryName": LOTTERY_DISPLAY_NAME,
        "lastUpdated": today.strftime("%d-%m-%Y %H:%M:%S"),
        "totalProcessed": total_numbers_found,
        "numbersWithData": numbers_with_data,
        "analysisPeriod": TOTAL_ITERATIONS * DAYS_TO_GO_BACK,  # Añadimos el período de análisis en días
        "totalIterations": TOTAL_ITERATIONS,                  # Número de iteraciones
        "daysPerIteration": DAYS_TO_GO_BACK,                  # Días por iteración
        "positionsCount": NUMBER_OF_POSITIONS,                # Número de posiciones
        "numbers": numbers_data,
        "repeatedInLast30Days": repeated_numbers,
        "coldestNumbers": [],  # Lo llenaremos a continuación
        "hottestNumbers": [],
        "winningNumbers": []   # Lo llenaremos a continuación
    }    
    # Calcular y añadir números fríos y calientes
    numbers_with_values = [(num, data["daysSinceSeen"]) 
                          for num, data in numbers_data.items() 
                          if data["daysSinceSeen"] is not None]
    
    if numbers_with_values:
        # Ordenar por días sin salir (de más a menos)
        cold_numbers = sorted(numbers_with_values, key=lambda x: x[1], reverse=True)
        # Ordenar por días sin salir (de menos a más)
        hot_numbers = sorted(numbers_with_values, key=lambda x: x[1])
        
        # Añadir los 10 números más fríos
        for num, days in cold_numbers[:10]:
            output_data["coldestNumbers"].append({
                "number": num,
                "daysSinceSeen": days,
                "lastSeen": numbers_data[num]["lastSeen"]
            })
        
        # Añadir los 10 números más calientes
        for num, days in hot_numbers[:10]:
            output_data["hottestNumbers"].append({
                "number": num,
                "daysSinceSeen": days,
                "lastSeen": numbers_data[num]["lastSeen"]
            })
    
    # Añadir los números ganadores más recientes
    if latest_winning_numbers and latest_winning_date:
        winning_date_str = latest_winning_date.strftime("%d-%m-%Y")
        for idx, num in enumerate(latest_winning_numbers):
            output_data["winningNumbers"].append({
                "number": num,
                "position": idx + 1,
                "date": winning_date_str
            })
        print(f"Números ganadores añadidos al JSON: {latest_winning_numbers} ({winning_date_str})")
    
    # Guardar datos en archivo JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nDatos guardados en '{OUTPUT_FILE}'")
    print(f"¡Análisis de {LOTTERY_DISPLAY_NAME} completado con éxito!")

except Exception as e:
    print(f"Error general: {e}")

finally:
    # Cerrar el navegador inmediatamente
    driver.quit()
    print("Navegador cerrado.")