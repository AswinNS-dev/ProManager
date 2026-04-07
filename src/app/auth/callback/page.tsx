"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Grab the session established by Supabase Auth (via Google OAuth redirect hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No session retrieved from authorization provider. Please try signing in again.");

        // 2. Extract Google profile data
        const email = session.user.email;
        const fullName = session.user.user_metadata?.full_name || email?.split('@')[0] || "Operative";

        if (!email) throw new Error("No email address provided by Google profile.");

        // 3. Security Check: Are they in the whitelist?
        const { data: whitelistedUser } = await supabase
          .from('google_whitelist')
          .select('*')
          .eq('email', email)
          .single();

        if (!whitelistedUser) {
           throw new Error("ACCESS DENIED: Your Google account has not been whitelisted by Command.");
        }

        // 4. Check if user exists in custom system_users table using email as username
        let { data: systemUser, error: fetchError } = await supabase
          .from('system_users')
          .select('*')
          .eq('username', email)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // User doesn't exist, auto-create them in our system
          const { data: newUser, error: insertError } = await supabase
            .from('system_users')
            .insert([{
               username: email,
               password: 'oauth_managed_no_password', // Password not used when signing in via Google
               full_name: fullName,
               role: whitelistedUser.role // Assigned role from the whitelist!
            }])
            .select()
            .single();
            
          if (insertError) throw insertError;
          systemUser = newUser;
        } else if (fetchError) {
          throw fetchError;
        }

        if (!systemUser) throw new Error("Failed to process system user synchronization.");

        // 4. Set session cookies exactly as the manual login method expects
        document.cookie = `promanager_session=${systemUser.id}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `promanager_role=${systemUser.role}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `promanager_name=${systemUser.full_name}; path=/; max-age=86400; SameSite=Lax`;

        // 5. Success, route to secure dashboard
        router.push("/");
        router.refresh();

      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "An error occurred during authentication.");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 flex-col gap-6">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
      <p className="text-white font-black tracking-widest uppercase text-sm animate-pulse">Synchronizing Intelligence Profiles...</p>
      
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 font-bold max-w-md text-center mt-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
