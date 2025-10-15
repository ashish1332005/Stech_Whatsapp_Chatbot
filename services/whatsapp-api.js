// services/whatsapp-api.js

import axios from "axios";
import crypto from "crypto";
import {

    API_URL,

    WHATSAPP_HEADERS,
    MESSAGES,
    GOOGLE_DRIVE_BASE_URL,
    URL_IMAGE_HOSTEL,
    ID_IMAGE_HOSTEL,
    UNIVERSAL_CAMPUS_TOUR,
    EVENTS_SPORTS_TOUR,
    URL_CBSE_FEES_PN_DETAIL,
    URL_CBSE_FEES_PS_DETAIL,
    URL_COLLEGE_COURSES_DETAIL,
    URL_ADMISSION_FORM,
    URL_CBSE_FEES_GENERAL,
    URL_WEB_CBSE,
    URL_WEB_NURSING,
    URL_WEB_PARAMEDICAL,
    URL_WEB_DPHARMA,
    URL_SOCIAL_FB,
    URL_SOCIAL_INSTA,
    URL_SOCIAL_YOUTUBE,
    URL_SOCIAL_LINKEDIN,
    URL_BASE_PROSPECTUS,
    Paramedical_lab_img,
    Nursing_lab_img,
    DPharmacy_lab_img,
ID_IMAGE_DPHARMA  ,
ID_IMAGE_PARAMED ,
ID_IMAGE_NURSING,
URL_IMAGE_PARAMED2,
ID_IMAGE_PARAMED2 ,

} from "./constants.js";

// --- LANGUAGE & FLOW STATES ---
export const userLanguageState = {};
export const eligibilityState = {};


const URL_MAP = {
    // Social Media Links
    'url_fb': URL_SOCIAL_FB,
    'url_insta': URL_SOCIAL_INSTA,
    'url_yt': URL_SOCIAL_YOUTUBE,
    'url_li': URL_SOCIAL_LINKEDIN,
    
    // Department Website Links
    'url_cbse_web': URL_WEB_CBSE,
    'url_nursing_web': URL_WEB_NURSING,
    'url_paramed_web': URL_WEB_PARAMEDICAL,
    'url_dpharma_web': URL_WEB_DPHARMA,
};
// Registry for short hashed IDs -> long URLs (used for interactive button IDs)
const URL_REGISTRY = new Map();
// Pre-register commonly used URLs so their short ids exist even if menus are not recently sent
function preRegisterKnownUrls() {
    try {
        const urls = [
            URL_SOCIAL_FB, URL_SOCIAL_INSTA, URL_SOCIAL_YOUTUBE, URL_SOCIAL_LINKEDIN,
            URL_WEB_CBSE, URL_WEB_NURSING, URL_WEB_PARAMEDICAL, URL_WEB_DPHARMA,
            URL_BASE_PROSPECTUS, URL_ADMISSION_FORM, URL_CBSE_FEES_PN_DETAIL, URL_CBSE_FEES_PS_DETAIL, URL_CBSE_FEES_GENERAL
        ];
        for (const u of urls) {
            if (u) registerUrl(u);
        }
    } catch (e) { console.warn('[WARN] preRegisterKnownUrls failed', e); }
}
// Run once at module load
preRegisterKnownUrls();
// Helper: create a short stable id for a URL and register it (top-level so all functions share the registry)
function registerUrl(url) {
    // Create a stable short hash-based id. If a collision occurs (same id but different URL),
    // increase prefix length or append a numeric suffix until unique.
    const fullHash = crypto.createHash('sha1').update(url).digest('hex');
    for (let len = 8; len <= fullHash.length; len += 2) {
        const candidate = `open_url_${fullHash.substring(0, len)}`;
        const existing = URL_REGISTRY.get(candidate);
        if (!existing) {
            URL_REGISTRY.set(candidate, url);
            return candidate;
        }
        if (existing === url) {
            return candidate; // already registered same mapping
        }
        // otherwise collision - try longer prefix
    }

    // As a last resort, append numeric suffixes until unique
    let i = 1;
    while (true) {
        const candidate = `open_url_${fullHash.substring(0, 12)}_${i}`;
        const existing = URL_REGISTRY.get(candidate);
        if (!existing) {
            URL_REGISTRY.set(candidate, url);
            console.warn(`[WARN] registerUrl required numeric suffix for URL (possible hash collision): ${candidate}`);
            return candidate;
        }
        if (existing === url) return candidate;
        i += 1;
    }
}

// Ensure all list-row IDs are unique (WhatsApp normalizes/truncates IDs and may report duplicates).
function ensureUniqueRowIds(listMessage) {
    try {
        const seen = new Set();
        const sections = listMessage?.interactive?.action?.sections || [];
        for (const section of sections) {
            if (!Array.isArray(section.rows)) continue;
            for (const row of section.rows) {
                let id = String(row.id);
                if (!id) continue;
                if (seen.has(id)) {
                    // Append a small numeric suffix until unique
                    let i = 1;
                    let newId = `${id}_${i}`;
                    while (seen.has(newId)) { i += 1; newId = `${id}_${i}`; }
                    console.warn(`[WARN] Duplicate row id detected. Rewriting ${id} -> ${newId}`);
                    row.id = newId;
                    seen.add(newId);
                } else {
                    seen.add(id);
                }
            }
        }
    } catch (err) {
        console.warn('[WARN] ensureUniqueRowIds failed', err);
    }
}
// --- UTILITY FUNCTIONS ---

export function getLocalizedText(waId, key, replacements = {}) {
    const lang = userLanguageState[waId] || 'en';
    
    let text;
    if (MESSAGES[key]) {
        text = MESSAGES[key][lang] || MESSAGES[key]['en'];
    } else {
        text = `[MISSING MESSAGE KEY: ${key}]`;
    }

    Object.keys(replacements).forEach(repl => {
        text = text.replace(new RegExp(`{{${repl}}}`, 'g'), replacements[repl]);
    });
    return text;
}

export function handleApiError(error, context) {
    console.error(`--- ERROR in ${context} ---`);
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
        if (error.response.data.error?.error_data?.details) {
            console.error("Error Details:", error.response.data.error.error_data.details);
        }
    } else {
        console.error("Message:", error.message);
    }
    console.error("-------------");
}

export async function sendTextMessage(to, text) {
    try {
        await axios.post(
            API_URL,
            { messaging_product: "whatsapp", to: to, type: "text", text: { body: text } },
            { headers: WHATSAPP_HEADERS }
        );
        console.log(`[SUCCESS] Text message sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Text message to ${to}`);
    }
}

