import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

def login_leidsa_undetected():
    """
    Usa undetected-chromedriver para evadir la detección de Turnstile
    """
    print("🚀 Iniciando Chrome con undetected-chromedriver...")
    
    # Configurar opciones de Chrome
    options = uc.ChromeOptions()
    
    # Usar el perfil existente de Chrome (opcional)
    # options.add_argument(r'--user-data-dir=C:\Users\willi\AppData\Local\Google\Chrome\User Data')
    # options.add_argument('--profile-directory=Default')
    
    # Configuraciones para parecer más humano
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    
    # Ventana en tamaño normal (no maximizada para parecer más natural)
    options.add_argument('--window-size=1366,768')
    
    try:
        # Inicializar el driver
        driver = uc.Chrome(options=options, version_main=None)
        
        # Configurar timeouts
        driver.implicitly_wait(10)
        wait = WebDriverWait(driver, 20)
        
        # Navegar a la página
        print("📍 Navegando a www.leidsa.com...")
        driver.get("https://www.leidsa.com/")
        
        # Esperar un momento aleatorio (comportamiento humano)
        time.sleep(random.uniform(3, 5))
        
        # Mover el mouse aleatoriamente (comportamiento humano)
        print("🖱️ Simulando comportamiento humano...")
        driver.execute_script("""
            function moveMouseRandomly() {
                const event = new MouseEvent('mousemove', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight
                });
                document.dispatchEvent(event);
            }
            
            // Mover el mouse varias veces
            for(let i = 0; i < 5; i++) {
                setTimeout(moveMouseRandomly, i * 500);
            }
        """)
        
        time.sleep(2)
        
        # Verificar si Turnstile está presente
        print("🔍 Verificando presencia de Turnstile...")
        turnstile_present = driver.execute_script("return typeof window.turnstile !== 'undefined'")
        if turnstile_present:
            print("⚠️ Turnstile detectado, esperando procesamiento...")
            time.sleep(5)
        
        # Buscar el campo de email
        print("📝 Buscando campo de email...")
        email_field = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        
        # Hacer click en el campo (comportamiento humano)
        driver.execute_script("arguments[0].click();", email_field)
        time.sleep(random.uniform(0.5, 1))
        
        # Escribir el email letra por letra
        print("✍️ Escribiendo email...")
        email = "williamhiciano26@gmail.com"
        for char in email:
            email_field.send_keys(char)
            time.sleep(random.uniform(0.05, 0.15))
        
        # Pequeña pausa
        time.sleep(random.uniform(1, 2))
        
        # Buscar el campo de contraseña
        print("📝 Buscando campo de contraseña...")
        password_field = driver.find_element(By.NAME, "password")
        
        # Hacer click en el campo
        driver.execute_script("arguments[0].click();", password_field)
        time.sleep(random.uniform(0.5, 1))
        
        # Escribir la contraseña
        print("✍️ Escribiendo contraseña...")
        password = "eldiablaso06"
        for char in password:
            password_field.send_keys(char)
            time.sleep(random.uniform(0.05, 0.15))
        
        # Pausa antes de hacer click
        time.sleep(random.uniform(2, 3))
        
        # Buscar el botón de submit
        print("🔍 Buscando botón de submit...")
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        # Mover el cursor al botón antes de hacer click
        driver.execute_script("""
            arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});
        """, submit_button)
        time.sleep(1)
        
        print("🖱️ Haciendo click en submit...")
        driver.execute_script("arguments[0].click();", submit_button)
        
        # Esperar respuesta
        print("⏳ Esperando respuesta del servidor...")
        print("💡 Si se queda cargando, el sitio puede estar verificando...")
        
        # Esperar hasta 30 segundos para ver qué pasa
        time.sleep(30)
        
        # Tomar screenshot
        driver.save_screenshot("resultado_undetected.png")
        print("📸 Screenshot guardado como 'resultado_undetected.png'")
        
        # Verificar si llegamos a alguna página después del login
        current_url = driver.current_url
        print(f"📍 URL actual: {current_url}")
        
        # Mantener el navegador abierto
        input("\n✋ Presiona Enter para cerrar el navegador...")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        # Intentar tomar screenshot del error
        try:
            driver.save_screenshot("error_undetected.png")
            print("📸 Screenshot del error guardado")
        except:
            pass
    
    finally:
        try:
            driver.quit()
            print("✅ Navegador cerrado")
        except:
            pass

def install_requirements():
    """
    Función helper para instalar las dependencias necesarias
    """
    print("📦 Instalando dependencias necesarias...")
    import subprocess
    import sys
    
    packages = ['undetected-chromedriver', 'selenium']
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} instalado correctamente")
        except:
            print(f"❌ Error instalando {package}")

if __name__ == "__main__":
    # Verificar si undetected-chromedriver está instalado
    try:
        import undetected_chromedriver
        print("✅ undetected-chromedriver está instalado")
    except ImportError:
        print("⚠️ undetected-chromedriver no está instalado")
        install_requirements()
        print("\n🔄 Por favor, ejecuta el script nuevamente\n")
        exit()
    
    # Ejecutar el login
    login_leidsa_undetected()