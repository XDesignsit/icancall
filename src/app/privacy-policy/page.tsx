"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const POLICY_DICTS = {
  en: {
    back: "Back to Home",
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 18, 2026",
    loading: "Please wait while the policy is loaded. If it does not load, please",
    clickHere: "click here to view the policy",
    error: "There was an error loading this policy, please"
  },
  es: {
    back: "Volver al inicio",
    title: "Política de privacidad",
    lastUpdated: "Última actualización: 18 de junio de 2026",
    loading: "Por favor, espere mientras se carga la política. Si no se carga, por favor",
    clickHere: "haga clic aquí para ver la política",
    error: "Hubo un error al cargar esta política, por favor"
  },
  fr: {
    back: "Retour à l'accueil",
    title: "Politique de confidentialité",
    lastUpdated: "Dernière mise à jour : 18 juin 2026",
    loading: "Veuillez patienter pendant le chargement de la politique. Si elle ne se charge pas, veuillez",
    clickHere: "cliquer ici pour consulter la politique",
    error: "Une erreur est survenue lors du chargement de la politique, veuillez"
  },
  ja: {
    back: "ホームに戻る",
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日: 2026年6月18日",
    loading: "ポリシーが読み込まれるまでお待ちください。読み込まれない場合は、",
    clickHere: "こちらをクリックしてポリシーを表示してください",
    error: "ポリシーの読み込み中にエラーが発生しました。こちらを"
  },
  zh: {
    back: "返回首页",
    title: "隐私政策",
    lastUpdated: "最后更新时间：2026年6月18日",
    loading: "隐私政策正在加载，请稍候。如果未加载成功，请",
    clickHere: "点击此处查看隐私政策",
    error: "加载隐私政策时出错，请"
  },
  ar: {
    back: "العودة إلى الصفحة الرئيسية",
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: 18 يونيو 2026",
    loading: "يرجى الانتظار أثناء تحميل السياسة. إذا لم يتم تحميلها، يرجى",
    clickHere: "الضغط هنا لعرض السياسة",
    error: "حدث خطأ أثناء تحميل هذه السياسة، يرجى"
  },
  hi: {
    back: "होम पर वापस जाएं",
    title: "गोपनीयता नीति",
    lastUpdated: "अंतिम अद्यतन: 18 जून, 2026",
    loading: "नीति लोड होने तक कृपया प्रतीक्षा करें। यदि यह लोड नहीं होती है, तो कृपया",
    clickHere: "नीति देखने के लिए यहां क्लिक करें",
    error: "इस नीति को लोड करने में त्रुटि हुई, कृपया"
  },
  pt: {
    back: "Voltar para o início",
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: 18 de junho de 2026",
    loading: "Por favor, aguarde enquanto a política é carregada. Se não carregar, por favor",
    clickHere: "clique aqui para visualizar a política",
    error: "Ocorreu um erro ao carregar esta política, por favor"
  },
  de: {
    back: "Zurück zur Startseite",
    title: "Datenschutzerklärung",
    lastUpdated: "Zuletzt aktualisiert: 18. Juni 2026",
    loading: "Bitte warten Sie, während die Erklärung geladen wird. Wenn sie nicht geladen wird, bitte",
    clickHere: "hier klicken, um die Erklärung anzuzeigen",
    error: "Beim Laden dieser Erklärung ist ein Fehler aufgetreten. Bitte"
  },
  it: {
    back: "Torna alla home",
    title: "Informativa sulla privacy",
    lastUpdated: "Ultimo aggiornamento: 18 giugno 2026",
    loading: "Attendere il caricamento dell'informativa. Se non si carica, si prega di",
    clickHere: "fare clic qui per visualizzare l'informativa",
    error: "Si è verificato un errore durante il caricamento dell'informativa, si prega di"
  },
  ko: {
    back: "홈으로 돌아가기",
    title: "개인정보 처리방침",
    lastUpdated: "최종 수정일: 2026년 6월 18일",
    loading: "방침이 로드되는 동안 잠시 기다려 주십시오. 로드되지 않는 경우,",
    clickHere: "여기를 클릭하여 방침을 확인하십시오",
    error: "방침을 로드하는 동안 오류가 발생했습니다. 여기를"
  }
};

export default function PrivacyPolicyPage() {
  const [policyHtml, setPolicyHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
      const searchParams = new URLSearchParams(window.location.search);
      const paramLang = searchParams.get("lang");
      if (paramLang && validLangs.includes(paramLang)) {
        setLang(paramLang as typeof lang);
        localStorage.setItem("lang", paramLang);
      } else {
        const savedLang = localStorage.getItem("lang");
        if (savedLang && validLangs.includes(savedLang)) {
          setLang(savedLang as typeof lang);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = POLICY_DICTS[lang] || POLICY_DICTS.en;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const origin = window.location.href;
        const res = await fetch(
          `https://embed.termageddon.com/api/render/WVdVNVRHaENhRXczVkUwcmJHYzlQUT09?origin=${encodeURIComponent(
            origin
          )}`
        );
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.text();
        setPolicyHtml(data);
      } catch (err) {
        console.error("Failed to load Termageddon policy:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.985 0.005 220)",
        fontFamily: '"Outfit", "Helvetica Neue", Arial, sans-serif',
        padding: "48px 24px",
        color: "oklch(0.25 0.02 240)",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid oklch(0.92 0.01 225)",
          boxShadow: "0 10px 30px oklch(0.4 0.05 240 / 0.04)",
          padding: "40px 32px",
        }}
      >
        {/* Navigation */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href={lang ? `/?lang=${lang}` : "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "oklch(0.45 0.13 242)", // Brand accent color
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            ← {t.back}
          </Link>
        </div>

        {/* Header */}
        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 8,
            color: "oklch(0.20 0.02 245)",
          }}
        >
          {t.title}
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "oklch(0.55 0.015 240)",
            marginBottom: 40,
            borderBottom: "1px solid oklch(0.92 0.01 225)",
            paddingBottom: 20,
          }}
        >
          {t.lastUpdated}
        </p>

        {/* Termageddon Embed Container */}
        <div
          id="WVdVNVRHaENhRXczVkUwcmJHYzlQUT09"
          className="policy_embed_div"
          aria-live="polite"
          aria-busy={loading ? "true" : "false"}
          style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            color: "oklch(0.30 0.02 240)",
          }}
        >
          {loading && (
            <div>
              {t.loading}{" "}
              <a
                rel="nofollow"
                aria-label="click here to view the policy"
                href="https://policies.termageddon.com/api/policy/WVdVNVRHaENhRXczVkUwcmJHYzlQUT09"
                target="_blank"
                style={{ color: "oklch(0.45 0.13 242)", textDecoration: "underline" }}
              >
                {t.clickHere}
              </a>.
            </div>
          )}

          {!loading && error && (
            <div role="alert" style={{ color: "red" }}>
              {t.error}{" "}
              <a
                href="https://embed.termageddon.com/api/policy/WVdVNVRHaENhRXczVkUwcmJHYzlQUT09"
                target="_blank"
                style={{ color: "oklch(0.45 0.13 242)", textDecoration: "underline" }}
              >
                {t.clickHere}
              </a>.
            </div>
          )}

          {!loading && !error && policyHtml && (
            <div dangerouslySetInnerHTML={{ __html: policyHtml }} />
          )}
        </div>
      </div>
    </div>
  );
}


