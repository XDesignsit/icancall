"use client";

import React, { useState } from "react";

import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { STATUS_META, getLocalizedRelationship, localizeCaller, localizeWhen } from "../_data";
import { Icon } from "../_icons";
import { Badge } from "../_primitives";
import { type CallLogEntry, type Line } from "../_types";


/* Call log */
export function CallLogView({ line, log, d, lang }: { line: Line; log: Record<string, CallLogEntry[]>; d: DashboardTranslations; lang: string }) {
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
                    <b>{localizeCaller(c.caller, lang)}</b>
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
                      {localizeWhen(c.when, lang)}
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
