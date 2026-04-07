"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  ChevronDown, 
  Calendar, 
  Zap, 
  Target, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const trendData = [
  { name: "Week 1", completed: 400, planned: 240 },
  { name: "Week 2", completed: 300, planned: 139 },
  { name: "Week 3", completed: 200, planned: 980 },
  { name: "Week 4", completed: 278, planned: 390 },
  { name: "Week 5", completed: 189, planned: 480 },
  { name: "Week 6", completed: 239, planned: 380 },
  { name: "Week 7", completed: 349, planned: 430 },
];

const performanceData = [
  { name: "Mon", score: 85 },
  { name: "Tue", score: 72 },
  { name: "Wed", score: 91 },
  { name: "Thu", score: 64 },
  { name: "Fri", score: 78 },
  { name: "Sat", score: 45 },
  { name: "Sun", score: 32 },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
     totalMissions: 0,
     totalTasks: 0,
     completedTasks: 0,
     activeDirectives: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: tasks } = await supabase.from('tasks').select('*');

    if (projects && tasks) {
      setStats({
        totalMissions: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length,
        activeDirectives: tasks.filter(t => t.status !== 'Completed').length
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Loading your analytics...</span>
    </div>
  );

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">ANALYTICS DASHBOARD</h1>
          <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.2em]">See your projects, tasks, and progress at a glance.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all">
              <Calendar className="w-4 h-4 text-primary" />
              This Month <ChevronDown className="w-3 h-3 text-muted-foreground" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="glass-card p-8 group border-primary/20">
           <div className="flex justify-between items-center mb-6">
             <div className="p-3 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(140,249,23,0.2)]"><TrendingUp className="w-5 h-5 text-primary" /></div>
             <span className="text-primary text-[10px] font-black px-2 py-1 bg-primary/10 rounded-full flex items-center gap-1 uppercase">Active</span>
           </div>
           <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Active Projects</span>
           <h2 className="text-4xl font-black">{stats.totalMissions}</h2>
        </div>
        <div className="glass-card p-8 group">
           <div className="flex justify-between items-center mb-6">
             <div className="p-3 bg-primary/10 rounded-xl"><Zap className="w-5 h-5 text-primary" /></div>
             <span className="text-primary text-[10px] font-black px-2 py-1 bg-primary/10 rounded-full flex items-center gap-1 uppercase">In Progress</span>
           </div>
           <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Active Tasks</span>
           <h2 className="text-4xl font-black">{stats.activeDirectives}</h2>
        </div>
        <div className="glass-card p-8 group">
           <div className="flex justify-between items-center mb-6">
             <div className="p-3 bg-primary/10 rounded-xl shadow-[0_0_15px_rgba(140,249,23,0.2)]"><Target className="w-5 h-5 text-primary" /></div>
             <span className="text-primary text-[10px] font-black px-2 py-1 bg-primary/10 rounded-full flex items-center gap-1 uppercase">Complete</span>
           </div>
           <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Completion Rate</span>
           <h2 className="text-4xl font-black">{completionRate}%</h2>
        </div>
        <div className="glass-card p-8 group">
           <div className="flex justify-between items-center mb-6">
             <div className="p-3 bg-primary/10 rounded-xl"><Activity className="w-5 h-5 text-primary" /></div>
           </div>
           <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Total Tasks</span>
           <h2 className="text-4xl font-black">{stats.totalTasks}</h2>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 pb-10">
         <div className="col-span-8 glass-card p-10 bg-primary/[0.01]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 underline decoration-primary/30 underline-offset-[12px]">Task Overview</h3>
            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: "Total", val: stats.totalTasks, fill: '#1a1a1c' },
                   { name: "Completed", val: stats.completedTasks, fill: '#8cf917' },
                   { name: "In Progress", val: stats.activeDirectives, fill: '#ffffff' }
                 ]}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: '900'}} />
                   <Tooltip 
                     contentStyle={{background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '15px'}}
                     itemStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}
                   />
                   <Bar dataKey="val" radius={[12, 12, 0, 0]} barSize={80} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="col-span-4 glass-card p-10 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white/[0.01]">
            <div className="relative z-10">
               <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center mb-6 mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-r-transparent animate-spin duration-[3s]" />
                  <span className="text-2xl font-black">{completionRate}%</span>
               </div>
               <h3 className="text-sm font-black tracking-widest uppercase mb-2 text-white">Overall Progress</h3>
               <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-tighter">Your team's task completion status.<br/>Getting <span className="text-primary font-black">BETTER</span> every day</p>
            </div>
            {/* Decorative BG element */}
            <Activity className="absolute -bottom-10 -right-10 w-40 h-40 text-primary/5 rotate-12" />
         </div>
      </div>
    </div>
  );
}
