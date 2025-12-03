import express from "express";
import mongoose from 'mongoose';
import "dotenv/config";
import Message from './models/Message.js';
import path from 'path';
import ejs from 'ejs'; // EJS ko import karna zaroori hai!

// Aapke existing imports
import {
    userLanguageState,
    eligibilityState,
    getLocalizedText,
    sendTextMessage,
    sendLanguageSelectionMenu,
    sendMainMenu,
    sendEligibilityPrompt,
    handleEligibilityInput,
    handleSubMenuSelection,
    sendNextStepMenu,
} from "./services/whatsapp-api.js";


// --- CONSTANTS & CONFIGURATION ---
const app = express();

const PORT = process.env.PORT || 4000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// Use 'path' to correctly serve files from the 'views' directory
const __dirname = path.resolve();

// --- EJS VIEW ENGINE SETUP ---
// Express ko batana ki views kahan hain aur EJS use karna hai
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// -----------------------------

// CRITICAL CHECK: Ensure the variables are loaded
if (!WHATSAPP_PHONE_ID || !META_ACCESS_TOKEN) {
    console.error("WARNING: WHATSAPP_PHONE_ID or META_ACCESS_TOKEN is missing or undefined.");
    if (process.env.NODE_ENV === 'production') {
        console.error("FATAL ERROR: Missing required env vars in production. Exiting.");
        process.exit(1);
    } else {
        console.warn("Continuing in development mode; outgoing WhatsApp API calls will fail without valid tokens.");
    }
}

// Middleware
app.use(express.json());
// Aapke project ko client side files (CSS/JS) ki zarurat padegi, isliye public folder set karte hain.
app.use(express.static(path.join(__dirname, 'public')));


// --- 1. MongoDB Connection Logic ---
const MONGODB_URI = process.env.MONGODB_URI;

// Check karein ki URI available hai
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB Connected Successfully!'))
        .catch(err => console.error('❌ MongoDB connection error:', err.message));
} else {
    console.error("❌ MONGODB_URI not found in .env file. Database will not work.");
}
// ------------------------------------


// ----------------- WEBHOOK ENDPOINTS -----------------

