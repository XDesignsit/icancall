// Copy for the low-minute and out-of-minutes alerts (lib/minuteAlerts), in the
// language the owner picked under Account → Contact info (settings.language,
// stored by name: "English", "Spanish", ...). Unknown names fall back to English.
//
// Placeholders: {used}, {pool} and {left} are minute counts, {link} the
// dashboard link. Texts start with "iCanCall:" so the sender is clear.

export type MinuteAlertLevel = "low" | "out";

type LevelCopy = {
  subject: string;
  heading: string;
  /** What the owner has used, as a sentence. */
  summary: string;
  /** What happens next and what to do. */
  advice: string;
  sms: string;
};

export type MinuteAlertCopy = Record<MinuteAlertLevel, LevelCopy> & {
  usedLabel: string;
  leftLabel: string;
  cta: string;
  footer: string;
};

const en: MinuteAlertCopy = {
  low: {
    subject: "Your iCanCall minutes are running low",
    heading: "Your voice minutes are running low",
    summary: "You have used {used} of your {pool} voice minutes this cycle, so {left} are left.",
    advice:
      "When they run out, calls to your iCanCall number will not reach your family until you add minutes or your plan renews. You can add 30-minute blocks from your dashboard at any time.",
    sms: "iCanCall: You have {left} of {pool} voice minutes left this cycle. Add minutes before they run out: {link}",
  },
  out: {
    subject: "Your iCanCall minutes have run out",
    heading: "You are out of voice minutes",
    summary: "You have used all {pool} voice minutes for this cycle.",
    advice:
      "Callers now hear that the number is out of minutes, and their calls are not connected. Add 30-minute blocks from your dashboard to reconnect calls right away, or wait for your minutes to reset when your plan renews.",
    sms: "iCanCall: Your voice minutes have run out, so calls to your number are not being connected. Add minutes to reconnect them: {link}",
  },
  usedLabel: "Used this cycle",
  leftLabel: "Left",
  cta: "Add minutes",
  footer:
    "You are receiving this because you own this iCanCall account. Each of these alerts is sent once per minutes cycle.",
};

const es: MinuteAlertCopy = {
  low: {
    subject: "Le quedan pocos minutos en iCanCall",
    heading: "Le quedan pocos minutos de voz",
    summary: "Ha usado {used} de sus {pool} minutos de voz en este ciclo, así que le quedan {left}.",
    advice:
      "Cuando se acaben, las llamadas a su número de iCanCall no llegarán a su familia hasta que agregue minutos o se renueve su plan. Puede agregar bloques de 30 minutos desde su panel en cualquier momento.",
    sms: "iCanCall: Le quedan {left} de {pool} minutos de voz en este ciclo. Agregue minutos antes de que se acaben: {link}",
  },
  out: {
    subject: "Se acabaron sus minutos de iCanCall",
    heading: "Se quedó sin minutos de voz",
    summary: "Ha usado los {pool} minutos de voz de este ciclo.",
    advice:
      "Quienes llaman ahora escuchan que el número se quedó sin minutos y sus llamadas no se conectan. Agregue bloques de 30 minutos desde su panel para volver a conectar las llamadas de inmediato, o espere a que sus minutos se reinicien cuando se renueve su plan.",
    sms: "iCanCall: Se acabaron sus minutos de voz, así que las llamadas a su número no se están conectando. Agregue minutos para reconectarlas: {link}",
  },
  usedLabel: "Usados en este ciclo",
  leftLabel: "Restantes",
  cta: "Agregar minutos",
  footer:
    "Recibe este mensaje porque es el titular de esta cuenta de iCanCall. Cada uno de estos avisos se envía una vez por ciclo de minutos.",
};

const fr: MinuteAlertCopy = {
  low: {
    subject: "Il vous reste peu de minutes iCanCall",
    heading: "Il vous reste peu de minutes vocales",
    summary: "Vous avez utilisé {used} de vos {pool} minutes vocales ce cycle ; il vous en reste {left}.",
    advice:
      "Une fois épuisées, les appels vers votre numéro iCanCall ne joindront plus votre famille tant que vous n'aurez pas ajouté de minutes ou que votre forfait ne sera pas renouvelé. Vous pouvez ajouter des blocs de 30 minutes depuis votre tableau de bord à tout moment.",
    sms: "iCanCall : il vous reste {left} minutes vocales sur {pool} ce cycle. Ajoutez des minutes avant qu'elles soient épuisées : {link}",
  },
  out: {
    subject: "Vos minutes iCanCall sont épuisées",
    heading: "Vous n'avez plus de minutes vocales",
    summary: "Vous avez utilisé les {pool} minutes vocales de ce cycle.",
    advice:
      "Les appelants entendent désormais que le numéro n'a plus de minutes, et leurs appels ne sont pas transmis. Ajoutez des blocs de 30 minutes depuis votre tableau de bord pour rétablir les appels immédiatement, ou attendez la remise à zéro de vos minutes au renouvellement de votre forfait.",
    sms: "iCanCall : vos minutes vocales sont épuisées, les appels vers votre numéro ne sont donc plus transmis. Ajoutez des minutes pour les rétablir : {link}",
  },
  usedLabel: "Utilisées ce cycle",
  leftLabel: "Restantes",
  cta: "Ajouter des minutes",
  footer:
    "Vous recevez ce message parce que vous êtes titulaire de ce compte iCanCall. Chacune de ces alertes est envoyée une fois par cycle de minutes.",
};

