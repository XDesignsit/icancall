"use client";

import React, { useEffect, useRef, useState } from "react";

import { voiceCloneTranslations } from "@/lib/voiceCloneTranslations";
import { type CustomVoice } from "@/lib/voices";
import { toWav } from "@/lib/wavEncoder";
import { Badge } from "../_primitives";
import { type Line } from "../_types";
import { PromptRecorder } from "./PromptRecorder";

/* "Your own voice": the account owner reads a script once and ElevenLabs
   clones their voice (api/caregiver/voice-clone). Every prompt on a line that
   uses it is then spoken in that voice, names included. */

// What api/caregiver/voice-clone accepts: long enough for a usable clone,
// short enough to upload (16 kHz mono WAV is 32 kB a second).
const MIN_SECONDS = 30;
const MAX_SECONDS = 120;
const CLONE_SAMPLE_RATE = 16000;

/** The reading, built from the line's own contacts so the clone hears their names. */
function buildScript(line: Line): string {
  const names = line.contacts.map((c) => c.name.trim()).filter(Boolean).slice(0, 3);
  while (names.length < 3) names.push(["Mom", "Dad", "Sarah"][names.length]);
  const [a, b, c] = names;
  const person = (line.person || "").split(" · ")[0].trim() || "our";
  const owner = person === "our" ? "our family's line" : `${person}'s family line`;
  return [
    `Hi, thank you for calling. You've reached ${owner}. Please hold on while we connect you.`,
    `Press 1 to reach your family's trusted contacts. Press 2 to leave a voice message for the family.`,
    `Press 1 for ${a}. Press 2 for ${b}. Press 3 for ${c}. Or press 9 to leave a voice message.`,
    `Calling ${a}. ${a} didn't answer. Calling ${b}. ${b} didn't answer. Calling ${c}.`,
    `Connecting you now. Please stand by. Another family member has already answered this call. Thank you.`,
    `Our family can't come to the phone right now. Please leave your message after the tone. When you're finished, you can hang up.`,
    `I set up this number so that anyone who calls can always reach one of us. We look out for each other, and we never want a call to go unanswered. If you're hearing my voice, someone is on the way to the phone. Thank you for your patience, and thank you for calling.`,
    `Most mornings start the same way for me: a cup of coffee, a short walk around the neighborhood, and a quick check-in with the family to make sure everyone is doing well. It's a simple routine, but it's the best part of my day.`,
  ].join("\n\n");
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VoiceCloneCard({
  line,
  setLine,
  lang,
  plan,
  customVoice,
  setCustomVoice,
  isOwner,
  showToast,
  onUpgrade,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  lang: string;
  plan: string;
  customVoice: CustomVoice | null;
  setCustomVoice: (voice: CustomVoice | null) => void;
  isOwner: boolean;
  showToast: (msg: string) => void;
  onUpgrade: () => void;
}) {
  const t = voiceCloneTranslations[lang as keyof typeof voiceCloneTranslations] || voiceCloneTranslations.en;
  const allowed = plan !== "essential";

  const [recordingNow, setRecordingNow] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"converting" | "creating" | "removing" | "sample" | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [rerecord, setRerecord] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const script = buildScript(line);
  const ownVoice = line.settings?.ownVoice === "recorded" ? "recorded" : "clone";
  const setOwnVoice = (mode: "clone" | "recorded") =>
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, settings: { ...l.settings, ownVoice: mode } } : l)));
  const usingOnLine = !!customVoice && line.settings?.voiceId === customVoice.id;

  // Stop the microphone and timer if the card goes away mid-recording.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const applyToLine = (voiceId: string) =>
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, settings: { ...l.settings, voiceId } } : l)));

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    try {
      recorder.requestData(); // flush the last chunk (Safari)
    } catch {
      /* not every browser allows it here */
    }
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingNow(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const seconds = (Date.now() - startedAtRef.current) / 1000;
        const raw = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (raw.size === 0) {
          showToast(t.errMic);
          return;
        }
        setBusy("converting");
        try {
          const wav = await toWav(raw, CLONE_SAMPLE_RATE);
          setTake({ blob: wav, url: URL.createObjectURL(wav), seconds });
        } catch (err) {
          console.error("Could not convert the voice recording:", err);
          showToast(t.errFailed);
        } finally {
          setBusy(null);
        }
      };
      setTake(null);
      setSampleUrl(null);
      startedAtRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(s);
        if (s >= MAX_SECONDS) stopRecording();
      }, 250);
      recorder.start(100); // regular chunks, needed for Safari
      setRecordingNow(true);
    } catch (err) {
      console.error("Could not start the voice recording:", err);
      showToast(t.errMic);
    }
  };

  const createVoice = async () => {
    if (!take || !consent) return;
    setBusy("creating");
    try {
      const form = new FormData();
      form.append("audio", take.blob, "reading.wav");
      form.append("consent", "true");
      const res = await fetch("/api/caregiver/voice-clone", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.voiceId) {
        const messages: Record<string, string> = {
          permissions: t.errPermissions,
          unconfigured: t.errPermissions,
          voice_limit: t.errLimit,
          too_short: t.tooShort,
          plan: t.planLocked,
          owner_only: t.ownerOnly,
          rejected: t.errRejected,
          audio: t.errRejected,
          too_long: t.errRejected,
        };
        showToast(messages[data.error as string] || t.errFailed);
        return;
      }
      setCustomVoice({ id: data.voiceId, createdAt: new Date().toISOString() });
      applyToLine(data.voiceId);
      setTake(null);
      setConsent(false);
      setRerecord(false);
      showToast(t.created);
    } catch (err) {
      console.error("Voice clone request failed:", err);
      showToast(t.errFailed);
    } finally {
      setBusy(null);
    }
  };

  const playSample = async () => {
    if (!customVoice) return;
    setBusy("sample");
    try {
      const first = line.contacts.find((c) => c.name.trim())?.name.trim() || "Mom";
      const res = await fetch("/api/caregiver/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hi, this is how your callers will hear me. Calling ${first} now. Please stand by.`,
          contactId: `voice_sample_${line.id}`,
          voiceId: customVoice.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.audioUrl) throw new Error(data.error || `HTTP ${res.status}`);
      setSampleUrl(data.audioUrl);
    } catch (err) {
      console.error("Voice sample failed:", err);
      showToast(t.errFailed);
    } finally {
      setBusy(null);
    }
  };

  const removeVoice = async () => {
    if (!customVoice || !window.confirm(t.removeConfirm)) return;
    setBusy("removing");
    try {
      const res = await fetch("/api/caregiver/voice-clone", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const removedId = customVoice.id;
      // Lines that used it go back to the standard voice.
      setLine((prev) => prev.map((l) => {
        if (l.settings?.voiceId !== removedId) return l;
        const settings = { ...l.settings };
        delete settings.voiceId;
        return { ...l, settings };
      }));
      setCustomVoice(null);
      setSampleUrl(null);
      showToast(t.removed);
    } catch (err) {
      console.error("Voice removal failed:", err);
      showToast(t.errFailed);
    } finally {
      setBusy(null);
    }
  };

  const showRecorder = isOwner && allowed && ownVoice === "clone" && (!customVoice || rerecord);
  const enoughAudio = !!take && take.seconds >= MIN_SECONDS;

  return (
    <div className="card section-gap">
      <div className="card-head">
        <div>
          <h2>{t.title}</h2>
          <p>{t.cardSub}</p>
        </div>
        {!allowed && <Badge kind="blue">PRO</Badge>}
      </div>
      <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!allowed && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: "var(--ink-soft)" }}>{t.planLocked}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={onUpgrade}>{t.upgrade}</button>
          </div>
        )}

        {allowed && (
          <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {([
              { id: "clone", title: t.optionClone, desc: t.optionCloneDesc },
              { id: "recorded", title: t.optionRecord, desc: t.optionRecordDesc },
            ] as const).map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={ownVoice === o.id}
                onClick={() => setOwnVoice(o.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  border: ownVoice === o.id ? "2px solid var(--accent)" : "1px solid var(--line)",
                  background: ownVoice === o.id ? "var(--bg)" : "transparent",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                <b style={{ display: "block" }}>{o.title}</b>
                <span style={{ display: "block", marginTop: 4, fontSize: "0.86rem", color: "var(--ink-soft)" }}>{o.desc}</span>
              </button>
            ))}
          </div>
        )}

        {allowed && ownVoice === "recorded" && (
          <PromptRecorder line={line} setLine={setLine} t={t} hasClone={usingOnLine} showToast={showToast} />
        )}

        {allowed && ownVoice === "clone" && !isOwner && <p style={{ margin: 0, color: "var(--ink-soft)" }}>{t.ownerOnly}</p>}

        {allowed && ownVoice === "clone" && customVoice && !rerecord && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <b>{t.ready}</b>
                {customVoice.createdAt && (
                  <p style={{ margin: "2px 0 0", fontSize: "0.86rem", color: "var(--ink-soft)" }}>
                    {t.createdOn.replace("{date}", new Date(customVoice.createdAt).toLocaleDateString(lang))}
                  </p>
                )}
              </div>
              {usingOnLine ? (
                <span className="badge badge-green">{t.inUse}</span>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => applyToLine(customVoice.id)}>{t.useOnLine}</button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={playSample} disabled={busy !== null}>
                {busy === "sample" ? t.loadingSample : t.playSample}
              </button>
              {sampleUrl && <audio src={sampleUrl} controls autoPlay style={{ height: 32, maxWidth: 260 }} />}
              {isOwner && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRerecord(true)} disabled={busy !== null}>{t.recordAgain}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={removeVoice} disabled={busy !== null} style={{ color: "var(--rose, oklch(0.55 0.18 25))" }}>
                    {t.remove}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {showRecorder && (
          <>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-soft)" }}>{t.tips}</p>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                <label style={{ fontWeight: 600 }}>{t.scriptLabel}</label>
                <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>{t.scriptNote}</span>
              </div>
              <div
                lang="en"
                dir="ltr"
                style={{
                  whiteSpace: "pre-wrap",
                  maxHeight: 280,
                  overflowY: "auto",
                  padding: "14px 16px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  background: "var(--bg)",
                  fontSize: "1rem",
                  lineHeight: 1.65,
                }}
              >
                {script}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {recordingNow ? (
                <>
                  <button type="button" className="btn btn-primary btn-sm" onClick={stopRecording}>{t.stop}</button>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontVariantNumeric: "tabular-nums" }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.6 0.2 25)" }} />
                    {formatTime(elapsed)} / {formatTime(MAX_SECONDS)}
                  </span>
                  {elapsed < MIN_SECONDS && <span style={{ fontSize: "0.86rem", color: "var(--ink-soft)" }}>{t.tooShort}</span>}
                </>
              ) : (
                <button type="button" className={`btn ${take ? "btn-ghost" : "btn-primary"} btn-sm`} onClick={startRecording} disabled={busy !== null}>
                  {take ? t.recordAgain : t.record}
                </button>
              )}
              {take && !recordingNow && <audio src={take.url} controls style={{ height: 32, maxWidth: 260 }} />}
              {take && !recordingNow && !enoughAudio && (
                <span style={{ fontSize: "0.86rem", color: "var(--ink-soft)" }}>{t.tooShort}</span>
              )}
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.9rem", cursor: "pointer" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
              <span>{t.consent}</span>
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={createVoice}
                disabled={!enoughAudio || !consent || recordingNow || busy !== null}
              >
                {t.create}
              </button>
              {customVoice && rerecord && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { stopRecording(); setTake(null); setRerecord(false); }} disabled={busy === "creating"}>
                  {t.cancel}
                </button>
              )}
              {busy === "creating" && <span style={{ fontSize: "0.86rem", color: "var(--ink-soft)" }}>{t.creating}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
