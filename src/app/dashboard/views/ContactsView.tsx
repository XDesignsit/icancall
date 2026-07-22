"use client";

import React, { useState, useRef } from "react";

import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { planConfig, type PlanId } from "@/lib/planConfig";
import { AVATAR_COLORS, getLocalizedPersonName, getLocalizedRelationship } from "../_data";
import { Icon } from "../_icons";
import { Avatar, Modal, Toggle } from "../_primitives";
import { type Contact, type Line } from "../_types";


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

export function ContactsView({
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
