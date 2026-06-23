"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/flashcards", label: "フラッシュカード", icon: Layers },
  { href: "/quiz", label: "問題集", icon: BookOpen },
  { href: "/exam", label: "模擬試験", icon: ClipboardList },
  { href: "/progress", label: "進捗", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <span className="font-semibold text-lg tracking-tight text-sidebar-foreground">
          certport
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
