// services/constants.js

import "dotenv/config";
import e from "express";

// --- CONFIGURATION CONSTANTS ---
export const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
export const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
export const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// API URL & HEADERS
export const API_URL = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`;
export const WHATSAPP_HEADERS = {
    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};


// --- URL CONSTANTS (Defined ONCE) ---
export const URL_COLLEGE_COURSES_DETAIL = 'https://docs.google.com/document/d/1VYzC9gL7Zdw7nLsWuzr35zyWCbOU-_3g/edit?usp=sharing';
export const URL_CBSE_FEES_PN_DETAIL = 'https://docs.google.com/document/d/1f-df7hIUw03GEH-MiV7stvsWDu869zIZ/edit?usp=sharing';
export const URL_CBSE_FEES_PS_DETAIL = 'https://docs.google.com/document/d/1qfPvCPHcGwOkokAmdVztsYMIDfYyjINM/edit?usp=sharing';

// Direct Website Links
export const URL_WEB_CBSE = 'https://stechbhl.in/school-2/';
export const URL_WEB_NURSING = 'https://stechbhl.in/nursing-college/';
export const URL_WEB_PARAMEDICAL = 'https://stechbhl.in/paramedical/';
export const URL_WEB_DPHARMA = 'https://stechbhl.in/pharmacy/';


export const URL_BASE_PROSPECTUS = 'https://stechbhl.in/wp-content/uploads/2023/04/prospectus-2k23.pdf';
export const URL_ADMISSION_FORM = 'https://stechbhl.blogspot.com/2025/04/admission-inquiry-form.html';
export const URL_CBSE_FEES_GENERAL = 'https://stechbhl.in/fee-structure/';
export const URL_SOCIAL_FB = 'https://www.facebook.com/stechgroupbhilwara';
export const URL_SOCIAL_INSTA = 'https://www.instagram.com/stech_group_bhilwara/';
export const URL_SOCIAL_YOUTUBE = 'https://www.youtube.com/@stech_group';
export const URL_SOCIAL_LINKEDIN = 'https://www.linkedin.com/in/stech-group-3445301a0/';

// --- MEDIA DATA ARRAYS ---
export const GOOGLE_DRIVE_BASE_URL = 'https://drive.google.com/uc?export=download&id=';
export const ID_UNIVERSAL_VIDEO_1 = '18iUFO_VcL_7dyPpGYz3Tp0F0YClS4JtC';
export const ID_UNIVERSAL_VIDEO_2 = '1LQKHo3T6yEwSiqRSAxFvtHQTJu6Ptv_O';

// NEW: Department-Specific Image IDs/URLs
export const ID_IMAGE_HOSTEL = '1L2hCkm-X9FHcn8YBv6weFzGRulMEjAbu';
export const URL_IMAGE_HOSTEL = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_HOSTEL}`;



export const ID_IMAGE_NURSING = '10BCI-IIGfoNT-ajeF9u62QmoJOJFhVmU';
export const URL_IMAGE_NURSING= `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_NURSING}`;

export const ID_IMAGE_NURSING1 = '10BCI-IIGfoNT-ajeF9u62QmoJOJFhVmU'; // Placeholder ID for Nursing Lab/Facility
export const ID_IMAGE_NURSING2 = '12ReUDKXFkCQcmSYggMS4eRUOeiS8SsBK';

export const URL_IMAGE_NURSING1 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_NURSING1}`;
export const URL_IMAGE_NURSING2 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_NURSING2}`;


export const ID_IMAGE_NURSING3 = '1oFO7GEgCf3WLmlIX4VwGi-evPKSfSiSv';
export const URL_IMAGE_NURSING3 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_NURSING3}`;

export const ID_IMAGE_PARAMED= '1IGMhyFYgUdbyd0Ig2TQTvrR3s_r1F6df';
export const URL_IMAGE_PARAMED = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_PARAMED}`;

export const ID_IMAGE_PARAMED1 = '1Wov-zLy0ARECCLg34gjowyqh85bBfTkE'; // Placeholder ID for Paramedical Lab/Facility
export const ID_IMAGE_PARAMED2 = '1eZ_H6qltECEalu71vGuAZvt0JD0FaSE4';

// Additional Paramedical images (poster & news)
export const ID_IMAGE_PARAMED3 = '1oFO7GEgCf3WLmlIX4VwGi-evPKSfSiSv';
export const URL_IMAGE_PARAMED3 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_PARAMED3}`;




export const URL_IMAGE_PARAMED1 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_PARAMED1}`;
export const URL_IMAGE_PARAMED2 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_PARAMED2}`;

export const ID_videoNursing='   '

export const ID_IMAGE_DPHARMA = '1w56T517QOHNJNLwbHHJzEGbx6u4YxgRb'; // Placeholder ID for D.Pharmacy Lab/Facility
export const URL_IMAGE_DPHARMA = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_DPHARMA}`;

