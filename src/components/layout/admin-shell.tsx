"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminShell({
  subtitle,
  nav,
  children,
}: {
  subtitle: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f4f8] text-slate-800">
      <div className="grid min-h-screen md:grid-cols-[300px_1fr]">
        <aside className="flex h-full flex-col border-r border-slate-200 bg-white px-7 py-8">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-[#4d74b9]">Panel Admin</h1>
            <p className="mt-2 text-3xl text-slate-500">{subtitle}</p>
          </div>

          <nav className="mt-10 space-y-2">
            {nav.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-5 py-4 text-2xl transition",
                    active
                      ? "bg-[#557ac0] font-semibold text-white shadow-md shadow-blue-300/40"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span className={cn("text-xl", active ? "text-white" : "text-slate-500")}>{item.icon ?? "•"}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-7">
            <LogoutButton className="h-14 w-full rounded-xl border border-slate-200 text-2xl font-medium text-slate-700" />
          </div>
        </aside>

        <main className="px-7 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
