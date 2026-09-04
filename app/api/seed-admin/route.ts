import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || key !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are not set in environment variables." },
      { status: 500 }
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword, role: Role.ADMIN }
    });
    return NextResponse.json({ message: "Super Admin already existed — password refreshed." });
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: "Super Admin",
      role: Role.ADMIN,
      isApproved: true
    }
  });

  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
  if (!settings) {
    await prisma.systemSettings.create({
      data: { id: "global", sriLankaRate: 50, otherCountriesRate: 30, referralCommission: 10 }
    });
  }

  return NextResponse.json({ message: "Super Admin created successfully." });
}
