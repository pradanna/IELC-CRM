import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from '../partials/CrmLayout';
import { Head } from '@inertiajs/react';
import { 
    CheckCircle2, XCircle, Clock, User, Phone, 
    Building2, MapPin, Inbox as InboxIcon
} from 'lucide-react';
import { useRegistrationInbox } from './hooks/useRegistrationInbox';

export default function Inbox({ auth, registrations, update_requests = [] }) {
    const {
        activeTab,
        setActiveTab,
        currentItems,
        processing,
        handleApprove,
        handleReject,
        handleApproveUpdate,
        handleRejectUpdate
    } = useRegistrationInbox(registrations, update_requests);

    return (
        <AuthenticatedLayout>
            <Head title="Registration Inbox" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout>
                    <div className="space-y-12">
                        {/* Sub-Tabs for Inbox */}
                        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit">
                            <button 
                                onClick={() => setActiveTab('new')}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'new' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <InboxIcon size={16} />
                                Pendaftaran Baru
                                {registrations.length > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px]">{registrations.length}</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('updates')}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'updates' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <InboxIcon size={16} />
                                Pembaruan Profil
                                {update_requests.length > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px]">{update_requests.length}</span>}
                            </button>
                        </div>

                        {currentItems.length === 0 ? (
                            <div className="bg-white rounded-[40px] p-20 border border-slate-100 shadow-2xl shadow-slate-100/50 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                                    {activeTab === 'new' ? 'Inbox Kosong!' : 'Tidak Ada Pembaruan!'}
                                </h2>
                                <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">
                                    {activeTab === 'new' 
                                        ? 'Semua pendaftaran mandiri telah diproses. Tidak ada antrean saat ini.'
                                        : 'Tidak ada lead yang sedang mengajukan pembaruan data profil saat ini.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {currentItems.map((reg) => (
                                    <div 
                                        key={reg.id} 
                                        className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-100/50 hover:border-red-200 transition-all duration-300"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            {/* Lead Info Central */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                {/* Identity */}
                                                <div className="flex gap-5">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${activeTab === 'updates' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600'}`}>
                                                        {activeTab === 'updates' ? <InboxIcon size={32} /> : <User size={32} />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                            {activeTab === 'updates' ? 'Lead Enrichment' : 'Pendaftar'}
                                                        </p>
                                                        <h3 className="text-xl font-black text-slate-900 leading-none truncate">{reg.name}</h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-md border border-red-100">
                                                                Branch {reg.branch.name}
                                                            </span>
                                                            {activeTab === 'updates' && (
                                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-md border border-amber-100">
                                                                    Data Profile Update
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact & Geography */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                            <Phone size={14} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-600">{reg.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                            <MapPin size={14} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-400 truncate">{reg.city || reg.province || 'No Location'}</span>
                                                    </div>
                                                </div>

                                                {/* Education */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                            <Building2 size={14} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-600">{reg.school || 'Private'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                            <Clock size={14} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-400">Kelas {reg.grade || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Area */}
                                            <div className="flex items-center gap-3 shrink-0 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                                                <button
                                                    onClick={() => activeTab === 'new' ? handleReject(reg.id) : handleRejectUpdate(reg.id)}
                                                    disabled={processing}
                                                    className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 hover:text-red-600 transition-all flex items-center gap-2"
                                                >
                                                    <XCircle size={16} />
                                                    Tolak
                                                </button>
                                                <button
                                                    onClick={() => activeTab === 'new' ? handleApprove(reg.id) : handleApproveUpdate(reg.id)}
                                                    disabled={processing}
                                                    className={`px-10 py-4 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${activeTab === 'updates' ? 'bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-100' : 'bg-slate-900 hover:bg-red-600 shadow-xl shadow-slate-200 hover:shadow-red-200'}`}
                                                >
                                                    <CheckCircle2 size={16} />
                                                    {activeTab === 'new' ? 'ACC & Terbitkan Lead' : 'ACC & Perbarui Profil'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CrmLayout>
            </div>
        </AuthenticatedLayout>
    );
}
