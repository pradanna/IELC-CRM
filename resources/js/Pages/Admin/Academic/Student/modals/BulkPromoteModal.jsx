import React, { useState, useEffect, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { 
    X, Sparkles, AlertCircle, CheckCircle2, 
    Layers, ArrowRight, Loader2, Award, AlertTriangle, CheckSquare, Square, Search, Filter
} from 'lucide-react';
import PremiumSelect from '@/Components/PremiumSelect';
import axios from 'axios';

export default function BulkPromoteModal({ isOpen, onClose, gradesList = [] }) {
    if (!isOpen) return null;

    const [mode, setMode] = useState('auto_detailed'); // 'auto_detailed' | 'auto_level' | 'custom'
    const [fromGrade, setFromGrade] = useState('');
    const [toGrade, setToGrade] = useState('');
    const [previewData, setPreviewData] = useState({ total_affected: 0, student_list: [], preview_list: [] });
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'valid' | 'graduated' | 'level_missing'

    const { processing } = useForm();

    // Fetch live preview whenever mode / grade changes
    useEffect(() => {
        const fetchPreview = async () => {
            setIsLoadingPreview(true);
            try {
                const res = await axios.post('/admin/academic/students/bulk-promote', {
                    mode,
                    from_grade: fromGrade,
                    to_grade: toGrade,
                    preview_only: true
                });
                setPreviewData(res.data);
                // By default select all valid & returned students
                if (res.data.student_list) {
                    setSelectedStudentIds(res.data.student_list.map(s => s.id));
                } else {
                    setSelectedStudentIds([]);
                }
            } catch (err) {
                console.error("Failed to fetch promote preview:", err);
            } finally {
                setIsLoadingPreview(false);
            }
        };

        fetchPreview();
    }, [mode, fromGrade, toGrade]);

    // Filtered student list for table
    const filteredStudentList = useMemo(() => {
        const list = previewData.student_list || [];
        return list.filter(item => {
            const matchesSearch = !searchQuery || 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.from_full.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [previewData.student_list, searchQuery, statusFilter]);

    const isAllFilteredSelected = useMemo(() => {
        if (filteredStudentList.length === 0) return false;
        return filteredStudentList.every(s => selectedStudentIds.includes(s.id));
    }, [filteredStudentList, selectedStudentIds]);

    const toggleSelectAll = () => {
        if (isAllFilteredSelected) {
            const filteredIds = filteredStudentList.map(s => s.id);
            setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            const filteredIds = filteredStudentList.map(s => s.id);
            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleExecute = () => {
        router.post('/admin/academic/students/bulk-promote', {
            mode,
            from_grade: fromGrade,
            to_grade: toGrade,
            selected_lead_ids: selectedStudentIds,
        }, {
            onSuccess: () => {
                setShowConfirmDialog(false);
                onClose();
            }
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-100 shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                                <AlertTriangle size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-wide uppercase">Kenaikan Kelas Massal</h3>
                                <p className="text-xs text-amber-100 font-medium">Validasi dan centang siswa yang akan dinaikkan kelasnya secara serentak</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Info Banner */}
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                            <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block mb-0.5">Mode Kenaikan Kelas Berurutan:</span>
                                Menaikkan 1 tingkat kelas secara otomatis (<strong className="text-amber-900 font-extrabold">SD 1 ➔ SD 2</strong>, <strong className="text-amber-900 font-extrabold">SD 6 ➔ SMP 7</strong>, <strong className="text-amber-900 font-extrabold">SMP 9 ➔ SMA 10</strong>).
                                Siswa SMA Kelas 12 akan otomatis diset lulus ke <strong className="text-amber-900 font-extrabold">KULIAH</strong>.
                            </div>
                        </div>

                        {mode === 'custom' && (
                            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Tingkat Asal</label>
                                        <PremiumSelect
                                            options={[
                                                { value: '', label: 'Pilih Asal Grade' },
                                                ...gradesList.map(g => ({ value: g, label: g }))
                                            ]}
                                            value={fromGrade}
                                            onChange={setFromGrade}
                                            icon={Award}
                                            placeholder="Pilih Asal Grade"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">Tingkat Baru (Target)</label>
                                        <PremiumSelect
                                            options={[
                                                { value: '', label: 'Pilih Target Grade' },
                                                ...gradesList.map(g => ({ value: g, label: g })),
                                                { value: 'SD 1', label: 'SD 1' },
                                                { value: 'SMP 7', label: 'SMP 7' },
                                                { value: 'SMA 10', label: 'SMA 10' },
                                                { value: 'Kuliah / Umum', label: 'Kuliah / Umum' }
                                            ]}
                                            value={toGrade}
                                            onChange={setToGrade}
                                            icon={ArrowRight}
                                            placeholder="Pilih Target Grade"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search & Filter bar for preview */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari siswa atau kelas..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Filter size={12} /> Filter:
                                </span>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="valid">✅ Valid (Naik Kelas)</option>
                                    <option value="graduated">🎓 Lulusan (SMA 12 ➔ Kuliah)</option>
                                    <option value="level_missing">⚠️ Detail Kelas Kosong</option>
                                </select>
                            </div>
                        </div>

                        {/* Interactive Checklist Table Container */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isAllFilteredSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300 cursor-pointer"
                                        />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                            Pilih Semua ({filteredStudentList.length})
                                        </span>
                                    </label>
                                    {isLoadingPreview && <Loader2 size={13} className="animate-spin text-orange-500" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-[11px] rounded-full border border-orange-200">
                                        {selectedStudentIds.length} dari {previewData.total_affected} Siswa Tercentang
                                    </span>
                                </div>
                            </div>

                            {/* Table List */}
                            <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                                {filteredStudentList.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-xs italic font-medium">
                                        Tidak ada siswa yang sesuai dengan kriteria pencarian / filter.
                                    </div>
                                ) : (
                                    filteredStudentList.map((student) => {
                                        const isSelected = selectedStudentIds.includes(student.id);
                                        return (
                                            <div 
                                                key={student.id} 
                                                onClick={() => toggleSelectStudent(student.id)}
                                                className={`px-4 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-orange-50/30 hover:bg-orange-50/60' : 'hover:bg-slate-50 opacity-70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectStudent(student.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                                                    />
                                                    <div className="truncate">
                                                        <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{student.student_number}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-bold">{student.from_full}</span>
                                                        <ArrowRight size={13} className="text-slate-400" />
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md font-extrabold">{student.to_full}</span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    {student.status === 'graduated' && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-black rounded-md">
                                                            🎓 Lulus
                                                        </span>
                                                    )}
                                                    {student.status === 'level_missing' && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black rounded-md">
                                                            ⚠️ No Level
                                                        </span>
                                                    )}
                                                    {student.status === 'valid' && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-md">
                                                            ✅ Valid
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-white transition-all"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            disabled={selectedStudentIds.length === 0 || processing}
                            onClick={() => setShowConfirmDialog(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95"
                        >
                            <AlertTriangle size={15} />
                            Proses Kenaikan Kelas ({selectedStudentIds.length} Siswa)
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning Confirmation Modal / Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border border-orange-100 shadow-2xl transform animate-in zoom-in-95 duration-200 space-y-4">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-orange-200">
                            <AlertTriangle size={32} />
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">Konfirmasi Kenaikan Kelas Massal</h4>
                            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                                Anda akan menaikkan tingkat/kelas sekolah untuk <strong className="text-orange-600 font-extrabold">{selectedStudentIds.length} siswa tercentang</strong> secara serentak. 
                                Data tingkat sekolah siswa yang dipilih akan diperbarui di database.
                            </p>
                        </div>

                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-[11px] text-amber-900 font-bold">
                            Apakah Anda yakin ingin melanjutkan perubahan massal ini?
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleExecute}
                                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {processing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                Ya, Lanjutkan!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


