"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reviewAccountByBuyer(
  accountId: string,
  status: "DONE" | "REJECTED",
  rejectReason?: string
) {
  const account = await prisma.accountItem.update({
    where: { id: accountId },
    data: {
      status,
      rejectReason: status === "REJECTED" ? rejectReason : null,
    },
  });

  if (status === "DONE") {
    await prisma.user.update({
      where: { id: account.workerId },
      data: {
        balance: { increment: account.price },
      },
    });
  }

  revalidatePath("/dashboard/buyer");
}

export async function processBuyerPayment(paymentRequestId: string, slipUrl: string) {
  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      buyerSlipUrl: slipUrl,
      status: "BUYER_PAID",
    },
  });

  revalidatePath("/dashboard/buyer");
}
