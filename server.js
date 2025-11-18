const express = require("express");
const axios = require('axios');
const Gpio = require('onoff').Gpio;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8271971002:AAFyqAzhmHIaaNHLMYfXrPDZcxfpg3s3hMI';
const TELEGRAM_CHAT_IDS = [
    '-1002997530688'
];

// Configurar GPIO para el sensor HC-SR501
const SENSOR_PIN = 17; // GPIO 17 (Pin 11)
let sensor;

try {
    sensor = new Gpio(SENSOR_PIN, 'in', 'both');
    console.log('✅ Sensor HC-SR501 inicializado en GPIO 17');
} catch (error) {
    console.error('❌ Error inicializando sensor:', error.message);
    console.log('⚠️  Ejecuta con sudo o verifica los permisos GPIO');
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let alertas = [];
let ultimaDeteccion = null;
const TIEMPO_ENTRE_ALERTAS = 30000; // 30 segundos entre alertas

// Función para enviar a Telegram
async function enviarTelegramATodos(mensaje) {
    const resultados = [];
    
    for (const chatId of TELEGRAM_CHAT_IDS) {
        try {
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const response = await axios.post(url, {
                chat_id: chatId,
                text: mensaje,
                parse_mode: 'HTML'
            }, {
                timeout: 10000
            });
            
            console.log(`✅ Mensaje enviado al chat: ${chatId}`);
            resultados.push({ chatId, status: 'success', response: response.data });
            
        } catch (error) {
            console.error(`❌ Error enviando a ${chatId}:`, error.message);
            resultados.push({ chatId, status: 'error', error: error.message });
        }
    }
    
    return resultados;
}

// Detección de movimiento
if (sensor) {
    sensor.watch(async (err, value) => {
        if (err) {
            console.error('❌ Error del sensor:', err);
            return;
        }
        
        const ahora = Date.now();
        const timestamp = new Date().toLocaleString('es-ES');
        
        if (value === 1) {
            console.log(`🚨 Movimiento detectado! - ${timestamp}`);
            
            // Evitar alertas consecutivas muy seguidas
            if (!ultimaDeteccion || (ahora - ultimaDeteccion) > TIEMPO_ENTRE_ALERTAS) {
                ultimaDeteccion = ahora;
                
                const nuevaAlerta = {
                    id: alertas.length + 1,
                    timestamp: timestamp,
                    tipo: 'movimiento_detectado',
                    sensor: 'HC-SR501',
                    valor: value
                };
                
                alertas.push(nuevaAlerta);
                
                // Enviar notificación a Telegram
                const mensaje = `🚨 <b>DETECCIÓN DE MOVIMIENTO</b>\nID: ${nuevaAlerta.id}\nHora: ${nuevaAlerta.timestamp}\nSensor: HC-SR501\nEstado: Movimiento detectado`;
                
                try {
                    await enviarTelegramATodos(mensaje);
                    console.log(`✅ Alerta ${nuevaAlerta.id} enviada a Telegram`);
                } catch (error) {
                    console.error('❌ Error enviando alerta:', error.message);
                }
            } else {
                console.log('⏳ Alerta suprimida (demasiado pronto después de la última)');
            }
        } else {
            console.log(`✅ Sin movimiento - ${timestamp}`);
        }
    });
}

// Endpoint para forzar alerta manual
app.post("/alerta", async (req, res) => {
    try {
        const nuevaAlerta = {
            id: alertas.length + 1,
            timestamp: new Date().toLocaleString('es-ES'),
            tipo: 'manual',
            datos: req.body
        };
        
        alertas.push(nuevaAlerta);
        console.log("📥 Alerta manual recibida:", nuevaAlerta.id);
        
        const mensaje = `🔔 <b>ALERTA MANUAL</b>\nID: ${nuevaAlerta.id}\nHora: ${nuevaAlerta.timestamp}\nDatos: ${JSON.stringify(req.body)}`;
        const resultados = await enviarTelegramATodos(mensaje);
        
        res.json({ 
            status: "ok",
            message: "Alerta manual guardada y notificada",
            alerta_id: nuevaAlerta.id,
            telegram_results: resultados
        });
        
    } catch (error) {
        console.error("❌ Error procesando alerta manual:", error);
        res.status(500).json({
            status: "error",
            message: "Error al procesar la alerta",
            error: error.message
        });
    }
});

// Endpoints básicos
app.get("/alertas", (req, res) => {
    res.json({
        total: alertas.length,
        alertas: alertas
    });
});

app.get("/estado", (req, res) => {
    res.json({ 
        servicio: "activo",
        sensor_activo: !!sensor,
        alertas_totales: alertas.length,
        ultima_deteccion: ultimaDeteccion ? new Date(ultimaDeteccion).toLocaleString('es-ES') : null,
        timestamp: new Date().toISOString()
    });
});

// Simular detección
app.get("/simular", async (req, res) => {
    try {
        const alertaSimulada = {
            id: alertas.length + 1,
            timestamp: new Date().toLocaleString('es-ES'),
            tipo: 'simulada',
            sensor: 'HC-SR501',
            valor: 1
        };
        
        alertas.push(alertaSimulada);
        
        const mensaje = `🔔 <b>ALERTA SIMULADA</b>\nID: ${alertaSimulada.id}\nHora: ${alertaSimulada.timestamp}\nEste es un mensaje de prueba del sensor.`;
        const resultados = await enviarTelegramATodos(mensaje);
        
        res.json({ 
            status: "ok",
            message: "Alerta simulada creada y notificada",
            telegram_results: resultados
        });
        
    } catch (error) {
        console.error("❌ Error en simulación:", error);
        res.status(500).json({
            status: "error",
            message: "Error en simulación",
            error: error.message
        });
    }
});

// Limpiar recursos al cerrar
process.on('SIGINT', () => {
    if (sensor) {
        sensor.unexport();
        console.log('✅ Sensor liberado');
    }
    process.exit();
});

app.listen(PORT, () => {
    console.log("🚀 Servidor funcionando en puerto " + PORT);
    console.log("📡 Sensor HC-SR501 monitorizando GPIO 17");
    console.log("📞 Endpoints disponibles:");
    console.log("   POST /alerta");
    console.log("   GET /alertas");
    console.log("   GET /estado");
    console.log("   GET /simular");
});