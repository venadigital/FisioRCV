"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  label = "Salir",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={onLogout} className={cn(className)}>
      {label}
    </Button>
  );
}
