"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateBulkRates(ratePerTask: number, refCommission: number) {
  await prisma.user.updateMany({
    where: { role: "WORKER" },
    data: { ratePerTask, refCommission },
  });
  revalidatePath("/dashboard/admin");
}

export async function updateWorkerIndividualRate(
  workerId: string,
  ratePerTask: number,
  refCommission: number
) {
  await prisma.user.update({
    where: { id: workerId },
    data: { ratePerTask, refCommission },
  });
  revalidatePath("/dashboard/admin");
}

export async function updateAccountPrice(accountId: string, price: number) {
  await prisma.accountItem.update({
    where: { id: accountId },
    data: { price },
  });
  revalidatePath("/dashboard/admin");
}

export async function approveWorkerPayment(paymentRequestId: string) {
  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
  });

  if (!paymentRequest) return;

  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: { status: "COMPLETED" },
  });

  await prisma.user.update({
    where: { id: paymentRequest.workerId },
    data: {
      balance: { decrement: paymentRequest.amount },
    },
  });

  revalidatePath("/dashboard/admin");
}
export async function approveBuyerAccount(buyerId: string) {
  await prisma.user.update({
    where: { id: buyerId },
    data: { isApproved: true },
  });
  revalidatePath("/dashboard/admin");
}
