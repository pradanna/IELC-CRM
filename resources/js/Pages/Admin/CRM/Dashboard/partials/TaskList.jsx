import React, { Fragment } from 'react';
import { Eye, Bell, MoreVertical, ChevronDown, Check } from 'lucide-react';
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
                                            task.urgency === 'Overdue' 
                                            ? 'bg-red-50 text-red-600 border-red-100' 
                                            : (task.urgency === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100')
                                        }`}>
                                            {task.urgency}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => onView(task.lead_id)}
                                            className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100"
                                        >
                                            <Eye size={18} />
                                        </button>
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
