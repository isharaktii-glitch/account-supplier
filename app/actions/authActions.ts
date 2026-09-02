"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "WORKER" | "BUYER";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: "User with this Email already exists." };

  const hashedPassword = await bcrypt.hash(password, 10);
  const count = await prisma.user.count();
  const prefix = role === "WORKER" ? "UK" : "BY";
  const userCode = `${prefix}-${(count + 1).toString().padStart(3, "0")}`;

  await prisma.user.create({
    data: {
      fullName,
      username,
      password: hashedPassword,
      role,
      userCode,
      isApproved: role === "WORKER", // Workers auto-approved, Buyers need Admin Approval
    },
  });

  return { success: true, isBuyerPending: role === "BUYER" };
}

export async function loginUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Secret Hardcoded Admin Master Credentials Check
  if (username === "isharaktii@gmail.com" && password === "gamega123$#@A") {
    let admin = await prisma.user.findUnique({ where: { username } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin = await prisma.user.create({
        data: {
          fullName: "Platform Super Admin",
          username,
          password: hashedPassword,
          role: "ADMIN",
          userCode: "ADM-001",
          isApproved: true,
        },
      });
    }
    return { success: true, role: "ADMIN", userId: admin.id };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: "User not found!" };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { error: "Invalid password!" };

  if (user.role === "BUYER" && !user.isApproved) {
    return { error: "Your Buyer account is pending Admin approval. Please wait for activation." };
  }

  return { success: true, role: user.role, userId: user.id };
}
