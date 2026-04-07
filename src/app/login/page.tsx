"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Loader2,
  Zap,
  Briefcase,
  Users,
  Fingerprint
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simple manual login check
      const { data: user, error: loginError } = await supabase
        .from('system_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (loginError || !user) {
        throw new Error("Access Denied: Invalid Intelligence ID or Encryption Key");
      }

      // Set session in cookie manually for high-speed middleware redirection
      document.cookie = `promanager_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `promanager_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `promanager_name=${user.full_name}; path=/; max-age=86400; SameSite=Lax`;
      
      router.push("/");
      router.refresh(); // Trigger middleware refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl border border-white/10 mb-4 animate-bounce">
            <Zap className="w-8 h-8 text-primary shadow-[0_0_20px_rgba(140,249,23,0.5)]" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">PROMANAGER <span className="text-primary text-xs vertical-align-top tracking-widest font-black ml-1">OS</span></h1>
          <p className="text-muted-foreground font-medium text-xs tracking-widest uppercase">Manual directive access portal.</p>
        </div>

        <div className="glass shadow-2xl p-10 rounded-[40px] border border-white/10 relative overflow-hidden">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Intelligence ID (Username)</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="admin" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">Encryption Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300"><ShieldCheck className="w-4 h-4 shrink-0" />{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-white text-black py-4 font-black rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ENTER COMMAND CENTER <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="relative py-2">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
               <div className="relative flex justify-center"><span className="bg-[#050505] px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">OR</span></div>
            </div>

            <button
               type="button"
               disabled={isLoading}
               onClick={async () => {
                 setIsLoading(true);
                 setError(null);
                 const { error: oauthError } = await supabase.auth.signInWithOAuth({
                   provider: 'google',
                   options: { 
                     redirectTo: window.location.origin + '/auth/callback',
                     queryParams: {
                       access_type: 'offline',
                       prompt: 'consent',
                     }
                   }
                 });
                 
                 if (oauthError) {
                   setError(oauthError.message);
                   setIsLoading(false);
                 } else {
                   setTimeout(() => setIsLoading(false), 3000);
                 }
               }}
               className="w-full bg-transparent border border-white/20 text-white py-4 font-black rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl mt-4"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
               </svg>
               GOOGLE AUTHENTICATION
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
