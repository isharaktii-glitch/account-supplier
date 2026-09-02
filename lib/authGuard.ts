import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function requireRole(role: Role) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    if (user.role === Role.ADMIN) redirect("/dashboard/admin");
    if (user.role === Role.WORKER) redirect("/dashboard/worker");
    if (user.role === Role.BUYER) redirect("/dashboard/buyer");
    redirect("/login");
  }

  if (role === Role.BUYER && !user.isApproved) {
    redirect("/login");
  }

  return user;
}
