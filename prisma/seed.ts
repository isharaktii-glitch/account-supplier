import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env before seeding."
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword, role: Role.ADMIN }
    });
    console.log("Super Admin already existed — password refreshed.");
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Super Admin",
        role: Role.ADMIN,
        isApproved: true
      }
    });
    console.log("Super Admin created successfully.");
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" }
  });

  if (!settings) {
    await prisma.systemSettings.create({
      data: { id: "global", taskRate: 50, referralCommission: 10 }
    });
    console.log("Default system settings created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
