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
    ID_IMAGE_DPHARMA,
    ID_IMAGE_PARAMED,
    ID_IMAGE_NURSING,
    URL_IMAGE_PARAMED2,
    ID_IMAGE_PARAMED2,
    ID_NEWS_CBSE_1,
    ID_NEWS_CBSE_2,
    URL_NEWS_CBSE_1,
    URL_NEWS_CBSE_2,
    ID_NEWS_PARAMED_1,
    ID_NEWS_PARAMED_2,
    URL_NEWS_PARAMED_1,
    URL_NEWS_PARAMED_2,
    ID_NEWS_NURSING_1,
    ID_NEWS_NURSING_2,
    URL_NEWS_NURSING_1,
    URL_NEWS_NURSING_2,
    ID_NEWS_DPHARMA_1,
    ID_NEWS_DPHARMA_2,
    URL_NEWS_DPHARMA_1,
    URL_NEWS_DPHARMA_2,
    URL_IMAGE_NURSING,
    URL_IMAGE_PARAMED, // if needed
} from "./constants.js";

// --- LANGUAGE & FLOW STATES ---
export const userLanguageState = {};
export const eligibilityState = {};
const userSentMedia = {}; // track sent media per user to avoid duplicates if needed

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
preRegisterKnownUrls();

// Helper: stable short id for URL
function registerUrl(url) {
    const fullHash = crypto.createHash('sha1').update(url).digest('hex');
    for (let len = 8; len <= fullHash.length; len++) {
        const candidate = `open_url_${fullHash.substring(0, len)}`;
        const existing = URL_REGISTRY.get(candidate);
        if (!existing) {
            URL_REGISTRY.set(candidate, url);
            return candidate;
        }
        if (existing === url) return candidate;
        // collision -> try longer prefix
    }
    // fallback numeric suffix
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
        i++;
    }
}

