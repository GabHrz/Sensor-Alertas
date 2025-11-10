import requests
import time
import readchar  # pip install readchar

# ========== CONFIGURACIÓN DEL SERVIDOR ==========
# REEMPLAZA CON LA URL DE TU SERVIDOR EN RENDER:
SERVER_URL = "https://sensor-alertas.onrender.com/alerta"  # 👈 REEMPLAZA SI CAMBIASTE EL NOMBRE
# ===============================================

def enviar_alerta():
    try:
        datos = {
            "sensor": "hc-sr501",
            "movimiento": True,
            "ubicacion": "entrada_principal",
            "intensidad": "alta"
        }
        
        response = requests.post(SERVER_URL, json=datos, timeout=10)
        
        if response.status_code == 200:
            print("Alerta enviada correctamente")
            print("Respuesta:", response.json())
        else:
            print("Error al enviar alerta:", response.status_code)
            
    except Exception as e:
        print("Error de conexion:", e)

# Simulación con tecla
def main():
    print("Simulador de sensor - Presiona 'a' para alerta, 'q' para salir")
    
    while True:
        tecla = readchar.readkey().lower()
        
        if tecla == 'a':
            print("Enviando alerta de movimiento...")
            enviar_alerta()
        elif tecla == 'q':
            print("Saliendo...")
            break

if __name__ == "__main__":
    main()