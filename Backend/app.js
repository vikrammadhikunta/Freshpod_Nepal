const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const mqtt = require('mqtt');
const dns = require('dns');

// Models & DB
const connectDB = require('./db/connect.js');
const Machine = require('./Models/machine.model.js');
const Transaction = require('./Models/transaction.model.js');

dotenv.config();
const app = express();

/* ---------------- LOGGER ---------------- */
const log = (...args) => {
    console.log(new Date().toISOString(), ...args);
};

dns.setServers(["1.1.1.1", "8.8.8.8"]);

/* ---------------- STARTUP ---------------- */
log("🚀 Starting Backend...");
connectDB()
    .then(() => log("✅ MongoDB Connected"))
    .catch(err => log("❌ DB Error:", err));

/* ---------------- MQTT ---------------- */
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => log("✅ MQTT Connected"));
mqttClient.on('error', (err) => log("❌ MQTT Error:", err));
mqttClient.on('reconnect', () => log("🔄 MQTT Reconnecting"));

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
    origin: "https://freshpod-nepal-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();

    log(`📥 [${req.requestId}] ${req.method} ${req.url}`);
    log("📦 Body:", req.body);

    res.on('finish', () => {
        log(`📤 [${req.requestId}] Status: ${res.statusCode}`);
    });

    next();
});

/* ---------------- GET MACHINE ---------------- */
app.get('/machine/:id', async (req, res) => {
    try {
        const machineId = req.params.id;

        log("🔍 Fetch machine:", machineId);

        const machine = await Machine.findById(machineId);

        if (!machine) {
            log("❌ Machine not found");
            return res.status(404).json({ error: "Machine not found" });
        }

        log("✅ Machine found:", machine._id);
        res.json(machine);

    } catch (error) {
        log("❌ Machine Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/* ---------------- CREATE KHALTI ORDER ---------------- */
app.post('/create-khalti-order/:id', async (req, res) => {
    try {
        const machineId = req.params.id;
        log(`🟡 [DEBUG] Initiating order for Machine: ${machineId}`);

        // ✅ ENV VALIDATION
        if (!process.env.BASE_URL || !process.env.SECRET_KEY) {
            log("❌ [ENV ERROR] Missing BASE_URL or SECRET_KEY");
            return res.status(500).json({
                error: "Server misconfigured",
                details: "Missing Khalti env variables"
            });
        }

        const machine = await Machine.findById(machineId);

        if (!machine) {
            log("❌ Machine not found");
            return res.status(404).json({ error: "Machine not found" });
        }

        if (!machine.amount || isNaN(machine.amount)) {
            log("❌ Invalid amount:", machine.amount);
            return res.status(400).json({ error: "Invalid machine amount" });
        }

        const khaltiPayload = {
            return_url: "https://freshpod-nepal-frontend.onrender.com/success",
            website_url: "https://freshpod.in",
            amount: Math.round(machine.amount * 100), // MUST be integer
            purchase_order_id: `Order_${Date.now()}`,
            purchase_order_name: `MachineID:${machine._id}`,
            customer_info: {
                name: "User",
                email: "test@test.com",
                phone: "9800000000"
            }
        };

        log("📦 [PAYLOAD]");
        log(JSON.stringify(khaltiPayload, null, 2));

        log("🌐 BASE_URL:", process.env.BASE_URL);
        log("🔑 SECRET_KEY present:", !!process.env.SECRET_KEY);

        const response = await axios.post(
            `${process.env.BASE_URL}epayment/initiate/`,
            khaltiPayload,
            {
                headers: {
                    Authorization: `Key ${process.env.SECRET_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        log("✅ [KHALTI RESPONSE]");
        log(JSON.stringify(response.data, null, 2));

        const tx = await Transaction.create({
            razorpay_payment_id: response.data.pidx,
            amount: machine.amount,
            status: "Initiated",
            notes: { machine_id: machine._id }
        });

        log("📝 Transaction saved:", tx._id);

        res.json(response.data);

    } catch (error) {

        log("🚨 [CREATE ORDER ERROR]");

        if (error.response) {
            log("🔥 Khalti Error Data:", JSON.stringify(error.response.data, null, 2));
            log("🔥 Status Code:", error.response.status);

            return res.status(error.response.status).json({
                error: "Khalti rejected the request",
                khalti_error: error.response.data
            });
        }

        if (error.request) {
            log("🌐 No response received from Khalti");

            return res.status(500).json({
                error: "No response from Khalti",
                message: error.message
            });
        }

        log("❌ Unknown Error:", error.message);

        res.status(500).json({
            error: "Failed to initiate payment",
            message: error.message
        });
    }
});

/* ---------------- VERIFY PAYMENT ---------------- */
app.post('/verify-khalti-payment', async (req, res) => {
    let machineId = null;

    try {
        const { pidx } = req.body;

        log("🟡 Verifying PIDX:", pidx);

        if (!pidx) {
            return res.status(400).json({ error: "pidx required" });
        }

        const response = await axios.post(
            `${process.env.BASE_URL}epayment/lookup/`,
            { pidx },
            {
                headers: {
                    Authorization: `Key ${process.env.SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        log("🔍 Khalti Lookup:", response.data);

        const paymentInfo = response.data;

        const existingTx = await Transaction.findOne({
            razorpay_payment_id: pidx
        });

        if (!existingTx) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        machineId = existingTx.notes?.machine_id;

        // fallback
        if (!machineId) {
            const name = paymentInfo?.purchase_order_name;
            if (name?.includes("MachineID:")) {
                machineId = name.split("MachineID:")[1];
            }
        }

        if (paymentInfo.status !== "Completed") {
            return res.json({
                success: false,
                status: paymentInfo.status,
                machineId
            });
        }

        if (existingTx.status === "Completed") {
            return res.json({
                success: true,
                machineId
            });
        }

        // MQTT trigger
        const topic = `freshpod_vending_2025/${machineId}`;

        mqttClient.publish(topic, JSON.stringify({
            amount: paymentInfo.total_amount / 100,
            transaction_id: paymentInfo.transaction_id
        }));

        existingTx.status = "Completed";
        await existingTx.save();

        res.json({
            success: true,
            machineId
        });

    } catch (error) {
        log("🔥 VERIFY ERROR:", {
            data: error.response?.data,
            status: error.response?.status,
            message: error.message
        });

        res.status(200).json({
            success: false,
            status: "Verification failed",
            machineId
        });
    }
});

/* ---------------- GET TRANSACTIONS ---------------- */
app.get('/transactions', async (req, res) => {
    try {
        const tx = await Transaction.find().sort({ created_at: -1 });
        res.json(tx);
    } catch (error) {
        log("❌ Transactions Error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
    log("🔥 Unhandled Error:", err);
    res.status(500).json({ error: "Something went wrong" });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    log(`🚀 Server running on port ${PORT}`);
});
