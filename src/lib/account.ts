import { supabase } from "./supabase";
import { planConfig } from "./planConfig";

// Care Team introduces multiple caregiver logins ("seats") on one account.
// The account owner holds the subscription; an invited caregiver is a separate
// auth user whose profile is linked back to the owner via settings.memberOf.
// Data (phone lines, contacts, routing, greetings) belongs to the owner, so
// caregiver API routes operate on the *effective* account id resolved here —
// the owner's id for a member, or the user's own id for an owner.

export type SeatRole = "owner" | "member";

export interface SeatMember {
  email: string;
  status: "invited" | "active";
  token?: string;        // present only while status === "invited"
  invitedAt: string;
  acceptedAt?: string;
  userId?: string;       // set once the invite is accepted
}

export interface ResolvedAccount {
  /** Account whose data (lines/contacts/settings) the user acts on. */
  accountId: string;
  /** The authenticated user's own id. */
  selfId: string;
  role: SeatRole;
}

/** Seat capacity for a plan (owner counts as one seat). */
export function seatLimit(plan: string | undefined | null): number {
  return planConfig(plan).seats;
}

/** Active + still-pending members currently occupying a seat besides the owner. */
export function occupiedInviteeSeats(members: SeatMember[]): number {
  return members.filter((m) => m.status === "active" || m.status === "invited").length;
}

/**
 * Resolve a session user id to the account they act on. A user linked as an
 * active member of another account resolves to that owner's account; otherwise
 * they are their own account owner. The membership is re-validated against the
 * owner's seat list on every call so a revoked member immediately loses access.
 */
export async function resolveAccount(userId: string): Promise<ResolvedAccount> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, settings")
      .eq("id", userId)
      .maybeSingle();

    const ownerId = profile?.settings?.memberOf;
    if (ownerId && ownerId !== userId) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("id, settings")
        .eq("id", ownerId)
        .maybeSingle();

      const members: SeatMember[] = owner?.settings?.seats?.members || [];
      const stillActive = members.some((m) => m.userId === userId && m.status === "active");
      if (owner && stillActive) {
        return { accountId: ownerId, selfId: userId, role: "member" };
      }
    }
  } catch (err) {
    console.error("resolveAccount error:", err);
  }
  return { accountId: userId, selfId: userId, role: "owner" };
}
