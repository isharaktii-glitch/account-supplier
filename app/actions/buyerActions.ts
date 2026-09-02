"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role, AccountStatus } from "@prisma/client";
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

export async function getBuyerPaymentHistory() {
  const buyer = await requireApprovedBuyer();

  return prisma.paymentRequest.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function submitPaymentProof(formData: FormData) {
  const buyer = await requireApprovedBuyer();

  const amount = parseFloat(String(formData.get("amount") || "0"));
  const file = formData.get("proofSlip") as File | null;

  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Please enter a valid amount." };
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
      buyerId: buyer.id
    }
  });

  revalidatePath("/dashboard/buyer");

  return { success: true, message: "Payment proof submitted. Waiting for admin approval." };
}