export async function sendMediaMessage(to, mediaIdOrUrl, caption = '', type = 'image', isUrl = false, precomputedUrl = null) {
    // compute finalUrl in function scope so it's available in the catch block
    let finalUrl = precomputedUrl || (isUrl ? mediaIdOrUrl : `${GOOGLE_DRIVE_BASE_URL}${mediaIdOrUrl}`);
    // Normalize/validate finalUrl: ensure it starts with http/https. If not, assume it's a Drive ID and build the Drive URL
    try {
        const parsed = new URL(finalUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Non-HTTP protocol');
        }
    } catch (err) {
        // finalUrl is not a valid absolute URL; try building a Drive download link
        finalUrl = `${GOOGLE_DRIVE_BASE_URL}${mediaIdOrUrl}`;
    }

    try {
        await axios.post(
            API_URL,
            { messaging_product: "whatsapp", to: to, type, [type]: { link: finalUrl }, caption: caption },
            { headers: WHATSAPP_HEADERS }
        );
        console.log(`[SUCCESS] Media (${type}) sent to ${to} from URL/ID: ${mediaIdOrUrl}`);
    } catch (error) {
        handleApiError(error, `Media (${type}) to ${to}`);
        const lang = userLanguageState[to] || 'en';
        // finalUrl is safe to reference here because it's declared in the outer scope above
        await sendTextMessage(to, (lang === 'en' ? "⚠️ Media failed to send. Please check the file's public sharing link or contact support.\nFile ID:" : "⚠️ मीडिया भेजने में विफल रहा। कृपया फ़ाइल का सार्वजनिक साझाकरण लिंक जांचें या समर्थन से संपर्क करें।\nफ़ाइल आईडी:") + ` ${mediaIdOrUrl}\nDescription: ${caption}\nLink attempted: ${finalUrl}`);
    }
}

// NOTE: sendCourseMedia calls handleSubMenuSelection and sendCbsiBranchSelection, 
// which are all defined below/in this file, solving circular dependency.
export async function sendCourseMedia(from, mediaArray, courseName, parentMenuId) {
    const lang = userLanguageState[from] || 'en';

    let startMessage = '';
    if (mediaArray === EVENTS_SPORTS_TOUR) { startMessage = getLocalizedText(from, 'EVENTS_SPORTS_BODY'); } 
    else { startMessage = (lang === 'en' ? `Starting ${courseName} tour now (Total ${mediaArray.length} items)...` : `${courseName} का टूर शुरू हो रहा है (कुल ${mediaArray.length} आइटम)...`); }

    await sendTextMessage(from, startMessage);

    for (const item of mediaArray) {
        // Defensive guards: skip items without an id
        const source = item && item.id;
        if (!source) {
            console.warn(`[WARN] Skipping media item during tour because it has no id: ${JSON.stringify(item)}`);
            continue;
        }
        const isUrl = !!item.url;
        // Defensive caption handling: item.caption may be missing or not an object
        let captionText = '';
        try {
            if (item.caption && typeof item.caption === 'object') {
                captionText = (item.caption[lang] || item.caption['en'] || '');
            }
        } catch (e) {
            captionText = '';
        }
        await sendMediaMessage(from, source, captionText, item.type, isUrl, item.url);
    }

    if (courseName.includes("CBSE")) { await sendCbsiBranchSelection(from); } 
    else { await handleSubMenuSelection(parentMenuId, from); }
}

export async function sendHostelInfo(from, parentMenuId) {
    const text = getLocalizedText(from, 'HOSTEL_BODY');
    await sendMediaMessage(from, ID_IMAGE_HOSTEL, getLocalizedText(from, 'HOSTEL_TITLE'), 'image', true, URL_IMAGE_HOSTEL);
    await sendTextMessage(from, text);
    await sendNextStepMenu(from, parentMenuId);
}

export async function sendAdmissionContact(to, department, phone, email, parentMenuId) {
    const text = getLocalizedText(to, 'ADMISSIONS_DIRECT_TEXT');
    await sendDetailedResponseAndNextStep(to, { text: text }, parentMenuId);
}

export async function sendLanguageSelectionMenu(to) {
    const buttonMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "button", body: { text: getLocalizedText(to, 'LANGUAGE_PROMPT') },
            action: { buttons: [{ type: "reply", reply: { title: "English 🇬🇧", id: "lang_en" } }, { type: "reply", reply: { title: "Hindi (हिन्दी) 🇮🇳", id: "lang_hi" } }] },
        },
    };
    try {
        await axios.post(API_URL, buttonMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Language Selection Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Language Selection Menu to ${to}`);
        await sendTextMessage(to, "Welcome! Please choose your language by replying 'en' for English or 'hi' for Hindi.");
    }
}

// FIX: sendNextStepMenu is now defined within this module, eliminating ReferenceError in index.js
export async function sendNextStepMenu(to, parentMenuId) {
    const isMainMenu = parentMenuId === 'menu_main';
    const backButtonTitle = isMainMenu ? getLocalizedText(to, 'VIEW_ALL_PROGRAMS') : getLocalizedText(to, 'BACK_BUTTON');
    const backButtonId = isMainMenu ? "menu_main" : parentMenuId;
    const currentLang = userLanguageState[to] || 'en';
    const quickChangeId = currentLang === 'en' ? "lang_hi" : "lang_en";

    const nextStepMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "button", body: { text: getLocalizedText(to, 'NEXT_STEP_BODY') },
            footer: { text: getLocalizedText(to, 'NEXT_STEP_FOOTER') },
            action: {
                buttons: [
                    { type: "reply", reply: { title: backButtonTitle.substring(0, 20), id: backButtonId } },
                    { type: "reply", reply: { title: getLocalizedText(to, 'ADMISSIONS_CONTACT_BUTTON').substring(0, 20), id: "contact_admissions_direct" } },
                    { type: "reply", reply: { title: (currentLang === 'en' ? "🌐 Switch to Hindi" : "🌐 English में बदलें").substring(0, 20), id: quickChangeId } },
                ],
            },
        },
    };
    try {
        await axios.post(API_URL, nextStepMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Contextual Next Step Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Contextual Next Step Menu to ${to}`);
    }
}

