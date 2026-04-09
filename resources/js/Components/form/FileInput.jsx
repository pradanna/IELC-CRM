import React, { useRef } from 'react';
import { Upload, X, Music, Film, FileText } from 'lucide-react';

export default function FileInput({ 
    value, 
    onChange, 
    accept = "audio/*", 
    placeholder = "Click to upload file",
    className = "",
    error = null,
    icon: Icon = Upload
}) {
    const fileInputRef = useRef();

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                    group relative flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer
                    ${value 
                        ? 'border-red-200 bg-red-50/30' 
                        : 'border-slate-200 bg-slate-50/50 hover:border-red-300 hover:bg-white'}
                    ${error ? 'border-rose-300 bg-rose-50/30' : ''}
                `}
            >
                <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    ${value ? 'bg-red-600 text-white' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-red-600'}
                `}>
                    {value ? <Icon size={18} /> : <Upload size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${value ? 'text-slate-900' : 'text-slate-500'}`}>
                        {value ? (value.name || 'File selected') : placeholder}
                    </p>
                    {value && (
                        <p className="text-[10px] text-slate-400 font-medium">
                            {(value.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                        </p>
                    )}
                </div>

                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => onChange(e.target.files[0])}
                className="hidden"
            />
            
            {error && (
                <p className="mt-1 text-xs text-rose-600 font-bold">{error}</p>
            )}
        </div>
    );
}
