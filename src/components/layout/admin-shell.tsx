"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminShell({
  nav,
  children,
}: {
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f4f8] text-slate-800">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
          <div>
            <div className="border-b border-slate-200 px-8 py-6">
              <h1 className="text-2xl font-semibold tracking-tight text-[#0e7a9a]">Fisio RCV</h1>
            </div>
          </div>

          <nav className="mt-7 space-y-1.5 px-4">
            {nav.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-lg transition",
                    active
                      ? "bg-[#d5e5eb] font-semibold text-[#0e7a9a]"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span className={cn("text-base", active ? "text-[#0e7a9a]" : "text-slate-400")}>
                    {item.icon ?? "•"}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-6 pb-8">
            <LogoutButton className="h-14 w-full rounded-xl border border-[#87a9e2] text-lg font-medium text-[#4d74b9]" />
          </div>
        </aside>

        <main className="px-7 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
