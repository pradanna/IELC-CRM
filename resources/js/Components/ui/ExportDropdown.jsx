import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, Download, Layers, Users, GraduationCap } from 'lucide-react';

export default function ExportDropdown({ buildExportUrl, type = 'join' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const joinOptions = [
        {
            id: 'join_lifecycle',
            label: 'Siklus Join (Baru / Lanjut / Rejoin)',
            sublabel: 'Rincian Siswa Baru, Paket Lanjut & Rejoin',
            icon: Users,
            color: 'text-purple-500',
        },
        {
            id: 'join_patterns',
            label: 'Pola Join',
            sublabel: 'Rincian per Paket Harga & Sesi',
            icon: Layers,
            color: 'text-indigo-500',
        },
        {
            id: 'join_invoices',
            label: 'Based on New or Extend',
            sublabel: 'Pendaftar Baru (New) vs Lanjut (Extend)',
            icon: Users,
            color: 'text-emerald-500',
        },
        {
            id: 'join_grades',
            label: 'Based on Grades (SD, SMP, dll)',
            sublabel: 'Rincian per Tingkat Pendidikan',
            icon: GraduationCap,
            color: 'text-amber-500',
        },
    ];

    const stopOptions = [
        {
            id: 'siswa_stop_packages',
            label: 'Siswa Stop - Based on Paket Harga',
            sublabel: 'Rincian Siswa Stop per Paket',
            icon: Layers,
            color: 'text-rose-500',
        },
        {
            id: 'siswa_stop_programs',
            label: 'Siswa Stop - Based on Program',
            sublabel: 'Rincian Siswa Stop per Lead Type / Program',
            icon: Users,
            color: 'text-red-500',
        },
        {
            id: 'siswa_stop_grades',
            label: 'Siswa Stop - Based on Grades',
            sublabel: 'Rincian Siswa Stop per Tingkat Pendidikan',
            icon: GraduationCap,
            color: 'text-amber-500',
        },
    ];

    const options = type === 'stop' ? stopOptions : joinOptions;

    const handleDownload = (format, tab) => {
        const url = buildExportUrl(format, tab);
        if (format === 'pdf') {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs font-black uppercase tracking-wider transition-all duration-200"
            >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>Export Laporan</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Laporan & Format Export</p>
                    </div>

                    <div className="space-y-1">
                        {options.map((opt) => {
                            const IconComponent = opt.icon;
                            return (
                                <div key={opt.id} className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-start gap-2.5 mb-2">
                                        <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                                            <IconComponent className={`w-4 h-4 ${opt.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{opt.label}</p>
                                            <p className="text-[10px] font-medium text-slate-400">{opt.sublabel}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-8">
                                        <button
                                            onClick={() => handleDownload('excel', opt.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                        >
                                            <FileSpreadsheet className="w-3 h-3" />
                                            <span>Excel</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownload('pdf', opt.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span>PDF</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
