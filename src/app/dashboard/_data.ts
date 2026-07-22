import { planConfig } from "@/lib/planConfig";

/* Demo data, avatar palette and the localization helpers shared by the
   dashboard views. */

export const AVATAR_COLORS = [
  "oklch(0.58 0.115 232)",
  "oklch(0.62 0.10 198)",
  "oklch(0.55 0.13 285)",
  "oklch(0.60 0.13 30)",
  "oklch(0.58 0.13 145)",
  "oklch(0.6 0.14 350)",
];


export const getAcrossNumbersText = (count: number, lang: string) => {
  if (lang === "es") return `en ${count} número${count > 1 ? "s" : ""}`;
  if (lang === "fr") return `sur ${count} numéro${count > 1 ? "s" : ""}`;
  if (lang === "ja") return `${count} つの番号全体で`;
  if (lang === "zh") return `分布在 ${count} 个号码中`;
  if (lang === "ar") return `عبر ${count} ${count === 1 ? "رقم" : "أرقام"}`;
  if (lang === "hi") return `${count} नंबरों पर`;
  if (lang === "pt") return `em ${count} número${count > 1 ? "s" : ""}`;
  if (lang === "de") return `über ${count} Rufnummer${count > 1 ? "n" : ""}`;
  if (lang === "it") return `su ${count} numero${count > 1 ? "i" : ""}`;
  if (lang === "ko") return `${count}개 번호 전체`;
  return `across ${count} number${count > 1 ? "s" : ""}`;
};



