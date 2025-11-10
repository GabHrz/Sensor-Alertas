const express = require("express");
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = '8271971002:AAFyqAzhmHIaaNHLMYfXrPDZcxfpg3s3hMI';
const TELEGRAM_CHAT_ID = '-1002997530688';

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let alertas = [];

// Función para enviar mensaje a Telegram
async function enviarTelegram(mensaje) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje
        });
        console.log('Mensaje enviado a Telegram');
    } catch (error) {
        console.error('Error enviando a Telegram:', error);
    }
}

// Recibir alerta y enviar a Telegram
app.post("/alerta", async (req, res) => {
    const nuevaAlerta = {
        id: alertas.length + 1,
        timestamp: new Date().toLocaleString('es-ES'),
        datos: req.body
    };
    
    alertas.push(nuevaAlerta);
    console.log("Alerta recibida:", nuevaAlerta.id);
    
    // Enviar notificación a Telegram
    const mensaje = `🚨 ALERTA de movimiento\nID: ${nuevaAlerta.id}\nHora: ${nuevaAlerta.timestamp}\nSensor: ${req.body.sensor || 'Desconocido'}`;
    await enviarTelegram(mensaje);
    
    res.json({ 
        status: "ok",
        message: "Alerta guardada y notificada",
        alerta_id: nuevaAlerta.id
    });
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
        alertas_totales: alertas.length
    });
});

// Simular alerta (para pruebas)
app.get("/simular", async (req, res) => {
    const alertaSimulada = {
        id: alertas.length + 1,
        timestamp: new Date().toLocaleString('es-ES'),
        datos: { sensor: "simulado", movimiento: true }
    };
    
    alertas.push(alertaSimulada);
    
    // Enviar a Telegram también
    const mensaje = `🔔 ALERTA SIMULADA\nID: ${alertaSimulada.id}\nHora: ${alertaSimulada.timestamp}\nEste es un mensaje de prueba.`;
    await enviarTelegram(mensaje);
    
    res.json({ 
        status: "ok",
        message: "Alerta simulada creada y notificada"
    });
});

app.listen(PORT, () => {
    console.log("Servidor funcionando en puerto " + PORT);
});