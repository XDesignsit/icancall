"use client";

import React from "react";

import { stateForAreaCode } from "@/lib/areaCodeStates";

/* Area-code flag rendering and the number-picker helpers. */

export function AreaFlag({ areaCode, height = 13, showAbbr = false }: { areaCode: string; height?: number; showAbbr?: boolean }) {
  const region = stateForAreaCode(areaCode);
  if (!region) return null;
  return (
    <span title={region.name} style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <img
        src={`https://flagcdn.com/${region.flag}.svg`}
        alt={region.name}
        loading="lazy"
        onError={(e) => { e.currentTarget.parentElement!.style.display = "none"; }}
        style={{
          height,
          width: Math.round(height * 1.5),
          objectFit: "cover",
          borderRadius: 2,
          border: "1px solid var(--line)",
          display: "block"
        }}
      />
      {showAbbr && (
        <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--ink-faint)" }}>{region.abbr}</span>
      )}
    </span>
  );
}

export const AREA_SUGGESTIONS = [
  { code: "470", city: "Atlanta" },
  { code: "872", city: "Chicago" },
  { code: "945", city: "Dallas" },
  { code: "629", city: "Nashville" },
  { code: "689", city: "Orlando" },
  { code: "984", city: "Raleigh" },
  { code: "787", city: "Puerto Rico" },
];

export const VANITY_WORDS = [
  { word: "CARE", digits: "2273" },
  { word: "HOME", digits: "4663" },
  { word: "HELP", digits: "4357" },
  { word: "SAFE", digits: "7233" },
  { word: "CALL", digits: "2255" },
  { word: "LOVE", digits: "5683" },
  { word: "FAMI", digits: "3264" },
];

export function pad(n: number, len: number) { return String(n).padStart(len, "0"); }

export function memorableLabel(prefix: string, line: string) {
  if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3]) return "Repeating";
  if (line === "1234" || line === "4321" || line === "2345") return "Sequence";
  if (line[0] === line[3] && line[1] === line[2]) return "Mirror";
  if (prefix === line.slice(0, 3)) return "Easy recall";
  return null;
}

let _numSeed = Math.floor(Math.random() * 9000);

export function fetchNumbers(areaCode: string, count = 6) {
  const ac = areaCode.replace(/\D/g, "").slice(0, 3) || "415";
  const out: { id: string; number: string; area: string; memorable: string | null }[] = [];
  const usedVanity = new Set();
  for (let i = 0; i < count; i++) {
    _numSeed = (_numSeed * 1103515245 + 12345) & 0x7fffffff;
    const r = _numSeed;
    let prefix = "";
    let line = "";
    let vanity = null;

    if (r % 3 === 0) {
      const v = VANITY_WORDS[(r >> 4) % VANITY_WORDS.length];
      if (!usedVanity.has(v.word)) {
        usedVanity.add(v.word);
        prefix = pad(200 + ((r >> 8) % 700), 3);
        line = v.digits;
        vanity = v.word;
      }
    }
    if (!line) {
      prefix = pad(200 + ((r >> 6) % 700), 3);
      line = pad((r >> 10) % 10000, 4);
    }

    const formatted = `(${ac}) ${prefix}-${line}`;
    const memo = vanity ? `Spells ${vanity}` : memorableLabel(prefix, line);
    out.push({
      id: `${ac}-${prefix}-${line}-${i}`,
      number: formatted,
      area: ac,
      memorable: memo,
    });
  }
  return out;
}

// Fetches real available numbers from Twilio. Falls back to the mock
// generator only when Twilio is unconfigured (local dev); when Twilio is
// live, an out-of-stock area code returns an empty list so the UI can show
// its "no numbers found" state instead of fake numbers.
export async function fetchNumbersLive(areaCode: string, count = 6): Promise<{ id: string; number: string; area: string; memorable: string | null }[]> {
  const ac = areaCode.replace(/\D/g, "").slice(0, 3) || "470";
  try {
    const res = await fetch(`/api/twilio/numbers?areaCode=${ac}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        if (data.configured === false) return fetchNumbers(ac, count);
        const results = Array.isArray(data.results) ? data.results : [];
        return results.slice(0, count).map((n: { phoneNumber: string; friendlyName?: string }) => ({
          id: n.phoneNumber,
          number: n.friendlyName || n.phoneNumber,
          area: ac,
          memorable: null,
        }));
      }
    }
  } catch {
    // network/API failure: show the empty state rather than fake numbers
  }
  return [];
}