export const CANONICAL_RELATIONSHIPS: Record<string, string> = {
  "daughter": "daughter",
  "hija": "daughter",
  "fille": "daughter",
  "娘": "daughter",
  "女儿": "daughter",
  "ابنة": "daughter",
  "बेटी": "daughter",
  "filha": "daughter",
  "tochter": "daughter",
  "figlia": "daughter",
  "딸": "daughter",

  "son": "son",
  "hijo": "son",
  "fils": "son",
  "息子": "son",
  "儿子": "son",
  "ابن": "son",
  "बेटा": "son",
  "filho": "son",
  "sohn": "son",
  "figlio": "son",
  "아들": "son",

  "brother": "brother",
  "hermano": "brother",
  "frère": "brother",
  "兄弟": "brother",
  "أخ": "brother",
  "भाई": "brother",
  "irmão": "brother",
  "bruder": "brother",
  "fratello": "brother",
  "형제": "brother",

  "sister": "sister",
  "hermana": "sister",
  "sœur": "sister",
  "姉妹": "sister",
  "姐妹": "sister",
  "أخت": "sister",
  "बहन": "sister",
  "irmã": "sister",
  "schwester": "sister",
  "sorella": "sister",
  "자매": "sister",

  "caregiver": "caregiver",
  "cuidador": "caregiver",
  "aidant": "caregiver",
  "介護者": "caregiver",
  "看护人": "caregiver",
  "مقدم الرعاية": "caregiver",
  "देखभाल करने वाला": "caregiver",
  "pflegekraft": "caregiver",
  "assistente": "caregiver",
  "간병인": "caregiver",

  "primary physician": "primary physician",
  "primary doctor": "primary physician",
  "médico de cabecera": "primary physician",
  "médecin traitant": "primary physician",
  "主治医": "primary physician",
  "主治医生": "primary physician",
  "الطبيب المعالج": "primary physician",
  "طبيب العائلة": "primary physician",
  "प्राथमिक चिकित्सक": "primary physician",
  "मुख्य चिकित्सक": "primary physician",
  "médico de família": "primary physician",
  "hausarzt": "primary physician",
  "medico curante": "primary physician",
  "주치의": "primary physician",

  "neighbor": "neighbor",
  "vecino": "neighbor",
  "voisin": "neighbor",
  "近所の人": "neighbor",
  "邻居": "neighbor",
  "جار": "neighbor",
  "पड़ोसी": "neighbor",
  "vizinho": "neighbor",
  "nachbar": "neighbor",
  "vicino": "neighbor",
  "이웃": "neighbor",

  "niece": "niece",
  "sobrina": "niece",
  "nièce": "niece",
  "姪": "niece",
  "侄女/外甥女": "niece",
  "ابنة الأخ/الأخت": "niece",
  "भतीजी/भांजी": "niece",
  "nichte": "niece",
  "nipote": "niece",
  "조카딸": "niece",

  "nephew": "nephew",
  "sobrino": "nephew",
  "neveu": "nephew",
  "甥": "nephew",
  "侄子/外甥": "nephew",
  "ابن الأخ/الأخت": "nephew",
  "भतीजा/भांजी": "nephew",
  "neffe": "nephew",
  "조카": "nephew",

  "spouse": "spouse",
  "cónyuge": "spouse",
  "conjoint": "spouse",
  "配偶者": "spouse",
  "配偶": "spouse",
  "زوج/زوجة": "spouse",
  "जीवनसाथी": "spouse",
  "ehepartner": "spouse",
  "coniuge": "spouse",
  "배우자": "spouse",

  "daytime caregiver": "daytime caregiver",
  "cuidador diurno": "daytime caregiver",
  "aidant de jour": "daytime caregiver",
  "日中介護者": "daytime caregiver",
  "日间看护": "daytime caregiver",
  "مقدم الرعاية النهارية": "daytime caregiver",
  "डेकेयरर": "daytime caregiver",
  "tagespfleger": "daytime caregiver",
  "caregiver diurno": "daytime caregiver",
  "주간 보호자": "daytime caregiver",

  "primary caregiver": "primary caregiver",
  "cuidador principal": "primary caregiver",
  "aidant principal": "primary caregiver",
  "主な介護者": "primary caregiver",
  "主要看护人": "primary caregiver",
  "مقدم الرعاية الرئيسي": "primary caregiver",
  "मुख्य केयर테कर": "primary caregiver",
  "hauptbetreuer": "primary caregiver",
  "caregiver principale": "primary caregiver",
  "주 보호자": "primary caregiver",

  "family member": "family member",
  "miembro de la familia": "family member",
  "membre de la famille": "family member",
  "家族メンバー": "family member",
  "家庭成员": "family member",
  "أحد أفراد العائلة": "family member",
  "परिवार का सदस्य": "family member",
  "membro da família": "family member",
  "familienmitglied": "family member",
  "familiare": "family member",
  "가족 구성원": "family member",

  "voicemail left": "voicemail left",
  "buzón de voz grabado": "voicemail left",
  "message vocal laissé": "voicemail left",
  "留守番電話保存": "voicemail left",
  "已留语音留言": "voicemail left",
  "تم ترك بريد صوتي": "voicemail left",
  "वॉयसमेल छोड़ा गया": "voicemail left",
  "mensagem de voz deixada": "voicemail left",
  "mailbox-nachricht hinterlassen": "voicemail left",
  "messaggio in segreteria": "voicemail left",
  "음성 사서함에 녹음됨": "voicemail left",

  "cardiologist": "cardiologist",
  "cardiólogo": "cardiologist",
  "cardiologue": "cardiologist",
  "心臓専門医": "cardiologist",
  "心脏病专家": "cardiologist",
  "طبيب أمراض القلب": "cardiologist",
  "हृदय रोग विशेषज्ञ": "cardiologist",
  "cardiologista": "cardiologist",
  "kardiologe": "cardiologist",
  "cardiologo": "cardiologist",
  "심장 전문의": "cardiologist",

  "carrier": "carrier",
  "operador": "carrier",
  "opérateur": "carrier",
  "通信事業者": "carrier",
  "运营商": "carrier",
  "المشغل": "carrier",
  "वाहक": "carrier",
  "operadora": "carrier",
  "anbieter": "carrier",
  "operatore": "carrier",
  "통신사": "carrier",

  "mother": "mother",
  "mom": "mother",
  "madre": "mother",
  "mère": "mother",
  "母": "mother",
  "母亲": "mother",
  "أم": "mother",
  "माँ": "mother",
  "mãe": "mother",
  "mutter": "mother",
  "어머니": "mother",

  "father": "father",
  "dad": "father",
  "padre": "father",
  "père": "father",
  "父": "father",
  "父亲": "father",
  "أب": "father",
  "पिता": "father",
  "pai": "father",
  "vater": "father",
  "아버지": "father",

  "husband": "husband",
  "esposo": "husband",
  "mari": "husband",
  "夫": "husband",
  "丈夫": "husband",
  "زوج": "husband",
  "पति": "husband",
  "marido": "husband",
  "ehemann": "husband",
  "marito": "husband",
  "남편": "husband",

  "wife": "wife",
  "esposa": "wife",
  "épouse": "wife",
  "妻": "wife",
  "妻子": "wife",
  "زوجة": "wife",
  "पत्नी": "wife",
  "ehefrau": "wife",
  "moglie": "wife",
  "아내": "wife",

  "grandmother": "grandmother",
  "grandma": "grandmother",
  "abuela": "grandmother",
  "grand-mère": "grandmother",
  "祖母": "grandmother",
  "جدة": "grandmother",
  "दादी": "grandmother",
  "नानी": "grandmother",
  "avó": "grandmother",
  "großmutter": "grandmother",
  "nonna": "grandmother",
  "할머니": "grandmother",

  "grandfather": "grandfather",
  "grandpa": "grandfather",
  "abuelo": "grandfather",
  "grand-père": "grandfather",
  "祖父": "grandfather",
  "جد": "grandfather",
  "दादा": "grandfather",
  "नाना": "grandfather",
  "avô": "grandfather",
  "großvater": "grandfather",
  "nonno": "grandfather",
  "할아버지": "grandfather",

  "grandson": "grandson",
  "nieto": "grandson",
  "petit-fils": "grandson",
  "孫息子": "grandson",
  "孙子": "grandson",
  "حفيد": "grandson",
  "पोता": "grandson",
  "नाती": "grandson",
  "neto": "grandson",
  "enkel": "grandson",
  "손자": "grandson",

  "granddaughter": "granddaughter",
  "nieta": "granddaughter",
  "petite-fille": "granddaughter",
  "孫娘": "granddaughter",
  "孙女": "granddaughter",
  "حفيدة": "granddaughter",
  "पोती": "granddaughter",
  "नातिन": "granddaughter",
  "neta": "granddaughter",
  "enkelin": "granddaughter",
  "손녀": "granddaughter",

  "aunt": "aunt",
  "tía": "aunt",
  "tante": "aunt",
  "おば": "aunt",
  "姑姑": "aunt",
  "阿姨": "aunt",
  "عمة": "aunt",
  "خالة": "aunt",
  "चाची": "aunt",
  "मौसी": "aunt",
  "tia": "aunt",
  "zia": "aunt",
  "이모": "aunt",
  "고모": "aunt",

  "uncle": "uncle",
  "tío": "uncle",
  "oncle": "uncle",
  "おじ": "uncle",
  "叔叔": "uncle",
  "舅舅": "uncle",
  "عم": "uncle",
  "خال": "uncle",
  "चाचा": "uncle",
  "मामा": "uncle",
  "tio": "uncle",
  "onkel": "uncle",
  "zio": "uncle",
  "삼촌": "uncle",

  "cousin": "cousin",
  "primo": "cousin",
  "prima": "cousin",
  "cousine": "cousin",
  "いとこ": "cousin",
  "表亲": "cousin",
  "堂亲": "cousin",
  "ابن العم": "cousin",
  "चचेरा भाई": "cousin",
  "cugino": "cousin",
  "cugina": "cousin",
  "사촌": "cousin",

  "friend": "friend",
  "amigo": "friend",
  "amiga": "friend",
  "ami": "friend",
  "amie": "friend",
  "友人": "friend",
  "朋友": "friend",
  "صديق": "friend",
  "मित्र": "friend",
  "दोस्त": "friend",
  "amigo/a": "friend",
  "freund": "friend",
  "freundin": "friend",
  "amico": "friend",
  "amica": "friend",
  "친구": "friend",

  "contact": "contact",
  "contacto": "contact",
  "連絡先": "contact",
  "联系人": "contact",
  "جهة اتصال": "contact",
  "संपrk": "contact",
  "contato": "contact",
  "kontakt": "contact",
  "contatto": "contact",
  "연락처": "contact"
};

