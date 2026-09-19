import React, { useState } from 'react';
import axios from 'axios';
import { GraduationCap, Calendar, FileText, Plus, X, Loader2, BookOpen, AlertCircle, Save, Send } from 'lucide-react';

export default function EnrollmentStage({ lead, availableClasses = [] }) {
    const rawEnrollments = lead?.enrollments || [];
    // Only show active, completed, or stopped enrollments (hide pending_invoice & pending_payment)
    const enrollments = rawEnrollments.filter(e => !['pending_invoice', 'pending_payment'].includes(e.status));

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        study_class_id: '',
        join_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const selectedClass = availableClasses.find(c => c.id === form.study_class_id);

    const handleOpenForm = () => {
        setForm({
            study_class_id: '',
            join_date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setError(null);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.study_class_id) {
            setError('Pilih kelas terlebih dahulu.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await axios.post(route('admin.crm.leads.add-enrollment', lead.id), form);
            setShowForm(false);
            window.dispatchEvent(new CustomEvent('lead-enrollment-added', { detail: { leadId: lead.id } }));
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Gagal mengirim pengajuan kelas.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <GraduationCap size={14} className="text-emerald-500" /> Enrolled Classes
                    {enrollments.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            {enrollments.length} Kelas
                        </span>
                    )}
                </h5>
                {!showForm && (
                    <button
                        onClick={handleOpenForm}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Plus size={11} /> Pengajuan Kelas Baru
                    </button>
                )}
            </div>

            {/* Enrollment List */}
            {enrollments.length > 0 ? (
                <div className="space-y-2">
                    {enrollments.map(enrollment => (
                        <div key={enrollment.id} className={`flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow ${
                            enrollment.status === 'pending_invoice'
                                ? 'border-sky-200 bg-sky-50/20'
                                : enrollment.status === 'pending_payment'
                                ? 'border-amber-200 bg-amber-50/20'
                                : 'border-emerald-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                                    enrollment.status === 'pending_invoice'
                                        ? 'bg-sky-50 text-sky-600'
                                        : enrollment.status === 'pending_payment'
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                    <GraduationCap size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 tracking-tight">
                                        {enrollment.study_class?.name || 'Unknown Class'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> Joined: {enrollment.formatted_joined_at}
                                        </span>
                                        {enrollment.formatted_end_date && (
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} /> Selesai: {enrollment.formatted_end_date}
                                            </span>
                                        )}
                                        {enrollment.invoice_number && (
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <FileText size={10} /> {enrollment.invoice_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                enrollment.status === 'pending_invoice'
                                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                                    : enrollment.status === 'pending_payment'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : enrollment.status === 'completed'
                                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                                    : enrollment.status === 'stopped'
                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {enrollment.status === 'pending_invoice'
                                    ? 'Pending Invoice (Finance)'
                                    : enrollment.status === 'pending_payment'
                                    ? 'Pending Payment'
                                    : (enrollment.status || 'Active')}
                            </span>
                        </div>
                    ))}
                </div>
            ) : !showForm && lead?.enrolled_at ? (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center">
                    <GraduationCap size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-black text-emerald-700">Enrolled</p>
                    <p className="text-[10px] font-bold text-emerald-500 mt-1">
                        Officially closed on {lead.formatted_enrolled_at}
                    </p>
                </div>
            ) : !showForm && (
                <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-[10px] text-slate-400 text-center font-bold">
                    Belum ada enrollment tercatat.
                </div>
            )}

            {/* ===== Inline Form Pengajuan Kelas ===== */}
            {showForm && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-inner space-y-5 animate-in slide-in-from-top-2 duration-200">

                    {/* Form Header */}
                    <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <BookOpen size={13} className="text-emerald-500" /> Form Pengajuan Kelas Baru (CS)
                        </h5>
                        <button
                            onClick={() => !saving && setShowForm(false)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold">
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left column */}
                        <div className="space-y-4">
                            {/* Pilih Kelas */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Pilih Kelas *
                                </label>
                                <select
                                    value={form.study_class_id}
                                    onChange={e => setForm(f => ({ ...f, study_class_id: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 py-3 px-4 shadow-sm transition-all"
                                >
                                    <option value="">-- Pilih Kelas Tambahan --</option>
                                    {availableClasses.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                            {cls.schedule_days?.length ? ` (${cls.schedule_days.map(d => d.substring(0, 3)).join(', ')})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tanggal Masuk */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Tanggal Rencana Masuk
                                </label>
                                <input
                                    type="date"
                                    value={form.join_date}
                                    onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 py-3 px-4 shadow-sm transition-all"
                                />
                            </div>

                            {/* Catatan */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Catatan untuk Finance (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 py-3 px-4 shadow-sm transition-all resize-none"
                                    placeholder="Contoh: Diskon khusus dari Principal / Request jam privat"
                                />
                            </div>
                        </div>

                        {/* Right column — class detail preview */}
                        <div className="flex flex-col">
                            {selectedClass ? (
                                <div className="p-5 bg-white border border-emerald-100 rounded-[2rem] shadow-sm animate-in fade-in zoom-in-95 duration-300 h-full">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detail Kelas Terpilih</p>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{selectedClass.name}</p>
                                        </div>
                                        {selectedClass.schedule_days?.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">Jadwal</span>
                                                <div className="flex gap-1">
                                                    {selectedClass.schedule_days.map(day => (
                                                        <span key={day} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase">
                                                            {day.substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedClass.category && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">Kategori</span>
                                                <span className="text-[10px] font-black text-slate-700 capitalize">{selectedClass.category}</span>
                                            </div>
                                        )}
                                        {selectedClass.start_session_date && selectedClass.end_session_date && (
                                            <div className="pt-3 border-t border-dashed border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500">Periode</span>
                                                    <span className="text-[10px] font-black text-slate-700">
                                                        {new Date(selectedClass.start_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                        {' – '}
                                                        {new Date(selectedClass.end_session_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="min-h-[160px] flex-1 flex flex-col items-center justify-center p-6 bg-white/60 border border-dashed border-slate-200 rounded-[2rem] text-center">
                                    <BookOpen size={28} className="text-slate-300 mb-2" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Pilih kelas untuk<br />melihat detailnya
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => !saving && setShowForm(false)}
                            disabled={saving}
                            className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !form.study_class_id}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            {saving ? 'Mengirim...' : 'Kirim Pengajuan ke Finance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
