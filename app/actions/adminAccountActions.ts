"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, AccountType } from "@prisma/client";
import { sanitizeString, isValidEmail } from "@/lib/validation";
import { isAccountType, emailMatchesType, ACCOUNT_TYPE_LABELS } from "@/lib/accountTypes";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access only.");
  }
  return user;
}

export async function submitAdminAccount(formData: FormData) {
  const admin = await requireAdmin();

  const typeRaw = String(formData.get("type") || "GMAIL");
  if (!isAccountType(typeRaw)) {
    return { success: false, message: "Invalid account type." };
  }
  const type = typeRaw;
  const label = ACCOUNT_TYPE_LABELS[type];

  const email = sanitizeString(String(formData.get("email") || "")).toLowerCase();
  const password = String(formData.get("password") || "");

  if (!isValidEmail(email) || !password || password.length < 4) {
    return { success: false, message: `Please provide a valid ${label} address and its password.` };
  }

  if (!emailMatchesType(email, type)) {
    return { success: false, message: `This address does not look like a ${label} account.` };
  }

  const duplicate = await prisma.accountItem.findFirst({ where: { gmail: email } });
  if (duplicate) {
    return { success: false, message: "This account has already been submitted before." };
  }

  const registeredUser = await prisma.user.findUnique({ where: { email } });
  if (registeredUser) {
    return { success: false, message: "This email is a registered member account and cannot be submitted." };
  }

  await prisma.accountItem.create({
    data: {
      gmail: email,
      password,
      type: type as AccountType,
      workerId: admin.id,
      rateAtEntry: 0
    }
  });

  revalidatePath("/dashboard/admin/accounts");
  revalidatePath("/dashboard/buyer");

  return { success: true, message: `${label} account added.` };
}

export async function updateTypeRates(formData: FormData) {
  await requireAdmin();

  const hotmailRate = parseFloat(String(formData.get("hotmailRate") || "0"));
  const aolRate = parseFloat(String(formData.get("aolRate") || "0"));
  const otherEmailRate = parseFloat(String(formData.get("otherEmailRate") || "0"));

  if ([hotmailRate, aolRate, otherEmailRate].some((n) => isNaN(n) || n < 0)) {
    return { success: false, message: "Please provide valid numbers." };
  }

  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { hotmailRate, aolRate, otherEmailRate },
    create: { id: "global", hotmailRate, aolRate, otherEmailRate }
  });

  revalidatePath("/dashboard/admin/accounts");
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Rates updated (Rs. for Sri Lanka, auto USD for other countries)." };
}

export async function getAdminAccountsData() {
  await requireAdmin();

  const [settings, accounts, counts] = await Promise.all([
    prisma.systemSettings.findUnique({ where: { id: "global" } }),
    prisma.accountItem.findMany({
      include: { worker: { select: { name: true, displayId: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.accountItem.groupBy({ by: ["type", "status"], _count: { _all: true } })
  ]);

  return {
    rates: {
      hotmailRate: settings?.hotmailRate ?? 50,
      aolRate: settings?.aolRate ?? 50,
      otherEmailRate: settings?.otherEmailRate ?? 50
    },
    accounts,
    counts
  };
}
