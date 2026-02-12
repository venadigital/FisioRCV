"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/types";

export function RoleShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6">
            <p className="text-lg font-semibold text-cyan-800">{title}</p>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          <nav className="space-y-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition",
                  pathname === item.href
                    ? "bg-cyan-700 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <LogoutButton />
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
