import { prisma } from "@/lib/prisma";

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "XX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function pad(num: number): string {
  return String(num).padStart(3, "0");
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Computes the displayId for a new worker at registration time.
 *
 * - No referrer: "HH-001" (based on the site-wide direct-join counter)
 * - With referrer: "<referrer's base displayId>-<position>/<new worker's initials>"
 *   where <position> = number of existing referrals by that referrer + 1
 */
export async function computeNewWorkerDisplayId(
  fullName: string,
  referrerId: string | null
): Promise<{ displayId: string; initials: string }> {
  const initials = getInitials(fullName);

  if (!referrerId) {
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const nextSeq = (settings?.directJoinCounter ?? 0) + 1;

    await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: { directJoinCounter: nextSeq },
      create: { id: "global", directJoinCounter: nextSeq }
    });

    return { displayId: `${initials}-${pad(nextSeq)}`, initials };
  }

  const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
  if (!referrer || !referrer.initials) {
    // Fallback: treat as direct join if referrer data is somehow incomplete
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const nextSeq = (settings?.directJoinCounter ?? 0) + 1;
    await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: { directJoinCounter: nextSeq },
      create: { id: "global", directJoinCounter: nextSeq }
    });
    return { displayId: `${initials}-${pad(nextSeq)}`, initials };
  }

  const existingReferralsCount = await prisma.user.count({
    where: { referredById: referrer.id }
  });
  const position = existingReferralsCount + 1;

  const displayId = `${referrer.initials}-${pad(position)}/${initials}`;

  return { displayId, initials };
}
