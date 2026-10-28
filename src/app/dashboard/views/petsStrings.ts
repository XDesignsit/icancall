// Text for the pet plan billing card and locked voicemails (lib/pets), per
// dashboard language. Plan names come from the /pets page translations.

export interface PetsCopy {
  names: Record<"annual" | "lifetime" | "small_bird_lifetime" | "parrot_10yr" | "parrot_20yr", string>;
  perYear: string;
  oneTime: string;
  minutes: string;
  renews: string;
  coversUntil: string;
  minutesReset: string;
  outRenew: string;
  outWait: string;
  renewNow: string;
  renewing: string;
  renewed: string;
  locked: string;
  greetingLocked: string;
  menuOnly: string;
}

const COPY: Record<string, PetsCopy> = {
  "en": {
    "names": {
      "annual": "Annual",
      "lifetime": "Lifetime",
      "small_bird_lifetime": "Small Bird Lifetime",
      "parrot_10yr": "Parrot 10-Year",
      "parrot_20yr": "Parrot 20-Year"
    },
    "perYear": "/ year",
    "oneTime": "one time",
    "minutes": "30 minutes of calls per year",
    "renews": "Renews {date}",
    "coversUntil": "Paid once · covers until {date}",
    "minutesReset": "Minutes reset {date}",
    "outRenew": "Your line is out of minutes for this year. Renew now to take calls again and unlock the voicemails left since.",
    "outWait": "Your line is out of minutes for this year. Callers can still leave a voicemail. Messages unlock when your minutes reset on {date}.",
    "renewNow": "Renew now · $29",
    "renewing": "Renewing…",
    "renewed": "Renewed. Your minutes are reset and your voicemails are unlocked.",
    "locked": "Locked voicemail",
    "greetingLocked": "Pet lines always play the lost-pet greeting, so finders know they reached the right place.",
    "menuOnly": "Pet lines use the caller menu, so finders can choose who to reach."
  },
  "es": {
    "names": {
      "annual": "Anual",
      "lifetime": "Vitalicio",
      "small_bird_lifetime": "Vitalicio Aves Pequeñas",
      "parrot_10yr": "Loro 10 Años",
      "parrot_20yr": "Loro 20 Años"
    },
    "perYear": "/ año",
    "oneTime": "pago único",
    "minutes": "30 minutos de llamadas al año",
    "renews": "Se renueva el {date}",
    "coversUntil": "Pago único · cubre hasta el {date}",
    "minutesReset": "Los minutos se reinician el {date}",
    "outRenew": "Su línea se quedó sin minutos este año. Renueve ahora para volver a recibir llamadas y desbloquear los mensajes de voz que le dejaron.",
    "outWait": "Su línea se quedó sin minutos este año. Quienes llamen aún pueden dejar un mensaje de voz. Los mensajes se desbloquean cuando sus minutos se reinicien el {date}.",
    "renewNow": "Renovar ahora · $29",
    "renewing": "Renovando…",
    "renewed": "Renovado. Sus minutos se reiniciaron y sus mensajes de voz están desbloqueados.",
    "locked": "Mensaje de voz bloqueado",
    "greetingLocked": "Las líneas para mascotas siempre reproducen el saludo de mascota perdida, para que quien la encuentre sepa que llamó al lugar correcto.",
    "menuOnly": "Las líneas para mascotas usan el menú de llamadas, para que quien encuentre a la mascota elija a quién contactar."
  },
  "fr": {
    "names": {
      "annual": "Annuel",
      "lifetime": "À vie",
      "small_bird_lifetime": "À vie Petits oiseaux",
      "parrot_10yr": "Perroquet 10 ans",
      "parrot_20yr": "Perroquet 20 ans"
    },
    "perYear": "/ an",
    "oneTime": "une fois",
    "minutes": "30 minutes d'appel par an",
    "renews": "Renouvellement le {date}",
    "coversUntil": "Payé une fois · couvert jusqu'au {date}",
    "minutesReset": "Minutes réinitialisées le {date}",
    "outRenew": "Votre ligne n'a plus de minutes pour cette année. Renouvelez maintenant pour recevoir à nouveau des appels et débloquer les messages laissés depuis.",
    "outWait": "Votre ligne n'a plus de minutes pour cette année. Les appelants peuvent toujours laisser un message. Les messages se débloquent quand vos minutes sont réinitialisées le {date}.",
    "renewNow": "Renouveler maintenant · $29",
    "renewing": "Renouvellement…",
    "renewed": "Renouvelé. Vos minutes sont réinitialisées et vos messages sont débloqués.",
    "locked": "Message vocal verrouillé",
    "greetingLocked": "Les lignes pour animaux diffusent toujours le message d'animal perdu, pour que la personne qui l'a trouvé sache qu'elle a appelé le bon numéro.",
    "menuOnly": "Les lignes pour animaux utilisent le menu vocal, pour que la personne qui l'a trouvé choisisse qui joindre."
  },
  "ja": {
    "names": {
      "annual": "年払いプラン",
      "lifetime": "生涯プラン",
      "small_bird_lifetime": "小型鳥 生涯プラン",
      "parrot_10yr": "インコ・オウム10年プラン",
      "parrot_20yr": "インコ・オウム20年プラン"
    },
    "perYear": "/ 年",
    "oneTime": "1回のみ",
    "minutes": "年間30分の通話",
    "renews": "{date}に更新",
    "coversUntil": "1回払い · {date}まで有効",
    "minutesReset": "{date}に通話時間をリセット",
    "outRenew": "今年の通話時間を使い切りました。今すぐ更新すると、再び電話を受けられ、その間に残された留守番電話も聞けるようになります。",
    "outWait": "今年の通話時間を使い切りました。発信者は引き続き留守番電話を残せます。メッセージは{date}に通話時間がリセットされると聞けるようになります。",
    "renewNow": "今すぐ更新 · $29",
    "renewing": "更新中…",
    "renewed": "更新しました。通話時間がリセットされ、留守番電話が聞けるようになりました。",
    "locked": "ロック中の留守番電話",
    "greetingLocked": "ペット用回線では常に迷子ペット用のあいさつが流れるため、見つけた人は正しい番号にかけたことが分かります。",
    "menuOnly": "ペット用回線は音声ダイヤルメニューを使うため、見つけた人が連絡先を選べます。"
  },
  "zh": {
    "names": {
      "annual": "按年付款套餐",
      "lifetime": "终身套餐",
      "small_bird_lifetime": "小型鸟终身套餐",
      "parrot_10yr": "鹦鹉 10 年套餐",
      "parrot_20yr": "鹦鹉 20 年套餐"
    },
    "perYear": "/ 年",
    "oneTime": "一次性",
    "minutes": "每年 30 分钟通话时长",
    "renews": "{date} 续订",
    "coversUntil": "一次付清 · 有效期至 {date}",
    "minutesReset": "通话分钟将于 {date} 重置",
    "outRenew": "您的线路本年度的通话分钟已用完。立即续订即可重新接听来电，并解锁此后收到的语音留言。",
    "outWait": "您的线路本年度的通话分钟已用完。来电者仍可留下语音留言。留言将在 {date} 通话分钟重置后解锁。",
    "renewNow": "立即续订 · $29",
    "renewing": "正在续订…",
    "renewed": "已续订。您的通话分钟已重置，语音留言已解锁。",
    "locked": "已锁定的语音留言",
    "greetingLocked": "宠物线路始终播放走失宠物问候语，让发现者知道自己打对了电话。",
    "menuOnly": "宠物线路使用语音菜单，让发现者自行选择联系谁。"
  },
  "ar": {
    "names": {
      "annual": "الخطة السنوية",
      "lifetime": "خطة مدى الحياة",
      "small_bird_lifetime": "خطة مدى الحياة للطيور الصغيرة",
      "parrot_10yr": "خطة الببغاء 10 سنوات",
      "parrot_20yr": "خطة الببغاء 20 سنة"
    },
    "perYear": "/ سنوياً",
    "oneTime": "مرة واحدة",
    "minutes": "30 دقيقة من المكالمات سنوياً",
    "renews": "يتجدد في {date}",
    "coversUntil": "دفعة واحدة · يغطي حتى {date}",
    "minutesReset": "تُعاد الدقائق في {date}",
    "outRenew": "نفدت دقائق خطك لهذا العام. جدّد الآن لتلقي المكالمات مرة أخرى وفتح الرسائل الصوتية التي تُركت منذ ذلك الحين.",
    "outWait": "نفدت دقائق خطك لهذا العام. لا يزال بإمكان المتصلين ترك رسالة صوتية. تُفتح الرسائل عند إعادة دقائقك في {date}.",
    "renewNow": "جدّد الآن · $29",
    "renewing": "جارٍ التجديد…",
    "renewed": "تم التجديد. أُعيدت دقائقك وفُتحت رسائلك الصوتية.",
    "locked": "رسالة صوتية مقفلة",
    "greetingLocked": "تشغّل خطوط الحيوانات الأليفة دائمًا تحية الحيوان المفقود، ليعرف من وجده أنه اتصل بالمكان الصحيح.",
    "menuOnly": "تستخدم خطوط الحيوانات الأليفة قائمة المتصل، ليختار من وجد الحيوان من يتصل به."
  },
  "hi": {
    "names": {
      "annual": "वार्षिक प्लान",
      "lifetime": "आजीवन",
      "small_bird_lifetime": "छोटे पक्षी आजीवन",
      "parrot_10yr": "तोता 10-वर्षीय",
      "parrot_20yr": "तोता 20-वर्षीय"
    },
    "perYear": "/ वर्ष",
    "oneTime": "एक बार",
    "minutes": "प्रति वर्ष 30 मिनट की कॉल",
    "renews": "{date} को नवीनीकरण",
    "coversUntil": "एक बार भुगतान · {date} तक मान्य",
    "minutesReset": "मिनट {date} को रीसेट होंगे",
    "outRenew": "इस साल आपकी लाइन के मिनट खत्म हो गए हैं। फिर से कॉल पाने और तब से छोड़े गए वॉइसमेल खोलने के लिए अभी नवीनीकरण करें।",
    "outWait": "इस साल आपकी लाइन के मिनट खत्म हो गए हैं। कॉल करने वाले अब भी वॉइसमेल छोड़ सकते हैं। संदेश {date} को मिनट रीसेट होने पर खुलेंगे।",
    "renewNow": "अभी नवीनीकरण करें · $29",
    "renewing": "नवीनीकरण हो रहा है…",
    "renewed": "नवीनीकरण हो गया। आपके मिनट रीसेट हो गए हैं और वॉइसमेल खुल गए हैं।",
    "locked": "लॉक किया गया वॉइसमेल",
    "greetingLocked": "पालतू लाइनें हमेशा खोए पालतू का अभिवादन चलाती हैं, ताकि ढूंढने वाले को पता रहे कि उसने सही जगह कॉल किया है।",
    "menuOnly": "पालतू लाइनें कॉलर मेनू का उपयोग करती हैं, ताकि ढूंढने वाला चुन सके कि किससे बात करनी है।"
  },
  "pt": {
    "names": {
      "annual": "Anual",
      "lifetime": "Vitalício",
      "small_bird_lifetime": "Vitalício Aves Pequenas",
      "parrot_10yr": "Papagaio 10 Anos",
      "parrot_20yr": "Papagaio 20 Anos"
    },
    "perYear": "/ ano",
    "oneTime": "pagamento único",
    "minutes": "30 minutos de ligações por ano",
    "renews": "Renova em {date}",
    "coversUntil": "Pagamento único · cobre até {date}",
    "minutesReset": "Os minutos renovam em {date}",
    "outRenew": "Sua linha ficou sem minutos este ano. Renove agora para voltar a receber ligações e desbloquear os recados deixados desde então.",
    "outWait": "Sua linha ficou sem minutos este ano. Quem ligar ainda pode deixar recado. Os recados são liberados quando seus minutos renovarem em {date}.",
    "renewNow": "Renovar agora · $29",
    "renewing": "Renovando…",
    "renewed": "Renovado. Seus minutos foram renovados e seus recados liberados.",
    "locked": "Recado bloqueado",
    "greetingLocked": "As linhas para pets sempre tocam a mensagem de pet perdido, para quem encontrou saber que ligou para o lugar certo.",
    "menuOnly": "As linhas para pets usam o menu de chamadas, para quem encontrou escolher com quem falar."
  },
  "de": {
    "names": {
      "annual": "Jahrestarif",
      "lifetime": "Lebenszeit-Tarif",
      "small_bird_lifetime": "Kleinvogel-Lebenszeit-Tarif",
      "parrot_10yr": "Papageien-Tarif 10 Jahre",
      "parrot_20yr": "Papageien-Tarif 20 Jahre"
    },
    "perYear": "/ Jahr",
    "oneTime": "einmalig",
    "minutes": "30 Anrufminuten pro Jahr",
    "renews": "Verlängert sich am {date}",
    "coversUntil": "Einmal bezahlt · gültig bis {date}",
    "minutesReset": "Minuten werden am {date} zurückgesetzt",
    "outRenew": "Ihre Leitung hat für dieses Jahr keine Minuten mehr. Verlängern Sie jetzt, um wieder Anrufe zu erhalten und die seitdem hinterlassenen Sprachnachrichten freizuschalten.",
    "outWait": "Ihre Leitung hat für dieses Jahr keine Minuten mehr. Anrufer können weiterhin eine Sprachnachricht hinterlassen. Nachrichten werden freigeschaltet, wenn Ihre Minuten am {date} zurückgesetzt werden.",
    "renewNow": "Jetzt verlängern · $29",
    "renewing": "Wird verlängert…",
    "renewed": "Verlängert. Ihre Minuten sind zurückgesetzt und Ihre Sprachnachrichten freigeschaltet.",
    "locked": "Gesperrte Sprachnachricht",
    "greetingLocked": "Haustier-Leitungen spielen immer die Ansage für entlaufene Tiere ab, damit Finder wissen, dass sie richtig angerufen haben.",
    "menuOnly": "Haustier-Leitungen nutzen das Sprachmenü, damit Finder wählen können, wen sie erreichen."
  },
  "it": {
    "names": {
      "annual": "Annuale",
      "lifetime": "A vita",
      "small_bird_lifetime": "A vita Uccelli piccoli",
      "parrot_10yr": "Pappagallo 10 anni",
      "parrot_20yr": "Pappagallo 20 anni"
    },
    "perYear": "/ anno",
    "oneTime": "una tantum",
    "minutes": "30 minuti di chiamate all'anno",
    "renews": "Si rinnova il {date}",
    "coversUntil": "Pagato una volta · valido fino al {date}",
    "minutesReset": "I minuti si azzerano il {date}",
    "outRenew": "La tua linea ha esaurito i minuti di quest'anno. Rinnova ora per ricevere di nuovo chiamate e sbloccare i messaggi lasciati nel frattempo.",
    "outWait": "La tua linea ha esaurito i minuti di quest'anno. Chi chiama può comunque lasciare un messaggio. I messaggi si sbloccano quando i minuti si azzerano il {date}.",
    "renewNow": "Rinnova ora · $29",
    "renewing": "Rinnovo in corso…",
    "renewed": "Rinnovato. I tuoi minuti sono stati azzerati e i messaggi sbloccati.",
    "locked": "Messaggio vocale bloccato",
    "greetingLocked": "Le linee per animali riproducono sempre il messaggio per animale smarrito, così chi lo trova sa di aver chiamato il numero giusto.",
    "menuOnly": "Le linee per animali usano il menu vocale, così chi trova l'animale sceglie chi contattare."
  },
  "ko": {
    "names": {
      "annual": "연간 요금제",
      "lifetime": "평생",
      "small_bird_lifetime": "소형 조류 평생",
      "parrot_10yr": "앵무새 10년",
      "parrot_20yr": "앵무새 20년"
    },
    "perYear": "/ 년",
    "oneTime": "1회",
    "minutes": "연간 통화 30분",
    "renews": "{date}에 갱신",
    "coversUntil": "일회 결제 · {date}까지 보장",
    "minutesReset": "{date}에 통화 시간 초기화",
    "outRenew": "올해 통화 시간을 모두 사용했습니다. 지금 갱신하면 다시 전화를 받을 수 있고 그동안 남겨진 음성 메시지도 열립니다.",
    "outWait": "올해 통화 시간을 모두 사용했습니다. 발신자는 여전히 음성 메시지를 남길 수 있습니다. 메시지는 {date}에 통화 시간이 초기화되면 열립니다.",
    "renewNow": "지금 갱신 · $29",
    "renewing": "갱신 중…",
    "renewed": "갱신되었습니다. 통화 시간이 초기화되고 음성 메시지가 열렸습니다.",
    "locked": "잠긴 음성 메시지",
    "greetingLocked": "반려동물 회선은 항상 실종 안내 멘트를 재생하므로, 발견한 사람이 제대로 전화했다는 것을 알 수 있습니다.",
    "menuOnly": "반려동물 회선은 선택 다이얼 메뉴를 사용하므로, 발견한 사람이 연락할 사람을 고를 수 있습니다."
  }
};

export function petsCopy(lang: string): PetsCopy {
  return COPY[lang] || COPY.en;
}
