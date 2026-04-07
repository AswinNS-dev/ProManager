"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Users, 
  Files,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Projects", icon: FolderKanban, href: "/projects" },
  { name: "Tasks", icon: CheckCircle2, href: "/tasks" },
  { name: "Time Log", icon: Clock, href: "/time-log" },
  { name: "Resource Mgnt", icon: BarChart3, href: "/resources" },
  { name: "Users", icon: Users, href: "/users" },
  { name: "Project Template", icon: Files, href: "/templates" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-black py-10 px-6">
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="mb-12 flex items-center px-4">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7A00]">
            <div className="w-6 h-6 border-4 border-white rounded-full"></div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Promage</span>
        </div>

        {/* Create Button */}
        <button className="mb-10 flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-bold text-black transition-all hover:bg-white/90">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF7A00] text-white">
            <Plus className="h-4 w-4" />
          </div>
          Create new project
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-4 text-sm font-semibold transition-all",
                  isActive 
                    ? "bg-white text-[#FF7A00] rounded-full" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                <item.icon className={cn("mr-4 h-5 w-5", isActive ? "text-[#FF7A00]" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
