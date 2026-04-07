"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Plus, 
  Globe, 
  Briefcase, 
  Loader2, 
  Users, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    budget: "", 
    description: "", 
    assigned_team_id: ""
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    
    // Fast cookie check instead of network session check
    const getCookie = (name: string) => {
       const value = `; ${document.cookie}`;
       const parts = value.split(`; ${name}=`);
       if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
       return null;
    };
    setUserRole(getCookie('promanager_role'));

    const [projectsRes, teamsRes] = await Promise.all([
      supabase.from('projects').select('*, teams(name)').order('created_at', { ascending: false }),
      supabase.from('teams').select('*')
    ]);

    if (projectsRes.data) setProjectsList(projectsRes.data);
    if (teamsRes.data) setTeamsList(teamsRes.data);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setIsModalOpen(true);
    }
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'Manager') return;
    
    const { error } = await supabase
      .from('projects')
      .insert([
        { 
          name: formData.name, 
          budget: `$${formData.budget}k`,
          description: formData.description,
          assigned_team_id: formData.assigned_team_id || null,
          tasks_total: 0,
          tasks_completed: 0,
          status: 'Active'
        }
      ]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ name: "", budget: "", description: "", assigned_team_id: "" });
      fetchInitialData();
    } else {
      alert("Error adding project: " + error.message);
    }
  };

  const isManager = userRole === 'Manager';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2 font-medium">Assign squads and monitor initiative progress.</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 py-3.5 font-black flex items-center gap-2 hover:bg-white/90 transition-all rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 border border-white/10"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Project">
        <form onSubmit={handleAddProject} className="space-y-6">
           <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Project Name</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-muted/30 border border-white/5 p-4 pl-12 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Project Apollo UI" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Target Team</label>
                <select value={formData.assigned_team_id} onChange={(e) => setFormData({...formData, assigned_team_id: e.target.value})} className="w-full bg-muted/30 border border-white/5 p-4 rounded-xl text-sm outline-none cursor-pointer">
                  <option value="">Select Team...</option>
                  {teamsList.map(team => <option key={team.id} value={team.id} className="bg-[#121214]">{team.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Budget (k)</label>
                <input required type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full bg-muted/30 border border-white/5 p-4 rounded-xl text-sm outline-none" placeholder="e.g. 240" />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Mission Briefing</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-muted/30 border border-white/5 p-4 rounded-xl text-sm min-h-[100px] resize-none outline-none" placeholder="Describe goals..." />
           </div>

           <button type="submit" className="w-full bg-white text-black py-4 font-black rounded-xl hover:bg-white/90 transition-all">Assemble Project</button>
        </form>
      </Modal>

      {isLoading ? (
         <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Compiling Mission Objectives...</span>
         </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projectsList.map((project) => {
            const total = project.tasks_total || 0;
            const completed = project.tasks_completed || 0;
            const progress = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

            return (
              <Link href={`/projects/${project.id}`} key={project.id} className="group glass card-hover flex flex-col p-6 rounded-2xl cursor-pointer shadow-2xl relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20"><FolderKanban className="h-6 w-6 text-primary" /></div>
                  <span className="text-[9px] font-black uppercase text-primary px-2 py-0.5 bg-primary/10 rounded-full">{project.status}</span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase mt-1 flex items-center gap-2"><Users className="w-3 h-3" /> {project.teams?.name || 'Unassigned Team'}</p>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-muted-foreground">Objectives Finished</span>
                    <span className="text-primary">{completed} / {total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-white/50">{progress}% COMPLETE</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