export async function sendLinkButtonMessage(to, bodyText, primaryUrl, primaryButtonTitle, secondaryUrl, secondaryButtonTitle, parentMenuId) {
    const backButtonTitle = getLocalizedText(to, 'BACK_BUTTON');
    const backButtonId = parentMenuId;
    const lang = userLanguageState[to] || 'en';

    let fullBodyText = bodyText;
    if (primaryUrl) {
        fullBodyText += `\n\n${primaryButtonTitle}: ${primaryUrl}`;
    }
    if (secondaryUrl && secondaryButtonTitle) {
        fullBodyText += `\n${secondaryButtonTitle}: ${secondaryUrl}`;
    }

    // Use top-level registerUrl (defined earlier) to ensure consistent registry usage

    const buttons = [];
    if (primaryUrl) {
        const id = registerUrl(primaryUrl);
        buttons.push({ type: "reply", reply: { title: primaryButtonTitle.substring(0, 20), id } });
    }

    if (secondaryUrl && secondaryButtonTitle) {
        const id2 = registerUrl(secondaryUrl);
        buttons.push({ type: "reply", reply: { title: secondaryButtonTitle.substring(0, 20), id: id2 } });
    }

    buttons.push(
        { type: "reply", reply: { title: backButtonTitle.substring(0, 20), id: backButtonId } }
    );

    const linkButtonMessage = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "button",
            body: { text: fullBodyText.substring(0, 1024) }, 
            footer: { text: getLocalizedText(to, 'NEXT_STEP_FOOTER') },
            action: { buttons },
        },
    };

    try {
        await axios.post(API_URL, linkButtonMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Button message with URLs sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Link Button Message to ${to}`);
        await sendTextMessage(to, fullBodyText);
        await sendNextStepMenu(to, parentMenuId);
    }
}

// ----------------- INTERACTIVE MESSAGE TEMPLATES -----------------

export async function sendMainMenu(to) {
     const lang = userLanguageState[to] || 'en';
    const listMessage = {
        
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list", header: { type: "text", text: getLocalizedText(to, 'WELCOME_HEADER') },
            body: { text: getLocalizedText(to, 'WELCOME_BODY') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON'),
                sections: [
                    {
                        title: getLocalizedText(to, 'SECTION_PROGRAMS').substring(0, 24),
                        rows: [
                            { id: "menu_cbse", title: getLocalizedText(to, 'CBSE_HEADER').substring(0, 24) },
                            { id: "menu_nursing", title: getLocalizedText(to, 'NURSING_HEADER').substring(0, 24) },
                            { id: "menu_paramedical", title: getLocalizedText(to, 'PARAMED_HEADER').substring(0, 24) },
                            { id: "menu_dpharma", title: getLocalizedText(to, 'DPHARMA_HEADER').substring(0, 24) },
                        ],
                    },
                    {
                        title: getLocalizedText(to, 'SECTION_SUPPORT').substring(0, 24),
                        rows: [
                            { id: "media_events", title: getLocalizedText(to, 'EVENTS_SPORTS_TITLE').substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },
                            { id: "menu_hospital", title: getLocalizedText(to, 'HOSPITAL_TEXT').substring(0, 24) },
                            { id: "menu_helpdesk", title: getLocalizedText(to, 'HELPDESK_TEXT').substring(0, 24) },
                        ],
                    },
                      {
                        title: 'Explore & Contact',
                        rows: [
                            { id: 'url_cbse_web', title: (lang === 'en' ? "🌐 School Website" : "🌐 स्कूल वेबसाइट").substring(0, 24) }, 
                            { id: 'menu_explore', title: '🔗 Social & Contacts' },
                       
                        ]
                    }
                ],
            },
        },
    };
    try {
        // Ensure IDs are unique after any registration/creation and log them for debugging
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] Main Menu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Main Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Main Menu to ${to}`);
    }
}

