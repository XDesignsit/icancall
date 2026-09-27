"use client";

import React, { useState } from "react";

import { Badge } from "../_primitives";
import { type Account } from "../_types";

/*
 * Text call alerts (Account → Contact info). Turning them on texts a code to
 * the number; entering it is both proof the owner holds the number and the
 * opt-in consent carriers expect, so there is no way to switch alerts on for
 * a number without it (api/caregiver/sms-alerts, which the profile save
 * cannot bypass).
 */

type Strings = {
  title: string;
  sub: string;
  onAt: string;
  turnOff: string;
  consent: string;
  phoneLabel: string;
  sendCode: string;
  resend: string;
  codeLabel: string;
  verify: string;
  codeSent: string;
  turnedOn: string;
  turnedOff: string;
  failed: string;
};

const STRINGS: Record<string, Strings> = {
  en: {
    title: "Text alerts",
    sub: "Get a text when a call to your line is answered, missed or leaves a voicemail.",
    onAt: "Texts go to",
    turnOff: "Turn off",
    consent: "Text me call alerts at this number. I agree to receive SMS call alerts from iCanCall. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.",
    phoneLabel: "Mobile number",
    sendCode: "Send code",
    resend: "Resend",
    codeLabel: "Verification code",
    verify: "Verify",
    codeSent: "Code sent. Check your texts.",
    turnedOn: "Text alerts are on",
    turnedOff: "Text alerts are off",
    failed: "Something went wrong. Please try again.",
  },
  es: {
    title: "Alertas por SMS",
    sub: "Reciba un SMS cuando una llamada a su línea sea contestada, perdida o deje un mensaje de voz.",
    onAt: "Los SMS van a",
    turnOff: "Desactivar",
    consent: "Envíenme alertas de llamadas a este número. Acepto recibir alertas de llamadas por SMS de iCanCall. La frecuencia de los mensajes varía. Pueden aplicarse tarifas de mensajes y datos. Responda STOP para cancelar y HELP para obtener ayuda.",
    phoneLabel: "Número de móvil",
    sendCode: "Enviar código",
    resend: "Reenviar",
    codeLabel: "Código de verificación",
    verify: "Verificar",
    codeSent: "Código enviado. Revise sus mensajes.",
    turnedOn: "Alertas por SMS activadas",
    turnedOff: "Alertas por SMS desactivadas",
    failed: "Algo salió mal. Inténtelo de nuevo.",
  },
  fr: {
    title: "Alertes SMS",
    sub: "Recevez un SMS lorsqu'un appel vers votre ligne est pris, manqué ou laisse un message vocal.",
    onAt: "Les SMS sont envoyés au",
    turnOff: "Désactiver",
    consent: "Envoyez-moi les alertes d'appel à ce numéro. J'accepte de recevoir des alertes d'appel par SMS d'iCanCall. La fréquence des messages varie. Des frais de messagerie et de données peuvent s'appliquer. Répondez STOP pour vous désabonner, HELP pour obtenir de l'aide.",
    phoneLabel: "Numéro de mobile",
    sendCode: "Envoyer le code",
    resend: "Renvoyer",
    codeLabel: "Code de vérification",
    verify: "Vérifier",
    codeSent: "Code envoyé. Consultez vos SMS.",
    turnedOn: "Alertes SMS activées",
    turnedOff: "Alertes SMS désactivées",
    failed: "Une erreur s'est produite. Veuillez réessayer.",
  },
  ja: {
    title: "SMS通知",
    sub: "回線への着信が応答された、不在になった、または留守番電話が残されたときにSMSでお知らせします。",
    onAt: "SMSの送信先",
    turnOff: "オフにする",
    consent: "この番号に着信通知を送信してください。iCanCallからのSMS着信通知の受信に同意します。メッセージの頻度は変動します。メッセージおよびデータ通信料がかかる場合があります。配信停止はSTOP、ヘルプはHELPと返信してください。",
    phoneLabel: "携帯電話番号",
    sendCode: "コードを送信",
    resend: "再送信",
    codeLabel: "確認コード",
    verify: "確認",
    codeSent: "コードを送信しました。SMSをご確認ください。",
    turnedOn: "SMS通知をオンにしました",
    turnedOff: "SMS通知をオフにしました",
    failed: "問題が発生しました。もう一度お試しください。",
  },
  zh: {
    title: "短信通知",
    sub: "当您线路上的来电被接听、未接或留下语音留言时，给您发送短信。",
    onAt: "短信发送至",
    turnOff: "关闭",
    consent: "请将来电通知发送到此号码。我同意接收 iCanCall 的短信来电通知。短信频率不定。可能产生短信和数据费用。回复 STOP 退订，回复 HELP 获取帮助。",
    phoneLabel: "手机号码",
    sendCode: "发送验证码",
    resend: "重新发送",
    codeLabel: "验证码",
    verify: "验证",
    codeSent: "验证码已发送，请查看短信。",
    turnedOn: "短信通知已开启",
    turnedOff: "短信通知已关闭",
    failed: "出了点问题，请重试。",
  },
  ar: {
    title: "تنبيهات الرسائل النصية",
    sub: "احصل على رسالة نصية عند الرد على مكالمة إلى خطك أو تفويتها أو ترك بريد صوتي.",
    onAt: "تُرسل الرسائل إلى",
    turnOff: "إيقاف",
    consent: "أرسلوا لي تنبيهات المكالمات على هذا الرقم. أوافق على تلقي تنبيهات المكالمات عبر الرسائل النصية من iCanCall. يختلف معدل الرسائل. قد تنطبق رسوم الرسائل والبيانات. أرسل STOP لإلغاء الاشتراك وHELP للمساعدة.",
    phoneLabel: "رقم الجوال",
    sendCode: "إرسال الرمز",
    resend: "إعادة الإرسال",
    codeLabel: "رمز التحقق",
    verify: "تحقق",
    codeSent: "تم إرسال الرمز. تحقق من رسائلك.",
    turnedOn: "تم تشغيل تنبيهات الرسائل النصية",
    turnedOff: "تم إيقاف تنبيهات الرسائل النصية",
    failed: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
  hi: {
    title: "एसएमएस अलर्ट",
    sub: "जब आपकी लाइन पर कॉल का जवाब दिया जाए, कॉल छूट जाए या वॉयसमेल छोड़ा जाए, तब एसएमएस पाएं।",
    onAt: "एसएमएस यहां भेजे जाते हैं",
    turnOff: "बंद करें",
    consent: "इस नंबर पर मुझे कॉल अलर्ट भेजें। मैं iCanCall से एसएमएस कॉल अलर्ट प्राप्त करने के लिए सहमत हूं। संदेशों की आवृत्ति अलग-अलग होती है। संदेश और डेटा शुल्क लागू हो सकते हैं। बंद करने के लिए STOP और सहायता के लिए HELP लिखकर भेजें।",
    phoneLabel: "मोबाइल नंबर",
    sendCode: "कोड भेजें",
    resend: "फिर से भेजें",
    codeLabel: "सत्यापन कोड",
    verify: "सत्यापित करें",
    codeSent: "कोड भेजा गया। अपने संदेश देखें।",
    turnedOn: "एसएमएस अलर्ट चालू हैं",
    turnedOff: "एसएमएस अलर्ट बंद हैं",
    failed: "कुछ गलत हो गया। कृपया फिर से प्रयास करें।",
  },
  pt: {
    title: "Alertas por SMS",
    sub: "Receba um SMS quando uma chamada para sua linha for atendida, perdida ou deixar uma mensagem de voz.",
    onAt: "Os SMS vão para",
    turnOff: "Desativar",
    consent: "Envie-me alertas de chamadas para este número. Concordo em receber alertas de chamadas por SMS da iCanCall. A frequência das mensagens varia. Podem ser cobradas tarifas de mensagens e dados. Responda STOP para cancelar e HELP para obter ajuda.",
    phoneLabel: "Número de celular",
    sendCode: "Enviar código",
    resend: "Reenviar",
    codeLabel: "Código de verificação",
    verify: "Verificar",
    codeSent: "Código enviado. Verifique suas mensagens.",
    turnedOn: "Alertas por SMS ativados",
    turnedOff: "Alertas por SMS desativados",
    failed: "Algo deu errado. Tente novamente.",
  },
  de: {
    title: "SMS-Benachrichtigungen",
    sub: "Erhalten Sie eine SMS, wenn ein Anruf auf Ihrer Leitung angenommen, verpasst oder eine Sprachnachricht hinterlassen wird.",
    onAt: "SMS gehen an",
    turnOff: "Ausschalten",
    consent: "Senden Sie mir Anrufbenachrichtigungen an diese Nummer. Ich bin damit einverstanden, SMS-Anrufbenachrichtigungen von iCanCall zu erhalten. Die Häufigkeit der Nachrichten variiert. Es können Gebühren für Nachrichten und Daten anfallen. Antworten Sie mit STOP zum Abmelden und HELP für Hilfe.",
    phoneLabel: "Mobilnummer",
    sendCode: "Code senden",
    resend: "Erneut senden",
    codeLabel: "Bestätigungscode",
    verify: "Bestätigen",
    codeSent: "Code gesendet. Prüfen Sie Ihre SMS.",
    turnedOn: "SMS-Benachrichtigungen sind an",
    turnedOff: "SMS-Benachrichtigungen sind aus",
    failed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  },
  it: {
    title: "Avvisi SMS",
    sub: "Ricevi un SMS quando una chiamata alla tua linea riceve risposta, non riceve risposta o lascia un messaggio in segreteria.",
    onAt: "Gli SMS vanno al",
    turnOff: "Disattiva",
    consent: "Inviatemi gli avvisi di chiamata a questo numero. Accetto di ricevere avvisi di chiamata via SMS da iCanCall. La frequenza dei messaggi varia. Potrebbero essere applicati costi per messaggi e dati. Rispondi STOP per annullare l'iscrizione, HELP per assistenza.",
    phoneLabel: "Numero di cellulare",
    sendCode: "Invia codice",
    resend: "Invia di nuovo",
    codeLabel: "Codice di verifica",
    verify: "Verifica",
    codeSent: "Codice inviato. Controlla i tuoi SMS.",
    turnedOn: "Avvisi SMS attivati",
    turnedOff: "Avvisi SMS disattivati",
    failed: "Si è verificato un errore. Riprova.",
  },
  ko: {
    title: "SMS 문자 알림",
    sub: "회선으로 온 전화가 연결되거나, 부재중이 되거나, 음성 메시지가 남겨지면 문자로 알려드립니다.",
    onAt: "문자 수신 번호",
    turnOff: "끄기",
    consent: "이 번호로 통화 알림을 보내 주세요. iCanCall의 SMS 통화 알림 수신에 동의합니다. 메시지 빈도는 다를 수 있습니다. 메시지 및 데이터 요금이 부과될 수 있습니다. 수신 거부는 STOP, 도움말은 HELP로 회신하세요.",
    phoneLabel: "휴대전화 번호",
    sendCode: "코드 보내기",
    resend: "다시 보내기",
    codeLabel: "인증 코드",
    verify: "인증",
    codeSent: "코드를 보냈습니다. 문자를 확인하세요.",
    turnedOn: "SMS 문자 알림이 켜졌습니다",
    turnedOff: "SMS 문자 알림이 꺼졌습니다",
    failed: "문제가 발생했습니다. 다시 시도해 주세요.",
  },
};

/** +15551234567 -> (555) 123-4567 */
function display(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function SmsAlertsCard({
  account,
  setAccount,
  lang,
  showToast,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
  lang: string;
  showToast: (msg: string) => void;
}) {
  const t = STRINGS[lang] || STRINGS.en;
  const on = !!account.smsConsent && !!account.smsPhone;
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState(account.smsPhone || account.phone || "");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const post = async (body: Record<string, string>): Promise<{ smsPhone?: string } | null> => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/caregiver/sms-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t.failed);
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failed);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (await post({ action: "send", phone })) {
      setCodeSent(true);
      setCode("");
    }
  };

  const verify = async () => {
    const result = await post({ action: "verify", phone, code });
    if (!result) return;
    setAccount((prev) => ({ ...prev, smsConsent: true, smsPhone: result.smsPhone || prev.smsPhone }));
    setAgreed(false);
    setCodeSent(false);
    setCode("");
    showToast(t.turnedOn);
  };

  const turnOff = async () => {
    if (!(await post({ action: "disable" }))) return;
    setAccount((prev) => ({ ...prev, smsConsent: false }));
    showToast(t.turnedOff);
  };

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-head">
        <div>
          <h2>{t.title}</h2>
          <p>{t.sub}</p>
        </div>
        {on && <Badge kind="green">{t.onAt} {display(account.smsPhone || "")}</Badge>}
      </div>
      <div className="card-pad">
        {on ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={turnOff}>
              {t.turnOff}
            </button>
          </div>
        ) : (
          <>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setCodeSent(false);
                  setError("");
                }}
                style={{ width: 16, height: 16, flexShrink: 0, marginTop: 3, cursor: "pointer" }}
              />
              <span>{t.consent}</span>
            </label>

            {agreed && (
              <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
                <label>{t.phoneLabel}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel"
                    value={phone}
                    placeholder="(555) 867-5309"
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setCodeSent(false);
                    }}
                    disabled={busy}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary btn-sm" disabled={busy || phone.replace(/\D/g, "").length < 10} onClick={sendCode}>
                    {codeSent ? t.resend : t.sendCode}
                  </button>
                </div>
                {codeSent && (
                  <>
                    <div style={{ fontSize: "0.82rem", color: "var(--green)", marginTop: 6 }}>{t.codeSent}</div>
                    <label style={{ marginTop: 12 }}>{t.codeLabel}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        maxLength={6}
                        placeholder="123456"
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        disabled={busy}
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-primary btn-sm" disabled={busy || code.length !== 6} onClick={verify}>
                        {t.verify}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {error && <div style={{ fontSize: "0.82rem", color: "var(--rose)", marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}
