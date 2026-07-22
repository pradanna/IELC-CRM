import React from 'react';
import { GraduationCap, Compass, Loader2, Save, MapPin, Zap, Users } from 'lucide-react';
import DatePicker from '@/Components/form/DatePicker';
import { InfoItem } from '../../../components/DrawerUI';

export default function PreEnrollmentStage({
    lead,
    plottingForm,
    setPlottingForm,
    availableClasses,
    selectedClass,
    remainingMeetings,
    savingPlotting,
    handleSavePlotting,
    openWaWeb
}) {
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
                                    <input
                                        type="number"
                                        value={plottingForm.estimated_cost}
                                        onChange={e => setPlottingForm({ ...plottingForm, estimated_cost: e.target.value })}
                                        className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all shadow-sm"
                                        placeholder="Contoh: 1500000"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</div>
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
                                            {new Date(selectedClass.start_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                            -
                                            {new Date(selectedClass.end_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
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
                                            *Dihitung otomatis berdasarkan tanggal rencana masuk ({new Date(plottingForm.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
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
                    onClick={() => handleSavePlotting(openWaWeb)}
                    disabled={savingPlotting || !plottingForm.study_class_id}
                    className="w-full mt-8 py-4 bg-slate-900 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none active:scale-[0.98]"
                >
                    {savingPlotting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan Plotting Kelas
                </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <InfoItem
                    label="Residential Access"
                    value={lead?.address ? `${lead.city}, ${lead.province}` : '---'}
                    icon={MapPin}
                />

            </div>

            {lead?.guardians?.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                    <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Connected Guardians</h6>
                    <div className="flex flex-wrap gap-2">
                        {lead.guardians.map((g, i) => (
                            <div key={i} className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                <Users size={12} /> {g.name} ({g.relationship})
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