export const getLocalizedRelationship = (rel: string, lang: string): string => {
  if (!rel) return rel;
  const rawClean = rel.trim().toLowerCase();
  const r = CANONICAL_RELATIONSHIPS[rawClean] || rawClean;

  if (r === "daughter") {
    if (lang === "es") return "Hija";
    if (lang === "fr") return "Fille";
    if (lang === "ja") return "娘";
    if (lang === "zh") return "女儿";
    if (lang === "ar") return "ابنة";
    if (lang === "hi") return "बेटी";
    if (lang === "pt") return "Filha";
    if (lang === "de") return "Tochter";
    if (lang === "it") return "Figlia";
    if (lang === "ko") return "딸";
    return "Daughter";
  }
  if (r === "son") {
    if (lang === "es") return "Hijo";
    if (lang === "fr") return "Fils";
    if (lang === "ja") return "息子";
    if (lang === "zh") return "儿子";
    if (lang === "ar") return "ابن";
    if (lang === "hi") return "बेटा";
    if (lang === "pt") return "Filho";
    if (lang === "de") return "Sohn";
    if (lang === "it") return "Figlio";
    if (lang === "ko") return "아들";
    return "Son";
  }
  if (r === "brother") {
    if (lang === "es") return "Hermano";
    if (lang === "fr") return "Frère";
    if (lang === "ja") return "兄弟";
    if (lang === "zh") return "兄弟";
    if (lang === "ar") return "أخ";
    if (lang === "hi") return "भाई";
    if (lang === "pt") return "Irmão";
    if (lang === "de") return "Bruder";
    if (lang === "it") return "Fratello";
    if (lang === "ko") return "형제";
    return "Brother";
  }
  if (r === "sister") {
    if (lang === "es") return "Hermana";
    if (lang === "fr") return "Sœur";
    if (lang === "ja") return "姉妹";
    if (lang === "zh") return "姐妹";
    if (lang === "ar") return "أخت";
    if (lang === "hi") return "बहन";
    if (lang === "pt") return "Irmã";
    if (lang === "de") return "Schwester";
    if (lang === "it") return "Sorella";
    if (lang === "ko") return "자매";
    return "Sister";
  }
  if (r === "caregiver") {
    if (lang === "es") return "Cuidador";
    if (lang === "fr") return "Aidant";
    if (lang === "ja") return "介護者";
    if (lang === "zh") return "看护人";
    if (lang === "ar") return "مقدم الرعاية";
    if (lang === "hi") return "देखभाल करने वाला";
    if (lang === "pt") return "Cuidador";
    if (lang === "de") return "Pflegekraft";
    if (lang === "it") return "Assistente";
    if (lang === "ko") return "간병인";
    return "Caregiver";
  }
  if (r === "primary physician" || r === "primary doctor") {
    if (lang === "es") return "Médico de cabecera";
    if (lang === "fr") return "Médecin traitant";
    if (lang === "ja") return "主治医";
    if (lang === "zh") return "主治医生";
    if (lang === "ar") return "الطبيب المعالج";
    if (lang === "hi") return "प्राथमिक चिकित्सक";
    if (lang === "pt") return "Médico de família";
    if (lang === "de") return "Hausarzt";
    if (lang === "it") return "Medico curante";
    if (lang === "ko") return "주치의";
    return "Primary Physician";
  }
  if (r === "neighbor") {
    if (lang === "es") return "Vecino";
    if (lang === "fr") return "Voisin";
    if (lang === "ja") return "近所の人";
    if (lang === "zh") return "邻居";
    if (lang === "ar") return "جار";
    if (lang === "hi") return "पड़ोसी";
    if (lang === "pt") return "Vizinho";
    if (lang === "de") return "Nachbar";
    if (lang === "it") return "Vicino";
    if (lang === "ko") return "이웃";
    return "Neighbor";
  }
  if (r === "niece") {
    if (lang === "es") return "Sobrina";
    if (lang === "fr") return "Nièce";
    if (lang === "ja") return "姪";
    if (lang === "zh") return "侄女/外甥女";
    if (lang === "ar") return "ابنة الأخ/الأخت";
    if (lang === "hi") return "भतीजी/भांजी";
    if (lang === "pt") return "Sobrinha";
    if (lang === "de") return "Nichte";
    if (lang === "it") return "Nipote";
    if (lang === "ko") return "조카딸";
    return "Niece";
  }
  if (r === "nephew") {
    if (lang === "es") return "Sobrino";
    if (lang === "fr") return "Neveu";
    if (lang === "ja") return "甥";
    if (lang === "zh") return "侄子/外甥";
    if (lang === "ar") return "ابن الأخ/الأخت";
    if (lang === "hi") return "भतीजा/भांजी";
    if (lang === "pt") return "Sobrino";
    if (lang === "de") return "Neffe";
    if (lang === "it") return "Nipote";
    if (lang === "ko") return "조카";
    return "Nephew";
  }
  if (r === "spouse") {
    if (lang === "es") return "Cónyuge";
    if (lang === "fr") return "Conjoint";
    if (lang === "ja") return "配偶者";
    if (lang === "zh") return "配偶";
    if (lang === "ar") return "زوج/زوجة";
    if (lang === "hi") return "जीवनसाथी";
    if (lang === "pt") return "Cônjuge";
    if (lang === "de") return "Ehepartner";
    if (lang === "it") return "Coniuge";
    if (lang === "ko") return "배우자";
    return "Spouse";
  }
  if (r === "daytime caregiver") {
    if (lang === "es") return "Cuidador diurno";
    if (lang === "fr") return "Aidant de jour";
    if (lang === "ja") return "日中介護者";
    if (lang === "zh") return "日间看护";
    if (lang === "ar") return "مقدم الرعاية النهارية";
    if (lang === "hi") return "डेकेयरर";
    if (lang === "pt") return "Cuidador diurno";
    if (lang === "de") return "Tagespfleger";
    if (lang === "it") return "Caregiver diurno";
    if (lang === "ko") return "주간 보호자";
    return "Daytime caregiver";
  }
  if (r === "primary caregiver") {
    if (lang === "es") return "Cuidador principal";
    if (lang === "fr") return "Aidant principal";
    if (lang === "ja") return "主な介護者";
    if (lang === "zh") return "主要看护人";
    if (lang === "ar") return "مقدم الرعاية الرئيسي";
    if (lang === "hi") return "मुख्य केयरटेकर";
    if (lang === "pt") return "Cuidador principal";
    if (lang === "de") return "Hauptbetreuer";
    if (lang === "it") return "Caregiver principale";
    if (lang === "ko") return "주 보호자";
    return "Primary caregiver";
  }
  if (r === "family member") {
    if (lang === "es") return "Miembro de la familia";
    if (lang === "fr") return "Membre de la famille";
    if (lang === "ja") return "家族メンバー";
    if (lang === "zh") return "家庭成员";
    if (lang === "ar") return "أحد أفراد العائلة";
    if (lang === "hi") return "परिवार का सदस्य";
    if (lang === "pt") return "Membro da família";
    if (lang === "de") return "Familienmitglied";
    if (lang === "it") return "Familiare";
    if (lang === "ko") return "가족 구성원";
    return "Family member";
  }
  if (r === "voicemail left") {
    if (lang === "es") return "Buzón de voz grabado";
    if (lang === "fr") return "Message vocal laissé";
    if (lang === "ja") return "留守番電話保存";
    if (lang === "zh") return "已留语音留言";
    if (lang === "ar") return "تم ترك بريد صوتي";
    if (lang === "hi") return "वॉयसमेल छोड़ा गया";
    if (lang === "pt") return "Mensagem de voz deixada";
    if (lang === "de") return "Mailbox-Nachricht hinterlassen";
    if (lang === "it") return "Messaggio in segreteria";
    if (lang === "ko") return "음성 사서함에 녹음됨";
    return "Voicemail left";
  }
  if (r === "cardiologist") {
    if (lang === "es") return "Cardiólogo";
    if (lang === "fr") return "Cardiologue";
    if (lang === "ja") return "心臓専門医";
    if (lang === "zh") return "心脏病专家";
    if (lang === "ar") return "طبيب أمراض القلب";
    if (lang === "hi") return "हृदय रोग विशेषज्ञ";
    if (lang === "pt") return "Cardiologista";
    if (lang === "de") return "Kardiologe";
    if (lang === "it") return "Cardiologo";
    if (lang === "ko") return "심장 전문의";
    return "Cardiologist";
  }
  if (r === "carrier") {
    if (lang === "es") return "Operador";
    if (lang === "fr") return "Opérateur";
    if (lang === "ja") return "通信事業者";
    if (lang === "zh") return "运营商";
    if (lang === "ar") return "المشغل";
    if (lang === "hi") return "वाहक";
    if (lang === "pt") return "Operadora";
    if (lang === "de") return "Anbieter";
    if (lang === "it") return "Operatore";
    if (lang === "ko") return "통신사";
    return "Carrier";
  }
  if (r === "contact") {
    if (lang === "es") return "Contacto";
    if (lang === "fr") return "Contact";
    if (lang === "ja") return "連絡先";
    if (lang === "zh") return "联系人";
    if (lang === "ar") return "جهة اتصال";
    if (lang === "hi") return "संपर्क";
    if (lang === "pt") return "Contato";
    if (lang === "de") return "Kontakt";
    if (lang === "it") return "Contatto";
    if (lang === "ko") return "연락처";
    return "Contact";
  }
  if (r === "mother") {
    if (lang === "es") return "Madre";
    if (lang === "fr") return "Mère";
    if (lang === "ja") return "母";
    if (lang === "zh") return "母亲";
    if (lang === "ar") return "أم";
    if (lang === "hi") return "माँ";
    if (lang === "pt") return "Mãe";
    if (lang === "de") return "Mutter";
    if (lang === "it") return "Madre";
    if (lang === "ko") return "어머니";
    return "Mother";
  }
  if (r === "father") {
    if (lang === "es") return "Padre";
    if (lang === "fr") return "Père";
    if (lang === "ja") return "父";
    if (lang === "zh") return "父亲";
    if (lang === "ar") return "أب";
    if (lang === "hi") return "पिता";
    if (lang === "pt") return "Pai";
    if (lang === "de") return "Vater";
    if (lang === "it") return "Padre";
    if (lang === "ko") return "아버지";
    return "Father";
  }
  if (r === "husband") {
    if (lang === "es") return "Esposo";
    if (lang === "fr") return "Mari";
    if (lang === "ja") return "夫";
    if (lang === "zh") return "丈夫";
    if (lang === "ar") return "زوج";
    if (lang === "hi") return "पति";
    if (lang === "pt") return "Marido";
    if (lang === "de") return "Ehemann";
    if (lang === "it") return "Marito";
    if (lang === "ko") return "남편";
    return "Husband";
  }
  if (r === "wife") {
    if (lang === "es") return "Esposa";
    if (lang === "fr") return "Épouse";
    if (lang === "ja") return "妻";
    if (lang === "zh") return "妻子";
    if (lang === "ar") return "زوجة";
    if (lang === "hi") return "पत्नी";
    if (lang === "pt") return "Esposa";
    if (lang === "de") return "Ehefrau";
    if (lang === "it") return "Moglie";
    if (lang === "ko") return "아내";
    return "Wife";
  }
  if (r === "grandmother") {
    if (lang === "es") return "Abuela";
    if (lang === "fr") return "Grand-mère";
    if (lang === "ja") return "祖母";
    if (lang === "zh") return "祖母";
    if (lang === "ar") return "جدة";
    if (lang === "hi") return "दादी/नानी";
    if (lang === "pt") return "Avó";
    if (lang === "de") return "Großmutter";
    if (lang === "it") return "Nonna";
    if (lang === "ko") return "할머니";
    return "Grandmother";
  }
  if (r === "grandfather") {
    if (lang === "es") return "Abuelo";
    if (lang === "fr") return "Grand-père";
    if (lang === "ja") return "祖父";
    if (lang === "zh") return "祖父";
    if (lang === "ar") return "جد";
    if (lang === "hi") return "दादा/नाना";
    if (lang === "pt") return "Avô";
    if (lang === "de") return "Großvater";
    if (lang === "it") return "Nonno";
    if (lang === "ko") return "할아버지";
    return "Grandfather";
  }
  if (r === "grandson") {
    if (lang === "es") return "Nieto";
    if (lang === "fr") return "Petit-fils";
    if (lang === "ja") return "孫息子";
    if (lang === "zh") return "孙子";
    if (lang === "ar") return "حفيد";
    if (lang === "hi") return "पोता/नाती";
    if (lang === "pt") return "Neto";
    if (lang === "de") return "Enkel";
    if (lang === "it") return "Nipote";
    if (lang === "ko") return "손자";
    return "Grandson";
  }
  if (r === "granddaughter") {
    if (lang === "es") return "Nieta";
    if (lang === "fr") return "Petite-fille";
    if (lang === "ja") return "孫娘";
    if (lang === "zh") return "孙女";
    if (lang === "ar") return "حفيدة";
    if (lang === "hi") return "पोती/नातिन";
    if (lang === "pt") return "Neta";
    if (lang === "de") return "Enkelin";
    if (lang === "it") return "Nipote";
    if (lang === "ko") return "손녀";
    return "Granddaughter";
  }
  if (r === "aunt") {
    if (lang === "es") return "Tía";
    if (lang === "fr") return "Tante";
    if (lang === "ja") return "おば";
    if (lang === "zh") return "姑姑/阿姨";
    if (lang === "ar") return "عمة/خالة";
    if (lang === "hi") return "चाची/मौसी";
    if (lang === "pt") return "Tia";
    if (lang === "de") return "Tante";
    if (lang === "it") return "Zia";
    if (lang === "ko") return "이모/고모";
    return "Aunt";
  }
  if (r === "uncle") {
    if (lang === "es") return "Tío";
    if (lang === "fr") return "Oncle";
    if (lang === "ja") return "おじ";
    if (lang === "zh") return "叔叔/舅舅";
    if (lang === "ar") return "عم/خال";
    if (lang === "hi") return "चाचा/मामा";
    if (lang === "pt") return "Tio";
    if (lang === "de") return "Onkel";
    if (lang === "it") return "Zio";
    if (lang === "ko") return "삼촌";
    return "Uncle";
  }
  if (r === "cousin") {
    if (lang === "es") return "Primo/a";
    if (lang === "fr") return "Cousin(e)";
    if (lang === "ja") return "いとこ";
    if (lang === "zh") return "表亲/堂亲";
    if (lang === "ar") return "ابن/ابنة العم";
    if (lang === "hi") return "चचेरा भाई/बहन";
    if (lang === "pt") return "Primo/a";
    if (lang === "de") return "Cousin/Cousine";
    if (lang === "it") return "Cugino/a";
    if (lang === "ko") return "사촌";
    return "Cousin";
  }
  if (r === "friend") {
    if (lang === "es") return "Amigo/a";
    if (lang === "fr") return "Ami(e)";
    if (lang === "ja") return "友人";
    if (lang === "zh") return "朋友";
    if (lang === "ar") return "صديق";
    if (lang === "hi") return "मित्र/दोस्त";
    if (lang === "pt") return "Amigo/a";
    if (lang === "de") return "Freund/in";
    if (lang === "it") return "Amico/a";
    if (lang === "ko") return "친구";
    return "Friend";
  }

  return rel;
};

