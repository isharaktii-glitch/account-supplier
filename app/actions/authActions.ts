"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { isValidEmail, isStrongEnough, sanitizeString } from "@/lib/validation";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type AuthResult = {
  success: boolean;
  message: string;
};

async function generateWorkerCode(): Promise<string> {
  const count = await prisma.user.count({ where: { role: Role.WORKER } });
  const nextNumber = count + 1;
  return `UK-${String(nextNumber).padStart(3, "0")}`;
}

export async function registerWorker(formData: FormData): Promise<AuthResult> {
  const name = sanitizeString(String(formData.get("name") || ""));
  const email = sanitizeString(String(formData.get("email") || "")).toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !isValidEmail(email) || !isStrongEnough(password)) {
    return { success: false, message: "Please provide valid name, email and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "This email is already registered." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const workerCode = await generateWorkerCode();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.WORKER,
      workerCode,
      isApproved: true
    }
  });

  await createSession(user.id);
  redirect("/dashboard/worker");
}

export async function registerBuyer(formData: FormData): Promise<AuthResult> {
  const name = sanitizeString(String(formData.get("name") || ""));
  const email = sanitizeString(String(formData.get("email") || "")).toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !isValidEmail(email) || !isStrongEnough(password)) {
    return { success: false, message: "Please provide valid name, email and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "This email is already registered." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.BUYER,
      isApproved: false
    }
  });

  return {
    success: true,
    message: "Registration successful. Your account is pending admin approval."
  };
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const email = sanitizeString(String(formData.get("email") || "")).toLowerCase();
  const password = String(formData.get("password") || "");

  if (!isValidEmail(email) || !password) {
    return { success: false, message: "Please enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, message: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return { success: false, message: "Invalid email or password." };
  }

  if (user.role === Role.BUYER && !user.isApproved) {
    return { success: false, message: "Pending Approval. Please wait until an admin approves your account." };
  }

  await createSession(user.id);

  if (user.role === Role.ADMIN) {
    redirect("/dashboard/admin");
  } else if (user.role === Role.WORKER) {
    redirect("/dashboard/worker");
  } else {
    redirect("/dashboard/buyer");
  }
}

export async function logoutUser() {
  await destroySession();
  redirect("/login");
}
