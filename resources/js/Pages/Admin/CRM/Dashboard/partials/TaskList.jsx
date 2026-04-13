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
                                        <Menu as="div" className="relative inline-block text-left">
                                            <Menu.Button className="outline-none focus:outline-none flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all hover:shadow-sm bg-white border-slate-200 text-slate-600 hover:border-slate-300">
                                                <div className={`w-2 h-2 rounded-full ${style.color.replace('text-', 'bg-')}`} />
                                                <span className="truncate max-w-[60px]">{task.lead_phase_name}</span>
                                                <ChevronDown size={10} className="opacity-40" />
                                            </Menu.Button>
                                            
                                            {/* ... rest of menu same ... */}
                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left divide-y divide-slate-100 rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-slate-100">
                                                    <div className="py-1">
                                                        {phases.map((phase) => {
                                                            const isActive = task.lead_phase_id === phase.id;
                                                            const pStyle = getPhaseStyle(phase.code);
                                                            return (
                                                                <Menu.Item key={phase.id}>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => onUpdatePhase(task.lead_id, phase.id)}
                                                                            className={`
                                                                                ${active ? 'bg-slate-50' : ''} 
                                                                                group flex w-full items-center justify-between px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors
                                                                            `}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${pStyle.color.replace('text-', 'bg-')}`} />
                                                                                <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
                                                                                    {phase.name}
                                                                                </span>
                                                                            </div>
                                                                            {isActive && <Check size={12} className="text-emerald-500" />}
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            );
                                                        })}
                                                    </div>
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
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
