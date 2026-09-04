"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, AccountStatus, NotificationType } from "@prisma/client";
import { sanitizeString } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireApprovedBuyer() {
  const user = await getSession();
  if (!user || user.role !== Role.BUYER || !user.isApproved) {
    throw new Error("Unauthorized: Approved buyer access only.");
  }
  return user;
}

export async function getAvailableAccounts() {
  await requireApprovedBuyer();

  return prisma.accountItem.findMany({
    where: { status: AccountStatus.AVAILABLE },
    orderBy: { createdAt: "desc" }
  });
}

export async function markAccountDone(accountId: string) {
  await requireApprovedBuyer();

  const account = await prisma.accountItem.findUnique({ where: { id: accountId } });
  if (!account) {
    return { success: false, message: "Account not found." };
  }

  await prisma.$transaction([
    prisma.accountItem.update({
      where: { id: accountId },
      data: { status: AccountStatus.SOLD }
    }),
    prisma.user.update({
      where: { id: account.workerId },
      data: {
        pendingBalance: { decrement: account.rateAtEntry },
        balance: { increment: account.rateAtEntry }
      }
    }),
    prisma.notification.create({
      data: {
        userId: account.workerId,
        type: NotificationType.ACCOUNT_SOLD,
        title: "Account Confirmed",
        message: `Your submitted account (${account.gmail}) was confirmed working. Rs. ${account.rateAtEntry.toFixed(2)} added to your balance.`
      }
    })
  ]);

  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/worker");
  revalidatePath("/dashboard/admin");

  return { success: true, message: "Account marked as done." };
}

export async function markAccountRejected(accountId: string, formData: FormData) {
  await requireApprovedBuyer();

  const reason = sanitizeString(String(formData.get("reason") || ""), 500);
  if (!reason) {
    return { success: false, message: "Please provide a rejection reason." };
  }

  const account = await prisma.accountItem.findUnique({ where: { id: accountId } });
  if (!account) {
    return { success: false, message: "Account not found." };
  }

  await prisma.$transaction([
    prisma.accountItem.update({
      where: { id: accountId },
      data: { status: AccountStatus.REJECTED, rejectionReason: reason }
    }),
    prisma.user.update({
      where: { id: account.workerId },
      data: { pendingBalance: { decrement: account.rateAtEntry } }
    }),
    prisma.notification.create({
      data: {
        userId: account.workerId,
        type: NotificationType.ACCOUNT_REJECTED,
        title: "Account Rejected",
        message: `Your submitted account (${account.gmail}) was rejected. Reason: ${reason}`
      }
    })
  ]);

  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/worker");
  revalidatePath("/dashboard/admin");

  return { success: true, message: "Account marked as rejected." };
}

export async function getBuyerPaymentHistory() {
  const buyer = await requireApprovedBuyer();

  return prisma.paymentRequest.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminReceivingDetails() {
  await requireApprovedBuyer();

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { paymentDetails: true }
  });

  return admin?.paymentDetails ?? null;
}

export async function getBuyerNotifications() {
  const buyer = await requireApprovedBuyer();

  const notifications = await prisma.notification.findMany({
    where: { userId: buyer.id },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount };
}

export async function markBuyerNotificationAsRead(notificationId: string) {
  const buyer = await requireApprovedBuyer();

  await prisma.notification.update({
    where: { id: notificationId, userId: buyer.id },
    data: { isRead: true }
  });

  revalidatePath("/dashboard/buyer");
}

export async function markAllBuyerNotificationsAsRead() {
  const buyer = await requireApprovedBuyer();

  await prisma.notification.updateMany({
    where: { userId: buyer.id, isRead: false },
    data: { isRead: true }
  });

  revalidatePath("/dashboard/buyer");
}

export async function submitPaymentProof(formData: FormData) {
  const buyer = await requireApprovedBuyer();

  const amount = parseFloat(String(formData.get("amount") || "0"));
  const buyerPaymentDetails = sanitizeString(String(formData.get("buyerPaymentDetails") || ""), 500);
  const file = formData.get("proofSlip") as File | null;

  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Please enter a valid amount." };
  }

  if (!buyerPaymentDetails) {
    return { success: false, message: "Please enter the Bank/Binance details you paid from." };
  }

  if (!file || file.size === 0) {
    return { success: false, message: "Please attach a payment proof slip." };
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, message: "Only PNG, JPG, WEBP or PDF files are allowed." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "File must be smaller than 5MB." };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() || "dat";
  const fileName = `${buyer.id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  await prisma.paymentRequest.create({
    data: {
      amount,
      proofSlipUrl: `/uploads/${fileName}`,
      buyerPaymentDetails,
      buyerId: buyer.id
    }
  });

  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/admin");

  return { success: true, message: "Payment proof submitted. Waiting for admin approval." };
}