export async function sendCbsiBranchSelection(to) {
    const buttonMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "button", header: { type: "text", text: getLocalizedText(to, 'CBSE_HEADER') },
            body: { text: getLocalizedText(to, 'CBSE_BODY') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                buttons: [
                    { type: "reply", reply: { title: getLocalizedText(to, 'CBSE_PATEL_NAGAR').substring(0, 20), id: "menu_cbse_pn" } },
                    { type: "reply", reply: { title: getLocalizedText(to, 'CBSE_PANSAL').substring(0, 20), id: "menu_cbse_ps" } },
                    { type: "reply", reply: { title: "Main Menu 🎓", id: "menu_main" } },
                ],
            },
        },
    };
    try {
        await axios.post(API_URL, buttonMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] CBSE Branch Selection Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `CBSE Branch Selection Menu to ${to}`);
    }
}
export async function sendCbsiSubMenu(to, branchId) {
    const branchName = branchId === 'menu_cbse_pn' ? getLocalizedText(to, 'CBSE_PATEL_NAGAR') : getLocalizedText(to, 'CBSE_PANSAL');
    const parentIdPrefix = branchId;
    const lang = userLanguageState[to] || 'en';

    // Choose a branch-specific body text key so clicking a branch shows its particular description
    const bodyKey = branchId === 'menu_cbse_pn' ? 'CBSE_PATEL_NAGAR_BODY' : 'CBSSE_PANSAL_BODY';

    const listMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list", header: { type: "text", text: branchName.substring(0, 24) + " - Details" },
            body: { text: getLocalizedText(to, bodyKey) },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON').substring(0, 20),
                sections: [
                    {
                        title: getLocalizedText(to, 'CBSE_ADMISSIONS_TITLE').substring(0, 24),
                        rows: [
                            { id: `${parentIdPrefix}_fees`, title: getLocalizedText(to, 'CBSE_FEES_TITLE').substring(0, 24) },
                            { id: `${parentIdPrefix}_docs`, title: getLocalizedText(to, 'CBSE_DOCS_TITLE').substring(0, 24) },
                            { id: `${parentIdPrefix}_admission`, title: getLocalizedText(to, 'CBSE_ADMISSIONS_TITLE').substring(0, 24) },
                            { id: `media_school`, title: (lang === 'en' ? "🖼️ View Labs/Campus" : "🖼️ लैब/कैंपस देखें").substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },
                        ],
                    },
                    {
                        title: 'Explore & Contact',
                        rows: [
                            { id: 'url_cbse_web', title: (lang === 'en' ? "🌐 School Website" : "🌐 स्कूल वेबसाइट").substring(0, 24) }, 
                            { id: 'menu_explore', title: '🔗 Social & Contacts' },
                            { id: 'menu_cbse', title: getLocalizedText(to, 'BACK_BUTTON').substring(0, 24) + " (Branch Select)" },
                        ]
                    }
                ],
            },
        },
    };
    try {
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] CBSE SubMenu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] CBSE Branch Sub-Menu sent to ${to} for ${branchId}`);
    } catch (error) {
        handleApiError(error, `CBSE Branch Sub-Menu to ${to}`);
    }
}

export async function sendDPharmaSubMenu(to) {
    const imageCaption = getLocalizedText(to, 'DPHARMA_HEADER'); // Use the department name as a short caption
    const lang = userLanguageState[to] || 'en';
    // Send up to two images (representative) and record them so tours skip duplicates
    try {
        const imgs = (Array.isArray(DPharmacy_lab_img) && DPharmacy_lab_img.filter(i => i.type === 'image')) || [];
        const toSend = imgs.slice(0, 2);
        for (const img of toSend) {
            try {
                const cap = (img.caption && (img.caption[lang] || img.caption['en'])) || imageCaption;
                await sendMediaMessage(to, img.id, cap, 'image', false, img.url);
                try { if (!userSentMedia[to]) userSentMedia[to] = new Set(); userSentMedia[to].add(String(img.id)); } catch(e) {}
            } catch (e) { console.warn('[WARN] Failed to send D.Pharmacy submenu image', e); }
        }
    } catch (err) { console.warn('[WARN] D.Pharmacy submenu image sending failed', err); }
    const listMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'DPHARMA_HEADER') },
            body: { text: getLocalizedText(to, 'DPHARMA_BODY') },
            
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON'),
                sections: [
                    {
                        title: getLocalizedText(to, 'SECTION_PROGRAMS').substring(0, 24),
                        rows: [
                            { id: "info_dpharma_details", title: (lang === 'en' ? "Course Details & Fees" : "कोर्स विवरण और शुल्क").substring(0, 24) },
                        ],
                    },
                    {
                        title: getLocalizedText(to, 'SECTION_SUPPORT').substring(0, 24),
                        rows: [
                            { id: "url_dpharma_web", title: (lang === 'en' ? "🌐 Website Link" : "🌐 वेबसाइट लिंक").substring(0, 24) }, 
                            { id: "info_dpharma_contact", title: (lang === 'en' ? "Contact Admissions Team" : "एडमिशन टीम से संपर्क").substring(0, 24) },
                            { id: "info_dpharma_eligibility_start", title: (lang === 'en' ? "Check Eligibility" : "पात्रता जाँच").substring(0, 24) },
                            { id: "media_dpharma", title: (lang === 'en' ? "🖼️ View Labs/Campus" : "🖼️ लैब/कैंपस देखें").substring(0, 24) },
                            { id: "menu_dpharma_prospectus", title: (lang === 'en' ? "📄 Download Prospectus" : "📄 प्रॉस्पेक्टस डाउनलोड करें").substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },

                            { id: "menu_main", title: getLocalizedText(to, 'VIEW_ALL_PROGRAMS').substring(0, 24) },
                        ],
                    },
                ],
            },
        },
    };
    try {
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] DPharma SubMenu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] DPharma Sub-Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `DPharma Sub-Menu to ${to}`);
    }
}

export async function sendNursingCoursesMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const listMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list", header: { type: "text", text: getLocalizedText(to, 'NURSING_HEADER') + " - Courses" },
            body: { text: getLocalizedText(to, 'NURSING_COURSES') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: (lang === 'en' ? "Select Course" : "कोर्स चुनें"),
                sections: [
                    {
                        title: (lang === 'en' ? "Degree & Diploma" : "डिग्री और डिप्लोमा").substring(0, 24),
                        rows: [
                            { id: "info_nursing_course_BSc", title: getLocalizedText(to, 'NURSING_BSc_INFO').substring(0, 24) },
                            { id: "info_nursing_course_PBBSc", title: getLocalizedText(to, 'NURSING_PBBSc_INFO').substring(0, 24) },
                            { id: "info_nursing_course_GNM", title: getLocalizedText(to, 'NURSING_GNM_INFO').substring(0, 24) },
                        ],
                    },
                    {
                        title: (lang === 'en' ? "Postgraduate Program" : "स्नातकोत्तर प्रोग्राम").substring(0, 24),
                        rows: [
                            { id: "info_nursing_course_MSc", title: getLocalizedText(to, 'NURSING_MSc_INFO').substring(0, 24) },
                        ],
                    },
                    {
                        title: (lang === 'en' ? "Navigation" : "नेविगेशन").substring(0, 24),
                        rows: [
                            { id: "menu_nursing", title: getLocalizedText(to, 'BACK_BUTTON').substring(0, 24) + " (Nursing Menu)" },
                        ],
                    },
                ],
            },
        },
    };
    try {
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] Nursing Courses Menu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Nursing Courses Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Nursing Courses Menu to ${to}`);
    }
}

export async function sendNursingSubMenu(to) {
    const lang = userLanguageState[to] || 'en';
    // Show nursing department image before the submenu
    const nursingImageCaption = getLocalizedText(to, 'NURSING_HEADER');
    await sendMediaMessage(to, ID_IMAGE_NURSING, nursingImageCaption, 'image', false, Nursing_lab_img);
    const listMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list", header: { type: "text", text: getLocalizedText(to, 'NURSING_HEADER') },
            body: { text: getLocalizedText(to, 'NURSING_BODY') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON'),
                sections: [
                    {
                        title: getLocalizedText(to, 'SECTION_PROGRAMS').substring(0, 24),
                        rows: [
                            { id: "menu_nursing_courses_list", title: (lang === 'en' ? "View All Courses" : "सभी कोर्स देखें").substring(0, 24) },
                            { id: "info_nursing_admissions", title: (lang === 'en' ? "Eligibility & Fees" : "पात्रता और शुल्क").substring(0, 24) },
                        ],
                    },
                    {
                        title: getLocalizedText(to, 'SECTION_SUPPORT').substring(0, 24),
                        rows: [
                            { id: "url_nursing_web", title: (lang === 'en' ? "🌐 Website Link" : "🌐 वेबसाइट लिंक").substring(0, 24) },
                            { id: "info_nursing_contact", title: getLocalizedText(to, 'NURSING_CONTACT_TITLE').substring(0, 24) },
                            { id: "info_nursing_eligibility_start", title: (lang === 'en' ? "Check Eligibility" : "पात्रता जाँच").substring(0, 24) },
                            { id: "media_nursing", title: (lang === 'en' ? "🖼️ View Labs/Campus" : "🖼️ लैब/कैंपस देखें").substring(0, 24) },
                            { id: "menu_nursing_prospectus", title: (lang === 'en' ? "📄 Download Prospectus" : "📄 प्रॉस्पेक्टस डाउनलोड करें").substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },
                            { id: "menu_main", title: getLocalizedText(to, 'VIEW_ALL_PROGRAMS').substring(0, 24) },
                        ],
                    },
                ],
            },
        },
    };
    try {
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] Nursing SubMenu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Nursing Sub-Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Nursing Sub-Menu to ${to}`);
    }
}

export async function sendParamedicalCoursesMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const listMessage = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'PARAMED_HEADER') + " - Courses" },
            body: { text: getLocalizedText(to, 'PARAMED_COURSES') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: (lang === 'en' ? "Select Type" : "प्रकार चुनें").substring(0, 20),
                sections: [
                    {
                        title: (lang === 'en' ? "Health Programs" : "स्वास्थ्य प्रोग्राम").substring(0, 24), 
                        rows: [
                            { id: "info_paramed_course_Diploma", title: getLocalizedText(to, 'PARAMED_DIPLOMA_INFO').substring(0, 24) },
                            { id: "info_paramed_course_Degree", title: getLocalizedText(to, 'PARAMED_DEGREE_INFO').substring(0, 24) },
                        ],
                    },
                    {
                        title: (lang === 'en' ? "Navigation" : "नेविगेशन").substring(0, 24),
                        rows: [
                            { id: "menu_paramedical", title: (getLocalizedText(to, 'BACK_BUTTON') + " (Paramedical)").substring(0, 24) },
                        ],
                    },
                ],
            },
        },
    };
    try {
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Paramedical Courses Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Paramedical Courses Menu to ${to}`);
    }
}

