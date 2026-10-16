/**
 * Every sentence a caller hears from the line's call flow, in each language a
 * line can offer as its second language.
 *
 * A line with Bilingual Support on (settings.bilingual, settings.language2)
 * offers the switch right after the greeting, in the second language itself
 * ("Para español, oprima 8."). A caller who presses the key hears the rest of
 * the call in that language: the voice webhook carries `lang` on every
 * redirect, Gather action and status callback URL, and the direct-connect hold
 * loop (api/twilio/cascade-wait) gets it in its waitUrl. Without `lang` the
 * call is in English, exactly as before.
 *
 * The text is fixed here rather than machine-translated per call, so the TTS
 * cache (api/twilio/tts) keeps serving it and the signed URLs stay stable.
 * ElevenLabs eleven_multilingual_v2 speaks every language in the table, in the
 * line's voice (a cloned voice included).
 *
 * Templates take {digit} and {name}. A contact's recorded name is played in
 * place of {name} (promptAroundName), so the text either side of it is spoken
 * separately.
 */

export const CALL_LANGS = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko", "tl"] as const;
export type CallLang = (typeof CALL_LANGS)[number];

const EN = {
  /** The standard greeting, when the line has no custom one. */
  greeting: "Thank you for calling the iCanCall priority line.",
  /** The offer to switch, spoken in the language it offers. */
  languageOffer: "For English, press {digit}.",
  outOfMinutes: "We are sorry, this number has run out of voice minutes. Please log in to your dashboard to top up.",
  menuOption: "Press {digit} for {name}",
  menuVoicemail: "Or press 9 to leave a voice message.",
  reachPrompt: "Press 1 to reach your family's trusted contacts. Press 2 to leave a voice message for the family.",
  tryingNext: "Trying the next contact. Please stand by.",
  allUnavailable: "Your primary trusted contacts are currently unavailable.",
  primaryUnavailable: "The primary contacts are currently unavailable.",
  contactUnavailable: "The contact is currently unavailable.",
  thatContactUnavailable: "That contact is currently unavailable.",
  connectingTo: "Connecting you to {name}. Please stand by.",
  connectingAll: "Connecting you to your primary trusted contacts. Please stand by.",
  leaveMessage: "Please leave your message after the tone. When you are finished, you can hang up.",
  invalidSelection: "Invalid selection.",
  calling: "Calling {name}.",
  callingNext: "Calling the next contact.",
  didntAnswer: "{name} didn't answer.",
  noAnswer: "No answer.",
  messageSent: "Thank you. Your message has been sent. Goodbye.",
};

export type CallPromptKey = keyof typeof EN;

