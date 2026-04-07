"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Plus, 
  Loader2,
  Users,
  TrendingUp,
  ArrowLeft,
  Trash2,
  Activity,
  Edit2,
  Settings,
  Globe
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/Modal";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectEditOpen, setIsProjectEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ id: "", title: "", priority: "Medium" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });

  const fetchProjectData = async () => {
    setIsLoading(true);
    
    // Manual cookie check
    const getCookie = (name: string) => {
       const value = `; ${document.cookie}`;
       const parts = value.split(`; ${name}=`);
       if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
       return null;
    };
    setUserRole(getCookie('promanager_role'));

    const { data: projectData } = await supabase
      .from('projects')
      .select('*, teams(id, name)')
      .eq('id', params.id)
      .single();
    
    if (projectData) {
      setProject(projectData);
      setProjectForm({ name: projectData.name, description: projectData.description });
      
      if (projectData.assigned_team_id) {
        const { data: memberships } = await supabase
          .from('team_memberships')
          .select('team_members(*)')
          .eq('team_id', projectData.assigned_team_id);
        if (memberships) setRoster(memberships.map(m => m.team_members));
      }

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, team_members(full_name)')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false });
      
      if (tasksData) {
        setTasks(tasksData);
        const total = tasksData.length;
        const completed = tasksData.filter(t => t.status === 'Completed').length;
        if (projectData.tasks_total !== total || projectData.tasks_completed !== completed) {
           await supabase.from('projects').update({ tasks_total: total, tasks_completed: completed }).eq('id', params.id);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (params.id) fetchProjectData();
  }, [params.id]);

  const isManager = userRole === 'Manager';

  const handleUpdateProject = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!isManager) return;
     const { error } = await supabase.from('projects').update({ name: projectForm.name, description: projectForm.description }).eq('id', params.id);
     if (!error) { setIsProjectEditOpen(false); fetchProjectData(); }
  };

  const handleTerminateMission = async () => {
     if (!isManager) return;
     if (confirm("TERMINATE THIS MISSION?")) {
        const { error } = await supabase.from('projects').delete().eq('id', params.id);
        if (!error) router.push('/projects');
     }
  };

  const handleTaskAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    if (taskForm.id) {
      await supabase.from('tasks').update({ title: taskForm.title, priority: taskForm.priority }).eq('id', taskForm.id);
    } else {
      await supabase.from('tasks').insert([{ project_id: params.id, title: taskForm.title, priority: taskForm.priority, assigned_member_id: selectedMember.id, status: "Todo" }]);
    }
    fetchProjectData();
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (!isManager) return;
    if (confirm("ABORT THIS DIRECTIVE?")) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) fetchProjectData();
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    fetchProjectData();
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Syncing Mission Intelligence...</span>
    </div>
  );

  const progress = project?.tasks_total > 0 ? Math.min(Math.round(((project?.tasks_completed || 0) / project.tasks_total) * 100), 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex items-center justify-between">
        <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-white group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black tracking-widest">BACK TO FLEET</span>
        </Link>
        {isManager && (
          <div className="flex gap-4">
            <button onClick={() => setIsProjectEditOpen(true)} className="px-4 py-2 bg-white/5 text-white/70 text-[10px] font-black rounded-full border border-white/10 hover:bg-white hover:text-black transition-all flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> RECALIBRATE</button>
            <button onClick={handleTerminateMission} className="px-4 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-full border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">TERMINATE</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="glass-card p-10 relative overflow-hidden bg-primary/[0.02]">
             <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-black uppercase text-primary tracking-widest bg-primary/10 px-3 py-1 rounded-full">{project?.teams?.name || 'Unassigned'}</span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter mb-4">{project?.name}</h1>
                  <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-xl">{project?.description}</p>
                </div>
                <div className="w-full md:w-64 space-y-4">
                   <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-primary">Progress</span><span className="text-3xl font-black">{progress}%</span></div>
                   <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-white transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.4)] relative" style={{ width: `${progress}%` }}>
                         <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)] animate-[shimmer_2s_infinite]" />
                      </div>
                   </div>
                   <div className="text-[10px] text-right font-black text-white uppercase mt-2 tracking-widest">{project?.tasks_completed || 0} / {project?.tasks_total || 0} OBJECTIVES SECURED</div>
                </div>
             </div>
          </div>

          <div className="glass-card p-8">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" />ACTIVE DIRECTIVES</h3>
             <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="p-4 bg-muted/10 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-muted/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", task.status === "Completed" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-primary shadow-primary/50")} />
                        <div>
                           <p className={cn("font-bold text-sm transition-all", task.status === "Completed" && "line-through opacity-40")}>{task.title}</p>
                           <span className="text-[10px] font-black uppercase text-muted-foreground">{task.team_members?.full_name}</span>
                        </div>
                     </div>
                      <div className="flex items-center gap-4">
                         <button onClick={() => handleToggleTaskStatus(task)} className={cn("p-2 rounded-lg", task.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary")}>
                            <CheckCircle2 className="w-4 h-4" />
                         </button>
                         {isManager && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setTaskForm({ id: task.id, title: task.title, priority: task.priority }); setIsTaskModalOpen(true); }} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><Edit2 className="w-3 h-3" /></button>
                               <button onClick={() => handleDeleteTask(task.id)} className="p-2 bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white text-rose-500 transition-all focus:ring-1 focus:ring-rose-500 outline-none"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                         )}
                      </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <div className="glass-card p-8 order-2 lg:order-1">
              <h3 className="font-bold mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />SQUAD ROSTER</h3>
              <div className="space-y-4">
                 {roster.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-transparent hover:border-primary/20 transition-all group">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">{member.full_name[0]}</div>
                          <div><p className="text-xs font-bold">{member.full_name}</p><p className="text-[9px] font-black uppercase text-muted-foreground">{member.role}</p></div>
                       </div>
                       {isManager && <button onClick={() => { setSelectedMember(member); setTaskForm({ id: "", title: "", priority: "Medium" }); setIsTaskModalOpen(true); }} className="p-2 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black"><Plus className="w-3 h-3" /></button>}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Mission Objective">
        <form onSubmit={handleTaskAction} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-2">Objective Title</label>
              <input required value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} className="w-full bg-white/5 border border-white/5 p-4 rounded-xl outline-none" />
           </div>
           <button type="submit" className="w-full bg-white text-black py-4 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white">UPDATE DIRECTIVE</button>
        </form>
      </Modal>

      <Modal isOpen={isProjectEditOpen} onClose={() => setIsProjectEditOpen(false)} title="Recalibrate">
        <form onSubmit={handleUpdateProject} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-2">Project Name</label>
              <input required value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} className="w-full bg-white/5 border border-white/5 p-4 rounded-xl outline-none" />
           </div>
           <button type="submit" className="w-full bg-white text-black py-4 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white">SAVE CHANGES</button>
        </form>
      </Modal>
    </div>
  );
}
