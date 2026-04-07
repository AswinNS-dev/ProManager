"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Shield, 
  Trash2, 
  Plus, 
  Loader2, 
  TrendingUp,
  Mail,
  Edit2,
  CalendarDays,
  Key,
  ShieldCheck,
  AlertCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/Modal";

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'squads'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [memberForm, setMemberForm] = useState({ 
    id: "", 
    full_name: "", 
    role: "", 
    email: "", 
    dob: ""
  });
  
  const [squadForm, setSquadForm] = useState({ id: "", name: "", selectedMembers: [] as string[] });

  const generateID = () => {
     if (!memberForm.full_name || !memberForm.dob) return null;
     try {
       const dateParts = memberForm.dob.split("-");
       if (dateParts.length !== 3) return null;
       const [y, m, d] = dateParts;
       const idDigits = `${d}${m}${y}`; // Result: DDMMYYYY
       const username = `${memberForm.full_name.toLowerCase().replace(/\s+/g, "")}${idDigits}`;
       return { username, password: idDigits };
     } catch (e) {
       return null;
     }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const getCookie = (name: string) => {
       const value = `; ${document.cookie}`;
       const parts = value.split(`; ${name}=`);
       if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
       return null;
    };
    setUserRole(getCookie('promanager_role'));

    const [membersRes, teamsRes] = await Promise.all([
      supabase.from('team_members').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('*, team_memberships(member_id, team_members(full_name))').order('created_at', { ascending: false })
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const isManager = userRole === 'Manager';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    setErrorMessage(null);
    
    const creds = generateID();
    if (!creds) {
      setErrorMessage("Tactical Failure: Full identity and valid DOB required.");
      return;
    }

    try {
      if (memberForm.id) {
         const { error } = await supabase.from('team_members').update({ 
           full_name: memberForm.full_name, 
           role: memberForm.role, 
           email: memberForm.email,
           dob: memberForm.dob
         }).eq('id', memberForm.id);
         if (error) throw error;
      } else {
         const { error: rosterErr } = await supabase.from('team_members').insert([{ 
           full_name: memberForm.full_name, 
           role: memberForm.role, 
           email: memberForm.email,
           dob: memberForm.dob
         }]);
         if (rosterErr) throw rosterErr;

         // Auto-whitelist their Google email! 
         await supabase.from('google_whitelist').insert([{ 
            email: memberForm.email, 
            role: 'Employee' 
         }]);

         const { error: authErr } = await supabase.from('system_users').insert([{
            username: creds.username,
            password: creds.password,
            full_name: memberForm.full_name,
            role: 'Employee'
         }]);
         if (authErr) throw new Error("Auth Table Logic Failure. Check if system_users table exists in SQL!");
         
         alert(`SUCCESS: ${memberForm.full_name} Enlisted!\nID: ${creds.username}\nKey: ${creds.password}`);
      }
      setIsMemberModalOpen(false);
      setMemberForm({ id: "", full_name: "", role: "", email: "", dob: "" });
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!isManager) return;
    if (confirm("DISCHARGE OPERATIVE?")) {
      const member = members.find(m => m.id === id);
      if (member && member.email) {
         // Auto-remove them from the Google Auth whitelist
         await supabase.from('google_whitelist').delete().eq('email', member.email);
         // Also remove their system_users custom auth credentials using their generated username
         await supabase.from('system_users').delete().eq('username', `${member.full_name.replace(/\s+/g, '')}${member.dob?.replace(/-/g, '')}`);
      }
      await supabase.from('team_members').delete().eq('id', id);
      fetchData();
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    
    let teamData;
    if (squadForm.id) {
      // Update existing team
      const { data: team, error } = await supabase.from('teams').update({ name: squadForm.name }).eq('id', squadForm.id).select().single();
      if (error) { setErrorMessage("Team Update Failure."); return; }
      teamData = team;
      // Clear old memberships to re-add
      await supabase.from('team_memberships').delete().eq('team_id', squadForm.id);
    } else {
      // Create new team
      const { data: team, error } = await supabase.from('teams').insert([{ name: squadForm.name }]).select().single();
      if (error) { setErrorMessage("Team Assembly Failure."); return; }
      teamData = team;
    }

    if (teamData && squadForm.selectedMembers.length > 0) {
       const memberships = squadForm.selectedMembers.map(mId => ({ team_id: teamData.id, member_id: mId }));
       await supabase.from('team_memberships').insert(memberships);
    }
    setIsSquadModalOpen(false);
    setSquadForm({ id: "", name: "", selectedMembers: [] });
    fetchData();
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Syncing Personnel Database...</span>
    </div>
  );

  const preview = generateID();

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-700 pb-20 px-6 text-white font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Organization HQ</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage operatives and specialized team formations.</p>
        </div>
        <div className="flex bg-[#121214] p-1.5 rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <button onClick={() => setActiveTab('members')} className={cn("px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'members' ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white")}>Operatives</button>
          <button onClick={() => setActiveTab('squads')} className={cn("px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'squads' ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white")}>Teams</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {activeTab === 'members' ? (
            <div className="glass-card shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden border-white/10">
               <div className="p-10 border-b border-white/5 flex items-center justify-between bg-primary/[0.03]">
                  <h3 className="font-black text-sm text-primary tracking-[0.2em] flex items-center gap-2"><Shield className="w-5 h-5 shadow-[0_0_10px_rgba(140,249,23,0.5)]" /> PERSONNEL ROSTER</h3>
                  {isManager && (
                    <button 
                      onClick={() => { setErrorMessage(null); setMemberForm({ id: "", full_name: "", role: "", email: "", dob: "" }); setIsMemberModalOpen(true); }} 
                      className="px-8 py-4 bg-white text-black text-[11px] font-black uppercase rounded-2xl hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 border border-white"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" /> Add Member
                    </button>
                  )}
               </div>
               <div className="divide-y divide-white/5">
                  {members.map(member => (
                    <div key={member.id} className="p-8 flex items-center justify-between group hover:bg-primary/[0.02] transition-all">
                       <div className="flex items-center gap-8">
                          <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 text-white font-black group-hover:border-primary/50 group-hover:text-primary transition-all text-lg shadow-inner">
                             {member.full_name[0]}
                          </div>
                          <div>
                             <p className="font-black text-lg tracking-tight">{member.full_name}</p>
                             <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> {member.role}</span>
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {member.dob || 'DOB PENDING'}</span>
                                {member.email && <span className="text-[10px] font-black text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> {member.email}</span>}
                             </div>
                          </div>
                       </div>
                       {isManager && (
                          <div className="flex gap-3">
                             <button onClick={() => { setErrorMessage(null); setMemberForm(member); setIsMemberModalOpen(true); }} className="p-3 opacity-0 group-hover:opacity-100 bg-white/5 text-muted-foreground rounded-xl hover:bg-white/10 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                             <button onClick={() => handleDeleteMember(member.id)} className="p-3 opacity-0 group-hover:opacity-100 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {isManager && (
                 <button onClick={() => { setSquadForm({ id: "", name: "", selectedMembers: [] }); setIsSquadModalOpen(true); }} className="glass-card p-12 border-dashed border-white/20 flex flex-col items-center justify-center gap-6 group hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[300px]">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><Plus className="w-8 h-8" /></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">Assemble Team</p>
                 </button>
               )}
               {teams.map(team => (
                 <div key={team.id} className="glass-card p-10 relative group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-8 flex gap-3">
                       {isManager && (
                         <>
                           <button onClick={() => { 
                             setSquadForm({ 
                               id: team.id, 
                               name: team.name, 
                               selectedMembers: team.team_memberships?.map((m: any) => m.member_id) || [] 
                             }); 
                             setIsSquadModalOpen(true); 
                           }} className="text-muted-foreground hover:text-white transition-colors">
                             <Edit2 className="w-5 h-5" />
                           </button>
                           <button onClick={() => { if(confirm("Disband this team?")) supabase.from('teams').delete().eq('id', team.id).then(() => fetchData()) }} className="text-muted-foreground hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                         </>
                       )}
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:text-primary group-hover:border-primary/50 transition-all"><TrendingUp className="w-5 h-5" /></div>
                       <h4 className="font-black text-xl tracking-tighter">{team.name}</h4>
                    </div>
                     <div className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4">Tactical Team Roster</div>
                     <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {team.team_memberships && team.team_memberships.length > 0 ? (
                           team.team_memberships.map((m: any) => (
                             <div key={m.member_id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                                <div className="w-2 h-2 rounded-full bg-primary/50 shadow-[0_0_5px_rgba(140,249,23,0.5)]" />
                                <span className="text-xs font-bold text-white/90">{m.team_members?.full_name}</span>
                             </div>
                           ))
                        ) : (
                           <div className="text-[10px] font-black uppercase text-muted-foreground opacity-30 italic py-4">No Operatives Assigned</div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <div className="glass-card p-10 bg-primary/5 border border-primary/20 relative group overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity"><Key className="w-12 h-12 text-primary" /></div>
              <h3 className="font-black text-xs text-primary tracking-widest mb-4">TACTICAL PROVISIONING</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">Standardized Login IDs are automatically generated from operative signatures. As an Admin, you maintain absolute control over identity issuance and revocation across the fleet network.</p>
           </div>
        </div>
      </div>

      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="ENLIST NEW OPERATIVE">
        <form onSubmit={handleAddMember} className="space-y-6 pt-4">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Full Identity</label>
                <input required value={memberForm.full_name} onChange={(e) => setMemberForm({...memberForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-inner" placeholder="John Matrix" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Date of Birth</label>
                <input required type="date" value={memberForm.dob} onChange={(e) => setMemberForm({...memberForm, dob: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none [color-scheme:dark] shadow-inner" />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Rank / Designation</label>
              <input required value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-inner" placeholder="Tactical Lead" />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Fleet Email (Auth Hash)</label>
              <input required type="email" value={memberForm.email} onChange={(e) => setMemberForm({...memberForm, email: e.target.value})} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 shadow-inner" placeholder="matrix@fleet.io" />
           </div>

           {errorMessage && (
             <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in shake-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-loose">{errorMessage}</p>
             </div>
           )}

           {preview && !memberForm.id && !errorMessage && (
             <div className="p-8 bg-primary/10 border border-primary/30 rounded-3xl space-y-4 animate-in slide-in-from-top duration-500 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-16 h-16 text-primary" /></div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-2"><Key className="w-4 h-4" /> AUTO-GENERATED CREDENTIALS</label>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1"><p className="text-[9px] uppercase font-black text-muted-foreground font-mono">USER_ID</p><p className="text-sm font-black text-white selection:bg-primary selection:text-black">{preview.username}</p></div>
                   <div className="space-y-1"><p className="text-[9px] uppercase font-black text-muted-foreground font-mono">SEC_KEY</p><p className="text-sm font-black text-white selection:bg-primary selection:text-black">{preview.password}</p></div>
                </div>
             </div>
           )}

           <button type="submit" className="w-full bg-white text-black py-5 font-black rounded-2xl hover:bg-primary transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 uppercase tracking-widest text-xs border border-white/10">
              {memberForm.id ? "RECALIBRATE RECORD" : "PROVISION & ENLIST"}
           </button>
        </form>
      </Modal>

      <Modal isOpen={isSquadModalOpen} onClose={() => setIsSquadModalOpen(false)} title={squadForm.id ? "RECALIBRATE MISSION" : "Assemble Team"}>
         <form onSubmit={handleCreateSquad} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Team Code Name</label>
               <input required value={squadForm.name} onChange={(e) => setSquadForm({...squadForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none" placeholder="e.g. Team Omega" />
            </div>

            {members.length > 0 && (
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-3">Assign Operatives</label>
                 <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                    {members.map((member) => (
                      <div 
                        key={member.id} 
                        onClick={() => {
                          const isSelected = squadForm.selectedMembers.includes(member.id);
                          setSquadForm(prev => ({
                            ...prev,
                            selectedMembers: isSelected 
                               ? prev.selectedMembers.filter(id => id !== member.id)
                               : [...prev.selectedMembers, member.id]
                          }));
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                          squadForm.selectedMembers.includes(member.id) 
                            ? "bg-white/10 border-white text-white" 
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                        )}
                      >
                         <div className={cn("w-5 h-5 rounded flex items-center justify-center border", squadForm.selectedMembers.includes(member.id) ? "bg-white border-white" : "border-white/20")}>
                           {squadForm.selectedMembers.includes(member.id) && <ShieldCheck className="w-3 h-3 text-black" />}
                         </div>
                         <span className="font-black text-sm">{member.full_name}</span>
                         <span className="ml-auto text-[9px] uppercase tracking-widest opacity-50">{member.role}</span>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <button type="submit" className="w-full bg-white text-black py-5 font-black rounded-2xl hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all uppercase tracking-widest text-xs border border-white">
               {squadForm.id ? "RECALIBRATE TEAM" : "ASSEMBLE TEAM"}
            </button>
         </form>
      </Modal>
    </div>
  );
}
