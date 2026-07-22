"use client";

import React, { useState } from "react";

import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { ELEVENLABS_VOICE_GROUPS, getLocalizedLineLabel, getLocalizedPersonName } from "../_data";
import { Icon } from "../_icons";
import { Toggle } from "../_primitives";
import { type Line } from "../_types";


/* Greetings & alerts */
export function SettingsView({
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