// Ensure list row IDs are unique (append suffixes if duplicates)
function ensureUniqueRowIds(listMessage) {
    try {
        const seen = new Set();
        const sections = listMessage?.interactive?.action?.sections || [];
        for (const section of sections) {
            if (!Array.isArray(section.rows)) continue;
            for (const row of section.rows) {
                let id = String(row.id || '');
                if (!id) continue;
                if (seen.has(id)) {
                    let i = 1;
                    let newId = `${id}_${i}`;
                    while (seen.has(newId)) { i++; newId = `${id}_${i}`; }
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

// --- UTILITIES ---
export function getLocalizedText(waId, key, replacements = {}) {
    const lang = userLanguageState[waId] || 'en';
    let text;
    if (MESSAGES && MESSAGES[key]) {
        text = MESSAGES[key][lang] || MESSAGES[key]['en'] || '';
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
    if (error?.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
        if (error.response.data?.error?.error_data?.details) {
            console.error("Error Details:", error.response.data.error.error_data.details);
        }
    } else {
        console.error("Message:", error?.message || error);
    }
    console.error("-------------");
}

export async function sendTextMessage(to, text) {
    try {
        await axios.post(
            API_URL,
            { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
            { headers: WHATSAPP_HEADERS }
        );
    } catch (error) {
        handleApiError(error, `Text message to ${to}`);
    }
}

/**
 * Send media (image/video). finalUrl resolution:
 * - if precomputedUrl provided -> use it
 * - else if isUrl true -> mediaIdOrUrl is an url
 * - else assume mediaIdOrUrl is a Google Drive ID and build download link
 */
export async function sendMediaMessage(to, mediaIdOrUrl, caption = '', type = 'image', isUrl = false, precomputedUrl = null) {
    let finalUrl = precomputedUrl || (isUrl ? mediaIdOrUrl : `${GOOGLE_DRIVE_BASE_URL}${mediaIdOrUrl}`);
    try {
        const parsed = new URL(finalUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Non-HTTP protocol');
    } catch (err) {
        finalUrl = `${GOOGLE_DRIVE_BASE_URL}${mediaIdOrUrl}`;
    }

    // Build payload so WhatsApp Cloud API receives media object with caption inside
    const payload = {
        messaging_product: "whatsapp",
        to,
        type,
    };
    payload[type] = { link: finalUrl };
    if (caption) payload[type].caption = caption;

    try {
        await axios.post(API_URL, payload, { headers: WHATSAPP_HEADERS });
        console.log(`[SUCCESS] Media (${type}) sent to ${to} from ${finalUrl}`);
    } catch (error) {
        handleApiError(error, `Media (${type}) to ${to}`);
        const lang = userLanguageState[to] || 'en';
        const prefix = (lang === 'en')
            ? "⚠️ Media failed to send. Please check the file's public sharing link or contact support.\nFile ID:"
            : "⚠️ मीडिया भेजने में विफल रहा। कृपया फ़ाइल का सार्वजनिक साझाकरण लिंक जांचें या समर्थन से संपर्क करें।\nफ़ाइल आईडी:";
        const msg = `${prefix} ${mediaIdOrUrl}\nDescription: ${caption}\nLink attempted: ${finalUrl}`;
        await sendTextMessage(to, msg);
    }
}

// NOTE: sendCourseMedia calls handleSubMenuSelection and sendCbsiBranchSelection which are below
export async function sendCourseMedia(from, mediaArray, courseName, parentMenuId) {
    const lang = userLanguageState[from] || 'en';
    let startMessage = '';
    if (mediaArray === EVENTS_SPORTS_TOUR) {
        startMessage = getLocalizedText(from, 'EVENTS_SPORTS_BODY');
    } else {
        startMessage = (lang === 'en' ? `Starting ${courseName} tour now (Total ${mediaArray.length} items)...` : `${courseName} का टूर शुरू हो रहा है (कुल ${mediaArray.length} आइटम)...`);
    }
    await sendTextMessage(from, startMessage);

    for (const item of mediaArray) {
        const source = item && (item.id || item.url);
        if (!source) {
            console.warn(`[WARN] Skipping media item during tour because it has no id/url: ${JSON.stringify(item)}`);
            continue;
        }
        const isUrl = !!item.url;
        let captionText = '';
        try {
            if (item.caption && typeof item.caption === 'object') captionText = item.caption[userLanguageState[from] || 'en'] || item.caption['en'] || '';
        } catch (e) { captionText = ''; }
        await sendMediaMessage(from, item.id || item.url, captionText, item.type || 'image', isUrl, item.url);
    }

    if (courseName.includes("CBSE")) {
        await sendCbsiBranchSelection(from);
    } else {
        await handleSubMenuSelection(parentMenuId, from);
    }
}

export async function sendHostelInfo(from, parentMenuId) {
    const text = getLocalizedText(from, 'HOSTEL_BODY');
    // use real URL for image
    await sendMediaMessage(from, URL_IMAGE_HOSTEL || ID_IMAGE_HOSTEL, getLocalizedText(from, 'HOSTEL_TITLE'), 'image', true, URL_IMAGE_HOSTEL);
    await sendTextMessage(from, text);
    await sendNextStepMenu(from, parentMenuId);
}

export async function sendAdmissionContact(to, department, phone, email, parentMenuId) {
    const text = getLocalizedText(to, 'ADMISSIONS_DIRECT_TEXT');
    await sendDetailedResponseAndNextStep(to, { text }, parentMenuId);
}

export async function sendLanguageSelectionMenu(to) {
    const buttonMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "button", body: { text: getLocalizedText(to, 'LANGUAGE_PROMPT') },
            action: {
                buttons: [
                    { type: "reply", reply: { title: "English 🇬🇧", id: "lang_en" } },
                    { type: "reply", reply: { title: "Hindi (हिन्दी) 🇮🇳", id: "lang_hi" } }
                ]
            },
        },
    };
    try {
        await axios.post(API_URL, buttonMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Language Selection Menu to ${to}`);
        await sendTextMessage(to, "Welcome! Please choose your language by replying 'en' for English or 'hi' for Hindi.");
    }
}

// Next-step contextual menu
export async function sendNextStepMenu(to, parentMenuId) {
    const isMainMenu = parentMenuId === 'menu_main';
    const backButtonTitle = isMainMenu ? getLocalizedText(to, 'VIEW_ALL_PROGRAMS') : getLocalizedText(to, 'BACK_BUTTON');
    const backButtonId = isMainMenu ? "menu_main" : parentMenuId;
    const currentLang = userLanguageState[to] || 'en';
    const quickChangeId = currentLang === 'en' ? "lang_hi" : "lang_en";

    const nextStepMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
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
    } catch (error) {
        handleApiError(error, `Contextual Next Step Menu to ${to}`);
    }
}

export async function sendLinkButtonMessage(to, bodyText, primaryUrl, primaryButtonTitle, secondaryUrl, secondaryButtonTitle, parentMenuId) {
    const backButtonTitle = getLocalizedText(to, 'BACK_BUTTON');
    const backButtonId = parentMenuId;
    const lang = userLanguageState[to] || 'en';

    let fullBodyText = bodyText || '';
    if (primaryUrl) fullBodyText += `\n\n${primaryButtonTitle}: ${primaryUrl}`;
    if (secondaryUrl && secondaryButtonTitle) fullBodyText += `\n${secondaryButtonTitle}: ${secondaryUrl}`;

    const buttons = [];
    if (primaryUrl) {
        const id = registerUrl(primaryUrl);
        buttons.push({ type: "reply", reply: { title: primaryButtonTitle.substring(0, 20), id } });
    }
    if (secondaryUrl && secondaryButtonTitle) {
        const id2 = registerUrl(secondaryUrl);
        buttons.push({ type: "reply", reply: { title: secondaryButtonTitle.substring(0, 20), id: id2 } });
    }
    buttons.push({ type: "reply", reply: { title: backButtonTitle.substring(0, 20), id: backButtonId } });

    const linkButtonMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "button",
            body: { text: (fullBodyText || '').substring(0, 1024) },
            footer: { text: getLocalizedText(to, 'NEXT_STEP_FOOTER') },
            action: { buttons },
        },
    };

    try {
        await axios.post(API_URL, linkButtonMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Link Button Message to ${to}`);
        await sendTextMessage(to, fullBodyText);
        await sendNextStepMenu(to, parentMenuId);
    }
}

// ----------------- INTERACTIVE TEMPLATES -----------------
export async function sendMainMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const listMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Main Menu to ${to}`);
    }
}

export async function sendCbsiBranchSelection(to) {
    const buttonMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
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
    } catch (error) {
        handleApiError(error, `CBSE Branch Selection Menu to ${to}`);
    }
}

export async function sendCbsiSubMenu(to, branchId) {
    const lang = userLanguageState[to] || 'en';
    const isPatelNagar = branchId === 'menu_cbse_pn';
    const branchName = getLocalizedText(to, isPatelNagar ? 'CBSE_PATEL_NAGAR' : 'CBSE_PANSAL');
    const bodyKey = isPatelNagar ? 'CBSE_PATEL_NAGAR_BODY' : 'CBSE_PANSAL_BODY';
    const parentIdPrefix = branchId;

    // 🏫 Send CBSE Campus Video First
    try {
        const video = CBSE_lab_video[0];
        if (video?.url) {
            const caption = (video.caption && (video.caption[lang] || video.caption['en'])) 
                            || (lang === 'en' ? "🏫 CBSE Campus Overview" : "🏫 सीबीएसई कैंपस झलक");
            await sendMediaMessage(to, video.id || video.url, caption, 'video', !!video.url, video.url);
        }
    } catch (e) {
        console.warn('[WARN] Failed to send CBSE lab video', e);
    }

    // 🧾 Create List Message
    const listMessage = {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: `${branchName.substring(0, 24)} ${lang === 'en' ? "Details" : "विवरण"}`
            },
            body: { text: getLocalizedText(to, bodyKey) },
            footer: { text: getLocalizedText(to, 'WELCOME_FOOTER') },
            action: {
                button: getLocalizedText(to, 'MAIN_BUTTON').substring(0, 20),
                sections: [
                    {
                        title: getLocalizedText(to, 'CBSE_ADMISSIONS_TITLE').substring(0, 24),
                        rows: [
                            { id: "news_cbse", title: (lang === 'en' ? "📰 News" : "📰 समाचार").substring(0, 24) },
                            { id: `${parentIdPrefix}_fees`, title: getLocalizedText(to, 'CBSE_FEES_TITLE').substring(0, 24) },
                            { id: `${parentIdPrefix}_docs`, title: getLocalizedText(to, 'CBSE_DOCS_TITLE').substring(0, 24) },
                            { id: `${parentIdPrefix}_admission`, title: getLocalizedText(to, 'CBSE_ADMISSIONS_TITLE').substring(0, 24) },
                            { id: "media_school", title: (lang === 'en' ? "🖼️ View Labs/Campus" : "🖼️ लैब/कैंपस देखें").substring(0, 24) },
                            { id: "info_hostel", title: getLocalizedText(to, 'HOSTEL_TITLE').substring(0, 24) },
                        ],
                    },
                    {
                        title: getLocalizedText(to, 'SECTION_SUPPORT').substring(0, 24),
                        rows: [
                            { id: 'url_cbse_web', title: (lang === 'en' ? "🌐 School Website" : "🌐 स्कूल वेबसाइट").substring(0, 24) },
                            { id: 'menu_explore', title: (lang === 'en' ? "🔗 Social & Contacts" : "🔗 सोशल और संपर्क").substring(0, 24) },
                            { id: 'menu_cbse', title: (lang === 'en' ? "⬅️ Back (Branch Select)" : "⬅️ वापस (शाखा चुनें)").substring(0, 24) },
                        ],
                    },
                ],
            },
        },
    };

    //  Send List Message to User
    try {
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `CBSE Branch Sub-Menu to ${to}`);
    }
}


export async function sendDPharmaSubMenu(to) {
    const imageCaption = getLocalizedText(to, 'DPHARMA_HEADER');
    const lang = userLanguageState[to] || 'en';
    try {
        if (!Array.isArray(DPharmacy_lab_img)) throw new Error("DPharmacy_lab_img not found or invalid");

        // Separate images and videos
        const images = DPharmacy_lab_img.filter(i => i.type === 'image').slice(0, 2);
        const videos = DPharmacy_lab_img.filter(i => i.type === 'video').slice(0, 1);

        // Combine 2 images + 1 video
        const mediaToSend = [...images, ...videos];

        for (const media of mediaToSend) {
            try {
                const cap = (media.caption && (media.caption[lang] || media.caption['en'])) || imageCaption;
                await sendMediaMessage(
                    to,
                    media.id || media.url,
                    cap,
                    media.type,   // 'image' or 'video'
                    !!media.url,
                    media.url
                );
                if (!userSentMedia[to]) userSentMedia[to] = new Set();
                userSentMedia[to].add(String(media.id || media.url));
            } catch (e) {
                console.warn(`[WARN] Failed to send D.Pharmacy ${media.type}`, e);
            }
        }
    } catch (err) {
        console.warn('[WARN] D.Pharmacy submenu media sending failed', err);
    }

    const listMessage = {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
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
                            { id: "news_dpharma", title: (lang === 'en' ? "📰 News" : "📰 समाचार").substring(0, 24) },
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `DPharma Sub-Menu to ${to}`);
    }
}


export async function sendNursingCoursesMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const listMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Nursing Courses Menu to ${to}`);
    }
}

export async function sendNursingSubMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const nursingImageCaption = getLocalizedText(to, 'NURSING_HEADER');

    try {
        if (!Array.isArray(Nursing_lab_img)) throw new Error("Nursing_lab_img not found or invalid");

        // Separate images and videos
        const images = Nursing_lab_img.filter(i => i.type === 'image').slice(0, 2);
        const videos = Nursing_lab_img.filter(i => i.type === 'video').slice(0, 1);

        // Combine 2 images + 1 video
        const mediaToSend = [...images, ...videos];

        for (const media of mediaToSend) {
            try {
                const cap = (media.caption && (media.caption[lang] || media.caption['en'])) || nursingImageCaption;
                await sendMediaMessage(
                    to,
                    media.id || media.url,
                    cap,
                    media.type,   // 'image' or 'video'
                    !!media.url,
                    media.url
                );
                if (!userSentMedia[to]) userSentMedia[to] = new Set();
                userSentMedia[to].add(String(media.id || media.url));
            } catch (e) {
                console.warn(`[WARN] Failed to send Nursing ${media.type}`, e);
            }
        }
    } catch (err) {
        console.warn('[WARN] Nursing submenu media sending failed', err);
    }

    // --- List Message ---
    const listMessage = {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'NURSING_HEADER') },
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
                            { id: "news_nursing", title: (lang === 'en' ? "📰 News" : "📰 समाचार").substring(0, 24) },
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Nursing Sub-Menu to ${to}`);
    }
}


export async function sendParamedicalCoursesMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const listMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Paramedical Courses Menu to ${to}`);
    }
}