const zh: MinuteAlertCopy = {
  low: {
    subject: "您的 iCanCall 通话分钟即将用完",
    heading: "您的通话分钟即将用完",
    summary: "本周期您已使用 {pool} 分钟中的 {used} 分钟，还剩 {left} 分钟。",
    advice:
      "分钟用完后，拨打您 iCanCall 号码的电话将无法接通您的家人，直到您充值分钟或套餐续订。您可以随时在控制面板中购买 30 分钟的充值包。",
    sms: "iCanCall：本周期您还剩 {left} 分钟（共 {pool} 分钟）。请在用完前充值：{link}",
  },
  out: {
    subject: "您的 iCanCall 通话分钟已用完",
    heading: "您的通话分钟已用完",
    summary: "本周期的 {pool} 分钟已全部用完。",
    advice:
      "来电者现在会听到该号码分钟已用完的提示，电话不会被接通。请在控制面板中购买 30 分钟的充值包以立即恢复通话，或等待套餐续订时分钟重置。",
    sms: "iCanCall：您的通话分钟已用完，拨打您号码的电话目前无法接通。充值分钟即可恢复：{link}",
  },
  usedLabel: "本周期已用",
  leftLabel: "剩余",
  cta: "充值分钟",
  footer: "您收到此邮件是因为您是此 iCanCall 账户的所有者。每种提醒在每个分钟周期内只发送一次。",
};

const tl: MinuteAlertCopy = {
  low: {
    subject: "Paubos na ang iyong iCanCall minutes",
    heading: "Paubos na ang iyong voice minutes",
    summary: "Nagamit mo na ang {used} sa iyong {pool} voice minutes ngayong cycle, kaya {left} na lang ang natitira.",
    advice:
      "Kapag naubos ang mga ito, hindi na aabot sa iyong pamilya ang mga tawag sa iyong iCanCall number hanggang magdagdag ka ng minutes o ma-renew ang iyong plan. Maaari kang magdagdag ng 30-minute blocks mula sa iyong dashboard anumang oras.",
    sms: "iCanCall: May {left} ka na lang sa {pool} voice minutes ngayong cycle. Magdagdag ng minutes bago maubos: {link}",
  },
  out: {
    subject: "Naubos na ang iyong iCanCall minutes",
    heading: "Ubos na ang iyong voice minutes",
    summary: "Nagamit mo na ang lahat ng {pool} voice minutes para sa cycle na ito.",
    advice:
      "Naririnig na ngayon ng mga tumatawag na ubos na ang minutes ng number, at hindi naikokonekta ang kanilang mga tawag. Magdagdag ng 30-minute blocks mula sa iyong dashboard para maikonekta muli ang mga tawag ngayon din, o hintaying ma-reset ang iyong minutes kapag na-renew ang iyong plan.",
    sms: "iCanCall: Naubos na ang iyong voice minutes, kaya hindi naikokonekta ang mga tawag sa iyong number. Magdagdag ng minutes para maikonekta muli: {link}",
  },
  usedLabel: "Nagamit ngayong cycle",
  leftLabel: "Natitira",
  cta: "Magdagdag ng minutes",
  footer:
    "Natanggap mo ito dahil ikaw ang may-ari ng iCanCall account na ito. Ang bawat alert na ito ay ipinapadala nang isang beses bawat minutes cycle.",
};

const vi: MinuteAlertCopy = {
  low: {
    subject: "Số phút iCanCall của bạn sắp hết",
    heading: "Số phút gọi của bạn sắp hết",
    summary: "Bạn đã dùng {used} trong số {pool} phút gọi của chu kỳ này, còn lại {left} phút.",
    advice:
      "Khi hết phút, các cuộc gọi đến số iCanCall của bạn sẽ không đến được gia đình bạn cho đến khi bạn nạp thêm phút hoặc gói cước được gia hạn. Bạn có thể nạp thêm gói 30 phút từ bảng điều khiển bất cứ lúc nào.",
    sms: "iCanCall: Bạn còn {left} trên {pool} phút gọi trong chu kỳ này. Hãy nạp thêm phút trước khi hết: {link}",
  },
  out: {
    subject: "Số phút iCanCall của bạn đã hết",
    heading: "Bạn đã hết phút gọi",
    summary: "Bạn đã dùng hết {pool} phút gọi của chu kỳ này.",
    advice:
      "Người gọi giờ sẽ nghe thông báo rằng số này đã hết phút, và cuộc gọi của họ không được kết nối. Hãy nạp thêm gói 30 phút từ bảng điều khiển để kết nối lại cuộc gọi ngay, hoặc chờ số phút được đặt lại khi gói cước gia hạn.",
    sms: "iCanCall: Bạn đã hết phút gọi, nên các cuộc gọi đến số của bạn không được kết nối. Nạp thêm phút để kết nối lại: {link}",
  },
  usedLabel: "Đã dùng trong chu kỳ",
  leftLabel: "Còn lại",
  cta: "Nạp thêm phút",
  footer:
    "Bạn nhận được email này vì bạn là chủ tài khoản iCanCall này. Mỗi thông báo này chỉ được gửi một lần mỗi chu kỳ phút.",
};

const BY_LANGUAGE: Record<string, MinuteAlertCopy> = {
  english: en,
  spanish: es,
  french: fr,
  mandarin: zh,
  tagalog: tl,
  vietnamese: vi,
};

export function minuteAlertCopy(language: string | undefined): MinuteAlertCopy {
  return BY_LANGUAGE[(language || "").trim().toLowerCase()] || en;
}

/** Fills {name} placeholders. */
export function fillCopy(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
