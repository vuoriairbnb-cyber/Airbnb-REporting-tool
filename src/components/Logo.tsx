import Link from "next/link";
import type { Route } from "next";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: Route }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Receipt className="h-4 w-4" />
      </span>
      <span className="font-display text-lg font-medium tracking-normal">HostReport</span>
    </Link>
  );
}
