"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Gmail හෝ KYC Account එකක් Submit කිරීම
export async function submitAccount(formData: FormData) {
  const workerId = formData.get("workerId") as string;
  const type = formData.get("type") as string; // GMAIL or KYC
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const worker = await prisma.user.findUnique({ where: { id: workerId } });

  await prisma.accountItem.create({
    data: {
      type: type || "GMAIL",
      username,
      password,
      workerId,
      price: worker?.ratePerTask || 1.0,
    },
  });

  revalidatePath("/dashboard/worker");
}

// Payment Request එකක් යැවීම
export async function requestPayment(workerId: string, amount: number) {
  if (amount <= 0) return { error: "Insufficient Balance" };

  await prisma.paymentRequest.create({
    data: {
      workerId,
      amount,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/worker");
  return { success: true };
}
