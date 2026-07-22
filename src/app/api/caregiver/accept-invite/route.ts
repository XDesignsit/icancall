import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { planConfig } from "@/lib/planConfig";
import type { SeatMember } from "@/lib/account";

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || !session.email) {
    return NextResponse.json({ error: "Please sign in to accept your invitation.", needsAuth: true }, { status: 401 });
  }

  const { owner: ownerId, token } = await req.json();
  if (!ownerId || !token) {
    return NextResponse.json({ error: "This invitation link is invalid." }, { status: 400 });
  }

  if (ownerId === session.userId) {
    return NextResponse.json({ error: "You can't accept an invitation to your own account." }, { status: 400 });
  }

  const owner = await loadProfile(ownerId);
  if (!owner) {
    return NextResponse.json({ error: "This invitation is no longer valid." }, { status: 404 });
  }

  const settings = owner.settings || {};
  const seats = settings.seats || {};
  const members: SeatMember[] = seats.members || [];
  const invite = members.find((m) => m.status === "invited" && m.token === token);
  // Idempotency: a retried accept (e.g. double-submit) whose token was already
  // consumed is fine if this same user already holds the seat — fall through
  // and re-assert the membership link rather than erroring.
  const alreadyAccepted = members.find((m) => m.status === "active" && m.userId === session.userId);

  if (!invite && !alreadyAccepted) {
    return NextResponse.json({ error: "This invitation has expired or was already used." }, { status: 400 });
  }

  // The invitation is bound to the address it was sent to.
  if (invite && invite.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invite.email}. Please sign in with that email to accept it.` },
      { status: 403 }
    );
  }

  if (planConfig(settings.plan).seats <= 1) {
    return NextResponse.json({ error: "This account's plan no longer includes caregiver seats." }, { status: 400 });
  }

  // Link the accepting caregiver's own profile to the owner's account FIRST, so
  // an interrupted accept never leaves a seat marked active without its link.
  const selfProfile = await loadProfile(session.userId);
  const selfSettings = selfProfile?.settings || {};
  if (selfSettings.memberOf !== ownerId) {
    await supabase
      .from("profiles")
      .update({ settings: { ...selfSettings, memberOf: ownerId } })
      .eq("id", session.userId);
  }

  // Mark the seat active and drop the one-time token (no-op if already active).
  if (invite) {
    const nextMembers = members.map((m) =>
      m.token === token
        ? { email: m.email, status: "active" as const, invitedAt: m.invitedAt, acceptedAt: new Date().toISOString(), userId: session.userId }
        : m
    );
    await supabase
      .from("profiles")
      .update({ settings: { ...settings, seats: { ...seats, members: nextMembers } } })
      .eq("id", ownerId);
  }

  return NextResponse.json({ success: true, ownerName: owner.name || owner.email || "the account" });
}