// Additional D.Pharmacy image
export const ID_IMAGE_DPHARMA2 = '1v0P6iUCv4A4n9SDk33M6XFCYw9yqPsde';
export const URL_IMAGE_DPHARMA2 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_DPHARMA2}`;

export const ID_IMAGE_DPHARMA3 = '1oFO7GEgCf3WLmlIX4VwGi-evPKSfSiSv';
export const URL_IMAGE_DPHARMA3 = `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_DPHARMA3}`;


export const ID_IMAGE_EVENTS_1 = '1XtefQDk2ML6W_TKTNHl1XOmGHzqrypIK';
export const ID_IMAGE_EVENTS_2 = '1Hj3uDH3MWMH1WGXC06o6ZYQpp0HFjRK0';
export const VIDEO_1_URL = `https://drive.google.com/uc?export=download&id=${ID_UNIVERSAL_VIDEO_1}`;
export const VIDEO_2_URL = `https://drive.google.com/uc?export=download&id=${ID_UNIVERSAL_VIDEO_2}`;

export const ID_NEWS_CBSE_1 = '1reXrSNuK_aJ-Afu5yBux6UfwTjCkbgrK'; // Placeholder ID for CBSE News Image 1
export const ID_NEWS_CBSE_2 = '1jASR5SBuRTmGUk0RspQmsvpccE_2f96g';
export const URL_NEWS_CBSE_1 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_CBSE_1}`;
export const URL_NEWS_CBSE_2 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_CBSE_2}`;

export const ID_NEWS_PARAMED_1 = '1jASR5SBuRTmGUk0RspQmsvpccE_2f96g'; // Placeholder ID for Paramedical News Image 1
export const ID_NEWS_PARAMED_2 = '1g0JgJrB7OEeB3QFC9VrnWj5UK3wWxIEE';
export const URL_NEWS_PARAMED_1 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_PARAMED_1}`;
export const URL_NEWS_PARAMED_2 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_PARAMED_2}`;

export const ID_NEWS_NURSING_1 = '1jASR5SBuRTmGUk0RspQmsvpccE_2f96g'; // Placeholder ID for Nursing News Image 1
export const ID_NEWS_NURSING_2 = '1jEJu4eBInbECxDJvdY9j500Bvfp9XroD';
export const URL_NEWS_NURSING_1 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_NURSING_1}`;
export const URL_NEWS_NURSING_2 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_NURSING_2}`;

