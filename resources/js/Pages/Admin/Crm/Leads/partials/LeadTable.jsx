import { Phone, User, Building2, Calendar, MapPin, Eye, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';

export default function LeadTable({ leads, onView, onEdit, onDelete, canDelete = false }) {
    const { getPhaseStyle } = useLeadPhaseStyle();

    return (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Details</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source / Type</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Phase</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {leads.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                            <Search size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-900">No leads found</p>
                                            <p className="text-xs text-slate-400 font-medium">Try adjusting your filters or create a new lead.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.data.map((lead) => (
                                <tr 
                                    key={lead.id} 
                                    onClick={() => onView(lead.id)}
                                    className="group hover:bg-slate-50/50 transition-all duration-300 cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors duration-300">
                                                <User size={18} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">{lead.name}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span>{lead.lead_number}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {lead.formatted_at}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-slate-50 w-fit px-2 py-1 rounded-lg border border-slate-100">
                                                <Phone size={12} className="text-slate-400" />
                                                {lead.phone}
                                            </div>
                                            {lead.city && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                                    <MapPin size={10} />
                                                    {lead.city}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                <Building2 size={12} className="text-slate-300" />
                                                {lead.branch?.name}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                                By {lead.owner?.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-slate-200 w-fit">
                                                {lead.lead_source?.name || 'Organic'}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide ml-1">
                                                {lead.lead_type?.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-2">
                                            {(() => {
                                                const style = getPhaseStyle(lead.lead_phase?.code);
                                                return (
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] w-fit ${style.bg} ${style.color} ${style.border}`}>
                                                        <style.icon size={10} className={style.color} />
                                                        {lead.lead_phase?.name}
                                                    </div>
                                                );
                                            })()}
                                            {lead.lead_phase?.code === 'enrollment' && lead.formatted_enrolled_at && (
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                    <Calendar size={10} />
                                                    {lead.formatted_enrolled_at}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            {/* Detail */}
                                            <button 
                                                onClick={() => onView(lead.id)}
                                                title="Lihat Detail"
                                                className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all duration-300"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {/* Edit */}
                                            <button 
                                                onClick={() => onEdit && onEdit(lead.id)}
                                                title="Edit Lead"
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-300"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            {/* Delete - superadmin only */}
                                            {canDelete && (
                                                <button 
                                                    onClick={() => onDelete && onDelete(lead.id)}
                                                    title="Hapus Lead"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Minimalist Pagination Bar */}
            <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Showing <span className="text-slate-900 font-black">{(leads.meta?.from || leads.from) || 0}</span> to <span className="text-slate-900 font-black">{(leads.meta?.to || leads.to) || 0}</span> of <span className="text-slate-900 font-black">{leads.meta?.total || leads.total}</span> leads
                </div>
                <div className="flex items-center gap-1.5">
                    {(leads.meta?.links || leads.links || []).map((link, index) => {
                        const isPrev = link.label.includes('Previous');
                        const isNext = link.label.includes('Next');
                        
                        return link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                preserveState
                                preserveScroll
                                className={`h-9 min-w-[2.25rem] px-2 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                                    link.active 
                                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-red-500 hover:text-red-600'
                                }`}
                            >
                                {isPrev ? <ChevronLeft size={14} /> : isNext ? <ChevronRight size={14} /> : link.label}
                            </Link>
                        ) : (
                            <span
                                key={index}
                                className="h-9 min-w-[2.25rem] px-2 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-xl border border-transparent text-slate-300 cursor-not-allowed bg-slate-50/50"
                            >
                                {isPrev ? <ChevronLeft size={14} /> : isNext ? <ChevronRight size={14} /> : link.label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
