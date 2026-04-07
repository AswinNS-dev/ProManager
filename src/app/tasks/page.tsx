"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Plus, 
  Search, 
  Calendar, 
  MoreHorizontal,
  ChevronDown,
  LayoutGrid,
  List,
  AlertCircle,
  Clock,
  Tag,
  PenTool,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";

export default function TasksPage() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: "", project_id: "", priority: "Medium" });

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: projData } = await supabase.from('projects').select('id, name');
    
    if (tasksData) setTasksList(tasksData);
    if (projData) {
      setProjectsList(projData);
      if (projData.length > 0 && !formData.project_id) {
        setFormData(prev => ({ ...prev, project_id: projData[0].id }));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('tasks')
      .insert([{
        title: formData.title,
        project_id: formData.project_id,
        status: "Todo",
        priority: formData.priority,
        due_date: new Date().toISOString()
      }]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ ...formData, title: "" });
      fetchTasks();
    } else {
      alert("Error adding task: " + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Active Tasks</h1>
          <p className="text-muted-foreground mt-2 font-medium">Keep track of your team's micro-milestones.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="pl-10 pr-4 py-3 bg-muted/30 border border-white/5 rounded-xl w-64 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 py-3.5 font-black flex items-center gap-2 hover:bg-white/90 transition-all rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-offset-background active:scale-95 border border-white/10"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Micro-Task"
      >
        <form onSubmit={handleAddTask} className="space-y-6">
           <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Task Title</label>
              <div className="relative">
                <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                   required
                   value={formData.title}
                   onChange={(e) => setFormData({...formData, title: e.target.value})}
                   className="w-full bg-muted/30 border border-white/5 p-4 pl-12 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/50 transition-all" 
                   placeholder="e.g. Implement user auth flow"
                />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Project</label>
                <select 
                   value={formData.project_id}
                   onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                   className="w-full bg-muted/30 border border-white/5 p-4 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none cursor-pointer"
                >
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#121214]">{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Priority</label>
                <select 
                   value={formData.priority}
                   onChange={(e) => setFormData({...formData, priority: e.target.value})}
                   className="w-full bg-muted/30 border border-white/5 p-4 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none cursor-pointer"
                >
                  <option className="bg-[#121214]">High</option>
                  <option className="bg-[#121214]">Medium</option>
                  <option className="bg-[#121214]">Low</option>
                </select>
              </div>
           </div>

           <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-white text-black py-4 font-black rounded-xl hover:bg-white/90 transition-all border border-white/10 shadow-lg shadow-white/5 active:scale-95"
              >
                Launch Task
              </button>
           </div>
        </form>
      </Modal>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="flex gap-4">
           <button className="px-4 py-2 bg-muted/50 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-muted transition-colors">
             Project <ChevronDown className="w-3 h-3" />
           </button>
           <button className="px-4 py-2 bg-muted/50 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-muted transition-colors">
             Priority <ChevronDown className="w-3 h-3" />
           </button>
        </div>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
           <button 
             onClick={() => setView("kanban")}
             className={cn("p-2 rounded-md transition-all", view === "kanban" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white")}
           >
             <LayoutGrid className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setView("list")}
             className={cn("p-2 rounded-md transition-all", view === "list" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white")}
           >
             <List className="w-4 h-4" />
           </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="glass-card p-8">
          <table className="w-full text-left">
            <thead className="text-[10px] text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="pb-4">Task Name</th>
                <th className="pb-4">Project</th>
                <th className="pb-4">Assignee</th>
                <th className="pb-4">Due Date</th>
                <th className="pb-4">Priority</th>
                <th className="pb-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tasksList.map((task) => {
                const project = projectsList.find(p => p.id === task.project_id);
                const project_name = project ? project.name : "Unknown";
                const display_date = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date';

                return (
                  <tr key={task.id} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg border border-white/5">
                          <CheckCircle2 className={cn("w-4 h-4", task.status === "Completed" ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <span className="font-bold">{task.title}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="text-muted-foreground font-medium">{project_name}</span>
                    </td>
                    <td className="py-6 text-muted-foreground">Team Member</td>
                    <td className="py-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                         <Calendar className="w-3 h-3" />
                         <span className="text-[11px] font-bold">{display_date}</span>
                      </div>
                    </td>
                    <td className="py-6">
                       <span className={cn(
                         "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                         task.priority === "High" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                         task.priority === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                         "bg-blue-500/10 text-blue-500 border-blue-500/20"
                       )}>
                         {task.priority || 'Medium'}
                       </span>
                    </td>
                    <td className="py-6 text-right font-bold text-primary">
                      <span className={cn(
                        "text-[11px] uppercase tracking-widest font-black",
                        task.status === "Completed" ? "text-primary" :
                        task.status === "Delayed" ? "text-red-500" :
                        "text-muted-foreground"
                      )}>
                        {task.status || 'Todo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
           {["Todo", "In Progress", "Completed"].map((col) => (
             <div key={col} className="min-w-[320px] flex-1 space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">{col}</h3>
                  <Plus className="w-4 h-4 text-muted-foreground cursor-pointer" />
               </div>
               <div className="space-y-4 min-h-[400px] p-2 bg-muted/10 rounded-2xl border border-white/5">
                 {tasksList.filter(t => t.status === col).map(t => {
                   const project = projectsList.find(p => p.id === t.project_id);
                   const project_name = project ? project.name : "Unassigned";
                   const display_date = t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date';

                   return (
                    <div key={t.id} className="glass-card p-6 card-hover cursor-grab active:cursor-grabbing">
                       <div className="flex justify-between items-start mb-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                            t.priority === "High" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>{t.priority || 'Medium'}</span>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                       </div>
                       <h4 className="font-bold text-sm mb-2 leading-tight">{t.title}</h4>
                       <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-4">{project_name}</p>
                       <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                             <Clock className="w-3 h-3" />
                             <span>{display_date}</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[9px]">U</div>
                       </div>
                    </div>
                   );
                 })}
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
