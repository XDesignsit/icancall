import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { sendSeatInviteEmail } from "@/lib/mail";
import { planConfig } from "@/lib/planConfig";
import { resolveAccount, seatLimit, occupiedInviteeSeats, type SeatMember } from "@/lib/account";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

async function loadProfile(id: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Strip server-only fields (invite tokens) before returning members to the client. */
function publicMembers(members: SeatMember[]) {
  return members.map((m) => ({
    email: m.email,
    status: m.status,
    invitedAt: m.invitedAt,
    acceptedAt: m.acceptedAt,
  }));
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveAccount(session.userId);
  const owner = await loadProfile(resolved.accountId);
  const plan = owner?.settings?.plan || "essential";
  const members: SeatMember[] = owner?.settings?.seats?.members || [];

  return NextResponse.json({
    success: true,
    role: resolved.role,
    plan,
    seatLimit: seatLimit(plan),
    supportsSeats: planConfig(plan).seats > 1,
    members: publicMembers(members),
    ownerName: owner?.name || owner?.email || "Account owner",
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Seat management is owner-only: a member cannot invite or revoke.
  const resolved = await resolveAccount(session.userId);
  if (resolved.role !== "owner") {
    return NextResponse.json({ error: "Only the account owner can manage caregiver seats." }, { status: 403 });
  }

  const { action, email } = await req.json();
  const ownerId = resolved.accountId;
  const owner = await loadProfile(ownerId);
  if (!owner) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const plan = owner.settings?.plan || "essential";
  if (planConfig(plan).seats <= 1) {
    return NextResponse.json({ error: "Your plan does not include additional caregiver seats." }, { status: 400 });
  }

  const settings = owner.settings || {};
  const seats = settings.seats || {};
  const members: SeatMember[] = seats.members || [];

  if (action === "invite") {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (normalized === (owner.email || "").toLowerCase()) {
      return NextResponse.json({ error: "You already own this account." }, { status: 400 });
    }
    if (members.some((m) => m.email.toLowerCase() === normalized)) {
      return NextResponse.json({ error: "That caregiver has already been invited." }, { status: 400 });
    }
    // Seat cap: owner occupies one seat, invitees fill the rest.
    if (occupiedInviteeSeats(members) >= seatLimit(plan) - 1) {
      return NextResponse.json({ error: "All caregiver seats on your plan are in use." }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const member: SeatMember = {
      email: normalized,
      status: "invited",
      token,
      invitedAt: new Date().toISOString(),
    };
    const nextMembers = [...members, member];

    await supabase
      .from("profiles")
      .update({ settings: { ...settings, seats: { ...seats, members: nextMembers } } })
      .eq("id", ownerId);

    const host = req.headers.get("host") || "localhost:3000";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const acceptLink = `${proto}://${host}/accept-invite?owner=${ownerId}&token=${token}`;

    await sendSeatInviteEmail(normalized, owner.name || "A caregiver", acceptLink);

    return NextResponse.json({ success: true, members: publicMembers(nextMembers) });
  }

  if (action === "revoke") {
    const normalized = String(email || "").trim().toLowerCase();
    const target = members.find((m) => m.email.toLowerCase() === normalized);
    if (!target) {
      return NextResponse.json({ error: "No such caregiver on this account." }, { status: 404 });
    }
    const nextMembers = members.filter((m) => m.email.toLowerCase() !== normalized);

    await supabase
      .from("profiles")
      .update({ settings: { ...settings, seats: { ...seats, members: nextMembers } } })
      .eq("id", ownerId);

    // If the revoked caregiver had accepted, unlink their profile so they lose access.
    if (target.userId) {
      const memberProfile = await loadProfile(target.userId);
      if (memberProfile?.settings?.memberOf === ownerId) {
        const ms = { ...memberProfile.settings };
        delete ms.memberOf;
        await supabase.from("profiles").update({ settings: ms }).eq("id", target.userId);
      }
    }

    return NextResponse.json({ success: true, members: publicMembers(nextMembers) });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