app.get("/webhook", (req, res) => {
    // ... Verification Code (Correct) ...
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("[INFO] WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

app.post("/webhook", async (req, res) => {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") { return res.sendStatus(404); }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
        const message = messages[0];
        const from = message.from;
        const incomingText = message.type === "text" ? message.text.body.toLowerCase().trim() : null;

        // --- 2. Database Mein Message Save Karne Ka Logic ---
        try {
            if (message.type === "text") {
                const newMessage = new Message({
                    waId: from,
                    content: message.text.body,
                    direction: 'inbound',
                    metaId: message.id,
                });
                await newMessage.save();
                console.log(`[DB] Inbound message saved from ${from}`);
            }
        } catch (dbError) {
            console.error("Error saving message to DB:", dbError);
        }
        // ----------------------------------------------------


        if (!userLanguageState[from]) { userLanguageState[from] = 'en'; }

        // Aapka existing chatbot logic yahan continue hoga.
        try {
            // *** Live Agent Handoff Check ***
            const lastMessage = await Message.findOne({ waId: from }).sort({ timestamp: -1 });

            if (lastMessage && lastMessage.chatStatus === 'live_agent_mode') {
                return res.sendStatus(200); // Agar agent mode mein hai, toh bot chup rahega
            }
            // *** Handoff Check End ***


            if (eligibilityState[from] && eligibilityState[from].state === 'marks') {
                await handleEligibilityInput(incomingText, from);
                res.sendStatus(200); return;
            }

            if (message.type === "interactive") {
                const interactiveReply = message.interactive;
                const selectionId = interactiveReply.list_reply?.id || interactiveReply.button_reply?.id;
                if (selectionId) {
                    if (selectionId === "lang_en" || selectionId === "lang_hi") {
                        userLanguageState[from] = selectionId.substring(5);
                        await sendTextMessage(from, getLocalizedText(from, selectionId === "lang_en" ? 'LANGUAGE_SWITCHED_EN' : 'LANGUAGE_SWITCHED_HI'));
                        await sendMainMenu(from);
                        res.sendStatus(200); return;
                    }
                    else if (selectionId.endsWith("_eligibility_start")) {
                        await sendEligibilityPrompt(from, selectionId.replace("_eligibility_start", ""));
                    } else {
                        await handleSubMenuSelection(selectionId, from);
                    }
                }
            }
            else if (message.type === "text" && incomingText) {
                if (eligibilityState[from] && eligibilityState[from].state === 'stream') {
                    await handleEligibilityInput(incomingText, from);
                    res.sendStatus(200); return;
                }
                // *** Agent Handoff Trigger Logic ***
                else if (["agent", "human", "live chat", "baat karni hai"].includes(incomingText)) {
                    // Database mein status update
                    await Message.updateOne(
                        { waId: from },
                        { $set: { chatStatus: 'live_agent_mode' } },
                        { upsert: true }
                    );
                    await sendTextMessage(from, getLocalizedText(from, 'HUMAN_TRANSFER_MESSAGE'), true); // true for Agent reply in save logic
                    return res.sendStatus(200);
                }
                // *** End Handoff Trigger Logic ***
                else if (["hi", "hello", "start", "menu", "main menu", "namaste", "shuru"].includes(incomingText)) {
                    await sendLanguageSelectionMenu(from);
                }
                else if (incomingText === "english" || incomingText === "en") {
                    userLanguageState[from] = 'en';
                    await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_EN'));
                    await sendMainMenu(from);
                } else if (incomingText === "hindi" || incomingText === "hi") {
                    userLanguageState[from] = 'hi';
                    await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_HI'));
                    await sendMainMenu(from);
                }
                else {
                    await sendNextStepMenu(from, 'menu_main');
                }
            }
            else {
                await sendTextMessage(from, getLocalizedText(from, 'GENERAL_SUPPORT'));
                await sendNextStepMenu(from, 'menu_main');
            }
        } catch (err) {
            console.error("Error processing incoming message:", err);
            await sendTextMessage(from, "⚠️ Oops! An internal error occurred. Please type 'hi' or click the menu button to restart.");
        }
    }

    res.sendStatus(200);
});


// ----------------- INBOX ROUTES -----------------

// This route serves the actual HTML page for the Inbox
app.get('/', (req, res) => {
    // THIS LINE IS CORRECT: res.render EJS file ko compile karke display karega
    res.render('inbox');
});

// API endpoint to fetch list of unique chats and their last message
app.get('/api/chats', async (req, res) => {
    try {
        const chats = await Message.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$waId",
                    lastMessage: { $first: "$content" },
                    lastStatus: { $first: "$chatStatus" },
                    timestamp: { $first: "$timestamp" }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);
        res.status(200).json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

// API endpoint to fetch message history for a specific customer
app.get('/api/chats/:waId', async (req, res) => {
    const waId = req.params.waId;
    try {
        const history = await Message.find({ waId: waId }).sort({ timestamp: 1 });
        res.status(200).json(history);
    } catch (error) {
        console.error(`Error fetching history for ${waId}:`, error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});


// API endpoint for Agent to send a message
app.post('/api/reply', async (req, res) => {
    const { waId, message } = req.body;

    console.log(`[API] Received reply request for ${waId}: ${message}`);

    if (!waId || !message) {
        return res.status(400).json({ error: "waId and message are required." });
    }

    try {
        // 1. Send to WhatsApp Cloud API first
        console.log("[API] Sending to WhatsApp...");
        await sendTextMessage(waId, message, true);
        console.log("[API] WhatsApp sent successfully.");

        // 2. Generate a unique ID for our internal database
        // This prevents "Duplicate Key" errors if your DB has a unique index on metaId
        const agentMetaId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 3. Create the Database Object
        const outboundMsg = new Message({
            waId: waId,
            content: message,
            direction: 'outbound',
            chatStatus: 'live_agent_mode',
            timestamp: new Date(),
           metaId: message.id || `fallback_${Date.now()}_${Math.random()}`,
        });

        // 4. Save to MongoDB
        console.log("[DB] Attempting to save to MongoDB...");
        const savedMessage = await outboundMsg.save();
        console.log(`[DB] ✅ Outbound message saved! ID: ${savedMessage._id}`);

        res.status(200).json({ success: true, message: "Reply sent and saved." });

    } catch (error) {
        console.error("❌ ERROR inside /api/reply:", error);
        
        // Detailed error for debugging
        if (error.code === 11000) {
            console.error("Duplicate Key Error. This means metaId is conflicting.");
        }

        res.status(500).json({ error: "Failed to process reply." });
    }
});
// ----------------- SERVER START -----------------
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Homepage/Inbox URL: YOUR_DOMAIN/`);
    console.log(`Webhook URL: YOUR_DOMAIN/webhook`);
});
