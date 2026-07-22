"use client";

import React, { useState } from "react";

import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { STATUS_META, getLocalizedRelationship } from "../_data";
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
