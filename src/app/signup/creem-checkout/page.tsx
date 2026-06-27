"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const CHEKOUT_TEXTS: Record<string, Record<string, string>> = {
  en: {
    testMode: "Test Mode",
    orderSum: "Order Summary",
    subscr: "Subscription",
    billedAnnually: "Billed annually",
    billedMonthly: "Billed monthly",
    cardholderName: "Cardholder Name",
    cardNumber: "Card Number",
    expiry: "Expiry Date",
    cvc: "CVC",
    processing: "Processing Securely...",
    approved: "✓ Payment Approved",
    paySecurely: "Pay {amount} Securely",
    footerHtml: "Payments processed securely via <b>Creem.io</b>.<br />By subscribing, you agree to our Terms of Service and Privacy Policy.",
    placeholderName: "Maria Delgado",
  },
  es: {
    testMode: "Modo Prueba",
    orderSum: "Resumen del Pedido",
    subscr: "Suscripción",
    billedAnnually: "Facturado anualmente",
    billedMonthly: "Facturado mensualmente",
    cardholderName: "Nombre del Titular",
    cardNumber: "Número de Tarjeta",
    expiry: "Fecha de Vencimiento",
    cvc: "CVC",
    processing: "Procesando de Forma Segura...",
    approved: "✓ Pago Aprobado",
    paySecurely: "Pagar {amount} de Forma Segura",
    footerHtml: "Pagos procesados de forma segura a través de <b>Creem.io</b>.<br />Al suscribirse, acepta nuestros Términos de Servicio y Política de Privacidad.",
    placeholderName: "Maria Delgado",
  },
  fr: {
    testMode: "Mode Test",
    orderSum: "Résumé de la Commande",
    subscr: "Abonnement",
    billedAnnually: "Facturé annuellement",
    billedMonthly: "Facturé mensuellement",
    cardholderName: "Nom du Titulaire",
    cardNumber: "Numéro de Carte",
    expiry: "Date d'Expiration",
    cvc: "CVC",
    processing: "Traitement Sécurisé...",
    approved: "✓ Paiement Approuvé",
    paySecurely: "Payer {amount} en toute Sécurité",
    footerHtml: "Paiements sécurisés via <b>Creem.io</b>.<br />En vous abonnant, vous acceptez nos Conditions d'Utilisation et notre Politique de Confidentialité.",
    placeholderName: "Maria Delgado",
  },
  ja: {
    testMode: "テストモード",
    orderSum: "注文内容",
    subscr: "サブスクリプション",
    billedAnnually: "年間請求",
    billedMonthly: "月間請求",
    cardholderName: "カード名義人",
    cardNumber: "カード番号",
    expiry: "有効期限",
    cvc: "セキュリティコード",
    processing: "安全に処理中...",
    approved: "✓ 決済承認済み",
    paySecurely: "{amount}を安全に支払う",
    footerHtml: "<b>Creem.io</b> を通じて安全に決済されます。<br />定期購入することにより、利用規約とプライバシーポリシーに同意したことになります。",
    placeholderName: "デルガド マリア",
  },
  zh: {
    testMode: "测试模式",
    orderSum: "订单摘要",
    subscr: "订阅",
    billedAnnually: "按年计费",
    billedMonthly: "按月计费",
    cardholderName: "持卡人姓名",
    cardNumber: "卡号",
    expiry: "有效期",
    cvc: "CVC",
    processing: "安全处理中...",
    approved: "✓ 支付成功",
    paySecurely: "安全支付 {amount}",
    footerHtml: "支付通过 <b>Creem.io</b> 安全处理。<br />订阅即表示您同意我们的服务条款和隐私政策。",
    placeholderName: "张伟",
  },
  ar: {
    testMode: "وضع التجربة",
    orderSum: "ملخص الطلب",
    subscr: "اشتراك",
    billedAnnually: "فاتورة سنوية",
    billedMonthly: "فاتورة شهرية",
    cardholderName: "اسم صاحب البطاقة",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ انتهاء الصلاحية",
    cvc: "رمز الأمان",
    processing: "جاري المعالجة بأمان...",
    approved: "✓ تم الموافقة على الدفع",
    paySecurely: "دفع {amount} بأمان",
    footerHtml: "يتم معالجة المدفوعات بأمان عبر <b>Creem.io</b>.<br />بالاشتراك، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.",
    placeholderName: "ماريا ديلغادو",
  },
  hi: {
    testMode: "परीक्षण मोड",
    orderSum: "ऑर्डर सारांश",
    subscr: "सदस्यता",
    billedAnnually: "वार्षिक बिलिंग",
    billedMonthly: "मासिक बिलिंग",
    cardholderName: "कार्डधारक का नाम",
    cardNumber: "कार्ड नंबर",
    expiry: "समाप्ति तिथि",
    cvc: "सीवीसी",
    processing: "सुरक्षित रूप से संसाधित हो रहा है...",
    approved: "✓ भुगतान स्वीकृत",
    paySecurely: "{amount} सुरक्षित रूप से भुगतान करें",
    footerHtml: "<b>Creem.io</b> के माध्यम से भुगतान सुरक्षित रूप से संसाधित किया गया।<br />सदस्यता लेकर, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं।",
    placeholderName: "मारिया डेलगाडो",
  },
  pt: {
    testMode: "Modo de Teste",
    orderSum: "Resumo do Pedido",
    subscr: "Assinatura",
    billedAnnually: "Faturado anualmente",
    billedMonthly: "Faturado mensalmente",
    cardholderName: "Nome do Titular",
    cardNumber: "Número do Cartão",
    expiry: "Data de Validade",
    cvc: "CVC",
    processing: "Processando com Segurança...",
    approved: "✓ Pagamento Aprovado",
    paySecurely: "Pagar {amount} com Segurança",
    footerHtml: "Pagamentos processados com segurança via <b>Creem.io</b>.<br />Ao assinar, você concorda com nossos Termos de Serviço e Política de Privacidade.",
    placeholderName: "Maria Delgado",
  },
  de: {
    testMode: "Testmodus",
    orderSum: "Bestellübersicht",
    subscr: "Abonnement",
    billedAnnually: "Jährliche Abrechnung",
    billedMonthly: "Monatliche Abrechnung",
    cardholderName: "Name des Karteninhabers",
    cardNumber: "Kartennummer",
    expiry: "Gültig bis",
    cvc: "CVC",
    processing: "Sichere Verarbeitung...",
    approved: "✓ Zahlung genehmigt",
    paySecurely: "Sicher bezahlen ({amount})",
    footerHtml: "Zahlungen werden sicher über <b>Creem.io</b> abgewickelt.<br />Mit dem Abonnement stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.",
    placeholderName: "Maria Delgado",
  },
  it: {
    testMode: "Modalità Test",
    orderSum: "Riepilogo Ordine",
    subscr: "Abbonamento",
    billedAnnually: "Fatturato annualmente",
    billedMonthly: "Fatturato mensilmente",
    cardholderName: "Nome del Titolare",
    cardNumber: "Numero di Carta",
    expiry: "Data di Scadenza",
    cvc: "CVC",
    processing: "Elaborazione Sicura...",
    approved: "✓ Pagamento Approvato",
    paySecurely: "Paga {amount} in Sicurezza",
    footerHtml: "Pagamenti elaborati in sicurezza tramite <b>Creem.io</b>.<br />Iscrivendoti, accetti i nostri Termini di Servizio e l'Informativa sulla Privacy.",
    placeholderName: "Maria Delgado",
  },
  ko: {
    testMode: "테스트 모드",
    orderSum: "주문 내역",
    subscr: "구독",
    billedAnnually: "연간 청구",
    billedMonthly: "월간 청구",
    cardholderName: "카드 소유자 이름",
    cardNumber: "카드 번호",
    expiry: "만료일",
    cvc: "CVC",
    processing: "안전하게 처리 중...",
    approved: "✓ 결제 승인됨",
    paySecurely: "{amount} 안전하게 결제",
    footerHtml: "<b>Creem.io</b>를 통해 안전하게 결제가 처리됩니다.<br />구독 시 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.",
    placeholderName: "마리아 델가도",
  }
};

function CreemCheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "monthly";
  const langParam = searchParams.get("lang") || "en";

  const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
  const lang = validLangs.includes(langParam) ? langParam : "en";
  const c = CHEKOUT_TEXTS[lang] || CHEKOUT_TEXTS.en;

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const priceLabel = plan === "pro" 
    ? (billing === "yearly" ? "$249/yr" : "$24.99/mo")
    : (billing === "yearly" ? "$149/yr" : "$14.99/mo");

  const planName = plan === "pro" ? "Pro Circle" : "Essential Solo";

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Notify parent window (iframe communication)
      if (window.parent) {
        window.parent.postMessage({ type: "CREEM_PAYMENT_SUCCESS" }, "*");
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#2c3e50] p-6 font-sans flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden">
        {/* Creem.io Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded bg-[#10b981] flex items-center justify-center font-bold text-sm text-white">c</span>
            <span className="font-semibold tracking-tight text-sm">creem<span className="text-[#a1a1aa]">.io</span></span>
          </div>
          <span className="text-xs bg-[#334155] px-2 py-0.5 rounded text-[#cbd5e1] font-mono uppercase tracking-wider">{c.testMode}</span>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-5 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{planName} {c.subscr}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{billing === "yearly" ? c.billedAnnually : c.billedMonthly}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{priceLabel.split("/")[0]}</span>
              <span className="text-xs text-slate-500 block">/ {priceLabel.split("/")[1]}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePay} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{c.cardholderName}</label>
            <input
              type="text"
              required
              placeholder={c.placeholderName}
              className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{c.cardNumber}</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={19}
                placeholder="4111 2222 3333 4444"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg pl-3.5 pr-10 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = val.replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(formatted);
                }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold uppercase font-mono">Visa</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{c.expiry}</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="MM/YY"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={expiry}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  const formatted = val.length > 2 ? val.slice(0, 2) + "/" + val.slice(2) : val;
                  setExpiry(formatted);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{c.cvc}</label>
              <input
                type="password"
                required
                maxLength={3}
                placeholder="123"
                className="w-full text-sm border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] transition font-mono"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 px-4 rounded-lg font-semibold text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {c.processing}
              </>
            ) : success ? (
              c.approved
            ) : (
              c.paySecurely.replace("{amount}", priceLabel.split("/")[0])
            )}
          </button>
        </form>

        {/* Compliance Footer */}
        <div 
          className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] text-center text-[10px] text-slate-400 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: c.footerHtml }}
        />
      </div>
    </div>
  );
}

export default function CreemCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Checkout...</div>}>
      <CreemCheckoutContent />
    </Suspense>
  );
}
