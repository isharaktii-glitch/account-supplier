"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/app/actions/authActions";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleLogout() {
    startTransition(async () => {
      await logoutUser();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button onClick={handleLogout} disabled={isPending} className="btn-primary !px-4 !py-2 text-sm">
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
