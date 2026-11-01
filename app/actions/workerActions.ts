"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, NotificationType, AccountType } from "@prisma/client";
import { sanitizeString, isValidEmail } from "@/lib/validation";
import { getRateForCountry, getAllTypeRates, formatRate } from "@/lib/rates";
import { isAccountType, emailMatchesType, ACCOUNT_TYPE_LABELS } from "@/lib/accountTypes";
import { calcReferralCommission } from "@/lib/commission";
import { revalidatePath } from "next/cache";

async function requireWorker() {
  const user = await getSession();
  if (!user || user.role !== Role.WORKER) {
    throw new Error("Unauthorized: Worker access only.");
  }
  return user;
}

export async function submitGmailAccount(formData: FormData) {
  const worker = await requireWorker();

  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
  if (settings?.isSystemPaused) {
    return { success: false, message: "The system is currently paused by the admin. Please try again later." };
  }

  const typeRaw = String(formData.get("type") || "GMAIL");
  if (!isAccountType(typeRaw)) {
    return { success: false, message: "Invalid account type." };
  }
  const type = typeRaw;
  const label = ACCOUNT_TYPE_LABELS[type];

  const email = sanitizeString(String(formData.get("gmail") || "")).toLowerCase();
  const accountPassword = String(formData.get("accountPassword") || "");

  if (!isValidEmail(email) || !accountPassword || accountPassword.length < 4) {
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

  const rateInfo = await getRateForCountry(worker.country, type);

  let commission = 0;
  let commissionReferrerId: string | null = null;

  if (worker.referredById) {
    const referrer = await prisma.user.findUnique({ where: { id: worker.referredById } });
    if (referrer && referrer.role === Role.WORKER) {
      commission = calcReferralCommission({
        rateAmount: rateInfo.amount,
        workerCountry: worker.country,
        referrerCountry: referrer.country,
        commissionPercent: settings?.referralCommission ?? 10,
        exchangeRate: settings?.exchangeRate ?? 300
      });
      if (commission > 0) {
        commissionReferrerId = referrer.id;
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.accountItem.create({
      data: {
        gmail: email,
        password: accountPassword,
        type: type as AccountType,
        workerId: worker.id,
        rateAtEntry: rateInfo.amount,
        commissionAmount: commissionReferrerId ? commission : 0,
        commissionReferrerId
      }
    });

    await tx.user.update({
      where: { id: worker.id },
      data: { pendingBalance: { increment: rateInfo.amount } }
    });

    if (commissionReferrerId) {
      await tx.user.update({
        where: { id: commissionReferrerId },
        data: { pendingBalance: { increment: commission } }
      });
    }
  });

  revalidatePath("/dashboard/worker");

  return {
    success: true,
    message: `${label} account submitted! ${formatRate(rateInfo)} added to your pending balance.`
  };
}

export async function updateWorkerPaymentDetails(formData: FormData) {
  const worker = await requireWorker();
  const paymentDetails = sanitizeString(String(formData.get("paymentDetails") || ""), 500);

  if (!paymentDetails) {
    return { success: false, message: "Please enter your Bank or Binance payment details." };
  }

  await prisma.user.update({ where: { id: worker.id }, data: { paymentDetails } });
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Payment details saved successfully." };
}

export async function updateWorkerCountry(formData: FormData) {
  const worker = await requireWorker();
  const country = String(formData.get("country") || "");

  if (!country) {
    return { success: false, message: "Please select your country." };
  }

  await prisma.user.update({ where: { id: worker.id }, data: { country } });
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Country updated successfully." };
}

export async function requestPayout(formData: FormData) {
  const worker = await requireWorker();
  const amount = parseFloat(String(formData.get("amount") || "0"));

  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Please enter a valid amount." };
  }

  const freshWorker = await prisma.user.findUnique({ where: { id: worker.id } });
  if (!freshWorker || freshWorker.balance < amount) {
    return { success: false, message: "Requested amount exceeds your available balance." };
  }

  await prisma.payoutRequest.create({ data: { workerId: worker.id, amount } });

  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (admin) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: NotificationType.PAYOUT_REQUESTED,
        title: "New Payout Request",
        message: `${freshWorker.displayId ?? freshWorker.name} requested a payout of ${amount.toFixed(2)}.`
      }
    });
  }

  revalidatePath("/dashboard/worker");
  return { success: true, message: "Payout request sent to admin." };
}

export async function markNotificationAsRead(notificationId: string) {
  const worker = await requireWorker();
  await prisma.notification.update({ where: { id: notificationId, userId: worker.id }, data: { isRead: true } });
  revalidatePath("/dashboard/worker");
}

export async function markAllNotificationsAsRead() {
  const worker = await requireWorker();
  await prisma.notification.updateMany({ where: { userId: worker.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/dashboard/worker");
}

export async function getWorkerDashboardData() {
  const worker = await requireWorker();

  const [
    freshWorker,
    submissions,
    settings,
    notifications,
    referrals,
    payoutProofs,
    payoutRequests,
    commissionGroups
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: worker.id } }),
    prisma.accountItem.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } }),
    prisma.systemSettings.findUnique({ where: { id: "global" } }),
    prisma.notification.findMany({ where: { userId: worker.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.user.findMany({
      where: { referredById: worker.id },
      select: { id: true, name: true, displayId: true, createdAt: true }
    }),
    prisma.payoutProof.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } }),
    prisma.payoutRequest.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } }),
    prisma.accountItem.groupBy({
      by: ["status"],
      where: { commissionReferrerId: worker.id, commissionAmount: { gt: 0 } },
      _sum: { commissionAmount: true }
    })
  ]);

  const rateInfo = await getRateForCountry(worker.country, "GMAIL");
  const typeRates = await getAllTypeRates(worker.country);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const commissionStats = {
    confirmed: commissionGroups.find((g) => g.status === "SOLD")?._sum.commissionAmount ?? 0,
    pending: commissionGroups.find((g) => g.status === "AVAILABLE")?._sum.commissionAmount ?? 0
  };

  return {
    worker: freshWorker,
    submissions,
    rateInfo,
    typeRates,
    notifications,
    unreadCount,
    referrals,
    referralCommission: settings?.referralCommission ?? 10,
    payoutProofs,
    payoutRequests,
    commissionStats,
    isSystemPaused: settings?.isSystemPaused ?? false
  };
}