export async function sendParamedicalSubMenu(to) {
    const lang = userLanguageState[to] || 'en';
    // Show paramedical department image before the submenu
    const paramedImageCaption = getLocalizedText(to, 'PARAMED_HEADER');
    // Send up to two paramedical images and record them
    try {
        const imgs = (Array.isArray(Paramedical_lab_img) && Paramedical_lab_img.filter(i => i.type === 'image')) || [];
        const toSend = imgs.slice(0, 2);
        for (const img of toSend) {
            try {
                const cap = (img.caption && (img.caption[lang] || img.caption['en'])) || paramedImageCaption;
                await sendMediaMessage(to, img.id, cap, 'image', false, img.url);
                try { if (!userSentMedia[to]) userSentMedia[to] = new Set(); userSentMedia[to].add(String(img.id)); } catch(e) {}
            } catch (e) { console.warn('[WARN] Failed to send Paramedical submenu image', e); }
        }
    } catch (err) {
        console.warn('[WARN] Failed to send Paramedical department images', err.message || err);
    }
    const listMessage = {
        messaging_product: "whatsapp", to: to, type: "interactive",
        interactive: {
            type: "list", header: { type: "text", text: getLocalizedText(to, 'PARAMED_HEADER') },
            body: { text: getLocalizedText(to, 'PARAMED_BODY') },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON'),
                sections: [
                    {
                        title: getLocalizedText(to, 'SECTION_PROGRAMS').substring(0, 24),
                        rows: [
                            { id: "menu_paramedical_courses_list", title: (lang === 'en' ? "View All Courses" : "सभी कोर्स देखें").substring(0, 24) },
                            { id: "info_paramed_facilities", title: (lang === 'en' ? "Eligibility & Facilities" : "पात्रता और सुविधाएँ").substring(0, 24) },
                        ],
                    },
                    {
                        title: getLocalizedText(to, 'SECTION_SUPPORT').substring(0, 24),
                        rows: [
                            { id: "url_paramed_web", title: (lang === 'en' ? "🌐 Website Link" : "🌐 वेबसाइट लिंक").substring(0, 24) },
                            { id: "info_paramed_contact", title: getLocalizedText(to, 'PARAMED_CONTACT_TITLE').substring(0, 24) },
                            { id: "info_paramed_eligibility_start", title: (lang === 'en' ? "Check Eligibility" : "पात्रता जाँच").substring(0, 24) },
                            { id: "media_paramedical", title: (lang === 'en' ? "🖼️ View Labs/Campus" : "🖼️ लैब/कैंपस देखें").substring(0, 24) },
                            { id: "menu_paramedical_prospectus", title: (lang === 'en' ? "📄 Download Prospectus" : "📄 प्रॉस्पेक्टस डाउनलोड करें").substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },
                            { id: "menu_main", title: getLocalizedText(to, 'VIEW_ALL_PROGRAMS').substring(0, 24) },
                        ],
                    },
                ],
            },
        },
    };
    try {
        try { ensureUniqueRowIds(listMessage); const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []); console.log('[DEBUG] Paramedical SubMenu row IDs:', rows.map(r => r.id)); } catch(e) {}
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Paramedical Sub-Menu sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Paramedical Sub-Menu to ${to}`);
    }
}


// ----------------- ELIGIBILITY LOGIC (Exported Handlers) -----------------

export async function sendEligibilityPrompt(from, parentMenuId) {
    eligibilityState[from] = { state: 'stream', parentMenuId: parentMenuId };
    const promptText = getLocalizedText(from, 'ELIGIBILITY_PROMPT_STREAM');
    const buttonMessage = {
        messaging_product: "whatsapp", to: from, type: "interactive",
        interactive: {
            type: "button", body: { text: promptText },
            action: { buttons: [{ type: "reply", reply: { title: getLocalizedText(from, 'BACK_BUTTON').substring(0, 20), id: parentMenuId } }] },
        },
    };
    try {
        await axios.post(API_URL, buttonMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Eligibility Stream Prompt sent to ${from}`);
    } catch (error) {
        handleApiError(error, `Eligibility Stream Prompt to ${from}`);
    }
}

export async function handleEligibilityInput(incomingText, from) {
    let currentState = eligibilityState[from];
    let resultMessage = '';

    if (!currentState) {
        await sendTextMessage(from, getLocalizedText(from, 'GENERAL_SUPPORT'));
        await sendMainMenu(from);
        return;
    }

    const parentMenuId = currentState.parentMenuId || 'menu_nursing';

    if (currentState.state === 'stream') {
        const stream = incomingText ? incomingText.toLowerCase().trim() : '';
        const validStreams = ['science', 'arts', 'commerce'];

        if (validStreams.some(s => stream.includes(s))) {
            eligibilityState[from] = { state: 'marks', stream: stream, parentMenuId: parentMenuId };
            const nextPrompt = getLocalizedText(from, 'ELIGIBILITY_PROMPT_SCORE');
            await sendTextMessage(from, nextPrompt);
        } else {
            resultMessage = getLocalizedText(from, 'ELIGIBILITY_INVALID_STREAM');
            await sendTextMessage(from, resultMessage);
            await sendEligibilityPrompt(from, parentMenuId);
        }
        return;

    } else if (currentState.state === 'marks') {
        const scoreString = incomingText.replace(/[^\d.,]/g, '');
        const score = parseFloat(scoreString);
        const stream = currentState.stream;

        if (isNaN(score)) {
            resultMessage = getLocalizedText(from, 'ELIGIBILITY_INVALID_SCORE');
        } else if (stream.includes('science')) {
            if (score >= 50) { resultMessage = getLocalizedText(from, 'ELIGIBILITY_RESULT_SCIENCE'); } 
            else { resultMessage = getLocalizedText(from, 'ELIGIBILITY_RESULT_LOW'); }
        } else if (stream.includes('arts') || stream.includes('commerce')) {
            if (score >= 40) { resultMessage = getLocalizedText(from, 'ELIGIBILITY_RESULT_ARTS_COMMERCE'); } 
            else { resultMessage = getLocalizedText(from, 'ELIGIBILITY_RESULT_LOW'); }
        } else {
            resultMessage = getLocalizedText(from, 'ELIGIBILITY_RESULT_LOW');
        }

        await sendTextMessage(from, resultMessage);
        delete eligibilityState[from];
        await sendNextStepMenu(from, parentMenuId);
        return;
    }
}


