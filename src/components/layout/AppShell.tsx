import Link from "next/link";
import {
  BarChart3,
  Building2,
  FileArchive,
  FileScan,
  Home,
  Receipt,
  Settings,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/properties", label: "Properties", icon: Building2 },
  { href: "/app/income", label: "Income", icon: WalletCards },
  { href: "/app/expenses", label: "Expenses", icon: Receipt },
  { href: "/app/receipts", label: "Receipts", icon: FileScan },
  { href: "/app/reports", label: "Reports", icon: FileArchive },
  { href: "/app/settings", label: "Settings", icon: Settings }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-background p-4 md:block">
        <Link
          href="/app/dashboard"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <BarChart3 className="h-5 w-5 text-primary" />
          HostReport
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-5 md:px-6 md:pb-10">
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t bg-background md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
