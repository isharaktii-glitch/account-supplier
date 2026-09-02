"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, PaymentStatus, AccountStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

export async function approvePaymentRequest(requestId: string) {
  await requireAdmin();

  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error("Payment request not found.");
  }

  await prisma.paymentRequest.update({
    where: { id: requestId },
    data: { status: PaymentStatus.APPROVED }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");
}

export async function rejectPaymentRequest(requestId: string) {
  await requireAdmin();

  await prisma.paymentRequest.update({
    where: { id: requestId },
    data: { status: PaymentStatus.REJECTED }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");
}

export async function markAccountAsSold(accountId: string) {
  await requireAdmin();

  await prisma.accountItem.update({
    where: { id: accountId },
    data: { status: AccountStatus.SOLD }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/buyer");
}

export async function getAdminDashboardData() {
  await requireAdmin();

  const [pendingBuyers, approvedBuyers, workers, pendingPayments, allPayments, settings, accountStats] =
    await Promise.all([
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
      prisma.accountItem.groupBy({
        by: ["status"],
        _count: { status: true }
      })
    ]);

  return {
    pendingBuyers,
    approvedBuyers,
    workers,
    pendingPayments,
    allPayments,
    settings,
    accountStats
  };
}