export const ELEVENLABS_VOICE_GROUPS: {
  langKey: string;
  voices: { id: string; name: string; gender: "voiceFemale" | "voiceMale"; desc: string }[];
}[] = [
  { langKey: "langEnglish", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescWarm" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescProfessional" },
  ] },
  { langKey: "langSpanish", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "2EiwWnXF2V4j29thjbwy", name: "Clyde", gender: "voiceMale", desc: "voiceDescFriendly" },
  ] },
  { langKey: "langFrench", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescSoftAccent" },
    { id: "5Q0t7uMcgp8Aagzh1ZQQ", name: "Paul", gender: "voiceMale", desc: "voiceDescDeep" },
  ] },
  { langKey: "langJapanese", voices: [
    { id: "cgSgspJ2msm6clMCxT41", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescFriendly" },
  ] },
  { langKey: "langChinese", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescCleanAccent" },
    { id: "pNInz6obpgmx5142qiA7", name: "Adam", gender: "voiceMale", desc: "voiceDescNarrator" },
  ] },
  { langKey: "langArabic", voices: [
    { id: "cgSgspJ2msm6clMCxT41", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "5Q0t7uMcgp8Aagzh1ZQQ", name: "Paul", gender: "voiceMale", desc: "voiceDescDeepAccent" },
  ] },
  { langKey: "langHindi", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescSoftAccent" },
    { id: "2EiwWnXF2V4j29thjbwy", name: "Clyde", gender: "voiceMale", desc: "voiceDescFriendlyAccent" },
  ] },
  { langKey: "langPortuguese", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescFriendlyAccent" },
    { id: "nPczCjzI2devA2R17O2Y", name: "Brian", gender: "voiceMale", desc: "voiceDescDeepAccent" },
  ] },
  { langKey: "langGerman", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescCleanAccent" },
    { id: "pNInz6obpgmx5142qiA7", name: "Adam", gender: "voiceMale", desc: "voiceDescProfessional" },
  ] },
  { langKey: "langItalian", voices: [
    { id: "cgSgspJ2msm6clMCxT41", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "nPczCjzI2devA2R17O2Y", name: "Brian", gender: "voiceMale", desc: "voiceDescDeep" },
  ] },
  { langKey: "langKorean", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescFriendlyAccent" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescProfessionalAccent" },
  ] },
];

