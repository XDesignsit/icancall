"use client";

import React, { useEffect, useRef, useState } from "react";

import { promptRecordingsOf, promptScript, type ScriptGroup } from "@/lib/promptRecordings";
import { type VoiceCloneStrings } from "@/lib/voiceCloneTranslations";
import { toPhoneWav } from "@/lib/wavEncoder";
import { type Line } from "../_types";

/* "Record each prompt": every sentence the line's callers can hear, recorded
   one at a time (lib/promptRecordings). A take is uploaded as soon as it is
   stopped and filed under the sentence it says. */

// No prompt runs this long; it stops a recorder someone forgot about.
const MAX_TAKE_SECONDS = 25;

export function PromptRecorder({
  line,
  setLine,
  t,
  hasClone,
  showToast,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  t: VoiceCloneStrings;
  hasClone: boolean;
  showToast: (msg: string) => void;
}) {
  const script = promptScript(line);
  const recordings = promptRecordingsOf(line.settings);
  const done = script.filter((s) => recordings[s.text]).length;

  const [active, setActive] = useState<string | null>(null); // the sentence being recorded
  const [saving, setSaving] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Record<string, string>>({}); // sentence -> local playback URL
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  /** Stores a take for a sentence, dropping takes no longer in the script (renamed contacts). */
  const saveTake = (text: string, path: string | null) =>
    setLine((prev) => prev.map((l) => {
      if (l.id !== line.id) return l;
      const current = new Set(promptScript(l).map((s) => s.text));
      const kept = Object.fromEntries(Object.entries(promptRecordingsOf(l.settings)).filter(([k]) => current.has(k) && k !== text));
      if (path) kept[text] = { path, recordedAt: new Date().toISOString() };
      return { ...l, settings: { ...l.settings, promptRecordings: kept } };
    }));

  const stop = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    try {
      recorder.requestData(); // flush the last chunk (Safari)
    } catch {
      /* not every browser allows it here */
    }
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(null);
  };

  const record = async (text: string) => {
    if (active) stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const raw = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (raw.size === 0) {
          showToast(t.errMic);
          return;
        }
        setSaving(text);
        try {
          const wav = await toPhoneWav(raw);
          const form = new FormData();
          form.append("audio", wav, "prompt.wav");
          form.append("contactId", `prompt_${line.id}_${Date.now()}`);
          const res = await fetch("/api/caregiver/upload-recording", { method: "POST", body: form });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.filePath) throw new Error(data.error || `HTTP ${res.status}`);
          saveTake(text, data.filePath);
          setFresh((prev) => ({ ...prev, [text]: URL.createObjectURL(wav) }));
        } catch (err) {
          console.error("Prompt recording upload failed:", err);
          showToast(t.uploadFailed);
        } finally {
          setSaving(null);
        }
      };
      recorder.start(100); // regular chunks, needed for Safari
      setActive(text);
      timerRef.current = setTimeout(stop, MAX_TAKE_SECONDS * 1000);
    } catch (err) {
      console.error("Could not start the prompt recording:", err);
      showToast(t.errMic);
    }
  };

  const play = (text: string) => {
    const src = fresh[text] || `/api/caregiver/prompt-audio?path=${encodeURIComponent(recordings[text]?.path || "")}`;
    void new Audio(src).play().catch(() => showToast(t.errFailed));
  };

  const groups: { id: ScriptGroup; label: string }[] = [
    { id: "every", label: t.groupEvery },
    { id: "method", label: t.groupMethod },
    { id: "contacts", label: t.groupContacts },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-soft)" }}>
          {t.recordHint} {hasClone ? t.fallbackClone : t.fallbackVoice}
        </p>
        <b style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {t.progress.replace("{done}", String(done)).replace("{total}", String(script.length))}
        </b>
      </div>

      {groups.map((g) => {
        const rows = script.filter((s) => s.group === g.id);
        if (rows.length === 0) return null;
        return (
          <div key={g.id}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)", marginBottom: 6 }}>
              {g.label}
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              {rows.map((row, i) => {
                const has = !!recordings[row.text];
                const isActive = active === row.text;
                const isSaving = saving === row.text;
                return (
                  <div
                    key={row.text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                      background: isActive ? "var(--bg)" : undefined,
                      flexWrap: "wrap",
                    }}
                  >
                    <span lang="en" dir="ltr" style={{ flex: "1 1 260px", minWidth: 0, lineHeight: 1.5 }}>{row.text}</span>
                    {has && !isActive && <span className="badge badge-green">{t.recordedBadge}</span>}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {isActive ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={stop} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(0.75 0.15 25)" }} />
                          {t.stop}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn ${has ? "btn-ghost" : "btn-primary"} btn-sm`}
                          onClick={() => record(row.text)}
                          disabled={!!saving || (!!active && !isActive)}
                        >
                          {isSaving ? "…" : has ? t.recordAgain : t.recordShort}
                        </button>
                      )}
                      {has && !isActive && (
                        <>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => play(row.text)}>{t.playTake}</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveTake(row.text, null)} disabled={!!saving}>
                            {t.deleteTake}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>{t.englishOnly}</p>
    </div>
  );
}