// ----------------- REPLY HANDLER & ROUTER (Main Logic) -----------------

export async function sendDetailedResponseAndNextStep(from, detail, parentMenuId = 'menu_main') {
    await sendTextMessage(from, detail.text);
    await sendNextStepMenu(from, parentMenuId);
}


// FIX: Defined sendExploreMenu inside whatsapp-api.js
async function sendExploreMenu(to, parentMenuId) {
    const lang = userLanguageState[to] || 'en';
    // Register social URLs and use their short stable IDs for row ids
    const idFb = registerUrl(URL_SOCIAL_FB);
    const idInsta = registerUrl(URL_SOCIAL_INSTA);
    const idYt = registerUrl(URL_SOCIAL_YOUTUBE);
    const idLi = registerUrl(URL_SOCIAL_LINKEDIN);

    const listMessage = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'EXPLORE_BODY').substring(0, 60) },
            body: {
                text: (lang === 'en' ? "Select a platform below to explore our presence." : "हमारी उपस्थिति जानने के लिए नीचे एक प्लेटफॉर्म चुनें।"),
            },
            footer: { text: getLocalizedText(to, 'NEXT_STEP_FOOTER') },
            action: {
                button: (lang === 'en' ? "View Links" : "लिंक्स देखें"),
                sections: [
                    {
                        title: (lang === 'en' ? "Connect & Learn" : "जुड़ें और जानकारी लें").substring(0, 24),
                        rows: [
                            { id: idFb, title: getLocalizedText(to, 'EXPLORE_FB').substring(0, 24) },
                            { id: idInsta, title: getLocalizedText(to, 'EXPLORE_INSTA').substring(0, 24) },
                            { id: idYt, title: getLocalizedText(to, 'EXPLORE_YOUTUBE').substring(0, 24) },
                            { id: idLi, title: getLocalizedText(to, 'EXPLORE_LINKEDIN').substring(0, 24) },
                        ],
                    },
                    {
                        title: (lang === 'en' ? "Navigation" : "नेविगेशन").substring(0, 24),
                        rows: [
                            { id: parentMenuId, title: getLocalizedText(to, 'BACK_BUTTON').substring(0, 24) + " (Previous Menu)" },
                            { id: 'menu_main', title: "Main Menu 🎓" },
                        ],
                    },
                ],
            },
        },
    };

    try {
        // Debug: log row IDs that will be sent (helps diagnose duplication after API normalization)
        try {
            const rows = listMessage.interactive.action.sections.flatMap(s => s.rows || []);
            console.log('[DEBUG] Explore Menu row IDs:', rows.map(r => r.id));
        } catch (e) { /* ignore debug failure */ }
        // Make sure IDs are unique after registration (prevents API duplicate id errors)
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Explore Menu (List) sent to ${to}`);
    } catch (error) {
        handleApiError(error, `Explore Menu to ${to}`);
    }
}


export async function handleSubMenuSelection(selectionId, from) {
    const lang = userLanguageState[from] || 'en';

    // --- 1. URL Handler ---
    if (selectionId.startsWith("open_url_")) {
        let url = URL_REGISTRY.get(selectionId);
        if (!url) {
            console.warn(`[WARN] open_url id ${selectionId} not found in registry`);
            // Try a best-effort lookup by suffix (strip 'open_url_' and match registered values)
            try {
                const suffix = selectionId.replace('open_url_', '');
                for (const [k, v] of URL_REGISTRY.entries()) {
                    if (k.endsWith(suffix) || (v && v.includes(suffix))) { url = v; break; }
                }
            } catch (e) { /* ignore */ }
        }
        if (!url) {
            // Final fallback: send a helpful message and show the core links for the user to click
            const help = (lang === 'en') ? `🔗 Link unavailable directly. You can visit our website: ${URL_WEB_CBSE} or social profiles via the menu.` : `🔗 लिंक सीधे उपलब्ध नहीं है। आप हमारी वेबसाइट पर जाएँ: ${URL_WEB_CBSE} या मेनू के माध्यम से सोशल प्रोफाइल देखें।`;
            await sendTextMessage(from, help);
            await sendNextStepMenu(from, 'menu_main');
            return;
        }
        await sendTextMessage(from, (lang === 'en' ? `🔗 Click to open: ${url}` : `🔗 खोलने के लिए क्लिक करें: ${url}`));
        await sendNextStepMenu(from, 'menu_main'); 
        return;
    }
    // --- Language Change Handler ---
    else if (selectionId === "lang_en") { userLanguageState[from] = 'en'; await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_EN')); await sendMainMenu(from); return;}
    else if (selectionId === "lang_hi") { userLanguageState[from] = 'hi'; await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_HI')); await sendMainMenu(from); return;}
    else if (selectionId === "menu_lang_select_quick") { 
         await sendLanguageSelectionMenu(from); return;
    }

    // --- 2. MEDIA TOUR ROUTING ---
    if (selectionId.startsWith("media_")) {
        const mediaKey = selectionId.split('_')[1]; let parentMenuId = ''; let courseName = ''; let mediaArray = UNIVERSAL_CAMPUS_TOUR;
        if (mediaKey === 'school') { courseName = (lang === 'en' ? "CBSE School Campus" : "सीबीएसई स्कूल कैंपस"); parentMenuId = 'menu_cbse'; }
        else if (mediaKey === 'events') { courseName = getLocalizedText(from, 'EVENTS_SPORTS_TITLE'); parentMenuId = 'menu_main'; mediaArray = EVENTS_SPORTS_TOUR; }
        else if (mediaKey === 'dpharma') { courseName = (lang === 'en' ? "D.Pharmacy" : "डी.फार्मेसी"); parentMenuId = 'menu_dpharma'; }
        else if (mediaKey === 'nursing') { courseName = (lang === 'en' ? "Nursing Dept." : "नर्सिंग विभाग"); parentMenuId = 'menu_nursing'; }
        else if (selectionId === 'menu_explore') { // Handle 'Explore' submenu 
            await sendExploreMenu(from, parentMenuId); 
            return;
        }
        else if (mediaKey === 'paramedical') { courseName = (lang === 'en' ? "Paramedical" : "पैरामेडिकल"); parentMenuId = 'menu_paramedical'; }
        if (courseName) { await sendCourseMedia(from, mediaArray, courseName, parentMenuId); return; }
    }

    // --- 3. MENU ITEM ROUTING ---
    if (selectionId.startsWith("menu_") && !selectionId.includes("_fees") && !selectionId.includes("_docs") && !selectionId.includes("_admission")) {
        switch (selectionId) {
            case "menu_main": await sendMainMenu(from); return;
            case "menu_cbse": await sendCbsiBranchSelection(from); return;
            case "menu_cbse_pn": await sendCbsiSubMenu(from, 'menu_cbse_pn'); return;
            case "menu_cbse_ps": await sendCbsiSubMenu(from, 'menu_cbse_ps'); return;
            case "menu_nursing": await sendNursingSubMenu(from); return;
            case "menu_nursing_courses_list": await sendNursingCoursesMenu(from); return; 
            case "menu_paramedical": await sendParamedicalSubMenu(from); return;
            case "menu_paramedical_courses_list": await sendParamedicalCoursesMenu(from); return; 
            case "menu_dpharma": await sendDPharmaSubMenu(from); return;
            case "menu_hospital": await sendDetailedResponseAndNextStep(from, {text: getLocalizedText(from, 'HOSPITAL_TEXT')}, 'menu_main'); return;
            case "menu_helpdesk":
                const helpdeskText = getLocalizedText(from, 'HELPDESK_TEXT');
                await sendTextMessage(from, helpdeskText);
                await sendLinkButtonMessage(from, (lang === 'en' ? "Click below to download the Prospectus." : "प्रॉस्पेक्टस डाउनलोड करने के लिए नीचे क्लिक करें।"), URL_BASE_PROSPECTUS, (lang === 'en' ? "Download Prospectus" : "प्रॉस्पेक्टस डाउनलोड करें"), null, null, 'menu_main');
                return;
            case "menu_nursing_prospectus":
                await sendLinkButtonMessage(from, (lang === 'en' ? "Download the Nursing prospectus below." : "नर्सिंग प्रॉस्पेक्टस नीचे डाउनलोड करें।"), URL_BASE_PROSPECTUS, (lang === 'en' ? "Download Prospectus" : "प्रॉस्पेक्टस डाउनलोड करें"), URL_ADMISSION_FORM, (lang === 'en' ? "Apply Now" : "अभी आवेदन करें"), 'menu_nursing');
                return;
            case "menu_paramedical_prospectus":
                await sendLinkButtonMessage(from, (lang === 'en' ? "Download the Paramedical prospectus below." : "पैरामेडिकल प्रॉस्पेक्टस नीचे डाउनलोड करें।"), URL_BASE_PROSPECTUS, (lang === 'en' ? "Download Prospectus" : "प्रॉस्पेक्टस डाउनलोड करें"), URL_ADMISSION_FORM, (lang === 'en' ? "Apply Now" : "अभी आवेदन करें"), 'menu_paramedical');
                return;
            case "menu_dpharma_prospectus":
                await sendLinkButtonMessage(from, (lang === 'en' ? "Download the D.Pharmacy prospectus below." : "डी.फार्मेसी प्रॉस्पेक्टस नीचे डाउनलोड करें।"), URL_BASE_PROSPECTUS, (lang === 'en' ? "Download Prospectus" : "प्रॉस्पेक्टस डाउनलोड करें"), URL_ADMISSION_FORM, (lang === 'en' ? "Apply Now" : "अभी आवेदन करें"), 'menu_dpharma');
                return;
            case "menu_explore": 
                await sendExploreMenu(from, 'menu_main'); 
                return;
            default: console.log(`[WARNING] Unrecognized selection ID: ${selectionId}`); await sendTextMessage(from, getLocalizedText(from, 'UNKNOWN_OPTION')); await sendMainMenu(from); return;
        }
    }

    // --- 4. INFO REPLIES (The deep dive links) ---

    else if (selectionId === "contact_admissions_direct") { await sendAdmissionContact(from, "Admissions", "+91 83868 22849", "info@stechbhl.in", 'menu_main'); return;}
    else if (selectionId === "info_hostel") { await sendHostelInfo(from, 'menu_main'); return;}

    // CBSE Branch Info Replies
    else if (selectionId.startsWith("menu_cbse_pn_") || selectionId.startsWith("menu_cbse_ps_")) {
        const branchId = selectionId.substring(0, selectionId.lastIndexOf('_')); 
        const infoType = selectionId.substring(selectionId.lastIndexOf('_') + 1); 
        const parentMenuId = branchId;
        const docsMessage = getLocalizedText(from, 'CBSE_DOCUMENTS');
        const feesMessage = getLocalizedText(from, branchId === 'menu_cbse_pn' ? 'CBSE_FEES_PN' : 'CBSE_FEES_PS');
        const feeUrl = branchId === 'menu_cbse_pn' ? URL_CBSE_FEES_PN_DETAIL : URL_CBSE_FEES_PS_DETAIL;

        switch (infoType) {
            case "fees": await sendLinkButtonMessage(from, feesMessage, feeUrl, (lang === 'en' ? "View Fee Doc" : "शुल्क दस्तावेज़ देखें"), URL_CBSE_FEES_GENERAL, (lang === 'en' ? "Website Fees" : "वेबसाइट शुल्क"), parentMenuId); return;
            case "docs": await sendDetailedResponseAndNextStep(from, {text: docsMessage}, parentMenuId); return;
            case "admission": await sendLinkButtonMessage(from, getLocalizedText(from, 'CBSE_ADMISSIONS_TITLE'), URL_ADMISSION_FORM, (lang === 'en' ? "Apply Now (Form)" : "अभी आवेदन करें (फॉर्म)"), URL_CBSE_FEES_GENERAL, (lang === 'en' ? "School Page" : "स्कूल पेज"), parentMenuId); return;
            default: await sendCbsiSubMenu(from, branchId); return;
        }
    }
    // New CBSE Website Link Handler
    else if (selectionId === "url_cbse_web") {
        await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our CBSE School's official website for full academic details." : "पूर्ण शैक्षणिक विवरण के लिए हमारे सीबीएसई स्कूल की आधिकारिक वेबसाइट पर जाएँ।"), URL_WEB_CBSE, (lang === 'en' ? "Go to Website" : "वेबसाइट पर जाएँ"), null, null, 'menu_cbse');
        return;
    }


    // Social Media Link Routing (Includes Dept Websites)
    else if (selectionId.startsWith("url_")) {
        let url = 'https://www.stechbhl.in/'; let title = getLocalizedText(from, 'VIEW_ALL_PROGRAMS'); let body = (lang === 'en' ? "Click the button to visit the chosen platform." : "पसंदीदा प्लेटफॉर्म पर जाने के लिए बटन पर क्लिक करें।");
        let parentMenu = 'menu_explore'; 

        if (selectionId === "url_dpharma_web") {
            await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our D.Pharmacy program page." : "हमारे डी.फार्मेसी प्रोग्राम पेज पर जाएँ।"), URL_WEB_DPHARMA, (lang === 'en' ? "D.Pharma Website" : "वेबसाइट"), null, null, 'menu_dpharma'); return;
        } else if (selectionId === "url_nursing_web") {
            await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our Nursing program page." : "हमारे नर्सिंग प्रोग्राम पेज पर जाएँ।"), URL_WEB_NURSING, (lang === 'en' ? "Nursing Website" : "वेबसाइट"), null, null, 'menu_nursing'); return;
        } else if (selectionId === "url_paramed_web") {
            await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our Paramedical program page." : "हमारे पैरामेडिकल प्रोग्राम पेज पर जाएँ।"), URL_WEB_PARAMEDICAL, (lang === 'en' ? "Paramedical Website" : "वेबसाइट"), null, null, 'menu_paramedical'); return;
        } 
        
        switch (selectionId) {
            case 'url_fb': url = URL_SOCIAL_FB; title = getLocalizedText(from, 'EXPLORE_FB'); break;
            case 'url_insta': url = URL_SOCIAL_INSTA; title = getLocalizedText(from, 'EXPLORE_INSTA'); break;
            case 'url_yt': url = URL_SOCIAL_YOUTUBE; title = getLocalizedText(from, 'EXPLORE_YOUTUBE'); break;
            case 'url_li': url = URL_SOCIAL_LINKEDIN; title = getLocalizedText(from, 'EXPLORE_LINKEDIN'); break;
            default: break;
        }
        await sendLinkButtonMessage(from, body, url, (lang === 'en' ? `Open ${title}` : `${title} खोलें`), null, null, parentMenu); return;
    }

    // D.Pharma Sub-Menu Replies
    else if (selectionId.startsWith("info_dpharma")) {
        const parentMenuId = 'menu_dpharma';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        switch (selectionId) {
            case "info_dpharma_details": await sendLinkButtonMessage(from, getLocalizedText(from, 'DPHARMA_DETAILS'), detailUrl, (lang === 'en' ? "View Course Doc" : "कोर्स दस्तावेज़ देखें"), URL_WEB_DPHARMA, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "info_dpharma_contact": await sendAdmissionContact(from, lang === 'en' ? "D.Pharmacy" : "डी.फार्मेसी", "+91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "info_dpharma_eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            default: await sendDPharmaSubMenu(from); return;
        }
    }

    // Nursing Sub-Menu Replies (Handles Course Details)
    else if (selectionId.startsWith("info_nursing")) {
        const parentMenuId = 'menu_nursing';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        const courseId = selectionId.substring(selectionId.lastIndexOf('_') + 1); 
        let descKey = '';
        let backMenu = "menu_nursing_courses_list";

        switch (courseId) {
            case "admissions": await sendLinkButtonMessage(from, getLocalizedText(from, 'NURSING_ADMISSIONS'), detailUrl, (lang === 'en' ? "View Eligibility & Fees" : "पात्रता और शुल्क देखें"), URL_WEB_NURSING, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "contact": await sendAdmissionContact(from, lang === 'en' ? "Nursing" : "नर्सिंग", "+91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            case "BSc": descKey = 'NURSING_BSc_DESC'; break;
            case "PBBSc": descKey = 'NURSING_PBBSc_DESC'; break;
            case "GNM": descKey = 'NURSING_GNM_DESC'; break;
            case "MSc": descKey = 'NURSING_MSc_DESC'; break;
            default: await sendNursingSubMenu(from); return;
        }

        if (descKey) {
            await sendLinkButtonMessage(
                from,
                getLocalizedText(from, descKey),
                detailUrl,
                (lang === 'en' ? `View Course Doc` : `कोर्स दस्तावेज़ देखें`),
                URL_WEB_NURSING,
                (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"),
                backMenu
            );
            return;
        }
    }

    // Paramedical Sub-Menu Replies (Handles Course Details)
    else if (selectionId.startsWith("info_paramed")) {
        const parentMenuId = 'menu_paramedical';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        const courseId = selectionId.substring(selectionId.lastIndexOf('_') + 1);

        let descKey = '';
        let backMenu = "menu_paramedical_courses_list";

        switch (courseId) {
            case "facilities": await sendLinkButtonMessage(from, getLocalizedText(from, 'PARAMED_FACILITIES'), detailUrl, (lang === 'en' ? "View Course Doc" : "कोर्स दस्तावेज़ देखें"), URL_WEB_PARAMEDICAL, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "contact": await sendAdmissionContact(from, lang === 'en' ? "Paramedical" : "पैरामेडिकल", "+91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            case "Diploma": descKey = 'PARAMED_DIP_DESC'; break;
            case "Degree": descKey = 'PARAMED_DEGREE_DESC'; break;
            default: await sendParamedicalSubMenu(from); return;
        }

        if (descKey) {
            await sendLinkButtonMessage(
                from,
                getLocalizedText(from, descKey),
                detailUrl,
                (lang === 'en' ? `View Course Doc` : `कोर्स दस्तावेज़ देखें`),
                URL_WEB_PARAMEDICAL,
                (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"),
                backMenu
            );
            return;
        }
    }


    // Final catch-all for unknown IDs
    console.log(`[WARNING] Unrecognized selection ID (Final Catch-All): ${selectionId}`);
    await sendTextMessage(from, getLocalizedText(from, 'UNKNOWN_OPTION'));
    await sendMainMenu(from);
}
