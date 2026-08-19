"use client";

import React, { useEffect, useState } from "react";

import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { planConfig } from "@/lib/planConfig";
import { STATUS_META, getLocalizedLineLabel, getLocalizedPersonName, localizeCaller, localizeWhen } from "../_data";
import { Icon } from "../_icons";
import { Avatar, Badge, StatCard } from "../_primitives";
import { type Account, type CallLogEntry, type Line } from "../_types";

interface SeatMemberView {
  email: string;
  status: "invited" | "active";
}

interface LineStats {
  line: Line;
  calls: number;
  connected: number;
  missed: number;
  voicemail: number;
  minutes: number;
}

/**
 * Rough recency rank for the log's human-readable timestamps ("Today · 2:48 PM").
 * Lets entries from different numbers be merged into one feed; anything the
 * parser doesn't recognise sorts to the end rather than jumping to the top.
 */
function recencyKey(when: string): number {
  const dayRank = when.startsWith("Today") ? 0 : when.startsWith("Yesterday") ? 1 : 2;
  const m = when.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let minsFromMidnight = 0;
  if (m) {
    const hour = parseInt(m[1], 10) % 12;
    const pm = m[3].toUpperCase() === "PM";
    minsFromMidnight = (hour + (pm ? 12 : 0)) * 60 + parseInt(m[2], 10);
  }
  // Earlier day rank first, later time-of-day first within the same day.
  return dayRank * 10000 + (1440 - minsFromMidnight);
}

