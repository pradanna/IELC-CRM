import React, { Fragment } from 'react';
import { Eye, Bell, MoreVertical, ChevronDown, Check, PhoneCall, MessageSquare } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

export default function TaskList({ tasks, phases = [], getPhaseStyle, onView, onUpdatePhase }) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;
    
    // Calculate pagination
    const totalPages = Math.ceil(tasks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    /**
     * Normalizes a collection that might be a raw array or a wrapped resource object.
     */
    const normalizeCollection = (collection) => {
        if (Array.isArray(collection)) return collection;
        if (collection && Array.isArray(collection.data)) return collection.data;
        return [];
    };

    const normalizedPhases = normalizeCollection(phases);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden min-h-[580px]">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Immediate Tasks</h2>
                    <span className="bg-red-50 text-red-600 text-xs font-black px-2 py-0.5 rounded-full ring-1 ring-red-100">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <ChevronDown className="rotate-90" size={14} />
                    </button>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentPage} / {totalPages || 1}</span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded-lg border border-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <ChevronDown className="-rotate-90" size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="pb-4">Lead</th>
                            <th className="pb-4">Pipeline Status</th>
                            <th className="pb-4">Urgency</th>
                            <th className="pb-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {currentTasks.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Bell size={40} className="text-gray-100" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">No active tasks</p>
                                    </div>
                                </td>
                            </tr>
                        ) : currentTasks.map((task) => {
                            const style = getPhaseStyle(task.lead_phase_code);
                            return (
                                <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[120px]">{task.lead_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                                                    FUP {task.fup_count}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider bg-white border-slate-100 text-slate-500 shadow-sm">
                                            <div className={`w-2 h-2 rounded-full ${style.color.replace('text-', 'bg-')}`} />
                                            <span className="truncate max-w-[80px]">{task.lead_phase_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            task.urgency_level === 'danger' 
                                            ? 'bg-red-50 text-red-600 border-red-100' 
                                            : (task.urgency_level === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100')
                                        }`}>
                                            {task.urgency_label}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button 
                                                onClick={() => {
                                                    document.dispatchEvent(new CustomEvent('openRecordFollowUpModal', { 
                                                        detail: { lead: { id: task.lead_id, name: task.lead_name, follow_up_count: task.fup_count } } 
                                                    }));
                                                }}
                                                title="Catat Follow-Up (Phone/SMS/Lainnya)"
                                                className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm shadow-amber-100"
                                            >
                                                <PhoneCall size={18} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    document.dispatchEvent(new CustomEvent('openSendWhatsappModal', { 
                                                        detail: { lead: { id: task.lead_id, name: task.lead_name, phone: task.phone, lead_phase_id: task.lead_phase_id } } 
                                                    }));
                                                }}
                                                title="Kirim WhatsApp (Baileys / Template)"
                                                className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-100"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button 
                                                onClick={() => onView(task.lead_id)}
                                                title="Lihat Detail Lead"
                                                className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
