"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, PaymentStatus, AccountStatus, NotificationType, PayoutRequestStatus } from "@prisma/client";
import { sanitizeString } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access only.");
  }
  return user;
}

export async function approveBuyer(buyerId: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: buyerId, role: Role.BUYER },
    data: { isApproved: true }
  });

  revalidatePath("/dashboard/admin");
}

export async function rejectBuyer(buyerId: string) {
  await requireAdmin();

  await prisma.user.delete({
    where: { id: buyerId, role: Role.BUYER }
  });

  revalidatePath("/dashboard/admin");
}

export async function updateSystemRates(formData: FormData) {
  await requireAdmin();

  const taskRate = parseFloat(String(formData.get("taskRate") || "0"));
  const referralCommission = parseFloat(String(formData.get("referralCommission") || "0"));

  if (isNaN(taskRate) || isNaN(referralCommission) || taskRate < 0 || referralCommission < 0) {
    return { success: false, message: "Please provide valid non-negative numbers." };
  }

  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { taskRate, referralCommission },
    create: { id: "global", taskRate, referralCommission }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Rates updated successfully." };
}

export async function toggleSystemPause() {
  await requireAdmin();

  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
  const newState = !(settings?.isSystemPaused ?? false);

  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { isSystemPaused: newState },
    create: { id: "global", isSystemPaused: newState }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");
  revalidatePath("/dashboard/buyer");

  return {
    success: true,
    message: newState ? "System paused. Workers cannot submit accounts." : "System resumed.",
    isPaused: newState
  };
}