export const getLocalizedLineLabel = (label: string, lang: string): string => {
  if (!label) return label;
  
  // 1. Primary Line check
  const isPrimary = label === "Primary line" || label === "Línea principal" || label === "Ligne principale";
  if (isPrimary) {
    if (lang === "es") return "Línea principal";
    if (lang === "fr") return "Ligne principale";
    if (lang === "ja") return "主回線";
    if (lang === "zh") return "主线路";
    if (lang === "ar") return "الخط الأساسي";
    if (lang === "hi") return "मुख्य लाइन";
    if (lang === "pt") return "Linha principal";
    if (lang === "de") return "Hauptleitung";
    if (lang === "it") return "Linea principale";
    if (lang === "ko") return "주 회선";
    return "Primary line";
  }

  // 2. Secondary Line check
  const isSecondary = label === "Secondary line" || label === "Línea secundaria" || label === "Ligne secondaire";
  if (isSecondary) {
    if (lang === "es") return "Línea secundaria";
    if (lang === "fr") return "Ligne secondaire";
    if (lang === "ja") return "副回線";
    if (lang === "zh") return "副线路";
    if (lang === "ar") return "الخط الثانوي";
    if (lang === "hi") return "द्वितीयक लाइन";
    if (lang === "pt") return "Linha secundária";
    if (lang === "de") return "Zweitverbindung";
    if (lang === "it") return "Linea secondaria";
    if (lang === "ko") return "부 회선";
    return "Secondary line";
  }

  // 3. Additional Line X check
  const match = label.match(/^(?:Additional line|Línea adicional|Ligne supplémentaire)\s+(\d+)$/i);
  if (match) {
    const idx = match[1];
    if (lang === "es") return `Línea adicional ${idx}`;
    if (lang === "fr") return `Ligne supplémentaire ${idx}`;
    if (lang === "ja") return `追加の電話番号 ${idx}`;
    if (lang === "zh") return `附加号码 ${idx}`;
    if (lang === "ar") return `خط إضافي ${idx}`;
    if (lang === "hi") return `ऐड-ऑन लाइन ${idx}`;
    if (lang === "pt") return `Linha adicional ${idx}`;
    if (lang === "de") return `Zusatzleitung ${idx}`;
    if (lang === "it") return `Linea aggiuntiva ${idx}`;
    if (lang === "ko") return `추가 회선 ${idx}`;
    return `Additional line ${idx}`;
  }

  return label;
};

