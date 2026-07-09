"use client";

import React, { useState, useRef, useEffect } from "react";
import { dashboardTranslations, type DashboardTranslations } from "@/lib/dashboardTranslations";
import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { stateForAreaCode } from "@/lib/areaCodeStates";

/* ============ DEMO DATA & HELPERS ============ */
const AVATAR_COLORS = [
  "oklch(0.58 0.115 232)",
  "oklch(0.62 0.10 198)",
  "oklch(0.55 0.13 285)",
  "oklch(0.60 0.13 30)",
  "oklch(0.58 0.13 145)",
  "oklch(0.6 0.14 350)",
];


const getAcrossNumbersText = (count: number, lang: string) => {
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



const CANONICAL_RELATIONSHIPS: Record<string, string> = {
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

const getLocalizedRelationship = (rel: string, lang: string): string => {
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

const ELEVENLABS_VOICE_GROUPS: {
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

const getLocalizedLineLabel = (label: string, lang: string): string => {
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

const getLocalizedPersonName = (person: string, lang: string) => {
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

const initials = (name: string) =>
  (name || "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const PLAN_MINUTES = 60; // per line, Pro

const STATUS_META = {
  connected: { badge: "badge-green", label: "Connected", dirCls: "dir-in" },
  missed: { badge: "badge-rose", label: "Missed → alerted", dirCls: "dir-miss" },
  voicemail: { badge: "badge-blue", label: "Voicemail", dirCls: "dir-vm" },
};

/* ============ TYPES ============ */
interface Contact {
  id: string;
  name: string;
  rel: string;
  phone: string;
  color: string;
  available: boolean;
  voicePath?: string;
}

interface CoverageSlot {
  id: string;
  name: string;
  description: string;
  startHour: number;
  endHour: number;
  color: string;
}

interface Line {
  id: string;
  label: string;
  person: string;
  number: string;
  color: string;
  mode: "menu" | "cascade" | "simultaneous" | "schedule";
  minutesUsed: number;
  contacts: Contact[];
  schedule?: CoverageSlot[];
  settings?: {
    greeting?: string;
    bilingual?: boolean;
    language2?: string;
    notifSMS?: boolean;
    notifEmail?: boolean;
    notifMissed?: boolean;
    notifWeekly?: boolean;
    greetingAudioPath?: string;
    voiceId?: string;
  };
}

interface CallLogEntry {
  id: number;
  status: "connected" | "missed" | "voicemail";
  caller: string;
  routed: string;
  rel: string;
  dur: string;
  when: string;
}

interface Account {
  name: string;
  preferred: string;
  role: string;
  email: string;
  notifyEmail: string;
  phone: string;
  address: string;
  timezone: string;
  language: string;
  twoFactor: boolean;
  card: { brand: string; last4: string; exp: string };
  billingAddr: string;
  plan: "essential" | "pro";
  billingCycle: "monthly" | "yearly";
  addons: {
    extraNumbers: number;
    minuteBlocks: number;
    usedMin: number;
    rolloverMin: number;
  };
  avatarUrl?: string;
}

const getLineDefaultLabel = (totalIndex: number, plan: string, lang: string): string => {
  const baseLinesCount = plan === "pro" ? 2 : 1;
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

/* ============ ICONS ============ */
const ICONS = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  contacts: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.8"/><path d="M17.5 19a5 5 0 0 0-3-4.6"/></>,
  routing: <><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H14a2 2 0 0 1 2 2v0M8.4 6.3l7 9.4"/></>,
  log: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 7l2.1 1.2M17.7 15.8l2.1 1.2M19.8 7l-2.1 1.2M6.3 15.8 4.2 17M2.5 12h2.4M19.1 12h2.4"/></>,
  usage: <><path d="M4 19V5M4 19h16"/><rect x="7.5" y="11" width="3" height="5"/><rect x="13.5" y="7" width="3" height="9"/></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
  phone: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/></>,
  trash: <><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/></>,
  up: <><path d="m6 14 6-6 6 6"/></>,
  down: <><path d="m6 10 6 6 6-6"/></>,
  check: <><path d="m5 12 5 5L20 6"/></>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  chev: <><path d="m6 9 6 6 6-6"/></>,
  in: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  voicemail: <><circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M7 16.5h10"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  alert: <><path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z"/></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>,
  download: <><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></>,
  lock: <><rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h11"/></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.2"/></>,
  device: <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v5h-5"/></>,
};

type PickerNumber = { id: string; number: string; area: string; memorable: string | null };

function Icon({ name, className, ...rest }: { name: keyof typeof ICONS; className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {ICONS[name] || null}
    </svg>
  );
}

function Avatar({ name, color, size = 46, radius = "50%", fontSize }: { name: string; color: string; size?: number; radius?: string; fontSize?: number }) {
  return (
    <span
      className="ava"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: fontSize || size * 0.38,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </span>
  );
}

function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <span className={`badge badge-${kind}`}>
      <span className="d"></span>
      {children}
    </span>
  );
}

function Toggle({
  on,
  onChange,
  labels = ["Busy", "Available"],
}: {
  on: boolean;
  onChange: (val: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="track"></span>
      <span className="lbl">{on ? labels[1] : labels[0]}</span>
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check" />
      {msg}
    </div>
  );
}

/* ============ SUB VIEWS ============ */

/* Overview */
function StatCard({
  icon,
  iconBg,
  iconColor,
  val,
  lbl,
  trend,
  trendDir,
}: {
  icon: keyof typeof ICONS;
  iconBg: string;
  iconColor: string;
  val: string | number;
  lbl: string;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  return (
    <div className="stat">
      <div className="ic" style={{ background: iconBg, color: iconColor }}>
        <Icon name={icon} />
      </div>
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
      {trend && <div className={`trend trend-${trendDir}`}>{trend}</div>}
    </div>
  );
}

function OverviewView({
  lines,
  log,
  line,
  setView,
  setActiveLineId,
  d,
  lang,
}: {
  lines: Line[];
  log: Record<string, CallLogEntry[]>;
  line: Line;
  setView: (v: string) => void;
  setActiveLineId: (id: string) => void;
  d: DashboardTranslations;
  lang: string;
}) {
  const allCalls = Object.values(log).flat();
  const totalThisWeek = allCalls.length;
  const missed = allCalls.filter((c) => c.status !== "connected").length;
  const connectRate = totalThisWeek > 0 ? Math.round(((totalThisWeek - missed) / totalThisWeek) * 100) : 100;
  const totalContacts = lines.reduce((s, l) => s + l.contacts.length, 0);

  const recent = (log[line.id] || []).slice(0, 5);

  return (
    <div className="content-inner">
      <div className="stat-grid section-gap">
        <StatCard
          icon="phone"
          iconBg="var(--tint)"
          iconColor="var(--blue-deep)"
          val={totalThisWeek}
          lbl={d.overview.callsWeek}
          trend="▲ 18%"
          trendDir="up"
        />
        <StatCard
          icon="check"
          iconBg="oklch(0.95 0.05 158)"
          iconColor="oklch(0.45 0.13 158)"
          val={`${connectRate}%`}
          lbl={d.overview.connectedFirst}
          trend="▲ 6%"
          trendDir="up"
        />
        <StatCard
          icon="alert"
          iconBg="oklch(0.96 0.05 22)"
          iconColor="var(--rose)"
          val={missed}
          lbl={d.overview.missedAlerted}
          trend="▼ 2"
          trendDir="down"
        />
        <StatCard
          icon="contacts"
          iconBg="oklch(0.96 0.04 285)"
          iconColor="var(--violet)"
          val={totalContacts}
          lbl={d.overview.trustedContacts}
          trend={getAcrossNumbersText(lines.length, lang)}
          trendDir="up"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="ov-cols">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.overview.yourNumbers}</h2>
              <p>{lines.length} {d.overview.includedPro}</p>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lines.map((l) => (
              <div
                key={l.id}
                className="crow"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setActiveLineId(l.id);
                  setView("contacts");
                }}
              >
                <Avatar name={getLocalizedPersonName(l.person, lang)} color={l.color} size={42} radius="11px" />
                <div className="info">
                  <b>{getLocalizedLineLabel(l.label, lang)}</b>
                  <div className="rel">{getLocalizedPersonName(l.person, lang)}</div>
                  <div className="tel">{l.number}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge kind={l.mode === "menu" ? "blue" : "amber"}>
                    {l.mode === "menu" ? d.overview.callerMenu : l.mode === "schedule" ? d.overview.timeSchedule : l.mode === "simultaneous" ? d.routing.simultaneous : d.overview.cascade}
                  </Badge>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                    {l.contacts.length} {d.contacts.limitPill}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.overview.recentCalls}</h2>
              <p>{getLocalizedLineLabel(line.label, lang)}</p>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => setView("log")}>
              {d.overview.viewAll}
            </button>
          </div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {recent.map((c) => {
              const m = STATUS_META[c.status as keyof typeof STATUS_META];
              return (
                <div className="logrow" key={c.id} style={{ gridTemplateColumns: "40px 1fr auto" }}>
                  <div className={`dir ${m.dirCls}`}>
                    <Icon name={c.status === "voicemail" ? "voicemail" : c.status === "missed" ? "alert" : "in"} />
                  </div>
                  <div className="who">
                    <b>{c.routed === "No one available" ? (lang === "es" ? "Nadie disponible" : lang === "fr" ? "Personne de disponible" : lang === "ja" ? "対応者なし" : lang === "zh" ? "无人可用" : lang === "ar" ? "لا أحد متاح" : lang === "hi" ? "कोई उपलब्ध नहीं" : lang === "pt" ? "Ninguém disponível" : lang === "de" ? "Niemand verfügbar" : lang === "it" ? "Nessuno disponibile" : lang === "ko" ? "연결 가능 도우미 없음" : "No one available") : c.routed}</b>
                    <span>
                      {c.caller === "Unknown" ? (lang === "es" ? "Desconocido" : lang === "fr" ? "Inconnu" : lang === "ja" ? "不明" : lang === "zh" ? "未知" : lang === "ar" ? "مجهول" : lang === "hi" ? "अज्ञात" : lang === "pt" ? "Desconhecido" : lang === "de" ? "Unbekannt" : lang === "it" ? "Sconosciuto" : lang === "ko" ? "알 수 없음" : "Unknown") :
                       c.caller.replace("(mobile)", lang === "es" ? "(móvil)" : lang === "fr" ? "(portable)" : lang === "ja" ? "(携帯電話)" : lang === "zh" ? "(手机)" : lang === "ar" ? "(هاتف محمول)" : lang === "hi" ? "(मोबाइल)" : lang === "pt" ? "(celular)" : lang === "de" ? "(Mobiltelefon)" : lang === "it" ? "(cellulare)" : lang === "ko" ? "(휴대전화)" : "(mobile)")} · {c.when.replace("Today", lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : lang === "ja" ? "今日" : lang === "zh" ? "今天" : lang === "ar" ? "اليوم" : lang === "hi" ? "오늘" : lang === "pt" ? "Hoje" : lang === "de" ? "Heute" : lang === "it" ? "Oggi" : lang === "ko" ? "오늘" : "Today")
                                           .replace("Yesterday", lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "कल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday")
                                           .replace("Mon", lang === "es" ? "Lun" : lang === "fr" ? "Lun" : lang === "ja" ? "月" : lang === "zh" ? "周一" : lang === "ar" ? "الإثنين" : lang === "hi" ? "소म" : lang === "pt" ? "Seg" : lang === "de" ? "Mon" : lang === "it" ? "Lun" : lang === "ko" ? "월" : "Mon")
                                           .replace("Tue", lang === "es" ? "Mar" : lang === "fr" ? "Mar" : lang === "ja" ? "火" : lang === "zh" ? "周二" : lang === "ar" ? "الثلاثاء" : lang === "hi" ? "मंगल" : lang === "pt" ? "Ter" : lang === "de" ? "Tue" : lang === "it" ? "Mar" : lang === "ko" ? "화" : "Tue")
                                           .replace("Wed", lang === "es" ? "Mié" : lang === "fr" ? "Mer" : lang === "ja" ? "水" : lang === "zh" ? "周三" : lang === "ar" ? "الأربعاء" : lang === "hi" ? "बुध" : lang === "pt" ? "Qua" : lang === "de" ? "Wed" : lang === "it" ? "Mer" : lang === "ko" ? "수" : "Wed")
                                           .replace("Thu", lang === "es" ? "Jue" : lang === "fr" ? "Jeu" : lang === "ja" ? "목" : lang === "zh" ? "周四" : lang === "ar" ? "الخميس" : lang === "hi" ? "गुरु" : lang === "pt" ? "Qui" : lang === "de" ? "Thu" : lang === "it" ? "Gio" : lang === "ko" ? "목" : "Thu")
                                           .replace("Fri", lang === "es" ? "Vie" : lang === "fr" ? "Ven" : lang === "ja" ? "金" : lang === "zh" ? "周五" : lang === "ar" ? "الجمعة" : lang === "hi" ? "शुक्र" : lang === "pt" ? "Sex" : lang === "de" ? "Fr" : lang === "it" ? "Ven" : lang === "ko" ? "금" : "Fri")
                                           .replace("Sat", lang === "es" ? "Sáb" : lang === "fr" ? "Sam" : lang === "ja" ? "土" : lang === "zh" ? "周六" : lang === "ar" ? "السبت" : lang === "hi" ? "शनि" : lang === "pt" ? "Sáb" : lang === "de" ? "Sat" : lang === "it" ? "Sab" : lang === "ko" ? "토" : "Sat")
                                           .replace("Sun", lang === "es" ? "Dom" : lang === "fr" ? "Dim" : lang === "ja" ? "日" : lang === "zh" ? "周日" : lang === "ar" ? "الأحد" : lang === "hi" ? "रवि" : lang === "pt" ? "Dom" : lang === "de" ? "So" : lang === "it" ? "Dom" : lang === "ko" ? "일" : "Sun")}
                    </span>
                  </div>
                  <Badge kind={m.badge.replace("badge-", "")}>{c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .ov-cols{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

/* Contacts */
function ContactModal({
  initial,
  order,
  onSave,
  onClose,
  d,
  voiceId,
  lang,
}: {
  initial?: Contact;
  order: number;
  onSave: (c: Contact) => void;
  onClose: () => void;
  d: DashboardTranslations;
  voiceId?: string;
  lang: string;
}) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [rel, setRel] = useState(initial?.rel ? getLocalizedRelationship(initial.rel, lang) : "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [color, setColor] = useState(initial?.color || AVATAR_COLORS[order % AVATAR_COLORS.length]);

  // Web Audio recording states
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voicePath, setVoicePath] = useState<string | null>(initial?.voicePath || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const generateAIVoice = async () => {
    if (!name.trim()) {
      alert(lang === "es" ? "Por favor, introduzca un nombre primero."
        : lang === "fr" ? "Veuillez d'abord saisir un nom."
        : lang === "ja" ? "最初に名前を入力してください。"
        : lang === "zh" ? "请先输入名字。"
        : lang === "ar" ? "يرجى إدخال الاسم أولاً."
        : lang === "hi" ? "कृपया पहले एक नाम दर्ज करें।"
        : lang === "pt" ? "Por favor, insira um nome primeiro."
        : lang === "de" ? "Bitte geben Sie zuerst einen Namen ein."
        : lang === "it" ? "Inserisci prima un nome."
        : lang === "ko" ? "먼저 이름을 입력해 주세요."
        : "Please enter a name first.");
      return;
    }
    setIsGeneratingVoice(true);
    const contactId = initial?.id || "c" + Date.now();
    try {
      const response = await fetch('/api/caregiver/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: name.trim(),
          contactId,
          voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVoicePath(data.filePath);
        setAudioUrl(data.audioUrl);
      } else {
        const err = await response.json();
        alert(lang === "es" ? `La generación de voz IA falló: ${err.error || 'Error del servidor'}`
          : lang === "fr" ? `La génération de la voix IA a échoué: ${err.error || 'Erreur du serveur'}`
          : lang === "ja" ? `AI音声の生成に失敗しました: ${err.error || 'サーバーエラー'}`
          : lang === "zh" ? `AI语音生成失败: ${err.error || '服务器错误'}`
          : lang === "ar" ? `فشل توليد صوت الذكاء الاصطناعي: ${err.error || 'خطأ في الخادم'}`
          : lang === "hi" ? `एआई आवाज जनरेशन विफल रहा: ${err.error || 'सर्वर त्रुटि'}`
          : lang === "pt" ? `A geração de voz de IA falhou: ${err.error || 'Erro no servidor'}`
          : lang === "de" ? `KI-Stimmerzeugung fehlgeschlagen: ${err.error || 'Serverfehler'}`
          : lang === "it" ? `Generazione della voce IA fallita: ${err.error || 'Errore del server'}`
          : lang === "ko" ? `AI 음성 생성 실패: ${err.error || '서버 오류'}`
          : `AI voice generation failed: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert(lang === "es" ? "Error de red al generar la voz de IA."
        : lang === "fr" ? "Erreur réseau lors de la génération de la voix IA."
        : lang === "ja" ? "AI音声生成中にネットワークエラーが発生しました。"
        : lang === "zh" ? "生成 AI 语音时发生网络错误。"
        : lang === "ar" ? "خطأ في الشبكة أثناء توليد صوت الذكاء الاصطناعي."
        : lang === "hi" ? "एआई आवाज उत्पन्न करने में नेटवर्क त्रुटि।"
        : lang === "pt" ? "Erro de rede ao gerar voz de IA."
        : lang === "de" ? "Netzwerkfehler bei der Erzeugung der KI-Stimme."
        : lang === "it" ? "Errore di rete durante la generazione della voce IA."
        : lang === "ko" ? "AI 음성을 생성하는 중 네트워크 오류가 발생했습니다."
        : "Network error generating AI voice.");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Let the browser choose its native supported format
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        console.log("Recorded Audio Blob Size:", blob.size, "MIME:", blob.type);
        if (blob.size === 0) {
          alert(lang === "es" ? "Error: El tamaño del audio grabado es de 0 bytes. Es posible que el micrófono no esté capturando audio. Inténtelo de nuevo."
            : lang === "fr" ? "Erreur: La taille de l'audio enregistré est de 0 octet. Il se peut que le microphone ne capture pas de son. Veuillez réessayer."
            : lang === "ja" ? "エラー：録音された音声サイズが0バイトです。マイクが音声をキャプチャしていない可能性があります。もう一度お試しください。"
            : lang === "zh" ? "错误：录制的音频大小为 0 字节。您的麦克风可能没有捕获到声音。请重试。"
            : lang === "ar" ? "خطأ: حجم الصوت المسجل 0 بايت. قد لا يلتقط الميكروفون الصوت. يرجى المحاولة مرة أخرى."
            : lang === "hi" ? "त्रुटि: रिकॉर्ड किए गए ऑडियो का आकार 0 बाइट है। हो सकता है कि आपका माइक्रोफ़ोन ऑडियो कैप्चर नहीं कर रहा हो। कृपया पुनः प्रयास करें।"
            : lang === "pt" ? "Erro: O tamanho do áudio gravado é de 0 bytes. O microfone pode não estar capturando áudio. Tente novamente."
            : lang === "de" ? "Fehler: Die aufgenommene Audiodatei ist 0 Bytes groß. Ihr Mikrofon nimmt möglicherweise keinen Ton auf. Bitte versuchen Sie es erneut."
            : lang === "it" ? "Errore: la dimensione dell'audio registrato è 0 byte. Il microfono potrebbe non catturare l'audio. Riprova."
            : lang === "ko" ? "오류: 녹음된 오디오 크기가 0바이트입니다. 마이크가 오디오를 캡처하지 못하고 있을 수 있습니다. 다시 시도해 주세요."
            : "Error: Recorded audio size is 0 bytes. Your microphone may not be capturing audio. Please try again.");
          return;
        }

        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      // Start recording with 100ms timeslices to force continuous dataavailable events (vital for Safari)
      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert((lang === "es" ? "No se pudo iniciar la grabación: "
        : lang === "fr" ? "Impossible de démarrer l'enregistrement: "
        : lang === "ja" ? "録音を開始できませんでした: "
        : lang === "zh" ? "无法开始录音: "
        : lang === "ar" ? "تعذر بدء التسجيل: "
        : lang === "hi" ? "रिकॉर्डिंग शुरू नहीं की जा सकी: "
        : lang === "pt" ? "Não foi possível iniciar a gravação: "
        : lang === "de" ? "Aufnahme konnte nicht gestartet werden: "
        : lang === "it" ? "Impossibile avviare la registrazione: "
        : lang === "ko" ? "녹음을 시작할 수 없습니다: "
        : "Could not start recording: ") + (err instanceof Error ? err.message : 'Microphone permissions denied.'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          // Force flush any remaining audio bytes before stopping
          mediaRecorderRef.current.requestData();
        }
      } catch (err) {
        console.warn('requestData failed:', err);
      }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    setIsUploading(true);

    let currentVoicePath = voicePath;
    const contactId = initial?.id || "c" + Date.now();

    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'name.webm');
        formData.append('contactId', contactId);

        const res = await fetch('/api/caregiver/upload-recording', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          currentVoicePath = data.filePath;
        } else {
          console.error('Failed to upload recording');
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    onSave({
      id: contactId,
      name: name.trim(),
      rel: rel.trim(),
      phone: phone.trim(),
      color,
      available: initial?.available ?? true,
      voicePath: currentVoicePath || undefined,
    });
    setIsUploading(false);
  };

  return (
    <Modal
      title={editing ? d.contacts.editContact : d.contacts.addContact}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isUploading}>
            {d.contacts.cancel}
          </button>
          <button className="btn btn-primary" onClick={save} disabled={isUploading || recording}>
            {isUploading ? (
              lang === "es" ? "Subiendo..."
              : lang === "fr" ? "Téléchargement..."
              : lang === "ja" ? "アップロード中..."
              : lang === "zh" ? "正在上传..."
              : lang === "ar" ? "جاري الرفع..."
              : lang === "hi" ? "अपलोड हो रहा है..."
              : lang === "pt" ? "Enviando..."
              : lang === "de" ? "Hochladen..."
              : lang === "it" ? "Caricamento..."
              : lang === "ko" ? "업로드 중..."
              : "Uploading..."
            ) : editing ? d.contacts.saveChanges : d.contacts.addContact}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{d.contacts.fullName}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === "es" ? "ej. María Delgado"
                     : lang === "fr" ? "ex. Maria Delgado"
                     : lang === "ja" ? "例：マリア・デルガド"
                     : lang === "zh" ? "例：玛丽亚·德尔加多"
                     : lang === "ar" ? "مثال: ماريا ديلجادو"
                     : lang === "hi" ? "जैसे: मारिया डेलगाडो"
                     : lang === "pt" ? "ex. Maria Delgado"
                     : lang === "de" ? "z.B. Maria Delgado"
                     : lang === "it" ? "es. Maria Delgado"
                     : lang === "ko" ? "예: 마리아 델가도"
                     : "e.g. Maria Delgado"}
          autoFocus
          maxLength={28}
          disabled={isUploading}
        />
      </div>
      <div className="field">
        <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label>{d.contacts.relationship}</label>
            <input
              value={rel}
              onChange={(e) => setRel(e.target.value)}
              placeholder={lang === "es" ? "Hija"
                         : lang === "fr" ? "Fille"
                         : lang === "ja" ? "娘"
                         : lang === "zh" ? "女儿"
                         : lang === "ar" ? "ابنة"
                         : lang === "hi" ? "बेटी"
                         : lang === "pt" ? "Filha"
                         : lang === "de" ? "Tochter"
                         : lang === "it" ? "Figlia"
                         : lang === "ko" ? "딸"
                         : "Daughter"}
              maxLength={28}
              disabled={isUploading}
            />
          </div>
          <div>
            <label>{d.contacts.phoneRing}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(415) 555-0100"
              maxLength={20}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
      <div className="field">
        <label>
          {lang === "es" ? "Grabación de voz del nombre (para el menú de enrutamiento)"
           : lang === "fr" ? "Enregistrement vocal du nom (pour le menu d'aiguillage)"
           : lang === "ja" ? "音声名の録音（発信者メニュー配信用）"
           : lang === "zh" ? "语音名字录音（用于拨号菜单路由）"
           : lang === "ar" ? "تسجيل الاسم الصوتي (لتوجيه قائمة المتصلين)"
           : lang === "hi" ? "आवाज नाम रिकॉर्डिंग (कॉलर मेनू रूटिंग के लिए)"
           : lang === "pt" ? "Gravação de nome de voz (para menu de chamadas)"
           : lang === "de" ? "Aufzeichnung des gesprochenen Namens (für Sprachmenü-Routing)"
           : lang === "it" ? "Registrazione vocale del nome (per il menu di deviazione)"
           : lang === "ko" ? "음성 이름 녹음 (발신자 메뉴 라우팅용)"
           : "Voice Name Recording (for Caller Menu Routing)"}
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
          {recording ? (
            <button className="btn btn-rose btn-sm" onClick={stopRecording} type="button" style={{ background: 'var(--rose)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
              {lang === "es" ? "🛑 Detener grabación"
               : lang === "fr" ? "🛑 Arrêter l'enregistrement"
               : lang === "ja" ? "🛑 録音停止"
               : lang === "zh" ? "🛑 停止录音"
               : lang === "ar" ? "🛑 إيقاف التسجيل"
               : lang === "hi" ? "🛑 रिकॉर्डिंग रोकें"
               : lang === "pt" ? "🛑 Parar gravação"
               : lang === "de" ? "🛑 Aufnahme stoppen"
               : lang === "it" ? "🛑 Interrompi registrazione"
               : lang === "ko" ? "🛑 녹음 중지"
               : "🛑 Stop Recording"}
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={startRecording} type="button" disabled={isUploading || isGeneratingVoice} style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
              {lang === "es" ? "🎙️ Grabar nombre"
               : lang === "fr" ? "🎙️ Enregistrer le nom"
               : lang === "ja" ? "🎙️ 名前を録音"
               : lang === "zh" ? "🎙️ 录制名字"
               : lang === "ar" ? "🎙️ تسجيل الاسم"
               : lang === "hi" ? "🎙️ नाम रिकॉर्ड करें"
               : lang === "pt" ? "🎙️ Gravar nome"
               : lang === "de" ? "🎙️ Name aufnehmen"
               : lang === "it" ? "🎙️ Registra nome"
               : lang === "ko" ? "🎙️ 이름 녹음"
               : "🎙️ Record Name"}
            </button>
          )}

          <button
            className="btn btn-ghost btn-sm"
            onClick={generateAIVoice}
            type="button"
            disabled={isUploading || isGeneratingVoice || !name.trim()}
            style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
          >
            {isGeneratingVoice ? (
              lang === "es" ? "✨ Generando..."
              : lang === "fr" ? "✨ Génération..."
              : lang === "ja" ? "✨ 生成中..."
              : lang === "zh" ? "✨ 正在生成..."
              : lang === "ar" ? "✨ جاري التوليد..."
              : lang === "hi" ? "✨ उत्पन्न हो रहा है..."
              : lang === "pt" ? "✨ Gerando..."
              : lang === "de" ? "✨ Generiert..."
              : lang === "it" ? "✨ Generazione in corso..."
              : lang === "ko" ? "✨ 생성 중..."
              : "✨ Generating..."
            ) : (
              lang === "es" ? "🤖 Generar voz de IA"
              : lang === "fr" ? "🤖 Générer la voix d'IA"
              : lang === "ja" ? "🤖 AI音声を生成"
              : lang === "zh" ? "🤖 生成 AI 语音"
              : lang === "ar" ? "🤖 توليد صوت الذكاء الاصطناعي"
              : lang === "hi" ? "🤖 एआई आवाज उत्पन्न करें"
              : lang === "pt" ? "🤖 Gerar voz de IA"
              : lang === "de" ? "🤖 KI-Stimme generieren"
              : lang === "it" ? "🤖 Genera voce IA"
              : lang === "ko" ? "🤖 AI 음성 생성"
              : "🤖 Generate AI Voice"
            )}
          </button>
          
          {audioUrl && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <audio src={audioUrl} controls style={{ width: 220, height: 32, borderRadius: 4 }} />
            </div>
          )}

          {voicePath && !audioUrl && (
            <span style={{ fontSize: '0.82rem', color: 'oklch(0.55 0.18 140)', fontWeight: 600 }}>
              {lang === "es" ? "Mensaje de voz guardado"
               : lang === "fr" ? "Message vocal enregistré"
               : lang === "ja" ? "保存された音声プロンプト"
               : lang === "zh" ? "已保存的语音提示"
               : lang === "ar" ? "رسالة صوتية محفوظة"
               : lang === "hi" ? "सहेजा गया वॉयस प्रॉम्प्ट"
               : lang === "pt" ? "Mensagem de voz salva"
               : lang === "de" ? "Gespeicherte Sprachansage"
               : lang === "it" ? "Messaggio vocale salvato"
               : lang === "ko" ? "저장된 음성 프롬프트"
               : "Saved Voice Prompt"}
            </span>
          )}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>{d.contacts.avatarColor}</label>
        <div className="swatch-row" style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {AVATAR_COLORS.map((c) => (
            <span
              key={c}
              className={`swatch ${c === color ? "sel" : ""}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c,
                cursor: isUploading ? "default" : "pointer",
                border: c === color ? "2.5px solid var(--accent)" : "1px solid var(--line)",
              }}
              onClick={() => { if (!isUploading) setColor(c); }}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ContactsView({
  line,
  setLine,
  showToast,
  d,
  lang,
  plan,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: DashboardTranslations;
  lang: string;
  plan: "essential" | "pro";
}) {
  const [modal, setModal] = useState<{ edit?: Contact } | null>(null);
  const contacts = line.contacts;
  const limit = plan === "pro" ? 6 : 3;
  const full = contacts.length >= limit;

  const move = (idx: number, dir: number) => {
    const j = idx + dir;
    if (j < 0 || j >= contacts.length) return;
    setLine((prev) =>
      prev.map((l) => {
        if (l.id !== line.id) return l;
        const arr = [...l.contacts];
        [arr[idx], arr[j]] = [arr[j], arr[idx]];
        return { ...l, contacts: arr };
      })
    );
  };

  const remove = (id: string) => {
    setLine((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, contacts: l.contacts.filter((c) => c.id !== id) } : l))
    );
    showToast(d.contacts.removedToast);
  };

  const toggleAvail = (id: string) =>
    setLine((prev) =>
      prev.map((l) =>
        l.id === line.id
          ? {
              ...l,
              contacts: l.contacts.map((c) => (c.id === id ? { ...c, available: !c.available } : c)),
            }
          : l
      )
    );

  const save = (contact: Contact) => {
    setLine((prev) =>
      prev.map((l) => {
        if (l.id !== line.id) return l;
        const exists = l.contacts.some((c) => c.id === contact.id);
        return {
          ...l,
          contacts: exists
            ? l.contacts.map((c) => (c.id === contact.id ? contact : c))
            : [...l.contacts, contact],
        };
      })
    );
    showToast(modal?.edit ? d.contacts.updatedToast : d.contacts.addedToast);
    setModal(null);
  };

  return (
    <div className="content-inner">
      <div className="contacts-head">
        <div>
          <p className="hint">
            <b>{getLocalizedPersonName(line.person, lang).split(" · ")[0]}</b>
            {lang === "es" ? " puede contactar en " : lang === "fr" ? " peut joindre sur " : lang === "ja" ? " が連絡可能な相手番号: " : lang === "zh" ? " 可以呼叫的电话号码: " : lang === "ar" ? " يمكنه الاتصال على " : lang === "hi" ? " इस नंबर पर संपर्क कर सकते हैं: " : lang === "pt" ? " pode contatar em " : lang === "de" ? " kann unter dieser Nummer erreichen: " : lang === "it" ? " può raggiungere su " : lang === "ko" ? " 가 연락할 수 있는 번호: " : " can reach on "}
            {line.number}.{" "}
            {line.mode === "schedule"
              ? d.contacts.hintSchedule
              : line.mode === "menu"
              ? d.contacts.hintMenu
              : d.contacts.hintCascade}
          </p>
        </div>
        <span className="cap-pill">{contacts.length} / {limit} {d.contacts.limitPill}</span>
      </div>

      <div className="clist">
        {contacts.map((c, i) => (
          <div className={`crow ${c.available ? "" : "dim"}`} key={c.id}>
            <div className="reorder">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <Icon name="up" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === contacts.length - 1} aria-label="Move down">
                <Icon name="down" />
              </button>
            </div>
            <div className="pos">
              <span className="num">{i + 1}</span>
            </div>
            <Avatar name={c.name} color={c.color} />
            <div className="info">
              <b>{c.name}</b>
              <div className="rel">
                {c.rel ? getLocalizedRelationship(c.rel, lang) : (lang === "es" ? "Contacto"
                           : lang === "fr" ? "Contact"
                           : lang === "ja" ? "連絡先"
                           : lang === "zh" ? "联系人"
                           : lang === "ar" ? "جهة اتصال"
                           : lang === "hi" ? "संपर्क"
                           : lang === "pt" ? "Contato"
                           : lang === "de" ? "Kontakt"
                           : lang === "it" ? "Contatto"
                           : lang === "ko" ? "연락처"
                           : "Contact")}
              </div>
              <div className="tel">
                {c.phone || (lang === "es" ? "Sin número configurado"
                             : lang === "fr" ? "Aucun número configuré"
                             : lang === "ja" ? "番号が設定されていません"
                             : lang === "zh" ? "未设置号码"
                             : lang === "ar" ? "لا يوجد رقم محدد"
                             : lang === "hi" ? "कोई नंबर सेट नहीं"
                             : lang === "pt" ? "Nenhum número configurado"
                             : lang === "de" ? "Keine Nummer eingerichtet"
                             : lang === "it" ? "Nessun numero impostato"
                             : lang === "ko" ? "설정된 번호 없음"
                             : "No number set")}
              </div>
            </div>
            <div className="acts">
              <Toggle on={c.available} onChange={() => toggleAvail(c.id)} labels={[d.contacts.busy, d.contacts.available]} />
              <button className="mini" onClick={() => setModal({ edit: c })} aria-label="Edit">
                <Icon name="edit" />
              </button>
              <button className="mini del" onClick={() => remove(c.id)} aria-label="Remove">
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}

        <div className={`add-slot ${full ? "full" : ""}`} onClick={() => !full && setModal({})}>
          {full ? (
            <>{d.contacts.limitReached.replace("6", limit.toString())}</>
          ) : (
            <>
              <Icon name="plus" /> {d.contacts.addContact}
            </>
          )}
        </div>
      </div>

      {modal && (
        <ContactModal
          initial={modal.edit}
          order={contacts.length}
          onSave={save}
          onClose={() => setModal(null)}
          d={d}
          voiceId={line.settings?.voiceId}
          lang={lang}
        />
      )}
    </div>
  );
}

/* Call Simulator */
function TestCall({ line, d, lang }: { line: Line; d: DashboardTranslations; lang: string }) {
  const [screen, setScreen] = useState({
    cls: "",
    av: "—",
    avColor: null as string | null,
    name: d.sim.ready,
    state: d.sim.runTest,
    ring: false,
  });
  const [dots, setDots] = useState(0);
  const [activeDots, setActiveDots] = useState<Record<number, string>>({});
  const [menu, setMenu] = useState<Contact[] | null>(null);
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);
  const resolveMenu = useRef<((idx: number | null) => void) | null>(null);

  const contacts = line.contacts;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    reset();
    // `lang` is included so the idle screen re-localizes when the language
    // selector changes (line.id/line.mode alone don't change on that event).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, line.mode, lang]);

  function reset() {
    cancelled.current = true;
    setMenu(null);
    setDots(0);
    setActiveDots({});
    setRunning(false);
    setScreen({
      cls: "",
      av: line.mode === "schedule" ? "🕒" : line.mode === "menu" ? "☰" : "—",
      avColor: null,
      name: line.mode === "schedule" ? d.overview.timeSchedule : line.mode === "menu" ? d.overview.callerMenu : line.mode === "simultaneous" ? d.routing.simultaneous : d.sim.ready,
      state:
        line.mode === "schedule"
          ? d.routing.scheduleDesc
          : line.mode === "menu"
          ? d.routing.menuDesc
          : line.mode === "simultaneous"
          ? d.routing.simultaneousDesc
          : d.sim.runTest,
      ring: false,
    });
  }

  async function ringConnect(c: Contact, idx: number) {
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `${d.sim.ringing} ${c.rel ? getLocalizedRelationship(c.rel, lang) : ""}…`,
      ring: true,
    });
    await sleep(1500);
    if (cancelled.current) return false;
    if (c.available) {
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
      return true;
    }
    return false;
  }

  async function runCascade() {
    setDots(contacts.length);
    setActiveDots({});
    setScreen({ cls: "", av: "•", avColor: null, name: d.sim.connecting, state: d.sim.connecting, ring: false });
    await sleep(800);
    let done = false;
    for (let i = 0; i < contacts.length; i++) {
      if (cancelled.current) return;
      setActiveDots((d) => ({ ...d, [i]: "active" }));
      const c = contacts[i];
      const ok = await ringConnect(c, i);
      if (cancelled.current) return;
      if (ok) {
        done = true;
        break;
      }
      setActiveDots((d) => ({ ...d, [i]: "done" }));
      setScreen({
        cls: "ring-state",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.noAnswer,
        ring: false,
      });
      await sleep(500);
    }
    if (!done && !cancelled.current) {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.sim.voicemail,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function runSimultaneous() {
    setDots(contacts.length);
    // Ring every contact at once.
    setActiveDots(Object.fromEntries(contacts.map((_, i) => [i, "active"])));
    setScreen({
      cls: "ring-state",
      av: "•",
      avColor: null,
      name: d.routing.simultaneous,
      state: `${d.sim.ringing}…`,
      ring: true,
    });
    await sleep(1600);
    if (cancelled.current) return;
    // The first available contact answers.
    const firstAvailable = contacts.findIndex((c) => c.available);
    if (firstAvailable !== -1) {
      const c = contacts[firstAvailable];
      setActiveDots(
        Object.fromEntries(contacts.map((_, i) => [i, i === firstAvailable ? "active" : "done"]))
      );
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
    } else {
      setActiveDots(Object.fromEntries(contacts.map((_, i) => [i, "done"])));
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.sim.voicemail,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  function waitForPick() {
    return new Promise<number | null>((res) => {
      resolveMenu.current = res;
    });
  }

  async function runMenu() {
    setDots(0);
    setActiveDots({});
    setScreen({ cls: "", av: "☎", avColor: null, name: "Welcome", state: "Listen for the menu…", ring: false });
    await sleep(900);
    if (cancelled.current) return;
    setMenu(contacts);
    setScreen({ cls: "menu", av: "", avColor: null, name: "", state: "", ring: false });
    const idx = await waitForPick();
    if (cancelled.current || idx === null) return;
    setMenu(null);
    const c = contacts[idx];
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `${d.sim.connecting} ${c.rel ? getLocalizedRelationship(c.rel, lang) : c.name}…`,
      ring: true,
    });
    await sleep(1500);
    if (cancelled.current) return;
    if (c.available) {
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
    } else {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: `${c.name} (${d.contacts.busy})`,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function runSchedule() {
    setDots(0);
    setActiveDots({});
    setScreen({ cls: "", av: "•", avColor: null, name: d.sim.connecting, state: d.sim.connecting, ring: false });
    await sleep(900);
    if (cancelled.current) return;

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const schedule = line.schedule || [
      {
        id: "slot1",
        name: "Nurse Dawn",
        description: "Overnight support",
        startHour: 0,
        endHour: 7,
        color: "oklch(0.44 0.105 240)",
      },
      {
        id: "slot2",
        name: line.contacts[0]?.name || "Caregiver",
        description: "Daytime coverage",
        startHour: 7,
        endHour: 15,
        color: line.contacts[0]?.color || "oklch(0.62 0.10 198)",
      },
      {
        id: "slot3",
        name: line.contacts[1]?.name || "Primary Caregiver",
        description: "Afternoon primary",
        startHour: 15,
        endHour: 21,
        color: line.contacts[1]?.color || "oklch(0.58 0.115 232)",
      },
      {
        id: "slot4",
        name: line.contacts[2]?.name || "Evening contact",
        description: "Evening shift",
        startHour: 21,
        endHour: 24,
        color: line.contacts[2]?.color || "oklch(0.55 0.11 280)",
      },
    ];
    
    const activeSlot = schedule.find(s => currentHour >= s.startHour && currentHour < s.endHour);
    
    if (!activeSlot) {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.routing.noCaregivers,
        state: d.sim.vmSent,
        ring: false,
      });
      return;
    }

    const contact = line.contacts.find(c => c.name === activeSlot.name);
    
    setScreen({
      cls: "ring-state",
      av: initials(activeSlot.name),
      avColor: activeSlot.color,
      name: activeSlot.name,
      state: `${d.sim.ringing} (${activeSlot.description})…`,
      ring: true,
    });
    
    await sleep(1800);
    if (cancelled.current) return;

    const available = contact ? contact.available : true;

    if (available) {
      setScreen({
        cls: "connected",
        av: initials(activeSlot.name),
        avColor: activeSlot.color,
        name: activeSlot.name,
        state: `${d.sim.connected} — ${d.common.activeNow}`,
        ring: false,
      });
    } else {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: `${activeSlot.name} (${d.contacts.busy})`,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function run() {
    if (running || !contacts.length) return;
    cancelled.current = false;
    setRunning(true);
    if (line.mode === "menu") await runMenu();
    else if (line.mode === "schedule") await runSchedule();
    else if (line.mode === "simultaneous") await runSimultaneous();
    else await runCascade();
    if (!cancelled.current) {
      await sleep(2200);
    }
    setRunning(false);
    reset();
  }

  const pick = (i: number) => {
    if (resolveMenu.current) {
      resolveMenu.current(i);
      resolveMenu.current = null;
    }
  };

  return (
    <div className="simwrap">
      <div
        className={`sim-phone ${screen.cls === "connected" ? "connected" : ""} ${
          screen.cls === "voicemail" ? "voicemail" : ""
        } ${menu ? "menu" : ""}`}
      >
        {menu ? (
          <div className="sim-menu">
            <div className="t">Thanks for calling:</div>
            {menu.map((c, i) => (
              <button className="sim-opt" key={c.id} onClick={() => pick(i)}>
                <span className="digit">{i + 1}</span>
                <span>
                  <b>
                    {d.routing.caregiver} {i + 1} — {c.name}
                  </b>
                  <small>{c.rel ? getLocalizedRelationship(c.rel, lang) : (lang === "es" ? "Contacto" : lang === "fr" ? "Contact" : lang === "ja" ? "連絡先" : lang === "zh" ? "联系人" : lang === "ar" ? "جهة اتصال" : lang === "hi" ? "संपर्क" : lang === "pt" ? "Contato" : lang === "de" ? "Kontakt" : lang === "it" ? "Contatto" : lang === "ko" ? "연락처" : "Contact")}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <span className="numline">{line.number}</span>
            <div
              className={`sim-ava ${screen.ring ? "ring" : ""}`}
              style={{ background: screen.avColor || undefined }}
            >
              {screen.av}
            </div>
            <div className="sim-name">{screen.name}</div>
            <div className="sim-state">{screen.state}</div>
            {dots > 0 && (
              <div className="sim-dots">
                {Array.from({ length: dots }).map((_, i) => (
                  <i key={i} className={activeDots[i] || ""} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sim-side">
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--ink-faint)",
              marginBottom: 6,
            }}
          >
            {line.mode === "schedule"
              ? d.routing.scheduleTitle
              : line.mode === "menu"
              ? d.overview.callerMenu
              : line.mode === "simultaneous"
              ? d.routing.simultaneous
              : d.overview.cascade}
          </div>
          {contacts.map((c, i) => (
            <div className="preview-row" key={c.id}>
              <span className="dg">{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: "0.86rem", display: "block" }}>{c.name}</b>
                <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>{getLocalizedRelationship(c.rel, lang)}</span>
              </div>
              {!c.available && (
                <span className="badge badge-gray">
                  <span className="d"></span>{d.contacts.busy}
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "10px 16px",
            fontSize: "0.88rem",
            borderRadius: "var(--r-md)",
          }}
          onClick={run}
          disabled={running || !contacts.length}
        >
          <Icon name="phone" style={{ width: 16, height: 16 }} /> {running ? d.sim.connecting : d.sim.runTest}
        </button>
      </div>
    </div>
  );
}

/* Routing view */
function RoutingView({
  line,
  setLine,
  showToast,
  d,
  lang,
  plan,
  setView,
  setAcctTab,
  setAutoOpenPlanModal,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: DashboardTranslations;
  lang: string;
  plan: "essential" | "pro";
  setView: (v: string) => void;
  setAcctTab: (t: string) => void;
  setAutoOpenPlanModal: (open: boolean) => void;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const [localSchedule, setLocalSchedule] = useState<CoverageSlot[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Slot editor state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotName, setSlotName] = useState("");
  const [customName, setCustomName] = useState("");
  const [slotDesc, setSlotDesc] = useState("");
  const [slotStart, setSlotStart] = useState(0);
  const [slotEnd, setSlotEnd] = useState(4);
  const [slotColor, setSlotColor] = useState("oklch(0.58 0.115 232)");

  // Add slot state
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setLocalSchedule(line.schedule || [
      {
        id: "slot1",
        name: "Nurse Dawn",
        description: "Overnight support",
        startHour: 0,
        endHour: 7,
        color: "oklch(0.44 0.105 240)",
      },
      {
        id: "slot2",
        name: line.contacts[0]?.name || "Caregiver",
        description: "Daytime coverage",
        startHour: 7,
        endHour: 15,
        color: line.contacts[0]?.color || "oklch(0.62 0.10 198)",
      },
      {
        id: "slot3",
        name: line.contacts[1]?.name || "Primary Caregiver",
        description: "Afternoon primary",
        startHour: 15,
        endHour: 21,
        color: line.contacts[1]?.color || "oklch(0.58 0.115 232)",
      },
      {
        id: "slot4",
        name: line.contacts[2]?.name || "Evening contact",
        description: "Evening shift",
        startHour: 21,
        endHour: 24,
        color: line.contacts[2]?.color || "oklch(0.55 0.11 280)",
      },
    ]);
  }, [line.id, line.contacts]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const activeSlot = localSchedule.find(
    (slot) => currentHour >= slot.startHour && currentHour < slot.endHour
  );

  const saveSchedule = (newSchedule: CoverageSlot[]) => {
    setLocalSchedule(newSchedule);
    setLine((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, schedule: newSchedule } : l))
    );
    showToast(ext.scheduleUpdatedToast);
  };

  const startEditing = (slot: CoverageSlot) => {
    setEditingSlotId(slot.id);
    const isPreset = line.contacts.some((c) => c.name === slot.name) || slot.name === "Nurse Dawn";
    if (isPreset) {
      setSlotName(slot.name);
      setCustomName("");
    } else {
      setSlotName("Custom");
      setCustomName(slot.name);
    }
    setSlotDesc(slot.description);
    setSlotStart(slot.startHour);
    setSlotEnd(slot.endHour);
    setSlotColor(slot.color);
  };

  const cancelEditing = () => {
    setEditingSlotId(null);
  };

  const saveSlot = (slotId: string) => {
    const finalName = slotName === "Custom" ? (customName || "Custom Slot") : slotName;
    const newSchedule = localSchedule.map((s) =>
      s.id === slotId
        ? {
            ...s,
            name: finalName,
            description: slotDesc,
            startHour: slotStart,
            endHour: slotEnd,
            color: slotColor,
          }
        : s
    );
    saveSchedule(newSchedule);
    setEditingSlotId(null);
  };

  const deleteSlot = (slotId: string) => {
    const newSchedule = localSchedule.filter((s) => s.id !== slotId);
    saveSchedule(newSchedule);
  };

  const addNewSlot = () => {
    const finalName = slotName === "Custom" ? (customName || "New Slot") : slotName;
    const newSlot: CoverageSlot = {
      id: `slot-new-${Date.now()}`,
      name: finalName,
      description: slotDesc || "Coverage slot",
      startHour: slotStart,
      endHour: slotEnd,
      color: slotColor,
    };
    const newSchedule = [...localSchedule, newSlot];
    saveSchedule(newSchedule);
    setShowAddForm(false);
  };

  const sortedSlots = [...localSchedule].sort((a, b) => a.startHour - b.startHour);
  const totalHours = localSchedule.reduce((sum, slot) => sum + (slot.endHour - slot.startHour), 0);

  let hasOverlap = false;
  let hasGap = false;
  const gapsList: { start: number; end: number }[] = [];

  if (localSchedule.length === 0) {
    hasGap = true;
    gapsList.push({ start: 0, end: 24 });
  } else {
    if (sortedSlots[0].startHour > 0) {
      hasGap = true;
      gapsList.push({ start: 0, end: sortedSlots[0].startHour });
    }
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];
      if (current.endHour < next.startHour) {
        hasGap = true;
        gapsList.push({ start: current.endHour, end: next.startHour });
      } else if (current.endHour > next.startHour) {
        hasOverlap = true;
      }
    }
    if (sortedSlots[sortedSlots.length - 1].endHour < 24) {
      hasGap = true;
      gapsList.push({ start: sortedSlots[sortedSlots.length - 1].endHour, end: 24 });
    }
  }

  const formatHour = (h: number) => {
    if (h === 0 || h === 24) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  const PRESET_COLORS = [
    { value: "oklch(0.58 0.115 232)", name: "Amber" },
    { value: "oklch(0.62 0.10 198)", name: "Teal" },
    { value: "oklch(0.44 0.105 240)", name: "Blue" },
    { value: "oklch(0.55 0.11 280)", name: "Purple" },
    { value: "oklch(0.60 0.12 30)", name: "Coral" },
    { value: "oklch(0.58 0.12 145)", name: "Green" },
  ];

  const setMode = (mode: "cascade" | "menu" | "simultaneous" | "schedule") => {
    if (mode === line.mode) return;
    if (plan === "essential" && mode !== "cascade") {
      const upgradeMsg = lang === "es" ? "¡Mejora a Pro para desbloquear este modo!"
        : lang === "fr" ? "Passez à la version Pro pour débloquer ce mode !"
        : lang === "ja" ? "このモードを有効にするにはProプランにアップグレードしてください"
        : lang === "zh" ? "升级到专业版以解锁此模式"
        : lang === "ar" ? "ترقية إلى باقة برو لفتح هذا الوضع"
        : lang === "hi" ? "इस मोड को अनलॉक करने के लिए प्रो में अपग्रेड करें"
        : lang === "pt" ? "Atualize para o Pro para desbloquear este modo"
        : lang === "de" ? "Upgrade auf Pro, um diesen Modus freizuschalten"
        : lang === "it" ? "Passa a Pro per sbloccare questa modalità"
        : lang === "ko" ? "이 모드를 잠금 해제하려면 Pro로 업그레이드하세요"
        : "Upgrade to Pro to unlock this routing mode";
      showToast(upgradeMsg);
      setAcctTab("billing");
      setAutoOpenPlanModal(true);
      setView("account");
      return;
    }
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, mode } : l)));
    showToast(d.common.savedToast);
  };

  return (
    <div className="content-inner">
      {/* Line Details Customization Card */}
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{ext.lineDetails}</h2>
            <p>{ext.lineDetailsSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label>{ext.lineLabel}</label>
            <input
              type="text"
              value={getLocalizedLineLabel(line.label, lang)}
              onChange={(e) => setLine((prev) => prev.map((l) => l.id === line.id ? { ...l, label: e.target.value } : l))}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
              placeholder="e.g. Robert's line"
              style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)", width: "100%", outline: "none" }}
            />
          </div>
          <div className="field">
            <label>{ext.assignedToPerson}</label>
            <input
              type="text"
              value={getLocalizedPersonName(line.person, lang)}
              onChange={(e) => setLine((prev) => prev.map((l) => l.id === line.id ? { ...l, person: e.target.value } : l))}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
              placeholder="e.g. Robert Hale · Dad"
              style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)", width: "100%", outline: "none" }}
            />
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{d.routing.connMethod}</h2>
            <p>
              {d.routing.connMethodSub}
            </p>
          </div>
        </div>
        <div className="card-pad">
          <div className="mode-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div
              className={`mode-card ${line.mode === "cascade" ? "sel" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "cascade" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
              }}
              onClick={() => setMode("cascade")}
            >
              <div className="ic" style={{ marginBottom: 12 }}>
                <Icon name="routing" style={{ width: 24, height: 24 }} />
              </div>
              <h4>{d.routing.cascade}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.cascadeDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "simultaneous" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "simultaneous" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("simultaneous")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="spark" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.simultaneous}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.simultaneousDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "menu" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "menu" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("menu")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="list" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.callerMenu}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.menuDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "schedule" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "schedule" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("schedule")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="clock" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.scheduleTitle}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.scheduleDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Around-the-clock coverage timeline */}
      {line.mode === "schedule" && (
        <div className="card section-gap">
          <div className="card-head">
            <div>
              <h2>{d.routing.scheduleTitle}</h2>
              <p>
                {d.routing.scheduleSub}
              </p>
            </div>
            {activeSlot && (
              <Badge kind="green">
                {d.common.activeNow}: {activeSlot.name}
              </Badge>
            )}
          </div>
          <div className="card-pad">
          {/* Timeline visualization */}
          <div style={{ background: "var(--tint)", padding: 20, borderRadius: "var(--r-md)", border: "1px solid var(--line)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{ext.coverageTimeline}</span>
              <span className="demo-status" style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: 999 }}>
                <span className="live" style={{ background: activeSlot ? "var(--green)" : "var(--ink-faint)" }}></span>
                {ext.currentTimeLabel}: {formatHour(Math.floor(currentHour))}:{String(Math.floor((currentHour % 1) * 60)).padStart(2, '0')}
              </span>
            </div>
            
            {/* Visual Timeline Track */}
            <div style={{ height: 48, display: "flex", borderRadius: 8, overflow: "hidden", position: "relative", background: "oklch(0.9 0.01 220)" }}>
              {sortedSlots.map((slot) => {
                const duration = slot.endHour - slot.startHour;
                const pct = (duration / 24) * 100;
                return (
                  <div
                    key={slot.id}
                    style={{
                      width: `${pct}%`,
                      background: slot.color,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                      fontSize: "0.8rem",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      paddingInline: 4,
                      borderRight: "1px solid rgba(255,255,255,0.15)",
                    }}
                    title={`${slot.name} (${formatHour(slot.startHour)} - ${formatHour(slot.endHour)})`}
                  >
                    <b style={{ display: "block" }}>{slot.name}</b>
                    <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>{formatHour(slot.startHour)} - {formatHour(slot.endHour)}</span>
                  </div>
                );
              })}
              
              {/* Pulsating Indicator for current time */}
              <div
                style={{
                  position: "absolute",
                  left: `${(currentHour / 24) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: "oklch(0.60 0.12 30)",
                  boxShadow: "0 0 10px 2px oklch(0.60 0.12 30)",
                  zIndex: 10,
                }}
              />
            </div>
            
            {/* Timeline Hour Marks */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--ink-faint)", marginTop: 8, paddingInline: 4 }}>
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          {/* Validation Alert / Status */}
          {(hasGap || hasOverlap) && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: hasOverlap ? "oklch(0.96 0.04 25)" : "oklch(0.96 0.05 75)", color: hasOverlap ? "oklch(0.5 0.13 20)" : "oklch(0.5 0.13 60)", fontSize: "0.86rem", display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                {hasOverlap && <div><b>{lang === "es" ? "Superposición de cobertura:" : lang === "fr" ? "Chevauchement de couverture :" : lang === "ja" ? "重複するカバー範囲:" : lang === "zh" ? "时间段重叠:" : lang === "ar" ? "تداخل التغطية:" : lang === "hi" ? "ओवरलैपिंग कवरेज:" : lang === "pt" ? "Sobreposição de cobertura:" : lang === "de" ? "Überschneidung der Abdeckung:" : lang === "it" ? "Copertura sovrapposta:" : lang === "ko" ? "스케줄 중복:" : "Overlapping Coverage:"}</b> {ext.overlappingCoverage.split(":").slice(1).join(":").trim() || ext.overlappingCoverage}</div>}
                {hasGap && (
                  <div>
                    <b>{lang === "es" ? "Horarios sin cobertura:" : lang === "fr" ? "Créneaux non couverts :" : lang === "ja" ? "未カバーの時間帯:" : lang === "zh" ? "未覆盖的时间段:" : lang === "ar" ? "فترات غير مغطاة:" : lang === "hi" ? "बिना कवरेज के अंतराल:" : lang === "pt" ? "Períodos sem cobertura:" : lang === "de" ? "Unabgedeckte Zeiten:" : lang === "it" ? "Fasce orarie scoperte:" : lang === "ko" ? "담당자 부재 시간대:" : "Uncovered Gaps:"}</b>{" "}
                    {gapsList.map((g, idx) => (
                      <span key={idx}>
                        {idx > 0 && ", "}
                        {formatHour(g.start)} {lang === "es" ? " a " : lang === "fr" ? " à " : lang === "ja" ? " から " : lang === "zh" ? " 至 " : lang === "ar" ? " إلى " : lang === "hi" ? " से " : lang === "pt" ? " a " : lang === "de" ? " bis " : lang === "it" ? " a " : lang === "ko" ? "부터 " : " to "} {formatHour(g.end)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slots List and Editor */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>{ext.manageTimeSlots}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedSlots.map((slot) => {
                const isEditing = editingSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-md)",
                      background: "var(--surface)",
                      padding: 16,
                    }}
                  >
                    {!isEditing ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: slot.color }}></span>
                          <div>
                            <h4 style={{ fontSize: "0.96rem", fontWeight: 600 }}>{slot.name}</h4>
                            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                              {slot.description === "Vacant slot" ? ext.vacantSlot : slot.description} · {formatHour(slot.startHour)} {lang === "es" ? " a " : lang === "fr" ? " à " : lang === "ja" ? " から " : lang === "zh" ? " 至 " : lang === "ar" ? " إلى " : lang === "hi" ? " से " : lang === "pt" ? " a " : lang === "de" ? " bis " : lang === "it" ? " a " : lang === "ko" ? "부터 " : " to "} {formatHour(slot.endHour)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => startEditing(slot)}
                            className="btn btn-soft btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {ext.edit}
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            className="btn btn-soft btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem", color: "oklch(0.55 0.18 25)" }}
                          >
                            {ext.delete}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Inline edit form
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12 }}>
                          {/* Name Select Dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.assignTo}</label>
                            <select
                              value={slotName}
                              onChange={(e) => {
                                setSlotName(e.target.value);
                                // Suggest description based on relationship if available
                                const contact = line.contacts.find((c) => c.name === e.target.value);
                                if (contact && contact.rel) {
                                  setSlotDesc(getLocalizedRelationship(contact.rel, lang));
                                }
                              }}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                              {line.contacts.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name} ({getLocalizedRelationship(c.rel, lang)})
                                </option>
                              ))}
                              <option value="Custom">{ext.custom}</option>
                            </select>
                          </div>
                          
                          {/* Custom Name text input if "Custom" selected */}
                          {slotName === "Custom" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.customName}</label>
                              <input
                                type="text"
                                placeholder={ext.enterName}
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                              />
                            </div>
                          )}
                          
                          {/* Description input */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.description}</label>
                            <input
                              type="text"
                              value={slotDesc === "Vacant slot" ? ext.vacantSlot : slotDesc}
                              onChange={(e) => setSlotDesc(e.target.value)}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            />
                          </div>
                          
                          {/* Start hour dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.startHour}</label>
                            <select
                              value={slotStart}
                              onChange={(e) => setSlotStart(Number(e.target.value))}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              {Array.from({ length: 25 }).map((_, h) => (
                                <option key={h} value={h} disabled={h >= slotEnd}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* End hour dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.endHour}</label>
                            <select
                              value={slotEnd}
                              onChange={(e) => setSlotEnd(Number(e.target.value))}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              {Array.from({ length: 25 }).map((_, h) => (
                                <option key={h} value={h} disabled={h <= slotStart}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Color Picker Swatches */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.swatchColor}</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setSlotColor(c.value)}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  background: c.value,
                                  border: slotColor === c.value ? "2.5px solid var(--ink)" : "1px solid var(--line)",
                                  cursor: "pointer",
                                }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Save & Cancel buttons */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                          <button
                            onClick={cancelEditing}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {d.contacts.cancel}
                          </button>
                          <button
                            onClick={() => saveSlot(slot.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {ext.save}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add a New Segment form */}
          {!showAddForm ? (
            <button
              onClick={() => {
                setShowAddForm(true);
                // Pre-fill values
                setSlotName("Custom");
                setCustomName("");
                setSlotDesc("");
                setSlotStart(0);
                setSlotEnd(4);
                setSlotColor(PRESET_COLORS[0].value);
              }}
              className="btn btn-soft"
              style={{ marginTop: 18, width: "100%", padding: 12, border: "1px dashed var(--line)" }}
            >
              + {ext.addNewSegment}
            </button>
          ) : (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: "var(--r-md)",
                border: "1px dashed var(--line)",
                background: "var(--tint)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h4 style={{ fontSize: "0.96rem", fontWeight: 600 }}>{ext.addNewSlot}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12 }}>
                {/* Assign dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.assignTo}</label>
                  <select
                    value={slotName}
                    onChange={(e) => {
                      setSlotName(e.target.value);
                      const contact = line.contacts.find((c) => c.name === e.target.value);
                      if (contact && contact.rel) {
                        setSlotDesc(getLocalizedRelationship(contact.rel, lang));
                      }
                    }}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                    {line.contacts.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({getLocalizedRelationship(c.rel, lang)})
                      </option>
                    ))}
                    <option value="Custom">{ext.custom}</option>
                  </select>
                </div>
                
                {slotName === "Custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.customName}</label>
                    <input
                      type="text"
                      placeholder={ext.enterName}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                    />
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.description}</label>
                  <input
                    type="text"
                    value={slotDesc}
                    onChange={(e) => setSlotDesc(e.target.value)}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.startHour}</label>
                  <select
                    value={slotStart}
                    onChange={(e) => setSlotStart(Number(e.target.value))}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    {Array.from({ length: 25 }).map((_, h) => (
                      <option key={h} value={h} disabled={h >= slotEnd}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.endHour}</label>
                  <select
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(Number(e.target.value))}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    {Array.from({ length: 25 }).map((_, h) => (
                      <option key={h} value={h} disabled={h <= slotStart}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swatch color selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.swatchColor}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSlotColor(c.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: c.value,
                        border: slotColor === c.value ? "2.5px solid var(--ink)" : "1px solid var(--line)",
                        cursor: "pointer",
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  {d.contacts.cancel}
                </button>
                <button
                  onClick={addNewSlot}
                  className="btn btn-primary btn-sm"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  {d.routing.addSlot}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.sim.runTest}</h2>
            <p>
              {ext.simSubtitle.replace("{name}", getLocalizedPersonName(line.person, lang).split(" · ")[0])}
            </p>
          </div>
          <Badge kind="blue">
            {line.mode === "schedule"
              ? d.routing.scheduleTitle
              : line.mode === "menu"
              ? d.overview.callerMenu
              : line.mode === "simultaneous"
              ? d.routing.simultaneous
              : d.overview.cascade}
          </Badge>
        </div>
        <div className="card-pad">
          <TestCall line={line} d={d} lang={lang} />
        </div>
      </div>
    </div>
  );
}

/* Call log */
function CallLogView({ line, log, d, lang }: { line: Line; log: Record<string, CallLogEntry[]>; d: DashboardTranslations; lang: string }) {
  const [filter, setFilter] = useState("all");
  const calls = log[line.id] || [];
  const counts = {
    all: calls.length,
    connected: calls.filter((c) => c.status === "connected").length,
    missed: calls.filter((c) => c.status === "missed").length,
    voicemail: calls.filter((c) => c.status === "voicemail").length,
  };
  const shown = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const pills = [
    ["all", d.overview.viewAll],
    ["connected", d.sim.connected],
    ["missed", d.sim.noAnswer],
    ["voicemail", d.sim.voicemail],
  ];

  return (
    <div className="content-inner">
      <div className="logtools">
        <div className="filter-pills">
          {pills.map(([k, lbl]) => (
            <button
              key={k}
              className={`fpill ${filter === k ? "active" : ""}`}
              onClick={() => setFilter(k)}
            >
              {lbl} <span style={{ opacity: 0.7 }}>{counts[k as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div className="topbar-spacer"></div>
        <button className="btn btn-ghost btn-sm">
          <Icon name="download" /> {lang === "es" ? "Exportar CSV" : lang === "fr" ? "Exporter en CSV" : lang === "ja" ? "CSVエクスポート" : lang === "zh" ? "导出 CSV" : lang === "ar" ? "تصدير CSV" : lang === "hi" ? "सीएसवी निर्यात करें" : lang === "pt" ? "Exportar CSV" : lang === "de" ? "CSV exportieren" : lang === "it" ? "Esporta CSV" : lang === "ko" ? "CSV 내보내기" : "Export CSV"}
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.titles.log}</h2>
            <p>{d.titles.logSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <div className="log">
            {shown.map((c) => {
              const m = STATUS_META[c.status as keyof typeof STATUS_META];
              return (
                <div className="logrow" key={c.id}>
                  <div className={`dir ${m.dirCls}`}>
                    <Icon
                      name={c.status === "voicemail" ? "voicemail" : c.status === "missed" ? "alert" : "in"}
                    />
                  </div>
                  <div className="who">
                    <b>{c.caller === "Unknown" ? (lang === "es" ? "Desconocido" : lang === "fr" ? "Inconnu" : lang === "ja" ? "不明" : lang === "zh" ? "未知" : lang === "ar" ? "مجهول" : lang === "hi" ? "अज्ञात" : lang === "pt" ? "Desconhecido" : lang === "de" ? "Unbekannt" : lang === "it" ? "Sconosciuto" : lang === "ko" ? "알 수 없음" : "Unknown") :
                        c.caller.replace("(mobile)", lang === "es" ? "(móvil)" : lang === "fr" ? "(portable)" : lang === "ja" ? "(携帯電話)" : lang === "zh" ? "(手机)" : lang === "ar" ? "(هاتف محمول)" : lang === "hi" ? "(मोबाइल)" : lang === "pt" ? "(celular)" : lang === "de" ? "(Mobiltelefon)" : lang === "it" ? "(cellulare)" : lang === "ko" ? "(휴대전화)" : "(mobile)")}</b>
                    <span>{c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}</span>
                  </div>
                  <div className="routed">
                    <b>{c.routed === "No one available" ? (lang === "es" ? "Nadie disponible" : lang === "fr" ? "Personne de disponible" : lang === "ja" ? "対応者なし" : lang === "zh" ? "无人可用" : lang === "ar" ? "لا أحد متاح" : lang === "hi" ? "कोई उपलब्ध नहीं" : lang === "pt" ? "Ninguém disponível" : lang === "de" ? "Niemand verfügbar" : lang === "it" ? "Nessuno disponibile" : lang === "ko" ? "연결 가능 도우미 없음" : "No one available") : c.routed}</b>
                    {getLocalizedRelationship(c.rel, lang)}
                  </div>
                  <div className="dur">{c.dur}</div>
                  <div style={{ textAlign: "right" }}>
                    <Badge kind={m.badge.replace("badge-", "")}>
                      {c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}
                    </Badge>
                    <div className="when" style={{ marginTop: 5 }}>
                      {c.when.replace("Today", lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : lang === "ja" ? "今日" : lang === "zh" ? "今天" : lang === "ar" ? "اليوم" : lang === "hi" ? "오늘" : lang === "pt" ? "Hoje" : lang === "de" ? "Heute" : lang === "it" ? "Oggi" : lang === "ko" ? "오늘" : "Today")
                              .replace("Yesterday", lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "अकल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday")
                              .replace("Mon", lang === "es" ? "Lun" : lang === "fr" ? "Lun" : lang === "ja" ? "月" : lang === "zh" ? "周一" : lang === "ar" ? "الإثنين" : lang === "hi" ? "सोम" : lang === "pt" ? "Seg" : lang === "de" ? "Mon" : lang === "it" ? "Lun" : lang === "ko" ? "월" : "Mon")
                              .replace("Tue", lang === "es" ? "Mar" : lang === "fr" ? "Mar" : lang === "ja" ? "火" : lang === "zh" ? "周二" : lang === "ar" ? "الثلاثاء" : lang === "hi" ? "मंगल" : lang === "pt" ? "Ter" : lang === "de" ? "Tue" : lang === "it" ? "Mar" : lang === "ko" ? "화" : "Tue")
                              .replace("Wed", lang === "es" ? "Mié" : lang === "fr" ? "Mer" : lang === "ja" ? "水" : lang === "zh" ? "周三" : lang === "ar" ? "الأربعاء" : lang === "hi" ? "बुध" : lang === "pt" ? "Qua" : lang === "de" ? "Wed" : lang === "it" ? "Mer" : lang === "ko" ? "수" : "Wed")
                              .replace("Thu", lang === "es" ? "Jue" : lang === "fr" ? "Jeu" : lang === "ja" ? "木" : lang === "zh" ? "周四" : lang === "ar" ? "الخميس" : lang === "hi" ? "गुरु" : lang === "pt" ? "Qui" : lang === "de" ? "Thu" : lang === "it" ? "Gio" : lang === "ko" ? "목" : "Thu")
                              .replace("Fri", lang === "es" ? "Vie" : lang === "fr" ? "Ven" : lang === "ja" ? "金" : lang === "zh" ? "周五" : lang === "ar" ? "الجمعة" : lang === "hi" ? "शुक्र" : lang === "pt" ? "Sex" : lang === "de" ? "Fr" : lang === "it" ? "Ven" : lang === "ko" ? "금" : "Fri")
                              .replace("Sat", lang === "es" ? "Sáb" : lang === "fr" ? "Sam" : lang === "ja" ? "土" : lang === "zh" ? "周六" : lang === "ar" ? "السبت" : lang === "hi" ? "शनि" : lang === "pt" ? "Sáb" : lang === "de" ? "Sat" : lang === "it" ? "Sab" : lang === "ko" ? "토" : "Sat")
                              .replace("Sun", lang === "es" ? "Dom" : lang === "fr" ? "Dim" : lang === "ja" ? "日" : lang === "zh" ? "周日" : lang === "ar" ? "الأحد" : lang === "hi" ? "रवि" : lang === "pt" ? "Dom" : lang === "de" ? "So" : lang === "it" ? "Dom" : lang === "ko" ? "일" : "Sun")}
                    </div>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--ink-faint)",
                  fontSize: "0.9rem",
                }}
              >
                {lang === "es" ? `No hay llamadas de tipo "${filter}" en esta línea.` :
                 lang === "fr" ? `Aucun appel de type "${filter}" sur cette ligne.` :
                 lang === "ja" ? `この回線には「${filter}」の通話はありません。` :
                 lang === "zh" ? `此线路暂无“${filter}”类型通话。` :
                 lang === "ar" ? `لا توجد مكالمات من فئة "${filter}" على هذا الخط.` :
                 lang === "hi" ? `इस लाइन पर कोई "${filter}" कॉल नहीं है।` :
                 lang === "pt" ? `Nenhuma chamada do tipo "${filter}" nesta linha.` :
                 lang === "de" ? `Keine Anrufe des Typs „${filter}“ auf dieser Leitung.` :
                 lang === "it" ? `Nessuna chiamata di tipo "${filter}" su questa linea.` :
                 lang === "ko" ? `이 회선에 "${filter}" 통화 내역이 없습니다.` :
                 `No ${filter} calls on this line.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Greetings & alerts */
function SettingsView({
  line,
  setLine,
  showToast,
  d,
  lang,
  preferredName,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: DashboardTranslations;
  lang: string;
  preferredName: string;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const s = line.settings || {};
  const set = (patch: Partial<NonNullable<Line["settings"]>>) =>
    setLine((prev) =>
      prev.map((l) =>
        l.id === line.id ? { ...l, settings: { ...(l.settings || {}), ...patch } } : l
      )
    );

  const generateGreetingVoice = async () => {
    if (!greeting.trim()) {
      alert(ext.enterGreetingFirst);
      return;
    }
    setIsGenerating(true);
    const contactId = `greeting_${line.id}`;
    try {
      const response = await fetch('/api/caregiver/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: greeting.trim(),
          contactId,
          voiceId: s.voiceId || '21m00Tcm4TlvDq8ikWAM',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ greetingAudioPath: data.filePath });
        setPreviewUrl(data.audioUrl);
        showToast(ext.voiceGeneratedToast);
      } else {
        const err = await response.json();
        showToast(ext.voiceGenerateFailedToast.replace("{error}", err.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      showToast(ext.voiceNetworkErrorToast);
    } finally {
      setIsGenerating(false);
    }
  };

  const greeting =
    s.greeting ??
    `Hi, you've reached ${getLocalizedPersonName(line.person, lang).split(" · ")[0]}. ${
      line.mode === "menu"
        ? "Please choose who you'd like to reach."
        : "Hold on while we connect you."
    }`;
  const bilingual = s.bilingual ?? true;
  const language2 = s.language2 ?? "Spanish";
  const notifSMS = s.notifSMS ?? true;
  const notifEmail = s.notifEmail ?? true;
  const notifMissed = s.notifMissed ?? true;
  const notifWeekly = s.notifWeekly ?? false;

  return (
    <div className="content-inner">
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{d.settings.greetingVoicemail}</h2>
            <p>{d.settings.ttsGreetingSub}</p>
          </div>
        </div>
        <div className="card-pad">
          <div className="field">
            <label>{d.settings.ttsGreeting}</label>
            <textarea
              rows={3}
              value={greeting}
              onChange={(e) => set({ greeting: e.target.value })}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={generateGreetingVoice}
                disabled={isGenerating || !greeting.trim()}
                style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
                type="button"
              >
                {isGenerating ? ext.generatingVoice : ext.generateAiVoice}
              </button>

              {previewUrl && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <audio src={previewUrl} controls style={{ width: 220, height: 32, borderRadius: 4 }} />
                </div>
              )}

              {s.greetingAudioPath && !previewUrl && (
                <span style={{ fontSize: '0.82rem', color: 'oklch(0.55 0.18 140)', fontWeight: 600 }}>
                  {ext.aiVoiceActive}
                </span>
              )}
            </div>
          </div>
          <div className="set-row" style={{ borderBottom: '1px solid var(--line-faint)' }}>
            <div className="txt">
              <b>{ext.elevenLabsTitle}</b>
              <p>{ext.elevenLabsDesc}</p>
            </div>
            <select
              value={s.voiceId || "21m00Tcm4TlvDq8ikWAM"}
              onChange={(e) => set({ voiceId: e.target.value })}
              className="p-2 rounded border border-line focus:outline-none focus:border-accent bg-surface"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--line)',
                outline: 'none',
                background: 'var(--surface)',
                color: 'var(--ink)'
              }}
            >
              {ELEVENLABS_VOICE_GROUPS.map((g) => (
                <optgroup key={g.langKey} label={ext[g.langKey]}>
                  {g.voices.map((v) => (
                    <option key={`${g.langKey}-${v.id}`} value={v.id}>
                      {v.name} ({ext[v.gender]}, {ext[v.desc]})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="set-row" style={{ paddingTop: 4 }}>
            <div className="txt">
              <b>{d.settings.bilingualSupport}</b>
              <p>
                {d.settings.bilingualSupportSub}
              </p>
            </div>
            <Toggle
              on={bilingual}
              onChange={(v) => set({ bilingual: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          {bilingual && (
            <div className="field" style={{ marginTop: 16, marginBottom: 0, maxWidth: 260 }}>
              <label>{d.settings.secondLang}</label>
              <select value={language2} onChange={(e) => set({ language2: e.target.value })}>
                {[
                  { id: "Spanish", label: lang === "es" ? "Español" : lang === "fr" ? "Espagnol" : lang === "ja" ? "スペイン語" : lang === "zh" ? "西班牙语" : lang === "ar" ? "الإspania" : lang === "hi" ? "स्पैनिश" : lang === "pt" ? "Espanhol" : lang === "de" ? "Spanisch" : lang === "it" ? "Spagnolo" : lang === "ko" ? "스페인어" : "Spanish" },
                  { id: "Mandarin", label: lang === "es" ? "Mandarín" : lang === "fr" ? "Mandarin" : lang === "ja" ? "中国語" : lang === "zh" ? "中文（普通话）" : lang === "ar" ? "الماندرين" : lang === "hi" ? "मंदारिन" : lang === "pt" ? "Mandarim" : lang === "de" ? "Mandarin" : lang === "it" ? "Mandarino" : lang === "ko" ? "중국어" : "Mandarin" },
                  { id: "Tagalog", label: lang === "es" ? "Tagalo" : lang === "fr" ? "Tagalog" : lang === "ja" ? "タガログ語" : lang === "zh" ? "塔加路语" : lang === "ar" ? "التاغالوغية" : lang === "hi" ? "तागालोग" : lang === "pt" ? "Tagalo" : lang === "de" ? "Tagalog" : lang === "it" ? "Tagalog" : lang === "ko" ? "타갈로그어" : "Tagalog" },
                  { id: "Vietnamese", label: lang === "es" ? "Vietnamita" : lang === "fr" ? "Vietnamien" : lang === "ja" ? "ベトナム語" : lang === "zh" ? "越南语" : lang === "ar" ? "الفيتنامية" : lang === "hi" ? "वियतनामी" : lang === "pt" ? "Vietnamita" : lang === "de" ? "Vietnamesisch" : lang === "it" ? "Vietnamita" : lang === "ko" ? "베트남어" : "Vietnamese" },
                  { id: "French", label: lang === "es" ? "Francés" : lang === "fr" ? "Français" : lang === "ja" ? "フランス語" : lang === "zh" ? "法语" : lang === "ar" ? "الفرنسية" : lang === "hi" ? "फ़्रेंच" : lang === "pt" ? "Francês" : lang === "de" ? "Französisch" : lang === "it" ? "Francese" : lang === "ko" ? "프랑스어" : "French" },
                  { id: "Korean", label: lang === "es" ? "Coreano" : lang === "fr" ? "Coréen" : lang === "ja" ? "韓国語" : lang === "zh" ? "韩语" : lang === "ar" ? "الكورية" : lang === "hi" ? "कोरियाई" : lang === "pt" ? "Coreano" : lang === "de" ? "Koreanisch" : lang === "it" ? "Coreano" : lang === "ko" ? "한국어" : "Korean" },
                  { id: "Japanese", label: lang === "es" ? "Japonés" : lang === "fr" ? "Japonais" : lang === "ja" ? "日本語" : lang === "zh" ? "日语" : lang === "ar" ? "اليابانية" : lang === "hi" ? "जापानी" : lang === "pt" ? "Japonês" : lang === "de" ? "Japanisch" : lang === "it" ? "Giapponese" : lang === "ko" ? "일본어" : "Japanese" },
                  { id: "Arabic", label: lang === "es" ? "Árabe" : lang === "fr" ? "Arabe" : lang === "ja" ? "アラビア語" : lang === "zh" ? "阿拉伯语" : lang === "ar" ? "العربية" : lang === "hi" ? "अरबी" : lang === "pt" ? "Árabe" : lang === "de" ? "Arabisch" : lang === "it" ? "Arabo" : lang === "ko" ? "아랍어" : "Arabic" },
                  { id: "Hindi", label: lang === "es" ? "Hindi" : lang === "fr" ? "Hindi" : lang === "ja" ? "ヒンディー語" : lang === "zh" ? "印地语" : lang === "ar" ? "الهندية" : lang === "hi" ? "हिन्दी" : lang === "pt" ? "Hindi" : lang === "de" ? "Hindi" : lang === "it" ? "Hindi" : lang === "ko" ? "힌디어" : "Hindi" },
                  { id: "Portuguese", label: lang === "es" ? "Portugués" : lang === "fr" ? "Portugais" : lang === "ja" ? "ポルトガル語" : lang === "zh" ? "葡萄牙语" : lang === "ar" ? "البرتغالية" : lang === "hi" ? "पुर्तगाली" : lang === "pt" ? "Português" : lang === "de" ? "Portugiesisch" : lang === "it" ? "Portoghese" : lang === "ko" ? "포르투갈어" : "Portuguese" },
                  { id: "German", label: lang === "es" ? "Alemán" : lang === "fr" ? "Allemand" : lang === "ja" ? "ドイツ語" : lang === "zh" ? "德语" : lang === "ar" ? "الألمانية" : lang === "hi" ? "जर्मन" : lang === "pt" ? "Alemão" : lang === "de" ? "Deutsch" : lang === "it" ? "Tedesco" : lang === "ko" ? "독일어" : "German" },
                  { id: "Italian", label: lang === "es" ? "Italiano" : lang === "fr" ? "Italien" : lang === "ja" ? "イタリア語" : lang === "zh" ? "意大利语" : lang === "ar" ? "الإيطالية" : lang === "hi" ? "इतालवी" : lang === "pt" ? "Italiano" : lang === "de" ? "Italienisch" : lang === "it" ? "Italiano" : lang === "ko" ? "이탈리아어" : "Italian" }
                ].map((l) => (
                  <option key={l.id} value={l.id}>{getLocalizedLineLabel(l.label, lang)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.settings.notifications}</h2>
            <p>{d.settings.notificationsSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4 }}>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.smsAlerts}</b>
              <p>{ext.smsAlertsDesc.replace("{name}", preferredName)}</p>
            </div>
            <Toggle
              on={notifSMS}
              onChange={(v) => set({ notifSMS: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.emailAlerts}</b>
              <p>{ext.emailAlertsDesc}</p>
            </div>
            <Toggle
              on={notifEmail}
              onChange={(v) => set({ notifEmail: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.missedAlerts}</b>
              <p>{ext.missedAlertsDesc}</p>
            </div>
            <Toggle
              on={notifMissed}
              onChange={(v) => set({ notifMissed: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.weeklyReports}</b>
              <p>{ext.weeklyReportsDesc}</p>
            </div>
            <Toggle
              on={notifWeekly}
              onChange={(v) => set({ notifWeekly: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
          <Icon name="check" /> {d.contacts.saveChanges}
        </button>
      </div>
    </div>
  );
}

/* Account & billing */
const ACCT_TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Login & security" },
  { id: "contact", label: "Contact info" },
  { id: "billing", label: "Payment & billing" },
];

export function AccountView({
  account,
  setAccount,
  showToast,
  tab,
  setTab,
  d,
  lang,
  lines,
  setLines,
  autoOpenPlanModal,
  setAutoOpenPlanModal,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
  showToast: (msg: string) => void;
  tab: string;
  setTab: (t: string) => void;
  d: DashboardTranslations;
  lang: string;
  lines: Line[];
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
  autoOpenPlanModal: boolean;
  setAutoOpenPlanModal: (open: boolean) => void;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const a = account;
  const baseLinesCount = a.plan === "pro" ? 2 : 1;
  const currentExtraLines = Math.max(0, lines.length - baseLinesCount);
  const set = (patch: Partial<Account>) => {
    setAccount((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem("ic_account_data", JSON.stringify(updated));
      return updated;
    });
  };
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [tempPlan, setTempPlan] = useState<"essential" | "pro">(account.plan || "pro");
  const [tempCycle, setTempCycle] = useState<"monthly" | "yearly">(account.billingCycle || "monthly");
  const [selectedLineToKeep, setSelectedLineToKeep] = useState<string>("");

  useEffect(() => {
    if (planModalOpen && lines && lines.length > 0) {
      setSelectedLineToKeep(lines[0].id);
    }
  }, [planModalOpen, lines]);

  useEffect(() => {
    if (autoOpenPlanModal && tab === "billing") {
      setPlanModalOpen(true);
      setAutoOpenPlanModal(false);
    }
  }, [autoOpenPlanModal, tab, setAutoOpenPlanModal]);

  // Upgrade to Pro number selection state
  const [upgradeAreaCode, setUpgradeAreaCode] = useState("470");
  const [upgradeNumbersList, setUpgradeNumbersList] = useState<PickerNumber[]>([]);
  const [upgradeSelectedNumber, setUpgradeSelectedNumber] = useState<PickerNumber | null>(null);
  const [isSearchingNumbers, setIsSearchingNumbers] = useState(false);

  // States for Add-on changes
  const [tempExtraNumbers, setTempExtraNumbers] = useState(a.addons?.extraNumbers || 0);
  const [tempMinuteBlocks, setTempMinuteBlocks] = useState(0);

  const planMaxIncluded = a.plan === "pro" ? 2 : 1;
  const unusedPlanLines = Math.max(0, planMaxIncluded - lines.length);
  const newExtraNumbers = tempExtraNumbers - (a.addons?.extraNumbers || 0);
  const chargeableNewNumbers = newExtraNumbers > 0 ? Math.max(0, newExtraNumbers - unusedPlanLines) : 0;

  const [lastPropExtraNumbers, setLastPropExtraNumbers] = useState(a.addons?.extraNumbers || 0);

  if ((a.addons?.extraNumbers || 0) !== lastPropExtraNumbers) {
    setLastPropExtraNumbers(a.addons?.extraNumbers || 0);
    setTempExtraNumbers(a.addons?.extraNumbers || 0);
  }
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [addonCheckoutLoading, setAddonCheckoutLoading] = useState(false);
  const addonPendingAction = useRef<(() => void) | null>(null);
  const addonPopupRef = useRef<Window | null>(null);
  const [addonRemovalModalOpen, setAddonRemovalModalOpen] = useState(false);
  const [annualBillingConfirmOpen, setAnnualBillingConfirmOpen] = useState(false);
  const annualBillingConfirmCallback = useRef<(() => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === "es" ? "La imagen debe ser menor a 5MB" : lang === "fr" ? "L'image doit être inférieure à 5 Mo" : "Image must be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/caregiver/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      const data = await res.json();

      if (data.avatarUrl) {
        setAccount((prev) => {
          const updated = {
            ...prev,
            avatarUrl: data.avatarUrl,
          };
          localStorage.setItem("ic_account_data", JSON.stringify(updated));
          return updated;
        });
        showToast(lang === "es" ? "¡Foto de perfil actualizada!" : lang === "fr" ? "Photo de profil mise à jour !" : "Profile photo updated successfully!");
      }
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : (lang === "es" ? "Error al subir la foto" : lang === "fr" ? "Échec du téléchargement de la photo" : "Failed to upload photo"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  interface AddonNumberSlotConfig {
    index: number;
    areaCode: string;
    numbersList: PickerNumber[];
    selectedNumber: PickerNumber | null;
    isSearching: boolean;
  }

  const [addedNumbersConfig, setAddedNumbersConfig] = useState<AddonNumberSlotConfig[]>([]);
  const [selectedLinesToRemove, setSelectedLinesToRemove] = useState<string[]>([]);

  const loadAddonNumberSlot = (index: number, ac: string) => {
    setAddedNumbersConfig(prev => prev.map(c => c.index === index ? { ...c, isSearching: true, areaCode: ac } : c));
    fetchNumbersLive(ac, 6).then((nums) => {
      setAddedNumbersConfig(prev => prev.map(c => c.index === index ? {
        ...c,
        isSearching: false,
        numbersList: nums
      } : c));
    });
  };

  const loadUpgradeNumbers = (ac: string) => {
    setIsSearchingNumbers(true);
    fetchNumbersLive(ac, 6).then((nums) => {
      setUpgradeNumbersList(nums);
      setIsSearchingNumbers(false);
    });
  };

  useEffect(() => {
    if (planModalOpen) {
      loadUpgradeNumbers(upgradeAreaCode);
      setUpgradeSelectedNumber(null);
    }
  }, [planModalOpen]);

  const save17Map: Record<string, string> = {
    en: "Save 17%",
    es: "Ahorre 17%",
    fr: "Économisez 17%",
    ja: "17%お得",
    zh: "省17%",
    ar: "وفر 17%",
    hi: "17% बचाएं",
    pt: "Economize 17%",
    de: "17% sparen",
    it: "Risparmia il 17%",
    ko: "17% 할인"
  };

  useEffect(() => {
    if (planModalOpen) {
      setTempPlan(account.plan || "pro");
      setTempCycle(account.billingCycle || "monthly");
    }
  }, [planModalOpen, account.plan, account.billingCycle]);

  useEffect(() => {
    const fireAddon = () => {
      if (!addonPendingAction.current) return;
      if (addonPopupRef.current) {
        try {
          addonPopupRef.current.close();
        } catch (err) {
          console.error("Failed to close addon popup:", err);
        }
        addonPopupRef.current = null;
      }
      addonPendingAction.current();
      addonPendingAction.current = null;
      localStorage.removeItem("creem_addon_success");
    };

    // Primary: BroadcastChannel (reliable same-origin cross-window)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("creem_addon");
      bc.onmessage = (e) => {
        if (e.data?.type === "CREEM_ADDON_SUCCESS") fireAddon();
      };
    } catch {}

    // Secondary: postMessage from opener
    const handleMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "CREEM_ADDON_SUCCESS") fireAddon();
    };
    window.addEventListener("message", handleMsg);

    return () => {
      bc?.close();
      window.removeEventListener("message", handleMsg);
    };
  }, []);

  const getModalButtonText = () => {
    const isCurrentPlan = tempPlan === account.plan;
    const isCurrentCycle = tempCycle === account.billingCycle;
    
    if (isCurrentPlan && isCurrentCycle) {
      return lang === "es" ? "Plan actual"
           : lang === "fr" ? "Forfait actuel"
           : lang === "ja" ? "現在のプラン"
           : lang === "zh" ? "当前方案"
           : lang === "ar" ? "الباقة الحالية"
           : lang === "hi" ? "वर्तमान प्लान"
           : lang === "pt" ? "Plano atual"
           : lang === "de" ? "Aktueller Tarif"
           : lang === "it" ? "Piano attuale"
           : lang === "ko" ? "현재 플랜"
           : "Current Plan";
    }
    
    if (isCurrentPlan) {
      return lang === "es" ? "Actualizar ciclo de facturación"
           : lang === "fr" ? "Mettre à jour le cycle"
           : lang === "ja" ? "請求サイクルを更新"
           : lang === "zh" ? "更新账单周期"
           : lang === "ar" ? "تحديث دورة الفوترة"
           : lang === "hi" ? "बिलिंग चक्र अपडेट करें"
           : lang === "pt" ? "Atualizar ciclo de cobrança"
           : lang === "de" ? "Abrechnungszeitraum aktualisieren"
           : lang === "it" ? "Aggiorna ciclo di fatturazione"
           : lang === "ko" ? "결제 주기 업데이트"
           : "Update Billing Cycle";
    }
    
    if (tempPlan === "pro" && account.plan === "essential") {
      return lang === "es" ? "Actualizar a Pro"
           : lang === "fr" ? "Passer à Pro"
           : lang === "ja" ? "Proにアップグレード"
           : lang === "zh" ? "升级到专业版"
           : lang === "ar" ? "الترقية إلى برو"
           : lang === "hi" ? "प्रो पर अपग्रेड करें"
           : lang === "pt" ? "Upgrade para Pro"
           : lang === "de" ? "Auf Pro upgraden"
           : lang === "it" ? "Passa a Pro"
           : lang === "ko" ? "Pro로 업그레이드"
           : "Upgrade to Pro";
    } else {
      return lang === "es" ? "Degradar a Esencial"
           : lang === "fr" ? "Passer à Essentiel"
           : lang === "ja" ? "エッセンシャルにダウング레ード"
           : lang === "zh" ? "降级到基础版"
           : lang === "ar" ? "تخفيض الباقة إلى أساسي"
           : lang === "hi" ? "एसेनशियल पर डाउनग्रेड करें"
           : lang === "pt" ? "Downgrade para Essencial"
           : lang === "de" ? "Auf Essential downgraden"
           : lang === "it" ? "Passa a Essenziale"
           : lang === "ko" ? "에센셜로 다운그레이드"
           : "Downgrade to Essential";
    }
  };

  const isUpgradingToPro = tempPlan === "pro" && account.plan === "essential";
  const isModalButtonDisabled =
    (tempPlan === account.plan && tempCycle === account.billingCycle) ||
    (isUpgradingToPro && !upgradeSelectedNumber);

  const ACCT_TABS = [
    { id: "profile", label: d.account.profile },
    { id: "security", label: d.account.security },
    { id: "contact", label: d.account.contactInfo },
    { id: "billing", label: d.account.billing },
  ];

  const [pwd, setPwd] = useState({ cur: "", next: "", conf: "" });
  const savePwd = () => {
    if (!pwd.cur || !pwd.next) return showToast(ext.enterPasswordToast);
    if (pwd.next !== pwd.conf) return showToast(ext.passwordMismatchToast);
    setPwd({ cur: "", next: "", conf: "" });
    showToast(ext.passwordUpdatedToast);
  };

  return (
    <div className="content-inner">
      <div className="acct-tabs">
        {ACCT_TABS.map((t) => (
          <button
            key={t.id}
            className={`acct-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.profile}</h2>
              <p>{d.account.personalDetailsSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="acct-photo">
              <span className="big-ava" style={{ display: "grid", placeItems: "center", overflow: "hidden" }}>
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                ) : (
                  initials(a.name)
                )}
              </span>
              <div className="pmeta">
                <b>{a.name}</b>
                <span>
                  {a.role === "Primary caregiver" ? ext.primaryCaregiver :
                   a.role === "Family member" ? ext.familyMember :
                   a.role === "Account administrator" ? ext.accountAdmin :
                   a.role === "Care coordinator" ? ext.careCoordinator :
                   a.role === "Caregiver" ? ext.caregiver :
                   a.role}
                </span>
                <div className="pacts">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Icon name="camera" /> {uploadingPhoto ? (lang === "es" ? "Subiendo..." : lang === "fr" ? "Téléchargement..." : "Uploading...") : ext.changePhoto}
                  </button>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.contacts.fullName}</label>
                  <input value={a.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label>{d.account.prefName}</label>
                  <input value={a.preferred} onChange={(e) => set({ preferred: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{d.account.role}</label>
              <select value={a.role} onChange={(e) => set({ role: e.target.value })} style={{ maxWidth: 320 }}>
                {[
                  { id: "Caregiver", label: ext.caregiver },
                  { id: "Primary caregiver", label: ext.primaryCaregiver },
                  { id: "Family member", label: ext.familyMember },
                  { id: "Account administrator", label: ext.accountAdmin },
                  { id: "Care coordinator", label: ext.careCoordinator },
                ].map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                <Icon name="check" /> {d.contacts.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <>
          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.email}</h2>
                <p>{d.account.emailRecoverSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
                <label>{d.account.email}</label>
                <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => showToast(d.common.savedToast)}
                >
                  {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.security}</h2>
                <p>{d.account.strongPasswordSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div style={{ maxWidth: 420 }}>
                <div className="field">
                  <label>{lang === "es" ? "Contraseña actual" : lang === "fr" ? "Mot de passe actuel" : lang === "ja" ? "現在のパスワード" : lang === "zh" ? "当前密码" : lang === "ar" ? "كلمة المرور الحالية" : lang === "hi" ? "वर्तमान पासवर्ड" : lang === "pt" ? "Senha atual" : lang === "de" ? "Aktuelles Passwort" : lang === "it" ? "Password attuale" : lang === "ko" ? "현재 비밀번호" : "Current password"}</label>
                  <input
                    type="password"
                    value={pwd.cur}
                    onChange={(e) => setPwd({ ...pwd, cur: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field">
                  <label>{lang === "es" ? "Nueva contraseña" : lang === "fr" ? "Nouveau mot de passe" : lang === "ja" ? "新しいパスワード" : lang === "zh" ? "新密码" : lang === "ar" ? "كلمة المرور الجديدة" : lang === "hi" ? "नया पासवर्ड" : lang === "pt" ? "Nova senha" : lang === "de" ? "Neues Passwort" : lang === "it" ? "Nuova password" : lang === "ko" ? "새 비밀번호" : "New password"}</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>{lang === "es" ? "Confirmar nueva contraseña" : lang === "fr" ? "Confirmer le nouveau mot de passe" : lang === "ja" ? "新しいパスワードの確認" : lang === "zh" ? "确认新密码" : lang === "ar" ? "تأكيد كلمة المرور الجديدة" : lang === "hi" ? "नए पासवर्ड की पुष्टि करें" : lang === "pt" ? "Confirmar nova senha" : lang === "de" ? "Neues Passwort bestätigen" : lang === "it" ? "Conferma nuova password" : lang === "ko" ? "새 비밀번호 확인" : "Confirm new password"}</label>
                  <input
                    type="password"
                    value={pwd.conf}
                    onChange={(e) => setPwd({ ...pwd, conf: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button className="btn btn-primary" onClick={savePwd}>
                  <Icon name="lock" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.twoFactor}</h2>
                <p>{d.account.twoFactorSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="txt">
                  <b>{d.account.smsCodesTitle}</b>
                  <p>
                    {d.account.smsCodesDesc} ({a.phone})
                  </p>
                </div>
                <Toggle
                  on={a.twoFactor}
                  onChange={(v) => {
                    set({ twoFactor: v });
                    showToast(v ? (lang === "es" ? "Autenticación de dos factores activada" : lang === "fr" ? "Double authentification activée" : lang === "ja" ? "2段階認証を有効にしました" : lang === "zh" ? "双重验证已启用" : lang === "ar" ? "تم تفعيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण सक्षम" : lang === "pt" ? "Autenticação de dois fatores ativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung aktiviert" : lang === "it" ? "Autenticazione a due fattori abilitata" : lang === "ko" ? "2단계 인증이 활성화되었습니다" : "Two-factor enabled") : (lang === "es" ? "Autenticación de dos factores desactivada" : lang === "fr" ? "Double authentification désactivée" : lang === "ja" ? "2段階認証を无効にしました" : lang === "zh" ? "双重验证已禁用" : lang === "ar" ? "تم تعطيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण अक्षम" : lang === "pt" ? "Autenticação de dois fatores desativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung deaktiviert" : lang === "it" ? "Autenticazione a due fattori disabilitata" : lang === "ko" ? "2단계 인증이 비활성화되었습니다" : "Two-factor disabled"));
                  }}
                  labels={[lang === "es" ? "Off" : lang === "fr" ? "Off" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Off" : lang === "ko" ? "꺼짐" : "Off", lang === "es" ? "On" : lang === "fr" ? "On" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "On" : lang === "ko" ? "켜짐" : "On"]}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>{ext.activeSessions}</h2>
                <p>{d.account.activeSessionsSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                { dev: "Chrome · MacBook Pro", loc: "Oakland, CA", last: d.common.activeNow, cur: true },
                { dev: "iCanCall app · iPhone 15", loc: "Oakland, CA", last: lang === "es" ? "Hace 2 horas" : lang === "fr" ? "Il y a 2 heures" : lang === "ja" ? "2時間前" : lang === "zh" ? "2小时前" : lang === "ar" ? "قبل ساعتين" : lang === "hi" ? "2 घंटे पहले" : lang === "pt" ? "Há 2 horas" : lang === "de" ? "Vor 2 Stunden" : lang === "it" ? "2 ore fa" : lang === "ko" ? "2시간 전" : "2 hours ago", cur: false },
                { dev: "Safari · iPad", loc: "Sacramento, CA", last: lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "कल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday", cur: false },
              ].map((s, i) => (
                <div className="session" key={i}>
                  <span className="sic">
                    <Icon name="device" />
                  </span>
                  <div className="sinfo">
                    <b>{s.dev}</b>
                    <span>
                      {s.loc} · {s.last}
                    </span>
                  </div>
                  {s.cur ? (
                    <Badge kind="green">{ext.thisDevice}</Badge>
                  ) : (
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => showToast(ext.deviceSignoutToast + s.dev)}
                    >
                      <Icon name="logout" /> {ext.signOut}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "contact" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.contactInfo}</h2>
              <p>{d.account.contactReachSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.phone}</label>
                  <input value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label>{d.account.email}</label>
                  <input
                    type="email"
                    value={a.notifyEmail}
                    onChange={(e) => set({ notifyEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="field">
              <label>{ext.address}</label>
              <input value={a.address} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.timezone}</label>
                  <select value={a.timezone} onChange={(e) => set({ timezone: e.target.value })}>
                    {[
                      { id: "Hawaii (HT)", label: lang === "es" ? "Hawái (HT)" : lang === "fr" ? "Hawaï (HT)" : lang === "ja" ? "ハワイ時間 (HT)" : lang === "zh" ? "夏威夷时间 (HT)" : lang === "ar" ? "هاواي (HT)" : lang === "hi" ? "हवाई (HT)" : lang === "pt" ? "Havaí (HT)" : lang === "de" ? "Hawaii-Zeit (HT)" : lang === "it" ? "Hawaii (HT)" : lang === "ko" ? "하와이시 (HT)" : "Hawaii (HT)" },
                      { id: "Alaska (AKT)", label: lang === "es" ? "Alaska (AKT)" : lang === "fr" ? "Alaska (AKT)" : lang === "ja" ? "アラスカ時間 (AKT)" : lang === "zh" ? "阿拉斯加时间 (AKT)" : lang === "ar" ? "ألاسكا (AKT)" : lang === "hi" ? "अलास्का (AKT)" : lang === "pt" ? "Alasca (AKT)" : lang === "de" ? "Alaska-Zeit (AKT)" : lang === "it" ? "Alaska (AKT)" : lang === "ko" ? "알래스카시 (AKT)" : "Alaska (AKT)" },
                      { id: "Pacific (PT)", label: lang === "es" ? "Pacífico (PT)" : lang === "fr" ? "Pacifique (PT)" : lang === "ja" ? "太平洋標準時 (PT)" : lang === "zh" ? "太平洋时间 (PT)" : lang === "ar" ? "الهادئ (PT)" : lang === "hi" ? "पैसिफिक (PT)" : lang === "pt" ? "Pacífico (PT)" : lang === "de" ? "Pazifik (PT)" : lang === "it" ? "Pacifico (PT)" : lang === "ko" ? "태평양시 (PT)" : "Pacific (PT)" },
                      { id: "Mountain (MT)", label: lang === "es" ? "Montaña (MT)" : lang === "fr" ? "Rocheuses (MT)" : lang === "ja" ? "山岳部標準時 (MT)" : lang === "zh" ? "山地时间 (MT)" : lang === "ar" ? "الجبلي (MT)" : lang === "hi" ? "माउंटेन (MT)" : lang === "pt" ? "Montanha (MT)" : lang === "de" ? "Mountain (MT)" : lang === "it" ? "Montagne (MT)" : lang === "ko" ? "산악시 (MT)" : "Mountain (MT)" },
                      { id: "Central (CT)", label: lang === "es" ? "Central (CT)" : lang === "fr" ? "Centre (CT)" : lang === "ja" ? "中部標準時 (CT)" : lang === "zh" ? "中部时间 (CT)" : lang === "ar" ? "المركزي (CT)" : lang === "hi" ? "सेंट्रल (CT)" : lang === "pt" ? "Central (CT)" : lang === "de" ? "Zentralzeit (CT)" : lang === "it" ? "Centrale (CT)" : lang === "ko" ? "중부시 (CT)" : "Central (CT)" },
                      { id: "Eastern (ET)", label: lang === "es" ? "Este (ET)" : lang === "fr" ? "Est (ET)" : lang === "ja" ? "東部標準時 (ET)" : lang === "zh" ? "东部时间 (ET)" : lang === "ar" ? "الشرقي (ET)" : lang === "hi" ? "ईस्टर्न (ET)" : lang === "pt" ? "Leste (ET)" : lang === "de" ? "Ostküstenzeit (ET)" : lang === "it" ? "Orientale (ET)" : lang === "ko" ? "동부시 (ET)" : "Eastern (ET)" },
                      { id: "Atlantic (AST)", label: lang === "es" ? "Atlántico (AST)" : lang === "fr" ? "Atlantique (AST)" : lang === "ja" ? "大西洋標準時 (AST)" : lang === "zh" ? "大西洋时间 (AST)" : lang === "ar" ? "الأطلسي (AST)" : lang === "hi" ? "अटलांटिक (AST)" : lang === "pt" ? "Atlântico (AST)" : lang === "de" ? "Atlantikzeit (AST)" : lang === "it" ? "Atlantico (AST)" : lang === "ko" ? "대서양시 (AST)" : "Atlantic (AST)" },
                      { id: "London (GMT)", label: lang === "es" ? "Londres (GMT)" : lang === "fr" ? "Londres (GMT)" : lang === "ja" ? "ロンドン時間 (GMT)" : lang === "zh" ? "伦敦时间 (GMT)" : lang === "ar" ? "غرينتش (GMT)" : lang === "hi" ? "लंदन (GMT)" : lang === "pt" ? "Londres (GMT)" : lang === "de" ? "Londoner Zeit (GMT)" : lang === "it" ? "Londra (GMT)" : lang === "ko" ? "런던시 (GMT)" : "London (GMT)" },
                      { id: "Europe (CET)", label: lang === "es" ? "Europa Central (CET)" : lang === "fr" ? "Europe Centrale (CET)" : lang === "ja" ? "中央ヨーロッパ時間 (CET)" : lang === "zh" ? "中部欧洲时间 (CET)" : lang === "ar" ? "وسط أوروبا (CET)" : lang === "hi" ? "मध्य यूरोपीय (CET)" : lang === "pt" ? "Europa Central (CET)" : lang === "de" ? "Mitteleuropäische Zeit (CET)" : lang === "it" ? "Europa Centrale (CET)" : lang === "ko" ? "중앙유럽시 (CET)" : "Central Europe (CET)" },
                      { id: "India (IST)", label: lang === "es" ? "India (IST)" : lang === "fr" ? "Inde (IST)" : lang === "ja" ? "インド時間 (IST)" : lang === "zh" ? "印度时间 (IST)" : lang === "ar" ? "الهند (IST)" : lang === "hi" ? "भारतीय मानक समय (IST)" : lang === "pt" ? "Índia (IST)" : lang === "de" ? "Indische Zeit (IST)" : lang === "it" ? "India (IST)" : lang === "ko" ? "인도시 (IST)" : "India (IST)" },
                      { id: "Australia (AEST)", label: lang === "es" ? "Australia Oriental (AEST)" : lang === "fr" ? "Australie Orientale (AEST)" : lang === "ja" ? "オーストラリア東部時間 (AEST)" : lang === "zh" ? "澳大利亚东部时间 (AEST)" : lang === "ar" ? "شرق أستراليا (AEST)" : lang === "hi" ? "ऑस्ट्रेलियाई पूर्वी (AEST)" : lang === "pt" ? "Austrália Oriental (AEST)" : lang === "de" ? "Ostasiatische Zeit (AEST)" : lang === "it" ? "Australia Orientale (AEST)" : lang === "ko" ? "호주 동부시 (AEST)" : "Australia Eastern (AEST)" }
                    ].map((tz) => (
                      <option key={tz.id} value={tz.id}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{d.account.language}</label>
                  <select value={a.language} onChange={(e) => set({ language: e.target.value })}>
                    {[
                      { id: "English", label: lang === "es" ? "Inglés" : lang === "fr" ? "Anglais" : lang === "ja" ? "英語" : lang === "zh" ? "英语" : lang === "ar" ? "الإنجليزية" : lang === "hi" ? "अंग्रेज़ी" : lang === "pt" ? "Inglês" : lang === "de" ? "Englisch" : lang === "it" ? "Inglese" : lang === "ko" ? "영어" : "English" },
                      { id: "Spanish", label: lang === "es" ? "Español" : lang === "fr" ? "Espagnol" : lang === "ja" ? "スペイン語" : lang === "zh" ? "西班牙语" : lang === "ar" ? "الإسبانية" : lang === "hi" ? "स्पैनिश" : lang === "pt" ? "Espanhol" : lang === "de" ? "Spanisch" : lang === "it" ? "Spagnolo" : lang === "ko" ? "스페인어" : "Spanish" },
                      { id: "Mandarin", label: lang === "es" ? "Mandarín" : lang === "fr" ? "Mandarin" : lang === "ja" ? "中国語" : lang === "zh" ? "中文（普通话）" : lang === "ar" ? "الماندرين" : lang === "hi" ? "मंदारिन" : lang === "pt" ? "Mandarim" : lang === "de" ? "Mandarin" : lang === "it" ? "Mandarino" : lang === "ko" ? "중국어" : "Mandarin" },
                      { id: "Tagalog", label: lang === "es" ? "Tagalo" : lang === "fr" ? "Tagalog" : lang === "ja" ? "タガログ語" : lang === "zh" ? "塔加路语" : lang === "ar" ? "التاغالوغية" : lang === "hi" ? "तागालोग" : lang === "pt" ? "Tagalo" : lang === "de" ? "Tagalog" : lang === "it" ? "Tagalog" : lang === "ko" ? "타갈로그어" : "Tagalog" },
                      { id: "Vietnamese", label: lang === "es" ? "Vietnamita" : lang === "fr" ? "Vietnamien" : lang === "ja" ? "ベトナム語" : lang === "zh" ? "越南语" : lang === "ar" ? "الفيتنامية" : lang === "hi" ? "वियतनामी" : lang === "pt" ? "Vietnamita" : lang === "de" ? "Vietnamesisch" : lang === "it" ? "Vietnamita" : lang === "ko" ? "베트남어" : "Vietnamese" },
                      { id: "French", label: lang === "es" ? "Francés" : lang === "fr" ? "Français" : lang === "ja" ? "フランス語" : lang === "zh" ? "法语" : lang === "ar" ? "الفرنسية" : lang === "hi" ? "फ़्रेंच" : lang === "pt" ? "Francês" : lang === "de" ? "Französisch" : lang === "it" ? "Francese" : lang === "ko" ? "프랑스어" : "French" }
                    ].map((l) => (
                      <option key={l.id} value={l.id}>{getLocalizedLineLabel(l.label, lang)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                <Icon name="check" /> {d.contacts.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <>
          {/* Plan Change Modal */}
          {planModalOpen && (
            <Modal
              title={lang === "es" ? "Cambiar plan de suscripción"
                : lang === "fr" ? "Changer de forfait"
                : lang === "ja" ? "サブスクリプションプランの変更"
                : lang === "zh" ? "更改订阅方案"
                : lang === "ar" ? "تغيير باقة الاشتراك"
                : lang === "hi" ? "सदस्यता प्लान बदलें"
                : lang === "pt" ? "Alterar plano de assinatura"
                : lang === "de" ? "Abonnement-Tarif ändern"
                : lang === "it" ? "Modifica il piano di abbonamento"
                : lang === "ko" ? "구독 플랜 변경"
                : "Change Subscription Plan"}
              onClose={() => setPlanModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setPlanModalOpen(false)}>
                    {lang === "es" ? "Cancelar"
                     : lang === "fr" ? "Annuler"
                     : lang === "ja" ? "キャンセル"
                     : lang === "zh" ? "取消"
                     : lang === "ar" ? "إلغاء"
                     : lang === "hi" ? "रद्द करें"
                     : lang === "pt" ? "Cancelar"
                     : lang === "de" ? "Abbrechen"
                     : lang === "it" ? "Annulla"
                     : lang === "ko" ? "취소"
                     : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={isModalButtonDisabled}
                    onClick={() => {
                      const proceedWithPlanSave = () => {
                        if (tempPlan === "essential" && lines.length > 1) {
                          const nextLines = lines.filter(l => l.id === selectedLineToKeep);
                          setLines(nextLines);
                          localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        } else if (tempPlan === "pro" && account.plan === "essential" && upgradeSelectedNumber) {
                          const newLine: Line = {
                            id: "line_" + Date.now(),
                            label: lang === "es" ? "Línea secundaria" : lang === "fr" ? "Ligne secondaire" : "Secondary line",
                            person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                            number: upgradeSelectedNumber.number,
                            color: "oklch(0.58 0.115 232)",
                            mode: "cascade",
                            minutesUsed: 0,
                            contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                          };
                          const nextLines = [...lines, newLine];
                          setLines(nextLines);
                          localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        }
                        set({ plan: tempPlan, billingCycle: tempCycle });
                        setPlanModalOpen(false);
                        showToast(lang === "es" ? "Plan actualizado correctamente"
                          : lang === "fr" ? "Forfait mis à jour avec succès"
                          : lang === "ja" ? "プランが正常に更新されました"
                          : lang === "zh" ? "方案已成功更新"
                          : lang === "ar" ? "تم تحديث الباقة بنجاح"
                          : lang === "hi" ? "प्लान सफलतापूर्वक अपडेट किया गया"
                          : lang === "pt" ? "Plano atualizado com sucesso"
                          : lang === "de" ? "Tarif erfolgreich aktualisiert"
                          : lang === "it" ? "Piano aggiornato con successo"
                          : lang === "ko" ? "플랜이 성공적으로 업데이트되었습니다"
                          : "Plan updated successfully");
                      };

                      const isUpgradingCycle = account.billingCycle === "monthly" && tempCycle === "yearly";
                      if (isUpgradingCycle) {
                        annualBillingConfirmCallback.current = proceedWithPlanSave;
                        setAnnualBillingConfirmOpen(true);
                      } else {
                        proceedWithPlanSave();
                      }
                    }}
                  >
                    {getModalButtonText()}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>
                  {lang === "es" ? "Seleccione el plan y el ciclo de facturación que mejor se adapte a sus necesidades:"
                    : lang === "fr" ? "Sélectionnez le forfait et le cycle de facturation qui vous conviennent :"
                    : lang === "ja" ? "ニーズに最適なプランと請求サイクルを選択してください:"
                    : lang === "zh" ? "选择最适合您需求的方案和账单周期:"
                    : lang === "ar" ? "اختر الباقة ودورة الفوترة التي تناسب احتياجاتك بشكل أفضل:"
                    : lang === "hi" ? "वह प्लान और बिलिंग चक्र चुनें जो आपकी आवश्यकताओं के सबसे अनुकूल हो:"
                    : lang === "pt" ? "Selecione o plano e o ciclo de cobrança que melhor atendam às suas necessidades:"
                    : lang === "de" ? "Wählen Sie den Tarif und Abrechnungszeitraum, der am besten zu Ihren Anforderungen passt:"
                    : lang === "it" ? "Seleziona il piano e il ciclo di fatturazione più adatti alle tue esigenze:"
                    : lang === "ko" ? "귀하의 필요에 가장 적합한 플랜과 결제 주기를 선택하세요:"
                    : "Select the plan and billing cycle that best fits your needs:"}
                </p>
                
                {/* Billing Cycle Toggle inside Modal */}
                <div style={{ display: "flex", justifyContent: "center", marginBlock: 5 }}>
                  <div className="seg" style={{ padding: 4 }}>
                    <button
                      className={`seg-btn ${tempCycle === "monthly" ? "active" : ""}`}
                      onClick={() => setTempCycle("monthly")}
                      style={{ padding: "6px 16px", fontSize: "0.88rem" }}
                    >
                      {lang === "es" ? "Mensual"
                       : lang === "fr" ? "Mensuel"
                       : lang === "ja" ? "月払い"
                       : lang === "zh" ? "按月"
                       : lang === "ar" ? "شهرياً"
                       : lang === "hi" ? "मासिक"
                       : lang === "pt" ? "Mensal"
                       : lang === "de" ? "Monatlich"
                       : lang === "it" ? "Mensile"
                       : lang === "ko" ? "월간"
                       : "Monthly"}
                    </button>
                    <button
                      className={`seg-btn ${tempCycle === "yearly" ? "active" : ""}`}
                      onClick={() => setTempCycle("yearly")}
                      style={{ 
                        padding: "6px 16px", 
                        fontSize: "0.88rem", 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: 6 
                      }}
                    >
                      {lang === "es" ? "Anual"
                     : lang === "fr" ? "Annuel"
                     : lang === "ja" ? "年払い"
                     : lang === "zh" ? "按年"
                     : lang === "ar" ? "سنوياً"
                     : lang === "hi" ? "वार्षिक"
                     : lang === "pt" ? "Anual"
                     : lang === "de" ? "Jährlich"
                     : lang === "it" ? "Annuale"
                     : lang === "ko" ? "연간"
                     : "Annual"}
                      <span style={{ 
                        fontSize: "0.72rem", 
                        fontWeight: 700, 
                        background: tempCycle === "yearly" ? "rgba(255, 255, 255, 0.25)" : "oklch(0.70 0.13 158 / 0.18)", 
                        color: tempCycle === "yearly" ? "#fff" : "oklch(0.42 0.13 158)",
                        padding: "2px 6px",
                        borderRadius: 999
                      }}>
                        {save17Map[lang] || save17Map.en}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plans Selection List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Essential Plan Option */}
                  <div 
                    className={`card ${tempPlan === "essential" ? "featured" : ""}`}
                    onClick={() => setTempPlan("essential")}
                    style={{ 
                      padding: 18, 
                      cursor: "pointer", 
                      border: tempPlan === "essential" ? "2px solid var(--blue)" : "1px solid var(--line)",
                      background: tempPlan === "essential" ? "var(--tint)" : "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: "var(--r-md)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "1.1rem" }}>
                          {lang === "es" ? "Plan Esencial"
                           : lang === "fr" ? "Forfait Essentiel"
                           : lang === "ja" ? "エッセンシャルプラン"
                           : lang === "zh" ? "基础版方案"
                           : lang === "ar" ? "الباقة الأساسية"
                           : lang === "hi" ? "एसेनशियल प्लान"
                           : lang === "pt" ? "Plano Essencial"
                           : lang === "de" ? "Essential-Tarif"
                           : lang === "it" ? "Piano Essenziale"
                           : lang === "ko" ? "에센셜 플랜"
                           : "Essential Plan"}
                        </b>
                        {account.plan === "essential" && (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {lang === "es" ? "Plan actual"
                             : lang === "fr" ? "Forfait actuel"
                             : lang === "ja" ? "現在のプラン"
                             : lang === "zh" ? "当前方案"
                             : lang === "ar" ? "الباقة الحالية"
                             : lang === "hi" ? "वर्तमान प्लान"
                             : lang === "pt" ? "Plano atual"
                             : lang === "de" ? "Aktueller Tarif"
                             : lang === "it" ? "Piano attuale"
                             : lang === "ko" ? "현재 플랜"
                             : "Current Plan"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                        {tempCycle === "yearly" ? "$12.42/mo" : "$14.99/mo"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>
                      {lang === "es" ? "Perfecto para familias individuales. Incluye 1 número y hasta 3 contactos."
                        : lang === "fr" ? "Idéal pour une configuration mono-famille. 1 numéro et 3 contacts max."
                        : lang === "ja" ? "単一家族のセットアップに最適。1つの番号と最大3つの連絡先が含まれます。"
                        : lang === "zh" ? "最适合单家庭使用。包含 1 个号码和最多 3 个联系人。"
                        : lang === "ar" ? "مثالي للعائلات المستقلة. يشمل رقماً واحداً وحتى 3 جهات اتصال."
                        : lang === "hi" ? "एकल-परिवार सेटअप के लिए बिल्कुल सही। इसमें 1 नंबर और 3 संपर्कों तक शामिल हैं।"
                        : lang === "pt" ? "Perfeito para configurações de família única. Inclui 1 número e até 3 contatos."
                        : lang === "de" ? "Perfekt für Einzelfamilien. Enthält 1 Rufnummer und bis zu 3 Kontakte."
                        : lang === "it" ? "Perfetto per configurazioni mono-famiglia. Include 1 numero e fino a 3 contatti."
                        : lang === "ko" ? "단일 가족 구성에 적합합니다. 1개의 번호와 최대 3개의 연락처를 포함합니다."
                        : "Perfect for single-family setups. Includes 1 number and up to 3 contacts."}
                    </p>
                  </div>

                  {/* Pro Plan Option */}
                  <div 
                    className={`card ${tempPlan === "pro" ? "featured" : ""}`}
                    onClick={() => setTempPlan("pro")}
                    style={{ 
                      padding: 18, 
                      cursor: "pointer", 
                      border: tempPlan === "pro" ? "2px solid var(--blue)" : "1px solid var(--line)",
                      background: tempPlan === "pro" ? "var(--tint)" : "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: "var(--r-md)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "1.1rem" }}>
                          {lang === "es" ? "Plan Pro"
                           : lang === "fr" ? "Forfait Pro"
                           : lang === "ja" ? "プロプラン"
                           : lang === "zh" ? "专业版方案"
                           : lang === "ar" ? "الباقة الاحترافية"
                           : lang === "hi" ? "प्रो प्लान"
                           : lang === "pt" ? "Plano Pro"
                           : lang === "de" ? "Pro-Tarif"
                           : lang === "it" ? "Piano Pro"
                           : lang === "ko" ? "프로 플랜"
                           : "Pro Plan"}
                        </b>
                        {account.plan === "pro" && (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {lang === "es" ? "Plan actual"
                             : lang === "fr" ? "Forfait actuel"
                             : lang === "ja" ? "現在のプラン"
                             : lang === "zh" ? "当前方案"
                             : lang === "ar" ? "الباقة الحالية"
                             : lang === "hi" ? "वर्तमान प्लान"
                             : lang === "pt" ? "Plano atual"
                             : lang === "de" ? "Aktueller Tarif"
                             : lang === "it" ? "Piano attuale"
                             : lang === "ko" ? "현재 플랜"
                             : "Current Plan"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                        {tempCycle === "yearly" ? "$20.75/mo" : "$24.99/mo"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>
                      {lang === "es" ? "Para grupos activos. Incluye 2 números, hasta 6 contactos, menús y horarios."
                        : lang === "fr" ? "Pour les aidants actifs. 2 numéros, 6 contacts max, menus et planning."
                        : lang === "ja" ? "アクティブな介護グループ向け。2つの番号、最大6つの連絡先、音声メニュー、スケジュール機能を含みます。"
                        : lang === "zh" ? "适合活跃的看护团队。包含 2 个号码、最多 6 个联系人、语音菜单和排班管理。"
                        : lang === "ar" ? "لمجموعات الرعاية النشطة. يشمل رقمين، وحتى 6 جهات اتصال، وقوائم اتصال، وجدولة التغطية."
                        : lang === "hi" ? "सक्रिय देखभाल समूहों के लिए। इसमें 2 नंबर, 6 संपर्कों तक, मेनू और शेड्यूलिंग शामिल हैं।"
                        : lang === "pt" ? "Para grupos de cuidados ativos. Inclui 2 números, até 6 contatos, menus e agendamento."
                        : lang === "de" ? "Für aktive Pflegegruppen. Enthält 2 Rufnummern, bis zu 6 Kontakte, Sprachmenüs und Schichtplanung."
                        : lang === "it" ? "Per gruppi di assistenza attivi. Include 2 numeri, fino a 6 contatti, menu e programmazione."
                        : lang === "ko" ? "활동적인 케어 그룹용. 2개의 번호, 최대 6개의 연락처, 메뉴 및 일정 관리 기능을 포함합니다."
                        : "For active care groups. Includes 2 numbers, up to 6 contacts, menus, and scheduling."}
                    </p>
                  </div>
                </div>

                {/* Phone number picker if upgrading to Pro and current plan is Essential */}
                {tempPlan === "pro" && account.plan === "essential" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                    <b style={{ fontSize: "0.95rem", color: "var(--ink)", textAlign: "left" }}>
                      {lang === "es"
                        ? "Seleccione su segundo número de teléfono para el plan Pro:"
                        : lang === "fr"
                        ? "Sélectionnez votre deuxième numéro de téléphone pour le forfait Pro :"
                        : "Select your second phone number for the Pro plan:"}
                    </b>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)", margin: 0, textAlign: "left" }}>
                      {lang === "es"
                        ? "Busque por código de área para encontrar números locales disponibles:"
                        : lang === "fr"
                        ? "Recherchez par indicatif régional pour trouver des numéros locaux disponibles :"
                        : "Search by area code to find available local numbers:"}
                    </p>

                    {/* Search Bar */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid var(--line)",
                        borderRadius: "var(--r-md)",
                        padding: "6px 10px",
                        background: "var(--surface)",
                        flex: 1
                      }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)", fontWeight: 600 }}>
                          {lang === "es" ? "Cód. área" : lang === "fr" ? "Indicatif" : "Area code"}
                        </span>
                        <input
                          type="text"
                          maxLength={3}
                          value={upgradeAreaCode}
                          onChange={(e) => setUpgradeAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          onKeyDown={(e) => e.key === "Enter" && loadUpgradeNumbers(upgradeAreaCode)}
                          style={{
                            border: "none",
                            outline: "none",
                            width: "100%",
                            background: "transparent",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: "var(--ink)"
                          }}
                        />
                        {upgradeAreaCode.length === 3 && <AreaFlag areaCode={upgradeAreaCode} height={15} showAbbr />}
                      </div>
                      <button
                        className="btn btn-ghost"
                        onClick={() => loadUpgradeNumbers(upgradeAreaCode)}
                        disabled={upgradeAreaCode.length !== 3 || isSearchingNumbers}
                        style={{ padding: "8px 14px", height: 38 }}
                      >
                        {lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"}
                      </button>
                    </div>

                    {/* Suggestions */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {AREA_SUGGESTIONS.map((a) => (
                        <button
                          key={a.code}
                          onClick={() => { setUpgradeAreaCode(a.code); loadUpgradeNumbers(a.code); }}
                          style={{
                            fontSize: "0.76rem",
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "var(--bg)",
                            border: "1px solid var(--line)",
                            color: "var(--ink-soft)",
                            cursor: "pointer"
                          }}
                        >
                          {a.code} · {a.city}
                        </button>
                      ))}
                    </div>

                    {/* Results grid */}
                    {isSearchingNumbers ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--r-md)", animation: "pulse 1.5s infinite" }} />
                        ))}
                      </div>
                    ) : upgradeNumbersList.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto", padding: 2 }}>
                        {(upgradeNumbersList[0]?.area === "787" || upgradeNumbersList[0]?.area === "939") && (
                          <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                            {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                          </div>
                        )}
                        {upgradeNumbersList.map((n) => {
                          const isSelected = upgradeSelectedNumber?.number === n.number;
                          return (
                            <button
                              key={n.id}
                              onClick={() => setUpgradeSelectedNumber(n)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                padding: "8px 12px",
                                borderRadius: "var(--r-md)",
                                border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                                background: isSelected ? "var(--tint)" : "var(--surface)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textAlign: "left",
                                gap: 2
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <AreaFlag areaCode={n.area} />
                                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{n.number}</span>
                              </span>
                              <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                                {n.memorable || (lang === "es" ? "Número local" : lang === "fr" ? "Numéro local" : "Local number")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.86rem", color: "var(--ink-faint)", margin: 0 }}>
                        {lang === "es" ? "No se encontraron números." : lang === "fr" ? "Aucun numéro trouvé." : "No numbers found."}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone number selector if downgrading to Essential and has >1 number */}
                {tempPlan === "essential" && lines.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                    <b style={{ fontSize: "0.95rem", color: "var(--ink)", textAlign: "left" }}>
                      {lang === "es"
                        ? "Seleccione el número de teléfono que desea conservar:"
                        : lang === "fr"
                        ? "Sélectionnez le numéro de téléphone que vous souhaitez conserver :"
                        : "Select the phone number you wish to keep:"}
                    </b>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {lines.map((l) => (
                        <label
                          key={l.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            border: selectedLineToKeep === l.id ? "2px solid var(--blue)" : "1px solid var(--line)",
                            background: selectedLineToKeep === l.id ? "var(--tint)" : "transparent",
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <input
                            type="radio"
                            name="lineToKeep"
                            value={l.id}
                            checked={selectedLineToKeep === l.id}
                            onChange={() => setSelectedLineToKeep(l.id)}
                            style={{ width: 16, height: 16 }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                            <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{getLocalizedLineLabel(l.label, lang)}</span>
                            <span style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>{l.number}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <p style={{ 
                      fontSize: "0.82rem", 
                      color: "oklch(0.55 0.18 25)", 
                      background: "oklch(0.97 0.04 25 / 0.3)", 
                      border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                      borderRadius: "var(--r-md)",
                      padding: "8px 12px",
                      margin: 0,
                      fontWeight: 500,
                      textAlign: "left"
                    }}>
                      {lang === "es" ? "Una vez devuelto un número, ya no se puede reclamar nuevamente."
                      : lang === "fr" ? "Une fois un numéro restitué, vous ne pouvez plus le réclamer."
                      : lang === "ja" ? "一度返却された番号は、再度取得することはできません。"
                      : lang === "zh" ? "号码一旦退还，将无法再次申领。"
                      : lang === "ar" ? "بمجرد إرجاع الرقم، لا يمكنك المطالبة به مرة أخرى."
                      : lang === "hi" ? "एक बार नंबर वापस करने के बाद, आप उसे दोबारा क्लेम नहीं कर सकते।"
                      : lang === "pt" ? "Depois de devolver um número, você não poderá solicitá-lo novamente."
                      : lang === "de" ? "Sobald eine Nummer zurückgegeben wurde, kann sie nicht erneut beansprucht werden."
                      : lang === "it" ? "Una volta restituito un numero, non potrai più richiederlo."
                      : lang === "ko" ? "번호가 반환되면 다시 청구할 수 없습니다."
                      : "Once a number is returned, you can no longer claim it again."}
                    </p>
                  </div>
                )}
              </div>
            </Modal>
          )}

          {/* Add-on Numbers Configuration Modal */}
          {addonModalOpen && (
            <Modal
              title={lang === "es" ? "Configurar números adicionales de teléfono" : lang === "fr" ? "Configurer les numéros de téléphone supplémentaires" : "Configure Additional Phone Numbers"}
              onClose={() => setAddonModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setAddonModalOpen(false)}>
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={addedNumbersConfig.some(c => !c.selectedNumber) || addonCheckoutLoading}
                    onClick={async () => {
                      const newMinuteBlocks = tempMinuteBlocks;

                      // Determine which add-ons need checkout
                      const checkouts: Array<{ addon: string; quantity: number }> = [];
                      if (chargeableNewNumbers > 0) checkouts.push({ addon: "phone_number", quantity: chargeableNewNumbers });
                      if (newMinuteBlocks > 0) checkouts.push({ addon: "voice_minutes", quantity: newMinuteBlocks });

                      // Save the local state action for after payment(s) succeed
                      const applyAddons = () => {
                        setAccount((prev) => {
                          const updated = {
                            ...prev,
                            addons: {
                              ...(prev.addons || {}),
                              extraNumbers: (prev.addons?.extraNumbers || 0) + chargeableNewNumbers,
                              minuteBlocks: (prev.addons?.minuteBlocks || 0) + newMinuteBlocks,
                            } as Account["addons"],
                          };
                          localStorage.setItem("ic_account_data", JSON.stringify(updated));
                          return updated;
                        });
                        setTempMinuteBlocks(0);

                        const newLines = addedNumbersConfig.map((config, index) => ({
                          id: "line_" + Date.now() + "_" + index,
                          label: getLineDefaultLabel(lines.length + index, account.plan, lang),
                          person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                          number: config.selectedNumber!.number,
                          color: AVATAR_COLORS[(lines.length + index) % AVATAR_COLORS.length],
                          mode: "cascade" as const,
                          minutesUsed: 0,
                          contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                        }));

                        const nextLines = [...lines, ...newLines];
                        setLines(nextLines);
                        localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        setAddonModalOpen(false);
                        showToast(ext.addonsUpdatedToast);
                      };

                      if (checkouts.length === 0) {
                        applyAddons();
                        return;
                      }

                      // Open popup immediately (must be synchronous within user gesture)
                      const w = 520, h = 720;
                      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
                      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
                      const popup = window.open("about:blank", "creem_addon_checkout", `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);

                      addonPopupRef.current = popup;
                      addonPendingAction.current = applyAddons;

                      // Clear any stale success flag before starting
                      localStorage.removeItem("creem_addon_success");

                      setAddonCheckoutLoading(true);

                      try {
                        const first = checkouts[0];
                        const res = await fetch("/api/creem/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ addon: first.addon, quantity: first.quantity }),
                        });
                        if (!res.ok) throw new Error("checkout_failed");
                        const { checkoutUrl } = await res.json();

                        if (popup) {
                          popup.location.href = checkoutUrl;
                        } else {
                          window.open(checkoutUrl, "_blank");
                        }

                        // Poll localStorage for success flag (focus events are unreliable after cross-origin popup nav)
                        const poll = setInterval(() => {
                          const raw = localStorage.getItem("creem_addon_success");
                          if (raw) {
                            try {
                              const { ts } = JSON.parse(raw);
                              if (Date.now() - ts < 60000) {
                                clearInterval(poll);
                                localStorage.removeItem("creem_addon_success");
                                try { popup?.close(); } catch {}
                                if (addonPopupRef.current === popup) {
                                  addonPopupRef.current = null;
                                }
                                applyAddons();
                              }
                            } catch {}
                          }
                        }, 800);

                        // Stop polling after 10 minutes
                        setTimeout(() => clearInterval(poll), 600000);
                      } catch {
                        console.error("Failed to create add-on checkout");
                        try { popup?.close(); } catch {}
                        if (addonPopupRef.current === popup) {
                          addonPopupRef.current = null;
                        }
                        addonPendingAction.current = null;
                        showToast(lang === "es" ? "No se pudo iniciar el proceso de pago. Por favor, inténtelo de nuevo."
                          : lang === "fr" ? "Impossible de lancer le paiement. Veuillez réessayer."
                          : lang === "ja" ? "チェックアウトを開始できませんでした。もう一度お試しください。"
                          : lang === "zh" ? "无法开始结账。请重试。"
                          : lang === "ar" ? "تعذر بدء عملية الدفع. يرجى المحاولة مرة أخرى."
                          : lang === "hi" ? "चेकआउट शुरू नहीं किया जा सका। कृपया पुनः प्रयास करें।"
                          : lang === "pt" ? "Não foi possível iniciar o checkout. Por favor, tente novamente."
                          : lang === "de" ? "Zahlungsvorgang konnte nicht gestartet werden. Bitte versuchen Sie es erneut."
                          : lang === "it" ? "Impossibile avviare il pagamento. Riprova."
                          : lang === "ko" ? "결제를 시작할 수 없습니다. 다시 시도해 주세요."
                          : "Could not start checkout. Please try again.");
                      } finally {
                        setAddonCheckoutLoading(false);
                      }
                    }}
                  >
                    {addonCheckoutLoading
                      ? <><div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", marginRight: 6 }} />{lang === "es" ? "Procesando…" : lang === "fr" ? "Traitement…" : lang === "ja" ? "処理中…" : lang === "zh" ? "处理中…" : lang === "ar" ? "جاري المعالجة…" : lang === "hi" ? "प्रसंस्करण…" : lang === "pt" ? "Processando…" : lang === "de" ? "Verarbeitung…" : lang === "it" ? "Elaborazione in corso…" : lang === "ko" ? "처리 중…" : "Processing…"}</>
                      : (chargeableNewNumbers > 0 || tempMinuteBlocks > 0
                        ? (lang === "es" ? "Aprobar y pagar" : lang === "fr" ? "Approuver et payer" : "Approve & Pay")
                        : (lang === "es" ? "Confirmar y guardar" : lang === "fr" ? "Confirmer et enregistrer" : "Confirm & Save"))}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Voice Minutes Confirmation Info */}
                {tempMinuteBlocks > 0 && (
                  <div style={{
                    fontSize: "0.9rem",
                    color: "var(--ink-soft)",
                    background: "var(--tint)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 500
                  }}>
                    <b>{lang === "es" ? "Confirmar minutos adicionales:" : lang === "fr" ? "Confirmer les minutes supplémentaires :" : "Confirm Extra Voice Minutes:"}</b>{" "}
                    {lang === "es"
                      ? `Agregando ${tempMinuteBlocks * 30} minutos adicionales.`
                      : lang === "fr"
                      ? `Ajout de ${tempMinuteBlocks * 30} minutes vocales supplémentaires.`
                      : `Adding ${tempMinuteBlocks * 30} extra voice minutes.`}
                  </div>
                )}

                {/* Billing Notice */}
                <div style={{
                  fontSize: "0.88rem",
                  color: "oklch(0.55 0.18 25)",
                  background: "oklch(0.97 0.04 25 / 0.3)",
                  border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 14px",
                  fontWeight: 500,
                  textAlign: "left",
                  lineHeight: "1.4"
                }}>
                  <b>
                    {lang === "es" ? "Aviso de facturación:" 
                      : lang === "fr" ? "Avis de facturation :" 
                      : lang === "ja" ? "請求に関するお知らせ:"
                      : lang === "zh" ? "账单通知:"
                      : lang === "ar" ? "إشعار الفواتير:"
                      : lang === "hi" ? "बिलिंग सूचना:"
                      : lang === "pt" ? "Aviso de faturamento:"
                      : lang === "de" ? "Abrechnungshinweis:"
                      : lang === "it" ? "Avviso di fatturazione:"
                      : lang === "ko" ? "결제 안내:"
                      : "Billing Notice:"}
                  </b>{" "}
                  {chargeableNewNumbers > 0 || tempMinuteBlocks > 0 ? (
                    tempMinuteBlocks > 0 ? (
                      lang === "es" ? "La facturación de los números y minutos adicionales comenzará inmediatamente después de aprobar los complementos."
                        : lang === "fr" ? "La facturation des numéros supplémentaires et des minutes vocales supplémentaires sera effective immédiatement après l'approbation des options."
                        : lang === "ja" ? "アドオン番号と追加通話分の請求は、アドオンの承認後すぐに開始されます。"
                        : lang === "zh" ? "附加号码和额外通话分钟数的计费将在批准附加服务后立即生效。"
                        : lang === "ar" ? "سيبدأ تحصيل فواتير الأرقام الإضافية ودقائق المكالمات الزائدة فور الموافقة على الخدمات الإضافية."
                        : lang === "hi" ? "ऐड-ऑन नंबरों और अतिरिक्त वॉयस मिनटों की计费将在批准附加服务后立即生效。"
                        : lang === "pt" ? "A cobrança dos números adicionais e minutos de voz extras entrará em vigor imediatamente após a aprovação dos adicionais."
                        : lang === "de" ? "Die Abrechnung für die Zusatzrufnummern und zusätzlichen Sprachminuten erfolgt sofort nach Genehmigung der Zusatzoptionen."
                        : lang === "it" ? "La fatturazione per i numeri aggiuntivi e i minuti di conversazione extra sarà effettiva immediatamente dopo l'approvazione delle opzioni."
                        : lang === "ko" ? "추가 번호 및 추가 음성 통화 분 요금은 부가 서비스를 승인하는 즉시 청구됩니다."
                        : "Billing for the add-on numbers and extra voice minutes will be effective immediately upon approving the add-ons."
                    ) : (
                      lang === "es"
                        ? "La facturación de los números adicionales comenzará inmediatamente después de aprobar los complementos."
                        : lang === "fr" ? "La facturation des numéros supplémentaires sera effective immédiatement après l'approbation des options."
                        : lang === "ja" ? "アドオン番号の請求は、アドオンの承認後すぐに開始されます。"
                        : lang === "zh" ? "附加号码的计费将在批准附加服务后立即生效。"
                        : lang === "ar" ? "سيبدأ تحصيل فواتير الأرقام الإضافية فور الموافقة على الخدمات الإضافية."
                        : lang === "hi" ? "ऐड-ऑन नंबरों की计费将在批准附加服务后立即生效。"
                        : lang === "pt" ? "A cobrança dos números adicionais entrará em vigor imediatamente após a aprovação dos adicionais."
                        : lang === "de" ? "Die Abrechnung für die Zusatzrufnummern erfolgt sofort nach Genehmigung der Zusatzoptionen."
                        : lang === "it" ? "La fatturazione per i numeri aggiuntivi sarà effettiva immediatamente dopo l'approvazione delle opzioni."
                        : lang === "ko" ? "추가 번호 요금은 부가 서비스를 승인하는 즉시 청구됩니다."
                        : "Billing for the add-on numbers will be effective immediately upon approving the add-ons."
                    )
                  ) : (
                    lang === "es" ? "Esta línea adicional está incluida en su plan sin costo adicional."
                      : lang === "fr" ? "Cette ligne supplémentaire est incluse dans votre forfait sans frais supplémentaires."
                      : lang === "ja" ? "この追加回線はプランに含まれており、追加料金はかかりません。"
                      : lang === "zh" ? "此附加线路已包含在您的方案中，无需额外费用。"
                      : lang === "ar" ? "هذا الخط الإضافي مشمول في باقتك دون أي تكلفة إضافية."
                      : lang === "hi" ? "यह अतिरिक्त लाइन आपके प्लान में बिना किसी अतिरिक्त शुल्क के शामिल है।"
                      : lang === "pt" ? "Esta linha adicional está incluída no seu plano sem custo extra."
                      : lang === "de" ? "Diese zusätzliche Leitung ist ohne zusätzliche Kosten in Ihrem Tarif enthalten."
                      : lang === "it" ? "Questa linea aggiuntiva è inclusa nel tuo piano senza costi aggiuntivi."
                      : lang === "ko" ? "이 추가 회선은 플랜에 포함되어 있어 추가 비용이 발생하지 않습니다."
                      : "This additional line is included in your plan at no additional cost."
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                  {addedNumbersConfig.map((config) => (
                    <div key={config.index} style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-lg)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      background: "var(--bg-card)",
                      textAlign: "left"
                    }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 800 553.0305"
                          style={{ width: "24px", height: "auto", display: "block", flexShrink: 0 }}
                        >
                          <g>
                            <path fill="#1c2530" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                            <path fill="#1c2530" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
                          </g>
                          <path fill="#4083ae" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
                        </svg>
                        {lang === "es" 
                          ? `Número adicional ${currentExtraLines + config.index + 1}` 
                          : lang === "fr" 
                          ? `Numéro supplémentaire ${currentExtraLines + config.index + 1}` 
                          : `Additional Number ${currentExtraLines + config.index + 1}`}
                        {config.selectedNumber && (
                          <span style={{ fontSize: "0.8rem", color: "var(--blue)", fontWeight: 500 }}>
                            ({config.selectedNumber.number})
                          </span>
                        )}
                      </h4>

                      {/* Search Bar */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          border: "1px solid var(--line)",
                          borderRadius: "var(--r-md)",
                          padding: "6px 10px",
                          background: "var(--surface)",
                          flex: 1
                        }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)", fontWeight: 600 }}>
                            {lang === "es" ? "Cód. área" : lang === "fr" ? "Indicatif" : "Area code"}
                          </span>
                          <input
                            type="text"
                            maxLength={3}
                            value={config.areaCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                              setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, areaCode: val } : c));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && config.areaCode.length === 3) {
                                loadAddonNumberSlot(config.index, config.areaCode);
                              }
                            }}
                            style={{
                              border: "none",
                              outline: "none",
                              width: "100%",
                              background: "transparent",
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              color: "var(--ink)"
                            }}
                          />
                          {config.areaCode.length === 3 && <AreaFlag areaCode={config.areaCode} height={15} showAbbr />}
                        </div>
                        <button
                          className="btn btn-ghost"
                          onClick={() => loadAddonNumberSlot(config.index, config.areaCode)}
                          disabled={config.areaCode.length !== 3 || config.isSearching}
                          style={{ padding: "8px 14px", height: 38 }}
                        >
                          {lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"}
                        </button>
                      </div>

                      {/* Suggestions */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {AREA_SUGGESTIONS.map((a) => (
                          <button
                            key={a.code}
                            onClick={() => {
                              setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, areaCode: a.code } : c));
                              loadAddonNumberSlot(config.index, a.code);
                            }}
                            style={{
                              fontSize: "0.76rem",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "var(--bg)",
                              border: "1px solid var(--line)",
                              color: "var(--ink-soft)",
                              cursor: "pointer"
                            }}
                          >
                            {a.code} · {a.city}
                          </button>
                        ))}
                      </div>

                      {/* Results grid */}
                      {config.isSearching ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--r-md)", animation: "pulse 1.5s infinite" }} />
                          ))}
                        </div>
                      ) : config.numbersList && config.numbersList.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto", padding: 2 }}>
                          {(config.numbersList[0]?.area === "787" || config.numbersList[0]?.area === "939") && (
                            <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                              {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                            </div>
                          )}
                          {config.numbersList.map((n) => {
                            const isSelected = config.selectedNumber?.number === n.number;
                            return (
                              <button
                                key={n.id}
                                onClick={() => setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, selectedNumber: n } : c))}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  padding: "8px 12px",
                                  borderRadius: "var(--r-md)",
                                  border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                                  background: isSelected ? "var(--tint)" : "var(--surface)",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  textAlign: "left",
                                  gap: 2
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <AreaFlag areaCode={n.area} />
                                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{n.number}</span>
                                </span>
                                <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                                  {n.memorable || (lang === "es" ? "Número local" : lang === "fr" ? "Numéro local" : "Local number")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", color: "var(--ink-faint)", textAlign: "center", padding: 12 }}>
                          {lang === "es" 
                            ? "Ingrese un código de área para buscar números disponibles" 
                            : lang === "fr" 
                            ? "Entrez un indicatif pour rechercher les numéros disponibles" 
                            : "Enter an area code to search for available numbers"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Modal>
          )}

          {/* Add-on Numbers Removal Modal */}
          {addonRemovalModalOpen && (
            <Modal
              title={lang === "es" ? "Seleccionar números a devolver" : lang === "fr" ? "Sélectionner les numéros à restituer" : "Select Phone Numbers to Return"}
              onClose={() => setAddonRemovalModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setAddonRemovalModalOpen(false)}>
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={selectedLinesToRemove.length !== (Math.max(0, lines.length - (a.plan === "pro" ? 2 : 1)) - tempExtraNumbers)}
                    onClick={() => {
                      // Filter out returned lines
                      const nextLines = lines.filter(l => !selectedLinesToRemove.includes(l.id));
                      setLines(nextLines);
                      localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));

                      // Update account addons
                      setAccount((prev) => {
                        const updated = {
                          ...prev,
                          addons: {
                            ...(prev.addons || {}),
                            extraNumbers: tempExtraNumbers,
                            minuteBlocks: tempMinuteBlocks,
                          } as Account["addons"],
                        };
                        localStorage.setItem("ic_account_data", JSON.stringify(updated));
                        return updated;
                      });

                      setAddonRemovalModalOpen(false);
                      showToast(ext.addonsUpdatedToast);
                    }}
                  >
                    {lang === "es" ? "Confirmar y guardar" : lang === "fr" ? "Confirmer et enregistrer" : "Confirm & Save"}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", textAlign: "left" }}>
                  {lang === "es"
                    ? `Debe seleccionar exactamente ${Math.max(0, lines.length - (a.plan === "pro" ? 2 : 1)) - tempExtraNumbers} número(s) para devolver:`
                    : lang === "fr"
                    ? `Vous devez sélectionner exactement ${Math.max(0, lines.length - (a.plan === "pro" ? 2 : 1)) - tempExtraNumbers} numéro(s) à restituer :`
                    : `You must select exactly ${Math.max(0, lines.length - (a.plan === "pro" ? 2 : 1)) - tempExtraNumbers} phone number(s) to return:`}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lines.slice(a.plan === "pro" ? 2 : 1).map((l) => {
                    const isSelected = selectedLinesToRemove.includes(l.id);
                    return (
                      <label
                        key={l.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                          background: isSelected ? "var(--tint)" : "transparent",
                          borderRadius: "var(--r-md)",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedLinesToRemove(prev => prev.filter(id => id !== l.id));
                            } else {
                              setSelectedLinesToRemove(prev => [...prev, l.id]);
                            }
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                          <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{getLocalizedLineLabel(l.label, lang)}</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>{l.number}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <p style={{ 
                  fontSize: "0.82rem", 
                  color: "oklch(0.55 0.18 25)", 
                  background: "oklch(0.97 0.04 25 / 0.3)", 
                  border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 12px",
                  margin: 0,
                  fontWeight: 500,
                  textAlign: "left"
                }}>
                  {lang === "es" ? "Una vez devuelto un número, ya no se puede reclamar nuevamente."
                  : lang === "fr" ? "Une fois un numéro restitué, vous ne pouvez plus le réclamer."
                  : lang === "ja" ? "一度返却された番号は、再度取得することはできません。"
                  : lang === "zh" ? "号码一旦退还，将无法再次申领。"
                  : lang === "ar" ? "بمجرد إرجاع الرقم، لا يمكنك المطالبة به مرة أخرى."
                  : lang === "hi" ? "एक बार नंबर वापस करने के बाद, आप उसे दोबारा क्लेม नहीं कर सकते।"
                  : lang === "pt" ? "Depois de devolver um número, você não poderá solicitá-lo novamente."
                  : lang === "de" ? "Sobald eine Nummer zurückgegeben wurde, kann sie nicht erneut beansprucht werden."
                  : lang === "it" ? "Una volta restituito un numero, non potrai più richiederlo."
                  : lang === "ko" ? "번호가 반환되면 다시 청구할 수 없습니다."
                  : "Once a number is returned, you can no longer claim it again."}
                </p>
              </div>
            </Modal>
          )}

          {/* Annual Billing Confirmation Modal */}
          {annualBillingConfirmOpen && (
            <Modal
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 800 553.0305"
                    style={{ width: "28px", height: "auto", display: "block", flexShrink: 0 }}
                  >
                    <g>
                      <path fill="#1c2530" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                      <path fill="#1c2530" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
                    </g>
                    <path fill="#4083ae" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
                  </svg>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>iCanCall</span>
                </div>
              }
              onClose={() => {
                setAnnualBillingConfirmOpen(false);
                annualBillingConfirmCallback.current = null;
              }}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setAnnualBillingConfirmOpen(false);
                      annualBillingConfirmCallback.current = null;
                    }}
                  >
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : lang === "ja" ? "キャンセル" : lang === "zh" ? "取消" : lang === "ar" ? "إلغاء" : lang === "hi" ? "रद्द करें" : lang === "pt" ? "Cancelar" : lang === "de" ? "Abbrechen" : lang === "it" ? "Annulla" : lang === "ko" ? "취소" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setAnnualBillingConfirmOpen(false);
                      if (annualBillingConfirmCallback.current) {
                        annualBillingConfirmCallback.current();
                        annualBillingConfirmCallback.current = null;
                      }
                    }}
                  >
                    {lang === "es" ? "Confirmar" : lang === "fr" ? "Confirmer" : lang === "ja" ? "確認" : lang === "zh" ? "确认" : lang === "ar" ? "تأكيد" : lang === "hi" ? "पुष्टि करें" : lang === "pt" ? "Confirmar" : lang === "de" ? "Bestätigen" : lang === "it" ? "Conferma" : lang === "ko" ? "확인" : "Confirm"}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.98rem", margin: 0, lineHeight: 1.5 }}>
                  {lang === "es"
                    ? "¿Está seguro de que desea cambiar a la facturación anual? Su método de pago registrado se cargará de inmediato."
                    : lang === "fr"
                    ? "Êtes-vous sûr de vouloir passer à la facturation annuelle ? Votre mode de paiement enregistré sera débité immédiatement."
                    : lang === "ja"
                    ? "年間請求に切り替えてもよろしいですか？登録済みのお支払い方法にすぐに請求されます。"
                    : lang === "zh"
                    ? "确定要切换为按年计费吗？将立即从您登记的付款方式中扣款。"
                    : lang === "ar"
                    ? "هل أنت متأكد أنك تريد التحول إلى الفوترة السنوية؟ سيتم الخصم فوراً من وسيلة الدفع المسجلة."
                    : lang === "hi"
                    ? "क्या आप वाकई वार्षिक बिलिंग पर स्विच करना चाहते हैं? आपकी दर्ज भुगतान विधि से तुरंत शुल्क लिया जाएगा।"
                    : lang === "pt"
                    ? "Tem certeza de que deseja mudar para a cobrança anual? Seu método de pagamento cadastrado será cobrado imediatamente."
                    : lang === "de"
                    ? "Möchten Sie wirklich zur jährlichen Abrechnung wechseln? Ihre hinterlegte Zahlungsmethode wird sofort belastet."
                    : lang === "it"
                    ? "Sei sicuro di voler passare alla fatturazione annuale? Il tuo metodo di pagamento registrato verrà addebitato immediatamente."
                    : lang === "ko"
                    ? "연간 결제로 전환하시겠습니까? 등록된 결제 수단으로 즉시 청구됩니다."
                    : "Are you sure you want to switch to annual billing? Your payment method on file will be charged immediately."}
                </p>
                <div style={{
                  fontSize: "0.92rem",
                  color: "var(--blue)",
                  background: "var(--tint)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 14px",
                  fontWeight: 600
                }}>
                  {lang === "es"
                    ? `Monto de facturación anual: ${account.plan === "pro" ? "$249.00" : "$149.00"}/año`
                    : lang === "fr"
                    ? `Montant de la facturation annuelle : ${account.plan === "pro" ? "249,00 $" : "149,00 $"}/an`
                    : lang === "ja"
                    ? `年間請求額: ${account.plan === "pro" ? "$249.00" : "$149.00"}/年`
                    : lang === "zh"
                    ? `年度计费金额：${account.plan === "pro" ? "$249.00" : "$149.00"}/年`
                    : lang === "ar"
                    ? `مبلغ الفوترة السنوية: ${account.plan === "pro" ? "$249.00" : "$149.00"} سنوياً`
                    : lang === "hi"
                    ? `वार्षिक बिलिंग राशि: ${account.plan === "pro" ? "$249.00" : "$149.00"}/वर्ष`
                    : lang === "pt"
                    ? `Valor da cobrança anual: ${account.plan === "pro" ? "$249.00" : "$149.00"}/ano`
                    : lang === "de"
                    ? `Jährlicher Abrechnungsbetrag: ${account.plan === "pro" ? "$249.00" : "$149.00"}/Jahr`
                    : lang === "it"
                    ? `Importo della fatturazione annuale: ${account.plan === "pro" ? "$249.00" : "$149.00"}/anno`
                    : lang === "ko"
                    ? `연간 결제 금액: ${account.plan === "pro" ? "$249.00" : "$149.00"}/년`
                    : `Annual billing amount: ${account.plan === "pro" ? "$249.00" : "$149.00"}/yr`}
                </div>
              </div>
            </Modal>
          )}

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.billing}</h2>
                <p>
                  {account.billingCycle === "yearly"
                    ? (lang === "es" ? "Facturado anualmente · renueva el 1 de junio de 2026"
                     : lang === "fr" ? "Facturé annuellement · se renouvelle le 1er juin 2026"
                     : lang === "ja" ? "年次請求 · 2026年6月1日に更新"
                     : lang === "zh" ? "按年计费 · 于 2026年6月1日续期"
                     : lang === "ar" ? "مفوتر سنوياً · يتجدد في 1 يونيو 2026"
                     : lang === "hi" ? "सालाना बिलिंग · 1 जून, 2026 को नवीनीकृत होगा"
                     : lang === "pt" ? "Cobrado anualmente · renova em 1 de junho de 2026"
                     : lang === "de" ? "Jährliche Abrechnung · verlängert sich am 1. Juni 2026"
                     : lang === "it" ? "Fatturato annualmente · si rinnova il 1 giugno 2026"
                     : lang === "ko" ? "연간 결제 · 2026년 6월 1일에 갱신 예정"
                     : "Billed annually · renews June 1, 2026")
                    : d.account.renewDateSub}
                </p>
              </div>
              <Badge kind={account.plan === "pro" ? "blue" : "amber"}>
                {account.plan === "pro"
                  ? (lang === "ja" ? "プロ"
                   : lang === "ko" ? "프로"
                   : lang === "zh" ? "专业版"
                   : lang === "ar" ? "برو"
                   : "Pro")
                  : (lang === "es" ? "Esencial"
                   : lang === "fr" ? "Essentiel"
                   : lang === "ja" ? "エッセンシャル"
                   : lang === "zh" ? "基础版"
                   : lang === "ar" ? "أساسي"
                   : lang === "hi" ? "एसेनशियल"
                   : lang === "pt" ? "Essencial"
                   : lang === "de" ? "Essential"
                   : lang === "it" ? "Essenziale"
                   : lang === "ko" ? "에센셜"
                   : "Essential")}
              </Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  {account.plan === "pro"
                    ? (account.billingCycle === "yearly" ? "$20.75" : "$24.99")
                    : (account.billingCycle === "yearly" ? "$12.42" : "$14.99")}
                </span>
                <span style={{ color: "var(--ink-faint)" }}>
                  {lang === "es" ? "/ mes" : lang === "fr" ? "/ mois" : lang === "ja" ? "/ 月" : lang === "zh" ? "/ 月" : lang === "ar" ? "/ شهر" : lang === "hi" ? "/ महीना" : lang === "pt" ? "/ mês" : lang === "de" ? "/ Monat" : lang === "it" ? "/ mese" : lang === "ko" ? "/ 월" : "/ month"}
                </span>
                {account.billingCycle === "yearly" && (
                  <span style={{ fontSize: "0.95rem", color: "var(--ink-faint)", marginLeft: 6 }}>
                    {account.plan === "pro"
                      ? (lang === "es" ? "(facturado anualmente a $249/año)"
                       : lang === "fr" ? "(facturé annuellement à 249 $/an)"
                       : lang === "ja" ? "(年額 $249 で請求)"
                       : lang === "zh" ? "(按年计费，每年 $249)"
                       : lang === "ar" ? "(تُخصم سنوياً بقيمة 249$/السنة)"
                       : lang === "hi" ? "(सालाना $249 शुल्क)"
                       : lang === "pt" ? "(cobrado anualmente a $249/ano)"
                       : lang === "de" ? "(jährliche Abrechnung von 249 $/Jahr)"
                       : lang === "it" ? "(fatturato annualmente a 249 $/anno)"
                       : lang === "ko" ? "(연간 $249 청구)"
                       : "(billed annually at $249/yr)")
                      : (lang === "es" ? "(facturado anualmente a $149/año)"
                       : lang === "fr" ? "(facturé annuellement à 149 $/an)"
                       : lang === "ja" ? "(年額 $149 で請求)"
                       : lang === "zh" ? "(按年计费，每年 $149)"
                       : lang === "ar" ? "(تُخصم سنوياً بقيمة 149$/السنة)"
                       : lang === "hi" ? "(सालाना $149 शुल्क)"
                       : lang === "pt" ? "(cobrado anualmente a $149/ano)"
                       : lang === "de" ? "(jährliche Abrechnung von 149 $/Jahr)"
                       : lang === "it" ? "(fatturato annualmente a 149 $/anno)"
                       : lang === "ko" ? "(연간 $149 청구)"
                       : "(billed annually at $149/yr)")}
                  </span>
                )}
                {account.billingCycle !== "yearly" && (
                  <span style={{ marginLeft: 10 }}>
                    <Badge kind="green">{ext.saveAnnual}</Badge>
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 24px",
                  marginTop: 18,
                }}
                className="feat-grid"
              >
                {((account.plan === "pro" ? d.account.billingFeatures : undefined) || [
                  lang === "es" ? "1 número de teléfono dedicado"
                  : lang === "fr" ? "1 numéro de sécurité dédié"
                  : lang === "ja" ? "1つの専用電話番号"
                  : lang === "zh" ? "1 个专用电话号码"
                  : lang === "ar" ? "رقم هاتف واحد مخصص"
                  : lang === "hi" ? "1 समर्पित फ़ोन नंबर"
                  : lang === "pt" ? "1 número de telefone dedicado"
                  : lang === "de" ? "1 dedizierte Telefonnummer"
                  : lang === "it" ? "1 numero di tempo dedicato"
                  : lang === "ko" ? "1개의 전용 전화번호"
                  : "1 dedicated phone number",

                  lang === "es" ? "Hasta 3 contactos por número"
                  : lang === "fr" ? "Jusqu'à 3 contacts par numéro"
                  : lang === "ja" ? "1番号あたり最大3つの連絡先"
                  : lang === "zh" ? "每个号码最多 3 个可路由联系人"
                  : lang === "ar" ? "حتى 3 جهات اتصال لكل رقم"
                  : lang === "hi" ? "प्रति नंबर 3 रूट करने योग्य संपर्क"
                  : lang === "pt" ? "Até 3 contatos por número"
                  : lang === "de" ? "Bis zu 3 Kontakte pro Nummer"
                  : lang === "it" ? "Fino a 3 contatti per numero"
                  : lang === "ko" ? "번호당 최대 3개의 연결 연락처"
                  : "3 routable contacts per number",

                  lang === "es" ? "Enrutamiento en cascada (Secuencial)"
                  : lang === "fr" ? "Appel en cascade (séquentiel)"
                  : lang === "ja" ? "順次着信転送 (シーケンシャル)"
                  : lang === "zh" ? "顺次呼叫路由 (顺序联络)"
                  : lang === "ar" ? "توجيه المكالمات بالتتابع"
                  : lang === "hi" ? "कॉल कैस्केड (क्रमिक)"
                  : lang === "pt" ? "Roteamento em cascata (Sequencial)"
                  : lang === "de" ? "Anruf-Kaskade (sequenziell)"
                  : lang === "it" ? "Routing a cascata (Sequenziale)"
                  : lang === "ko" ? "순차적 통화 전환"
                  : "Call Cascade (Sequential)",

                  lang === "es" ? "Alertas por correo electrónico"
                  : lang === "fr" ? "Alertes e-mail en temps réel"
                  : lang === "ja" ? "リアルタイムメール通知"
                  : lang === "zh" ? "实时电子邮件提醒"
                  : lang === "ar" ? "تنبيهات البريد الإلكتروني الفورية"
                  : lang === "hi" ? "वास्तविक समय ईमेल अलर्ट"
                  : lang === "pt" ? "Alertas de e-mail em tempo real"
                  : lang === "de" ? "E-Mail-Benachrichtigungen in Echtzeit"
                  : lang === "it" ? "Avvisi e-mail in tempo reale"
                  : lang === "ko" ? "실시간 이메일 알림"
                  : "Real-time email alerts",

                  lang === "es" ? "Buzón de voz estándar"
                  : lang === "fr" ? "Boîte messagerie standard"
                  : lang === "ja" ? "標準ボイスメールボックス"
                  : lang === "zh" ? "标准语音信箱"
                  : lang === "ar" ? "صندوق بريد صوتي قياسي"
                  : lang === "hi" ? "मानक वॉयस मेल बॉक्स"
                  : lang === "pt" ? "Caixa de correio de voz padrão"
                  : lang === "de" ? "Standard-Mailbox"
                  : lang === "it" ? "Segreteria telefonica standard"
                  : lang === "ko" ? "기본 음성 사물함"
                  : "Standard voicemail box",

                  lang === "es" ? "DASHBOARD de administración"
                  : lang === "fr" ? "Tableau de bord administrateur"
                  : lang === "ja" ? "管理者ダッシュボード"
                  : lang === "zh" ? "管理控制台"
                  : lang === "ar" ? "لوحة تحكم المشرف"
                  : lang === "hi" ? "प्रशासक डैशबोर्ड"
                  : lang === "pt" ? "Painel de administração"
                  : lang === "de" ? "Administrator-Dashboard"
                  : lang === "it" ? "Pannello di controllo amministratore"
                  : lang === "ko" ? "관리자 대시보드"
                  : "Admin dashboard"
                ]).map((f: string) => (
                  <div className="plan-feat" key={f}>
                    <Icon name="check" /> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
                <div className="seg" style={{ padding: 4 }}>
                  <button
                    className={`seg-btn ${account.billingCycle === "monthly" ? "active" : ""}`}
                    onClick={() => {
                      set({ billingCycle: "monthly" });
                      showToast(lang === "es" ? "Cambiado a facturación mensual"
                        : lang === "fr" ? "Facturation mensuelle activée"
                        : lang === "ja" ? "月額プランの請求に切り替えました"
                        : lang === "zh" ? "已切换为按月计费"
                        : lang === "ar" ? "تم التحويل إلى الدفع الشهري"
                        : lang === "hi" ? "मासिक बिलिंग पर स्विच किया गया"
                        : lang === "pt" ? "Alterado para cobrança mensal"
                        : lang === "de" ? "Auf monatliche Abrechnung umgestellt"
                        : lang === "it" ? "Passato alla fatturazione mensile"
                        : lang === "ko" ? "월간 결제로 전환되었습니다"
                        : "Switched to monthly billing");
                    }}
                    style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                  >
                    {lang === "es" ? "Mensual"
                     : lang === "fr" ? "Mensuel"
                     : lang === "ja" ? "月払い"
                     : lang === "zh" ? "按月"
                     : lang === "ar" ? "شهرياً"
                     : lang === "hi" ? "मासिक"
                     : lang === "pt" ? "Mensal"
                     : lang === "de" ? "Monatlich"
                     : lang === "it" ? "Mensile"
                     : lang === "ko" ? "월간"
                     : "Monthly"}
                  </button>
                  <button
                    className={`seg-btn ${account.billingCycle === "yearly" ? "active" : ""}`}
                    onClick={() => {
                      const proceedWithYearlySwitch = () => {
                        set({ billingCycle: "yearly" });
                        showToast(account.plan === "pro" 
                          ? ext.annualToast 
                          : (lang === "es" ? "Cambiado a facturación anual — $149/año"
                           : lang === "fr" ? "Facturation annuelle activée — 149 $/an"
                           : lang === "ja" ? "年額プランに切り替えました — $149/年"
                           : lang === "zh" ? "已切换为按年计费 — $149/年"
                           : lang === "ar" ? "تم التحويل إلى الدفع السنوي — 149$/السنة"
                           : lang === "hi" ? "वार्षिक बिलिंग पर स्विच किया गया — $149/वर्ष"
                           : lang === "pt" ? "Alterado para cobrança anual — $149/ano"
                           : lang === "de" ? "Auf jährliche Abrechnung umgestellt — 149 $/Jahr"
                           : lang === "it" ? "Passato alla fatturazione annuale — 149 $/anno"
                           : lang === "ko" ? "연간 결제로 전환되었습니다 — $149/년"
                           : "Switched to annual billing — $149/yr"));
                      };

                      if (account.billingCycle === "monthly") {
                        annualBillingConfirmCallback.current = proceedWithYearlySwitch;
                        setAnnualBillingConfirmOpen(true);
                      } else {
                        proceedWithYearlySwitch();
                      }
                    }}
                    style={{ 
                      padding: "8px 16px", 
                      fontSize: "0.9rem", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 6 
                    }}
                  >
                    {lang === "es" ? "Anual"
                     : lang === "fr" ? "Annuel"
                     : lang === "ja" ? "年払い"
                     : lang === "zh" ? "按年"
                     : lang === "ar" ? "سنوياً"
                     : lang === "hi" ? "वार्षिक"
                     : lang === "pt" ? "Anual"
                     : lang === "de" ? "Jährlich"
                     : lang === "it" ? "Annuale"
                     : lang === "ko" ? "연간"
                     : "Annual"}
                    <span style={{ 
                      fontSize: "0.72rem", 
                      fontWeight: 700, 
                      background: account.billingCycle === "yearly" ? "rgba(255, 255, 255, 0.25)" : "oklch(0.70 0.13 158 / 0.18)", 
                      color: account.billingCycle === "yearly" ? "#fff" : "oklch(0.42 0.13 158)",
                      padding: "2px 6px",
                      borderRadius: 999
                    }}>
                      {save17Map[lang] || save17Map.en}
                    </span>
                  </button>
                </div>
                <button className="btn btn-ghost" onClick={() => setPlanModalOpen(true)}>
                  <Icon name="spark" /> {ext.changePlan}
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const planMaxIncluded = a.plan === "pro" ? 2 : 1;
            const unusedPlanLines = Math.max(0, planMaxIncluded - lines.length);
            const chargeableNewNumbers = tempExtraNumbers > 0 ? Math.max(0, tempExtraNumbers - unusedPlanLines) : tempExtraNumbers;
            
            const numCost = chargeableNewNumbers * 6.99;
            const minCost = tempMinuteBlocks * 4.99;
            const total = numCost + minCost;
            const maxBlocks = 10;

            const proceedWithSaveAddons = (delta: number, minBlocksToSave: number) => {
              const newExtraNumbers = tempExtraNumbers - (a.addons?.extraNumbers || 0);
              if (delta > 0 || newExtraNumbers > 0 || minBlocksToSave > 0) {
                if (delta > 0) {
                  // Initialize configuration slots for the newly added numbers
                  const initialConfig: AddonNumberSlotConfig[] = Array.from({ length: delta }).map((_, idx) => ({
                    index: idx,
                    areaCode: "470",
                    numbersList: [],
                    selectedNumber: null,
                    isSearching: true,
                  }));
                  setAddedNumbersConfig(initialConfig);
                  initialConfig.forEach((c) => loadAddonNumberSlot(c.index, "470"));
                } else {
                  setAddedNumbersConfig([]);
                }
                setAddonModalOpen(true);
              } else if (delta < 0) {
                // User is removing numbers, must choose which ones to return
                setSelectedLinesToRemove([]);
                setAddonRemovalModalOpen(true);
              } else {
                // Just resetting minutes or no changes at all
                setTempMinuteBlocks(0);
                showToast(ext.addonsUpdatedToast);
              }
            };

            const handleSaveAddons = () => {
              const baseLinesCount = a.plan === "pro" ? 2 : 1;
              const currentExtraLines = Math.max(0, lines.length - baseLinesCount);
              const delta = tempExtraNumbers - currentExtraLines;

              proceedWithSaveAddons(delta, tempMinuteBlocks);
            };

            return (
              <>
                <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addOns}</h2>
                    <p>{d.account.addonsPlansSub}</p>
                  </div>
                </div>
                <div className="card-pad" style={{ paddingTop: 8 }}>
                  <div className="addon">
                    <span className="aic">
                      <Icon name="phone" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{d.account.addonNumbersTitle}</b>
                        <span className="price">{lang === "es" ? "$6.99 / mes c/u" : lang === "fr" ? "6,99 $ / mois chacun" : lang === "ja" ? "各 $6.99 / 月" : lang === "zh" ? "每个 $6.99 / 月" : lang === "ar" ? "$6.99 / شهرياً لكل رقم" : lang === "hi" ? "$6.99 / माह प्रत्येक" : lang === "pt" ? "$6.99 / mês cada" : lang === "de" ? "6,99 $ / Monat pro Nummer" : lang === "it" ? "6,99 $ / mese ciascuno" : lang === "ko" ? "개당 $6.99 / 월" : "$6.99 / mo each"}</span>
                      </div>
                      <p>
                        {d.account.addonNumbersDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="stepper">
                        <button
                          onClick={() => {
                            const val = Math.max(-currentExtraLines, tempExtraNumbers - 1);
                            console.log("Stepper - clicked", { tempExtraNumbers, newVal: val });
                            setTempExtraNumbers(val);
                          }}
                          disabled={tempExtraNumbers === -currentExtraLines}
                          aria-label="Remove one"
                        >
                          −
                        </button>
                        <span className="v">{tempExtraNumbers > 0 ? `+${tempExtraNumbers}` : tempExtraNumbers}</span>
                        <button
                          onClick={() => {
                            const val = Math.min(8 - currentExtraLines, tempExtraNumbers + 1);
                            console.log("Stepper + clicked", { tempExtraNumbers, newVal: val });
                            setTempExtraNumbers(val);
                          }}
                          disabled={tempExtraNumbers === 8 - currentExtraLines}
                          aria-label="Add one"
                        >
                          +
                        </button>
                      </div>
                      <span className="sub">
                        {tempExtraNumbers > 0 
                          ? (numCost > 0 
                            ? `+$${numCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}` 
                            : (lang === "es" ? "Incluido" : lang === "fr" ? "Inclus" : "Included"))
                          : tempExtraNumbers < 0 
                          ? `-$${Math.abs(tempExtraNumbers * 6.99).toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}` 
                          : `$0.00/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}`}
                      </span>

                    </div>
                  </div>

                  <div className="addon">
                    <span className="aic">
                      <Icon name="clock" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{ext.extraMinTitle}</b>
                        <span className="price">{ext.extraMinPrice}</span>
                      </div>
                      <p>
                        {ext.extraMinDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="rangewrap">
                        <input
                          type="range"
                          className="rng"
                          min={0}
                          max={maxBlocks}
                          step={1}
                          value={tempMinuteBlocks}
                          style={{ "--pct": `${(tempMinuteBlocks / maxBlocks) * 100}%` } as React.CSSProperties}
                          onChange={(e) => setTempMinuteBlocks(Number(e.target.value))}
                        />
                      </div>
                      <span className="sub">
                        {tempMinuteBlocks * 30} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"} · {minCost > 0 ? `+$${minCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}` : `$0.00/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}`}
                      </span>
                    </div>
                  </div>

                  <div className="addon-total">
                    <span className="lbl">
                      {lang === "es" ? "Total mensual de complementos" : lang === "fr" ? "Total mensuel des options" : "Add-ons monthly total"}
                    </span>
                    <span className="big">
                      {total < 0 ? `-$${Math.abs(total).toFixed(2)}` : `$${total.toFixed(2)}`}
                      <span> / {lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={handleSaveAddons}>
                      <Icon name="check" /> {ext.saveAddons}
                    </button>
                  </div>
                </div>
              </div>

            </>
          );
        })()}

          {(() => {
            const ad = a.addons || {};
            const planBaseMinutes = a.plan === "pro" ? 60 : 30;
            const addonMinutes = (ad.minuteBlocks || 0) * 30;
            const purchased = planBaseMinutes + addonMinutes;
            const rollover = ad.rolloverMin || 0;
            const total = purchased + rollover;
            const used = Math.min(ad.usedMin || 0, total);
            const remaining = Math.max(0, total - used);
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const low = total > 0 && remaining <= total * 0.15;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addonMinutesTitle}</h2>
                    <p>{ext.addonMinutesDesc}</p>
                  </div>
                  {total > 0 && <Badge kind={low ? "amber" : "green"}>{low ? ext.runningLow : ext.rollsOver}</Badge>}
                </div>
                <div className="card-pad">
                  {total === 0 ? (
                    <div className="mb-empty">
                      <span className="ic">
                        <Icon name="clock" />
                      </span>
                      <div>
                        <b>{ext.noAddonMinYet}</b>
                        <p>
                          {ext.noAddonMinDesc}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-top">
                        <div className="big">
                          {remaining}
                          <span> {ext.minRemaining}</span>
                        </div>
                        <div className="mb-meta">
                          {used} {lang === "es" ? "de" : lang === "fr" ? "sur" : lang === "ja" ? "の" : lang === "zh" ? "共" : lang === "ar" ? "من" : lang === "hi" ? "कुल" : lang === "pt" ? "de" : lang === "de" ? "von" : lang === "it" ? "di" : lang === "ko" ? "중" : "of"} {total} {ext.addonMinUsed} &middot; {lang === "es" ? "renueva el 1 de junio de 2026" : lang === "fr" ? "renouvellement le 1er juin 2026" : lang === "ja" ? "2026年6月1日に更新" : lang === "zh" ? "于 2026年6月1日续期" : lang === "ar" ? "يتجدد في 1 يونيو 2026" : lang === "hi" ? "1 जून, 2026 को नवीनीकृत होगा" : lang === "pt" ? "renova em 1 de junho de 2026" : lang === "de" ? "verlängert sich am 1. Juni 2026" : lang === "it" ? "si rinnova il 1 giugno 2026" : lang === "ko" ? "2026년 6월 1일에 갱신 예정" : "renews June 1, 2026"}
                        </div>
                      </div>
                      <div className="usage-bar bigbar" style={{ marginTop: 14 }}>
                        <i className={low ? "warn" : ""} style={{ width: pct + "%" }} />
                      </div>
                      <div className="mb-stats">
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="plus" />
                          </span>
                          <div>
                            <b>{purchased} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>
                              {ext.thisCycleTopup}
                              {` · ${planBaseMinutes} ${lang === "es" ? "min del plan" : lang === "fr" ? "min du forfait" : lang === "ja" ? "基本プラン分" : lang === "zh" ? "套餐分钟" : lang === "ar" ? "دقيقة الباقة" : lang === "hi" ? "प्लान मिनट" : lang === "pt" ? "min do plano" : lang === "de" ? "Inklusivminuten" : lang === "it" ? "min del piano" : lang === "ko" ? "기본 제공 분" : "plan min"}${ad.minuteBlocks ? ` + ${ad.minuteBlocks} × 30 ${lang === "es" ? "min adicionales" : lang === "fr" ? "min supplémentaires" : lang === "ja" ? "分追加" : lang === "zh" ? "分钟充值" : lang === "ar" ? "دقيقة إضافية" : lang === "hi" ? "अतिरिक्त मिनट" : lang === "pt" ? "min adicionais" : lang === "de" ? "Zusatzminuten" : lang === "it" ? "min aggiuntivi" : lang === "ko" ? "추가 충전 분" : "add-on min"}` : ""}`}
                            </span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="refresh" />
                          </span>
                          <div>
                            <b>{rollover} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.rolledOverFromLast}</span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="phone" />
                          </span>
                          <div>
                            <b>{used} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.usedThisCycle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pooled Minutes Breakdown & Notice */}
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", textAlign: "left" }}>
                        <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: "0 0 10px", color: "var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{lang === "es" ? "Uso por número (Grupo compartido)"
                            : lang === "fr" ? "Usage par numéro (Pool partagé)"
                            : lang === "ja" ? "番号ごとの使用量 (共有プール)"
                            : lang === "zh" ? "按号码使用量 (共享池)"
                            : lang === "ar" ? "الاستخدام حسب الرقم (مجموعة مشتركة)"
                            : lang === "hi" ? "नंबर द्वारा उपयोग (साझा पूल)"
                            : lang === "pt" ? "Uso por número (Pool compartilhado)"
                            : lang === "de" ? "Nutzung nach Nummer (Gemeinsamer Pool)"
                            : lang === "it" ? "Utilizzo per numero (Pool condiviso)"
                            : lang === "ko" ? "번호별 사용량 (공유 풀)"
                            : "Usage by Number (Shared Pool)"}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--blue)", fontWeight: 500 }}>
                            {lang === "es" ? "Pool de Minutos Compartido"
                              : lang === "fr" ? "Minutes partagées"
                              : lang === "ja" ? "共有通話分プール"
                              : lang === "zh" ? "共享分钟数池"
                              : lang === "ar" ? "مجموعة الدقائق المشتركة"
                              : lang === "hi" ? "साझा मिनट पूल"
                              : lang === "pt" ? "Pool de minutos compartilhado"
                              : lang === "de" ? "Gemeinsamer Minuten-Pool"
                              : lang === "it" ? "Pool di minuti condivisi"
                              : lang === "ko" ? "공유 통화 시간 풀"
                              : "Shared Minutes Pool"}
                          </span>
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {lines.map((l) => (
                            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                                <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>{getLocalizedLineLabel(l.label, lang)}</span>
                                <span style={{ color: "var(--ink-faint)", fontSize: "0.78rem" }}>{l.number}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                                {l.minutesUsed || 0}{" "}
                                {lang === "ja" ? "分"
                                 : lang === "zh" ? "分钟"
                                 : lang === "ar" ? "دقيقة"
                                 : lang === "hi" ? "मिनट"
                                 : lang === "ko" ? "분"
                                 : "min"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const planMaxIncluded = a.plan === "pro" ? 2 : 1;
                          const planActive = Math.min(planMaxIncluded, lines.length);
                          const addonActive = Math.max(0, lines.length - planMaxIncluded);
                          
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                                {lang === "es" ? `Plan ${a.plan === "pro" ? "Pro" : "Esencial"}: ${planActive} de ${planMaxIncluded} números de teléfono incluidos activados`
                               : lang === "fr" ? `Forfait ${a.plan === "pro" ? "Pro" : "Essentiel"}: ${planActive} sur ${planMaxIncluded} numéros de téléphone inclus actifs`
                               : lang === "ja" ? `${a.plan === "pro" ? "Pro" : "エッセンシャル"}プラン：含まれている電話番号 ${planActive} / ${planMaxIncluded} 個が有効`
                               : lang === "zh" ? `${a.plan === "pro" ? "专业版" : "基础版"}方案：包含的 ${planMaxIncluded} 个电话号码中已启用 ${planActive} 个`
                               : lang === "ar" ? `باقة ${a.plan === "pro" ? "برو" : "أساسي"}: ${planActive} من أصل ${planMaxIncluded} أرقام هواتف مشمولة نشطة`
                               : lang === "hi" ? `${a.plan === "pro" ? "प्रो" : "एसेनशियल"} प्लान: शामिल ${planMaxIncluded} फ़ोन नंबरों में से ${planActive} सक्रिय हैं`
                               : lang === "pt" ? `Plano ${a.plan === "pro" ? "Pro" : "Essencial"}: ${planActive} de ${planMaxIncluded} número(s) de telefone incluído(s) ativo(s)`
                               : lang === "de" ? `${a.plan === "pro" ? "Pro" : "Essential"}-Tarif: ${planActive} von ${planMaxIncluded} enthaltenen Telefonnummern aktiv`
                               : lang === "it" ? `Piano ${a.plan === "pro" ? "Pro" : "Essenziale"}: ${planActive} di ${planMaxIncluded} numeri di telefono inclusi attivi`
                               : lang === "ko" ? `${a.plan === "pro" ? "Pro" : "에센셜"} 플랜: 포함된 ${planMaxIncluded}개의 전화번호 중 ${planActive}개 활성화됨`
                               : `${a.plan === "pro" ? "Pro" : "Essential"} plan: ${planActive} of ${planMaxIncluded} included phone numbers active`}
                              </div>
                              {addonActive > 0 ? (
                                <div style={{ fontSize: "0.82rem", color: "var(--blue)", fontWeight: 500 }}>
                                  {lang === "es" ? `${addonActive} número(s) de teléfono adicional(es) activo(s) ($${(addonActive * 6.99).toFixed(2)}/mes)`
                                  : lang === "fr" ? `${addonActive} número(s) de téléphone supplémentaire(s) actif(s) ($${(addonActive * 6.99).toFixed(2)}/mois)`
                                  : lang === "ja" ? `${addonActive} 個の追加電話番号が有効 ($${(addonActive * 6.99).toFixed(2)}/月)`
                                  : lang === "zh" ? `${addonActive} 个启用的附加电话号码 (每个 $${(addonActive * 6.99).toFixed(2)}/月)`
                                  : lang === "ar" ? `${addonActive} رقم (أرقام) هاتف إضافي نشط ($${(addonActive * 6.99).toFixed(2)}/شهر)`
                                  : lang === "hi" ? `${addonActive} सक्रिय ऐड-ऑन फ़ोन नंबर ($${(addonActive * 6.99).toFixed(2)}/माह)`
                                  : lang === "pt" ? `${addonActive} número(s) de telefone adicional(is) ativo(s) ($${(addonActive * 6.99).toFixed(2)}/mês)`
                                  : lang === "de" ? `${addonActive} aktive Zusatz-Telefonnummer(n) ($${(addonActive * 6.99).toFixed(2)}/Monat)`
                                  : lang === "it" ? `${addonActive} numero/i di telefono aggiuntivo/i attivo/i ($${(addonActive * 6.99).toFixed(2)}/mese)`
                                  : lang === "ko" ? `${addonActive}개의 활성화된 추가 전화번호 ($${(addonActive * 6.99).toFixed(2)}/월)`
                                  : `${addonActive} active add-on phone number(s) ($${(addonActive * 6.99).toFixed(2)}/mo)`}
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                        <p style={{ fontSize: "0.76rem", color: "var(--ink-faint)", margin: "10px 0 0", lineHeight: "1.4" }}>
                          {lang === "es" ? "Todos los números de esta cuenta comparten el mismo fondo de minutos mensuales e incorporados."
                           : lang === "fr" ? "Tous les numéros de ce compte partagent le même pool de minutes mensuelles et d'options."
                           : lang === "ja" ? "このアカウントのすべての電話番号は、プランの無料通話分と追加の通話分の同じプールを共有します。"
                           : lang === "zh" ? "此账户下的所有电话号码共享同一个套餐分钟数和附加分钟数池。"
                           : lang === "ar" ? "تشترك جميع أرقام الهواتف في هذا الحساب في نفس مجموعة دقائق الباقة والدقائق الإضافية."
                           : lang === "hi" ? "इस खाते के सभी फ़ोन नंबर प्लान मिनटों और ऐड-ऑन मिनटों के समान पूल को साझा करते हैं।"
                           : lang === "pt" ? "Todos os números de telefone desta conta compartilham o mesmo pool de minutos do plano e minutos adicionais."
                           : lang === "de" ? "Alle Telefonnummern dieses Kontos nutzen denselben Pool an Tarifminuten und Zusatzminuten gemeinsam."
                           : lang === "it" ? "Tutti i numeri di telefono su questo account condividono lo stesso pool di minuti del piano e minuti aggiuntivi."
                           : lang === "ko" ? "이 계정의 모든 전화번호는 플랜 통화 분수와 추가 통화 분수의 동일한 풀을 공유합니다."
                           : "All phone numbers on this account share the same pool of plan minutes and add-on minutes."}
                        </p>
                      </div>

                      <p className="mb-note">
                        <Icon name="check" /> {ext.addonMinNote}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.paymentMethod}</h2>
                <p>{ext.chargedOnFirst}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="card-on-file">
                <span className="card-brand">{a.card.brand.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="cnum">•••• •••• •••• {a.card.last4}</div>
                  <div className="cexp">{lang === "es" ? "Vence" : lang === "fr" ? "Expire le" : lang === "ja" ? "有効期限" : lang === "zh" ? "有效期至" : lang === "ar" ? "تنتهي في" : lang === "hi" ? "समाप्ति तिथि" : lang === "pt" ? "Expira em" : lang === "de" ? "Gültig bis" : lang === "it" ? "Scade il" : lang === "ko" ? "만료일" : "Expires"} {a.card.exp}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    showToast(lang === "es" ? "Abriendo el portal de facturación…"
                      : lang === "fr" ? "Ouverture du portail de facturation…"
                      : lang === "ja" ? "請求ポータルを開いています…"
                      : lang === "zh" ? "正在打开账单门户…"
                      : lang === "ar" ? "جاري فتح بوابة الفواتير…"
                      : lang === "hi" ? "बिलिंग पोर्टल खोला जा रहा है…"
                      : lang === "pt" ? "Abrindo portal de faturamento…"
                      : lang === "de" ? "Kundenportal wird geöffnet…"
                      : lang === "it" ? "Apertura del portale di fatturazione…"
                      : lang === "ko" ? "결제 포털을 여는 중…"
                      : "Opening billing portal…");
                    try {
                      const res = await fetch("/api/creem/portal", { method: "POST" });
                      if (!res.ok) {
                        const err = await res.json();
                        showToast(err.error || (lang === "es" ? "No se pudo abrir el portal de facturación."
                          : lang === "fr" ? "Impossible d'ouvrir le portail de facturation."
                          : lang === "ja" ? "請求ポータルを開くことができませんでした。"
                          : lang === "zh" ? "无法打开账单门户。"
                          : lang === "ar" ? "تعذر فتح بوابة الفواتير."
                          : lang === "hi" ? "बिलिंग पोर्टल नहीं खोला जा सका।"
                          : lang === "pt" ? "Não foi possível abrir o portal de faturamento."
                          : lang === "de" ? "Kundenportal konnte nicht geöffnet werden."
                          : lang === "it" ? "Impossibile aprire il portale di fatturazione."
                          : lang === "ko" ? "결제 포털을 열 수 없습니다."
                          : "Could not open billing portal."));
                        return;
                      }
                      const { portalUrl } = await res.json();
                      const w = 560, h = 700;
                      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
                      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
                      window.open(portalUrl, "creem_portal", `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
                    } catch {
                      showToast(lang === "es" ? "No se pudo abrir el portal de facturación."
                        : lang === "fr" ? "Impossible d'ouvrir le portail de facturation."
                        : lang === "ja" ? "請求ポータルを開くことができませんでした。"
                        : lang === "zh" ? "无法打开账单门户。"
                        : lang === "ar" ? "تعذر فتح بوابة الفواتير."
                        : lang === "hi" ? "बिलिंग पोर्टल नहीं खोला जा सका।"
                        : lang === "pt" ? "Não foi possível abrir o portal de faturamento."
                        : lang === "de" ? "Kundenportal konnte nicht geöffnet werden."
                        : lang === "it" ? "Impossibile aprire il portale di fatturazione."
                        : lang === "ko" ? "결제 포털을 열 수 없습니다."
                        : "Could not open billing portal.");
                    }
                  }}
                >
                  <Icon name="card" /> {ext.updateCard}
                </button>
              </div>
              <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
                <label>{d.account.billingAddress}</label>
                <input value={a.billingAddr} onChange={(e) => set({ billingAddr: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                  <Icon name="check" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{ext.billingHistory}</h2>
                <p>{lang === "es" ? "Visa terminada en" : lang === "fr" ? "Visa se terminant par" : lang === "ja" ? "末尾が" : lang === "zh" ? "末尾为" : lang === "ar" ? "بطاقة Visa التي تنتهي بـ" : lang === "hi" ? "वीजा अंत" : lang === "pt" ? "Visa terminando em" : lang === "de" ? "Visa mit der Endung" : lang === "it" ? "Visa che termina con" : lang === "ko" ? "끝자리" : "Visa ending"} {a.card.last4}{lang === "ja" ? "のVisa" : lang === "ko" ? "인 Visa" : ""}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                [lang === "es" ? "1 de mayo de 2026" : lang === "fr" ? "1 mai 2026" : lang === "ja" ? "2026年5月1日" : lang === "zh" ? "2026年5月1日" : lang === "ar" ? "1 مايو 2026" : lang === "hi" ? "1 मई, 2026" : lang === "pt" ? "1 de maio de 2026" : lang === "de" ? "1. Mai 2026" : lang === "it" ? "1 maggio 2026" : lang === "ko" ? "2026년 5월 1일" : "May 1, 2026", "Pro · monthly", "$24.99"],
                [lang === "es" ? "1 de abr de 2026" : lang === "fr" ? "1 avr. 2026" : lang === "ja" ? "2026年4月1日" : lang === "zh" ? "2026年4月1日" : lang === "ar" ? "1 أبريل 2026" : lang === "hi" ? "1 अप्रैल, 2026" : lang === "pt" ? "1 de abr de 2026" : lang === "de" ? "1. Apr. 2026" : lang === "it" ? "1 aprile 2026" : lang === "ko" ? "2026년 4월 1일" : "Apr 1, 2026", "Pro · monthly", "$24.99"],
                [lang === "es" ? "1 de mar de 2026" : lang === "fr" ? "1 mars 2026" : lang === "ja" ? "2026年3月1日" : lang === "zh" ? "2026年3月1日" : lang === "ar" ? "1 مارس 2026" : lang === "hi" ? "1 मार्च, 2026" : lang === "pt" ? "1 de mar de 2026" : lang === "de" ? "1. März 2026" : lang === "it" ? "1 marzo 2026" : lang === "ko" ? "2026년 3월 1일" : "Mar 1, 2026", "Pro · monthly", "$24.99"],
              ].map(([dVal, desc, amt]) => {
                const localizedDesc = desc === "Pro · monthly" ? (lang === "es" ? "Pro · mensual" : lang === "fr" ? "Pro · mensuel" : lang === "ja" ? "プロ · 月額" : lang === "zh" ? "专业版 · 按月" : lang === "ar" ? "برو · شهرياً" : lang === "hi" ? "प्रो · मासिक" : lang === "pt" ? "Pro · mensal" : lang === "de" ? "Pro · monatlich" : lang === "it" ? "Pro · mensile" : lang === "ko" ? "프로 · 월간" : "Pro · monthly") : desc;
                return (
                  <div className="invoice" key={dVal}>
                    <div className="l">
                      <b>{dVal}</b>
                      <span>{localizedDesc}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span className="amt">{amt}</span>
                      <a
                        className="btn btn-soft btn-sm"
                        href={`/api/caregiver/receipt?date=${encodeURIComponent(dVal)}&desc=${encodeURIComponent(localizedDesc)}&amount=${encodeURIComponent(amt)}&last4=${encodeURIComponent(a.card.last4)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                      >
                        <Icon name="download" /> {ext.receipt}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head">
              <div>
                <h2>{ext.cancelSubscription}</h2>
                <p>{ext.cancelSubscriptionDesc}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <button
                className="btn btn-danger-ghost"
                onClick={() => showToast(ext.cancelToast)}
              >
                {ext.cancelPro}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ MAIN APPLICATION SHELL ============ */
const NAV = [
  {
    group: "Manage",
    items: [
      { id: "overview", label: "Overview", icon: "overview" as keyof typeof ICONS },
      { id: "contacts", label: "Contacts", icon: "contacts" as keyof typeof ICONS },
      { id: "routing", label: "Routing", icon: "routing" as keyof typeof ICONS },
    ],
  },
  {
    group: "Activity",
    items: [{ id: "log", label: "Call log", icon: "log" as keyof typeof ICONS, badge: true }],
  },
  {
    group: "Settings",
    items: [
      { id: "settings", label: "Greetings & alerts", icon: "settings" as keyof typeof ICONS },
      { id: "account", label: "Account & billing", icon: "user" as keyof typeof ICONS },
    ],
  },
];

const TITLES = {
  overview: ["Overview", "Welcome back, Maria"],
  contacts: ["Contacts", "Manage who can be reached"],
  routing: ["Routing", "Choose how callers connect"],
  log: ["Call log", "Every call, including missed attempts"],
  settings: ["Greetings & alerts", "Greeting and notification settings"],
  account: ["Account", "Profile, security and billing"],
};

const LINE_SCOPED = {
  overview: false,
  contacts: true,
  routing: true,
  log: true,
  settings: true,
  account: false,
};

const SEED_CONTACT_DATA = [
  { first: "John", rel: "Son" },
  { first: "Sarah", rel: "Daughter" },
  { first: "Michael", rel: "Brother" },
  { first: "Emma", rel: "Sister" },
  { first: "David", rel: "Caregiver" },
  { first: "Dr. Amanda Chen", rel: "Primary Physician" },
  { first: "Neighbor Mark", rel: "Neighbor" },
  { first: "Elena", rel: "Niece" },
  { first: "Thomas", rel: "Nephew" },
];

interface StoredLineData {
  label: string;
  person: string;
  number: string;
  mode?: Line["mode"];
  minutesUsed?: number;
  contacts?: number | Contact[];
}

interface StoredAccountData {
  owner?: string;
  name?: string;
  area?: string;
  lines?: StoredLineData[];
}

interface ProfileSettings {
  role?: string;
  notifyEmail?: string;
  phone?: string;
  smsPhone?: string;
  address?: string;
  billingAddr?: string;
  timezone?: string;
  language?: string;
  twoFactor?: boolean;
  card?: Account["card"];
  plan?: Account["plan"];
  billingCycle?: Account["billingCycle"];
  addons?: Account["addons"];
  avatarUrl?: string;
}

interface ProfileRow {
  name?: string;
  preferred_name?: string;
  email?: string;
  settings?: ProfileSettings;
}

interface DbLineRow {
  id: string;
  number: string;
  name: string;
  type: string;
  contacts?: Contact[];
  settings?: {
    color?: string;
    mode?: Line["mode"];
    minutesUsed?: number;
    schedule?: CoverageSlot[];
    extraSettings?: Line["settings"];
  };
}

function generateDynamicLines(accountData: StoredAccountData | null): Line[] {
  if (!accountData || !accountData.lines) return [];
  const ownerName = accountData.owner || accountData.name || "";
  const ownerLastName = ownerName ? (ownerName.split(" ").slice(-1)[0] || "") : "";
  const areaCode = accountData.area || "415";

  return accountData.lines.map((ln, idx) => {
    const slug = ln.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const count = typeof ln.contacts === "number" ? ln.contacts : 3;

    const contacts: Contact[] = Array.from({ length: count }).map((_, cIdx) => {
      const seed = SEED_CONTACT_DATA[cIdx % SEED_CONTACT_DATA.length];
      const name = seed.rel === "Son" || seed.rel === "Daughter" || seed.rel === "Brother" || seed.rel === "Sister" || seed.rel === "Niece" || seed.rel === "Nephew"
        ? `${seed.first} ${ownerLastName}`
        : seed.first;
      const indexStr = String(cIdx + 10).slice(-2);
      return {
        id: `c-${slug}-${cIdx}`,
        name,
        rel: seed.rel,
        phone: `(${areaCode}) 555-01${indexStr}`,
        color: AVATAR_COLORS[cIdx % AVATAR_COLORS.length],
        available: cIdx !== 2,
      };
    });

    return {
      id: slug,
      label: ln.label,
      person: ln.person,
      number: ln.number,
      color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      mode: ln.mode || "cascade",
      minutesUsed: ln.minutesUsed || 0,
      contacts,
    };
  });
}

function generateDynamicLogs(linesList: Line[]): Record<string, CallLogEntry[]> {
  const result: Record<string, CallLogEntry[]> = {};
  const statusOptions: Array<"connected" | "missed" | "voicemail"> = ["connected", "connected", "voicemail", "missed"];
  const callerNames = ["Grandkid Leo", "Sunrise Pharmacy", "Utility Dept", "Dr. Anita Patel", "Mom (Eleanor)"];

  linesList.forEach((ln) => {
    const contacts = ln.contacts;
    const logs: CallLogEntry[] = Array.from({ length: 5 }).map((_, lIdx) => {
      const status = statusOptions[lIdx % statusOptions.length];
      const contact = contacts[lIdx % contacts.length];
      const caller = contact ? `${contact.name} (mobile)` : callerNames[lIdx % callerNames.length];
      const when = lIdx === 0 ? "Today · 2:48 PM" : lIdx === 1 ? "Today · 11:02 AM" : lIdx === 2 ? "Yesterday · 7:14 PM" : lIdx === 3 ? "Yesterday · 9:30 AM" : "Mon · 3:20 PM";
      return {
        id: lIdx + 1,
        status,
        caller,
        routed: status === "connected" ? (contact ? contact.name : ln.label) : "No one available",
        rel: status === "connected" ? (contact ? contact.rel : "Carrier") : "Voicemail left",
        dur: status === "connected" ? `${lIdx + 2}:${(lIdx * 12).toString().padStart(2, "0")}` : "—",
        when,
      };
    });
    result[ln.id] = logs;
  });

  return result;
}

export default function DashboardApp() {
  const [lines, setLines] = useState<Line[]>([
    {
      id: "mom",
      label: "Eleanor's line",
      person: "Eleanor Delgado · Mom",
      number: "(415) 555-0142",
      color: "oklch(0.6 0.14 350)",
      mode: "menu",
      minutesUsed: 38,
      contacts: [
        {
          id: "c1",
          name: "Maria Delgado",
          rel: "Daughter",
          phone: "(415) 555-0192",
          color: AVATAR_COLORS[0],
          available: true,
        },
        {
          id: "c2",
          name: "James Delgado",
          rel: "Son",
          phone: "(510) 555-0177",
          color: AVATAR_COLORS[1],
          available: true,
        },
        {
          id: "c3",
          name: "Dr. Anita Patel",
          rel: "Primary physician",
          phone: "(415) 555-0240",
          color: AVATAR_COLORS[2],
          available: false,
        },
        {
          id: "c4",
          name: "Sunrise Home Care",
          rel: "Daytime caregiver",
          phone: "(415) 555-0311",
          color: AVATAR_COLORS[3],
          available: true,
        },
        {
          id: "c5",
          name: "Lena Novak",
          rel: "Neighbor",
          phone: "(415) 555-0156",
          color: AVATAR_COLORS[4],
          available: true,
        },
      ],
    },
    {
      id: "dad",
      label: "Robert's line",
      person: "Robert Hale · Dad",
      number: "(415) 555-0188",
      color: "oklch(0.58 0.115 232)",
      mode: "cascade",
      minutesUsed: 11,
      contacts: [
        {
          id: "d1",
          name: "Maria Delgado",
          rel: "Daughter",
          phone: "(415) 555-0192",
          color: AVATAR_COLORS[0],
          available: true,
        },
        {
          id: "d2",
          name: "Carla Hale",
          rel: "Sister",
          phone: "(206) 555-0133",
          color: AVATAR_COLORS[5],
          available: true,
        },
        {
          id: "d3",
          name: "Dr. Sam Okafor",
          rel: "Cardiologist",
          phone: "(415) 555-0299",
          color: AVATAR_COLORS[2],
          available: true,
        },
      ],
    },
  ]);

  const [activeLineId, setActiveLineId] = useState("mom");
  const [log, setLog] = useState<Record<string, CallLogEntry[]>>({
    mom: [
      {
        id: 1,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "4:12",
        when: "Today · 2:48 PM",
      },
      {
        id: 2,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Sunrise Home Care",
        rel: "Daytime caregiver",
        dur: "1:05",
        when: "Today · 9:30 AM",
      },
      {
        id: 3,
        status: "voicemail",
        caller: "Unknown",
        routed: "No one available",
        rel: "Voicemail left",
        dur: "0:38",
        when: "Yesterday · 7:14 PM",
      },
      {
        id: 4,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "James Delgado",
        rel: "Son",
        dur: "6:51",
        when: "Yesterday · 11:02 AM",
      },
      {
        id: 5,
        status: "missed",
        caller: "Eleanor (mobile)",
        routed: "Dr. Anita Patel",
        rel: "Primary physician",
        dur: "—",
        when: "Mon · 3:20 PM",
      },
      {
        id: 6,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "2:44",
        when: "Mon · 8:55 AM",
      },
      {
        id: 7,
        status: "connected",
        caller: "Lena Novak",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "3:30",
        when: "Sun · 5:41 PM",
      },
    ],
    dad: [
      {
        id: 1,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "5:20",
        when: "Today · 1:12 PM",
      },
      {
        id: 2,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Dr. Sam Okafor",
        rel: "Cardiologist",
        dur: "2:08",
        when: "Yesterday · 10:30 AM",
      },
      {
        id: 3,
        status: "missed",
        caller: "Robert (mobile)",
        routed: "Carla Hale",
        rel: "Sister",
        dur: "—",
        when: "Wed · 6:02 PM",
      },
      {
        id: 4,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "1:47",
        when: "Tue · 9:18 AM",
      },
    ],
  });

  const [view, setView] = useState("overview");
  const [activeVoicemail, setActiveVoicemail] = useState<{
    recordingUrl: string;
    transcription: string;
    caller: string;
    duration: string;
  } | null>(null);

  const [impersonatingUser, setImpersonatingUser] = useState<{ email: string; name: string } | null>(null);
  const [acctTab, setAcctTab] = useState("profile");
  const [autoOpenPlanModal, setAutoOpenPlanModal] = useState(false);
  const [account, setAccount] = useState<Account>({
    name: "Maria Delgado",
    preferred: "Maria",
    role: "Primary caregiver",
    email: "maria.delgado@email.com",
    notifyEmail: "maria.delgado@email.com",
    phone: "(415) 555-0192",
    address: "482 Linden Ave, Oakland, CA 94607",
    timezone: "Pacific (PT)",
    language: "English",
    twoFactor: true,
    card: { brand: "Visa", last4: "4242", exp: "08 / 27" },
    billingAddr: "482 Linden Ave, Oakland, CA 94607",
    plan: "pro",
    billingCycle: "monthly",
    addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 41, rolloverMin: 18 },
    avatarUrl: "",
  });

  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");

  // 1. Loading and Syncing States
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // Only allow syncing back to the server after server data actually loaded;
  // otherwise a failed load would push the hardcoded placeholder account/lines
  // over the user's real data (the lines POST also deletes unlisted rows).
  const serverDataLoadedRef = useRef(false);

  // 2. Client-side profile to account mapping
  const mapProfileToAccount = (profile: ProfileRow): Account => {
    const settings = profile.settings || {};
    return {
      name: profile.name || "",
      preferred: profile.preferred_name || "",
      role: settings.role || "Primary caregiver",
      email: profile.email || "",
      notifyEmail: settings.notifyEmail || profile.email || "",
      phone: settings.phone || settings.smsPhone || "",
      address: settings.address || settings.billingAddr || "",
      timezone: settings.timezone || "Pacific (PT)",
      language: settings.language || "English",
      twoFactor: !!settings.twoFactor,
      card: settings.card || { brand: "Visa", last4: "4242", exp: "08 / 27" },
      billingAddr: settings.billingAddr || "",
      plan: settings.plan || "pro",
      billingCycle: settings.billingCycle || "monthly",
      addons: settings.addons || { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
      avatarUrl: settings.avatarUrl || "",
    };
  };

  const mapAccountToProfile = (account: Account) => {
    return {
      name: account.name,
      preferred_name: account.preferred,
      settings: {
        role: account.role,
        notifyEmail: account.notifyEmail,
        phone: account.phone,
        smsPhone: account.phone,
        address: account.address,
        timezone: account.timezone,
        language: account.language,
        twoFactor: account.twoFactor,
        card: account.card,
        billingAddr: account.billingAddr,
        plan: account.plan,
        billingCycle: account.billingCycle,
        addons: account.addons,
        avatarUrl: account.avatarUrl || ""
      }
    };
  };

  const mapDbLinesToFrontend = (dbLines: DbLineRow[]): Line[] => {
    return dbLines.map((row) => {
      const s = row.settings || {};
      return {
        id: row.id,
        number: row.number,
        label: row.name,
        person: row.type,
        contacts: row.contacts || [],
        color: s.color || "oklch(0.58 0.115 232)",
        mode: s.mode || "menu",
        minutesUsed: s.minutesUsed || 0,
        schedule: s.schedule || [],
        settings: s.extraSettings || {},
      };
    });
  };

  // Header Add-on configuration states
  const [headerAddonModalOpen, setHeaderAddonModalOpen] = useState(false);
  const [headerAreaCode, setHeaderAreaCode] = useState("470");
  const [headerNumbersList, setHeaderNumbersList] = useState<PickerNumber[]>([]);
  const [headerSelectedNumber, setHeaderSelectedNumber] = useState<PickerNumber | null>(null);
  const [headerIsSearching, setHeaderIsSearching] = useState(false);

  const loadHeaderNumbers = (ac: string) => {
    setHeaderIsSearching(true);
    fetchNumbersLive(ac, 6).then((nums) => {
      setHeaderNumbersList(nums);
      setHeaderIsSearching(false);
    });
  };

  const [headerRemovalLine, setHeaderRemovalLine] = useState<Line | null>(null);

  // 3. Load profile and phone lines from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch("/api/caregiver/profile");
        if (profileRes.status === 401) {
          localStorage.removeItem("isLoggedIn");
          window.location.href = "/login?unauthorized=true";
          return;
        }
        if (!profileRes.ok) throw new Error("profile_fetch_failed");
        const profileData = await profileRes.json();

        const linesRes = await fetch("/api/caregiver/lines");
        if (linesRes.status === 401) {
          localStorage.removeItem("isLoggedIn");
          window.location.href = "/login?unauthorized=true";
          return;
        }
        if (!linesRes.ok) throw new Error("lines_fetch_failed");
        const linesData = await linesRes.json();

        const currentAccount = profileData.profile ? mapProfileToAccount(profileData.profile) : null;
        if (currentAccount) {
          setAccount(currentAccount);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("ic_account_data", JSON.stringify(currentAccount));
        }

        if (Array.isArray(linesData.lines)) {
          const mappedLines = mapDbLinesToFrontend(linesData.lines);
          setLines(mappedLines);
          localStorage.setItem("ic_lines_data", JSON.stringify(mappedLines));
          if (mappedLines[0]) {
            setActiveLineId(mappedLines[0].id);
          }

          // Auto-heal extraNumbers out-of-sync states on load
          if (currentAccount) {
            const baseLinesLimit = currentAccount.plan === "pro" ? 2 : 1;
            const correctExtraNumbers = Math.max(0, mappedLines.length - baseLinesLimit);
            if (currentAccount.addons && currentAccount.addons.extraNumbers !== correctExtraNumbers) {
              console.log(`[Auto-heal] Correcting extraNumbers from ${currentAccount.addons.extraNumbers} to ${correctExtraNumbers}`);
              currentAccount.addons.extraNumbers = correctExtraNumbers;
              setAccount({ ...currentAccount });
              localStorage.setItem("ic_account_data", JSON.stringify(currentAccount));
            }
          }
        }

        serverDataLoadedRef.current = true;
      } catch (err) {
        console.error("Error loading dashboard data, falling back to localStorage:", err);
        const cachedAcc = localStorage.getItem("ic_account_data");
        const cachedLines = localStorage.getItem("ic_lines_data");
        if (cachedAcc) {
          try {
            setAccount(JSON.parse(cachedAcc));
          } catch {}
        }
        if (cachedLines) {
          try {
            const parsedLines = JSON.parse(cachedLines);
            setLines(parsedLines);
            if (parsedLines[0]) {
              setActiveLineId(parsedLines[0].id);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }
    loadData();
  }, []);

  // 4. Synchronize profile/account updates to Supabase
  useEffect(() => {
    if (!initialLoadComplete || !serverDataLoadedRef.current) return;
    const imp = localStorage.getItem("impersonatingUser");
    if (imp) return; // Skip updating real user database if impersonating

    async function syncProfile() {
      try {
        await fetch("/api/caregiver/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapAccountToProfile(account)),
        });
      } catch (err) {
        console.error("Error syncing profile to backend:", err);
      }
    }
    syncProfile();
  }, [account, initialLoadComplete]);

  // 5. Synchronize lines updates to Supabase
  useEffect(() => {
    if (!initialLoadComplete || !serverDataLoadedRef.current) return;
    const imp = localStorage.getItem("impersonatingUser");
    if (imp) return; // Skip updating real user database if impersonating

    async function syncLines() {
      try {
        await fetch("/api/caregiver/lines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines }),
        });
      } catch (err) {
        console.error("Error syncing phone lines to backend:", err);
      }
    }
    syncLines();
  }, [lines, initialLoadComplete]);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
    if (savedLang && validLangs.includes(savedLang)) {
      setLang(savedLang as typeof lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const syncLang = () => {
      const savedLang = localStorage.getItem("lang");
      const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
      if (savedLang && validLangs.includes(savedLang)) {
        setLang(savedLang as typeof lang);
      }
    };
    window.addEventListener("storage", syncLang);
    return () => window.removeEventListener("storage", syncLang);
  }, []);

  const changeLanguage = (newLang: "en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const d = dashboardTranslations[lang];

  const NAV = [
    {
      group: d.nav.manage,
      items: [
        { id: "overview", label: d.nav.overview, icon: "overview" as keyof typeof ICONS },
        { id: "contacts", label: d.nav.contacts, icon: "contacts" as keyof typeof ICONS },
        { id: "routing", label: d.nav.routing, icon: "routing" as keyof typeof ICONS },
      ],
    },
    {
      group: d.nav.activity,
      items: [{ id: "log", label: d.nav.log, icon: "log" as keyof typeof ICONS, badge: true }],
    },
    {
      group: d.nav.configure,
      items: [
        { id: "settings", label: d.nav.settings, icon: "settings" as keyof typeof ICONS },
        { id: "account", label: d.nav.account, icon: "user" as keyof typeof ICONS },
      ],
    },
  ];

  const TITLES = {
    overview: [d.titles.overview, `${d.titles.overviewSub}, ${account.preferred}`],
    contacts: [d.titles.contacts, d.titles.contactsSub],
    routing: [d.titles.routing, d.titles.routingSub],
    log: [d.titles.log, d.titles.logSub],
    settings: [d.titles.settings, d.titles.settingsSub],
    account: [d.titles.account, d.titles.accountSub],
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if session is impersonated
      const imp = localStorage.getItem("impersonatingUser");
      if (imp) {
        try {
          const userObj = JSON.parse(imp);
          const ownerName = userObj.owner || userObj.name || "Test User";
          const ownerEmail = userObj.email || "";
          setImpersonatingUser({ name: ownerName, email: ownerEmail });

          const rawCycle = userObj.billing || userObj.billingCycle || "monthly";
          const mappedCycle = rawCycle === "annual" ? "yearly" : (rawCycle === "yearly" ? "yearly" : "monthly");

          setAccount((prev) => ({
            ...prev,
            name: ownerName,
            preferred: ownerName.split(" ")[0] || ownerName,
            email: ownerEmail,
            notifyEmail: ownerEmail,
            plan: userObj.plan || prev.plan,
            billingCycle: mappedCycle,
          }));

          if (userObj.lines && userObj.lines.length > 0) {
            const generatedLines = generateDynamicLines(userObj);
            setLines(generatedLines);
            if (generatedLines[0]) {
              setActiveLineId(generatedLines[0].id);
            }
            const generatedLogs = generateDynamicLogs(generatedLines);
            setLog(generatedLogs);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const recordingUrl = params.get("recordingUrl");
      const transcription = params.get("transcription");
      const caller = params.get("caller");
      const duration = params.get("duration");

      if (viewParam) {
        setView(viewParam);
      }
      if (recordingUrl) {
        setActiveVoicemail({
          recordingUrl,
          transcription: transcription || "No transcript available.",
          caller: caller || "Unknown Caller",
          duration: duration || "0:30",
        });
      }
    }
  }, []);

  const handleStopImpersonating = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("impersonatingUser");
      if (localStorage.getItem("isAdminLoggedIn") === "true") {
        window.location.href = "/super-admin";
      } else {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
      }
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const line = lines.find((l) => l.id === activeLineId) || lines[0];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const missedCount = (log[activeLineId] || []).filter((c) => c.status !== "connected").length;
  const go = (v: string) => {
    setView(v);
    setSideOpen(false);
  };

  const signOut = () => {
    showToast("Signing out…");
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("impersonatingUser");
    }
    // Clear the HTTP-only session cookie server-side so the next visit
    // requires a fresh login instead of silently reusing the old session
    const clearSession = fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setTimeout(() => {
      clearSession.finally(() => {
        window.location.href = "/";
      });
    }, 750);
  };

  const [t1, t2] = TITLES[view as keyof typeof TITLES] || ["Dashboard", "iCanCall Routing Panel"];

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "oklch(0.975 0.008 220)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", width: "36px", height: "36px", borderRadius: "50%", borderLeftColor: "#4083ae", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ color: "oklch(0.4 0.02 240)", fontSize: "0.95rem", fontWeight: 500 }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {impersonatingUser && (
        <div style={{ background: "oklch(0.35 0.08 28)", color: "#fff", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.88rem", zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flex: "none" }}>
          <div>
            Impersonation Mode: Active session for <strong>{impersonatingUser.name}</strong> ({impersonatingUser.email})
          </div>
          <button 
            onClick={handleStopImpersonating}
            className="btn btn-sm"
            style={{ 
              background: "oklch(0.58 0.115 232)", 
              color: "#fff",
              fontSize: "0.78rem", 
              padding: "5px 12px", 
              boxShadow: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "6px",
              fontWeight: 600
            }}
          >
            Exit Impersonation
          </button>
        </div>
      )}
      <div className="dash" style={{ flex: 1 }}>
      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <div className="brand" style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <svg
            id="logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 553.0305"
            style={{ width: "34px", height: "auto", display: "block", flexShrink: 0 }}
          >
            <style>{`
              #logo .cls-1 { fill: #ffffff; }
              #logo .cls-2 { fill: #a8e2ff; }
              #logo .cls-3 { fill: #ffffff; }
            `}</style>
            <g>
              <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
              <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
            </g>
            <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
          </svg>
          <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>iCanCall</span>
        </div>

        {NAV.map((grp) => (
          <React.Fragment key={grp.group}>
            <div className="nav-group-label">{grp.group}</div>
            <div className="nav">
              {grp.items.map((it) => (
                <button
                  key={it.id}
                  className={`nav-item ${view === it.id ? "active" : ""}`}
                  onClick={() => go(it.id)}
                >
                  <Icon name={it.icon} />
                  {it.label}
                  {"badge" in it && missedCount > 0 && <span className="badge-dot">{missedCount}</span>}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}

        <div className="sidebar-foot">
          <div className="plan-card">
            <div className="row">
              <span className="pill">
                {account.plan === "pro"
                  ? (lang === "es" ? "PLAN PRO"
                   : lang === "fr" ? "FORFAIT PRO"
                   : lang === "ja" ? "プロプラン"
                   : lang === "zh" ? "专业版方案"
                   : lang === "ar" ? "باقة برو"
                   : lang === "hi" ? "प्रो प्लान"
                   : lang === "pt" ? "PLANO PRO"
                   : lang === "de" ? "PRO-TARIF"
                   : lang === "it" ? "PIANO PRO"
                   : lang === "ko" ? "프로 플랜"
                   : "PRO PLAN")
                  : (lang === "es" ? "PLAN ESENCIAL"
                   : lang === "fr" ? "FORFAIT ESSENTIEL"
                   : lang === "ja" ? "エッセンシャルプラン"
                   : lang === "zh" ? "基础版方案"
                   : lang === "ar" ? "الباقة الأساسية"
                   : lang === "hi" ? "एसेनशियल प्लान"
                   : lang === "pt" ? "PLANO ESSENCIAL"
                   : lang === "de" ? "ESSENTIAL-TARIF"
                   : lang === "it" ? "PIANO ESSENZIALE"
                   : lang === "ko" ? "에센셜 플랜"
                   : "ESSENTIAL PLAN")}
              </span>
              <span style={{ fontSize: "0.78rem", color: "oklch(0.82 0.02 225)" }}>
                {lines.length}/{account.plan === "pro" ? 2 + (account.addons?.extraNumbers || 0) : 1 + (account.addons?.extraNumbers || 0)} {d.common.numbers}
              </span>
            </div>
            <button
              className="upgrade"
              onClick={() => {
                setAcctTab("billing");
                go("account");
              }}
            >
              {d.common.managePlan}
            </button>
          </div>
          <button className="signout-row" onClick={signOut}>
            <Icon name="logout" style={{ width: 18, height: 18 }} /> {d.common.signOut}
          </button>
        </div>
      </aside>

      <div className={`scrim ${sideOpen ? "show" : ""}`} onClick={() => setSideOpen(false)}></div>

      <div className="main">
        <div className="topbar">
          <button
            className="iconbtn menu-btn"
            onClick={() => setSideOpen(true)}
            aria-label="Menu"
          >
            <Icon name="menu" />
          </button>
          <div className="page-title">
            <h1>{t1}</h1>
            <p>{LINE_SCOPED[view as keyof typeof LINE_SCOPED] ? getLocalizedLineLabel(line.label, lang) + " · " + getLocalizedPersonName(line.person, lang) : t2}</p>
          </div>
          <div className="topbar-spacer"></div>

          <select
            value={lang}
            onChange={(e) => changeLanguage(e.target.value as typeof lang)}
            className="lang-select"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--ink-soft)',
              padding: '6px 10px',
              borderRadius: '20px',
              fontSize: '0.86rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font)',
              marginRight: 12
            }}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="ja">🇯🇵 JA</option>
            <option value="zh">🇨🇳 ZH</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="hi">🇮🇳 HI</option>
            <option value="pt">🇵🇹 PT</option>
            <option value="de">🇩🇪 DE</option>
            <option value="it">🇮🇹 IT</option>
            <option value="ko">🇰🇷 KO</option>
          </select>

          {/* number switcher */}
          <div className={`numswitch ${switchOpen ? "open" : ""}`}>
            <button className="numswitch-btn" onClick={() => setSwitchOpen((o) => !o)}>
              <span className="ava" style={{ background: line.color }}>
                {initials(getLocalizedPersonName(line.person, lang))}
              </span>
              <span className="meta">
                <b>{getLocalizedLineLabel(line.label, lang)}</b>
                <span>{line.number}</span>
              </span>
              <span className="chev">
                <Icon name="chev" style={{ width: 16, height: 16 }} />
              </span>
            </button>
            {switchOpen && (
              <div className="numswitch-menu">
                 {lines.map((l, index) => (
                  <div
                    key={l.id}
                    className={`numswitch-opt ${l.id === activeLineId ? "sel" : ""}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}
                      onClick={() => {
                        setActiveLineId(l.id);
                        setSwitchOpen(false);
                      }}
                    >
                      <span className="ava" style={{ background: l.color }}>
                        {initials(getLocalizedPersonName(l.person, lang))}
                      </span>
                      <span className="meta">
                        <b>{getLocalizedLineLabel(l.label, lang)}</b>
                        <span>{l.number}</span>
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {l.id === activeLineId && (
                        <span className="tick">
                          <Icon name="check" style={{ width: 17, height: 17 }} />
                        </span>
                      )}
                      {index >= (account.plan === "pro" ? 2 : 1) && (
                        <button
                          className="btn-trash"
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "oklch(0.6 0.18 22)", padding: 4, display: "flex", alignItems: "center" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeaderRemovalLine(l);
                          }}
                          title="Delete Number"
                        >
                          <Icon name="trash" style={{ width: 15, height: 15 }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="add-num"
                  onClick={() => {
                    setSwitchOpen(false);
                    if (account.plan === "pro") {
                      loadHeaderNumbers(headerAreaCode);
                      setHeaderSelectedNumber(null);
                      setHeaderAddonModalOpen(true);
                    } else {
                      showToast(d.common.addNumberTip);
                    }
                  }}
                >
                  <Icon name="plus" style={{ width: 16, height: 16 }} /> {d.common.addAnotherNumber}
                </button>
              </div>
            )}
          </div>

          <button className="iconbtn" onClick={() => go("log")} aria-label="Notifications">
            <Icon name="bell" />
            {missedCount > 0 && <span className="dot"></span>}
          </button>
          <div className="user-chip clickable" onClick={() => go("account")}>
            <span className="ava" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
              ) : (
                initials(account.name)
              )}
            </span>
            <span className="who">
              <b>{account.name}</b>
              <span>{d.common.accountOwner}</span>
            </span>
          </div>
          <button
            className="iconbtn signout-btn"
            onClick={signOut}
            aria-label={d.common.signOut}
            title={d.common.signOut}
          >
            <Icon name="logout" />
          </button>
        </div>

        <div className="content">
          {activeVoicemail && (
            <div className="card" style={{ border: '2px solid oklch(0.60 0.13 220)', background: 'oklch(0.96 0.03 220 / 0.3)', marginBottom: 24 }}>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'oklch(0.45 0.16 220)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voicemail Player</span>
                    <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0 0', color: 'var(--ink)' }}>From: {activeVoicemail.caller} &bull; Duration: {activeVoicemail.duration}</h2>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveVoicemail(null)}>Close Player</button>
                </div>
                
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                  <p style={{ fontStyle: 'italic', margin: 0, color: 'var(--ink)', fontSize: '0.92rem', lineHeight: 1.5 }}>&ldquo;{activeVoicemail.transcription}&rdquo;</p>
                </div>

                <div>
                  <audio controls src={activeVoicemail.recordingUrl} style={{ width: '100%', height: 40 }} autoPlay>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          )}
          {view === "overview" && (
            <OverviewView
              lines={lines}
              log={log}
              line={line}
              setView={go}
              setActiveLineId={setActiveLineId}
              d={d}
              lang={lang}
            />
          )}
          {view === "contacts" && (
            <ContactsView line={line} setLine={setLines} showToast={showToast} d={d} lang={lang} plan={account.plan} />
          )}
          {view === "routing" && (
            <RoutingView
              line={line}
              setLine={setLines}
              showToast={showToast}
              d={d}
              lang={lang}
              plan={account.plan}
              setView={go}
              setAcctTab={setAcctTab}
              setAutoOpenPlanModal={setAutoOpenPlanModal}
            />
          )}
          {view === "log" && <CallLogView line={line} log={log} d={d} lang={lang} />}
          {view === "settings" && (
            <SettingsView
              line={line}
              setLine={setLines}
              showToast={showToast}
              d={d}
              lang={lang}
              preferredName={account.preferred}
            />
          )}
          {view === "account" && (
            <AccountView
              account={account}
              setAccount={setAccount}
              showToast={showToast}
              tab={acctTab}
              setTab={setAcctTab}
              d={d}
              lang={lang}
              lines={lines}
              setLines={setLines}
              autoOpenPlanModal={autoOpenPlanModal}
              setAutoOpenPlanModal={setAutoOpenPlanModal}
            />
          )}
        </div>
      </div>

      {headerAddonModalOpen && (
        <Modal
          title={lang === "es" ? "Configurar línea adicional" : lang === "fr" ? "Configurer une ligne supplémentaire" : "Configure Additional Line"}
          onClose={() => setHeaderAddonModalOpen(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
              <button className="btn btn-ghost" onClick={() => setHeaderAddonModalOpen(false)}>
                {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                className="btn btn-primary"
                disabled={!headerSelectedNumber}
                onClick={() => {
                  let updatedAccount = account;
                  setAccount((prev) => {
                    const baseLinesCount = prev.plan === "pro" ? 2 : 1;
                    const needsAddon = lines.length >= baseLinesCount;
                    if (!needsAddon) return prev;

                    const updated = {
                      ...prev,
                      addons: {
                        ...(prev.addons || {}),
                        extraNumbers: (prev.addons?.extraNumbers || 0) + 1,
                      } as Account["addons"],
                    };
                    updatedAccount = updated;
                    localStorage.setItem("ic_account_data", JSON.stringify(updated));
                    return updated;
                  });

                  const index = lines.length;
                  const newLine: Line = {
                    id: "line_" + Date.now() + "_" + index,
                    label: getLineDefaultLabel(index, updatedAccount.plan, lang),
                    person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                    number: headerSelectedNumber!.number,
                    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
                    mode: "cascade",
                    minutesUsed: 0,
                    contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                    settings: {
                      greeting: "",
                      bilingual: false,
                      language2: "es",
                      notifSMS: true,
                      notifEmail: true,
                      notifMissed: true,
                      notifWeekly: false,
                    },
                  };

                  const nextLines = [...lines, newLine];
                  setLines(nextLines);
                  localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                  setActiveLineId(newLine.id);
                  setHeaderAddonModalOpen(false);
                  showToast(lang === "es" ? "¡Línea adicional configurada!" : lang === "fr" ? "Ligne supplémentaire configurée !" : "Additional line configured!");
                }}
              >
                {lang === "es" ? "Guardar" : lang === "fr" ? "Enregistrer" : "Confirm & Save"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                {lang === "es"
                  ? "Seleccione un número para su nueva línea prioritaria."
                  : lang === "fr"
                  ? "Sélectionnez un numéro pour votre nouvelle ligne prioritaire."
                  : "Select a phone number for your new priority line."}
              </p>

              {(() => {
                const baseLinesLimit = account.plan === "pro" ? 2 : 1;
                const isPro = account.plan === "pro";
                return lines.length >= baseLinesLimit ? (
                  <div style={{ background: "oklch(0.96 0.03 220 / 0.4)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                    {lang === "es"
                      ? "Nota: Esta línea se agregará como un complemento y se cobrará a su tarifa de $6.99/mes inmediatamente al confirmar y guardar."
                      : lang === "fr"
                      ? "Remarque : Cette ligne sera ajoutée en tant qu'option et facturée à votre tarif de 6,99 $/mois immédiatement après confirmation."
                      : "Note: This line will be added as an add-on and billed at your rate of $6.99/mo immediately upon confirming and saving."}
                  </div>
                ) : (
                  <div style={{ background: "oklch(0.96 0.03 140 / 0.1)", border: "1px solid oklch(0.8 0.1 140 / 0.3)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                    {lang === "es"
                      ? `Nota: Esta línea está incluida en su plan ${isPro ? "Pro" : "Essential"} sin costo adicional.`
                      : lang === "fr"
                      ? `Remarque : Cette ligne est incluse dans votre forfait ${isPro ? "Pro" : "Essential"} sans frais supplémentaires.`
                      : `Note: This line is included in your ${isPro ? "Pro" : "Essential"} plan at no additional cost.`}
                  </div>
                );
              })()}

              {/* Area Code Search */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <input
                  type="text"
                  maxLength={3}
                  value={headerAreaCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setHeaderAreaCode(val);
                    if (val.length === 3) {
                      loadHeaderNumbers(val);
                    }
                  }}
                  placeholder="Area Code"
                  className="input"
                  style={{ width: 120, height: 38, padding: "0 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)" }}
                />
                {headerAreaCode.length === 3 && <AreaFlag areaCode={headerAreaCode} height={15} showAbbr />}
                <button
                  className="btn btn-ghost"
                  disabled={headerAreaCode.length !== 3 || headerIsSearching}
                  onClick={() => loadHeaderNumbers(headerAreaCode)}
                  style={{ height: 38, padding: "0 16px" }}
                >
                  {headerIsSearching ? (
                    lang === "es" ? "Buscando..." : lang === "fr" ? "Recherche..." : "Searching..."
                  ) : (
                    lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"
                  )}
                </button>
              </div>

              {/* Numbers list */}
              {headerIsSearching ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                  <div className="spinner" style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                </div>
              ) : headerNumbersList.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {(headerNumbersList[0]?.area === "787" || headerNumbersList[0]?.area === "939") && (
                    <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                      {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                    </div>
                  )}
                  {headerNumbersList.map((num) => {
                    const isSelected = headerSelectedNumber?.number === num.number;
                    return (
                      <button
                        key={num.id || num.number}
                        onClick={() => setHeaderSelectedNumber(num)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "12px 8px",
                          borderRadius: "var(--r-md)",
                          border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                          background: isSelected ? "var(--tint)" : "var(--surface)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AreaFlag areaCode={num.area} />
                          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>{num.number}</span>
                        </span>
                        {num.memorable ? (
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                            {num.memorable}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                            {lang === "es" ? "Número estándar" : lang === "fr" ? "Numéro standard" : "Standard Number"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--ink-soft)" }}>
                  {lang === "es" ? "Ingrese un código de área para buscar números." : lang === "fr" ? "Entrez un indicatif de zone pour rechercher des numéros." : "Enter a 3-digit area code to search for available numbers."}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {headerRemovalLine && (
        <Modal
          title={lang === "es" ? "Eliminar número de teléfono" : lang === "fr" ? "Supprimer le numéro de téléphone" : "Remove Phone Number"}
          onClose={() => setHeaderRemovalLine(null)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
              <button className="btn btn-ghost" onClick={() => setHeaderRemovalLine(null)}>
                {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "oklch(0.6 0.18 22)", borderColor: "oklch(0.6 0.18 22)", color: "#fff" }}
                onClick={() => {
                  const lineToDelete = headerRemovalLine;
                  
                  // Filter out the line
                  setLines((prev) => {
                    const nextLines = prev.filter((l) => l.id !== lineToDelete.id);
                    if (activeLineId === lineToDelete.id && nextLines[0]) {
                      setActiveLineId(nextLines[0].id);
                    }
                    return nextLines;
                  });

                  // Decrement extraNumbers add-on
                  setAccount((prev) => {
                    const updated = {
                      ...prev,
                      addons: {
                        ...(prev.addons || {}),
                        extraNumbers: Math.max(0, (prev.addons?.extraNumbers || 0) - 1),
                      } as Account["addons"],
                    };
                    return updated;
                  });

                  setHeaderRemovalLine(null);
                  showToast(lang === "es" ? "¡Número de teléfono eliminado!" : lang === "fr" ? "Numéro de téléphone supprimé !" : "Phone number removed successfully!");
                }}
              >
                {lang === "es" ? "Eliminar" : lang === "fr" ? "Supprimer" : "Remove Number"}
              </button>
            </div>
          }
        >
          <div style={{ padding: "10px 0" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "var(--ink)", fontWeight: 500 }}>
              {lang === "es"
                ? `¿Está seguro de que desea eliminar la línea "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number})?`
                : lang === "fr"
                ? `Êtes-vous sûr de vouloir supprimer la ligne "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number}) ?`
                : `Are you sure you want to remove the phone line "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number})?`}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "oklch(0.6 0.18 22)", fontWeight: 500 }}>
              {lang === "es"
                ? "Esta acción devolverá este número de forma permanente y eliminará todas sus configuraciones y contactos."
                : lang === "fr"
                ? "Cette action restituera définitivement ce numéro et effacera toutes ses configurations."
                : "This action will permanently return this number and delete all of its configurations and contacts."}
            </p>
          </div>
        </Modal>
      )}

      <Toast msg={toast} />
      </div>
    </div>
  );
}

function AreaFlag({ areaCode, height = 13, showAbbr = false }: { areaCode: string; height?: number; showAbbr?: boolean }) {
  const region = stateForAreaCode(areaCode);
  if (!region) return null;
  return (
    <span title={region.name} style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <img
        src={`https://flagcdn.com/${region.flag}.svg`}
        alt={region.name}
        loading="lazy"
        onError={(e) => { e.currentTarget.parentElement!.style.display = "none"; }}
        style={{
          height,
          width: Math.round(height * 1.5),
          objectFit: "cover",
          borderRadius: 2,
          border: "1px solid var(--line)",
          display: "block"
        }}
      />
      {showAbbr && (
        <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--ink-faint)" }}>{region.abbr}</span>
      )}
    </span>
  );
}

const AREA_SUGGESTIONS = [
  { code: "470", city: "Atlanta" },
  { code: "872", city: "Chicago" },
  { code: "945", city: "Dallas" },
  { code: "629", city: "Nashville" },
  { code: "689", city: "Orlando" },
  { code: "984", city: "Raleigh" },
  { code: "787", city: "Puerto Rico" },
];

const VANITY_WORDS = [
  { word: "CARE", digits: "2273" },
  { word: "HOME", digits: "4663" },
  { word: "HELP", digits: "4357" },
  { word: "SAFE", digits: "7233" },
  { word: "CALL", digits: "2255" },
  { word: "LOVE", digits: "5683" },
  { word: "FAMI", digits: "3264" },
];

function pad(n: number, len: number) { return String(n).padStart(len, "0"); }

function memorableLabel(prefix: string, line: string) {
  if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3]) return "Repeating";
  if (line === "1234" || line === "4321" || line === "2345") return "Sequence";
  if (line[0] === line[3] && line[1] === line[2]) return "Mirror";
  if (prefix === line.slice(0, 3)) return "Easy recall";
  return null;
}

let _numSeed = Math.floor(Math.random() * 9000);

function fetchNumbers(areaCode: string, count = 6) {
  const ac = areaCode.replace(/\D/g, "").slice(0, 3) || "415";
  const out: { id: string; number: string; area: string; memorable: string | null }[] = [];
  const usedVanity = new Set();
  for (let i = 0; i < count; i++) {
    _numSeed = (_numSeed * 1103515245 + 12345) & 0x7fffffff;
    const r = _numSeed;
    let prefix = "";
    let line = "";
    let vanity = null;

    if (r % 3 === 0) {
      const v = VANITY_WORDS[(r >> 4) % VANITY_WORDS.length];
      if (!usedVanity.has(v.word)) {
        usedVanity.add(v.word);
        prefix = pad(200 + ((r >> 8) % 700), 3);
        line = v.digits;
        vanity = v.word;
      }
    }
    if (!line) {
      prefix = pad(200 + ((r >> 6) % 700), 3);
      line = pad((r >> 10) % 10000, 4);
    }

    const formatted = `(${ac}) ${prefix}-${line}`;
    const memo = vanity ? `Spells ${vanity}` : memorableLabel(prefix, line);
    out.push({
      id: `${ac}-${prefix}-${line}-${i}`,
      number: formatted,
      area: ac,
      memorable: memo,
    });
  }
  return out;
}

// Fetches real available numbers from Twilio. Falls back to the mock
// generator only when Twilio is unconfigured (local dev); when Twilio is
// live, an out-of-stock area code returns an empty list so the UI can show
// its "no numbers found" state instead of fake numbers.
async function fetchNumbersLive(areaCode: string, count = 6): Promise<{ id: string; number: string; area: string; memorable: string | null }[]> {
  const ac = areaCode.replace(/\D/g, "").slice(0, 3) || "470";
  try {
    const res = await fetch(`/api/twilio/numbers?areaCode=${ac}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        if (data.configured === false) return fetchNumbers(ac, count);
        const results = Array.isArray(data.results) ? data.results : [];
        return results.slice(0, count).map((n: { phoneNumber: string; friendlyName?: string }) => ({
          id: n.phoneNumber,
          number: n.friendlyName || n.phoneNumber,
          area: ac,
          memorable: null,
        }));
      }
    }
  } catch {
    // network/API failure: show the empty state rather than fake numbers
  }
  return [];
}

