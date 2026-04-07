"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  LayoutGrid,
  LogOut,
  Zap,
  Loader2,
  Briefcase,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Teams", href: "/teams" },
  { name: "Analytics", href: "/analytics" },
  { name: "Tasks", href: "/tasks" },
  { name: "Files", href: "/files" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string, name: string, role: string } | null>(null);
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);

  useEffect(() => {
    // Function to get cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const sessionId = getCookie('promanager_session');
    const role = getCookie('promanager_role');
    const name = getCookie('promanager_name');

    if (sessionId) {
      setUser({ id: sessionId, name: decodeURIComponent(name || 'Admin'), role: role || 'Employee' });
    } else {
      setUser(null);
    }
  }, [pathname]); // Refresh on navigation

  const handleSignOut = () => {
    setIsSignOutLoading(true);
    // Clear custom auth cookies
    document.cookie = 'promanager_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'promanager_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'promanager_name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    setIsSignOutLoading(false);
    setUser(null);
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";
  if (isLoginPage) return null;

  return (
    <nav className="flex items-center justify-between px-10 py-5 bg-[#050505] border-b border-white/5 sticky top-0 z-50">
      <div className="flex-1 flex items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary text-black p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter">ProManager</span>
        </Link>
      </div>

      <div className={cn("hidden lg:flex items-center bg-[#121214] p-1.5 rounded-full border border-white/5 shadow-inner")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className={cn("px-8 py-2 rounded-full text-xs font-black transition-all uppercase tracking-widest", isActive ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white")}>
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 flex items-center justify-end gap-5">
        {user ? (
           <>
              <div className="hidden sm:flex flex-col items-end animate-in fade-in duration-300">
                <p className="text-[10px] font-black uppercase text-white tracking-widest leading-tight">{user.name}</p>
                <div className={cn("text-[9px] font-black uppercase flex items-center gap-1 mt-0.5", user.role === 'Manager' ? "text-primary" : "text-blue-500")}>
                   {user.role === 'Manager' ? <Briefcase className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                   {user.role}
                </div>
              </div>
              
              <button 
                onClick={handleSignOut}
                disabled={isSignOutLoading}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/50 transition-all text-muted-foreground hover:text-rose-500 active:scale-95"
              >
                {isSignOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              </button>
           </>
        ) : (
          <Link href="/login" className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl active:scale-95 border border-white/10">
             Command Login
          </Link>
        )}
      </div>
    </nav>
  );
}
