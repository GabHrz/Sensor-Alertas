const express = require("express");
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8271971002:AAFyqAzhmHIaaNHLMYfXrPDZcxfpg3s3hMI';
const TELEGRAM_CHAT_IDS = [
    '-1002997530688'
];

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let alertas = [];

// Función corregida para enviar mensajes
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
                timeout: 10000 // 10 segundos timeout
            });
            
            console.log(`✅ Mensaje enviado al chat: ${chatId}`);
            resultados.push({ chatId, status: 'success', response: response.data });
            
        } catch (error) {
            console.error(`❌ Error enviando a ${chatId}:`, error.message);
            
            // Información detallada del error
            if (error.response) {
                console.error('Detalles del error:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            
            resultados.push({ chatId, status: 'error', error: error.message });
        }
    }
    
    return resultados;
}

// Endpoint para verificar la configuración del bot
app.get("/verificar-bot", async (req, res) => {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
        const response = await axios.get(url, { timeout: 10000 });
        
        res.json({
            status: "success",
            botInfo: response.data,
            message: "✅ Bot configurado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "❌ Error al verificar el bot",
            error: error.message
        });
    }
});

// Recibir alerta y enviar a Telegram
app.post("/alerta", async (req, res) => {
    try {
        const nuevaAlerta = {
            id: alertas.length + 1,
            timestamp: new Date().toLocaleString('es-ES'),
            datos: req.body
        };
        
        alertas.push(nuevaAlerta);
        console.log("📥 Alerta recibida:", nuevaAlerta.id);
        
        // Enviar notificación a Telegram
        const mensaje = `🚨 <b>ALERTA de movimiento</b>\nID: ${nuevaAlerta.id}\nHora: ${nuevaAlerta.timestamp}\nSensor: ${req.body.sensor || 'Desconocido'}`;
        const resultados = await enviarTelegramATodos(mensaje);
        
        res.json({ 
            status: "ok",
            message: "Alerta guardada y notificada",
            alerta_id: nuevaAlerta.id,
            telegram_results: resultados
        });
        
    } catch (error) {
        console.error("❌ Error procesando alerta:", error);
        res.status(500).json({
            status: "error",
            message: "Error al procesar la alerta",
            error: error.message
        });
    }
});

// Endpoints básicos (sin cambios)
app.get("/alertas", (req, res) => {
    res.json({
        total: alertas.length,
        alertas: alertas
    });
});

app.get("/estado", (req, res) => {
    res.json({ 
        servicio: "activo",
        alertas_totales: alertas.length,
        timestamp: new Date().toISOString()
    });
});

// Simular alerta (corregido)
app.get("/simular", async (req, res) => {
    try {
        const alertaSimulada = {
            id: alertas.length + 1,
            timestamp: new Date().toLocaleString('es-ES'),
            datos: { sensor: "simulado", movimiento: true }
        };
        
        alertas.push(alertaSimulada);
        
        // Enviar a Telegram
        const mensaje = `🔔 <b>ALERTA SIMULADA</b>\nID: ${alertaSimulada.id}\nHora: ${alertaSimulada.timestamp}\nEste es un mensaje de prueba.`;
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

app.listen(PORT, () => {
    console.log("🚀 Servidor funcionando en puerto " + PORT);
    console.log("📞 Endpoints disponibles:");
    console.log("   POST /alerta");
    console.log("   GET /alertas");
    console.log("   GET /estado");
    console.log("   GET /simular");
    console.log("   GET /verificar-bot");
});