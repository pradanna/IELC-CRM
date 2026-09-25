import React from 'react';
import { 
    GraduationCap, 
    Compass, 
    Loader2, 
    Save, 
    MapPin, 
    Users, 
    Phone, 
    Mail, 
    MessageSquare, 
    CheckCircle2, 
    StickyNote, 
    Calendar,
    Clock,
    DollarSign
} from 'lucide-react';
import DatePicker from '@/Components/form/DatePicker';
import CurrencyInput from '@/Components/form/CurrencyInput';
import { InfoItem } from '../../../components/DrawerUI';

export default function PreEnrollmentStage({
    lead,
    plottingForm,
    setPlottingForm,
    availableClasses = [],
    selectedClass,
    remainingMeetings,
    savingPlotting,
    handleSavePlotting,
    openWaWeb
}) {
    // Cari kelas yang saat ini tersimpan di plotting
    const currentPlottedClass = availableClasses.find(c => c.id === lead?.plotting?.study_class_id);
    const currentClassName = currentPlottedClass?.name || lead?.plotting?.class_name || 'Kelas Belum Dipilih';
    const currentScheduleDays = currentPlottedClass?.schedule_days || lead?.plotting?.schedule_days || [];
    const currentJoinDate = lead?.plotting?.join_date;
    const currentCost = lead?.plotting?.estimated_cost;
    const currentRemaining = lead?.plotting?.remaining_meetings ?? remainingMeetings;
    const currentTotal = lead?.plotting?.total_meetings ?? currentPlottedClass?.total_meetings ?? 24;
    const currentNotes = lead?.plotting?.notes;

    // Kumpulkan seluruh data orang tua / wali dari guardians dan lead_relationships
    const connectedParents = [
        ...(lead?.guardians || []).map(g => ({
            id: g.id,
            name: g.name,
            role: g.role || g.relationship || 'Wali / Orang Tua',
            phone: g.phone,
            email: g.email,
            is_main_contact: !!g.is_main_contact,
            source: 'guardian'
        })),
        ...(lead?.lead_relationships || [])
            .filter(r => r.type === 'parent' || r.type === 'guardian')
            .map(r => ({
                id: r.related_lead_id,
                name: r.related_lead?.name || 'Parent Lead',
                role: r.type === 'parent' ? 'Orang Tua (Parent)' : 'Wali (Guardian)',
                phone: r.related_lead?.phone,
                email: r.related_lead?.email,
                is_main_contact: !!r.is_main_contact,
                source: 'relationship'
            }))
    ];

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        let clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) return '62' + clean.slice(1);
        if (clean.startsWith('8')) return '62' + clean;
        return clean;
    };

    return (
        <div className="space-y-8">
            {/* Class Selection & Plotting Form */}
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-inner">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <GraduationCap size={14} className="text-red-500" /> Plotting Kelas (Pre-Enrollment)
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Kelas</label>
                            <select
                                value={plottingForm.study_class_id}
                                onChange={e => setPlottingForm({ ...plottingForm, study_class_id: e.target.value })}
                                className="w-full bg-white border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all py-3.5 px-5 shadow-sm"
                            >
                                <option value="">-- Pilih Kelas Tersedia --</option>
                                {availableClasses.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                        {cls.schedule_days ? ` (${cls.schedule_days.map(d => d.substring(0, 3)).join(', ')})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Rencana Masuk</label>
                            <DatePicker
                                value={plottingForm.join_date}
                                onChange={val => setPlottingForm({ ...plottingForm, join_date: val })}
                                inputClassName="!py-3.5 !h-auto !bg-white !border-slate-200 !rounded-2xl !text-sm !font-bold !text-slate-700 !shadow-sm !ring-red-500/20"
                            />
                        </div>

                        {selectedClass && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estimasi Biaya (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none select-none">Rp</span>
                                    <CurrencyInput
                                        value={plottingForm.estimated_cost}
                                        onChange={e => setPlottingForm({ ...plottingForm, estimated_cost: e.target.value })}
                                        className="w-full !pl-12 !pr-5 !py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all shadow-sm"
                                        placeholder="Contoh: 1500000"
                                    />
                                </div>
                                {remainingMeetings < (selectedClass.total_meetings || 12) && (
                                    <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 leading-relaxed italic">
                                        * Biaya dihitung pro-rata untuk {remainingMeetings} pertemuan (tidak bayar full).
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Khusus Plotting</label>
                            <textarea
                                rows={2}
                                value={plottingForm.notes}
                                onChange={e => setPlottingForm({ ...plottingForm, notes: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all shadow-sm resize-none"
                                placeholder="Misal: Request minta pengajar"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {selectedClass ? (
                            <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detail Jadwal Kelas</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">Hari Kursus</span>
                                        <div className="flex gap-1">
                                            {selectedClass.schedule_days?.map(day => (
                                                <span key={day} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-black uppercase">{day.substring(0, 3)}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">Periode</span>
                                        <span className="text-[11px] font-black text-slate-700">
                                            {selectedClass.start_session_date ? new Date(selectedClass.start_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '---'}
                                            {' - '}
                                            {selectedClass.end_session_date ? new Date(selectedClass.end_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '---'}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-slate-100 mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-slate-500">Total Pertemuan</span>
                                            <span className="text-[11px] font-black text-slate-900">{selectedClass.total_meetings} Sesi</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-red-500 uppercase tracking-wider">Sisa Pertemuan</span>
                                            <span className="text-[14px] font-black text-red-600">{remainingMeetings} Sesi</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-2 leading-tight italic">
                                            *Dihitung otomatis berdasarkan tanggal rencana masuk ({plottingForm.join_date ? new Date(plottingForm.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '---'})
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[200px] flex-1 flex flex-col items-center justify-center p-8 bg-white/60 border border-dashed border-slate-200 rounded-[2rem] text-center">
                                <Compass size={32} className="text-slate-300 mb-3" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pilih kelas untuk melihat<br />estimasi sisa pertemuan</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSavePlotting}
                    disabled={savingPlotting || !plottingForm.study_class_id}
                    className="w-full mt-8 py-4 bg-slate-900 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none active:scale-[0.98]"
                >
                    {savingPlotting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan Plotting Kelas
                </button>
            </div>

            {/* HASIL PLOTTING KELAS SAAT INI (CARD BAWAH) */}
            {lead?.plotting?.study_class_id && (
                <div className="p-7 bg-white border-2 border-emerald-500/20 rounded-[2.5rem] shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    Hasil Plotting Kelas Terpilih
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                    Rangkuman plotting kelas & jadwal siswa yang tersimpan
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            Plotting Tersimpan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Kelas & Hari */}
                        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kelas Belajar</span>
                            <p className="text-sm font-black text-slate-900 leading-snug">{currentClassName}</p>
                            {currentScheduleDays?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {currentScheduleDays.map(day => (
                                        <span key={day} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-black uppercase">
                                            {day.substring(0, 3)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rencana Masuk & Sesi */}
                        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Rencana Masuk & Sesi</span>
                            <p className="text-sm font-black text-slate-800">
                                {currentJoinDate ? new Date(currentJoinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500">
                                Sisa Pertemuan: <span className="font-black text-red-600">{currentRemaining}</span> / {currentTotal} Sesi
                            </p>
                        </div>

                        {/* Estimasi Biaya */}
                        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estimasi Biaya Paket</span>
                            <p className="text-base font-black text-emerald-600">
                                {currentCost ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentCost) : '---'}
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                Perhitungan pro-rata
                            </span>
                        </div>
                    </div>

                    {/* Catatan Khusus Plotting (jika ada) */}
                    {currentNotes ? (
                        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                            <StickyNote size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Catatan Khusus Plotting:</span>
                                <p className="text-xs font-bold text-amber-950 whitespace-pre-wrap leading-relaxed">
                                    {currentNotes}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-400 italic">
                            Tidak ada catatan khusus plotting.
                        </div>
                    )}
                </div>
            )}

            {/* Connected Parent & Guardians Section */}
            <div className="p-7 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                            <Users size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                Connected Parent / Guardians
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                Kontak orang tua atau wali yang terhubung dengan calon siswa
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {connectedParents.length} Kontak
                    </span>
                </div>

                {connectedParents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {connectedParents.map((parent, idx) => (
                            <div 
                                key={parent.id || idx} 
                                className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 relative hover:border-red-200 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                            {parent.role}
                                        </span>
                                        <p className="text-sm font-black text-slate-900 mt-0.5">{parent.name}</p>
                                    </div>
                                    {parent.is_main_contact && (
                                        <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0">
                                            Main Contact
                                        </span>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                    {/* Phone / WhatsApp */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <Phone size={13} className="text-slate-400 shrink-0" />
                                            {parent.phone ? (
                                                <span className="font-mono tracking-tight text-slate-800">{parent.phone}</span>
                                            ) : (
                                                <span className="text-slate-400 italic text-[11px]">Nomor HP belum diisi</span>
                                            )}
                                        </div>
                                        {parent.phone && (
                                            <a
                                                href={`https://wa.me/${formatPhoneNumber(parent.phone)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                title="Chat via WhatsApp"
                                            >
                                                <MessageSquare size={11} />
                                                WA
                                            </a>
                                        )}
                                    </div>

                                    {/* Email jika ada */}
                                    {parent.email && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <Mail size={13} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{parent.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
                        <p className="text-xs font-bold text-slate-500">Belum ada kontak orang tua / wali yang terhubung.</p>
                        <p className="text-[10px] text-slate-400">Tambahkan melalui edit lead di tab detail jika diperlukan.</p>
                    </div>
                )}
            </div>

            {/* Residential Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                    label="Residential Access"
                    value={lead?.address ? `${lead.address}, ${lead.city || ''}, ${lead.province || ''}` : (lead?.city ? `${lead.city}, ${lead.province || ''}` : '---')}
                    icon={MapPin}
                />
            </div>
        </div>
    );
}
