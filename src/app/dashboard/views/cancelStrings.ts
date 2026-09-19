// Copy for the cancel-subscription flow in AccountView. Cancelling is always
// "at the end of the period already paid for" (see api/creem/cancel-subscription).

interface CancelStrings {
  confirmTitle: string;
  confirmBody: string;
  confirmNote: string;
  keep: string;
  confirmCancel: string;
  working: string;
  /** {date} = last day of service */
  endsOn: string;
  endsSoon: string;
  ended: string;
  resume: string;
  cancelledToast: string;
  resumedToast: string;
  failed: string;
}

const STRINGS: Record<string, CancelStrings> = {
  en: {
    confirmTitle: "Cancel your subscription?",
    confirmBody: "Your plan and phone numbers stay active until the end of the billing period you've already paid for. After that your subscription ends and you won't be charged again.",
    confirmNote: "No refund or credit is issued for the current billing period. You can undo this any time before it ends.",
    keep: "Keep subscription",
    confirmCancel: "Cancel subscription",
    working: "Working…",
    endsOn: "Your subscription is cancelled and ends on {date}. Your plan and numbers stay active until then, and you won't be charged again.",
    endsSoon: "Your subscription is cancelled and ends at the close of the current billing period. You won't be charged again.",
    ended: "Your subscription has ended.",
    resume: "Keep my subscription",
    cancelledToast: "Subscription cancelled — active until the end of the billing period",
    resumedToast: "Your subscription will continue as normal",
    failed: "We couldn't update your subscription, so nothing was changed. Please try again or contact support.",
  },
  es: {
    confirmTitle: "¿Cancelar su suscripción?",
    confirmBody: "Su plan y sus números de teléfono seguirán activos hasta el final del período de facturación que ya ha pagado. Después, su suscripción terminará y no se le volverá a cobrar.",
    confirmNote: "No se emite reembolso ni crédito por el período de facturación actual. Puede deshacer esto en cualquier momento antes de que termine.",
    keep: "Conservar suscripción",
    confirmCancel: "Cancelar suscripción",
    working: "Procesando…",
    endsOn: "Su suscripción está cancelada y termina el {date}. Su plan y sus números seguirán activos hasta entonces y no se le volverá a cobrar.",
    endsSoon: "Su suscripción está cancelada y termina al cierre del período de facturación actual. No se le volverá a cobrar.",
    ended: "Su suscripción ha terminado.",
    resume: "Conservar mi suscripción",
    cancelledToast: "Suscripción cancelada: activa hasta el final del período de facturación",
    resumedToast: "Su suscripción continuará con normalidad",
    failed: "No pudimos actualizar su suscripción, por lo que no se cambió nada. Inténtelo de nuevo o contacte con soporte.",
  },
  fr: {
    confirmTitle: "Annuler votre abonnement ?",
    confirmBody: "Votre forfait et vos numéros restent actifs jusqu'à la fin de la période de facturation déjà payée. Ensuite, votre abonnement prend fin et vous ne serez plus débité.",
    confirmNote: "Aucun remboursement ni crédit n'est accordé pour la période de facturation en cours. Vous pouvez revenir sur cette décision à tout moment avant son terme.",
    keep: "Conserver l'abonnement",
    confirmCancel: "Annuler l'abonnement",
    working: "Traitement…",
    endsOn: "Votre abonnement est annulé et prend fin le {date}. Votre forfait et vos numéros restent actifs jusque-là et vous ne serez plus débité.",
    endsSoon: "Votre abonnement est annulé et prend fin à la clôture de la période de facturation en cours. Vous ne serez plus débité.",
    ended: "Votre abonnement est terminé.",
    resume: "Conserver mon abonnement",
    cancelledToast: "Abonnement annulé — actif jusqu'à la fin de la période de facturation",
    resumedToast: "Votre abonnement se poursuit normalement",
    failed: "Nous n'avons pas pu mettre à jour votre abonnement ; rien n'a été modifié. Veuillez réessayer ou contacter l'assistance.",
  },
  ja: {
    confirmTitle: "サブスクリプションをキャンセルしますか？",
    confirmBody: "お支払い済みの請求期間が終了するまで、プランと電話番号は引き続きご利用いただけます。その後サブスクリプションは終了し、以降の請求は発生しません。",
    confirmNote: "現在の請求期間に対する返金やクレジットはありません。終了前であればいつでも取り消せます。",
    keep: "継続する",
    confirmCancel: "キャンセルする",
    working: "処理中…",
    endsOn: "サブスクリプションはキャンセル済みで、{date}に終了します。それまでプランと番号はご利用いただけ、以降の請求は発生しません。",
    endsSoon: "サブスクリプションはキャンセル済みで、現在の請求期間の終了時に終了します。以降の請求は発生しません。",
    ended: "サブスクリプションは終了しました。",
    resume: "サブスクリプションを継続する",
    cancelledToast: "キャンセルしました — 請求期間の終了までご利用いただけます",
    resumedToast: "サブスクリプションは通常どおり継続されます",
    failed: "サブスクリプションを更新できなかったため、変更は行われていません。もう一度お試しいただくか、サポートまでご連絡ください。",
  },
  zh: {
    confirmTitle: "要取消订阅吗？",
    confirmBody: "在您已付费的账单周期结束之前，您的方案和电话号码将保持有效。之后订阅将结束，您不会再被扣款。",
    confirmNote: "当前账单周期不提供退款或抵扣。在结束之前您可以随时撤销此操作。",
    keep: "保留订阅",
    confirmCancel: "取消订阅",
    working: "处理中…",
    endsOn: "您的订阅已取消，将于 {date} 结束。在此之前您的方案和号码保持有效，且不会再被扣款。",
    endsSoon: "您的订阅已取消，将在当前账单周期结束时终止。您不会再被扣款。",
    ended: "您的订阅已结束。",
    resume: "保留我的订阅",
    cancelledToast: "订阅已取消——在账单周期结束前仍然有效",
    resumedToast: "您的订阅将照常继续",
    failed: "我们无法更新您的订阅，因此未做任何更改。请重试或联系客服。",
  },
  ar: {
    confirmTitle: "هل تريد إلغاء اشتراكك؟",
    confirmBody: "ستبقى باقتك وأرقام هاتفك نشطة حتى نهاية فترة الفوترة التي دفعت ثمنها. بعد ذلك ينتهي اشتراكك ولن يتم خصم أي مبلغ آخر.",
    confirmNote: "لا يتم رد أي مبلغ أو رصيد عن فترة الفوترة الحالية. يمكنك التراجع عن ذلك في أي وقت قبل انتهائها.",
    keep: "الإبقاء على الاشتراك",
    confirmCancel: "إلغاء الاشتراك",
    working: "جارٍ التنفيذ…",
    endsOn: "تم إلغاء اشتراكك وسينتهي في {date}. ستبقى باقتك وأرقامك نشطة حتى ذلك الحين ولن يتم خصم أي مبلغ آخر.",
    endsSoon: "تم إلغاء اشتراكك وسينتهي عند نهاية فترة الفوترة الحالية. لن يتم خصم أي مبلغ آخر.",
    ended: "انتهى اشتراكك.",
    resume: "الإبقاء على اشتراكي",
    cancelledToast: "تم إلغاء الاشتراك — يبقى نشطاً حتى نهاية فترة الفوترة",
    resumedToast: "سيستمر اشتراكك كالمعتاد",
    failed: "تعذر تحديث اشتراكك، لذلك لم يتغير شيء. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.",
  },
  hi: {
    confirmTitle: "क्या आप अपनी सदस्यता रद्द करना चाहते हैं?",
    confirmBody: "आपका प्लान और फ़ोन नंबर उस बिलिंग अवधि के अंत तक सक्रिय रहेंगे जिसका आप भुगतान कर चुके हैं। उसके बाद आपकी सदस्यता समाप्त हो जाएगी और आपसे दोबारा शुल्क नहीं लिया जाएगा।",
    confirmNote: "वर्तमान बिलिंग अवधि के लिए कोई रिफंड या क्रेडिट नहीं दिया जाता। समाप्त होने से पहले आप इसे कभी भी वापस ले सकते हैं।",
    keep: "सदस्यता बनाए रखें",
    confirmCancel: "सदस्यता रद्द करें",
    working: "प्रक्रिया जारी…",
    endsOn: "आपकी सदस्यता रद्द कर दी गई है और {date} को समाप्त होगी। तब तक आपका प्लान और नंबर सक्रिय रहेंगे और आपसे दोबारा शुल्क नहीं लिया जाएगा।",
    endsSoon: "आपकी सदस्यता रद्द कर दी गई है और वर्तमान बिलिंग अवधि के अंत में समाप्त होगी। आपसे दोबारा शुल्क नहीं लिया जाएगा।",
    ended: "आपकी सदस्यता समाप्त हो गई है।",
    resume: "मेरी सदस्यता बनाए रखें",
    cancelledToast: "सदस्यता रद्द — बिलिंग अवधि के अंत तक सक्रिय",
    resumedToast: "आपकी सदस्यता सामान्य रूप से जारी रहेगी",
    failed: "हम आपकी सदस्यता अपडेट नहीं कर सके, इसलिए कुछ नहीं बदला गया। कृपया पुनः प्रयास करें या सहायता से संपर्क करें।",
  },
  pt: {
    confirmTitle: "Cancelar sua assinatura?",
    confirmBody: "Seu plano e seus números de telefone permanecem ativos até o fim do período de cobrança já pago. Depois disso, sua assinatura termina e você não será cobrado novamente.",
    confirmNote: "Não há reembolso nem crédito pelo período de cobrança atual. Você pode desfazer isso a qualquer momento antes do término.",
    keep: "Manter assinatura",
    confirmCancel: "Cancelar assinatura",
    working: "Processando…",
    endsOn: "Sua assinatura foi cancelada e termina em {date}. Seu plano e seus números permanecem ativos até lá e você não será cobrado novamente.",
    endsSoon: "Sua assinatura foi cancelada e termina ao final do período de cobrança atual. Você não será cobrado novamente.",
    ended: "Sua assinatura terminou.",
    resume: "Manter minha assinatura",
    cancelledToast: "Assinatura cancelada — ativa até o fim do período de cobrança",
    resumedToast: "Sua assinatura continuará normalmente",
    failed: "Não foi possível atualizar sua assinatura, então nada foi alterado. Tente novamente ou fale com o suporte.",
  },
  de: {
    confirmTitle: "Abonnement kündigen?",
    confirmBody: "Ihr Tarif und Ihre Telefonnummern bleiben bis zum Ende des bereits bezahlten Abrechnungszeitraums aktiv. Danach endet Ihr Abonnement und es erfolgt keine weitere Belastung.",
    confirmNote: "Für den laufenden Abrechnungszeitraum gibt es keine Erstattung oder Gutschrift. Sie können die Kündigung jederzeit vor Ablauf rückgängig machen.",
    keep: "Abonnement behalten",
    confirmCancel: "Abonnement kündigen",
    working: "Wird verarbeitet…",
    endsOn: "Ihr Abonnement ist gekündigt und endet am {date}. Bis dahin bleiben Tarif und Nummern aktiv, und es erfolgt keine weitere Belastung.",
    endsSoon: "Ihr Abonnement ist gekündigt und endet mit Ablauf des aktuellen Abrechnungszeitraums. Es erfolgt keine weitere Belastung.",
    ended: "Ihr Abonnement ist beendet.",
    resume: "Mein Abonnement behalten",
    cancelledToast: "Abonnement gekündigt – aktiv bis zum Ende des Abrechnungszeitraums",
    resumedToast: "Ihr Abonnement läuft wie gewohnt weiter",
    failed: "Wir konnten Ihr Abonnement nicht aktualisieren; es wurde nichts geändert. Bitte versuchen Sie es erneut oder wenden Sie sich an den Support.",
  },
  it: {
    confirmTitle: "Annullare l'abbonamento?",
    confirmBody: "Il piano e i numeri di telefono restano attivi fino alla fine del periodo di fatturazione già pagato. Dopo, l'abbonamento termina e non ti verrà addebitato altro.",
    confirmNote: "Non è previsto alcun rimborso o credito per il periodo di fatturazione in corso. Puoi annullare questa scelta in qualsiasi momento prima della scadenza.",
    keep: "Mantieni l'abbonamento",
    confirmCancel: "Annulla l'abbonamento",
    working: "Elaborazione…",
    endsOn: "Il tuo abbonamento è stato annullato e termina il {date}. Piano e numeri restano attivi fino ad allora e non ti verrà addebitato altro.",
    endsSoon: "Il tuo abbonamento è stato annullato e termina alla chiusura del periodo di fatturazione in corso. Non ti verrà addebitato altro.",
    ended: "Il tuo abbonamento è terminato.",
    resume: "Mantieni il mio abbonamento",
    cancelledToast: "Abbonamento annullato — attivo fino alla fine del periodo di fatturazione",
    resumedToast: "Il tuo abbonamento proseguirà normalmente",
    failed: "Non siamo riusciti ad aggiornare l'abbonamento, quindi non è cambiato nulla. Riprova o contatta l'assistenza.",
  },
  ko: {
    confirmTitle: "구독을 취소하시겠습니까?",
    confirmBody: "이미 결제하신 청구 기간이 끝날 때까지 플랜과 전화번호는 계속 사용할 수 있습니다. 그 이후 구독이 종료되며 더 이상 요금이 청구되지 않습니다.",
    confirmNote: "현재 청구 기간에 대한 환불이나 크레딧은 제공되지 않습니다. 종료 전에는 언제든지 취소를 되돌릴 수 있습니다.",
    keep: "구독 유지",
    confirmCancel: "구독 취소",
    working: "처리 중…",
    endsOn: "구독이 취소되었으며 {date}에 종료됩니다. 그때까지 플랜과 번호는 계속 사용할 수 있고 더 이상 요금이 청구되지 않습니다.",
    endsSoon: "구독이 취소되었으며 현재 청구 기간이 끝나면 종료됩니다. 더 이상 요금이 청구되지 않습니다.",
    ended: "구독이 종료되었습니다.",
    resume: "구독 유지하기",
    cancelledToast: "구독이 취소되었습니다 — 청구 기간이 끝날 때까지 사용 가능",
    resumedToast: "구독이 정상적으로 계속됩니다",
    failed: "구독을 업데이트하지 못해 변경된 내용이 없습니다. 다시 시도하거나 지원팀에 문의해 주세요.",
  },
};

export function cancelStrings(lang: string): CancelStrings {
  return STRINGS[lang] || STRINGS.en;
}

/** "October 19, 2026" in the dashboard language, or "" when the date is unknown. */
export function formatEndDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
  }
}
