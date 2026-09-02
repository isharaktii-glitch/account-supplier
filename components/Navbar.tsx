import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutUser } from "@/app/actions/authActions";
import { Role } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const user = await getSession();

  const dashboardLink =
    user?.role === Role.WORKER
      ? "/dashboard/worker"
      : user?.role === Role.BUYER
      ? "/dashboard/buyer"
      : user?.role === Role.ADMIN
      ? "/dashboard/admin"
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-galaxy-bg/70 backdrop-blur-glass">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-galaxy-accent to-galaxy-accent2 shadow-glow-purple animate-pulse-glow" />
          <span className="text-lg font-bold tracking-wide text-white">
            Galaxy <span className="text-galaxy-accent2">Workers</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link href="/login" className="btn-secondary !px-4 !py-2 text-sm">
                Login
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">
                Get Started
              </Link>
            </>
          )}

          {user && dashboardLink && (
            <>
              <Link href={dashboardLink} className="btn-secondary !px-4 !py-2 text-sm">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
