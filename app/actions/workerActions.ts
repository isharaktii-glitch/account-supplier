"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, NotificationType } from "@prisma/client";
import { sanitizeString, isValidEmail } from "@/lib/validation";
import { getRateForCountry } from "@/lib/rates";
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

  const gmail = sanitizeString(String(formData.get("gmail") || "")).toLowerCase();
  const accountPassword = String(formData.get("accountPassword") || "");

  if (!isValidEmail(gmail) || !accountPassword || accountPassword.length < 4) {
    return { success: false, message: "Please provide a valid Gmail address and its password." };
  }

  const duplicate = await prisma.accountItem.findFirst({ where: { gmail } });
  if (duplicate) {
    return { success: false, message: "This Gmail account has already been submitted before." };
  }

  const currentRate = await getRateForCountry(worker.country);

  await prisma.$transaction([
    prisma.accountItem.create({
      data: { gmail, password: accountPassword, workerId: worker.id, rateAtEntry: currentRate }
    }),
    prisma.user.update({
      where: { id: worker.id },
      data: { pendingBalance: { increment: currentRate } }
    })
  ]);

  revalidatePath("/dashboard/worker");

  return { success: true, message: `Account submitted! $${currentRate} added to your pending balance.` };
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
        message: `${freshWorker.displayId ?? freshWorker.name} requested a payout of $${amount.toFixed(2)}.`
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

  const [freshWorker, submissions, settings, notifications, referrals, payoutProofs, payoutRequests] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: worker.id } }),
      prisma.accountItem.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } }),
      prisma.systemSettings.findUnique({ where: { id: "global" } }),
      prisma.notification.findMany({ where: { userId: worker.id }, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.user.findMany({
        where: { referredById: worker.id },
        select: { id: true, name: true, displayId: true, createdAt: true }
      }),
      prisma.payoutProof.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } }),
      prisma.payoutRequest.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: "desc" } })
    ]);

  const currentRate = await getRateForCountry(worker.country);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    worker: freshWorker,
    submissions,
    currentRate,
    notifications,
    unreadCount,
    referrals,
    referralCommission: settings?.referralCommission ?? 10,
    payoutProofs,
    payoutRequests,
    isSystemPaused: settings?.isSystemPaused ?? false
  };
}