export async function updateAdminPaymentDetails(formData: FormData) {
  const admin = await requireAdmin();

  const paymentDetails = sanitizeString(String(formData.get("paymentDetails") || ""), 500);

  if (!paymentDetails) {
    return { success: false, message: "Please enter your Bank or Binance receiving details." };
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { paymentDetails }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");

  return { success: true, message: "Your payment receiving details were updated." };
}

export async function approvePaymentRequest(requestId: string) {
  await requireAdmin();

  const request = await prisma.paymentRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Payment request not found.");

  await prisma.paymentRequest.update({
    where: { id: requestId },
    data: { status: PaymentStatus.APPROVED }
  });

  await prisma.notification.create({
    data: {
      userId: request.buyerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payment Approved",
      message: `Your payment of Rs. ${request.amount.toFixed(2)} has been approved by the admin.`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");
}

export async function rejectPaymentRequest(requestId: string, formData: FormData) {
  await requireAdmin();

  const reason = sanitizeString(String(formData.get("reason") || ""), 500);
  if (!reason) {
    return { success: false, message: "Please provide a rejection reason." };
  }

  const request = await prisma.paymentRequest.update({
    where: { id: requestId },
    data: { status: PaymentStatus.REJECTED, rejectionReason: reason }
  });

  await prisma.notification.create({
    data: {
      userId: request.buyerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payment Rejected",
      message: `Your payment of Rs. ${request.amount.toFixed(2)} was rejected. Reason: ${reason}`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");

  return { success: true, message: "Payment request rejected." };
}

export async function markAccountAsSold(accountId: string) {
  await requireAdmin();

  const account = await prisma.accountItem.update({
    where: { id: accountId },
    data: { status: AccountStatus.SOLD }
  });

  await prisma.notification.create({
    data: {
      userId: account.workerId,
      type: NotificationType.ACCOUNT_SOLD,
      title: "Account Sold",
      message: `Your submitted account (${account.gmail}) has been sold successfully.`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/worker");
}

export async function rejectAccountItem(accountId: string, formData: FormData) {
  await requireAdmin();

  const reason = sanitizeString(String(formData.get("reason") || ""), 500);
  if (!reason) {
    return { success: false, message: "Please provide a rejection reason." };
  }

  const account = await prisma.accountItem.update({
    where: { id: accountId },
    data: { status: AccountStatus.REJECTED, rejectionReason: reason }
  });

  await prisma.notification.create({
    data: {
      userId: account.workerId,
      type: NotificationType.ACCOUNT_REJECTED,
      title: "Account Rejected",
      message: `Your submitted account (${account.gmail}) was rejected. Reason: ${reason}`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Account marked as rejected." };
}

export async function sendAnnouncement(formData: FormData) {
  await requireAdmin();

  const title = sanitizeString(String(formData.get("title") || ""), 150);
  const message = sanitizeString(String(formData.get("message") || ""), 1000);
  const targetWorkerId = String(formData.get("targetWorkerId") || "");

  if (!title || !message) {
    return { success: false, message: "Please provide both a title and a message." };
  }

  if (targetWorkerId === "ALL") {
    const workers = await prisma.user.findMany({ where: { role: Role.WORKER }, select: { id: true } });
    if (workers.length === 0) {
      return { success: false, message: "No workers to send announcements to." };
    }

    await prisma.notification.createMany({
      data: workers.map((w) => ({
        userId: w.id,
        type: NotificationType.ANNOUNCEMENT,
        title,
        message
      }))
    });

    return { success: true, message: `Announcement sent to all ${workers.length} workers.` };
  }

  if (!targetWorkerId) {
    return { success: false, message: "Please select a worker or choose 'All Workers'." };
  }

  await prisma.notification.create({
    data: { userId: targetWorkerId, type: NotificationType.ANNOUNCEMENT, title, message }
  });

  return { success: true, message: "Announcement sent successfully." };
}

export async function uploadPayoutProof(formData: FormData) {
  await requireAdmin();

  const workerId = String(formData.get("workerId") || "");
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const note = sanitizeString(String(formData.get("note") || ""), 300);
  const file = formData.get("proofFile") as File | null;

  if (!workerId) return { success: false, message: "Please select a worker." };
  if (isNaN(amount) || amount <= 0) return { success: false, message: "Please enter a valid amount." };
  if (!file || file.size === 0) return { success: false, message: "Please attach a payout proof." };

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
  const fileName = `payout-${workerId}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  if (!worker || worker.balance < amount) {
    return { success: false, message: "Amount exceeds worker's available balance." };
  }

  await prisma.$transaction([
    prisma.payoutProof.create({
      data: { workerId, amount, proofUrl: `/uploads/${fileName}`, note: note || null }
    }),
    prisma.user.update({
      where: { id: workerId },
      data: { balance: { decrement: amount } }
    }),
    prisma.notification.create({
      data: {
        userId: workerId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Payment Received",
        message: `You have received a payment of Rs. ${amount.toFixed(2)} from the admin.${note ? ` Note: ${note}` : ""}`
      }
    })
  ]);

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");

  return { success: true, message: "Payout proof uploaded, balance deducted, and worker notified." };
}

export async function approvePayoutRequest(requestId: string) {
  await requireAdmin();

  const request = await prisma.payoutRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Payout request not found.");

  await prisma.payoutRequest.update({
    where: { id: requestId },
    data: { status: PayoutRequestStatus.APPROVED }
  });

  await prisma.notification.create({
    data: {
      userId: request.workerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payout Request Approved",
      message: `Your payout request of Rs. ${request.amount.toFixed(2)} was approved. The admin will process your payment shortly.`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");
}

export async function rejectPayoutRequest(requestId: string) {
  await requireAdmin();

  const request = await prisma.payoutRequest.update({
    where: { id: requestId },
    data: { status: PayoutRequestStatus.REJECTED }
  });

  await prisma.notification.create({
    data: {
      userId: request.workerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payout Request Rejected",
      message: `Your payout request of Rs. ${request.amount.toFixed(2)} was rejected.`
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");
}

export async function getAdminDashboardData() {
  const admin = await requireAdmin();

  const [
    freshAdmin,
    pendingBuyers,
    approvedBuyers,
    workers,
    pendingPayments,
    allPayments,
    settings,
    accountStats,
    payoutProofs,
    payoutRequests
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: admin.id } }),
    prisma.user.findMany({ where: { role: Role.BUYER, isApproved: false }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: Role.BUYER, isApproved: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: Role.WORKER }, orderBy: { createdAt: "desc" } }),
    prisma.paymentRequest.findMany({
      where: { status: PaymentStatus.PENDING },
      include: { buyer: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.paymentRequest.findMany({
      include: { buyer: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.systemSettings.findUnique({ where: { id: "global" } }),
    prisma.accountItem.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.payoutProof.findMany({
      include: { worker: { select: { name: true, displayId: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.payoutRequest.findMany({
      where: { status: PayoutRequestStatus.PENDING },
      include: { worker: { select: { name: true, displayId: true, balance: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    admin: freshAdmin,
    pendingBuyers,
    approvedBuyers,
    workers,
    pendingPayments,
    allPayments,
    settings,
    accountStats,
    payoutProofs,
    payoutRequests,
    pendingPaymentCount: pendingPayments.length,
    pendingBuyerCount: pendingBuyers.length,
    pendingPayoutRequestCount: payoutRequests.length,
    isSystemPaused: settings?.isSystemPaused ?? false
  };
}
