"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Upload, File, Check, X } from "lucide-react";
import { useState } from "react";

interface CldUploadProps {
  onSuccess: (result: any) => void;
  label?: string;
}

export function CldUpload({ onSuccess, label = "Upload Document" }: CldUploadProps) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState("");

  return (
    <CldUploadWidget
      options={{
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
      }}
      onSuccess={(result: any) => {
        if (result.event === "success") {
          setIsUploaded(true);
          setFileName(result.info.original_filename + "." + result.info.format);
          onSuccess(result.info);
        }
      }}
    >
      {({ open }: { open: any }) => (
        <button
          type="button"
          onClick={() => open()}
          className="w-full p-8 border-2 border-dashed border-white/10 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/[0.02] transition-all relative overflow-hidden group"
        >
          {isUploaded ? (
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(140,249,23,0.3)]">
                <Check className="w-6 h-6 stroke-[3px]" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Upload Encrypted</p>
                <p className="text-xs font-bold text-white/70 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10 group-hover:text-primary group-hover:border-primary/30 transition-all">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-all">{label}</p>
                <p className="text-[9px] font-medium text-muted-foreground/50 mt-1 uppercase tracking-widest">Max size 10MB • Secure Channel</p>
              </div>
            </>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}
