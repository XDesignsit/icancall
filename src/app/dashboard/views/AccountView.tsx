"use client";

import React, { useEffect, useRef, useState } from "react";

import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { planConfig, type PlanId } from "@/lib/planConfig";

import {
  AVATAR_COLORS,
  getLineDefaultLabel,
  getLocalizedLineLabel,
  planDisplayName,
} from "../_data";
import { Icon } from "../_icons";
import { AREA_SUGGESTIONS, AreaFlag, fetchNumbersLive } from "../_numbers";
import { Badge, initials, Modal, Toggle } from "../_primitives";
import type { Account, Line, PickerNumber } from "../_types";

interface SeatMemberView { email: string; status: "invited" | "active"; invitedAt: string; acceptedAt?: string }

function SeatsManager({ showToast, lang }: { showToast: (m: string) => void; lang: string }) {
  const [loaded, setLoaded] = useState(false);
  const [supportsSeats, setSupportsSeats] = useState(false);
  const [seatLimit, setSeatLimit] = useState(2);
  const [members, setMembers] = useState<SeatMemberView[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const tr = (en: string, es: string, fr: string) => (lang === "es" ? es : lang === "fr" ? fr : en);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/caregiver/seats");
        if (res.ok) {
          const data = await res.json();
          setSupportsSeats(!!data.supportsSeats);
          setSeatLimit(data.seatLimit || 2);
          setMembers(Array.isArray(data.members) ? data.members : []);
        }
      } catch { /* fail closed: section stays hidden */ }
      setLoaded(true);
    })();
  }, []);

  if (!loaded || !supportsSeats) return null;

  // Owner occupies one seat; the rest are for invited caregivers.
  const inviteeSeatsUsed = members.length;
  const seatsAvailable = seatLimit - 1 - inviteeSeatsUsed;

  const invite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/caregiver/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || tr("Couldn't send invite", "No se pudo invitar", "Envoi impossible")); }
      else { setMembers(data.members || []); setInviteEmail(""); showToast(tr("Invitation sent", "Invitación enviada", "Invitation envoyée")); }
    } catch { showToast(tr("Couldn't send invite", "No se pudo invitar", "Envoi impossible")); }
    setBusy(false);
  };

  const revoke = async (email: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/caregiver/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", email }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || tr("Couldn't remove caregiver", "No se pudo quitar", "Suppression impossible")); }
      else { setMembers(data.members || []); showToast(tr("Caregiver removed", "Cuidador eliminado", "Aidant supprimé")); }
    } catch { showToast(tr("Couldn't remove caregiver", "No se pudo quitar", "Suppression impossible")); }
    setBusy(false);
  };

  return (
    <div className="card section-gap">
      <div className="card-head">
        <div>
          <h2>{tr("Caregiver seats", "Accesos de cuidador", "Accès aidants")}</h2>
          <p>{tr(
            `Invite a second caregiver to help manage this account. ${seatsAvailable > 0 ? `${seatsAvailable} seat available.` : "All seats in use."}`,
            `Invite a otro cuidador para ayudar a gestionar esta cuenta. ${seatsAvailable > 0 ? `${seatsAvailable} acceso disponible.` : "Todos los accesos en uso."}`,
            `Invitez un second aidant à gérer ce compte. ${seatsAvailable > 0 ? `${seatsAvailable} accès disponible.` : "Tous les accès sont utilisés."}`
          )}</p>
        </div>
      </div>
      <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {members.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div key={m.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</span>
                  <span style={{ fontSize: "0.76rem", fontWeight: 600, color: m.status === "active" ? "oklch(0.55 0.14 150)" : "var(--ink-faint)" }}>
                    {m.status === "active" ? tr("Active caregiver", "Cuidador activo", "Aidant actif") : tr("Invitation pending", "Invitación pendiente", "Invitation en attente")}
                  </span>
                </div>
                <button className="btn btn-ghost" disabled={busy} onClick={() => revoke(m.email)} style={{ padding: "6px 12px", fontSize: "0.82rem" }}>
                  {m.status === "active" ? tr("Remove", "Quitar", "Retirer") : tr("Cancel", "Cancelar", "Annuler")}
                </button>
              </div>
            ))}
          </div>
        )}

        {seatsAvailable > 0 ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
              placeholder={tr("caregiver@email.com", "cuidador@email.com", "aidant@email.com")}
              disabled={busy}
              style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--surface)", fontSize: "0.9rem", color: "var(--ink)" }}
            />
            <button className="btn btn-primary" disabled={busy || !inviteEmail.trim()} onClick={invite} style={{ padding: "9px 18px", fontSize: "0.9rem" }}>
              {tr("Send invite", "Enviar invitación", "Inviter")}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)", margin: 0 }}>
            {tr("Remove a caregiver to free up a seat.", "Quite un cuidador para liberar un acceso.", "Retirez un aidant pour libérer un accès.")}
          </p>
        )}
      </div>
    </div>
  );
}

