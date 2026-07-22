"use client";

import React, { useState, useRef, useEffect } from "react";
import { dashboardTranslations, type DashboardTranslations } from "@/lib/dashboardTranslations";
import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { planConfig, type PlanId } from "@/lib/planConfig";
import type {
  Account,
  CallLogEntry,
  Contact,
  CoverageSlot,
  Line,
  PickerNumber,
} from "./_types";
import { ICONS, Icon } from "./_icons";
import {
  Avatar,
  Badge,
  initials,
  Modal,
  StatCard,
  Toast,
  Toggle,
} from "./_primitives";
import {
  AVATAR_COLORS,
  ELEVENLABS_VOICE_GROUPS,
  getAcrossNumbersText,
  getLineDefaultLabel,
  getLocalizedLineLabel,
  getLocalizedPersonName,
  getLocalizedRelationship,
  STATUS_META,
} from "./_data";
import { AreaFlag, fetchNumbersLive } from "./_numbers";
import { AccountView } from "./views/AccountView";

/* ============ SUB VIEWS ============ */

/* Overview */
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
  plan: PlanId;
}) {
  const [modal, setModal] = useState<{ edit?: Contact } | null>(null);
  const contacts = line.contacts;
  const limit = planConfig(plan).contactsPerLine;
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

  async function ringConnect(c: Contact, _idx: number) {
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
  plan: PlanId;
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
    // Reseed the schedule only when switching lines; depending on line.schedule
    // would clobber in-progress edits whenever the schedule state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/* Care Team caregiver seats (owner-managed) */
/* ============ MAIN APPLICATION SHELL ============ */
// NAV and TITLES are built inside the component from translated strings; the
// English-only module-level copies were dead and have been removed.

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

  // Whether the signed-in user owns this account or is an invited Care Team
  // caregiver ("member"). Members manage lines/contacts/routing but not billing.
  const [viewerRole, setViewerRole] = useState<"owner" | "member">("owner");

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
        setViewerRole(profileData.role === "member" ? "member" : "owner");

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
            const baseLinesLimit = planConfig(currentAccount.plan).includedLines;
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
  const switchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (switchRef.current && !switchRef.current.contains(event.target as Node)) {
        setSwitchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
                {account.plan === "careteam"
                  ? (lang === "ja" ? "ケアチームプラン"
                   : lang === "zh" ? "护理团队方案"
                   : lang === "ar" ? "باقة فريق الرعاية"
                   : lang === "hi" ? "केयर टीम प्लान"
                   : lang === "ko" ? "케어 팀 플랜"
                   : "CARE TEAM PLAN")
                  : account.plan === "pro"
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
                {lines.length}/{planConfig(account.plan).includedLines + (account.addons?.extraNumbers || 0)} {d.common.numbers}
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
          <div ref={switchRef} className={`numswitch ${switchOpen ? "open" : ""}`}>
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
                      {index >= (planConfig(account.plan).includedLines) && (
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
                    if (account.plan !== "essential") {
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
              viewerRole={viewerRole}
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
                    const baseLinesCount = planConfig(prev.plan).includedLines;
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
                const baseLinesLimit = planConfig(account.plan).includedLines;
                const planName = account.plan === "careteam" ? "Care Team" : account.plan === "pro" ? "Pro" : "Essential";
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
                      ? `Nota: Esta línea está incluida en su plan ${planName} sin costo adicional.`
                      : lang === "fr"
                      ? `Remarque : Cette ligne est incluse dans votre forfait ${planName} sans frais supplémentaires.`
                      : `Note: This line is included in your ${planName} plan at no additional cost.`}
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

