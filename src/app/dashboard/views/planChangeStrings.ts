// Copy for the plan-change flow in AccountView. Which billing notice applies is
// decided by how the change will be billed (see api/creem/change-plan).

export type PlanChangeMode = "subscription" | "checkout" | "simulated";

interface PlanChangeStrings {
  chargedNow: string;
  noChargeNow: string;
  viaCheckout: string;
  simulated: string;
  failed: string;
  updating: string;
  annualConfirm: string;
}

const STRINGS: Record<string, PlanChangeStrings> = {
  en: {
    chargedNow: "Your payment method on file will be charged the prorated difference today.",
    noChargeNow: "No charge today. The unused portion of your current plan is refunded to your original payment method.",
    viaCheckout: "You'll be taken to our secure checkout to complete payment. Your plan changes once payment succeeds.",
    simulated: "Demo account — no payment will be taken.",
    failed: "We couldn't update your subscription, so your plan was not changed. Please try again.",
    updating: "Updating…",
    annualConfirm: "Are you sure you want to switch to annual billing?",
  },
  es: {
    chargedNow: "Hoy se cobrará la diferencia prorrateada a su método de pago registrado.",
    noChargeNow: "Sin cargo hoy. La parte no utilizada de su plan actual se reembolsará a su método de pago original.",
    viaCheckout: "Le llevaremos a nuestro pago seguro para completar la compra. Su plan cambiará cuando el pago se confirme.",
    simulated: "Cuenta de demostración: no se realizará ningún cobro.",
    failed: "No pudimos actualizar su suscripción, por lo que su plan no ha cambiado. Inténtelo de nuevo.",
    updating: "Actualizando…",
    annualConfirm: "¿Está seguro de que desea cambiar a la facturación anual?",
  },
  fr: {
    chargedNow: "Votre mode de paiement enregistré sera débité aujourd'hui de la différence au prorata.",
    noChargeNow: "Aucun débit aujourd'hui. La part non utilisée de votre forfait actuel est remboursée sur votre mode de paiement d'origine.",
    viaCheckout: "Vous serez redirigé vers notre paiement sécurisé. Votre forfait changera une fois le paiement confirmé.",
    simulated: "Compte de démonstration — aucun paiement ne sera prélevé.",
    failed: "Nous n'avons pas pu mettre à jour votre abonnement ; votre forfait n'a pas changé. Veuillez réessayer.",
    updating: "Mise à jour…",
    annualConfirm: "Êtes-vous sûr de vouloir passer à la facturation annuelle ?",
  },
  ja: {
    chargedNow: "登録済みのお支払い方法に、日割りの差額が本日請求されます。",
    noChargeNow: "本日の請求はありません。現在のプランの未使用分は、元のお支払い方法に返金されます。",
    viaCheckout: "安全な決済ページに移動してお支払いを完了します。お支払いの完了後にプランが変更されます。",
    simulated: "デモアカウントのため、請求は発生しません。",
    failed: "サブスクリプションを更新できなかったため、プランは変更されていません。もう一度お試しください。",
    updating: "更新中…",
    annualConfirm: "年間請求に切り替えてもよろしいですか？",
  },
  zh: {
    chargedNow: "今天将从您登记的付款方式中扣除按比例计算的差额。",
    noChargeNow: "今天不会扣款。当前方案未使用的部分将退还到您原来的付款方式。",
    viaCheckout: "您将前往我们的安全结账页面完成付款。付款成功后方案才会变更。",
    simulated: "演示账户——不会产生任何扣款。",
    failed: "我们无法更新您的订阅，因此您的方案未更改。请重试。",
    updating: "正在更新…",
    annualConfirm: "确定要切换为按年计费吗？",
  },
  ar: {
    chargedNow: "سيتم اليوم خصم الفرق التناسبي من وسيلة الدفع المسجلة.",
    noChargeNow: "لا توجد رسوم اليوم. سيتم رد الجزء غير المستخدم من باقتك الحالية إلى وسيلة الدفع الأصلية.",
    viaCheckout: "سننقلك إلى صفحة الدفع الآمنة لإتمام الدفع. ستتغير باقتك بعد نجاح الدفع.",
    simulated: "حساب تجريبي — لن يتم خصم أي مبلغ.",
    failed: "تعذر تحديث اشتراكك، لذلك لم تتغير باقتك. يرجى المحاولة مرة أخرى.",
    updating: "جارٍ التحديث…",
    annualConfirm: "هل أنت متأكد أنك تريد التحول إلى الفوترة السنوية؟",
  },
  hi: {
    chargedNow: "आपकी दर्ज भुगतान विधि से आज आनुपातिक अंतर का शुल्क लिया जाएगा।",
    noChargeNow: "आज कोई शुल्क नहीं। आपके वर्तमान प्लान का अप्रयुक्त हिस्सा आपकी मूल भुगतान विधि में वापस कर दिया जाएगा।",
    viaCheckout: "भुगतान पूरा करने के लिए आपको हमारे सुरक्षित चेकआउट पर ले जाया जाएगा। भुगतान सफल होने पर आपका प्लान बदल जाएगा।",
    simulated: "डेमो खाता — कोई भुगतान नहीं लिया जाएगा।",
    failed: "हम आपकी सदस्यता अपडेट नहीं कर सके, इसलिए आपका प्लान नहीं बदला गया। कृपया पुनः प्रयास करें।",
    updating: "अपडेट हो रहा है…",
    annualConfirm: "क्या आप वाकई वार्षिक बिलिंग पर स्विच करना चाहते हैं?",
  },
  pt: {
    chargedNow: "A diferença proporcional será cobrada hoje no seu método de pagamento cadastrado.",
    noChargeNow: "Nenhuma cobrança hoje. A parte não utilizada do seu plano atual será reembolsada no método de pagamento original.",
    viaCheckout: "Você será levado ao nosso checkout seguro para concluir o pagamento. Seu plano muda assim que o pagamento for confirmado.",
    simulated: "Conta de demonstração — nenhum pagamento será cobrado.",
    failed: "Não foi possível atualizar sua assinatura, portanto seu plano não foi alterado. Tente novamente.",
    updating: "Atualizando…",
    annualConfirm: "Tem certeza de que deseja mudar para a cobrança anual?",
  },
  de: {
    chargedNow: "Ihre hinterlegte Zahlungsmethode wird heute mit der anteiligen Differenz belastet.",
    noChargeNow: "Heute erfolgt keine Belastung. Der nicht genutzte Teil Ihres aktuellen Tarifs wird auf Ihre ursprüngliche Zahlungsmethode erstattet.",
    viaCheckout: "Sie werden zu unserem sicheren Checkout weitergeleitet. Ihr Tarif ändert sich, sobald die Zahlung erfolgreich war.",
    simulated: "Demokonto – es wird keine Zahlung eingezogen.",
    failed: "Wir konnten Ihr Abonnement nicht aktualisieren; Ihr Tarif wurde nicht geändert. Bitte versuchen Sie es erneut.",
    updating: "Wird aktualisiert…",
    annualConfirm: "Möchten Sie wirklich zur jährlichen Abrechnung wechseln?",
  },
  it: {
    chargedNow: "Oggi verrà addebitata la differenza proporzionale sul tuo metodo di pagamento registrato.",
    noChargeNow: "Nessun addebito oggi. La parte non utilizzata del piano attuale verrà rimborsata sul metodo di pagamento originale.",
    viaCheckout: "Verrai indirizzato al nostro checkout sicuro per completare il pagamento. Il piano cambierà a pagamento avvenuto.",
    simulated: "Account dimostrativo — non verrà effettuato alcun addebito.",
    failed: "Non siamo riusciti ad aggiornare il tuo abbonamento, quindi il piano non è cambiato. Riprova.",
    updating: "Aggiornamento…",
    annualConfirm: "Sei sicuro di voler passare alla fatturazione annuale?",
  },
  ko: {
    chargedNow: "등록된 결제 수단으로 일할 계산된 차액이 오늘 청구됩니다.",
    noChargeNow: "오늘은 청구되지 않습니다. 현재 플랜의 미사용분은 원래 결제 수단으로 환불됩니다.",
    viaCheckout: "안전한 결제 페이지로 이동하여 결제를 완료합니다. 결제가 완료되면 플랜이 변경됩니다.",
    simulated: "데모 계정 — 결제가 이루어지지 않습니다.",
    failed: "구독을 업데이트하지 못해 플랜이 변경되지 않았습니다. 다시 시도해 주세요.",
    updating: "업데이트 중…",
    annualConfirm: "연간 결제로 전환하시겠습니까?",
  },
};

export function planChangeStrings(lang: string): PlanChangeStrings {
  return STRINGS[lang] || STRINGS.en;
}

/** The billing notice for a pending change, or "" while the billing mode is still loading. */
export function planChangeNotice(lang: string, mode: PlanChangeMode | null, chargedNow: boolean): string {
  const s = planChangeStrings(lang);
  if (mode === "simulated") return s.simulated;
  if (mode === "checkout") return s.viaCheckout;
  if (mode === "subscription") return chargedNow ? s.chargedNow : s.noChargeNow;
  return "";
}
