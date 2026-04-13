import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
    X, User, Phone, Mail, Building2, MapPin, 
    Calendar, CheckCircle2, XCircle, Info,
    Users, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function RegistrationPreviewModal({ 
    isOpen, 
    onClose, 
    item, 
    type = 'new', // 'new' or 'updates'
    onApprove, 
    onReject,
    leadSources = [],
    processing = false 
}) {
    if (!item) return null;

    // For updates, the data is inside item.pending_updates
    const displayData = type === 'new' ? item : (item.pending_updates || {});

    const SectionTitle = ({ icon: Icon, title }) => (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Icon size={16} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-red-600 decoration-2 underline-offset-4">
                {title}
            </h3>
        </div>
    );

    const DataField = ({ label, value, icon: Icon }) => (
        <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</span>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                {Icon && <Icon size={14} className="text-slate-300 shrink-0" />}
                <span className="text-sm font-bold text-slate-900 truncate">
                    {value || '-'}
                </span>
            </div>
        </div>
    );

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-[2.5rem] bg-white p-0 text-left align-middle shadow-2xl transition-all border border-slate-100">
                                {/* Header */}
                                <div className="relative p-8 border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-600 border border-slate-100">
                                                {type === 'new' ? <Info size={28} /> : <ShieldCheck size={28} />}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                                    {type === 'new' ? 'Preview Pendaftaran' : 'Review Pembaruan Profil'}
                                                </h2>
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                                    ID: {item.id} &bull; {type === 'new' ? 'Potential Lead' : 'Existing Lead'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-white hover:text-red-600 transition-all border border-transparent hover:border-slate-100"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-8 md:p-12 overflow-y-auto max-h-[70vh]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        {/* Left Column: Personal & Geography */}
                                        <div className="space-y-12">
                                            {/* Identitas */}
                                            <div>
                                                <SectionTitle icon={User} title="Identitas Pelajar" />
                                                <div className="grid grid-cols-1 gap-4">
                                                    <DataField label="Nama Lengkap" value={displayData.name} icon={User} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DataField label="WhatsApp" value={displayData.phone} icon={Phone} />
                                                        <DataField label="Gender" value={displayData.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                                    </div>
                                                    <DataField label="Email" value={displayData.email} icon={Mail} />
                                                    <DataField label="Tgl Lahir" value={displayData.birth_date} icon={Calendar} />
                                                </div>
                                            </div>

                                            {/* Geography */}
                                            <div>
                                                <SectionTitle icon={MapPin} title="Domisili" />
                                                <div className="grid grid-cols-1 gap-4">
                                                    <DataField label="Alamat" value={displayData.address} icon={MapPin} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DataField label="Kota" value={displayData.city} />
                                                        <DataField label="Provinsi" value={displayData.province} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Academic & Guardians */}
                                        <div className="space-y-12">
                                            {/* Akademik */}
                                            <div>
                                                <SectionTitle icon={Building2} title="Data Akademik" />
                                                <div className="grid grid-cols-1 gap-4">
                                                    <DataField label="Cabang IELC" value={item.branch?.name} icon={Building2} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DataField label="Sekolah" value={displayData.school} icon={Building2} />
                                                        <DataField label="Kelas" value={displayData.grade} icon={Calendar} />
                                                    </div>
                                                    {type === 'new' ? (
                                                        <DataField label="Sumber Info" value={item.lead_source?.name} icon={ArrowRight} />
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Sumber Info (Pembaruan)</span>
                                                            <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-slate-400 font-bold uppercase">Original</span>
                                                                    <span className="text-slate-600 font-black">{item.lead_source?.name || '-'}</span>
                                                                </div>
                                                                <div className="h-px bg-slate-200/50 w-full" />
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-red-500 font-bold uppercase tracking-tighter italic">Proposed</span>
                                                                    <span className="text-slate-900 font-black">
                                                                        {leadSources.find(s => s.value === displayData.lead_source_id)?.label || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Guardians (Only for New Registration or if available) */}
                                            {type === 'new' && item.guardian_data && (
                                                <div>
                                                    <SectionTitle icon={Users} title="Data Orang Tua / Wali" />
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {item.guardian_data.father_name && (
                                                            <div className="flex flex-col gap-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ayah / Wali</span>
                                                                <span className="text-sm font-bold text-slate-900">{item.guardian_data.father_name}</span>
                                                                <span className="text-[10px] font-medium text-slate-400">{item.guardian_data.father_phone}</span>
                                                            </div>
                                                        )}
                                                        {item.guardian_data.mother_name && (
                                                            <div className="flex flex-col gap-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Ibu</span>
                                                                <span className="text-sm font-bold text-slate-900">{item.guardian_data.mother_name}</span>
                                                                <span className="text-[10px] font-medium text-slate-400">{item.guardian_data.mother_phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Note for Updates */}
                                            {type === 'updates' && (
                                                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                                    <div className="flex gap-4">
                                                        <Info className="text-amber-600 shrink-0" size={20} />
                                                        <div>
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 mb-1">Catatan Pembaruan</h4>
                                                            <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                                                                Data di atas adalah usulan data baru dari Lead. Menyetujui akan memperbarui profil lead secara otomatis.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4 mt-auto">
                                    <button
                                        onClick={() => onReject(item.id)}
                                        disabled={processing}
                                        className="px-8 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-red-600 border border-slate-200 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        <XCircle size={18} />
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => onApprove(item.id)}
                                        disabled={processing}
                                        className={`px-12 py-4 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 shadow-xl ${type === 'updates' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-slate-900 hover:bg-red-600 shadow-slate-200 hover:shadow-red-200'} disabled:opacity-50`}
                                    >
                                        <CheckCircle2 size={18} />
                                        {type === 'new' ? 'ACC & Terbitkan Lead' : 'ACC & Perbarui Profil'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
