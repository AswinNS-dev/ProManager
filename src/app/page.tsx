"use client";

import React, { useState, useEffect } from "react";
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { 
  Briefcase, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Loader2,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, tasks: 0, budget: 0, members: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: tCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    const { count: mCount } = await supabase.from('team_members').select('*', { count: 'exact', head: true });
    const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    if (projects) {
      const totalBudget = projects.reduce((acc, curr) => {
        const val = curr.budget?.replace(/[^0-9.]/g, '') || "0";
        return acc + parseFloat(val);
      }, 0);
      
      setStats({
        projects: pCount || 0,
        tasks: tCount || 0,
        budget: totalBudget,
        members: mCount || 0
      });
      setRecentProjects(projects.slice(0, 10)); // Show more on home now chart is gone
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Fleet Intel...</span>
      </div>
    );
  }

  const statCards = [
    { title: "Active Missions", value: stats.projects, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Directives Set", value: stats.tasks, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Fleet Size", value: stats.members, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Total Budget", value: `$${stats.budget}k`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Fleet Intel</h1>
          <p className="text-muted-foreground font-medium">Global summary of all operational theaters.</p>
        </div>
        <button onClick={fetchDashboardData} className="px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-all text-xs">REFRESH FEED</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col gap-4 group hover:border-primary/30 transition-all">
            <div className={cn("p-3 w-fit rounded-xl", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
           <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" />Recent Activity</h3>
                 <Link href="/projects" className="text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">VIEW ALL MISSIONS</Link>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-white/5">
                          <th className="pb-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest uppercase">Mission Identity</th>
                          <th className="pb-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest uppercase text-center">Status</th>
                          <th className="pb-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest uppercase text-right">Value</th>
                       </tr>
                    </thead>
                    <tbody>
                       {recentProjects.map((project) => (
                          <tr key={project.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer border-b border-white/[0.02]">
                             <td className="py-6 pr-4">
                                <Link href={`/projects/${project.id}`} className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary transition-transform group-hover:scale-110">
                                      {project.name[0]}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm tracking-tight">{project.name}</p>
                                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">ID: {project.id.slice(0, 8)}</p>
                                   </div>
                                </Link>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border border-primary/20", project.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary")}>
                                   {project.status || 'Active'}
                                </span>
                             </td>
                             <td className="py-6 pl-4 text-right">
                                <span className="font-bold text-sm font-mono">{project.budget || '$0k'}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
           <div className="glass-card p-8">
              <h3 className="font-bold mb-8 text-sm uppercase tracking-widest text-muted-foreground">Fleet Distribution</h3>
              <div className="h-[240px] flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            { name: 'Finished', value: recentProjects.filter(p => p.status === 'Completed').length || 0 },
                            { name: 'In Progress', value: recentProjects.filter(p => p.status !== 'Completed').length || 0 }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          <Cell fill="#8cf917" />
                          <Cell fill="#27272a" />
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black">{stats.projects}</span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground">MISSIONS</span>
                 </div>
              </div>
           </div>

           <div className="glass-card p-8 bg-primary/5 border-primary/20 relative overflow-hidden group">
              <div className="relative z-10">
                 <h3 className="font-bold mb-2">Fleet Management</h3>
                 <p className="text-xs text-muted-foreground leading-relaxed mb-6">Scale your operational velocity by recruiting more members into your squads.</p>
                 <Link href="/teams" className="inline-flex items-center gap-2 py-3 px-6 bg-white text-black font-black rounded-xl text-xs hover:bg-white/90 active:scale-95 transition-all">
                    MANAGE FLEET <ArrowUpRight className="w-4 h-4" />
                 </Link>
              </div>
              <Activity className="absolute -bottom-10 -right-10 w-40 h-40 text-primary/5 group-hover:scale-110 transition-transform duration-700" />
           </div>
        </div>
      </div>
    </div>
  );
}
