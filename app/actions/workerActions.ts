"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";
import { sanitizeString, isValidEmail } from "@/lib/validation";
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

  const gmail = sanitizeString(String(formData.get("gmail") || "")).toLowerCase();
  const accountPassword = String(formData.get("accountPassword") || "");

  if (!isValidEmail(gmail) || !accountPassword || accountPassword.length < 4) {
    return { success: false, message: "Please provide a valid Gmail address and its password." };
  }

  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
  const currentRate = settings?.taskRate ?? 50;

  await prisma.$transaction([
    prisma.accountItem.create({
      data: {
        gmail,
        password: accountPassword,
        workerId: worker.id,
        rateAtEntry: currentRate
      }
    }),
    prisma.user.update({
      where: { id: worker.id },
      data: { balance: { increment: currentRate } }
    })
  ]);

  revalidatePath("/dashboard/worker");

  return { success: true, message: `Account submitted! ${currentRate} added to your balance.` };
}

export async function getWorkerDashboardData() {
  const worker = await requireWorker();

  const [freshWorker, submissions, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: worker.id } }),
    prisma.accountItem.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.systemSettings.findUnique({ where: { id: "global" } })
  ]);

  return {
    worker: freshWorker,
    submissions,
    currentRate: settings?.taskRate ?? 50
  };
}
