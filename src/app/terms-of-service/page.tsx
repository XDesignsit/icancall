"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const TERMS_DICTS = {
  en: {
    back: "Back to Home",
    title: "Terms of Service",
    lastUpdated: "Last updated: June 18, 2026",
    loading: "Please wait while the terms of service are loaded. If they do not load, please",
    clickHere: "click here to view the terms of service",
    error: "There was an error loading the terms of service, please"
  },
  es: {
    back: "Volver al inicio",
    title: "Términos de servicio",
    lastUpdated: "Última actualización: 18 de junio de 2026",
    loading: "Por favor, espere mientras se cargan los términos de servicio. Si no se cargan, por favor",
    clickHere: "haga clic aquí para ver los términos de servicio",
    error: "Hubo un error al cargar los términos de servicio, por favor"
  },
  fr: {
    back: "Retour à l'accueil",
    title: "Conditions d'utilisation",
    lastUpdated: "Dernière mise à jour : 18 juin 2026",
    loading: "Veuillez patienter pendant le chargement des conditions d'utilisation. Si elles ne se chargent pas, veuillez",
    clickHere: "cliquer ici pour consulter les conditions d'utilisation",
    error: "Une erreur est survenue lors du chargement des conditions d'utilisation, veuillez"
  },
  ja: {
    back: "ホームに戻る",
    title: "利用規約",
    lastUpdated: "最終更新日: 2026年6月18日",
    loading: "利用規約が読み込まれるまでお待ちください。読み込まれない場合は、",
    clickHere: "こちらをクリックして利用規約を表示してください",
    error: "利用規約の読み込み中にエラーが発生しました。こちらを"
  },
  zh: {
    back: "返回首页",
    title: "服务条款",
    lastUpdated: "最后更新时间：2026年6月18日",
    loading: "服务条款正在加载，请稍候。如果未加载成功，请",
    clickHere: "点击此处查看服务条款",
    error: "加载服务条款时出错，请"
  },
  ar: {
    back: "العودة إلى الصفحة الرئيسية",
    title: "شروط الخدمة",
    lastUpdated: "آخر تحديث: 18 يونيو 2026",
    loading: "يرجى الانتظار أثناء تحميل شروط الخدمة. إذا لم يتم تحميلها، يرجى",
    clickHere: "الضغط هنا لعرض شروط الخدمة",
    error: "حدث خطأ أثناء تحميل شروط الخدمة، يرجى"
  },
  hi: {
    back: "होम पर वापस जाएं",
    title: "सेवा की शर्तें",
    lastUpdated: "अंतिम अद्यतन: 18 जून, 2026",
    loading: "सेवा की शर्तें लोड होने तक कृपया प्रतीक्षा करें। यदि वे लोड नहीं होती हैं, तो कृपया",
    clickHere: "सेवा की शर्तें देखने के लिए यहां क्लिक करें",
    error: "सेवा की शर्तें लोड करने में त्रुटि हुई, कृपया"
  },
  pt: {
    back: "Voltar para o início",
    title: "Termos de Serviço",
    lastUpdated: "Última atualização: 18 de junho de 2026",
    loading: "Por favor, aguarde enquanto os termos de serviço são carregados. Se não carregar, por favor",
    clickHere: "clique aqui para visualizar os termos de serviço",
    error: "Ocorreu um erro ao carregar os termos de serviço, por favor"
  },
  de: {
    back: "Zurück zur Startseite",
    title: "Nutzungsbedingungen",
    lastUpdated: "Zuletzt aktualisiert: 18. Juni 2026",
    loading: "Bitte warten Sie, während die Nutzungsbedingungen geladen werden. Wenn sie nicht geladen werden, bitte",
    clickHere: "hier klicken, um die Nutzungsbedingungen anzuzeigen",
    error: "Beim Laden der Nutzungsbedingungen ist ein Fehler aufgetreten. Bitte"
  },
  it: {
    back: "Torna alla home",
    title: "Termini di servizio",
    lastUpdated: "Ultimo aggiornamento: 18 giugno 2026",
    loading: "Attendere il caricamento dei termini di servizio. Se non si caricano, si prega di",
    clickHere: "fare clic qui per visualizzare i termini di servizio",
    error: "Si è verificato un errore durante il caricamento dei termini di servizio, si prega di"
  },
  ko: {
    back: "홈으로 돌아가기",
    title: "서비스 이용약관",
    lastUpdated: "최종 수정일: 2026년 6월 18일",
    loading: "이용약관이 로드되는 동안 잠시 기다려 주십시오. 로드되지 않는 경우,",
    clickHere: "여기를 클릭하여 이용약관을 확인하십시오",
    error: "이용약관을 로드하는 동안 오류가 발생했습니다. 여기를"
  }
};

export default function TermsOfServicePage() {
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

  const t = TERMS_DICTS[lang] || TERMS_DICTS.en;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const origin = window.location.href;
        const res = await fetch(
          `https://embed.termageddon.com/api/render/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09?origin=${encodeURIComponent(
            origin
          )}`
        );
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.text();
        setPolicyHtml(data);
      } catch (err) {
        console.error("Failed to load Termageddon terms of service:", err);
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
          id="VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
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
                aria-label="click here to view the terms of service"
                href="https://policies.termageddon.com/api/policy/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
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
                href="https://embed.termageddon.com/api/policy/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
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
