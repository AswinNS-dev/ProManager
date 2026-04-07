"use client";

import React, { useState, useEffect } from "react";
import { 
  File, 
  Upload, 
  Trash2, 
  Download, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  MoreVertical,
  Plus,
  Loader2,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { CldUpload } from "@/components/CldUpload";

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const fetchFiles = async () => {
    setIsLoading(true);
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    setUserRole(getCookie('promanager_role'));
    setUserName(getCookie('promanager_name'));

    const { data } = await supabase
      .from('project_files')
      .select('*, projects(name), comments(*)')
      .order('created_at', { ascending: false });

    if (data) setFiles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (id: string) => {
    if (userRole !== 'Manager') return;
    if (confirm("PURGE THIS DATA PERMANENTLY?")) {
      await supabase.from('project_files').delete().eq('id', id);
      fetchFiles();
    }
  };

  const handleUploadSuccess = async (info: any) => {
    const { error } = await supabase.from('project_files').insert([{
      name: info.original_filename + "." + info.format,
      file_url: info.secure_url,
      file_type: info.format.toUpperCase(),
      size_kb: Math.round(info.bytes / 1024)
    }]);

    if (!error) {
      setIsUploadModalOpen(false);
      fetchFiles();
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(t)) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (['pdf', 'doc', 'docx'].includes(t)) return <FileText className="w-5 h-5 text-rose-400" />;
    if (['zip', 'rar', '7z'].includes(t)) return <HardDrive className="w-5 h-5 text-amber-400" />;
    return <FileCode className="w-5 h-5 text-emerald-400" />;
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.projects?.name && f.projects.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePostComment = async (fileId: string) => {
    const content = commentInputs[fileId];
    if (!content?.trim()) return;

    const { error } = await supabase.from('comments').insert([{
       file_id: fileId,
       content,
       author_name: decodeURIComponent(userName || 'Anonymous Operative')
    }]);

    if (!error) {
       setCommentInputs(prev => ({ ...prev, [fileId]: "" }));
       fetchFiles();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (userRole !== 'Manager') return;
    if (confirm("REDACT THIS TRANSMISSION?")) {
       await supabase.from('comments').delete().eq('id', commentId);
       fetchFiles();
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Accessing Secure Vault...</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-700 pb-20 px-6 text-white font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Secure Vault</h1>
          <p className="text-muted-foreground mt-2 font-medium">Encrypted file repository for fleet operational intelligence.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="relative group min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121214] border border-white/5 pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold" 
                placeholder="Search encrypted files..." 
              />
           </div>
           {userRole === 'Manager' && (
             <button 
               onClick={() => setIsUploadModalOpen(true)}
               className="px-8 py-4 bg-white text-black text-[11px] font-black uppercase rounded-2xl hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 border border-white whitespace-nowrap"
             >
               <Plus className="w-4 h-4 stroke-[3px]" /> Upload Asset
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => (
          <div key={file.id} className="glass-card p-6 flex flex-col gap-6 relative group border-white/5 hover:border-primary/20 transition-all hover:bg-primary/[0.01]">
             <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-primary/30 group-hover:text-primary transition-all">
                   {getFileIcon(file.file_type || 'TXT')}
                </div>
                <div className="flex gap-1">
                   <a 
                     href={file.file_url} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="p-2 text-muted-foreground hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                   >
                     <Download className="w-4 h-4" />
                   </a>
                   {userRole === 'Manager' && (
                     <button 
                       onClick={() => handleDelete(file.id)}
                       className="p-2 text-muted-foreground hover:text-rose-500 transition-colors hover:bg-rose-500/10 rounded-lg"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
             </div>

             <div className="space-y-1">
                <h4 className="font-bold text-sm truncate">{file.name}</h4>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                   {file.file_type} • {file.size_kb} KB
                </p>
             </div>

             <div className="py-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      {file.projects?.name ? `Mission: ${file.projects.name}` : 'FLEET ASSET'}
                   </span>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground/30">
                   {new Date(file.created_at).toLocaleDateString()}
                </span>
             </div>

             <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-primary tracking-widest">
                   <MessageSquare className="w-3 h-3" /> Tactical Comms ({file.comments?.length || 0})
                </div>
                
                <div className="space-y-3 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                   {file.comments?.map((comment: any) => (
                     <div key={comment.id} className="text-left bg-white/5 p-3 rounded-xl border border-white/5 group/comment relative">
                        <p className="text-[10px] font-bold text-white mb-1 pr-6">{comment.content}</p>
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black uppercase text-primary">{comment.author_name}</span>
                           <span className="text-[8px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {userRole === 'Manager' && (
                           <button 
                             onClick={() => handleDeleteComment(comment.id)} 
                             className="absolute top-2 right-2 opacity-0 group-hover/comment:opacity-100 text-muted-foreground hover:text-rose-500 transition-all p-1"
                           >
                              <Trash2 className="w-3 h-3" />
                           </button>
                        )}
                     </div>
                   ))}
                   {(!file.comments || file.comments.length === 0) && (
                      <p className="text-[9px] text-muted-foreground italic py-2">No tactical transmissions recorded.</p>
                   )}
                </div>

                <div className="flex gap-2">
                   <input 
                     value={commentInputs[file.id] || ""}
                     onChange={(e) => setCommentInputs({ ...commentInputs, [file.id]: e.target.value })}
                     onKeyDown={(e) => e.key === 'Enter' && handlePostComment(file.id)}
                     className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] focus:ring-1 focus:ring-primary outline-none" 
                     placeholder="Broadcast message..." 
                   />
                   <button 
                     onClick={() => handlePostComment(file.id)}
                     className="p-2 bg-primary/20 text-primary rounded-xl hover:bg-primary hover:text-black transition-all"
                   >
                     <Send className="w-3 h-3" />
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 glass-card bg-transparent border-dashed border-white/10 opacity-50">
           <HardDrive className="w-12 h-12 mb-4 text-muted-foreground" />
           <p className="text-xs font-black uppercase tracking-widest">No assets found in target sector.</p>
        </div>
      )}

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="UPLINK FLEET ASSETS">
         <div className="py-6 space-y-8 text-center">
            <div className="p-10 rounded-[40px] bg-primary/5 border border-primary/20 relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center text-primary mx-auto border border-primary/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                     <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h3 className="font-black text-xs tracking-[0.3em] text-primary uppercase">Quantum Secure Upload</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">Assets uploaded through this channel are permanently mirrored to the Cloudinary tactical network.</p>
               </div>
            </div>

            <CldUpload 
               onSuccess={handleUploadSuccess}
               label="Select Encrypted File" 
            />

            <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
               <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left leading-relaxed">
                  Warning: All activity in the secure vault is logged and monitored for unauthorized exfiltration.
               </p>
            </div>
         </div>
      </Modal>
    </div>
  );
}
