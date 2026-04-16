import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Bell, Trash2, Clock, Save, ShieldCheck } from 'lucide-react';

export default function Index({ settings }) {
    const { data, setData, put, processing, isDirty } = useForm({
        followUpTriggerDays: Number(settings.followUpTriggerDays) || 4,
        autoCleanNewLeadsDays: Number(settings.autoCleanNewLeadsDays) || 7,
        autoCleanProspectsDays: Number(settings.autoCleanProspectsDays) || 30,
        expiringThresholdDays: Number(settings.expiringThresholdDays) || 14,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.crm.settings.update'));
    };

    const SettingRow = ({ icon: Icon, title, description, value, onChange, min, max, unit = "Days" }) => (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm gap-6 transition-all hover:shadow-md group">
            <div className="flex gap-5 items-start max-w-xl">
                <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <Icon size={22} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">{title}</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{description}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <input 
                    type="number" 
                    min={min} 
                    max={max}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 border-0 bg-transparent text-lg font-black text-slate-900 focus:ring-0 text-center"
                />
                <span className="pr-4 text-[10px] font-black uppercase text-slate-400 tracking-wider border-l border-slate-200 pl-3">{unit}</span>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="CRM Automation Settings" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                <form onSubmit={handleSubmit} className="space-y-12 max-w-5xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg ring-4 ring-slate-100">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">CRM Engine Settings</h2>
                                    <p className="text-sm text-slate-400 font-bold">Configure automation thresholds and notification triggers.</p>
                                </div>
                            </div>
                            
                            <button 
                                disabled={processing || !isDirty}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                                    isDirty 
                                    ? "bg-slate-900 text-white shadow-slate-200 hover:bg-black" 
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4">
                                <Bell size={18} className="text-slate-900" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notification Thresholds</h3>
                            </div>
                            
                            <SettingRow 
                                icon={Clock}
                                title="Follow-up Trigger"
                                description="Berapa hari lead harus didiamkan sebelum muncul sebagai Task di Dashboard frontdesk. Lead yang tidak disentuh selama periode ini akan dianggap 'Pending Task'."
                                value={data.followUpTriggerDays}
                                onChange={(val) => setData('followUpTriggerDays', val)}
                                min={1}
                                max={30}
                            />

                            <SettingRow 
                                icon={Bell}
                                title="Study Period Expiry Threshold"
                                description="Siswa akan muncul di daftar 'Expiring Study Periods' jika sisa periode belajarnya kurang dari atau sama dengan jumlah hari yang ditentukan di sini."
                                value={data.expiringThresholdDays}
                                onChange={(val) => setData('expiringThresholdDays', val)}
                                min={1}
                                max={30}
                            />
                        </div>

                        {/* Cleanup Section */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 border-l-4 border-red-500 pl-4">
                                <Trash2 size={18} className="text-red-500" />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Auto Component (Lead Cleanup)</h3>
                            </div>

                            <SettingRow 
                                icon={ShieldCheck}
                                title="New Lead Maximum Age"
                                description="Maksimal umur (hari) lead baru yang belum diproses. Jika melewati batas ini tanpa interaksi, lead akan dianggap tidak valid dan dipindah ke fase 'Lost' secara otomatis."
                                value={data.autoCleanNewLeadsDays}
                                onChange={(val) => setData('autoCleanNewLeadsDays', val)}
                                min={1}
                                max={90}
                            />

                            <SettingRow 
                                icon={ShieldCheck}
                                title="Prospect Silence Limit"
                                description="Maksimal hari lead dalam fase Prospect tanpa ada aktivitas baru. Jika melewati batas ini, lead akan otomatis masuk ke fase 'Cold Leads' atau 'Lost'."
                                value={data.autoCleanProspectsDays}
                                onChange={(val) => setData('autoCleanProspectsDays', val)}
                                min={1}
                                max={180}
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-5">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h5 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Penting: Perubahan Scheduler</h5>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                    Pengaturan di atas akan mempengaruhi logika sistem yang berjalan di background setiap pukul 00:00. 
                                    Pastikan angka yang diinput sudah sesuai dengan Standar Operasional Prosedur (SOP) cabang.
                                </p>
                            </div>
                        </div>
                    </form>
            </div>
        </AuthenticatedLayout>
    );
}
