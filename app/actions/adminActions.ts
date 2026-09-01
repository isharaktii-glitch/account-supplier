"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. සියලුම Workers ලාගේ Default Task Price & Referral Commission එක සැරේ (Bulk) වෙනස් කිරීම
export async function updateBulkRates(ratePerTask: number, refCommission: number) {
  await prisma.user.updateMany({
    where: { role: "WORKER" },
    data: {
      ratePerTask,
      refCommission,
    },
  });

  revalidatePath("/dashboard/admin");
}

// 2. එක් එක් Worker ගේ Rate / Commission වෙන වෙනම (Individual) Edit කිරීම
export async function updateWorkerIndividualRate(
  workerId: string,
  ratePerTask: number,
  refCommission: number
) {
  await prisma.user.update({
    where: { id: workerId },
    data: {
      ratePerTask,
      refCommission,
    },
  });

  revalidatePath("/dashboard/admin");
}

// 3. Account Item එකක Price එක (Buyer ට පෙනෙන ගාන) Admin මගින් වෙනස් කිරීම
export async function updateAccountPrice(accountId: string, price: number) {
  await prisma.accountItem.update({
    where: { id: accountId },
    data: { price },
  });

  revalidatePath("/dashboard/admin");
}

// 4. Buyer ගේ Payment Slip එක බලައި Admin මගින් Worker Payment Approved කිරීම
export async function approveWorkerPayment(paymentRequestId: string) {
  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
  });

  if (!paymentRequest) return;

  // Status එක APPROVED බවට පත් කිරීම
  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: { status: "COMPLETED" },
  });

  // Worker ගේ Balance එක Paid වූ මුදලෙන් අයින් (Deduct) කිරීම
  await prisma.user.update({
    where: { id: paymentRequest.workerId },
    data: {
      balance: { decrement: paymentRequest.amount },
    },
  });

  revalidatePath("/dashboard/admin");
}
