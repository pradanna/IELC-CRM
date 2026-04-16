import React, { useState } from 'react';
import { 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Building2, 
    GraduationCap,
    Loader2,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import axios from 'axios';

export default function LeadPendingUpdatesTab({ lead, onRefresh }) {
    const [processing, setProcessing] = useState(false);

    if (!lead?.pending_updates) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No Pending Updates</h3>
                <p className="text-xs font-bold text-slate-400 max-w-xs uppercase tracking-wider">
                    All profile data is currently up to date and verified.
                </p>
            </div>
        );
    }

    const updates = lead.pending_updates;

    const handleAction = async (action) => {
        if (!confirm(`Are you sure you want to ${action} these profile updates?`)) return;

        setProcessing(true);
        try {
            const url = action === 'approve' 
                ? route('admin.crm.leads.approve-updates', lead.id)
                : route('admin.crm.leads.reject-updates', lead.id);
            
            await axios.post(url);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(`Error ${action}ing updates:`, error);
            alert(`Failed to ${action} updates.`);
        } finally {
            setProcessing(false);
        }
    };

    const CompareItem = ({ label, oldVal, newVal, icon: Icon }) => {
        const isDifferent = oldVal !== newVal && newVal !== undefined && newVal !== null && newVal !== '';
        
        if (!newVal && !isDifferent) return null;

        return (
            <div className={`p-5 rounded-2xl border transition-all ${isDifferent ? 'bg-amber-50/50 border-amber-100 ring-1 ring-amber-200/50' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon size={14} className={isDifferent ? 'text-amber-600' : 'text-slate-400'} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                    </div>
                    {isDifferent && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-widest">Changed</span>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Current</p>
                        <p className="text-sm font-bold text-slate-400 line-through truncate">{oldVal || '---'}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[10px] text-amber-600 font-black uppercase mb-1">New Value</p>
                        <p className="text-sm font-black text-slate-900 truncate">{newVal || '---'}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Warning Header */}
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-red-900 leading-none mb-1">Verification Required</h3>
                    <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">Lead has submitted profile updates via magic link.</p>
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 gap-4">
                <CompareItem label="Full Name" oldVal={lead.name} newVal={updates.name} icon={User} />
                <CompareItem label="Nickname" oldVal={lead.nickname} newVal={updates.nickname} icon={User} />
                <CompareItem label="Phone Number" oldVal={lead.phone} newVal={updates.phone} icon={Phone} />
                <CompareItem label="Email" oldVal={lead.email} newVal={updates.email} icon={Mail} />
                <CompareItem label="School" oldVal={lead.school} newVal={updates.school} icon={Building2} />
                <CompareItem label="Grade/Level" oldVal={lead.grade} newVal={updates.grade} icon={GraduationCap} />
                <CompareItem label="Address" oldVal={lead.address} newVal={updates.address} icon={MapPin} />
                <CompareItem label="City" oldVal={lead.city} newVal={updates.city} icon={MapPin} />
                <CompareItem label="Postal Code" oldVal={lead.postal_code} newVal={updates.postal_code} icon={MapPin} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
                <button
                    onClick={() => handleAction('reject')}
                    disabled={processing}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    <XCircle size={14} />
                    Reject Updates
                </button>
                <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-[2] py-4 bg-slate-900 text-white hover:bg-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve & Apply Changes
                </button>
            </div>
        </div>
    );
}