const PROMPTS: Record<CallLang, Record<CallPromptKey, string>> = {
  en: EN,
  es: {
    greeting: "Gracias por llamar a la línea prioritaria de iCanCall.",
    languageOffer: "Para español, oprima {digit}.",
    outOfMinutes: "Lo sentimos, este número se quedó sin minutos de voz. Inicie sesión en su panel para recargar.",
    menuOption: "Oprima {digit} para {name}",
    menuVoicemail: "O oprima 9 para dejar un mensaje de voz.",
    reachPrompt: "Oprima 1 para comunicarse con los contactos de confianza de su familia. Oprima 2 para dejar un mensaje de voz para la familia.",
    tryingNext: "Intentando con el siguiente contacto. Por favor, espere.",
    allUnavailable: "Sus contactos de confianza principales no están disponibles en este momento.",
    primaryUnavailable: "Los contactos principales no están disponibles en este momento.",
    contactUnavailable: "El contacto no está disponible en este momento.",
    thatContactUnavailable: "Ese contacto no está disponible en este momento.",
    connectingTo: "Comunicándolo con {name}. Por favor, espere.",
    connectingAll: "Comunicándolo con sus contactos de confianza principales. Por favor, espere.",
    leaveMessage: "Por favor, deje su mensaje después del tono. Cuando termine, puede colgar.",
    invalidSelection: "Selección no válida.",
    calling: "Llamando a {name}.",
    callingNext: "Llamando al siguiente contacto.",
    didntAnswer: "{name} no contestó.",
    noAnswer: "No hubo respuesta.",
    messageSent: "Gracias. Su mensaje ha sido enviado. Adiós.",
  },
  fr: {
    greeting: "Merci d'avoir appelé la ligne prioritaire iCanCall.",
    languageOffer: "Pour le français, appuyez sur {digit}.",
    outOfMinutes: "Nous sommes désolés, ce numéro n'a plus de minutes d'appel. Veuillez vous connecter à votre tableau de bord pour recharger.",
    menuOption: "Pour {name}, appuyez sur {digit}.",
    menuVoicemail: "Ou appuyez sur 9 pour laisser un message vocal.",
    reachPrompt: "Appuyez sur 1 pour joindre les contacts de confiance de votre famille. Appuyez sur 2 pour laisser un message vocal à la famille.",
    tryingNext: "Nous essayons le contact suivant. Veuillez patienter.",
    allUnavailable: "Vos contacts de confiance principaux ne sont pas disponibles pour le moment.",
    primaryUnavailable: "Les contacts principaux ne sont pas disponibles pour le moment.",
    contactUnavailable: "Le contact n'est pas disponible pour le moment.",
    thatContactUnavailable: "Ce contact n'est pas disponible pour le moment.",
    connectingTo: "Nous vous mettons en relation avec {name}. Veuillez patienter.",
    connectingAll: "Nous vous mettons en relation avec vos contacts de confiance principaux. Veuillez patienter.",
    leaveMessage: "Veuillez laisser votre message après le bip. Lorsque vous avez terminé, vous pouvez raccrocher.",
    invalidSelection: "Choix non valide.",
    calling: "Nous appelons {name}.",
    callingNext: "Nous appelons le contact suivant.",
    didntAnswer: "{name} n'a pas répondu.",
    noAnswer: "Pas de réponse.",
    messageSent: "Merci. Votre message a été envoyé. Au revoir.",
  },
  ja: {
    greeting: "iCanCall優先回線にお電話いただきありがとうございます。",
    languageOffer: "日本語をご希望の方は{digit}を押してください。",
    outOfMinutes: "申し訳ありません。この番号の通話時間が残っていません。ダッシュボードにログインしてチャージしてください。",
    menuOption: "{name}は{digit}を押してください。",
    menuVoicemail: "伝言を残す場合は9を押してください。",
    reachPrompt: "ご家族の信頼できる連絡先におつなぎする場合は1を、ご家族に伝言を残す場合は2を押してください。",
    tryingNext: "次の連絡先におかけしています。そのままお待ちください。",
    allUnavailable: "現在、主な連絡先はいずれも応答できません。",
    primaryUnavailable: "現在、主な連絡先は応答できません。",
    contactUnavailable: "現在、この連絡先は応答できません。",
    thatContactUnavailable: "その連絡先は現在応答できません。",
    connectingTo: "{name}におつなぎします。そのままお待ちください。",
    connectingAll: "主な連絡先におつなぎします。そのままお待ちください。",
    leaveMessage: "発信音のあとにメッセージをどうぞ。終わりましたら電話をお切りください。",
    invalidSelection: "無効な選択です。",
    calling: "{name}に発信しています。",
    callingNext: "次の連絡先に発信しています。",
    didntAnswer: "{name}は応答しませんでした。",
    noAnswer: "応答がありませんでした。",
    messageSent: "ありがとうございます。メッセージを送信しました。失礼いたします。",
  },
  zh: {
    greeting: "感谢您致电 iCanCall 优先专线。",
    languageOffer: "中文服务请按{digit}。",
    outOfMinutes: "很抱歉，此号码的通话分钟数已用完。请登录您的控制面板充值。",
    menuOption: "联系{name}请按{digit}。",
    menuVoicemail: "或按9留言。",
    reachPrompt: "联系您家人的信任联系人请按1。给家人留言请按2。",
    tryingNext: "正在尝试下一位联系人，请稍候。",
    allUnavailable: "您的主要信任联系人目前无法接听。",
    primaryUnavailable: "主要联系人目前无法接听。",
    contactUnavailable: "该联系人目前无法接听。",
    thatContactUnavailable: "此联系人目前无法接听。",
    connectingTo: "正在为您接通{name}，请稍候。",
    connectingAll: "正在为您接通主要信任联系人，请稍候。",
    leaveMessage: "请在提示音后留言。留言完毕后即可挂断。",
    invalidSelection: "选择无效。",
    calling: "正在呼叫{name}。",
    callingNext: "正在呼叫下一位联系人。",
    didntAnswer: "{name}未接听。",
    noAnswer: "无人接听。",
    messageSent: "谢谢。您的留言已发送。再见。",
  },
  ar: {
    greeting: "شكرًا لاتصالك بخط iCanCall ذي الأولوية.",
    languageOffer: "للعربية، اضغط {digit}.",
    outOfMinutes: "نأسف، لقد نفدت دقائق الاتصال لهذا الرقم. يرجى تسجيل الدخول إلى لوحة التحكم لإعادة الشحن.",
    menuOption: "اضغط {digit} للتحدث مع {name}",
    menuVoicemail: "أو اضغط 9 لترك رسالة صوتية.",
    reachPrompt: "اضغط 1 للوصول إلى جهات الاتصال الموثوقة لعائلتك. اضغط 2 لترك رسالة صوتية للعائلة.",
    tryingNext: "جارٍ الاتصال بجهة الاتصال التالية. يرجى الانتظار.",
    allUnavailable: "جهات الاتصال الموثوقة الرئيسية غير متاحة حاليًا.",
    primaryUnavailable: "جهات الاتصال الرئيسية غير متاحة حاليًا.",
    contactUnavailable: "جهة الاتصال غير متاحة حاليًا.",
    thatContactUnavailable: "جهة الاتصال هذه غير متاحة حاليًا.",
    connectingTo: "جارٍ توصيلك بـ {name}. يرجى الانتظار.",
    connectingAll: "جارٍ توصيلك بجهات الاتصال الموثوقة الرئيسية. يرجى الانتظار.",
    leaveMessage: "يرجى ترك رسالتك بعد سماع النغمة. عند الانتهاء، يمكنك إنهاء المكالمة.",
    invalidSelection: "اختيار غير صالح.",
    calling: "جارٍ الاتصال بـ {name}.",
    callingNext: "جارٍ الاتصال بجهة الاتصال التالية.",
    didntAnswer: "لم يتم الرد من {name}.",
    noAnswer: "لا يوجد رد.",
    messageSent: "شكرًا لك. تم إرسال رسالتك. مع السلامة.",
  },
  hi: {
    greeting: "iCanCall प्राथमिकता लाइन पर कॉल करने के लिए धन्यवाद।",
    languageOffer: "हिंदी के लिए {digit} दबाएँ।",
    outOfMinutes: "क्षमा करें, इस नंबर के वॉइस मिनट समाप्त हो गए हैं। कृपया रिचार्ज करने के लिए अपने डैशबोर्ड में लॉग इन करें।",
    menuOption: "{name} के लिए {digit} दबाएँ।",
    menuVoicemail: "या वॉइस संदेश छोड़ने के लिए 9 दबाएँ।",
    reachPrompt: "अपने परिवार के भरोसेमंद संपर्कों से बात करने के लिए 1 दबाएँ। परिवार के लिए वॉइस संदेश छोड़ने के लिए 2 दबाएँ।",
    tryingNext: "अगले संपर्क को कॉल किया जा रहा है। कृपया प्रतीक्षा करें।",
    allUnavailable: "आपके मुख्य भरोसेमंद संपर्क अभी उपलब्ध नहीं हैं।",
    primaryUnavailable: "मुख्य संपर्क अभी उपलब्ध नहीं हैं।",
    contactUnavailable: "संपर्क अभी उपलब्ध नहीं है।",
    thatContactUnavailable: "वह संपर्क अभी उपलब्ध नहीं है।",
    connectingTo: "आपको {name} से जोड़ा जा रहा है। कृपया प्रतीक्षा करें।",
    connectingAll: "आपको आपके मुख्य भरोसेमंद संपर्कों से जोड़ा जा रहा है। कृपया प्रतीक्षा करें।",
    leaveMessage: "कृपया बीप के बाद अपना संदेश छोड़ें। संदेश पूरा होने पर आप फ़ोन रख सकते हैं।",
    invalidSelection: "अमान्य चयन।",
    calling: "{name} को कॉल किया जा रहा है।",
    callingNext: "अगले संपर्क को कॉल किया जा रहा है।",
    didntAnswer: "{name} ने जवाब नहीं दिया।",
    noAnswer: "कोई जवाब नहीं मिला।",
    messageSent: "धन्यवाद। आपका संदेश भेज दिया गया है। नमस्ते।",
  },
  pt: {
    greeting: "Obrigado por ligar para a linha prioritária iCanCall.",
    languageOffer: "Para português, pressione {digit}.",
    outOfMinutes: "Lamentamos, este número ficou sem minutos de voz. Acesse seu painel para recarregar.",
    menuOption: "Pressione {digit} para {name}",
    menuVoicemail: "Ou pressione 9 para deixar uma mensagem de voz.",
    reachPrompt: "Pressione 1 para falar com os contatos de confiança da sua família. Pressione 2 para deixar uma mensagem de voz para a família.",
    tryingNext: "Tentando o próximo contato. Por favor, aguarde.",
    allUnavailable: "Seus principais contatos de confiança não estão disponíveis no momento.",
    primaryUnavailable: "Os contatos principais não estão disponíveis no momento.",
    contactUnavailable: "O contato não está disponível no momento.",
    thatContactUnavailable: "Esse contato não está disponível no momento.",
    connectingTo: "Conectando você a {name}. Por favor, aguarde.",
    connectingAll: "Conectando você aos seus principais contatos de confiança. Por favor, aguarde.",
    leaveMessage: "Deixe sua mensagem após o sinal. Quando terminar, pode desligar.",
    invalidSelection: "Opção inválida.",
    calling: "Ligando para {name}.",
    callingNext: "Ligando para o próximo contato.",
    didntAnswer: "{name} não atendeu.",
    noAnswer: "Sem resposta.",
    messageSent: "Obrigado. Sua mensagem foi enviada. Até logo.",
  },
  de: {
    greeting: "Vielen Dank für Ihren Anruf bei der iCanCall-Prioritätsleitung.",
    languageOffer: "Für Deutsch drücken Sie die {digit}.",
    outOfMinutes: "Es tut uns leid, für diese Nummer sind keine Gesprächsminuten mehr verfügbar. Bitte melden Sie sich in Ihrem Dashboard an, um aufzuladen.",
    menuOption: "Für {name} drücken Sie die {digit}.",
    menuVoicemail: "Oder drücken Sie die 9, um eine Sprachnachricht zu hinterlassen.",
    reachPrompt: "Drücken Sie die 1, um die Vertrauenskontakte Ihrer Familie zu erreichen. Drücken Sie die 2, um der Familie eine Sprachnachricht zu hinterlassen.",
    tryingNext: "Wir versuchen den nächsten Kontakt. Bitte bleiben Sie dran.",
    allUnavailable: "Ihre wichtigsten Vertrauenskontakte sind derzeit nicht erreichbar.",
    primaryUnavailable: "Die wichtigsten Kontakte sind derzeit nicht erreichbar.",
    contactUnavailable: "Der Kontakt ist derzeit nicht erreichbar.",
    thatContactUnavailable: "Dieser Kontakt ist derzeit nicht erreichbar.",
    connectingTo: "Wir verbinden Sie mit {name}. Bitte bleiben Sie dran.",
    connectingAll: "Wir verbinden Sie mit Ihren wichtigsten Vertrauenskontakten. Bitte bleiben Sie dran.",
    leaveMessage: "Bitte hinterlassen Sie Ihre Nachricht nach dem Signalton. Wenn Sie fertig sind, können Sie auflegen.",
    invalidSelection: "Ungültige Auswahl.",
    calling: "Wir rufen {name} an.",
    callingNext: "Wir rufen den nächsten Kontakt an.",
    didntAnswer: "{name} hat nicht abgenommen.",
    noAnswer: "Keine Antwort.",
    messageSent: "Vielen Dank. Ihre Nachricht wurde gesendet. Auf Wiederhören.",
  },
  it: {
    greeting: "Grazie per aver chiamato la linea prioritaria iCanCall.",
    languageOffer: "Per l'italiano, prema {digit}.",
    outOfMinutes: "Siamo spiacenti, questo numero ha esaurito i minuti di chiamata. Acceda alla sua dashboard per ricaricare.",
    menuOption: "Prema {digit} per {name}",
    menuVoicemail: "Oppure prema 9 per lasciare un messaggio vocale.",
    reachPrompt: "Prema 1 per raggiungere i contatti di fiducia della sua famiglia. Prema 2 per lasciare un messaggio vocale alla famiglia.",
    tryingNext: "Stiamo provando il contatto successivo. Attenda, per favore.",
    allUnavailable: "I suoi principali contatti di fiducia non sono al momento disponibili.",
    primaryUnavailable: "I contatti principali non sono al momento disponibili.",
    contactUnavailable: "Il contatto non è al momento disponibile.",
    thatContactUnavailable: "Quel contatto non è al momento disponibile.",
    connectingTo: "La stiamo mettendo in contatto con {name}. Attenda, per favore.",
    connectingAll: "La stiamo mettendo in contatto con i suoi principali contatti di fiducia. Attenda, per favore.",
    leaveMessage: "Lasci il suo messaggio dopo il segnale acustico. Quando ha finito, può riagganciare.",
    invalidSelection: "Selezione non valida.",
    calling: "Stiamo chiamando {name}.",
    callingNext: "Stiamo chiamando il contatto successivo.",
    didntAnswer: "{name} non ha risposto.",
    noAnswer: "Nessuna risposta.",
    messageSent: "Grazie. Il suo messaggio è stato inviato. Arrivederci.",
  },
  ko: {
    greeting: "iCanCall 우선 회선에 전화해 주셔서 감사합니다.",
    languageOffer: "한국어 안내는 {digit}번을 눌러 주세요.",
    outOfMinutes: "죄송합니다. 이 번호의 통화 시간이 모두 소진되었습니다. 대시보드에 로그인하여 충전해 주세요.",
    menuOption: "{name} 연결은 {digit}번을 눌러 주세요.",
    menuVoicemail: "음성 메시지를 남기시려면 9번을 눌러 주세요.",
    reachPrompt: "가족의 신뢰하는 연락처로 연결하려면 1번을, 가족에게 음성 메시지를 남기려면 2번을 눌러 주세요.",
    tryingNext: "다음 연락처로 연결하고 있습니다. 잠시만 기다려 주세요.",
    allUnavailable: "현재 주요 신뢰 연락처가 모두 응답할 수 없습니다.",
    primaryUnavailable: "현재 주요 연락처가 응답할 수 없습니다.",
    contactUnavailable: "현재 연락처가 응답할 수 없습니다.",
    thatContactUnavailable: "해당 연락처는 현재 응답할 수 없습니다.",
    connectingTo: "{name} 님께 연결해 드리겠습니다. 잠시만 기다려 주세요.",
    connectingAll: "주요 신뢰 연락처로 연결해 드리겠습니다. 잠시만 기다려 주세요.",
    leaveMessage: "신호음이 울린 후 메시지를 남겨 주세요. 다 남기신 후 전화를 끊으시면 됩니다.",
    invalidSelection: "잘못된 선택입니다.",
    calling: "{name} 님에게 전화하고 있습니다.",
    callingNext: "다음 연락처에 전화하고 있습니다.",
    didntAnswer: "{name} 님이 받지 않았습니다.",
    noAnswer: "응답이 없습니다.",
    messageSent: "감사합니다. 메시지가 전송되었습니다. 안녕히 계세요.",
  },
  tl: {
    greeting: "Salamat sa pagtawag sa iCanCall priority line.",
    languageOffer: "Para sa Tagalog, pindutin ang {digit}.",
    outOfMinutes: "Paumanhin, naubos na ang mga minuto ng numerong ito. Mag-log in sa iyong dashboard para mag-top up.",
    menuOption: "Pindutin ang {digit} para kay {name}",
    menuVoicemail: "O pindutin ang 9 para mag-iwan ng voice message.",
    reachPrompt: "Pindutin ang 1 para makausap ang mga pinagkakatiwalaang contact ng iyong pamilya. Pindutin ang 2 para mag-iwan ng voice message para sa pamilya.",
    tryingNext: "Sinusubukan ang susunod na contact. Mangyaring maghintay.",
    allUnavailable: "Hindi available sa ngayon ang iyong mga pangunahing pinagkakatiwalaang contact.",
    primaryUnavailable: "Hindi available sa ngayon ang mga pangunahing contact.",
    contactUnavailable: "Hindi available sa ngayon ang contact.",
    thatContactUnavailable: "Hindi available sa ngayon ang contact na iyon.",
    connectingTo: "Ikinokonekta ka kay {name}. Mangyaring maghintay.",
    connectingAll: "Ikinokonekta ka sa iyong mga pangunahing pinagkakatiwalaang contact. Mangyaring maghintay.",
    leaveMessage: "Mag-iwan ng mensahe pagkatapos ng tono. Kapag tapos ka na, maaari ka nang bumaba sa tawag.",
    invalidSelection: "Hindi wastong pagpili.",
    calling: "Tinatawagan si {name}.",
    callingNext: "Tinatawagan ang susunod na contact.",
    didntAnswer: "Hindi sumagot si {name}.",
    noAnswer: "Walang sumagot.",
    messageSent: "Salamat. Naipadala na ang iyong mensahe. Paalam.",
  },
};