/* Account & billing */
export function AccountView({
  account,
  setAccount,
  showToast,
  tab,
  setTab,
  d,
  lang,
  lines,
  setLines,
  autoOpenPlanModal,
  setAutoOpenPlanModal,
  viewerRole,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
  showToast: (msg: string) => void;
  tab: string;
  setTab: (t: string) => void;
  d: DashboardTranslations;
  lang: string;
  lines: Line[];
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
  autoOpenPlanModal: boolean;
  setAutoOpenPlanModal: (open: boolean) => void;
  viewerRole: "owner" | "member";
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const a = account;
  const baseLinesCount = planConfig(a.plan).includedLines;
  // The profile row belongs to the account owner, and /api/caregiver/profile
  // rejects writes from seat members — so show it read-only rather than
  // offering edits that silently fail.
  const canEditProfile = viewerRole === "owner";
  // There are exactly two roles on an account and neither is chosen: you either
  // hold the subscription or you occupy a caregiver seat on someone else's.
  // Billing copy always names the plan this account is actually on.
  const planName = planDisplayName(a.plan, lang);
  const planInvoiceDesc = `${planName} · ${a.billingCycle === "yearly" ? ext.cycleAnnual : ext.cycleMonthly}`;
  const planInvoiceAmount = a.billingCycle === "yearly" ? planConfig(a.plan).annualLabel : planConfig(a.plan).monthlyLabel;
  const roleLabel = viewerRole === "owner" ? ext.accessOwner : ext.careCoordinator;
  const roleDesc = viewerRole === "owner" ? ext.accessOwnerDesc : ext.accessMemberDesc;
  const currentExtraLines = Math.max(0, lines.length - baseLinesCount);
  const set = (patch: Partial<Account>) => {
    setAccount((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem("ic_account_data", JSON.stringify(updated));
      return updated;
    });
  };
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [tempPlan, setTempPlan] = useState<PlanId>(account.plan || "pro");
  const [tempCycle, setTempCycle] = useState<"monthly" | "yearly">(account.billingCycle || "monthly");
  const [selectedLineToKeep, setSelectedLineToKeep] = useState<string>("");

  useEffect(() => {
    if (planModalOpen && lines && lines.length > 0) {
      setSelectedLineToKeep(lines[0].id);
    }
  }, [planModalOpen, lines]);

  useEffect(() => {
    if (autoOpenPlanModal && tab === "billing") {
      setPlanModalOpen(true);
      setAutoOpenPlanModal(false);
    }
  }, [autoOpenPlanModal, tab, setAutoOpenPlanModal]);

  // Upgrade to Pro number selection state
  const [upgradeAreaCode, setUpgradeAreaCode] = useState("470");
  const [upgradeNumbersList, setUpgradeNumbersList] = useState<PickerNumber[]>([]);
  const [upgradeSelectedNumber, setUpgradeSelectedNumber] = useState<PickerNumber | null>(null);
  const [isSearchingNumbers, setIsSearchingNumbers] = useState(false);

  // States for Add-on changes. tempExtraNumbers is a delta relative to the
  // current lines: 0 = no change, +N = add N numbers, -N = return N numbers.
  const [tempExtraNumbers, setTempExtraNumbers] = useState(0);
  const [tempMinuteBlocks, setTempMinuteBlocks] = useState(0);

  const planMaxIncluded = planConfig(a.plan).includedLines;
  const unusedPlanLines = Math.max(0, planMaxIncluded - lines.length);
  const chargeableNewNumbers = tempExtraNumbers > 0 ? Math.max(0, tempExtraNumbers - unusedPlanLines) : 0;

  const [lastPropExtraNumbers, setLastPropExtraNumbers] = useState(a.addons?.extraNumbers || 0);

  if ((a.addons?.extraNumbers || 0) !== lastPropExtraNumbers) {
    setLastPropExtraNumbers(a.addons?.extraNumbers || 0);
    setTempExtraNumbers(0);
  }
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [addonCheckoutLoading, setAddonCheckoutLoading] = useState(false);
  const addonPendingAction = useRef<(() => void) | null>(null);
  const addonPopupRef = useRef<Window | null>(null);
  const [addonRemovalModalOpen, setAddonRemovalModalOpen] = useState(false);
  const [annualBillingConfirmOpen, setAnnualBillingConfirmOpen] = useState(false);
  const annualBillingConfirmCallback = useRef<(() => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === "es" ? "La imagen debe ser menor a 5MB" : lang === "fr" ? "L'image doit être inférieure à 5 Mo" : "Image must be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/caregiver/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      const data = await res.json();

      if (data.avatarUrl) {
        setAccount((prev) => {
          const updated = {
            ...prev,
            avatarUrl: data.avatarUrl,
          };
          localStorage.setItem("ic_account_data", JSON.stringify(updated));
          return updated;
        });
        showToast(lang === "es" ? "¡Foto de perfil actualizada!" : lang === "fr" ? "Photo de profil mise à jour !" : "Profile photo updated successfully!");
      }
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : (lang === "es" ? "Error al subir la foto" : lang === "fr" ? "Échec du téléchargement de la photo" : "Failed to upload photo"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  interface AddonNumberSlotConfig {
    index: number;
    areaCode: string;
    numbersList: PickerNumber[];
    selectedNumber: PickerNumber | null;
    isSearching: boolean;
  }

  const [addedNumbersConfig, setAddedNumbersConfig] = useState<AddonNumberSlotConfig[]>([]);
  const [selectedLinesToRemove, setSelectedLinesToRemove] = useState<string[]>([]);

  const loadAddonNumberSlot = (index: number, ac: string) => {
    setAddedNumbersConfig(prev => prev.map(c => c.index === index ? { ...c, isSearching: true, areaCode: ac } : c));
    fetchNumbersLive(ac, 6).then((nums) => {
      setAddedNumbersConfig(prev => prev.map(c => c.index === index ? {
        ...c,
        isSearching: false,
        numbersList: nums
      } : c));
    });
  };

  const loadUpgradeNumbers = (ac: string) => {
    setIsSearchingNumbers(true);
    fetchNumbersLive(ac, 6).then((nums) => {
      setUpgradeNumbersList(nums);
      setIsSearchingNumbers(false);
    });
  };

  useEffect(() => {
    if (planModalOpen) {
      loadUpgradeNumbers(upgradeAreaCode);
      setUpgradeSelectedNumber(null);
    }
    // Fetch numbers only when the modal opens; the area-code input has its own
    // handler, so re-running on upgradeAreaCode changes would double-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planModalOpen]);

  const save17Map: Record<string, string> = {
    en: "Save 17%",
    es: "Ahorre 17%",
    fr: "Économisez 17%",
    ja: "17%お得",
    zh: "省17%",
    ar: "وفر 17%",
    hi: "17% बचाएं",
    pt: "Economize 17%",
    de: "17% sparen",
    it: "Risparmia il 17%",
    ko: "17% 할인"
  };

  useEffect(() => {
    if (planModalOpen) {
      setTempPlan(account.plan || "pro");
      setTempCycle(account.billingCycle || "monthly");
    }
  }, [planModalOpen, account.plan, account.billingCycle]);

  useEffect(() => {
    const fireAddon = () => {
      if (!addonPendingAction.current) return;
      if (addonPopupRef.current) {
        try {
          addonPopupRef.current.close();
        } catch (err) {
          console.error("Failed to close addon popup:", err);
        }
        addonPopupRef.current = null;
      }
      addonPendingAction.current();
      addonPendingAction.current = null;
      localStorage.removeItem("creem_addon_success");
    };

    // Primary: BroadcastChannel (reliable same-origin cross-window)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("creem_addon");
      bc.onmessage = (e) => {
        if (e.data?.type === "CREEM_ADDON_SUCCESS") fireAddon();
      };
    } catch {}

    // Secondary: postMessage from opener
    const handleMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "CREEM_ADDON_SUCCESS") fireAddon();
    };
    window.addEventListener("message", handleMsg);

    return () => {
      bc?.close();
      window.removeEventListener("message", handleMsg);
    };
  }, []);

  const getModalButtonText = () => {
    const isCurrentPlan = tempPlan === account.plan;
    const isCurrentCycle = tempCycle === account.billingCycle;
    
    if (isCurrentPlan && isCurrentCycle) {
      return lang === "es" ? "Plan actual"
           : lang === "fr" ? "Forfait actuel"
           : lang === "ja" ? "現在のプラン"
           : lang === "zh" ? "当前方案"
           : lang === "ar" ? "الباقة الحالية"
           : lang === "hi" ? "वर्तमान प्लान"
           : lang === "pt" ? "Plano atual"
           : lang === "de" ? "Aktueller Tarif"
           : lang === "it" ? "Piano attuale"
           : lang === "ko" ? "현재 플랜"
           : "Current Plan";
    }
    
    if (isCurrentPlan) {
      return lang === "es" ? "Actualizar ciclo de facturación"
           : lang === "fr" ? "Mettre à jour le cycle"
           : lang === "ja" ? "請求サイクルを更新"
           : lang === "zh" ? "更新账单周期"
           : lang === "ar" ? "تحديث دورة الفوترة"
           : lang === "hi" ? "बिलिंग चक्र अपडेट करें"
           : lang === "pt" ? "Atualizar ciclo de cobrança"
           : lang === "de" ? "Abrechnungszeitraum aktualisieren"
           : lang === "it" ? "Aggiorna ciclo di fatturazione"
           : lang === "ko" ? "결제 주기 업데이트"
           : "Update Billing Cycle";
    }
    
    // Tier order: essential < pro < careteam. Compare ranks to label the
    // action as an upgrade or downgrade, and name the destination plan.
    const rank: Record<PlanId, number> = { essential: 0, pro: 1, careteam: 2 };
    const targetName = planDisplayName(tempPlan, lang);

    if (rank[tempPlan] > rank[account.plan]) {
      return lang === "es" ? `Actualizar a ${targetName}`
           : lang === "fr" ? `Passer à ${targetName}`
           : lang === "ja" ? `${targetName}にアップグレード`
           : lang === "zh" ? `升级到${targetName}`
           : lang === "ar" ? `الترقية إلى ${targetName}`
           : lang === "hi" ? `${targetName} पर अपग्रेड करें`
           : lang === "pt" ? `Upgrade para ${targetName}`
           : lang === "de" ? `Auf ${targetName} upgraden`
           : lang === "it" ? `Passa a ${targetName}`
           : lang === "ko" ? `${targetName}로 업그레이드`
           : `Upgrade to ${targetName}`;
    } else {
      return lang === "es" ? `Degradar a ${targetName}`
           : lang === "fr" ? `Passer à ${targetName}`
           : lang === "ja" ? `${targetName}にダウングレード`
           : lang === "zh" ? `降级到${targetName}`
           : lang === "ar" ? `تخفيض الباقة إلى ${targetName}`
           : lang === "hi" ? `${targetName} पर डाउनग्रेड करें`
           : lang === "pt" ? `Downgrade para ${targetName}`
           : lang === "de" ? `Auf ${targetName} downgraden`
           : lang === "it" ? `Passa a ${targetName}`
           : lang === "ko" ? `${targetName}로 다운그레이드`
           : `Downgrade to ${targetName}`;
    }
  };

  const isUpgradingToPro = tempPlan === "pro" && account.plan === "essential";
  const isModalButtonDisabled =
    (tempPlan === account.plan && tempCycle === account.billingCycle) ||
    (isUpgradingToPro && !upgradeSelectedNumber);

  const ACCT_TABS = [
    { id: "profile", label: d.account.profile },
    { id: "security", label: d.account.security },
    { id: "contact", label: d.account.contactInfo },
    { id: "billing", label: d.account.billing },
  ];

  const [pwd, setPwd] = useState({ cur: "", next: "", conf: "" });
  const savePwd = () => {
    if (!pwd.cur || !pwd.next) return showToast(ext.enterPasswordToast);
    if (pwd.next !== pwd.conf) return showToast(ext.passwordMismatchToast);
    setPwd({ cur: "", next: "", conf: "" });
    showToast(ext.passwordUpdatedToast);
  };

  return (
    <div className="content-inner">
      <div className="acct-tabs">
        {ACCT_TABS.map((t) => (
          <button
            key={t.id}
            className={`acct-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.profile}</h2>
              <p>{d.account.personalDetailsSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="acct-photo">
              <span className="big-ava" style={{ display: "grid", placeItems: "center", overflow: "hidden" }}>
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                ) : (
                  initials(a.name)
                )}
              </span>
              <div className="pmeta">
                <b>{a.name}</b>
                <span>{roleLabel}</span>
              </div>
              <div className="pacts">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || !canEditProfile}
                >
                  <Icon name="camera" /> {uploadingPhoto ? (lang === "es" ? "Subiendo..." : lang === "fr" ? "Téléchargement..." : "Uploading...") : ext.changePhoto}
                </button>
              </div>
            </div>
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.contacts.fullName}</label>
                  <input value={a.name} onChange={(e) => set({ name: e.target.value })} disabled={!canEditProfile} />
                </div>
                <div>
                  <label>{d.account.prefName}</label>
                  <input value={a.preferred} onChange={(e) => set({ preferred: e.target.value })} disabled={!canEditProfile} />
                </div>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{d.account.role}</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                  maxWidth: 520,
                }}
              >
                <span style={{ flex: "none", whiteSpace: "nowrap" }}>
                  <Badge kind={viewerRole === "owner" ? "green" : "blue"}>{roleLabel}</Badge>
                </span>
                <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.45 }}>
                  {roleDesc}
                </p>
              </div>
            </div>

            {canEditProfile && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                  <Icon name="check" /> {d.contacts.saveChanges}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "security" && (
        <>
          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.email}</h2>
                <p>{d.account.emailRecoverSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
                <label>{d.account.email}</label>
                <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => showToast(d.common.savedToast)}
                >
                  {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.security}</h2>
                <p>{d.account.strongPasswordSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div style={{ maxWidth: 420 }}>
                <div className="field">
                  <label>{lang === "es" ? "Contraseña actual" : lang === "fr" ? "Mot de passe actuel" : lang === "ja" ? "現在のパスワード" : lang === "zh" ? "当前密码" : lang === "ar" ? "كلمة المرور الحالية" : lang === "hi" ? "वर्तमान पासवर्ड" : lang === "pt" ? "Senha atual" : lang === "de" ? "Aktuelles Passwort" : lang === "it" ? "Password attuale" : lang === "ko" ? "현재 비밀번호" : "Current password"}</label>
                  <input
                    type="password"
                    value={pwd.cur}
                    onChange={(e) => setPwd({ ...pwd, cur: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field">
                  <label>{lang === "es" ? "Nueva contraseña" : lang === "fr" ? "Nouveau mot de passe" : lang === "ja" ? "新しいパスワード" : lang === "zh" ? "新密码" : lang === "ar" ? "كلمة المرور الجديدة" : lang === "hi" ? "नया पासवर्ड" : lang === "pt" ? "Nova senha" : lang === "de" ? "Neues Passwort" : lang === "it" ? "Nuova password" : lang === "ko" ? "새 비밀번호" : "New password"}</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>{lang === "es" ? "Confirmar nueva contraseña" : lang === "fr" ? "Confirmer le nouveau mot de passe" : lang === "ja" ? "新しいパスワードの確認" : lang === "zh" ? "确认新密码" : lang === "ar" ? "تأكيد كلمة المرور الجديدة" : lang === "hi" ? "नए पासवर्ड की पुष्टि करें" : lang === "pt" ? "Confirmar nova senha" : lang === "de" ? "Neues Passwort bestätigen" : lang === "it" ? "Conferma nuova password" : lang === "ko" ? "새 비밀번호 확인" : "Confirm new password"}</label>
                  <input
                    type="password"
                    value={pwd.conf}
                    onChange={(e) => setPwd({ ...pwd, conf: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button className="btn btn-primary" onClick={savePwd}>
                  <Icon name="lock" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.twoFactor}</h2>
                <p>{d.account.twoFactorSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="txt">
                  <b>{d.account.smsCodesTitle}</b>
                  <p>
                    {d.account.smsCodesDesc} ({a.phone})
                  </p>
                </div>
                <Toggle
                  on={a.twoFactor}
                  onChange={(v) => {
                    set({ twoFactor: v });
                    showToast(v ? (lang === "es" ? "Autenticación de dos factores activada" : lang === "fr" ? "Double authentification activée" : lang === "ja" ? "2段階認証を有効にしました" : lang === "zh" ? "双重验证已启用" : lang === "ar" ? "تم تفعيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण सक्षम" : lang === "pt" ? "Autenticação de dois fatores ativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung aktiviert" : lang === "it" ? "Autenticazione a due fattori abilitata" : lang === "ko" ? "2단계 인증이 활성화되었습니다" : "Two-factor enabled") : (lang === "es" ? "Autenticación de dos factores desactivada" : lang === "fr" ? "Double authentification désactivée" : lang === "ja" ? "2段階認証を无効にしました" : lang === "zh" ? "双重验证已禁用" : lang === "ar" ? "تم تعطيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण अक्षम" : lang === "pt" ? "Autenticação de dois fatores desativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung deaktiviert" : lang === "it" ? "Autenticazione a due fattori disabilitata" : lang === "ko" ? "2단계 인증이 비활성화되었습니다" : "Two-factor disabled"));
                  }}
                  labels={[lang === "es" ? "Off" : lang === "fr" ? "Off" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Off" : lang === "ko" ? "꺼짐" : "Off", lang === "es" ? "On" : lang === "fr" ? "On" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "On" : lang === "ko" ? "켜짐" : "On"]}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>{ext.activeSessions}</h2>
                <p>{d.account.activeSessionsSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {/* Sample invoices, but they must at least bill the plan this
                  account is on rather than a hardcoded Pro subscription. */}
              {[
                { dev: "Chrome · MacBook Pro", loc: "Oakland, CA", last: d.common.activeNow, cur: true },
                { dev: "iCanCall app · iPhone 15", loc: "Oakland, CA", last: lang === "es" ? "Hace 2 horas" : lang === "fr" ? "Il y a 2 heures" : lang === "ja" ? "2時間前" : lang === "zh" ? "2小时前" : lang === "ar" ? "قبل ساعتين" : lang === "hi" ? "2 घंटे पहले" : lang === "pt" ? "Há 2 horas" : lang === "de" ? "Vor 2 Stunden" : lang === "it" ? "2 ore fa" : lang === "ko" ? "2시간 전" : "2 hours ago", cur: false },
                { dev: "Safari · iPad", loc: "Sacramento, CA", last: lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "कल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday", cur: false },
              ].map((s, i) => (
                <div className="session" key={i}>
                  <span className="sic">
                    <Icon name="device" />
                  </span>
                  <div className="sinfo">
                    <b>{s.dev}</b>
                    <span>
                      {s.loc} · {s.last}
                    </span>
                  </div>
                  {s.cur ? (
                    <Badge kind="green">{ext.thisDevice}</Badge>
                  ) : (
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => showToast(ext.deviceSignoutToast + s.dev)}
                    >
                      <Icon name="logout" /> {ext.signOut}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "contact" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.contactInfo}</h2>
              <p>{d.account.contactReachSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.phone}</label>
                  <input value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label>{d.account.email}</label>
                  <input
                    type="email"
                    value={a.notifyEmail}
                    onChange={(e) => set({ notifyEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="field">
              <label>{ext.address}</label>
              <input value={a.address} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.timezone}</label>
                  <select value={a.timezone} onChange={(e) => set({ timezone: e.target.value })}>
                    {[
                      { id: "Hawaii (HT)", label: lang === "es" ? "Hawái (HT)" : lang === "fr" ? "Hawaï (HT)" : lang === "ja" ? "ハワイ時間 (HT)" : lang === "zh" ? "夏威夷时间 (HT)" : lang === "ar" ? "هاواي (HT)" : lang === "hi" ? "हवाई (HT)" : lang === "pt" ? "Havaí (HT)" : lang === "de" ? "Hawaii-Zeit (HT)" : lang === "it" ? "Hawaii (HT)" : lang === "ko" ? "하와이시 (HT)" : "Hawaii (HT)" },
                      { id: "Alaska (AKT)", label: lang === "es" ? "Alaska (AKT)" : lang === "fr" ? "Alaska (AKT)" : lang === "ja" ? "アラスカ時間 (AKT)" : lang === "zh" ? "阿拉斯加时间 (AKT)" : lang === "ar" ? "ألاسكا (AKT)" : lang === "hi" ? "अलास्का (AKT)" : lang === "pt" ? "Alasca (AKT)" : lang === "de" ? "Alaska-Zeit (AKT)" : lang === "it" ? "Alaska (AKT)" : lang === "ko" ? "알래스카시 (AKT)" : "Alaska (AKT)" },
                      { id: "Pacific (PT)", label: lang === "es" ? "Pacífico (PT)" : lang === "fr" ? "Pacifique (PT)" : lang === "ja" ? "太平洋標準時 (PT)" : lang === "zh" ? "太平洋时间 (PT)" : lang === "ar" ? "الهادئ (PT)" : lang === "hi" ? "पैसिफिक (PT)" : lang === "pt" ? "Pacífico (PT)" : lang === "de" ? "Pazifik (PT)" : lang === "it" ? "Pacifico (PT)" : lang === "ko" ? "태평양시 (PT)" : "Pacific (PT)" },
                      { id: "Mountain (MT)", label: lang === "es" ? "Montaña (MT)" : lang === "fr" ? "Rocheuses (MT)" : lang === "ja" ? "山岳部標準時 (MT)" : lang === "zh" ? "山地时间 (MT)" : lang === "ar" ? "الجبلي (MT)" : lang === "hi" ? "माउंटेन (MT)" : lang === "pt" ? "Montanha (MT)" : lang === "de" ? "Mountain (MT)" : lang === "it" ? "Montagne (MT)" : lang === "ko" ? "산악시 (MT)" : "Mountain (MT)" },
                      { id: "Central (CT)", label: lang === "es" ? "Central (CT)" : lang === "fr" ? "Centre (CT)" : lang === "ja" ? "中部標準時 (CT)" : lang === "zh" ? "中部时间 (CT)" : lang === "ar" ? "المركزي (CT)" : lang === "hi" ? "सेंट्रल (CT)" : lang === "pt" ? "Central (CT)" : lang === "de" ? "Zentralzeit (CT)" : lang === "it" ? "Centrale (CT)" : lang === "ko" ? "중부시 (CT)" : "Central (CT)" },
                      { id: "Eastern (ET)", label: lang === "es" ? "Este (ET)" : lang === "fr" ? "Est (ET)" : lang === "ja" ? "東部標準時 (ET)" : lang === "zh" ? "东部时间 (ET)" : lang === "ar" ? "الشرقي (ET)" : lang === "hi" ? "ईस्टर्न (ET)" : lang === "pt" ? "Leste (ET)" : lang === "de" ? "Ostküstenzeit (ET)" : lang === "it" ? "Orientale (ET)" : lang === "ko" ? "동부시 (ET)" : "Eastern (ET)" },
                      { id: "Atlantic (AST)", label: lang === "es" ? "Atlántico (AST)" : lang === "fr" ? "Atlantique (AST)" : lang === "ja" ? "大西洋標準時 (AST)" : lang === "zh" ? "大西洋时间 (AST)" : lang === "ar" ? "الأطلسي (AST)" : lang === "hi" ? "अटलांटिक (AST)" : lang === "pt" ? "Atlântico (AST)" : lang === "de" ? "Atlantikzeit (AST)" : lang === "it" ? "Atlantico (AST)" : lang === "ko" ? "대서양시 (AST)" : "Atlantic (AST)" },
                      { id: "London (GMT)", label: lang === "es" ? "Londres (GMT)" : lang === "fr" ? "Londres (GMT)" : lang === "ja" ? "ロンドン時間 (GMT)" : lang === "zh" ? "伦敦时间 (GMT)" : lang === "ar" ? "غرينتش (GMT)" : lang === "hi" ? "लंदन (GMT)" : lang === "pt" ? "Londres (GMT)" : lang === "de" ? "Londoner Zeit (GMT)" : lang === "it" ? "Londra (GMT)" : lang === "ko" ? "런던시 (GMT)" : "London (GMT)" },
                      { id: "Europe (CET)", label: lang === "es" ? "Europa Central (CET)" : lang === "fr" ? "Europe Centrale (CET)" : lang === "ja" ? "中央ヨーロッパ時間 (CET)" : lang === "zh" ? "中部欧洲时间 (CET)" : lang === "ar" ? "وسط أوروبا (CET)" : lang === "hi" ? "मध्य यूरोपीय (CET)" : lang === "pt" ? "Europa Central (CET)" : lang === "de" ? "Mitteleuropäische Zeit (CET)" : lang === "it" ? "Europa Centrale (CET)" : lang === "ko" ? "중앙유럽시 (CET)" : "Central Europe (CET)" },
                      { id: "India (IST)", label: lang === "es" ? "India (IST)" : lang === "fr" ? "Inde (IST)" : lang === "ja" ? "インド時間 (IST)" : lang === "zh" ? "印度时间 (IST)" : lang === "ar" ? "الهند (IST)" : lang === "hi" ? "भारतीय मानक समय (IST)" : lang === "pt" ? "Índia (IST)" : lang === "de" ? "Indische Zeit (IST)" : lang === "it" ? "India (IST)" : lang === "ko" ? "인도시 (IST)" : "India (IST)" },
                      { id: "Australia (AEST)", label: lang === "es" ? "Australia Oriental (AEST)" : lang === "fr" ? "Australie Orientale (AEST)" : lang === "ja" ? "オーストラリア東部時間 (AEST)" : lang === "zh" ? "澳大利亚东部时间 (AEST)" : lang === "ar" ? "شرق أستراليا (AEST)" : lang === "hi" ? "ऑस्ट्रेलियाई पूर्वी (AEST)" : lang === "pt" ? "Austrália Oriental (AEST)" : lang === "de" ? "Ostasiatische Zeit (AEST)" : lang === "it" ? "Australia Orientale (AEST)" : lang === "ko" ? "호주 동부시 (AEST)" : "Australia Eastern (AEST)" }
                    ].map((tz) => (
                      <option key={tz.id} value={tz.id}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{d.account.language}</label>
                  <select value={a.language} onChange={(e) => set({ language: e.target.value })}>
                    {[
                      { id: "English", label: lang === "es" ? "Inglés" : lang === "fr" ? "Anglais" : lang === "ja" ? "英語" : lang === "zh" ? "英语" : lang === "ar" ? "الإنجليزية" : lang === "hi" ? "अंग्रेज़ी" : lang === "pt" ? "Inglês" : lang === "de" ? "Englisch" : lang === "it" ? "Inglese" : lang === "ko" ? "영어" : "English" },
                      { id: "Spanish", label: lang === "es" ? "Español" : lang === "fr" ? "Espagnol" : lang === "ja" ? "スペイン語" : lang === "zh" ? "西班牙语" : lang === "ar" ? "الإسبانية" : lang === "hi" ? "स्पैनिश" : lang === "pt" ? "Espanhol" : lang === "de" ? "Spanisch" : lang === "it" ? "Spagnolo" : lang === "ko" ? "스페인어" : "Spanish" },
                      { id: "Mandarin", label: lang === "es" ? "Mandarín" : lang === "fr" ? "Mandarin" : lang === "ja" ? "中国語" : lang === "zh" ? "中文（普通话）" : lang === "ar" ? "الماندرين" : lang === "hi" ? "मंदारिन" : lang === "pt" ? "Mandarim" : lang === "de" ? "Mandarin" : lang === "it" ? "Mandarino" : lang === "ko" ? "중국어" : "Mandarin" },
                      { id: "Tagalog", label: lang === "es" ? "Tagalo" : lang === "fr" ? "Tagalog" : lang === "ja" ? "タガログ語" : lang === "zh" ? "塔加路语" : lang === "ar" ? "التاغالوغية" : lang === "hi" ? "तागालोग" : lang === "pt" ? "Tagalo" : lang === "de" ? "Tagalog" : lang === "it" ? "Tagalog" : lang === "ko" ? "타갈로그어" : "Tagalog" },
                      { id: "Vietnamese", label: lang === "es" ? "Vietnamita" : lang === "fr" ? "Vietnamien" : lang === "ja" ? "ベトナム語" : lang === "zh" ? "越南语" : lang === "ar" ? "الفيتنامية" : lang === "hi" ? "वियतनामी" : lang === "pt" ? "Vietnamita" : lang === "de" ? "Vietnamesisch" : lang === "it" ? "Vietnamita" : lang === "ko" ? "베트남어" : "Vietnamese" },
                      { id: "French", label: lang === "es" ? "Francés" : lang === "fr" ? "Français" : lang === "ja" ? "フランス語" : lang === "zh" ? "法语" : lang === "ar" ? "الفرنسية" : lang === "hi" ? "फ़्रेंच" : lang === "pt" ? "Francês" : lang === "de" ? "Französisch" : lang === "it" ? "Francese" : lang === "ko" ? "프랑스어" : "French" }
                    ].map((l) => (
                      <option key={l.id} value={l.id}>{getLocalizedLineLabel(l.label, lang)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {canEditProfile && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                  <Icon name="check" /> {d.contacts.saveChanges}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <>
          {viewerRole === "member" && (
            <div className="card section-gap" style={{ borderColor: "var(--line)" }}>
              <div className="card-pad" style={{ fontSize: "0.9rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {lang === "es" ? "Eres cuidador en esta cuenta. La facturación y el plan los gestiona el propietario de la cuenta; puedes gestionar líneas, contactos y enrutamiento."
                 : lang === "fr" ? "Vous êtes aidant sur ce compte. La facturation et le forfait sont gérés par le propriétaire du compte ; vous pouvez gérer les lignes, contacts et le routage."
                 : "You're a caregiver on this account. Billing and plan are managed by the account owner — you can manage lines, contacts, and routing."}
              </div>
            </div>
          )}
          {/* Plan Change Modal */}
          {planModalOpen && (
            <Modal
              title={lang === "es" ? "Cambiar plan de suscripción"
                : lang === "fr" ? "Changer de forfait"
                : lang === "ja" ? "サブスクリプションプランの変更"
                : lang === "zh" ? "更改订阅方案"
                : lang === "ar" ? "تغيير باقة الاشتراك"
                : lang === "hi" ? "सदस्यता प्लान बदलें"
                : lang === "pt" ? "Alterar plano de assinatura"
                : lang === "de" ? "Abonnement-Tarif ändern"
                : lang === "it" ? "Modifica il piano di abbonamento"
                : lang === "ko" ? "구독 플랜 변경"
                : "Change Subscription Plan"}
              onClose={() => setPlanModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setPlanModalOpen(false)}>
                    {lang === "es" ? "Cancelar"
                     : lang === "fr" ? "Annuler"
                     : lang === "ja" ? "キャンセル"
                     : lang === "zh" ? "取消"
                     : lang === "ar" ? "إلغاء"
                     : lang === "hi" ? "रद्द करें"
                     : lang === "pt" ? "Cancelar"
                     : lang === "de" ? "Abbrechen"
                     : lang === "it" ? "Annulla"
                     : lang === "ko" ? "취소"
                     : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={isModalButtonDisabled}
                    onClick={() => {
                      const proceedWithPlanSave = () => {
                        if (tempPlan === "essential" && lines.length > 1) {
                          const nextLines = lines.filter(l => l.id === selectedLineToKeep);
                          setLines(nextLines);
                          localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        } else if (tempPlan === "pro" && account.plan === "essential" && upgradeSelectedNumber) {
                          const newLine: Line = {
                            id: "line_" + Date.now(),
                            label: lang === "es" ? "Línea secundaria" : lang === "fr" ? "Ligne secondaire" : "Secondary line",
                            person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                            number: upgradeSelectedNumber.number,
                            color: "oklch(0.58 0.115 232)",
                            mode: "cascade",
                            minutesUsed: 0,
                            contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                          };
                          const nextLines = [...lines, newLine];
                          setLines(nextLines);
                          localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        }
                        set({ plan: tempPlan, billingCycle: tempCycle });
                        setPlanModalOpen(false);
                        showToast(lang === "es" ? "Plan actualizado correctamente"
                          : lang === "fr" ? "Forfait mis à jour avec succès"
                          : lang === "ja" ? "プランが正常に更新されました"
                          : lang === "zh" ? "方案已成功更新"
                          : lang === "ar" ? "تم تحديث الباقة بنجاح"
                          : lang === "hi" ? "प्लान सफलतापूर्वक अपडेट किया गया"
                          : lang === "pt" ? "Plano atualizado com sucesso"
                          : lang === "de" ? "Tarif erfolgreich aktualisiert"
                          : lang === "it" ? "Piano aggiornato con successo"
                          : lang === "ko" ? "플랜이 성공적으로 업데이트되었습니다"
                          : "Plan updated successfully");
                      };

                      const isUpgradingCycle = account.billingCycle === "monthly" && tempCycle === "yearly";
                      if (isUpgradingCycle) {
                        annualBillingConfirmCallback.current = proceedWithPlanSave;
                        setAnnualBillingConfirmOpen(true);
                      } else {
                        proceedWithPlanSave();
                      }
                    }}
                  >
                    {getModalButtonText()}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>
                  {lang === "es" ? "Seleccione el plan y el ciclo de facturación que mejor se adapte a sus necesidades:"
                    : lang === "fr" ? "Sélectionnez le forfait et le cycle de facturation qui vous conviennent :"
                    : lang === "ja" ? "ニーズに最適なプランと請求サイクルを選択してください:"
                    : lang === "zh" ? "选择最适合您需求的方案和账单周期:"
                    : lang === "ar" ? "اختر الباقة ودورة الفوترة التي تناسب احتياجاتك بشكل أفضل:"
                    : lang === "hi" ? "वह प्लान और बिलिंग चक्र चुनें जो आपकी आवश्यकताओं के सबसे अनुकूल हो:"
                    : lang === "pt" ? "Selecione o plano e o ciclo de cobrança que melhor atendam às suas necessidades:"
                    : lang === "de" ? "Wählen Sie den Tarif und Abrechnungszeitraum, der am besten zu Ihren Anforderungen passt:"
                    : lang === "it" ? "Seleziona il piano e il ciclo di fatturazione più adatti alle tue esigenze:"
                    : lang === "ko" ? "귀하의 필요에 가장 적합한 플랜과 결제 주기를 선택하세요:"
                    : "Select the plan and billing cycle that best fits your needs:"}
                </p>
                
                {/* Billing Cycle Toggle inside Modal */}
                <div style={{ display: "flex", justifyContent: "center", marginBlock: 5 }}>
                  <div className="seg" style={{ padding: 4 }}>
                    <button
                      className={`seg-btn ${tempCycle === "monthly" ? "active" : ""}`}
                      onClick={() => setTempCycle("monthly")}
                      style={{ padding: "6px 16px", fontSize: "0.88rem" }}
                    >
                      {lang === "es" ? "Mensual"
                       : lang === "fr" ? "Mensuel"
                       : lang === "ja" ? "月払い"
                       : lang === "zh" ? "按月"
                       : lang === "ar" ? "شهرياً"
                       : lang === "hi" ? "मासिक"
                       : lang === "pt" ? "Mensal"
                       : lang === "de" ? "Monatlich"
                       : lang === "it" ? "Mensile"
                       : lang === "ko" ? "월간"
                       : "Monthly"}
                    </button>
                    <button
                      className={`seg-btn ${tempCycle === "yearly" ? "active" : ""}`}
                      onClick={() => setTempCycle("yearly")}
                      style={{ 
                        padding: "6px 16px", 
                        fontSize: "0.88rem", 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: 6 
                      }}
                    >
                      {lang === "es" ? "Anual"
                     : lang === "fr" ? "Annuel"
                     : lang === "ja" ? "年払い"
                     : lang === "zh" ? "按年"
                     : lang === "ar" ? "سنوياً"
                     : lang === "hi" ? "वार्षिक"
                     : lang === "pt" ? "Anual"
                     : lang === "de" ? "Jährlich"
                     : lang === "it" ? "Annuale"
                     : lang === "ko" ? "연간"
                     : "Annual"}
                      <span style={{ 
                        fontSize: "0.72rem", 
                        fontWeight: 700, 
                        background: tempCycle === "yearly" ? "rgba(255, 255, 255, 0.25)" : "oklch(0.70 0.13 158 / 0.18)", 
                        color: tempCycle === "yearly" ? "#fff" : "oklch(0.42 0.13 158)",
                        padding: "2px 6px",
                        borderRadius: 999
                      }}>
                        {save17Map[lang] || save17Map.en}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plans Selection List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Essential Plan Option */}
                  <div 
                    className={`card ${tempPlan === "essential" ? "featured" : ""}`}
                    onClick={() => setTempPlan("essential")}
                    style={{ 
                      padding: 18, 
                      cursor: "pointer", 
                      border: tempPlan === "essential" ? "2px solid var(--blue)" : "1px solid var(--line)",
                      background: tempPlan === "essential" ? "var(--tint)" : "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: "var(--r-md)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "1.1rem" }}>
                          {lang === "es" ? "Plan Esencial"
                           : lang === "fr" ? "Forfait Essentiel"
                           : lang === "ja" ? "エッセンシャルプラン"
                           : lang === "zh" ? "基础版方案"
                           : lang === "ar" ? "الباقة الأساسية"
                           : lang === "hi" ? "एसेनशियल प्लान"
                           : lang === "pt" ? "Plano Essencial"
                           : lang === "de" ? "Essential-Tarif"
                           : lang === "it" ? "Piano Essenziale"
                           : lang === "ko" ? "에센셜 플랜"
                           : "Essential Plan"}
                        </b>
                        {account.plan === "essential" && (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {lang === "es" ? "Plan actual"
                             : lang === "fr" ? "Forfait actuel"
                             : lang === "ja" ? "現在のプラン"
                             : lang === "zh" ? "当前方案"
                             : lang === "ar" ? "الباقة الحالية"
                             : lang === "hi" ? "वर्तमान प्लान"
                             : lang === "pt" ? "Plano atual"
                             : lang === "de" ? "Aktueller Tarif"
                             : lang === "it" ? "Piano attuale"
                             : lang === "ko" ? "현재 플랜"
                             : "Current Plan"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                        {tempCycle === "yearly" ? "$12.42/mo" : "$14.99/mo"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>
                      {lang === "es" ? "Perfecto para familias individuales. Incluye 1 número y hasta 3 contactos."
                        : lang === "fr" ? "Idéal pour une configuration mono-famille. 1 numéro et 3 contacts max."
                        : lang === "ja" ? "単一家族のセットアップに最適。1つの番号と最大3つの連絡先が含まれます。"
                        : lang === "zh" ? "最适合单家庭使用。包含 1 个号码和最多 3 个联系人。"
                        : lang === "ar" ? "مثالي للعائلات المستقلة. يشمل رقماً واحداً وحتى 3 جهات اتصال."
                        : lang === "hi" ? "एकल-परिवार सेटअप के लिए बिल्कुल सही। इसमें 1 नंबर और 3 संपर्कों तक शामिल हैं।"
                        : lang === "pt" ? "Perfeito para configurações de família única. Inclui 1 número e até 3 contatos."
                        : lang === "de" ? "Perfekt für Einzelfamilien. Enthält 1 Rufnummer und bis zu 3 Kontakte."
                        : lang === "it" ? "Perfetto per configurazioni mono-famiglia. Include 1 numero e fino a 3 contatti."
                        : lang === "ko" ? "단일 가족 구성에 적합합니다. 1개의 번호와 최대 3개의 연락처를 포함합니다."
                        : "Perfect for single-family setups. Includes 1 number and up to 3 contacts."}
                    </p>
                  </div>

                  {/* Pro Plan Option */}
                  <div 
                    className={`card ${tempPlan === "pro" ? "featured" : ""}`}
                    onClick={() => setTempPlan("pro")}
                    style={{ 
                      padding: 18, 
                      cursor: "pointer", 
                      border: tempPlan === "pro" ? "2px solid var(--blue)" : "1px solid var(--line)",
                      background: tempPlan === "pro" ? "var(--tint)" : "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: "var(--r-md)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "1.1rem" }}>
                          {lang === "es" ? "Plan Pro"
                           : lang === "fr" ? "Forfait Pro"
                           : lang === "ja" ? "プロプラン"
                           : lang === "zh" ? "专业版方案"
                           : lang === "ar" ? "الباقة الاحترافية"
                           : lang === "hi" ? "प्रो प्लान"
                           : lang === "pt" ? "Plano Pro"
                           : lang === "de" ? "Pro-Tarif"
                           : lang === "it" ? "Piano Pro"
                           : lang === "ko" ? "프로 플랜"
                           : "Pro Plan"}
                        </b>
                        {account.plan === "pro" && (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {lang === "es" ? "Plan actual"
                             : lang === "fr" ? "Forfait actuel"
                             : lang === "ja" ? "現在のプラン"
                             : lang === "zh" ? "当前方案"
                             : lang === "ar" ? "الباقة الحالية"
                             : lang === "hi" ? "वर्तमान प्लान"
                             : lang === "pt" ? "Plano atual"
                             : lang === "de" ? "Aktueller Tarif"
                             : lang === "it" ? "Piano attuale"
                             : lang === "ko" ? "현재 플랜"
                             : "Current Plan"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                        {tempCycle === "yearly" ? "$20.75/mo" : "$24.99/mo"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>
                      {lang === "es" ? "Para grupos activos. Incluye 2 números, hasta 6 contactos, menús y horarios."
                        : lang === "fr" ? "Pour les aidants actifs. 2 numéros, 6 contacts max, menus et planning."
                        : lang === "ja" ? "アクティブな介護グループ向け。2つの番号、最大6つの連絡先、音声メニュー、スケジュール機能を含みます。"
                        : lang === "zh" ? "适合活跃的看护团队。包含 2 个号码、最多 6 个联系人、语音菜单和排班管理。"
                        : lang === "ar" ? "لمجموعات الرعاية النشطة. يشمل رقمين، وحتى 6 جهات اتصال، وقوائم اتصال، وجدولة التغطية."
                        : lang === "hi" ? "सक्रिय देखभाल समूहों के लिए। इसमें 2 नंबर, 6 संपर्कों तक, मेनू और शेड्यूलिंग शामिल हैं।"
                        : lang === "pt" ? "Para grupos de cuidados ativos. Inclui 2 números, até 6 contatos, menus e agendamento."
                        : lang === "de" ? "Für aktive Pflegegruppen. Enthält 2 Rufnummern, bis zu 6 Kontakte, Sprachmenüs und Schichtplanung."
                        : lang === "it" ? "Per gruppi di assistenza attivi. Include 2 numeri, fino a 6 contatti, menu e programmazione."
                        : lang === "ko" ? "활동적인 케어 그룹용. 2개의 번호, 최대 6개의 연락처, 메뉴 및 일정 관리 기능을 포함합니다."
                        : "For active care groups. Includes 2 numbers, up to 6 contacts, menus, and scheduling."}
                    </p>
                  </div>

                  {/* Care Team Plan Option */}
                  <div
                    className={`card ${tempPlan === "careteam" ? "featured" : ""}`}
                    onClick={() => setTempPlan("careteam")}
                    style={{
                      padding: 18,
                      cursor: "pointer",
                      border: tempPlan === "careteam" ? "2px solid var(--blue)" : "1px solid var(--line)",
                      background: tempPlan === "careteam" ? "var(--tint)" : "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: "var(--r-md)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "1.1rem" }}>
                          {lang === "es" ? "Plan Care Team"
                           : lang === "fr" ? "Forfait Care Team"
                           : lang === "ja" ? "ケアチームプラン"
                           : lang === "zh" ? "护理团队方案"
                           : lang === "ar" ? "باقة فريق الرعاية"
                           : lang === "hi" ? "केयर टीम प्लान"
                           : lang === "pt" ? "Plano Care Team"
                           : lang === "de" ? "Care-Team-Tarif"
                           : lang === "it" ? "Piano Care Team"
                           : lang === "ko" ? "케어 팀 플랜"
                           : "Care Team Plan"}
                        </b>
                        {account.plan === "careteam" && (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {lang === "es" ? "Plan actual"
                             : lang === "fr" ? "Forfait actuel"
                             : lang === "ja" ? "現在のプラン"
                             : lang === "zh" ? "当前方案"
                             : lang === "ar" ? "الباقة الحالية"
                             : lang === "hi" ? "वर्तमान प्लान"
                             : lang === "pt" ? "Plano atual"
                             : lang === "de" ? "Aktueller Tarif"
                             : lang === "it" ? "Piano attuale"
                             : lang === "ko" ? "현재 플랜"
                             : "Current Plan"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                        {tempCycle === "yearly" ? "$41.58/mo" : "$49.99/mo"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>
                      {lang === "es" ? "Para el cuidado compartido de varios seres queridos. Incluye 5 números, hasta 15 contactos, 150 minutos combinados y 2 accesos de cuidador."
                        : lang === "fr" ? "Pour l'aide partagée auprès de plusieurs proches. 5 numéros, 15 contacts max, 150 minutes mutualisées et 2 accès aidants."
                        : lang === "ja" ? "複数のご家族の見守りを分担するチーム向け。5つの番号、最大15の連絡先、共有150分、介護者ログイン2名分を含みます。"
                        : lang === "zh" ? "适合多位亲人共同看护。包含 5 个号码、最多 15 个联系人、150 分钟共享通话和 2 个看护人登录。"
                        : lang === "ar" ? "للرعاية المشتركة لعدة أحباء. يشمل 5 أرقام، وحتى 15 جهة اتصال، و150 دقيقة مشتركة، وحسابَي دخول."
                        : lang === "hi" ? "कई प्रियजनों की साझा देखभाल के लिए। इसमें 5 नंबर, 15 संपर्कों तक, 150 साझा मिनट और 2 केयरगिवर लॉगिन शामिल हैं।"
                        : lang === "pt" ? "Para o cuidado compartilhado de vários entes queridos. Inclui 5 números, até 15 contatos, 150 minutos combinados e 2 logins de cuidador."
                        : lang === "de" ? "Für die gemeinsame Betreuung mehrerer Angehöriger. Enthält 5 Rufnummern, bis zu 15 Kontakte, 150 gemeinsame Minuten und 2 Betreuer-Logins."
                        : lang === "it" ? "Per la cura condivisa di più persone care. Include 5 numeri, fino a 15 contatti, 150 minuti condivisi e 2 accessi caregiver."
                        : lang === "ko" ? "여러 가족을 함께 돌보는 팀용. 5개의 번호, 최대 15개의 연락처, 공유 150분, 보호자 로그인 2개를 포함합니다."
                        : "For shared caregiving across several loved ones. Includes 5 numbers, up to 15 contacts, 150 pooled minutes, and 2 caregiver logins."}
                    </p>
                  </div>
                </div>

                {/* Phone number picker if upgrading to Pro and current plan is Essential */}
                {tempPlan === "pro" && account.plan === "essential" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                    <b style={{ fontSize: "0.95rem", color: "var(--ink)", textAlign: "left" }}>
                      {lang === "es"
                        ? "Seleccione su segundo número de teléfono para el plan Pro:"
                        : lang === "fr"
                        ? "Sélectionnez votre deuxième numéro de téléphone pour le forfait Pro :"
                        : "Select your second phone number for the Pro plan:"}
                    </b>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)", margin: 0, textAlign: "left" }}>
                      {lang === "es"
                        ? "Busque por código de área para encontrar números locales disponibles:"
                        : lang === "fr"
                        ? "Recherchez par indicatif régional pour trouver des numéros locaux disponibles :"
                        : "Search by area code to find available local numbers:"}
                    </p>

                    {/* Search Bar */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid var(--line)",
                        borderRadius: "var(--r-md)",
                        padding: "6px 10px",
                        background: "var(--surface)",
                        flex: 1
                      }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)", fontWeight: 600 }}>
                          {lang === "es" ? "Cód. área" : lang === "fr" ? "Indicatif" : "Area code"}
                        </span>
                        <input
                          type="text"
                          maxLength={3}
                          value={upgradeAreaCode}
                          onChange={(e) => setUpgradeAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          onKeyDown={(e) => e.key === "Enter" && loadUpgradeNumbers(upgradeAreaCode)}
                          style={{
                            border: "none",
                            outline: "none",
                            width: "100%",
                            background: "transparent",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: "var(--ink)"
                          }}
                        />
                        {upgradeAreaCode.length === 3 && <AreaFlag areaCode={upgradeAreaCode} height={15} showAbbr />}
                      </div>
                      <button
                        className="btn btn-ghost"
                        onClick={() => loadUpgradeNumbers(upgradeAreaCode)}
                        disabled={upgradeAreaCode.length !== 3 || isSearchingNumbers}
                        style={{ padding: "8px 14px", height: 38 }}
                      >
                        {lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"}
                      </button>
                    </div>

                    {/* Suggestions */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {AREA_SUGGESTIONS.map((a) => (
                        <button
                          key={a.code}
                          onClick={() => { setUpgradeAreaCode(a.code); loadUpgradeNumbers(a.code); }}
                          style={{
                            fontSize: "0.76rem",
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "var(--bg)",
                            border: "1px solid var(--line)",
                            color: "var(--ink-soft)",
                            cursor: "pointer"
                          }}
                        >
                          {a.code} · {a.city}
                        </button>
                      ))}
                    </div>

                    {/* Results grid */}
                    {isSearchingNumbers ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--r-md)", animation: "pulse 1.5s infinite" }} />
                        ))}
                      </div>
                    ) : upgradeNumbersList.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto", padding: 2 }}>
                        {(upgradeNumbersList[0]?.area === "787" || upgradeNumbersList[0]?.area === "939") && (
                          <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                            {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                          </div>
                        )}
                        {upgradeNumbersList.map((n) => {
                          const isSelected = upgradeSelectedNumber?.number === n.number;
                          return (
                            <button
                              key={n.id}
                              onClick={() => setUpgradeSelectedNumber(n)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                padding: "8px 12px",
                                borderRadius: "var(--r-md)",
                                border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                                background: isSelected ? "var(--tint)" : "var(--surface)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textAlign: "left",
                                gap: 2
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <AreaFlag areaCode={n.area} />
                                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{n.number}</span>
                              </span>
                              <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                                {n.memorable || (lang === "es" ? "Número local" : lang === "fr" ? "Numéro local" : "Local number")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.86rem", color: "var(--ink-faint)", margin: 0 }}>
                        {lang === "es" ? "No se encontraron números." : lang === "fr" ? "Aucun numéro trouvé." : "No numbers found."}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone number selector if downgrading to Essential and has >1 number */}
                {tempPlan === "essential" && lines.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                    <b style={{ fontSize: "0.95rem", color: "var(--ink)", textAlign: "left" }}>
                      {lang === "es"
                        ? "Seleccione el número de teléfono que desea conservar:"
                        : lang === "fr"
                        ? "Sélectionnez le numéro de téléphone que vous souhaitez conserver :"
                        : "Select the phone number you wish to keep:"}
                    </b>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {lines.map((l) => (
                        <label
                          key={l.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            border: selectedLineToKeep === l.id ? "2px solid var(--blue)" : "1px solid var(--line)",
                            background: selectedLineToKeep === l.id ? "var(--tint)" : "transparent",
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <input
                            type="radio"
                            name="lineToKeep"
                            value={l.id}
                            checked={selectedLineToKeep === l.id}
                            onChange={() => setSelectedLineToKeep(l.id)}
                            style={{ width: 16, height: 16 }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                            <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{getLocalizedLineLabel(l.label, lang)}</span>
                            <span style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>{l.number}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <p style={{ 
                      fontSize: "0.82rem", 
                      color: "oklch(0.55 0.18 25)", 
                      background: "oklch(0.97 0.04 25 / 0.3)", 
                      border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                      borderRadius: "var(--r-md)",
                      padding: "8px 12px",
                      margin: 0,
                      fontWeight: 500,
                      textAlign: "left"
                    }}>
                      {lang === "es" ? "Una vez devuelto un número, ya no se puede reclamar nuevamente."
                      : lang === "fr" ? "Une fois un numéro restitué, vous ne pouvez plus le réclamer."
                      : lang === "ja" ? "一度返却された番号は、再度取得することはできません。"
                      : lang === "zh" ? "号码一旦退还，将无法再次申领。"
                      : lang === "ar" ? "بمجرد إرجاع الرقم، لا يمكنك المطالبة به مرة أخرى."
                      : lang === "hi" ? "एक बार नंबर वापस करने के बाद, आप उसे दोबारा क्लेम नहीं कर सकते।"
                      : lang === "pt" ? "Depois de devolver um número, você não poderá solicitá-lo novamente."
                      : lang === "de" ? "Sobald eine Nummer zurückgegeben wurde, kann sie nicht erneut beansprucht werden."
                      : lang === "it" ? "Una volta restituito un numero, non potrai più richiederlo."
                      : lang === "ko" ? "번호가 반환되면 다시 청구할 수 없습니다."
                      : "Once a number is returned, you can no longer claim it again."}
                    </p>
                  </div>
                )}
              </div>
            </Modal>
          )}

          {/* Add-on Numbers Configuration Modal */}
          {addonModalOpen && (
            <Modal
              title={lang === "es" ? "Configurar números adicionales de teléfono" : lang === "fr" ? "Configurer les numéros de téléphone supplémentaires" : "Configure Additional Phone Numbers"}
              onClose={() => setAddonModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setAddonModalOpen(false)}>
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={addedNumbersConfig.some(c => !c.selectedNumber) || addonCheckoutLoading}
                    onClick={async () => {
                      const newMinuteBlocks = tempMinuteBlocks;

                      // Determine which add-ons need checkout
                      const checkouts: Array<{ addon: string; quantity: number }> = [];
                      if (chargeableNewNumbers > 0) checkouts.push({ addon: "phone_number", quantity: chargeableNewNumbers });
                      if (newMinuteBlocks > 0) checkouts.push({ addon: "voice_minutes", quantity: newMinuteBlocks });

                      // Save the local state action for after payment(s) succeed
                      const applyAddons = () => {
                        setAccount((prev) => {
                          const updated = {
                            ...prev,
                            addons: {
                              ...(prev.addons || {}),
                              extraNumbers: (prev.addons?.extraNumbers || 0) + chargeableNewNumbers,
                              minuteBlocks: (prev.addons?.minuteBlocks || 0) + newMinuteBlocks,
                            } as Account["addons"],
                          };
                          localStorage.setItem("ic_account_data", JSON.stringify(updated));
                          return updated;
                        });
                        setTempExtraNumbers(0);
                        setTempMinuteBlocks(0);

                        const newLines = addedNumbersConfig.map((config, index) => ({
                          id: "line_" + Date.now() + "_" + index,
                          label: getLineDefaultLabel(lines.length + index, account.plan, lang),
                          person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                          number: config.selectedNumber!.number,
                          color: AVATAR_COLORS[(lines.length + index) % AVATAR_COLORS.length],
                          mode: "cascade" as const,
                          minutesUsed: 0,
                          contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                        }));

                        const nextLines = [...lines, ...newLines];
                        setLines(nextLines);
                        localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                        setAddonModalOpen(false);
                        showToast(ext.addonsUpdatedToast);
                      };

                      if (checkouts.length === 0) {
                        applyAddons();
                        return;
                      }

                      // Open popup immediately (must be synchronous within user gesture)
                      const w = 520, h = 720;
                      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
                      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
                      const popup = window.open("about:blank", "creem_addon_checkout", `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);

                      addonPopupRef.current = popup;
                      addonPendingAction.current = applyAddons;

                      // Clear any stale success flag before starting
                      localStorage.removeItem("creem_addon_success");

                      setAddonCheckoutLoading(true);

                      try {
                        const first = checkouts[0];
                        const res = await fetch("/api/creem/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ addon: first.addon, quantity: first.quantity }),
                        });
                        if (!res.ok) throw new Error("checkout_failed");
                        const { checkoutUrl } = await res.json();

                        if (popup) {
                          popup.location.href = checkoutUrl;
                        } else {
                          window.open(checkoutUrl, "_blank");
                        }

                        // Poll localStorage for success flag (focus events are unreliable after cross-origin popup nav)
                        const poll = setInterval(() => {
                          const raw = localStorage.getItem("creem_addon_success");
                          if (raw) {
                            try {
                              const { ts } = JSON.parse(raw);
                              if (Date.now() - ts < 60000) {
                                clearInterval(poll);
                                localStorage.removeItem("creem_addon_success");
                                try { popup?.close(); } catch {}
                                if (addonPopupRef.current === popup) {
                                  addonPopupRef.current = null;
                                }
                                applyAddons();
                              }
                            } catch {}
                          }
                        }, 800);

                        // Stop polling after 10 minutes
                        setTimeout(() => clearInterval(poll), 600000);
                      } catch {
                        console.error("Failed to create add-on checkout");
                        try { popup?.close(); } catch {}
                        if (addonPopupRef.current === popup) {
                          addonPopupRef.current = null;
                        }
                        addonPendingAction.current = null;
                        showToast(lang === "es" ? "No se pudo iniciar el proceso de pago. Por favor, inténtelo de nuevo."
                          : lang === "fr" ? "Impossible de lancer le paiement. Veuillez réessayer."
                          : lang === "ja" ? "チェックアウトを開始できませんでした。もう一度お試しください。"
                          : lang === "zh" ? "无法开始结账。请重试。"
                          : lang === "ar" ? "تعذر بدء عملية الدفع. يرجى المحاولة مرة أخرى."
                          : lang === "hi" ? "चेकआउट शुरू नहीं किया जा सका। कृपया पुनः प्रयास करें।"
                          : lang === "pt" ? "Não foi possível iniciar o checkout. Por favor, tente novamente."
                          : lang === "de" ? "Zahlungsvorgang konnte nicht gestartet werden. Bitte versuchen Sie es erneut."
                          : lang === "it" ? "Impossibile avviare il pagamento. Riprova."
                          : lang === "ko" ? "결제를 시작할 수 없습니다. 다시 시도해 주세요."
                          : "Could not start checkout. Please try again.");
                      } finally {
                        setAddonCheckoutLoading(false);
                      }
                    }}
                  >
                    {addonCheckoutLoading
                      ? <><div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", marginRight: 6 }} />{lang === "es" ? "Procesando…" : lang === "fr" ? "Traitement…" : lang === "ja" ? "処理中…" : lang === "zh" ? "处理中…" : lang === "ar" ? "جاري المعالجة…" : lang === "hi" ? "प्रसंस्करण…" : lang === "pt" ? "Processando…" : lang === "de" ? "Verarbeitung…" : lang === "it" ? "Elaborazione in corso…" : lang === "ko" ? "처리 중…" : "Processing…"}</>
                      : (chargeableNewNumbers > 0 || tempMinuteBlocks > 0
                        ? (lang === "es" ? "Aprobar y pagar" : lang === "fr" ? "Approuver et payer" : "Approve & Pay")
                        : (lang === "es" ? "Confirmar y guardar" : lang === "fr" ? "Confirmer et enregistrer" : "Confirm & Save"))}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Voice Minutes Confirmation Info */}
                {tempMinuteBlocks > 0 && (
                  <div style={{
                    fontSize: "0.9rem",
                    color: "var(--ink-soft)",
                    background: "var(--tint)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 500
                  }}>
                    <b>{lang === "es" ? "Confirmar minutos adicionales:" : lang === "fr" ? "Confirmer les minutes supplémentaires :" : "Confirm Extra Voice Minutes:"}</b>{" "}
                    {lang === "es"
                      ? `Agregando ${tempMinuteBlocks * 30} minutos adicionales.`
                      : lang === "fr"
                      ? `Ajout de ${tempMinuteBlocks * 30} minutes vocales supplémentaires.`
                      : `Adding ${tempMinuteBlocks * 30} extra voice minutes.`}
                  </div>
                )}

                {/* Billing Notice */}
                <div style={{
                  fontSize: "0.88rem",
                  color: "oklch(0.55 0.18 25)",
                  background: "oklch(0.97 0.04 25 / 0.3)",
                  border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 14px",
                  fontWeight: 500,
                  textAlign: "left",
                  lineHeight: "1.4"
                }}>
                  <b>
                    {lang === "es" ? "Aviso de facturación:" 
                      : lang === "fr" ? "Avis de facturation :" 
                      : lang === "ja" ? "請求に関するお知らせ:"
                      : lang === "zh" ? "账单通知:"
                      : lang === "ar" ? "إشعار الفواتير:"
                      : lang === "hi" ? "बिलिंग सूचना:"
                      : lang === "pt" ? "Aviso de faturamento:"
                      : lang === "de" ? "Abrechnungshinweis:"
                      : lang === "it" ? "Avviso di fatturazione:"
                      : lang === "ko" ? "결제 안내:"
                      : "Billing Notice:"}
                  </b>{" "}
                  {chargeableNewNumbers > 0 || tempMinuteBlocks > 0 ? (
                    tempMinuteBlocks > 0 ? (
                      lang === "es" ? "La facturación de los números y minutos adicionales comenzará inmediatamente después de aprobar los complementos."
                        : lang === "fr" ? "La facturation des numéros supplémentaires et des minutes vocales supplémentaires sera effective immédiatement après l'approbation des options."
                        : lang === "ja" ? "アドオン番号と追加通話分の請求は、アドオンの承認後すぐに開始されます。"
                        : lang === "zh" ? "附加号码和额外通话分钟数的计费将在批准附加服务后立即生效。"
                        : lang === "ar" ? "سيبدأ تحصيل فواتير الأرقام الإضافية ودقائق المكالمات الزائدة فور الموافقة على الخدمات الإضافية."
                        : lang === "hi" ? "ऐड-ऑन नंबरों और अतिरिक्त वॉयस मिनटों की计费将在批准附加服务后立即生效。"
                        : lang === "pt" ? "A cobrança dos números adicionais e minutos de voz extras entrará em vigor imediatamente após a aprovação dos adicionais."
                        : lang === "de" ? "Die Abrechnung für die Zusatzrufnummern und zusätzlichen Sprachminuten erfolgt sofort nach Genehmigung der Zusatzoptionen."
                        : lang === "it" ? "La fatturazione per i numeri aggiuntivi e i minuti di conversazione extra sarà effettiva immediatamente dopo l'approvazione delle opzioni."
                        : lang === "ko" ? "추가 번호 및 추가 음성 통화 분 요금은 부가 서비스를 승인하는 즉시 청구됩니다."
                        : "Billing for the add-on numbers and extra voice minutes will be effective immediately upon approving the add-ons."
                    ) : (
                      lang === "es"
                        ? "La facturación de los números adicionales comenzará inmediatamente después de aprobar los complementos."
                        : lang === "fr" ? "La facturation des numéros supplémentaires sera effective immédiatement après l'approbation des options."
                        : lang === "ja" ? "アドオン番号の請求は、アドオンの承認後すぐに開始されます。"
                        : lang === "zh" ? "附加号码的计费将在批准附加服务后立即生效。"
                        : lang === "ar" ? "سيبدأ تحصيل فواتير الأرقام الإضافية فور الموافقة على الخدمات الإضافية."
                        : lang === "hi" ? "ऐड-ऑन नंबरों की计费将在批准附加服务后立即生效。"
                        : lang === "pt" ? "A cobrança dos números adicionais entrará em vigor imediatamente após a aprovação dos adicionais."
                        : lang === "de" ? "Die Abrechnung für die Zusatzrufnummern erfolgt sofort nach Genehmigung der Zusatzoptionen."
                        : lang === "it" ? "La fatturazione per i numeri aggiuntivi sarà effettiva immediatamente dopo l'approvazione delle opzioni."
                        : lang === "ko" ? "추가 번호 요금은 부가 서비스를 승인하는 즉시 청구됩니다."
                        : "Billing for the add-on numbers will be effective immediately upon approving the add-ons."
                    )
                  ) : (
                    lang === "es" ? "Esta línea adicional está incluida en su plan sin costo adicional."
                      : lang === "fr" ? "Cette ligne supplémentaire est incluse dans votre forfait sans frais supplémentaires."
                      : lang === "ja" ? "この追加回線はプランに含まれており、追加料金はかかりません。"
                      : lang === "zh" ? "此附加线路已包含在您的方案中，无需额外费用。"
                      : lang === "ar" ? "هذا الخط الإضافي مشمول في باقتك دون أي تكلفة إضافية."
                      : lang === "hi" ? "यह अतिरिक्त लाइन आपके प्लान में बिना किसी अतिरिक्त शुल्क के शामिल है।"
                      : lang === "pt" ? "Esta linha adicional está incluída no seu plano sem custo extra."
                      : lang === "de" ? "Diese zusätzliche Leitung ist ohne zusätzliche Kosten in Ihrem Tarif enthalten."
                      : lang === "it" ? "Questa linea aggiuntiva è inclusa nel tuo piano senza costi aggiuntivi."
                      : lang === "ko" ? "이 추가 회선은 플랜에 포함되어 있어 추가 비용이 발생하지 않습니다."
                      : "This additional line is included in your plan at no additional cost."
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                  {addedNumbersConfig.map((config) => (
                    <div key={config.index} style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-lg)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      background: "var(--bg-card)",
                      textAlign: "left"
                    }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 800 553.0305"
                          style={{ width: "24px", height: "auto", display: "block", flexShrink: 0 }}
                        >
                          <g>
                            <path fill="#1c2530" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                            <path fill="#1c2530" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
                          </g>
                          <path fill="#4083ae" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
                        </svg>
                        {lang === "es" 
                          ? `Número adicional ${currentExtraLines + config.index + 1}` 
                          : lang === "fr" 
                          ? `Numéro supplémentaire ${currentExtraLines + config.index + 1}` 
                          : `Additional Number ${currentExtraLines + config.index + 1}`}
                        {config.selectedNumber && (
                          <span style={{ fontSize: "0.8rem", color: "var(--blue)", fontWeight: 500 }}>
                            ({config.selectedNumber.number})
                          </span>
                        )}
                      </h4>

                      {/* Search Bar */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          border: "1px solid var(--line)",
                          borderRadius: "var(--r-md)",
                          padding: "6px 10px",
                          background: "var(--surface)",
                          flex: 1
                        }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)", fontWeight: 600 }}>
                            {lang === "es" ? "Cód. área" : lang === "fr" ? "Indicatif" : "Area code"}
                          </span>
                          <input
                            type="text"
                            maxLength={3}
                            value={config.areaCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                              setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, areaCode: val } : c));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && config.areaCode.length === 3) {
                                loadAddonNumberSlot(config.index, config.areaCode);
                              }
                            }}
                            style={{
                              border: "none",
                              outline: "none",
                              width: "100%",
                              background: "transparent",
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              color: "var(--ink)"
                            }}
                          />
                          {config.areaCode.length === 3 && <AreaFlag areaCode={config.areaCode} height={15} showAbbr />}
                        </div>
                        <button
                          className="btn btn-ghost"
                          onClick={() => loadAddonNumberSlot(config.index, config.areaCode)}
                          disabled={config.areaCode.length !== 3 || config.isSearching}
                          style={{ padding: "8px 14px", height: 38 }}
                        >
                          {lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"}
                        </button>
                      </div>

                      {/* Suggestions */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {AREA_SUGGESTIONS.map((a) => (
                          <button
                            key={a.code}
                            onClick={() => {
                              setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, areaCode: a.code } : c));
                              loadAddonNumberSlot(config.index, a.code);
                            }}
                            style={{
                              fontSize: "0.76rem",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "var(--bg)",
                              border: "1px solid var(--line)",
                              color: "var(--ink-soft)",
                              cursor: "pointer"
                            }}
                          >
                            {a.code} · {a.city}
                          </button>
                        ))}
                      </div>

                      {/* Results grid */}
                      {config.isSearching ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--r-md)", animation: "pulse 1.5s infinite" }} />
                          ))}
                        </div>
                      ) : config.numbersList && config.numbersList.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto", padding: 2 }}>
                          {(config.numbersList[0]?.area === "787" || config.numbersList[0]?.area === "939") && (
                            <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                              {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                            </div>
                          )}
                          {config.numbersList.map((n) => {
                            const isSelected = config.selectedNumber?.number === n.number;
                            return (
                              <button
                                key={n.id}
                                onClick={() => setAddedNumbersConfig(prev => prev.map(c => c.index === config.index ? { ...c, selectedNumber: n } : c))}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  padding: "8px 12px",
                                  borderRadius: "var(--r-md)",
                                  border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                                  background: isSelected ? "var(--tint)" : "var(--surface)",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  textAlign: "left",
                                  gap: 2
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <AreaFlag areaCode={n.area} />
                                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{n.number}</span>
                                </span>
                                <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                                  {n.memorable || (lang === "es" ? "Número local" : lang === "fr" ? "Numéro local" : "Local number")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", color: "var(--ink-faint)", textAlign: "center", padding: 12 }}>
                          {lang === "es" 
                            ? "Ingrese un código de área para buscar números disponibles" 
                            : lang === "fr" 
                            ? "Entrez un indicatif pour rechercher les numéros disponibles" 
                            : "Enter an area code to search for available numbers"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Modal>
          )}

          {/* Add-on Numbers Removal Modal */}
          {addonRemovalModalOpen && (
            <Modal
              title={lang === "es" ? "Seleccionar números a devolver" : lang === "fr" ? "Sélectionner les numéros à restituer" : "Select Phone Numbers to Return"}
              onClose={() => setAddonRemovalModalOpen(false)}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button className="btn btn-ghost" onClick={() => setAddonRemovalModalOpen(false)}>
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={selectedLinesToRemove.length !== Math.max(0, -tempExtraNumbers)}
                    onClick={() => {
                      // Filter out returned lines
                      const nextLines = lines.filter(l => !selectedLinesToRemove.includes(l.id));
                      setLines(nextLines);
                      localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));

                      // Update account addons
                      setAccount((prev) => {
                        const updated = {
                          ...prev,
                          addons: {
                            ...(prev.addons || {}),
                            extraNumbers: Math.max(0, (prev.addons?.extraNumbers || 0) + tempExtraNumbers),
                          } as Account["addons"],
                        };
                        localStorage.setItem("ic_account_data", JSON.stringify(updated));
                        return updated;
                      });

                      setTempExtraNumbers(0);
                      setAddonRemovalModalOpen(false);
                      showToast(ext.addonsUpdatedToast);
                    }}
                  >
                    {lang === "es" ? "Confirmar y guardar" : lang === "fr" ? "Confirmer et enregistrer" : "Confirm & Save"}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem", textAlign: "left" }}>
                  {lang === "es"
                    ? `Debe seleccionar exactamente ${Math.max(0, -tempExtraNumbers)} número(s) para devolver:`
                    : lang === "fr"
                    ? `Vous devez sélectionner exactement ${Math.max(0, -tempExtraNumbers)} numéro(s) à restituer :`
                    : `You must select exactly ${Math.max(0, -tempExtraNumbers)} phone number(s) to return:`}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lines.slice(planConfig(a.plan).includedLines).map((l) => {
                    const isSelected = selectedLinesToRemove.includes(l.id);
                    return (
                      <label
                        key={l.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                          background: isSelected ? "var(--tint)" : "transparent",
                          borderRadius: "var(--r-md)",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedLinesToRemove(prev => prev.filter(id => id !== l.id));
                            } else {
                              setSelectedLinesToRemove(prev => [...prev, l.id]);
                            }
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                          <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{getLocalizedLineLabel(l.label, lang)}</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>{l.number}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <p style={{ 
                  fontSize: "0.82rem", 
                  color: "oklch(0.55 0.18 25)", 
                  background: "oklch(0.97 0.04 25 / 0.3)", 
                  border: "1px solid oklch(0.85 0.08 25 / 0.3)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 12px",
                  margin: 0,
                  fontWeight: 500,
                  textAlign: "left"
                }}>
                  {lang === "es" ? "Una vez devuelto un número, ya no se puede reclamar nuevamente."
                  : lang === "fr" ? "Une fois un numéro restitué, vous ne pouvez plus le réclamer."
                  : lang === "ja" ? "一度返却された番号は、再度取得することはできません。"
                  : lang === "zh" ? "号码一旦退还，将无法再次申领。"
                  : lang === "ar" ? "بمجرد إرجاع الرقم، لا يمكنك المطالبة به مرة أخرى."
                  : lang === "hi" ? "एक बार नंबर वापस करने के बाद, आप उसे दोबारा क्लेม नहीं कर सकते।"
                  : lang === "pt" ? "Depois de devolver um número, você não poderá solicitá-lo novamente."
                  : lang === "de" ? "Sobald eine Nummer zurückgegeben wurde, kann sie nicht erneut beansprucht werden."
                  : lang === "it" ? "Una volta restituito un numero, non potrai più richiederlo."
                  : lang === "ko" ? "번호가 반환되면 다시 청구할 수 없습니다."
                  : "Once a number is returned, you can no longer claim it again."}
                </p>
              </div>
            </Modal>
          )}

          {/* Annual Billing Confirmation Modal */}
          {annualBillingConfirmOpen && (
            <Modal
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 800 553.0305"
                    style={{ width: "28px", height: "auto", display: "block", flexShrink: 0 }}
                  >
                    <g>
                      <path fill="#1c2530" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                      <path fill="#1c2530" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
                    </g>
                    <path fill="#4083ae" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
                  </svg>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>iCanCall</span>
                </div>
              }
              onClose={() => {
                setAnnualBillingConfirmOpen(false);
                annualBillingConfirmCallback.current = null;
              }}
              footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setAnnualBillingConfirmOpen(false);
                      annualBillingConfirmCallback.current = null;
                    }}
                  >
                    {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : lang === "ja" ? "キャンセル" : lang === "zh" ? "取消" : lang === "ar" ? "إلغاء" : lang === "hi" ? "रद्द करें" : lang === "pt" ? "Cancelar" : lang === "de" ? "Abbrechen" : lang === "it" ? "Annulla" : lang === "ko" ? "취소" : "Cancel"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setAnnualBillingConfirmOpen(false);
                      if (annualBillingConfirmCallback.current) {
                        annualBillingConfirmCallback.current();
                        annualBillingConfirmCallback.current = null;
                      }
                    }}
                  >
                    {lang === "es" ? "Confirmar" : lang === "fr" ? "Confirmer" : lang === "ja" ? "確認" : lang === "zh" ? "确认" : lang === "ar" ? "تأكيد" : lang === "hi" ? "पुष्टि करें" : lang === "pt" ? "Confirmar" : lang === "de" ? "Bestätigen" : lang === "it" ? "Conferma" : lang === "ko" ? "확인" : "Confirm"}
                  </button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.98rem", margin: 0, lineHeight: 1.5 }}>
                  {lang === "es"
                    ? "¿Está seguro de que desea cambiar a la facturación anual? Su método de pago registrado se cargará de inmediato."
                    : lang === "fr"
                    ? "Êtes-vous sûr de vouloir passer à la facturation annuelle ? Votre mode de paiement enregistré sera débité immédiatement."
                    : lang === "ja"
                    ? "年間請求に切り替えてもよろしいですか？登録済みのお支払い方法にすぐに請求されます。"
                    : lang === "zh"
                    ? "确定要切换为按年计费吗？将立即从您登记的付款方式中扣款。"
                    : lang === "ar"
                    ? "هل أنت متأكد أنك تريد التحول إلى الفوترة السنوية؟ سيتم الخصم فوراً من وسيلة الدفع المسجلة."
                    : lang === "hi"
                    ? "क्या आप वाकई वार्षिक बिलिंग पर स्विच करना चाहते हैं? आपकी दर्ज भुगतान विधि से तुरंत शुल्क लिया जाएगा।"
                    : lang === "pt"
                    ? "Tem certeza de que deseja mudar para a cobrança anual? Seu método de pagamento cadastrado será cobrado imediatamente."
                    : lang === "de"
                    ? "Möchten Sie wirklich zur jährlichen Abrechnung wechseln? Ihre hinterlegte Zahlungsmethode wird sofort belastet."
                    : lang === "it"
                    ? "Sei sicuro di voler passare alla fatturazione annuale? Il tuo metodo di pagamento registrato verrà addebitato immediatamente."
                    : lang === "ko"
                    ? "연간 결제로 전환하시겠습니까? 등록된 결제 수단으로 즉시 청구됩니다."
                    : "Are you sure you want to switch to annual billing? Your payment method on file will be charged immediately."}
                </p>
                <div style={{
                  fontSize: "0.92rem",
                  color: "var(--blue)",
                  background: "var(--tint)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 14px",
                  fontWeight: 600
                }}>
                  {(() => {
                    const annual = planConfig(account.plan).annualAmount.toFixed(2);
                    const usd = `$${annual}`;
                    const fr = `${annual.replace(".", ",")} $`;
                    return lang === "es"
                    ? `Monto de facturación anual: ${usd}/año`
                    : lang === "fr"
                    ? `Montant de la facturation annuelle : ${fr}/an`
                    : lang === "ja"
                    ? `年間請求額: ${usd}/年`
                    : lang === "zh"
                    ? `年度计费金额：${usd}/年`
                    : lang === "ar"
                    ? `مبلغ الفوترة السنوية: ${usd} سنوياً`
                    : lang === "hi"
                    ? `वार्षिक बिलिंग राशि: ${usd}/वर्ष`
                    : lang === "pt"
                    ? `Valor da cobrança anual: ${usd}/ano`
                    : lang === "de"
                    ? `Jährlicher Abrechnungsbetrag: ${usd}/Jahr`
                    : lang === "it"
                    ? `Importo della fatturazione annuale: ${usd}/anno`
                    : lang === "ko"
                    ? `연간 결제 금액: ${usd}/년`
                    : `Annual billing amount: ${usd}/yr`;
                  })()}
                </div>
              </div>
            </Modal>
          )}

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.billing}</h2>
                <p>
                  {account.billingCycle === "yearly"
                    ? (lang === "es" ? "Facturado anualmente · renueva el 1 de junio de 2026"
                     : lang === "fr" ? "Facturé annuellement · se renouvelle le 1er juin 2026"
                     : lang === "ja" ? "年次請求 · 2026年6月1日に更新"
                     : lang === "zh" ? "按年计费 · 于 2026年6月1日续期"
                     : lang === "ar" ? "مفوتر سنوياً · يتجدد في 1 يونيو 2026"
                     : lang === "hi" ? "सालाना बिलिंग · 1 जून, 2026 को नवीनीकृत होगा"
                     : lang === "pt" ? "Cobrado anualmente · renova em 1 de junho de 2026"
                     : lang === "de" ? "Jährliche Abrechnung · verlängert sich am 1. Juni 2026"
                     : lang === "it" ? "Fatturato annualmente · si rinnova il 1 giugno 2026"
                     : lang === "ko" ? "연간 결제 · 2026년 6월 1일에 갱신 예정"
                     : "Billed annually · renews June 1, 2026")
                    : d.account.renewDateSub}
                </p>
              </div>
              <Badge kind={account.plan === "essential" ? "amber" : "blue"}>
                {account.plan === "careteam"
                  ? (lang === "ja" ? "ケアチーム"
                   : lang === "ko" ? "케어 팀"
                   : lang === "zh" ? "护理团队"
                   : lang === "ar" ? "فريق الرعاية"
                   : lang === "hi" ? "केयर टीम"
                   : "Care Team")
                  : account.plan === "pro"
                  ? (lang === "ja" ? "プロ"
                   : lang === "ko" ? "프로"
                   : lang === "zh" ? "专业版"
                   : lang === "ar" ? "برو"
                   : "Pro")
                  : (lang === "es" ? "Esencial"
                   : lang === "fr" ? "Essentiel"
                   : lang === "ja" ? "エッセンシャル"
                   : lang === "zh" ? "基础版"
                   : lang === "ar" ? "أساسي"
                   : lang === "hi" ? "एसेनशियल"
                   : lang === "pt" ? "Essencial"
                   : lang === "de" ? "Essential"
                   : lang === "it" ? "Essenziale"
                   : lang === "ko" ? "에센셜"
                   : "Essential")}
              </Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  {account.billingCycle === "yearly"
                    ? `$${(planConfig(account.plan).annualAmount / 12).toFixed(2)}`
                    : planConfig(account.plan).monthlyLabel}
                </span>
                <span style={{ color: "var(--ink-faint)" }}>
                  {lang === "es" ? "/ mes" : lang === "fr" ? "/ mois" : lang === "ja" ? "/ 月" : lang === "zh" ? "/ 月" : lang === "ar" ? "/ شهر" : lang === "hi" ? "/ महीना" : lang === "pt" ? "/ mês" : lang === "de" ? "/ Monat" : lang === "it" ? "/ mese" : lang === "ko" ? "/ 월" : "/ month"}
                </span>
                {account.billingCycle === "yearly" && (
                  <span style={{ fontSize: "0.95rem", color: "var(--ink-faint)", marginLeft: 6 }}>
                    {(() => {
                      const yr = planConfig(account.plan).annualAmount;
                      return lang === "es" ? `(facturado anualmente a $${yr}/año)`
                       : lang === "fr" ? `(facturé annuellement à ${yr} $/an)`
                       : lang === "ja" ? `(年額 $${yr} で請求)`
                       : lang === "zh" ? `(按年计费，每年 $${yr})`
                       : lang === "ar" ? `(تُخصم سنوياً بقيمة ${yr}$/السنة)`
                       : lang === "hi" ? `(सालाना $${yr} शुल्क)`
                       : lang === "pt" ? `(cobrado anualmente a $${yr}/ano)`
                       : lang === "de" ? `(jährliche Abrechnung von ${yr} $/Jahr)`
                       : lang === "it" ? `(fatturato annualmente a ${yr} $/anno)`
                       : lang === "ko" ? `(연간 $${yr} 청구)`
                       : `(billed annually at $${yr}/yr)`;
                    })()}
                  </span>
                )}
                {account.billingCycle !== "yearly" && (
                  <span style={{ marginLeft: 10 }}>
                    <Badge kind="green">{ext.saveAnnual}</Badge>
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 24px",
                  marginTop: 18,
                }}
                className="feat-grid"
              >
                {((account.plan === "pro" ? d.account.billingFeatures : undefined) || [
                  (() => {
                    const n = planConfig(account.plan).includedLines;
                    return lang === "es" ? `${n} número(s) de teléfono dedicado(s)`
                    : lang === "fr" ? `${n} numéro(s) de sécurité dédié(s)`
                    : lang === "ja" ? `専用電話番号 ${n} 個`
                    : lang === "zh" ? `${n} 个专用电话号码`
                    : lang === "ar" ? `${n} رقم هاتف مخصص`
                    : lang === "hi" ? `${n} समर्पित फ़ोन नंबर`
                    : lang === "pt" ? `${n} número(s) de telefone dedicado(s)`
                    : lang === "de" ? `${n} dedizierte Telefonnummer(n)`
                    : lang === "it" ? `${n} numero(i) di telefono dedicato(i)`
                    : lang === "ko" ? `전용 전화번호 ${n}개`
                    : `${n} dedicated phone number${n === 1 ? "" : "s"}`;
                  })(),

                  (() => {
                    const c = planConfig(account.plan).contactsPerLine;
                    return lang === "es" ? `Hasta ${c} contactos por número`
                    : lang === "fr" ? `Jusqu'à ${c} contacts par numéro`
                    : lang === "ja" ? `1番号あたり最大${c}つの連絡先`
                    : lang === "zh" ? `每个号码最多 ${c} 个可路由联系人`
                    : lang === "ar" ? `حتى ${c} جهات اتصال لكل رقم`
                    : lang === "hi" ? `प्रति नंबर ${c} रूट करने योग्य संपर्क`
                    : lang === "pt" ? `Até ${c} contatos por número`
                    : lang === "de" ? `Bis zu ${c} Kontakte pro Nummer`
                    : lang === "it" ? `Fino a ${c} contatti per numero`
                    : lang === "ko" ? `번호당 최대 ${c}개의 연결 연락처`
                    : `${c} routable contacts per number`;
                  })(),

                  lang === "es" ? "Enrutamiento en cascada (Secuencial)"
                  : lang === "fr" ? "Appel en cascade (séquentiel)"
                  : lang === "ja" ? "順次着信転送 (シーケンシャル)"
                  : lang === "zh" ? "顺次呼叫路由 (顺序联络)"
                  : lang === "ar" ? "توجيه المكالمات بالتتابع"
                  : lang === "hi" ? "कॉल कैस्केड (क्रमिक)"
                  : lang === "pt" ? "Roteamento em cascata (Sequencial)"
                  : lang === "de" ? "Anruf-Kaskade (sequenziell)"
                  : lang === "it" ? "Routing a cascata (Sequenziale)"
                  : lang === "ko" ? "순차적 통화 전환"
                  : "Call Cascade (Sequential)",

                  lang === "es" ? "Alertas por correo electrónico"
                  : lang === "fr" ? "Alertes e-mail en temps réel"
                  : lang === "ja" ? "リアルタイムメール通知"
                  : lang === "zh" ? "实时电子邮件提醒"
                  : lang === "ar" ? "تنبيهات البريد الإلكتروني الفورية"
                  : lang === "hi" ? "वास्तविक समय ईमेल अलर्ट"
                  : lang === "pt" ? "Alertas de e-mail em tempo real"
                  : lang === "de" ? "E-Mail-Benachrichtigungen in Echtzeit"
                  : lang === "it" ? "Avvisi e-mail in tempo reale"
                  : lang === "ko" ? "실시간 이메일 알림"
                  : "Real-time email alerts",

                  lang === "es" ? "Buzón de voz estándar"
                  : lang === "fr" ? "Boîte messagerie standard"
                  : lang === "ja" ? "標準ボイスメールボックス"
                  : lang === "zh" ? "标准语音信箱"
                  : lang === "ar" ? "صندوق بريد صوتي قياسي"
                  : lang === "hi" ? "मानक वॉयस मेल बॉक्स"
                  : lang === "pt" ? "Caixa de correio de voz padrão"
                  : lang === "de" ? "Standard-Mailbox"
                  : lang === "it" ? "Segreteria telefonica standard"
                  : lang === "ko" ? "기본 음성 사물함"
                  : "Standard voicemail box",

                  lang === "es" ? "DASHBOARD de administración"
                  : lang === "fr" ? "Tableau de bord administrateur"
                  : lang === "ja" ? "管理者ダッシュボード"
                  : lang === "zh" ? "管理控制台"
                  : lang === "ar" ? "لوحة تحكم المشرف"
                  : lang === "hi" ? "प्रशासक डैशबोर्ड"
                  : lang === "pt" ? "Painel de administração"
                  : lang === "de" ? "Administrator-Dashboard"
                  : lang === "it" ? "Pannello di controllo amministratore"
                  : lang === "ko" ? "관리자 대시보드"
                  : "Admin dashboard"
                ]).map((f: string) => (
                  <div className="plan-feat" key={f}>
                    <Icon name="check" /> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
                <div className="seg" style={{ padding: 4 }}>
                  <button
                    className={`seg-btn ${account.billingCycle === "monthly" ? "active" : ""}`}
                    onClick={() => {
                      set({ billingCycle: "monthly" });
                      showToast(lang === "es" ? "Cambiado a facturación mensual"
                        : lang === "fr" ? "Facturation mensuelle activée"
                        : lang === "ja" ? "月額プランの請求に切り替えました"
                        : lang === "zh" ? "已切换为按月计费"
                        : lang === "ar" ? "تم التحويل إلى الدفع الشهري"
                        : lang === "hi" ? "मासिक बिलिंग पर स्विच किया गया"
                        : lang === "pt" ? "Alterado para cobrança mensal"
                        : lang === "de" ? "Auf monatliche Abrechnung umgestellt"
                        : lang === "it" ? "Passato alla fatturazione mensile"
                        : lang === "ko" ? "월간 결제로 전환되었습니다"
                        : "Switched to monthly billing");
                    }}
                    style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                  >
                    {lang === "es" ? "Mensual"
                     : lang === "fr" ? "Mensuel"
                     : lang === "ja" ? "月払い"
                     : lang === "zh" ? "按月"
                     : lang === "ar" ? "شهرياً"
                     : lang === "hi" ? "मासिक"
                     : lang === "pt" ? "Mensal"
                     : lang === "de" ? "Monatlich"
                     : lang === "it" ? "Mensile"
                     : lang === "ko" ? "월간"
                     : "Monthly"}
                  </button>
                  <button
                    className={`seg-btn ${account.billingCycle === "yearly" ? "active" : ""}`}
                    onClick={() => {
                      const proceedWithYearlySwitch = () => {
                        set({ billingCycle: "yearly" });
                        const yr = planConfig(account.plan).annualAmount;
                        showToast(account.plan === "pro"
                          ? ext.annualToast.replace("{price}", planConfig(a.plan).annualLabel)
                          : (lang === "es" ? `Cambiado a facturación anual — $${yr}/año`
                           : lang === "fr" ? `Facturation annuelle activée — ${yr} $/an`
                           : lang === "ja" ? `年額プランに切り替えました — $${yr}/年`
                           : lang === "zh" ? `已切换为按年计费 — $${yr}/年`
                           : lang === "ar" ? `تم التحويل إلى الدفع السنوي — ${yr}$/السنة`
                           : lang === "hi" ? `वार्षिक बिलिंग पर स्विच किया गया — $${yr}/वर्ष`
                           : lang === "pt" ? `Alterado para cobrança anual — $${yr}/ano`
                           : lang === "de" ? `Auf jährliche Abrechnung umgestellt — ${yr} $/Jahr`
                           : lang === "it" ? `Passato alla fatturazione annuale — ${yr} $/anno`
                           : lang === "ko" ? `연간 결제로 전환되었습니다 — $${yr}/년`
                           : `Switched to annual billing — $${yr}/yr`));
                      };

                      if (account.billingCycle === "monthly") {
                        annualBillingConfirmCallback.current = proceedWithYearlySwitch;
                        setAnnualBillingConfirmOpen(true);
                      } else {
                        proceedWithYearlySwitch();
                      }
                    }}
                    style={{ 
                      padding: "8px 16px", 
                      fontSize: "0.9rem", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 6 
                    }}
                  >
                    {lang === "es" ? "Anual"
                     : lang === "fr" ? "Annuel"
                     : lang === "ja" ? "年払い"
                     : lang === "zh" ? "按年"
                     : lang === "ar" ? "سنوياً"
                     : lang === "hi" ? "वार्षिक"
                     : lang === "pt" ? "Anual"
                     : lang === "de" ? "Jährlich"
                     : lang === "it" ? "Annuale"
                     : lang === "ko" ? "연간"
                     : "Annual"}
                    <span style={{ 
                      fontSize: "0.72rem", 
                      fontWeight: 700, 
                      background: account.billingCycle === "yearly" ? "rgba(255, 255, 255, 0.25)" : "oklch(0.70 0.13 158 / 0.18)", 
                      color: account.billingCycle === "yearly" ? "#fff" : "oklch(0.42 0.13 158)",
                      padding: "2px 6px",
                      borderRadius: 999
                    }}>
                      {save17Map[lang] || save17Map.en}
                    </span>
                  </button>
                </div>
                <button className="btn btn-ghost" onClick={() => setPlanModalOpen(true)}>
                  <Icon name="spark" /> {ext.changePlan}
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const planMaxIncluded = planConfig(a.plan).includedLines;
            const unusedPlanLines = Math.max(0, planMaxIncluded - lines.length);
            const chargeableNewNumbers = tempExtraNumbers > 0 ? Math.max(0, tempExtraNumbers - unusedPlanLines) : tempExtraNumbers;
            
            const numCost = chargeableNewNumbers * 6.99;
            const minCost = tempMinuteBlocks * 4.99;
            const total = numCost + minCost;
            const maxBlocks = 10;

            const proceedWithSaveAddons = (delta: number, minBlocksToSave: number) => {
              if (delta > 0 || minBlocksToSave > 0) {
                if (delta > 0) {
                  // Initialize configuration slots for the newly added numbers
                  const initialConfig: AddonNumberSlotConfig[] = Array.from({ length: delta }).map((_, idx) => ({
                    index: idx,
                    areaCode: "470",
                    numbersList: [],
                    selectedNumber: null,
                    isSearching: true,
                  }));
                  setAddedNumbersConfig(initialConfig);
                  initialConfig.forEach((c) => loadAddonNumberSlot(c.index, "470"));
                } else {
                  setAddedNumbersConfig([]);
                }
                setAddonModalOpen(true);
              } else if (delta < 0) {
                // User is removing numbers, must choose which ones to return
                setSelectedLinesToRemove([]);
                setAddonRemovalModalOpen(true);
              } else {
                // Just resetting minutes or no changes at all
                setTempMinuteBlocks(0);
                showToast(ext.addonsUpdatedToast);
              }
            };

            const handleSaveAddons = () => {
              proceedWithSaveAddons(tempExtraNumbers, tempMinuteBlocks);
            };

            return (
              <>
                <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addOns}</h2>
                    <p>{d.account.addonsPlansSub}</p>
                  </div>
                </div>
                <div className="card-pad" style={{ paddingTop: 8 }}>
                  <div className="addon">
                    <span className="aic">
                      <Icon name="phone" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{d.account.addonNumbersTitle}</b>
                        <span className="price">{lang === "es" ? "$6.99 / mes c/u" : lang === "fr" ? "6,99 $ / mois chacun" : lang === "ja" ? "各 $6.99 / 月" : lang === "zh" ? "每个 $6.99 / 月" : lang === "ar" ? "$6.99 / شهرياً لكل رقم" : lang === "hi" ? "$6.99 / माह प्रत्येक" : lang === "pt" ? "$6.99 / mês cada" : lang === "de" ? "6,99 $ / Monat pro Nummer" : lang === "it" ? "6,99 $ / mese ciascuno" : lang === "ko" ? "개당 $6.99 / 월" : "$6.99 / mo each"}</span>
                      </div>
                      <p>
                        {d.account.addonNumbersDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="stepper">
                        <button
                          onClick={() => {
                            setTempExtraNumbers(Math.max(-currentExtraLines, tempExtraNumbers - 1));
                          }}
                          disabled={tempExtraNumbers === -currentExtraLines}
                          aria-label="Remove one"
                        >
                          −
                        </button>
                        <span className="v">{tempExtraNumbers > 0 ? `+${tempExtraNumbers}` : tempExtraNumbers}</span>
                        <button
                          onClick={() => {
                            setTempExtraNumbers(Math.min(8 - currentExtraLines, tempExtraNumbers + 1));
                          }}
                          disabled={tempExtraNumbers === 8 - currentExtraLines}
                          aria-label="Add one"
                        >
                          +
                        </button>
                      </div>
                      <span className="sub">
                        {tempExtraNumbers > 0 
                          ? (numCost > 0 
                            ? `+$${numCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}` 
                            : (lang === "es" ? "Incluido" : lang === "fr" ? "Inclus" : "Included"))
                          : tempExtraNumbers < 0 
                          ? `-$${Math.abs(tempExtraNumbers * 6.99).toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}` 
                          : `$0.00/${lang === "es" ? "mes" : lang === "fr" ? "mois" : "mo"}`}
                      </span>

                    </div>
                  </div>

                  <div className="addon">
                    <span className="aic">
                      <Icon name="clock" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{ext.extraMinTitle}</b>
                        <span className="price">{ext.extraMinPrice}</span>
                      </div>
                      <p>
                        {ext.extraMinDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="rangewrap">
                        <input
                          type="range"
                          className="rng"
                          min={0}
                          max={maxBlocks}
                          step={1}
                          value={tempMinuteBlocks}
                          style={{ "--pct": `${(tempMinuteBlocks / maxBlocks) * 100}%` } as React.CSSProperties}
                          onChange={(e) => setTempMinuteBlocks(Number(e.target.value))}
                        />
                      </div>
                      <span className="sub">
                        {tempMinuteBlocks * 30} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"} · {minCost > 0 ? `+$${minCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}` : `$0.00/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}`}
                      </span>
                    </div>
                  </div>

                  <div className="addon-total">
                    <span className="lbl">
                      {lang === "es" ? "Total mensual de complementos" : lang === "fr" ? "Total mensuel des options" : "Add-ons monthly total"}
                    </span>
                    <span className="big">
                      {total < 0 ? `-$${Math.abs(total).toFixed(2)}` : `$${total.toFixed(2)}`}
                      <span> / {lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={handleSaveAddons}>
                      <Icon name="check" /> {ext.saveAddons}
                    </button>
                  </div>
                </div>
              </div>

            </>
          );
        })()}

          {(() => {
            const ad = a.addons || {};
            const planBaseMinutes = planConfig(a.plan).voiceMinutes;
            const addonMinutes = (ad.minuteBlocks || 0) * 30;
            const purchased = planBaseMinutes + addonMinutes;
            const rollover = ad.rolloverMin || 0;
            const total = purchased + rollover;
            const used = Math.min(ad.usedMin || 0, total);
            const remaining = Math.max(0, total - used);
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const low = total > 0 && remaining <= total * 0.15;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addonMinutesTitle}</h2>
                    <p>{ext.addonMinutesDesc}</p>
                  </div>
                  {total > 0 && <Badge kind={low ? "amber" : "green"}>{low ? ext.runningLow : ext.rollsOver}</Badge>}
                </div>
                <div className="card-pad">
                  {total === 0 ? (
                    <div className="mb-empty">
                      <span className="ic">
                        <Icon name="clock" />
                      </span>
                      <div>
                        <b>{ext.noAddonMinYet}</b>
                        <p>
                          {ext.noAddonMinDesc}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-top">
                        <div className="big">
                          {remaining}
                          <span> {ext.minRemaining}</span>
                        </div>
                        <div className="mb-meta">
                          {used} {lang === "es" ? "de" : lang === "fr" ? "sur" : lang === "ja" ? "の" : lang === "zh" ? "共" : lang === "ar" ? "من" : lang === "hi" ? "कुल" : lang === "pt" ? "de" : lang === "de" ? "von" : lang === "it" ? "di" : lang === "ko" ? "중" : "of"} {total} {ext.addonMinUsed} &middot; {lang === "es" ? "renueva el 1 de junio de 2026" : lang === "fr" ? "renouvellement le 1er juin 2026" : lang === "ja" ? "2026年6月1日に更新" : lang === "zh" ? "于 2026年6月1日续期" : lang === "ar" ? "يتجدد في 1 يونيو 2026" : lang === "hi" ? "1 जून, 2026 को नवीनीकृत होगा" : lang === "pt" ? "renova em 1 de junho de 2026" : lang === "de" ? "verlängert sich am 1. Juni 2026" : lang === "it" ? "si rinnova il 1 giugno 2026" : lang === "ko" ? "2026년 6월 1일에 갱신 예정" : "renews June 1, 2026"}
                        </div>
                      </div>
                      <div className="usage-bar bigbar" style={{ marginTop: 14 }}>
                        <i className={low ? "warn" : ""} style={{ width: pct + "%" }} />
                      </div>
                      <div className="mb-stats">
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="plus" />
                          </span>
                          <div>
                            <b>{purchased} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>
                              {ext.thisCycleTopup}
                              {` · ${planBaseMinutes} ${lang === "es" ? "min del plan" : lang === "fr" ? "min du forfait" : lang === "ja" ? "基本プラン分" : lang === "zh" ? "套餐分钟" : lang === "ar" ? "دقيقة الباقة" : lang === "hi" ? "प्लान मिनट" : lang === "pt" ? "min do plano" : lang === "de" ? "Inklusivminuten" : lang === "it" ? "min del piano" : lang === "ko" ? "기본 제공 분" : "plan min"}${ad.minuteBlocks ? ` + ${ad.minuteBlocks} × 30 ${lang === "es" ? "min adicionales" : lang === "fr" ? "min supplémentaires" : lang === "ja" ? "分追加" : lang === "zh" ? "分钟充值" : lang === "ar" ? "دقيقة إضافية" : lang === "hi" ? "अतिरिक्त मिनट" : lang === "pt" ? "min adicionais" : lang === "de" ? "Zusatzminuten" : lang === "it" ? "min aggiuntivi" : lang === "ko" ? "추가 충전 분" : "add-on min"}` : ""}`}
                            </span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="refresh" />
                          </span>
                          <div>
                            <b>{rollover} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.rolledOverFromLast}</span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="phone" />
                          </span>
                          <div>
                            <b>{used} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.usedThisCycle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pooled Minutes Breakdown & Notice */}
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", textAlign: "left" }}>
                        <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: "0 0 10px", color: "var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{lang === "es" ? "Uso por número (Grupo compartido)"
                            : lang === "fr" ? "Usage par numéro (Pool partagé)"
                            : lang === "ja" ? "番号ごとの使用量 (共有プール)"
                            : lang === "zh" ? "按号码使用量 (共享池)"
                            : lang === "ar" ? "الاستخدام حسب الرقم (مجموعة مشتركة)"
                            : lang === "hi" ? "नंबर द्वारा उपयोग (साझा पूल)"
                            : lang === "pt" ? "Uso por número (Pool compartilhado)"
                            : lang === "de" ? "Nutzung nach Nummer (Gemeinsamer Pool)"
                            : lang === "it" ? "Utilizzo per numero (Pool condiviso)"
                            : lang === "ko" ? "번호별 사용량 (공유 풀)"
                            : "Usage by Number (Shared Pool)"}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--blue)", fontWeight: 500 }}>
                            {lang === "es" ? "Pool de Minutos Compartido"
                              : lang === "fr" ? "Minutes partagées"
                              : lang === "ja" ? "共有通話分プール"
                              : lang === "zh" ? "共享分钟数池"
                              : lang === "ar" ? "مجموعة الدقائق المشتركة"
                              : lang === "hi" ? "साझा मिनट पूल"
                              : lang === "pt" ? "Pool de minutos compartilhado"
                              : lang === "de" ? "Gemeinsamer Minuten-Pool"
                              : lang === "it" ? "Pool di minuti condivisi"
                              : lang === "ko" ? "공유 통화 시간 풀"
                              : "Shared Minutes Pool"}
                          </span>
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {lines.map((l) => (
                            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                                <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>{getLocalizedLineLabel(l.label, lang)}</span>
                                <span style={{ color: "var(--ink-faint)", fontSize: "0.78rem" }}>{l.number}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                                {l.minutesUsed || 0}{" "}
                                {lang === "ja" ? "分"
                                 : lang === "zh" ? "分钟"
                                 : lang === "ar" ? "دقيقة"
                                 : lang === "hi" ? "मिनट"
                                 : lang === "ko" ? "분"
                                 : "min"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const planMaxIncluded = planConfig(a.plan).includedLines;
                          const planActive = Math.min(planMaxIncluded, lines.length);
                          const addonActive = Math.max(0, lines.length - planMaxIncluded);
                          // Localized short plan name (Care Team keeps its brand name across locales).
                          const nm = (proName: string, essName: string) =>
                            a.plan === "careteam" ? "Care Team" : a.plan === "pro" ? proName : essName;

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                                {lang === "es" ? `Plan ${nm("Pro", "Esencial")}: ${planActive} de ${planMaxIncluded} números de teléfono incluidos activados`
                               : lang === "fr" ? `Forfait ${nm("Pro", "Essentiel")}: ${planActive} sur ${planMaxIncluded} numéros de téléphone inclus actifs`
                               : lang === "ja" ? `${nm("Pro", "エッセンシャル")}プラン：含まれている電話番号 ${planActive} / ${planMaxIncluded} 個が有効`
                               : lang === "zh" ? `${nm("专业版", "基础版")}方案：包含的 ${planMaxIncluded} 个电话号码中已启用 ${planActive} 个`
                               : lang === "ar" ? `باقة ${nm("برو", "أساسي")}: ${planActive} من أصل ${planMaxIncluded} أرقام هواتف مشمولة نشطة`
                               : lang === "hi" ? `${nm("प्रो", "एसेनशियल")} प्लान: शामिल ${planMaxIncluded} फ़ोन नंबरों में से ${planActive} सक्रिय हैं`
                               : lang === "pt" ? `Plano ${nm("Pro", "Essencial")}: ${planActive} de ${planMaxIncluded} número(s) de telefone incluído(s) ativo(s)`
                               : lang === "de" ? `${nm("Pro", "Essential")}-Tarif: ${planActive} von ${planMaxIncluded} enthaltenen Telefonnummern aktiv`
                               : lang === "it" ? `Piano ${nm("Pro", "Essenziale")}: ${planActive} di ${planMaxIncluded} numeri di telefono inclusi attivi`
                               : lang === "ko" ? `${nm("Pro", "에센셜")} 플랜: 포함된 ${planMaxIncluded}개의 전화번호 중 ${planActive}개 활성화됨`
                               : `${nm("Pro", "Essential")} plan: ${planActive} of ${planMaxIncluded} included phone numbers active`}
                              </div>
                              {addonActive > 0 ? (
                                <div style={{ fontSize: "0.82rem", color: "var(--blue)", fontWeight: 500 }}>
                                  {lang === "es" ? `${addonActive} número(s) de teléfono adicional(es) activo(s) ($${(addonActive * 6.99).toFixed(2)}/mes)`
                                  : lang === "fr" ? `${addonActive} número(s) de téléphone supplémentaire(s) actif(s) ($${(addonActive * 6.99).toFixed(2)}/mois)`
                                  : lang === "ja" ? `${addonActive} 個の追加電話番号が有効 ($${(addonActive * 6.99).toFixed(2)}/月)`
                                  : lang === "zh" ? `${addonActive} 个启用的附加电话号码 (每个 $${(addonActive * 6.99).toFixed(2)}/月)`
                                  : lang === "ar" ? `${addonActive} رقم (أرقام) هاتف إضافي نشط ($${(addonActive * 6.99).toFixed(2)}/شهر)`
                                  : lang === "hi" ? `${addonActive} सक्रिय ऐड-ऑन फ़ोन नंबर ($${(addonActive * 6.99).toFixed(2)}/माह)`
                                  : lang === "pt" ? `${addonActive} número(s) de telefone adicional(is) ativo(s) ($${(addonActive * 6.99).toFixed(2)}/mês)`
                                  : lang === "de" ? `${addonActive} aktive Zusatz-Telefonnummer(n) ($${(addonActive * 6.99).toFixed(2)}/Monat)`
                                  : lang === "it" ? `${addonActive} numero/i di telefono aggiuntivo/i attivo/i ($${(addonActive * 6.99).toFixed(2)}/mese)`
                                  : lang === "ko" ? `${addonActive}개의 활성화된 추가 전화번호 ($${(addonActive * 6.99).toFixed(2)}/월)`
                                  : `${addonActive} active add-on phone number(s) ($${(addonActive * 6.99).toFixed(2)}/mo)`}
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                        <p style={{ fontSize: "0.76rem", color: "var(--ink-faint)", margin: "10px 0 0", lineHeight: "1.4" }}>
                          {lang === "es" ? "Todos los números de esta cuenta comparten el mismo fondo de minutos mensuales e incorporados."
                           : lang === "fr" ? "Tous les numéros de ce compte partagent le même pool de minutes mensuelles et d'options."
                           : lang === "ja" ? "このアカウントのすべての電話番号は、プランの無料通話分と追加の通話分の同じプールを共有します。"
                           : lang === "zh" ? "此账户下的所有电话号码共享同一个套餐分钟数和附加分钟数池。"
                           : lang === "ar" ? "تشترك جميع أرقام الهواتف في هذا الحساب في نفس مجموعة دقائق الباقة والدقائق الإضافية."
                           : lang === "hi" ? "इस खाते के सभी फ़ोन नंबर प्लान मिनटों और ऐड-ऑन मिनटों के समान पूल को साझा करते हैं।"
                           : lang === "pt" ? "Todos os números de telefone desta conta compartilham o mesmo pool de minutos do plano e minutos adicionais."
                           : lang === "de" ? "Alle Telefonnummern dieses Kontos nutzen denselben Pool an Tarifminuten und Zusatzminuten gemeinsam."
                           : lang === "it" ? "Tutti i numeri di telefono su questo account condividono lo stesso pool di minuti del piano e minuti aggiuntivi."
                           : lang === "ko" ? "이 계정의 모든 전화번호는 플랜 통화 분수와 추가 통화 분수의 동일한 풀을 공유합니다."
                           : "All phone numbers on this account share the same pool of plan minutes and add-on minutes."}
                        </p>
                      </div>

                      <p className="mb-note">
                        <Icon name="check" /> {ext.addonMinNote}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.paymentMethod}</h2>
                <p>{ext.chargedOnFirst}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="card-on-file">
                <span className="card-brand">{a.card.brand.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="cnum">•••• •••• •••• {a.card.last4}</div>
                  <div className="cexp">{lang === "es" ? "Vence" : lang === "fr" ? "Expire le" : lang === "ja" ? "有効期限" : lang === "zh" ? "有效期至" : lang === "ar" ? "تنتهي في" : lang === "hi" ? "समाप्ति तिथि" : lang === "pt" ? "Expira em" : lang === "de" ? "Gültig bis" : lang === "it" ? "Scade il" : lang === "ko" ? "만료일" : "Expires"} {a.card.exp}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    showToast(lang === "es" ? "Abriendo el portal de facturación…"
                      : lang === "fr" ? "Ouverture du portail de facturation…"
                      : lang === "ja" ? "請求ポータルを開いています…"
                      : lang === "zh" ? "正在打开账单门户…"
                      : lang === "ar" ? "جاري فتح بوابة الفواتير…"
                      : lang === "hi" ? "बिलिंग पोर्टल खोला जा रहा है…"
                      : lang === "pt" ? "Abrindo portal de faturamento…"
                      : lang === "de" ? "Kundenportal wird geöffnet…"
                      : lang === "it" ? "Apertura del portale di fatturazione…"
                      : lang === "ko" ? "결제 포털을 여는 중…"
                      : "Opening billing portal…");
                    try {
                      const res = await fetch("/api/creem/portal", { method: "POST" });
                      if (!res.ok) {
                        const err = await res.json();
                        showToast(err.error || (lang === "es" ? "No se pudo abrir el portal de facturación."
                          : lang === "fr" ? "Impossible d'ouvrir le portail de facturation."
                          : lang === "ja" ? "請求ポータルを開くことができませんでした。"
                          : lang === "zh" ? "无法打开账单门户。"
                          : lang === "ar" ? "تعذر فتح بوابة الفواتير."
                          : lang === "hi" ? "बिलिंग पोर्टल नहीं खोला जा सका।"
                          : lang === "pt" ? "Não foi possível abrir o portal de faturamento."
                          : lang === "de" ? "Kundenportal konnte nicht geöffnet werden."
                          : lang === "it" ? "Impossibile aprire il portale di fatturazione."
                          : lang === "ko" ? "결제 포털을 열 수 없습니다."
                          : "Could not open billing portal."));
                        return;
                      }
                      const { portalUrl } = await res.json();
                      const w = 560, h = 700;
                      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
                      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
                      window.open(portalUrl, "creem_portal", `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
                    } catch {
                      showToast(lang === "es" ? "No se pudo abrir el portal de facturación."
                        : lang === "fr" ? "Impossible d'ouvrir le portail de facturation."
                        : lang === "ja" ? "請求ポータルを開くことができませんでした。"
                        : lang === "zh" ? "无法打开账单门户。"
                        : lang === "ar" ? "تعذر فتح بوابة الفواتير."
                        : lang === "hi" ? "बिलिंग पोर्टल नहीं खोला जा सका।"
                        : lang === "pt" ? "Não foi possível abrir o portal de faturamento."
                        : lang === "de" ? "Kundenportal konnte nicht geöffnet werden."
                        : lang === "it" ? "Impossibile aprire il portale di fatturazione."
                        : lang === "ko" ? "결제 포털을 열 수 없습니다."
                        : "Could not open billing portal.");
                    }
                  }}
                >
                  <Icon name="card" /> {ext.updateCard}
                </button>
              </div>
              <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
                <label>{d.account.billingAddress}</label>
                <input value={a.billingAddr} onChange={(e) => set({ billingAddr: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                  <Icon name="check" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{ext.billingHistory}</h2>
                <p>{lang === "es" ? "Visa terminada en" : lang === "fr" ? "Visa se terminant par" : lang === "ja" ? "末尾が" : lang === "zh" ? "末尾为" : lang === "ar" ? "بطاقة Visa التي تنتهي بـ" : lang === "hi" ? "वीजा अंत" : lang === "pt" ? "Visa terminando em" : lang === "de" ? "Visa mit der Endung" : lang === "it" ? "Visa che termina con" : lang === "ko" ? "끝자리" : "Visa ending"} {a.card.last4}{lang === "ja" ? "のVisa" : lang === "ko" ? "인 Visa" : ""}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {/* Sample invoices, but they must at least bill the plan this
                  account is on rather than a hardcoded Pro subscription. */}
              {[
                [lang === "es" ? "1 de mayo de 2026" : lang === "fr" ? "1 mai 2026" : lang === "ja" ? "2026年5月1日" : lang === "zh" ? "2026年5月1日" : lang === "ar" ? "1 مايو 2026" : lang === "hi" ? "1 मई, 2026" : lang === "pt" ? "1 de maio de 2026" : lang === "de" ? "1. Mai 2026" : lang === "it" ? "1 maggio 2026" : lang === "ko" ? "2026년 5월 1일" : "May 1, 2026", planInvoiceDesc, planInvoiceAmount],
                [lang === "es" ? "1 de abr de 2026" : lang === "fr" ? "1 avr. 2026" : lang === "ja" ? "2026年4月1日" : lang === "zh" ? "2026年4月1日" : lang === "ar" ? "1 أبريل 2026" : lang === "hi" ? "1 अप्रैल, 2026" : lang === "pt" ? "1 de abr de 2026" : lang === "de" ? "1. Apr. 2026" : lang === "it" ? "1 aprile 2026" : lang === "ko" ? "2026년 4월 1일" : "Apr 1, 2026", planInvoiceDesc, planInvoiceAmount],
                [lang === "es" ? "1 de mar de 2026" : lang === "fr" ? "1 mars 2026" : lang === "ja" ? "2026年3月1日" : lang === "zh" ? "2026年3月1日" : lang === "ar" ? "1 مارس 2026" : lang === "hi" ? "1 मार्च, 2026" : lang === "pt" ? "1 de mar de 2026" : lang === "de" ? "1. März 2026" : lang === "it" ? "1 marzo 2026" : lang === "ko" ? "2026년 3월 1일" : "Mar 1, 2026", planInvoiceDesc, planInvoiceAmount],
              ].map(([dVal, desc, amt]) => {
                return (
                  <div className="invoice" key={dVal}>
                    <div className="l">
                      <b>{dVal}</b>
                      <span>{desc}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span className="amt">{amt}</span>
                      <a
                        className="btn btn-soft btn-sm"
                        href={`/api/caregiver/receipt?date=${encodeURIComponent(dVal)}&desc=${encodeURIComponent(desc)}&amount=${encodeURIComponent(amt)}&last4=${encodeURIComponent(a.card.last4)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                      >
                        <Icon name="download" /> {ext.receipt}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head">
              <div>
                <h2>{ext.cancelSubscription}</h2>
                <p>{ext.cancelSubscriptionDesc}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <button
                className="btn btn-danger-ghost"
                onClick={() => showToast(ext.cancelToast)}
              >
                {ext.cancelPlan.replace("{plan}", planName)}
              </button>
            </div>
          </div>

          {/* Care Team caregiver seats — self-hides unless the plan includes seats */}
          {viewerRole === "owner" && <SeatsManager showToast={showToast} lang={lang} />}
        </>
      )}
    </div>
  );
}
