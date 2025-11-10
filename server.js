const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Permitir acceso desde cualquier lugar
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let alertas = [];

// Recibir alerta del sensor
app.post("/alerta", (req, res) => {
    const nuevaAlerta = {
        id: alertas.length + 1,
        timestamp: new Date().toISOString(),
        datos: req.body
    };
    
    alertas.push(nuevaAlerta);
    console.log("Alerta recibida:", nuevaAlerta.id);
    
    res.json({ 
        status: "ok",
        message: "Alerta guardada",
        alerta_id: nuevaAlerta.id
    });
});

// Obtener alertas para la app
app.get("/alertas", (req, res) => {
    res.json({
        total: alertas.length,
        alertas: alertas
    });
});

// Verificar estado
app.get("/estado", (req, res) => {
    res.json({ 
        servicio: "activo",
        alertas_totales: alertas.length
    });
});

// Crear alerta de prueba
app.get("/simular", (req, res) => {
    const alertaSimulada = {
        id: alertas.length + 1,
        timestamp: new Date().toISOString(),
        datos: { sensor: "simulado", movimiento: true }
    };
    
    alertas.push(alertaSimulada);
    
    res.json({ 
        status: "ok",
        message: "Alerta simulada creada"
    });
});

app.listen(PORT, () => {
    console.log("Servidor funcionando en puerto " + PORT);
});