/** What the dashboard stored as language2 before it stored codes. */
const LANGUAGE_NAMES: Record<string, CallLang> = {
  english: "en",
  spanish: "es",
  french: "fr",
  japanese: "ja",
  mandarin: "zh",
  chinese: "zh",
  arabic: "ar",
  hindi: "hi",
  portuguese: "pt",
  german: "de",
  italian: "it",
  korean: "ko",
  tagalog: "tl",
};

function isCallLang(value: string): value is CallLang {
  return (CALL_LANGS as readonly string[]).includes(value);
}

/** The language of a call from its `lang` query param; English when absent or unknown. */
export function parseCallLang(value: unknown): CallLang {
  return typeof value === "string" && isCallLang(value) ? value : "en";
}

/**
 * A language as a code. Older settings hold the dropdown's name ("Spanish");
 * a language with no prompts here is null.
 */
export function secondLanguageCode(value: unknown): CallLang | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (isCallLang(v)) return v;
  return LANGUAGE_NAMES[v] ?? null;
}

/** The second language a line offers: Spanish until the owner picks another. */
export function lineSecondLanguage(settings: { language2?: unknown } | null | undefined): CallLang {
  return secondLanguageCode(settings?.language2) ?? "es";
}

/** Whether Bilingual Support is on; it defaults to off. */
export function bilingualOn(settings: { bilingual?: unknown } | null | undefined): boolean {
  return settings?.bilingual === true;
}

