import express from "express";

import "dotenv/config";
import {
    userLanguageState,
    eligibilityState,
    getLocalizedText,
    sendTextMessage,
    sendLanguageSelectionMenu,
    sendMainMenu,
    sendEligibilityPrompt,
    sendNextStepMenu,
    handleEligibilityInput,
    handleSubMenuSelection,
} from "./services/whatsapp-api.js";
// --- CONSTANTS & CONFIGURATION ---
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000; 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// CRITICAL CHECK: Ensure the variables are loaded
if (!WHATSAPP_PHONE_ID || !META_ACCESS_TOKEN) {
    console.error("WARNING: WHATSAPP_PHONE_ID or META_ACCESS_TOKEN is missing or undefined.");
    // In production we must exit. In development allow the server to run so we can debug.
    if (process.env.NODE_ENV === 'production') {
        console.error("FATAL ERROR: Missing required env vars in production. Exiting.");
        process.exit(1);
    } else {
        console.warn("Continuing in development mode; outgoing WhatsApp API calls will fail without valid tokens.");
    }
}








// ----------------- WEBHOOK ENDPOINTS -----------------

app.get("/webhook", (req, res) => {
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

        if (!userLanguageState[from]) { userLanguageState[from] = 'en'; }

        try {
            if (eligibilityState[from] && eligibilityState[from].state === 'marks') {
                await handleEligibilityInput(incomingText, from);
                res.sendStatus(200); return;
            }

            if (message.type === "interactive") {
                const interactiveReply = message.interactive;
                const selectionId = interactiveReply.list_reply?.id || interactiveReply.button_reply?.id;
                if (selectionId) {
                    // Check for language change via button (lang_en or lang_hi IDs)
                    if (selectionId === "lang_en" || selectionId === "lang_hi") {
                        userLanguageState[from] = selectionId.substring(5); // Sets 'en' or 'hi'
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
app.get('/', (req, res) => {
    res.status(200).send('WhatsApp Chatbot Server is running successfully!');
});
// ----------------- SERVER START -----------------
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Webhook URL: YOUR_DOMAIN/webhook`);
});
