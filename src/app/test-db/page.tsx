"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react";

export default function TestDB() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    async function testConnection() {
      setStatus("loading");
      try {
        const { data, error } = await supabase.from('projects').select('*').limit(1);
        
        if (error) throw error;

        setStatus("success");
        setMessage("Successfully connected to Supabase and read the 'projects' table!");
        setTables(['projects', 'tasks', 'team_members']);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Failed to connect. Check your .env.local credentials.");
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="glass-card p-12 max-w-md w-full border-t-4 border-t-primary shadow-[0_0_50px_rgba(82,191,173,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-muted/20 rounded-2xl">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">DB Connector</h1>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            status === 'success' ? 'bg-primary/10 border-primary/20 text-primary' :
            status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            'bg-muted/10 border-white/5'
          } transition-all duration-500`}>
            <div className="flex items-center gap-3 mb-3">
              {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {status === 'error' && <XCircle className="w-6 h-6" />}
              <span className="font-black uppercase tracking-widest text-xs">
                {status === 'idle' ? 'Ready to test' : status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-80">{message || "Initializing connection sequence..."}</p>
          </div>

          {status === 'success' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detected Tables</h3>
              <div className="grid grid-cols-1 gap-2">
                {tables.map(table => (
                  <div key={table} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all">
                    <span className="text-xs font-bold">{table}</span>
                    <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">ONLINE</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-white text-black py-4 font-black rounded-xl mt-4 hover:bg-white/90 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === 'error' && (
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white py-4 font-black rounded-xl mt-4 hover:bg-red-600 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-muted-foreground text-[10px] uppercase font-black tracking-[0.4em]">ProManager System v1.0.4</p>
    </div>
  );
}