export interface LanguageOffer {
  lang: CallLang;
  /** The key that switches the call over. */
  digit: string;
}

/**
 * The switch a line offers English callers, or null when Bilingual Support is
 * off. The key is 8, except in a caller menu long enough to use 8 for a
 * contact, where it is 0.
 */
export function languageOffer(
  settings: { bilingual?: unknown; language2?: unknown } | null | undefined,
  lineMode: string,
  contactCount: number
): LanguageOffer | null {
  if (!bilingualOn(settings)) return null;
  const lang = lineSecondLanguage(settings);
  if (lang === "en") return null;
  return { lang, digit: lineMode === "menu" && contactCount >= 8 ? "0" : "8" };
}

type PromptVars = { digit?: string | number; name?: string };

function fill(template: string, vars: PromptVars): string {
  return template
    .replace(/\{digit\}/g, vars.digit === undefined ? "" : String(vars.digit))
    .replace(/\{name\}/g, vars.name ?? "");
}

/** A caller-facing sentence in the call's language. */
export function callPrompt(lang: CallLang, key: CallPromptKey, vars: PromptVars = {}): string {
  return fill(PROMPTS[lang][key] || EN[key], vars);
}

/**
 * The text either side of {name}, for playing a recorded name in its place.
 * A side with nothing to say (empty, or only punctuation) is "".
 */
export function promptAroundName(
  lang: CallLang,
  key: CallPromptKey,
  vars: Omit<PromptVars, "name"> = {}
): [before: string, after: string] {
  const [before = "", after = ""] = fill(PROMPTS[lang][key] || EN[key], { ...vars, name: "\u0000" }).split("\u0000");
  const spoken = (part: string) => {
    const t = part.replace(/^[\s,，、]+/, "").trim();
    return /[\p{L}\p{N}]/u.test(t) ? t : "";
  };
  return [spoken(before), spoken(after)];
}

/** `lang` as a query param to append to a URL inside TwiML (XML-escaped); "" for English. */
export function langParamXml(lang: CallLang): string {
  return lang === "en" ? "" : `&amp;lang=${lang}`;
}

/** `lang` as a query param to append to a plain URL (status callbacks, call updates); "" for English. */
export function langParam(lang: CallLang): string {
  return lang === "en" ? "" : `&lang=${lang}`;
}