/* Team admin — account-wide view of every number, caregiver and minute. */
export function TeamAdminView({
  lines,
  log,
  account,
  viewerRole,
  setView,
  setActiveLineId,
  onManageSeats,
  d,
  lang,
}: {
  lines: Line[];
  log: Record<string, CallLogEntry[]>;
  account: Account;
  viewerRole: "owner" | "member";
  setView: (v: string) => void;
  setActiveLineId: (id: string) => void;
  onManageSeats: () => void;
  d: DashboardTranslations;
  lang: string;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const fill = (key: string, vals: Record<string, string | number>) =>
    Object.entries(vals).reduce((str, [k, v]) => str.replace(`{${k}}`, String(v)), ext[key] || "");

  const [seatLimit, setSeatLimit] = useState(planConfig(account.plan).seats);
  const [members, setMembers] = useState<SeatMemberView[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/caregiver/seats");
        if (!res.ok) return;
        const data = await res.json();
        setSeatLimit(data.seatLimit || planConfig(account.plan).seats);
        setMembers(Array.isArray(data.members) ? data.members : []);
      } catch { /* seat panel falls back to plan defaults */ }
    })();
  }, [account.plan]);

  const plan = planConfig(account.plan);
  const includedNumbers = plan.includedLines + (account.addons?.extraNumbers || 0);
  const minutePool = plan.voiceMinutes + (account.addons?.minuteBlocks || 0) * 30 + (account.addons?.rolloverMin || 0);
  const minutesUsed = Math.min(account.addons?.usedMin || 0, minutePool);

  // Talk time comes from the same call records as the other columns; a line
  // with no calls falls back to whatever minute total is stored on it.
  const durationMinutes = (entries: CallLogEntry[]) => {
    const seconds = entries.reduce((total, c) => {
      const m = c.dur.match(/^(\d+):(\d{2})$/);
      return m ? total + parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : total;
    }, 0);
    return Math.round(seconds / 60);
  };

  const stats: LineStats[] = lines.map((line) => {
    const calls = log[line.id] || [];
    return {
      line,
      calls: calls.length,
      connected: calls.filter((c) => c.status === "connected").length,
      missed: calls.filter((c) => c.status === "missed").length,
      voicemail: calls.filter((c) => c.status === "voicemail").length,
      minutes: calls.length ? durationMinutes(calls) : (line.minutesUsed || 0),
    };
  });

  const totalCalls = stats.reduce((s, r) => s + r.calls, 0);
  const totalConnected = stats.reduce((s, r) => s + r.connected, 0);
  const totalMissed = stats.reduce((s, r) => s + r.missed + r.voicemail, 0);
  const connectRate = totalCalls > 0 ? Math.round((totalConnected / totalCalls) * 100) : 100;
  const seatsInUse = 1 + members.length; // the owner holds one seat
  const seatsFree = Math.max(0, seatLimit - seatsInUse);

  const feed = lines
    .flatMap((line) => (log[line.id] || []).map((c) => ({ call: c, line })))
    .sort((a, b) => recencyKey(a.call.when) - recencyKey(b.call.when))
    .slice(0, 8);

  const openLine = (id: string, target: string) => {
    setActiveLineId(id);
    setView(target);
  };

  const modeLabel = (mode: Line["mode"]) =>
    mode === "menu" ? d.overview.callerMenu
      : mode === "schedule" ? d.overview.timeSchedule
      : mode === "simultaneous" ? d.routing.simultaneous
      : d.overview.cascade;

  const th: React.CSSProperties = { padding: "12px 16px", fontWeight: 600, color: "var(--ink-soft)", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "14px 16px", verticalAlign: "middle" };

  return (
    <div className="content-inner">
      <div className="stat-grid section-gap">
        <StatCard
          icon="phone"
          iconBg="var(--tint)"
          iconColor="var(--blue-deep)"
          val={`${lines.length}/${includedNumbers}`}
          lbl={ext.adminNumbersActive}
          trend={plan.name}
          trendDir="up"
        />
        <StatCard
          icon="log"
          iconBg="oklch(0.96 0.04 285)"
          iconColor="var(--violet)"
          val={totalCalls}
          lbl={d.overview.callsWeek}
          trend={`${totalMissed} ${d.overview.missedAlerted}`}
          trendDir={totalMissed > 0 ? "down" : "up"}
        />
        <StatCard
          icon="check"
          iconBg="oklch(0.95 0.05 158)"
          iconColor="oklch(0.45 0.13 158)"
          val={`${connectRate}%`}
          lbl={d.overview.connectedFirst}
          trend={`${totalConnected}/${totalCalls}`}
          trendDir="up"
        />
        <StatCard
          icon="clock"
          iconBg="oklch(0.96 0.05 75)"
          iconColor="oklch(0.5 0.13 60)"
          val={minutesUsed}
          lbl={ext.adminMinutesUsed}
          trend={fill("adminOfPool", { a: minutesUsed, b: minutePool })}
          trendDir={minutesUsed > minutePool * 0.8 ? "down" : "up"}
        />
      </div>

      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{ext.adminNumbersTitle}</h2>
            <p>{fill("adminNumbersSub", { a: lines.length, b: includedNumbers })}</p>
          </div>
        </div>
        <div className="card-pad" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                <th style={th}>{ext.adminColNumber}</th>
                <th style={th}>{ext.adminColRouting}</th>
                <th style={th}>{ext.adminColContacts}</th>
                <th style={th}>{ext.adminColCalls}</th>
                <th style={th}>{d.sim.connected.replace(/^[\u2713\u2714]\s*/, "")}</th>
                <th style={th}>{d.overview.missedAlerted}</th>
                <th style={th}>{ext.adminColMinutes}</th>
                <th style={{ ...th, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ line, calls, connected, missed, voicemail, minutes }) => (
                <tr key={line.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Avatar name={getLocalizedPersonName(line.person, lang)} color={line.color} size={34} radius="10px" fontSize={13} />
                      <div style={{ minWidth: 0 }}>
                        <b style={{ display: "block", color: "var(--ink)" }}>{getLocalizedLineLabel(line.label, lang)}</b>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--ink-faint)" }}>{line.number}</span>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <Badge kind={line.mode === "menu" ? "blue" : "amber"}>{modeLabel(line.mode)}</Badge>
                  </td>
                  <td style={td}>{line.contacts.length}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{calls}</td>
                  <td style={td}>{connected}</td>
                  <td style={td}>{missed + voicemail}</td>
                  <td style={td}>{minutes}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button
                      className="btn btn-soft btn-sm"
                      style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: 600 }}
                      onClick={() => openLine(line.id, "log")}
                    >
                      {ext.adminOpen}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22, alignItems: "start" }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{ext.adminSeatsTitle}</h2>
              <p>{fill("adminSeatsSub", { a: seatsInUse, b: seatLimit })}</p>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="crow">
              <Avatar name={account.name || account.email} color="var(--blue)" size={38} radius="10px" fontSize={14} />
              <div className="info">
                <b>{account.name || account.email}</b>
                <div className="rel">{ext.adminOwner}</div>
              </div>
              <Badge kind="green">{ext.adminSeatActive}</Badge>
            </div>

            {members.map((m) => (
              <div className="crow" key={m.email}>
                <Avatar name={m.email} color="var(--violet)" size={38} radius="10px" fontSize={14} />
                <div className="info">
                  <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{m.email}</b>
                  <div className="rel">{m.status === "active" ? ext.adminSeatActive : ext.adminSeatPending}</div>
                </div>
                <Badge kind={m.status === "active" ? "green" : "amber"}>
                  {m.status === "active" ? ext.adminSeatActive : ext.adminSeatPending}
                </Badge>
              </div>
            ))}

            {viewerRole === "owner" && (
              <button className="btn btn-ghost" onClick={onManageSeats} style={{ alignSelf: "flex-start" }}>
                <Icon name="user" /> {ext.adminManageSeats}
                {seatsFree > 0 ? ` · ${fill("adminSeatsFree", { n: seatsFree })}` : ""}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>{ext.adminActivityTitle}</h2>
              <p>{ext.adminMinutePool}: {fill("adminOfPool", { a: minutesUsed, b: minutePool })}</p>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {feed.map(({ call, line }) => {
              const m = STATUS_META[call.status as keyof typeof STATUS_META];
              return (
                <div
                  className="crow"
                  key={`${line.id}-${call.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => openLine(line.id, "log")}
                >
                  {/* .dir sizing is scoped to .logrow, so size it here and keep dirCls for the tint */}
                  <div
                    className={m.dirCls}
                    style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", flex: "none" }}
                  >
                    <Icon name={call.status === "voicemail" ? "voicemail" : call.status === "missed" ? "alert" : "in"} />
                  </div>
                  <div className="info">
                    <b>{getLocalizedLineLabel(line.label, lang)}</b>
                    <div className="rel">{localizeCaller(call.caller, lang)}</div>
                    <div className="tel">{line.number}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge kind={m.badge.replace("badge-", "")}>
                      {(call.status === "voicemail" ? d.sim.voicemail : call.status === "missed" ? d.sim.noAnswer : d.sim.connected).replace(/^[✓✔]\s*/, "")}
                    </Badge>
                    <div className="when" style={{ marginTop: 5, fontSize: "0.76rem", color: "var(--ink-faint)" }}>{localizeWhen(call.when, lang)}</div>
                  </div>
                </div>
              );
            })}

            {feed.length === 0 && (
              <div style={{ textAlign: "center", padding: "34px 0", color: "var(--ink-faint)", fontSize: "0.9rem" }}>
                {ext.adminNoActivity}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
