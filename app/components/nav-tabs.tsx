"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/trade", label: "Trade" },
  { href: "/explore", label: "Explore" },
] as const;

/** Tab navigation for switching between Trade and Explore screens. */
export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg bg-[var(--midnight-700)] p-1">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                : "text-gray-400 hover:text-white",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