export const getLocalizedPersonName = (person: string, lang: string) => {
  const isDefault = person === "Trusted contact line" || 
                    person === "Línea del círculo de confianza" || 
                    person === "Ligne du cercle de confiance";
  if (!isDefault) return person;

  if (lang === "es") return "Línea del círculo de confianza";
  if (lang === "fr") return "Ligne du cercle de confiance";
  if (lang === "ja") return "信頼できる連絡先";
  if (lang === "zh") return "信任的联系人";
  if (lang === "ar") return "خط الاتصال الموثوق";
  if (lang === "hi") return "विश्वसनीय संपर्क लाइन";
  if (lang === "pt") return "Linha de contato confiável";
  if (lang === "de") return "Vertrauenswürdige Kontaktlinie";
  if (lang === "it") return "Linea di contatto fidata";
  if (lang === "ko") return "신뢰할 수 있는 연락처 라인";
  return "Trusted contact line";
};

export const STATUS_META = {
  connected: { badge: "badge-green", label: "Connected", dirCls: "dir-in" },
  missed: { badge: "badge-rose", label: "Missed → alerted", dirCls: "dir-miss" },
  voicemail: { badge: "badge-blue", label: "Voicemail", dirCls: "dir-vm" },
};

export const getLineDefaultLabel = (totalIndex: number, plan: string, lang: string): string => {
  const baseLinesCount = planConfig(plan).includedLines;
  if (totalIndex < baseLinesCount) {
    if (totalIndex === 0) {
      return lang === "es" ? "Línea principal" : lang === "fr" ? "Ligne principale" : "Primary line";
    } else {
      return lang === "es" ? "Línea secundaria" : lang === "fr" ? "Ligne secondaire" : "Secondary line";
    }
  } else {
    const extraIndex = totalIndex - baseLinesCount + 1;
    return lang === "es" ? `Línea adicional ${extraIndex}` : lang === "fr" ? `Ligne supplémentaire ${extraIndex}` : `Additional line ${extraIndex}`;
  }
};
