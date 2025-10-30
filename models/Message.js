import mongoose from 'mongoose';

// Define karein ki har message mein kya kya data store hoga
const MessageSchema = new mongoose.Schema({
    // Customer ka WhatsApp ID (e.g., 91XXXXXXXXXX)
    waId: {
        type: String,
        required: true,
        index: true
    },
    // Message ka content (text ya media description)
    content: {
        type: String,
        required: true
    },
    // Kisne message bheja: 'inbound' (customer) ya 'outbound' (chatbot/agent)
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },
    // Message kab aaya/bhja gaya
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Meta ka unique message ID (inbound messages ke liye)
    metaId: {
        type: String,
        // Duplicate Webhook entries rokne ke liye
        sparse: true // Null values allow karein
    },
    // Chat ki status (Handoff logic ke liye CRITICAL)
    chatStatus: {
        type: String,
        enum: ['bot_mode', 'live_agent_mode', 'resolved'],
        default: 'bot_mode'
    }
});

// Model ko export karein
const Message = mongoose.model('Message', MessageSchema);
export default Message;
