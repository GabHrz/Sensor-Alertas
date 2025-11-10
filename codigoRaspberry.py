#
"""
Sistema de alerta simple para Raspberry Pi
Envia alertas de movimiento al servidor
"""

import requests  # Para hacer peticiones HTTP

# URL de nuestro servidor en la nube
SERVER_URL = "https://sensor-alertas.onrender.com/alerta"

def enviar_alerta():
    """
    Funcion para enviar una alerta al servidor
    """
    try:
        # Datos que enviaremos al servidor
        datos = {
            "sensor": "hc-sr501",      # Tipo de sensor
            "movimiento": True,        # Siempre true para simulacion
            "ubicacion": "entrada"     # Ubicacion del sensor
        }
        
        # Enviar peticion POST al servidor
        respuesta = requests.post(SERVER_URL, json=datos, timeout=10)
        
        # Verificar si la peticion fue exitosa
        if respuesta.status_code == 200:
            print("Alerta enviada correctamente")
            print("Respuesta del servidor:", respuesta.json())
        else:
            print("Error al enviar alerta. Codigo:", respuesta.status_code)
            
    except Exception as error:
        # Manejar cualquier error de conexion
        print("Error de conexion:", error)

def main():
    """
    Funcion principal del programa
    """
    print("Sistema de alerta por movimiento")
    print("Presiona Enter para enviar una alerta")
    print("Presiona Ctrl + C para salir")
    print("=" * 40)
    
    try:
        # Bucle infinito para enviar alertas
        while True:
            input()  # Esperar a que el usuario presione Enter
            print("Enviando alerta de movimiento...")
            enviar_alerta()
            print("Listo. Presiona Enter para otra alerta...")
            print("-" * 40)
            
    except KeyboardInterrupt:
        # El usuario presiono Ctrl + C
        print("\nSaliendo del programa...")

# Punto de entrada del programa
if __name__ == "__main__":
    main()