export const ID_NEWS_DPHARMA_1 = '1jASR5SBuRTmGUk0RspQmsvpccE_2f96g'; // Placeholder ID for D.Pharmacy News Image 1
export const ID_NEWS_DPHARMA_2 = '14-qOnvYKOrFN828eiH2gcqzqsEr4yumE';
export const URL_NEWS_DPHARMA_1 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_DPHARMA_1}`;
export const URL_NEWS_DPHARMA_2 = `${GOOGLE_DRIVE_BASE_URL}${ID_NEWS_DPHARMA_2}`;



// MODIFIED: Added department images to the start of the tour array
export const Paramedical_lab_img = [
    { type: 'image', id: ID_IMAGE_PARAMED, url: URL_IMAGE_PARAMED, caption: { en: "1/4: Paramedical Labs & Notices 📌", hi: "1/4: पैरामेडिकल लैब और सूचनाएँ 📌" } },
    { type: 'image', id: ID_IMAGE_PARAMED1, url: URL_IMAGE_PARAMED1, caption: { en: "2/4: Paramedical Facilities 🏥", hi: "2/4: पैरामेडिकल सुविधाएँ 🏥" } },
    { type: 'image', id: ID_IMAGE_PARAMED2, url: URL_IMAGE_PARAMED2, caption: { en: "3/4: Paramedical Equipment ⚙️", hi: "3/4: पैरामेडिकल उपकरण ⚙️" } },
    { type: 'image', id: ID_IMAGE_PARAMED3, url: URL_IMAGE_PARAMED3, caption: { en: "4/4: Department News & Updates �", hi: "4/4: विभागीय समाचार और अपडेट �" } },
];

export const Nursing_lab_img = [
    { type: 'image', id: ID_IMAGE_NURSING1, url: URL_IMAGE_NURSING1, caption: { en: "1/4: Nursing Labs & Training 🩺", hi: "1/4: नर्सिंग लैब और प्रशिक्षण 🩺" } },
    { type: 'image', id: ID_IMAGE_NURSING2, url: URL_IMAGE_NURSING2, caption: { en: "2/4: Clinical Practice Rooms 🛏️", hi: "2/4: क्लिनिकल अभ्यास कक्ष 🛏️" } },
    { type: 'image', id: ID_IMAGE_NURSING3, url: URL_IMAGE_NURSING3, caption: { en: "3/4: Student Practical Sessions 📸", hi: "3/4: छात्र व्यावहारिक सत्र 📸" } },
    { type: 'image', id: ID_IMAGE_HOSTEL, url: URL_IMAGE_HOSTEL, caption: { en: "4/4: Campus Hostel & Facilities 🏠", hi: "4/4: कैंपस हॉस्टल और सुविधाएँ 🏠" } },
];

export const DPharmacy_lab_img = [
    { type: 'image', id: ID_IMAGE_DPHARMA, url: URL_IMAGE_DPHARMA, caption: { en: "1/4: Pharm Labs & Equipment 💊", hi: "1/4: फार्मेसी लैब और उपकरण 💊" } },
    { type: 'image', id: ID_IMAGE_DPHARMA2, url: URL_IMAGE_DPHARMA2, caption: { en: "2/4: Practical Pharmaceutics ⚗️", hi: "2/4: व्यावहारिक फार्मास्यूटिक्स ⚗️" } },
];
export const UNIVERSAL_CAMPUS_TOUR = [
  { type: 'video', id: ID_UNIVERSAL_VIDEO_1, url: VIDEO_1_URL },
  { type: 'video', id: ID_UNIVERSAL_VIDEO_2, url: VIDEO_2_URL }
];
export const EVENTS_SPORTS_TOUR = [
  { type: 'image', id: ID_IMAGE_EVENTS_1, url: `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_EVENTS_1}`, caption: { en: "1/2: Annual Sports Meet 🏆", hi: "1/2: वार्षिक खेल मिलन 🏆" } },
  { type: 'image', id: ID_IMAGE_EVENTS_2, url: `${GOOGLE_DRIVE_BASE_URL}${ID_IMAGE_EVENTS_2}`, caption: { en: "2/2: Cultural Event Fun 🎉", hi: "2/2: सांस्कृतिक कार्यक्रम 🎉" } }
];
/**
 * Main dictionary containing all user-facing messages.
 */
export const MESSAGES = {
    WELCOME_HEADER: { en: "🎓 S-Tech Group, Bhilwara", hi: "🎓 एस-टेक ग्रुप, भीलवाड़ा" },
    WELCOME_BODY: { en: "Hello! I'm your *S-Tech College Assistant* 🤖. We excel in Healthcare and Education. Please select a department below to begin.", hi: "नमस्ते! मैं आपका *એસ-ટેક કોલેજ અસિસ્ટન્ટ* 🤖 हूँ। हम हेल्थकेयर और एजुकेशन में उत्कृष्ट हैं। कृपया नीचे दिए गए विभागों में से चुनें।"},
    WELCOME_FOOTER: { en: "Please select an option below.", hi: "कृपया एक विकल्प चुनें।"},
    MAIN_BUTTON: { en: "🎯 View Programs", hi: "🎯 प्रोग्राम देखें" },
    UNKNOWN_OPTION: { en: "❌ Sorry, I didn’t recognize that option. Please tap *‘View Programs’* to continue.", hi: "❌ क्षमा करें, मैं वह विकल्प समझ नहीं पाया। कृपया *‘प्रोग्राम देखें’* बटन दबाएँ।"},
    GENERAL_SUPPORT: { en: "✅ Got it! Please use the menu buttons to explore more options.", hi: "✅ आपका संदेश मिल गया! कृपया मेनू विकल्पों का उपयोग करें。"},

    // --- Eligibility Prompts ---
    ELIGIBILITY_PROMPT_STREAM: { en: "✅ *Eligibility Check (Step 1/2)*\n\nPlease reply with your **12th Stream** (e.g., Science, Arts, or Commerce).", hi: "✅ *पात्रता जांच (चरण 1/2)*\n\nकृपया अपनी **12वीं की स्ट्रीम** बताएं (जैसे: साइंस, आर्ट्स, या कॉमर्स)।"},
    ELIGIBILITY_PROMPT_SCORE: { en: "✅ *Eligibility Check (Step 2/2)*\n\nThank you! Now, please reply with your **12th Percentage or Score** (e.g., 75 or 450).", hi: "✅ *पात्रता जांच (चरण 2/2)*\n\nधन्यवाद! अब कृपया अपना **12वीं का प्रतिशत या स्कोर** बताएं (जैसे 75 या 450)।"},
    ELIGIBILITY_INVALID_STREAM: { en: "❌ Invalid entry. Please enter a valid stream (Science / Arts / Commerce).", hi: "❌ अमान्य प्रविष्टि। कृपया एक वैध स्ट्रीम दर्ज करें (साइंस / आर्ट्स / कॉमर्स)।"},
    ELIGIBILITY_INVALID_SCORE: { en: "❌ Invalid score. Please enter a valid number (e.g., 65 or 480).", hi: "❌ अमान्य स्कोर। कृपया एक वैध संख्या दर्ज करें (जैसे 65 या 480)।"},
    ELIGIBILITY_RESULT_SCIENCE: { en: "🌟 *Eligibility Confirmed!* Based on your Science background, you are eligible for *B.Sc Nursing, D.Pharmacy,* and *Paramedical* courses. Tap 'Admissions Call' to connect with our counselor.", hi: "🌟 *पात्रता सुनिश्चित!* आपके साइंस बैकग्राउंड के आधार पर, आप *B.Sc नर्सिंग, D.फार्मेसी,* और *पैरामेडिकल* कोर्सेस के लिए पात्र हैं। काउंसलर से जुड़ने के लिए 'एडमिशन कॉल' दबाएँ।"},
    ELIGIBILITY_RESULT_ARTS_COMMERCE: { en: "✅ *Eligibility Confirmed!* You are eligible for *GNM* and other non-science allied health programs. Tap 'Admissions Call' to speak with our counselor.", hi: "✅ *पात्रता सुनिश्चित!* आपकी स्ट्रीम के आधार पर, आप *GNM* और अन्य नॉन-साइंस हेल्थ प्रोग्राम्स के लिए पात्र हैं। काउंसलर से जुड़ने के लिए 'एडमिशन कॉल' दबाएँ।"},
    ELIGIBILITY_RESULT_LOW: { en: "⚠️ *Guidance Note:* Your score suggests limited options for direct degree courses. We recommend exploring the *GNM Program*. Please contact Admissions for personalized guidance.", hi: "⚠️ *मार्गदर्शन नोट:* आपके स्कोर के आधार पर सीधा डिग्री कोर्स कठिन हो सकता है। हम *GNM प्रोग्राम* पर विचार करने की सलाह देते हैं। व्यक्तिगत सलाह के लिए एडमिशन टीम से संपर्क करें।"},

    // --- Main Menu Sections ---
    SECTION_PROGRAMS: { en: "1️⃣ Academic Programs", hi: "1️⃣ शैक्षणिक कार्यक्रम" },
    SECTION_SUPPORT: { en: "2️⃣ Campus & Support", hi: "2️⃣ कैंपस और सपोर्ट" },
    NEXT_STEP_BODY: { en: "✨ Where would you like to go next?", hi: "✨ अब आप आगे क्या देखना चाहेंगे?" },
    NEXT_STEP_FOOTER: { en: "S-Tech College - Bhilwara", hi: "એસ-ટેક कॉलेज - भीलवाड़ा" },
    BACK_BUTTON: { en: "⬅️ Back", hi: "⬅️ वापस जाएँ" },
    VIEW_ALL_PROGRAMS: { en: "📚 View Programs", hi: "📚 प्रोग्राम देखें" },
    ADMISSIONS_CONTACT_BUTTON: { en: "📞 Admissions Call", hi: "📞 एडमिशन कॉल" },
    LANGUAGE_PROMPT: { en: "🌍 Welcome! Please select your preferred language to continue:", hi: "🌍 नमस्ते! कृपया अपनी पसंदीदा भाषा चुनें:" },
    LANGUAGE_SWITCHED_EN: { en: "✅ Language switched to **English** 🇬🇧. Loading main menu...", hi: "✅ भाषा **अंग्रेज़ी** 🇬🇧 में बदल गई। मुख्य मेनू लोड हो रहा है..."},
    LANGUAGE_SWITCHED_HI: { en: "✅ Language switched to **Hindi** 🇮🇳. Loading main menu...", hi: "✅ भाषा **हिन्दी** 🇮🇳 में बदल गई। मुख्य मेनू लोड हो रहा है..."},

    // --- CBSE Section ---
    CBSE_HEADER: { en: "🏫 CBSE School", hi: "🏫 सीबीएसई स्कूल" },
    CBSE_BODY: { en: "Admissions Open for Session 2025–26 (CBSE Affiliated up to Class XII). Please choose your preferred branch.", hi: "सत्र 2025–26 के लिए प्रवेश खुले हैं (सीबीएसई संबद्ध XII तक)। कृपया अपनी पसंदीदा शाखा चुनें।"},
    CBSE_PATEL_NAGAR: { en: "🏫 Patel Nagar Branch", hi: "🏫 पटेल नगर शाखा" },
    CBSE_PATEL_NAGAR_BODY: { en: "Located in the heart of Bhilwara, our Patel Nagar campus offers a vibrant learning environment with modern facilities, experienced faculty, and a focus on holistic development.", hi: "भीलवाड़ा के केंद्र में स्थित, हमारा पटेल नगर कैंपस आधुनिक सुविधाओं, अनुभवी फैकल्टी और समग्र विकास पर ध्यान केंद्रित करता है।"},
    CBSE_PANSAL: { en: "🏫 Pansal Branch (Main)", hi: "🏫 पानसाल शाखा (मुख्य कैंपस)" },
    CBSSE_PANSAL_BODY: { en: "Our sprawling Pansal campus, set amidst serene surroundings, provides state-of-the-art infrastructure, well-equipped labs, and a nurturing environment to foster academic excellence and extracurricular growth.", hi: "हमारा विस्तृत पानसाल कैंपस शांत वातावरण के बीच स्थित है, जो अत्याधुनिक इंफ्रास्ट्रक्चर, अच्छी तरह से सुसज्जित लैब्स और एक पोषणकारी वातावरण प्रदान करता है।"},
    CBSE_ADMISSIONS_TITLE: { en: "📘 Admission Process", hi: "📘 प्रवेश प्रक्रिया" },
    CBSE_FEES_TITLE: { en: "💰 Fee Structure", hi: "💰 शुल्क संरचना" },
    CBSE_DOCS_TITLE: { en: "📄 Required Documents", hi: "📄 आवश्यक दस्तावेज़" },
    CBSE_DOCUMENTS: { en: "📋 *Documents Required for Admission:*\n1️⃣ Previous year's report card\n2️⃣ Original Transfer Certificate\n3️⃣ Aadhar of student & parents (self-attested)\n4️⃣ 5 recent passport-size photos\n5️⃣ PEN (Permanent Education Number)", hi: "📋 *प्रवेश के लिए आवश्यक दस्तावेज़:*\n1️⃣ पिछले वर्ष की रिपोर्ट कार्ड\n2️⃣ मूल ट्रांसफर सर्टिफिकेट (टीसी)\n3️⃣ छात्र और अभिभावकों के आधार कार्ड (स्व-अभिप्रमाणित)\n4️⃣ 5 हालिया पासपोर्ट साइज फोटो\n5️⃣ PEN (स्थायी शिक्षा संख्या)"},
    CBSE_FEES_PN: { en: "💵 *Patel Nagar Fee (Selected Classes)*\n\n- **I & II:** Adm. Fee ₹5000 | Total ₹25,000 (4×₹6250)\n- **VI–VIII:** Adm. Fee ₹5000 | Total ₹31,000 (4×₹7750)\n\n*Tap 'View Fee Doc' below for complete info.*", hi: "💵 *पटेल नगर शुल्क (चयनित कक्षाएँ)*\n\n- **I & II:** प्रवेश शुल्क ₹5000 | कुल ₹25,000 (4×₹6250)\n- **VI–VIII:** प्रवेश शुल्क ₹5000 | कुल ₹31,000 (4×₹7750)\n\n*पूर्ण विवरण के लिए 'शुल्क दस्तावेज़ देखें' लिंक पर क्लिक करें।"},
    CBSE_FEES_PS: { en: "💵 *Pansal Branch Fee (Selected Classes)*\n\n- **I & II:** Adm. Fee ₹5000 | Total ₹34,000 (4×₹8500)\n- **XI–XII:** Adm. Fee ₹6500 | Total ₹52,000 (4×₹13,000)\n\n*Tap 'View Fee Doc' below for full details.*", hi: "💵 *पानसाल शाखा शुल्क (चयनित कक्षाएँ)*\n\n- **I & II:** प्रवेश शुल्क ₹5000 | कुल ₹34,000 (4×₹8500)\n- **XI–XII:** प्रवेश शुल्क ₹6500 | कुल ₹52,000 (4×₹13,000)\n\n*पूर्ण विवरण के लिए 'शुल्क दस्तावेज़ देखें' लिंक पर क्लिक करें।"},
    CBSE_NEWS: { en: "📰 *CBSE School News*\n\nStay updated with the latest happenings, student achievements, and school events in our CBSE section.", hi: "📰 *सीबीएसई स्कूल समाचार*\n\nहमारे सीबीएसई सेक्शन में नवीनतम घटनाओं, छात्र उपलब्धियों और स्कूल कार्यक्रमों के साथ अपडेट रहें।" },

    // --- Social Media & Support ---
    EXPLORE_BODY: { en: "🌐 Explore our vibrant campus life, student achievements, and modern infrastructure. Follow us on:", hi: "🌐 हमारे जीवंत कैंपस जीवन, छात्र उपलब्धियों और आधुनिक इंफ्रास्ट्रक्चर को देखें। हमें फॉलो करें:"},
    EXPLORE_FB: { en: "📘 Facebook", hi: "📘 फेसबुक" },
    EXPLORE_INSTA: { en: "📸 Instagram", hi: "📸 इंस्टाग्राम" },
    EXPLORE_YOUTUBE: { en: "▶️ YouTube", hi: "▶️ यूट्यूब" },
    EXPLORE_LINKEDIN: { en: "💼 LinkedIn", hi: "💼 लिंक्डइन" },
    HOSTEL_TITLE: { en: "🏠 Hostel & Accommodation", hi: "🏠 हॉस्टल एवं आवास" },
    HOSTEL_BODY: { en: "Safe on-campus hostel with separate facilities for boys & girls, 24×7 security, and a hygienic mess.\n\n*Fee:* ₹85,000–₹95,000/year (Non-AC/AC)", hi: "सुरक्षित ऑन-कैंपस हॉस्टल, लड़कों और लड़कियों के लिए अलग सुविधा, 24×7 सुरक्षा और स्वच्छ मेस।\n\n*शुल्क:* ₹85,000–₹95,000 प्रति वर्ष (नॉन-एसी/एसी)"},
    EVENTS_SPORTS_TITLE: { en: "🏆 Events & Sports", hi: "🏆 कार्यक्रम एवं खेल" },
    EVENTS_SPORTS_BODY: { en: "📸 Starting a photo tour of our recent events and sports highlights!", hi: "📸 हमारे हालिया कार्यक्रमों और खेल की झलकियां देखें!"},
    HOSPITAL_TEXT: { en: "🏥 *College Hospital: Training & Care*\n\nOffers multi-specialty care — General Medicine, Surgery, Orthopedics, and more. Students receive essential *hands-on practical training* here.", hi: "🏥 *कॉलेज अस्पताल: प्रशिक्षण एवं देखभाल*\n\nयहाँ जनरल मेडिसिन, सर्जरी, आर्थोपेडिक्स आदि की मल्टी-स्पेशलिटी सेवाएँ उपलब्ध हैं। छात्रों को अनिवार्य *प्रायोगिक प्रशिक्षण* प्रदान किया जाता है।"},
    HELPDESK_TEXT: { en: "ℹ️ *Help Desk / Support*\n\n1️⃣ Admission Enquiry: +91 83868 22849\n2️⃣ General Enquiry: +91 63780 87099\n3️⃣ Email: info@stechbhl.in\n\n📘 *Download the latest prospectus and brochure below.*", hi: "ℹ️ *सहायता डेस्क / सपोर्ट*\n\n1️⃣ प्रवेश पूछताछ: *83868 22849*\n2️⃣ सामान्य पूछताछ: *63780 87099*\n3️⃣ ईमेल: *info@stechbhl.in*\n\n📘 *नवीनतम प्रॉस्पेक्टस और ब्रोशर नीचे उपलब्ध है।*" },

    

    // --- D.PHARMACY ---
    DPHARMA_HEADER: { en: "💊 D.Pharmacy", hi: "💊 डी.फार्मेसी" },
    DPHARMA_BODY: { en: "A **2-Year Diploma** program approved by the *Pharmacy Council of India (PCI)* and affiliated to **RUHS, Jaipur**.", hi: "यह **2-वर्षीय डिप्लोमा प्रोग्राम** *फार्मेसी काउंसिल ऑफ इंडिया (PCI)* द्वारा अनुमोदित और **आरयूएचएस, जयपुर** से संबद्ध है।"},
    DPHARMA_DETAILS: { en: "💊 *D.Pharmacy (2025-26)*\n\n**Duration:** 2 Years (Full-Time Diploma)\n**Affiliation:** RUHS, Jaipur & PCI Approved\n**Eligibility:** 10+2 (Science Stream – PCB/PCM)\n**Tuition Fee:** ₹72,300 per year\n**Career Scope:** Work as *Pharmacist, Medical Representative, Hospital Dispenser,* or pursue *B.Pharm (Lateral Entry)*.\n\n🏥 *Well-equipped labs for Pharmaceutics, Pharmacology, Chemistry, and Anatomy ensure 100% practical learning.*\n\n📘 *For complete details on structure, fees, and career prospects, please refer to the official document linked below.*", hi: "💊 *डी.फार्मेसी (2025-26)*\n\n**अवधि:** 2 वर्ष (पूर्णकालिक डिप्लोमा)\n**संबद्धता:** आरयूएचएस, जयपुर एवं पीसीआई अनुमोदित\n**पात्रता:** 10+2 (विज्ञान – पीसीबी/पीसीएम)\n**ट्यूशन शुल्क:** ₹72,300 प्रति वर्ष\n**करियर अवसर:** *फार्मासिस्ट, मेडिकल रिप्रेजेंटेटिव, हॉस्पिटल डिस्पेंसर* के रूप में कार्य कर सकते हैं या *बी.फार्म (लैटरल एंट्री)* से उच्च शिक्षा प्राप्त कर सकते हैं।\n\n🏥 *Well-equipped labs for Pharmaceutics, Pharmacology, Chemistry, and Anatomy ensure 100% practical learning.*\n\n📘 *पूरा कोर्स विवरण, शुल्क व करियर जानकारी के लिए नीचे दिए गए दस्तावेज़ को देखें।*"},
DPHARAMA_NEWS: { en: "📰 *D.Pharmacy Department News*\n\nStay updated with the latest happenings, student achievements, and departmental events in our D.Pharmacy section.", hi: "📰 *डी.फार्मेसी विभाग समाचार*\n\nहमारे डी.फार्मेसी सेक्शन में नवीनतम घटनाओं, छात्र उपलब्धियों और विभागीय कार्यक्रमों के साथ अपडेट रहें।" },
    // --- NURSING ---
    NURSING_HEADER: { en: "👩‍⚕️ Nursing Department", hi: "👩‍⚕️ नर्सिंग विभाग" },
    NURSING_BODY: { en: "Offering **INC-approved Nursing Programs** affiliated with *RUHS & RNC*, designed to prepare students for excellence in modern healthcare with compassion, skill, and confidence.", hi: "हम **आईएनसी अनुमोदित नर्सिंग प्रोग्राम** प्रदान करते हैं जो *आरयूएचएस और आरएनसी* से संबद्ध हैं, जो छात्रों को आधुनिक स्वास्थ्य सेवाओं में करुणा, दक्षता और आत्मविश्वास के साथ उत्कृष्टता प्राप्त करने के लिए तैयार करते हैं।"},
    NURSING_COURSES: { en: "🩺 Programs offered: **B.Sc, GNM, P.B.B.Sc, and M.Sc Nursing**. Select a course below to view its professional summary.", hi: "🩺 हमारे कार्यक्रम: **बी.एससी, जी.एन.एम., पी.बी.बी.एससी, और एम.एससी नर्सिंग**। एक कोर्स चुनें और उसका सारांश देखें।"},
    NURSING_ADMISSIONS: { en: "💵 *Admissions & Fees*\n\n**Example (B.Sc Nursing):** ₹2.5 Lakh per year\n**Caution Money:** ₹10,000 (Refundable)\n**Hostel Fee:** ₹85,000 (Optional)\n\n📘 *For complete fee, eligibility, and admission criteria, please view the detailed document below.*", hi: "💵 *प्रवेश और शुल्क*\n\n**उदाहरण (बी.एससी नर्सिंग):** ₹2.5 लाख प्रति वर्ष\n**कॉशन मनी:** ₹10,000 (वापसी योग्य)\n**छात्रावास शुल्क:** ₹85,000 (वैकल्पिक)\n\n📘 *पूर्ण शुल्क, पात्रता और प्रवेश मानदंडों के लिए नीचे दिए गए दस्तावेज़ को देखें।*"},
    NURSING_CONTACT_TITLE: { en: "📞 Contact Counselor", hi: "📞 काउंसलर से संपर्क करें" }, 
NURSING_NEWS: { en: "📰 *Nursing Department News*\n\nStay updated with the latest happenings, student achievements, and departmental events in our Nursing section.", hi: "📰 *नर्सिंग विभाग समाचार*\n\nहमारे नर्सिंग सेक्शन में नवीनतम घटनाओं, छात्र उपलब्धियों और विभागीय कार्यक्रमों के साथ अपडेट रहें।" },
    // COURSE TITLES
    NURSING_BSc_INFO: { en: "B.Sc Nursing (4 Yrs)", hi: "बी.एससी नर्सिंग (4 वर्ष)" },
    NURSING_GNM_INFO: { en: "G.N.M. (3 Yrs)", hi: "जी.एन.एम. (3 वर्ष)" },
    NURSING_MSc_INFO: { en: "M.Sc Nursing (2 Yrs)", hi: "एम.एससी नर्सिंग (2 वर्ष)" },
    NURSING_PBBSc_INFO: { en: "P.B.B.Sc Nursing (2 Yrs)", hi: "पी.बी.बी.एससी नर्सिंग (2 वर्ष)" },

    // COURSE DESCRIPTIONS
    NURSING_BSc_DESC: { en: "✨ *B.Sc Nursing (4 Years)* – A comprehensive program emphasizing **clinical excellence, leadership, and research-based patient care**. Eligibility: 10+2 (PCB) with minimum 45–50%.", hi: "✨ *बी.एससी नर्सिंग (4 वर्ष)* – **क्लिनिकल उत्कृष्टता, नेतृत्व और शोध आधारित रोगी देखभाल** पर केंद्रित एक व्यापक कार्यक्रम। पात्रता: 10+2 (पीसीबी) में न्यूनतम 45–50%。"},
    NURSING_GNM_DESC: { en: "✨ *G.N.M (3 Years)* – Focuses on **community health, bedside nursing, and maternal-child care**. Suitable for Science, Arts, or Commerce students with a passion for healthcare.", hi: "✨ *जी.एन.एम (3 वर्ष)* – **सामुदायिक स्वास्थ्य, रोगी देखभाल और मातृ-शिशु स्वास्थ्य** पर केंद्रित। स्वास्थ्य सेवा के प्रति रुचि रखने वाले विज्ञान, कला या वाणिज्य के छात्र आवेदन कर सकते।"},
    NURSING_MSc_DESC: { en: "✨ *M.Sc Nursing (2 Years)* – Specialization in **CHN, MSN, OBG, and Pediatric Nursing**. Prepares students for teaching, administrative, and advanced clinical roles.", hi: "✨ *एम.एससी नर्सिंग (2 वर्ष)* – **सीएचएन, एमएसएन, ओबीजी और पीडियाट्रिक नर्सिंग** में विशेषज्ञता। यह छात्रों को शिक्षण, प्रशासनिक और उच्च स्तरीय नैदानिक भूमिकाओं के लिए तैयार करता।"},
    NURSING_PBBSc_DESC: { en: "✨ *P.B.B.Sc Nursing (2 Years)* – Designed for GNM graduates to upgrade their qualifications and advance to M.Sc Nursing or leadership positions in healthcare institutions.", hi: "✨ *पी.बी.बी.एससी नर्सिंग (2 वर्ष)* – GNM स्नातकों के लिए बनाया गया कोर्स जो उन्हें **एम.एससी नर्सिंग** या स्वास्थ्य संस्थानों में नेतृत्व पदों के लिए योग्य बनाता है।"},

    // --- PARAMEDICAL ---
    PARAMED_HEADER: { en: "🔬 Paramedical Sciences", hi: "🔬 पैरामेडिकल विज्ञान" },
    PARAMED_BODY: { en: "Programs affiliated with the **Rajasthan State Allied & Healthcare Council**, providing hands-on training in diagnostic and therapeutic technologies through expert faculty and real clinical exposure.", hi: "**राजस्थान राज्य संबद्ध एवं स्वास्थ्य सेवा परिषद** से संबद्ध कार्यक्रम, जो विशेषज्ञ फैकल्टी और वास्तविक क्लिनिकल एक्सपोजर के माध्यम से डायग्नोस्टिक व थेरेप्यूटिक तकनीकों का व्यावहारिक प्रशिक्षण प्रदान करते हैं।"},
    PARAMED_COURSES: { en: "🔬 We offer both **Diploma and B.Sc Degree programs** in Allied Health Sciences — designed for students aiming to become skilled healthcare technologists.", hi: "🔬 हम संबद्ध स्वास्थ्य विज्ञान में **डिप्लोमा और बी.एससी डिग्री** कोर्स प्रदान करते हैं — जो छात्रों को कुशल स्वास्थ्य तकनीशियन बनने के लिए तैयार करते हैं।"},
    PARAMED_FACILITIES: { en: "🔬 *Eligibility & Facilities*\n\n**Eligibility:** 10+2 (Science Stream preferred)\n**Facilities:** Training in *Pathology, Radiology, Operation Theatre,* and *Physiotherapy Labs*.\n**Career Opportunities:** Diagnostic Centers, Hospitals, Medical Labs, and Research Institutions.\n\n📘 *For detailed course outlines, refer to the document below.*", hi: "🔬 *पात्रता और सुविधाएं*\n\n**पात्रता:** 10+2 (विज्ञान स्ट्रीम वांछनीय)\n**सुविधाएं:** *पैथोलॉजी, रेडियोलॉजी, ऑपरेशन थिएटर* और *फिजियोथेरेपी लैब्स* में प्रशिक्षण।\n**करियर अवसर:** डायग्नोस्टिक सेंटर, अस्पताल, मेडिकल लैब व अनुसंधान संस्थान。\n\n📘 *विस्तृत कोर्स जानकारी के लिए नीचे दिए गए दस्तावेज़ को देखें।*"},
    PARAMED_CONTACT_TITLE: { en: "📞 Contact Department Head", hi: "📞 विभाग प्रमुख से संपर्क करें" },

    PARAMED_DIPLOMA_INFO: { en: "Diploma (2 Yrs)", hi: "डिप्लोमा (2 वर्ष)" },
    PARAMED_DEGREE_INFO: { en: "B.Sc Degree", hi: "बी.एससी डिग्री" },

    PARAMED_DIP_DESC: { en: "✨ *Diploma Courses (2 Years)*: Technical programs such as **DMLT, DRT, and DOTT**, focusing on lab testing, radiography, and surgical assistance. Ideal for entry into healthcare within 2 years.", hi: "✨ *डिप्लोमा कोर्स (2 वर्ष)* – **डीएमएलटी, डीआरटी और डीओटीटी** जैसे तकनीकी कोर्स, जो लैब टेस्टिंग, रेडियोग्राफी और सर्जिकल असिस्टेंस पर केंद्रित हैं। 2 वर्ष में स्वास्थ्य सेवा क्षेत्र में प्रवेश के लिए उपयुक्त।"},
    PARAMED_DEGREE_DESC: { en: "✨ *B.Sc Paramedical (3–4 Years)*: In-depth learning in *Medical Lab Technology, Radiology, Operation Theatre, and Allied Health Sciences.* Prepares students for hospitals, diagnostics, and teaching careers.", hi: "✨ *बी.एससी पैरामेडिकल (3–4 वर्ष)* – *मेडिकल लैब टेक्नोलॉजी, रेडियोलॉजी, ऑपरेशन थिएटर और संबद्ध स्वास्थ्य विज्ञान* में गहन अध्ययन। यह छात्रों को अस्पताल, डायग्नोस्टिक सेंटर और शिक्षण करियर के लिए तैयार करता।"},
PARAMED_NEWS: { en: "📰 *Paramedical Department News*\n\nStay updated with the latest happenings, student achievements, and departmental events in our Paramedical section.", hi: "📰 *पैरामेडिकल विभाग समाचार*\n\nहमारे पैरामेडिकल सेक्शन में नवीनतम घटनाओं, छात्र उपलब्धियों और विभागीय कार्यक्रमों के साथ अपडेट रहें।" },
    // --- HOSPITAL & HELPDESK ---
    HOSTEL_TITLE: { en: "🏠 Hostel & Accommodation", hi: "🏠 हॉस्टल एवं आवास" },
    EVENTS_SPORTS_TITLE: { en: "🏆 Events & Sports", hi: "🏆 कार्यक्रम एवं खेल" },
    HOSPITAL_TEXT: { en: "🏥 *College Hospital – Practical Training & Patient Care*\n\nOur 100+ bedded multi-specialty hospital includes *General Medicine, Surgery, Orthopedics, Pediatrics, Gynecology, and Radiology*, ensuring comprehensive hands-on experience for every student.", hi: "🏥 *कॉलेज अस्पताल – व्यावहारिक प्रशिक्षण और रोगी देखभाल*\n\nहमारा 100+ बेड का मल्टी-स्पेशलिटी अस्पताल *जनरल मेडिसिन, सर्जरी, आर्थोपेडिक्स, पीडियाट्रिक्स, गायनेकोलॉजी और रेडियोलॉजी* जैसे विभागों के साथ प्रत्येक छात्र को व्यापक व्यावहारिक अनुभव प्रदान करता।"},

    HELPDESK_TEXT: { en: "ℹ️ *Help Desk / Support*\n\n1️⃣ Admission Enquiry: +91 83868 22849\n2️⃣ General Enquiry: +91 63780 87099\n3️⃣ Email: info@stechbhl.in\n\n📘 *Download the latest prospectus and brochure below.*", hi: "ℹ️ *सहायता डेस्क / सपोर्ट*\n\n1️⃣ प्रवेश पूछताछ: *83868 22849*\n2️⃣ सामान्य पूछताछ: *63780 87099*\n3️⃣ ईमेल: *info@stechbhl.in*\n\n📘 *नवीनतम प्रॉस्पेक्टस और ब्रोशर नीचे उपलब्ध है।*" },

   ADMISSIONS_DIRECT_TEXT: {
    en: "📞 *S-Tech Bhilwara Admissions Team*\n\nFor immediate assistance:\n📱 Phone: +91 83868 22849 (Admissions Hotline)\n📧 Email: info@stechbhl.in\n🔗 Admission Enquiry Form: https://stechbhl.blogspot.com/2025/04/admission-inquiry-form.html",
    hi: "📞 *S-Tech भीलवाड़ा प्रवेश टीम*\n\nतुरंत सहायता के लिए:\n📱 फोन: +91 83868 22849 (एडमिशन हेल्पलाइन)\n📧 ईमेल: info@stechbhl.in\n🔗 प्रवेश पूछताछ फॉर्म: https://stechbhl.blogspot.com/2025/04/admission-inquiry-form.html"
}};