export async function sendParamedicalSubMenu(to) {
    const lang = userLanguageState[to] || 'en';
    const paramedImageCaption = getLocalizedText(to, 'PARAMED_HEADER');

    try {
        if (!Array.isArray(Paramedical_lab_img)) throw new Error("Paramedical_lab_img not found or invalid");

        // Separate images and videos
        const images = Paramedical_lab_img.filter(i => i.type === 'image').slice(0, 2);
        const videos = Paramedical_lab_img.filter(i => i.type === 'video').slice(0, 1);

        // Combine 2 images + 1 video
        const mediaToSend = [...images, ...videos];

        for (const media of mediaToSend) {
            try {
                const cap = (media.caption && (media.caption[lang] || media.caption['en'])) || paramedImageCaption;
                await sendMediaMessage(
                    to,
                    media.id || media.url,
                    cap,
                    media.type,   // 'image' or 'video'
                    !!media.url,
                    media.url
                );
                if (!userSentMedia[to]) userSentMedia[to] = new Set();
                userSentMedia[to].add(String(media.id || media.url));
            } catch (e) {
                console.warn(`[WARN] Failed to send Paramedical ${media.type}`, e);
            }
        }
    } catch (err) {
        console.warn('[WARN] Failed to send Paramedical department media', err.message || err);
    }

    // --- List Message ---
    const listMessage = {
        messaging_product: "whatsapp", 
        to, 
        type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'PARAMED_HEADER') },
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
                            { id: "news_paramedical", title: (lang === 'en' ? "📰 News" : "📰 समाचार").substring(0, 24) },
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Paramedical Sub-Menu to ${to}`);
    }
}


// ----------------- NEWS SENDER -----------------
export async function sendDepartmentNews(to, dept) {
    const lang = userLanguageState[to] || 'en';
    let headerKey = null;
    let mediaItems = [];
    switch ((dept || '').toLowerCase()) {
        case 'nursing':
            headerKey = 'NURSING_NEWS';
            mediaItems = [
                { id: ID_NEWS_NURSING_1, url: URL_NEWS_NURSING_1 },
                { id: ID_NEWS_NURSING_2, url: URL_NEWS_NURSING_2 },
            ];
            break;
        case 'paramedical':
            headerKey = 'PARAMED_NEWS';
            mediaItems = [
                { id: ID_NEWS_PARAMED_1, url: URL_NEWS_PARAMED_1 },
                { id: ID_NEWS_PARAMED_2, url: URL_NEWS_PARAMED_2 },
            ];
            break;
        case 'dpharma':
        case 'd.pharma':
        case 'dpharmacy':
            headerKey = 'DPHARAMA_NEWS';
            mediaItems = [
                { id: ID_NEWS_DPHARMA_1, url: URL_NEWS_DPHARMA_1 },
                { id: ID_NEWS_DPHARMA_2, url: URL_NEWS_DPHARMA_2 },
            ];
            break;
        case 'cbse':
        case 'school':
            headerKey = 'CBSE_NEWS';
            mediaItems = [
                { id: ID_NEWS_CBSE_1, url: URL_NEWS_CBSE_1 },
                { id: ID_NEWS_CBSE_2, url: URL_NEWS_CBSE_2 },
            ];
            break;
        default:
            return;
    }

    if (headerKey && MESSAGES && MESSAGES[headerKey]) {
        const headerText = MESSAGES[headerKey][lang] || MESSAGES[headerKey].en || '';
        if (headerText) await sendTextMessage(to, headerText);
    }

    for (const item of mediaItems) {
        if (!item || (!item.id && !item.url)) continue;
        try {
            await sendMediaMessage(to, item.id || item.url, '', 'image', !!item.url, item.url);
        } catch (e) { console.warn('[WARN] Failed sending news media', e); }
        await new Promise(r => setTimeout(r, 450));
    }

    const parent = dept === 'nursing' ? 'menu_nursing' : dept === 'paramedical' ? 'menu_paramedical' : dept === 'dpharma' ? 'menu_dpharma' : 'menu_cbse';
    await sendNextStepMenu(to, parent);
}


export async function sendDetailedResponseAndNextStep(from, detail, parentMenuId = 'menu_main') {
    // FIX for missing function: assuming 'detail' has a 'text' property
    await sendTextMessage(from, detail.text);
    await sendNextStepMenu(from, parentMenuId);
}
export async function sendEligibilityPrompt(to, parentMenuId = 'menu_main') {
    eligibilityState[to] = { state: 'stream', parent: parentMenuId };
    await sendTextMessage(to, getLocalizedText(to, 'ELIGIBILITY_PROMPT_STREAM'));
}
export async function handleEligibilityInput(input, from) {
    if (!input || typeof input !== 'string') {
        await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_INVALID_STREAM'));
        await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_PROMPT_STREAM'));
        return;
    }

    const state = eligibilityState[from];
    if (!state) {
        // If no state, start fresh
        await sendEligibilityPrompt(from, 'menu_main');
        return;
    }

    const lower = input.trim().toLowerCase();

    if (state.state === 'stream') {
        // Accept common stream names
        if (['science', 'sci', 'pcb', 'pcm'].includes(lower)) {
            state.stream = 'science';
            state.state = 'marks';
            await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_PROMPT_SCORE'));
            return;
        }
        if (['arts', 'commerce', 'art', 'comm'].includes(lower)) {
            // treat Arts/Commerce similarly
            state.stream = (['arts','art'].includes(lower) ? 'arts' : 'commerce');
            state.state = 'marks';
            await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_PROMPT_SCORE'));
            return;
        }

        // invalid stream
        await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_INVALID_STREAM'));
        await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_PROMPT_STREAM'));
        return;
    }

    if (state.state === 'marks') {
        // try parse numeric
        const num = Number(input.replace(/[^\d.]/g, ''));
        if (Number.isNaN(num)) {
            await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_INVALID_SCORE'));
            await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_PROMPT_SCORE'));
            return;
        }

        // Simple eligibility logic:
        const stream = state.stream || 'science';
        // Normalize percentage / marks: assume user may send percent (0-100) or marks (0-500)
        let percent = num;
        if (num > 100) {
            // treat as marks out of 500 or 600; convert to percentage using common base 500
            percent = Math.min(100, Math.round((num / 500) * 100));
        }

        // Decide result
        if (stream === 'science') {
            if (percent >= 45) {
                await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_RESULT_SCIENCE'));
            } else {
                await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_RESULT_LOW'));
            }
        } else {
            // Arts/Commerce
            await sendTextMessage(from, getLocalizedText(from, 'ELIGIBILITY_RESULT_ARTS_COMMERCE'));
        }

        // Clear state and show next-step menu
        const parent = state.parent || 'menu_main';
        delete eligibilityState[from];
        await sendNextStepMenu(from, parent);
        return;
    }

    // Fallback: reset
    delete eligibilityState[from];
    await sendEligibilityPrompt(from, 'menu_main');
}

// ----------------- REPLY HANDLER & ROUTER (Main Logic) -----------------
export async function handleSubMenuSelection(selectionId, from) {
    const lang = userLanguageState[from] || 'en';

    // 1. NEWS handler (e.g., news_nursing, news_paramedical, news_dpharma, news_cbse)
    if (selectionId && selectionId.startsWith("news_")) {
        const dept = selectionId.split('_')[1];
        const normalized = dept === 'dpharma' ? 'dpharma' : dept;
        await sendDepartmentNews(from, normalized);
        return;
    }

    // 2. URL Handler (uses IDs registered by registerUrl)
    if (selectionId?.startsWith("open_url_")) {
        let url = URL_REGISTRY.get(selectionId);
        if (!url) {
            // Fallback lookup logic (from original code)
            try {
                const suffix = selectionId.replace('open_url_', '');
                for (const [k, v] of URL_REGISTRY.entries()) {
                    if (k.endsWith(suffix) || (v && v.includes(suffix))) { url = v; break; }
                }
            } catch (e) { /* ignore */ }
        }
        if (!url) {
            const help = (lang === 'en') ? `🔗 Link unavailable directly. You can visit our website: ${URL_WEB_CBSE} or social profiles via the menu.` : `🔗 लिंक सीधे उपलब्ध नहीं है। आप हमारी वेबसाइट पर जाएँ: ${URL_WEB_CBSE} या मेनू के माध्यम से सोशल प्रोफ़ाइल देखें।`;
            await sendTextMessage(from, help);
            await sendNextStepMenu(from, 'menu_main');
            return;
        }
        await sendTextMessage(from, (lang === 'en' ? `🔗 Click to open: ${url}` : `🔗 खोलने के लिए क्लिक करें: ${url}`));
        await sendNextStepMenu(from, 'menu_main');
        return;
    }

    // 3. Language quick-change
    if (selectionId === "lang_en") { userLanguageState[from] = 'en'; await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_EN')); await sendMainMenu(from); return; }
    if (selectionId === "lang_hi") { userLanguageState[from] = 'hi'; await sendTextMessage(from, getLocalizedText(from, 'LANGUAGE_SWITCHED_HI')); await sendMainMenu(from); return; }
    if (selectionId === "menu_lang_select_quick") { await sendLanguageSelectionMenu(from); return; }

    // 4. Media tours and explore
    if (selectionId?.startsWith("media_")) {
        const mediaKey = selectionId.split('_')[1];
        let parentMenuId = 'menu_main';
        let courseName = '';
        let mediaArray = UNIVERSAL_CAMPUS_TOUR;
        if (mediaKey === 'school') { courseName = (lang === 'en' ? "CBSE School Campus" : "सीबीएसई स्कूल कैंपस"); parentMenuId = 'menu_cbse'; }
        else if (mediaKey === 'events') { courseName = getLocalizedText(from, 'EVENTS_SPORTS_TITLE'); parentMenuId = 'menu_main'; mediaArray = EVENTS_SPORTS_TOUR; }
        else if (mediaKey === 'dpharma') { courseName = (lang === 'en' ? "D.Pharmacy" : "डी.फार्मेसी"); parentMenuId = 'menu_dpharma'; }
        else if (mediaKey === 'nursing') { courseName = (lang === 'en' ? "Nursing Dept." : "नर्सिंग विभाग"); parentMenuId = 'menu_nursing'; }
        else if (mediaKey === 'paramedical') { courseName = (lang === 'en' ? "Paramedical" : "पैरामेडिकल"); parentMenuId = 'menu_paramedical'; }
        if (courseName) { await sendCourseMedia(from, mediaArray, courseName, parentMenuId); return; }
        if (selectionId === 'menu_explore') { await sendExploreMenu(from, parentMenuId); return; }
    }

    // 5. Menu routing (Non-info)
    if (selectionId?.startsWith("menu_") && !selectionId.includes("_fees") && !selectionId.includes("_docs") && !selectionId.includes("_admission")) {
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
            case "menu_hospital": await sendDetailedResponseAndNextStep(from, { text: getLocalizedText(from, 'HOSPITAL_TEXT') }, 'menu_main'); return;
            case "menu_helpdesk":
                await sendTextMessage(from, getLocalizedText(from, 'HELPDESK_TEXT'));
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
            default:
                console.log(`[WARNING] Unrecognized selection ID: ${selectionId}`);
                await sendTextMessage(from, getLocalizedText(from, 'UNKNOWN_OPTION'));
                await sendMainMenu(from);
                return;
        }
    }

    // 6. Direct Handlers (Contact, Hostel)
    if (selectionId === "contact_admissions_direct") { await sendAdmissionContact(from, "Admissions", "91 83868 22849", "info@stechbhl.in", 'menu_main'); return; }
    if (selectionId === "info_hostel") { await sendHostelInfo(from, 'menu_main'); return; }

    // 7. CBSE branch info replies
    if (selectionId.startsWith("menu_cbse_pn_") || selectionId.startsWith("menu_cbse_ps_")) {
        const branchId = selectionId.substring(0, selectionId.lastIndexOf('_'));
        const infoType = selectionId.substring(selectionId.lastIndexOf('_') + 1);
        const parentMenuId = branchId;
        const docsMessage = getLocalizedText(from, 'CBSE_DOCUMENTS');
        const feesMessage = getLocalizedText(from, branchId === 'menu_cbse_pn' ? 'CBSE_FEES_PN' : 'CBSE_FEES_PS');
        const feeUrl = branchId === 'menu_cbse_pn' ? URL_CBSE_FEES_PN_DETAIL : URL_CBSE_FEES_PS_DETAIL;

        switch (infoType) {
            case "fees": await sendLinkButtonMessage(from, feesMessage, feeUrl, (lang === 'en' ? "View Fee Doc" : "शुल्क दस्तावेज़ देखें"), URL_CBSE_FEES_GENERAL, (lang === 'en' ? "Website Fees" : "वेबसाइट शुल्क"), parentMenuId); return;
            case "docs": await sendDetailedResponseAndNextStep(from, { text: docsMessage }, parentMenuId); return;
            case "admission": await sendLinkButtonMessage(from, getLocalizedText(from, 'CBSE_ADMISSIONS_TITLE'), URL_ADMISSION_FORM, (lang === 'en' ? "Apply Now (Form)" : "अभी आवेदन करें (फॉर्म)"), URL_CBSE_FEES_GENERAL, (lang === 'en' ? "School Page" : "स्कूल पेज"), parentMenuId); return;
            default: await sendCbsiSubMenu(from, branchId); return;
        }
    }

    if (selectionId === "url_cbse_web") {
        await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our CBSE School's official website for full academic details." : "पूर्ण शैक्षणिक विवरण के लिए हमारे सीबीएसई स्कूल की आधिकारिक वेबसाइट पर जाएँ।"), URL_WEB_CBSE, (lang === 'en' ? "Go to Website" : "वेबसाइट पर जाएँ"), null, null, 'menu_cbse');
        return;
    }

    // 8. Social and department website routing
    if (selectionId?.startsWith("url_")) {
        if (selectionId === "url_dpharma_web") { await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our D.Pharmacy program page." : "हमारे डी.फार्मेसी प्रोग्राम पेज पर जाएँ।"), URL_WEB_DPHARMA, (lang === 'en' ? "D.Pharma Website" : "वेबसाइट"), null, null, 'menu_dpharma'); return; }
        if (selectionId === "url_nursing_web") { await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our Nursing program page." : "हमारे नर्सिंग प्रोग्राम पेज पर जाएँ।"), URL_WEB_NURSING, (lang === 'en' ? "Nursing Website" : "वेबसाइट"), null, null, 'menu_nursing'); return; }
        if (selectionId === "url_paramed_web") { await sendLinkButtonMessage(from, (lang === 'en' ? "Visit our Paramedical program page." : "हमारे पैरामेडिकल प्रोग्राम पेज पर जाएँ।"), URL_WEB_PARAMEDICAL, (lang === 'en' ? "Paramedical Website" : "वेबसाइट"), null, null, 'menu_paramedical'); return; }

        let url = URL_WEB_CBSE;
        let title = getLocalizedText(from, 'VIEW_ALL_PROGRAMS');
        let parentMenu = 'menu_explore';
        switch (selectionId) {
            case 'url_fb': url = URL_SOCIAL_FB; title = getLocalizedText(from, 'EXPLORE_FB'); break;
            case 'url_insta': url = URL_SOCIAL_INSTA; title = getLocalizedText(from, 'EXPLORE_INSTA'); break;
            case 'url_yt': url = URL_SOCIAL_YOUTUBE; title = getLocalizedText(from, 'EXPLORE_YOUTUBE'); break;
            case 'url_li': url = URL_SOCIAL_LINKEDIN; title = getLocalizedText(from, 'EXPLORE_LINKEDIN'); break;
            default: break;
        }
        await sendLinkButtonMessage(from, (lang === 'en' ? "Click the button to visit the chosen platform." : "पसंदीदा प्लेटफॉर्म पर जाने के लिए बटन पर क्लिक करें।"), url, (lang === 'en' ? `Open ${title}` : `${title} खोलें`), null, null, parentMenu);
        return;
    }

    // 9. D.Pharma replies
    if (selectionId?.startsWith("info_dpharma")) {
        const parentMenuId = 'menu_dpharma';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        switch (selectionId) {
            case "info_dpharma_details": await sendLinkButtonMessage(from, getLocalizedText(from, 'DPHARMA_DETAILS'), detailUrl, (lang === 'en' ? "View Course Doc" : "कोर्स दस्तावेज़ देखें"), URL_WEB_DPHARMA, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "info_dpharma_contact": await sendAdmissionContact(from, lang === 'en' ? "D.Pharmacy" : "डी.फार्मेसी", "91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "info_dpharma_eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            default: await sendDPharmaSubMenu(from); return;
        }
    }

    // 10. Nursing replies
    if (selectionId?.startsWith("info_nursing")) {
        const parentMenuId = 'menu_nursing';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        const courseId = selectionId.substring(selectionId.lastIndexOf('_') + 1);
        let descKey = '';
        let backMenu = "menu_nursing_courses_list";

        switch (courseId) {
            case "admissions": await sendLinkButtonMessage(from, getLocalizedText(from, 'NURSING_ADMISSIONS'), detailUrl, (lang === 'en' ? "View Eligibility & Fees" : "पात्रता और शुल्क देखें"), URL_WEB_NURSING, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "contact": await sendAdmissionContact(from, lang === 'en' ? "Nursing" : "नर्सिंग", "91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            case "BSc": descKey = 'NURSING_BSc_DESC'; break;
            case "PBBSc": descKey = 'NURSING_PBBSc_DESC'; break;
            case "GNM": descKey = 'NURSING_GNM_DESC'; break;
            case "MSc": descKey = 'NURSING_MSc_DESC'; break;
            default: await sendNursingSubMenu(from); return;
        }

        if (descKey) {
            await sendLinkButtonMessage(from, getLocalizedText(from, descKey), detailUrl, (lang === 'en' ? `View Course Doc` : `कोर्स दस्तावेज़ देखें`), URL_WEB_NURSING, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), backMenu);
            return;
        }
    }

    // 11. Paramedical replies
    if (selectionId?.startsWith("info_paramed")) {
        const parentMenuId = 'menu_paramedical';
        const detailUrl = URL_COLLEGE_COURSES_DETAIL;
        const courseId = selectionId.substring(selectionId.lastIndexOf('_') + 1);
        let descKey = '';
        let backMenu = "menu_paramedical_courses_list";

        switch (courseId) {
            case "facilities": await sendLinkButtonMessage(from, getLocalizedText(from, 'PARAMED_FACILITIES'), detailUrl, (lang === 'en' ? "View Course Doc" : "कोर्स दस्तावेज़ देखें"), URL_WEB_PARAMEDICAL, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), parentMenuId); return;
            case "contact": await sendAdmissionContact(from, lang === 'en' ? "Paramedical" : "पैरामेडिकल", "91 83868 22849", "info@stechbhl.in", parentMenuId); return;
            case "eligibility_start": await sendEligibilityPrompt(from, parentMenuId); return;
            case "Diploma": descKey = 'PARAMED_DIP_DESC'; break;
            case "Degree": descKey = 'PARAMED_DEGREE_DESC'; break;
            default: await sendParamedicalSubMenu(from); return;
        }

        if (descKey) {
            await sendLinkButtonMessage(from, getLocalizedText(from, descKey), detailUrl, (lang === 'en' ? `View Course Doc` : `कोर्स दस्तावेज़ देखें`), URL_WEB_PARAMEDICAL, (lang === 'en' ? "Website Link" : "वेबसाइट लिंक"), backMenu);
            return;
        }
    }

    // Final catch-all
    console.log(`[WARNING] Unrecognized selection ID (Final Catch-All): ${selectionId}`);
    await sendTextMessage(from, getLocalizedText(from, 'UNKNOWN_OPTION'));
    await sendMainMenu(from);
    return;
}
// sendExploreMenu defined here to avoid cross-file reference issues
async function sendExploreMenu(to, parentMenuId) {
    const lang = userLanguageState[to] || 'en';
    const idFb = registerUrl(URL_SOCIAL_FB);
    const idInsta = registerUrl(URL_SOCIAL_INSTA);
    const idYt = registerUrl(URL_SOCIAL_YOUTUBE);
    const idLi = registerUrl(URL_SOCIAL_LINKEDIN);

    const listMessage = {
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: {
            type: "list",
            header: { type: "text", text: getLocalizedText(to, 'EXPLORE_BODY').substring(0, 60) },
            body: { text: (lang === 'en' ? "Select a platform below to explore our presence." : "हमारी उपस्थिति जानने के लिए नीचे एक प्लेटफॉर्म चुनें।") },
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
        ensureUniqueRowIds(listMessage);
        await axios.post(API_URL, listMessage, { headers: WHATSAPP_HEADERS });
    } catch (error) {
        handleApiError(error, `Explore Menu to ${to}`);
    }
}
