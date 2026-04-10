import React, { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
    ChevronDown, 
    Check, 
    Globe, 
    Zap, 
    MessageSquare, 
    GraduationCap, 
    FileText,
    Target,
    Clock,
    Trophy,
    UserPlus,
    Compass,
    History,
    FileCheck,
    CreditCard,
    Snowflake,
    LogOut,
    MapPin,
    Users,
    Loader2,
    Calendar,
    Award,
    StickyNote,
    Save,
    MessageCircle
} from 'lucide-react';
import { SectionHeader, InfoItem } from '../components/DrawerUI';
import LeadPlacementTestTab from './LeadPlacementTestTab';
import DatePicker from '@/Components/form/DatePicker';
import useLeadPlotting from './hooks/useLeadPlotting';

const PhaseSection = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    codes, 
    children, 
    isStageActive,
    getSectionStyle,
    chatTemplates,
    lead,
    phases,
    handleSendTemplate,
    sendingTemplateId
}) => {
    const active = isStageActive(codes);
    
    const phaseTemplates = chatTemplates.filter(t => {
        // 1. Phase Logic: Match specific phase codes or show global templates in active section only
        const matchesPhase = t.lead_phases?.some(lp => codes.includes(lp.code));
        const isPhaseGlobal = !t.lead_phases?.length;
        const phasePass = matchesPhase || (isPhaseGlobal && active);
        
        if (!phasePass) return false;

        // 2. Type Logic: Filter by Lead Type if it's set
        const leadTypeId = lead?.lead_type_id || lead?.lead_type?.id;
        
        // If lead type is not yet selected, show all templates that passed the phase filter
        if (!leadTypeId) return true;

        const matchesType = t.lead_types?.some(lt => lt.id === leadTypeId);
        const isTypeGlobal = !t.lead_types?.length;

        // Show if template matches lead type or if template is type-global
        return matchesType || isTypeGlobal;
    });

    const phaseLogs = (lead?.chat_logs || []).filter(log => {
        const logPhase = phases.find(p => p.id === log.lead_phase_id);
        return codes.includes(logPhase?.code);
    });

    return (
        <div className={`relative p-8 rounded-[2.5rem] border ${getSectionStyle(codes)} transition-all duration-500`}>
            {active && (
                <div className="absolute -top-3 right-8 px-5 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-red-500/40 animate-pulse transition-transform hover:scale-105">
                    Current Stage
                </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${active ? 'bg-red-50 text-red-600' : 'bg-white text-slate-400'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className={`text-md font-black tracking-tight leading-none ${active ? 'text-slate-900' : 'text-slate-500'}`}>
                        {title}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className={active ? '' : 'pointer-events-none'}>
                {children}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                {active && phaseTemplates.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={10} className="text-amber-500" /> Suggested Messages
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {phaseTemplates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSendTemplate(t)}
                                    disabled={sendingTemplateId !== null}
                                    className={`px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
                                        sendingTemplateId === t.id ? 'border-amber-500 text-amber-600' : 'hover:border-red-500 hover:text-red-600'
                                    } ${sendingTemplateId !== null && sendingTemplateId !== t.id ? 'opacity-50' : ''}`}
                                >
                                    {sendingTemplateId === t.id && <Loader2 size={10} className="animate-spin" />}
                                    {sendingTemplateId === t.id ? 'Sending...' : t.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {phaseLogs.length > 0 && (
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={10} className="text-slate-500" /> Phase History
                        </h5>
                        <div className="space-y-3">
                            {phaseLogs.map(log => (
                                <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl relative group transition-all hover:border-red-100 hover:shadow-md hover:shadow-red-500/5 cursor-default">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:bg-red-50 transition-colors">
                                                <MessageSquare size={12} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{log.template_title}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400">{log.formatted_date}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all pr-4">
                                        {log.message}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[8px] font-black">
                                                {log.sender_name?.charAt(0)}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sent by {log.sender_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-600 uppercase">Delivered</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function LeadPipelineTab({ 
    lead, 
    loading, 
    getPhaseStyle, 
    phases = [], 
    onUpdatePhase,
    availableExams = [],
    availableClasses = [],
    chatTemplates = [],
    onRefresh
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentPhaseCode = lead?.lead_phase?.code;
    const style = getPhaseStyle(currentPhaseCode);

    // Helpers to determine phase focus
    const isStageActive = (codes) => codes.includes(currentPhaseCode);
    const getSectionStyle = (codes) => isStageActive(codes) 
        ? "border-red-200 bg-red-50/30 ring-8 ring-red-50/50 shadow-2xl shadow-red-500/10 pattern-batik" 
        : "border-slate-100 bg-slate-50/50 grayscale-[0.3] opacity-80 hover:opacity-100 transition-all duration-300";

    const [sendingTemplateId, setSendingTemplateId] = useState(null);
    const [savingConsultation, setSavingConsultation] = useState(false);
    const [consultationForm, setConsultationForm] = useState({
        consultation_date: new Date().toISOString().split('T')[0],
        notes: '',
        recommended_level: '',
        follow_up_note: ''
    });

    const handleSendInvoiceWA = async (invoice) => {
        const message = `Halo *${lead.nickname || lead.name}*,\n\n` +
                        `Berikut adalah link invoice pendaftaran Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                        `${invoice.download_url}\n\n` +
                        `Silakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        
        if (window.confirm(`Kirim invoice ${invoice.invoice_number} via WhatsApp?`)) {
            try {
                await axios.post(route('admin.crm.leads.send-whatsapp', lead.id), { message });
                alert('Invoice berhasil dikirim via WhatsApp.');
            } catch (err) {
                alert('Gagal mengirim WhatsApp: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const {
        plottingForm,
        setPlottingForm,
        selectedClass,
        remainingMeetings,
        savingPlotting,
        handleSavePlotting
    } = useLeadPlotting(lead, availableClasses, onRefresh);

    const handleSendTemplate = async (template) => {
        if (!window.confirm(`Kirim template "${template.title}" ke ${lead.name}?`)) {
            return;
        }

        setSendingTemplateId(template.id);
        try {
            // Send template with confirmation to avoid accidental clicks
            await axios.post(route('admin.crm.leads.send-template', lead.id), {
                chat_template_id: template.id
            });
            onRefresh();
        } catch (err) {
            alert('Gagal mengirim template: ' + (err.response?.data?.error || err.message));
        } finally {
            setSendingTemplateId(null);
        }
    };

    const handleSaveConsultation = async () => {
        if (!consultationForm.notes.trim()) {
            alert('Catatan konsultasi wajib diisi.');
            return;
        }

        setSavingConsultation(true);
        try {
            await axios.post(route('admin.crm.leads.store-consultation', lead.id), consultationForm);
            setConsultationForm({
                consultation_date: new Date().toISOString().split('T')[0],
                notes: '',
                recommended_level: '',
                follow_up_note: ''
            });
            onRefresh();
        } catch (err) {
            alert('Gagal menyimpan konsultasi: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingConsultation(false);
        }
    };


    // Shared props for sections to prevent scroll reset via component re-mounting
    const sectionProps = {
        isStageActive,
        getSectionStyle,
        chatTemplates,
        lead,
        phases,
        handleSendTemplate,
        sendingTemplateId
    };

    return (
        <div className="relative outline-none">
            {/* Sticky Header with Phase Selector */}
            <div className="sticky top-0 z-40 px-10 py-5 bg-white border-b border-slate-100 mb-10 transition-shadow duration-300">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${style.bg} ${style.color}`}>
                            <style.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current</p>
                            <h3 className="text-sm font-black text-slate-900 leading-none">{lead?.lead_phase?.name}</h3>
                        </div>
                    </div>

                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-2 pl-6 pr-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                            Update Phase
                            <ChevronDown size={12} className="opacity-60" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-slate-100 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-slate-100">
                                <div className="py-2">
                                    {phases.map((phase) => {
                                        const isActive = lead?.lead_phase_id === phase.id;
                                        const pStyle = getPhaseStyle(phase.code);
                                        return (
                                            <Menu.Item key={phase.id}>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => onUpdatePhase(phase.id)}
                                                        className={`
                                                            ${active ? 'bg-slate-50' : ''} 
                                                            group flex w-full items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-colors
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${pStyle.color.replace('text-', 'bg-')}`} />
                                                            <span className={isActive ? 'text-slate-900' : 'text-slate-500 font-bold'}>
                                                                {phase.name}
                                                            </span>
                                                        </div>
                                                        {isActive && <Check size={14} className="text-emerald-500" />}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        );
                                    })}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>

            <div className="space-y-12 px-10 pb-20">
                {/* 1. Lead Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={UserPlus} 
                    title="Lead / Inquiry" 
                    subtitle="Initial point of contact"
                    codes={['lead']}
                >
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <InfoItem 
                            label="Initial Type" 
                            value={lead?.lead_type?.name} 
                            icon={Users} 
                        />
                        <InfoItem 
                            label="Marketing Source" 
                            value={lead?.lead_source?.name || 'Organic/Direct'} 
                            icon={Globe} 
                        />
                        <InfoItem 
                            label="Created At" 
                            value={lead?.formatted_at} 
                            icon={Calendar} 
                        />
                        <InfoItem 
                            label="Lead Owner" 
                            value={lead?.owner?.name || 'Unassigned'} 
                            icon={Users} 
                        />
                    </div>
                </PhaseSection>

                {/* 2. Prospect Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={Compass} 
                    title="Prospect" 
                    subtitle="Qualified and interested"
                    codes={['prospect']}
                >
                    <div className="grid grid-cols-2 gap-8">
                        <InfoItem 
                            label="Follow-up Tracking" 
                            value={`${lead?.follow_up_count || 0} Attempts`} 
                            icon={MessageSquare} 
                        />
                        <InfoItem 
                            label="Last Engagement" 
                            value={lead?.human_at} 
                            icon={Clock} 
                        />
                    </div>
                </PhaseSection>

                <PhaseSection 
                    {...sectionProps}
                    icon={GraduationCap} 
                    title="Consultation" 
                    subtitle="Academic review & advice"
                    codes={['consultation']}
                >
                    <div className="space-y-6">
                        {/* Quick Record Form */}
                        {isStageActive(['consultation']) && (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-inner space-y-5">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <StickyNote size={10} className="text-red-500" /> Tambahkan Catatan Konsultasi
                                </h5>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                                        <DatePicker 
                                            value={consultationForm.consultation_date}
                                            onChange={val => setConsultationForm({...consultationForm, consultation_date: val})}
                                            inputClassName="!py-2 !h-auto !bg-white !border-slate-200 !rounded-xl !text-xs !font-bold !text-slate-700 !shadow-none !ring-red-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Level Saran</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder=""
                                                value={consultationForm.recommended_level}
                                                onChange={e => setConsultationForm({...consultationForm, recommended_level: e.target.value})}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                            />
                                            <Award size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Konsultasi / Advice</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Tuliskan detail saran akademik untuk lead ini..."
                                        value={consultationForm.notes}
                                        onChange={e => setConsultationForm({...consultationForm, notes: e.target.value})}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none shadow-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rencana Follow-up</label>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: Hubungi lagi minggu depan untuk trial"
                                        value={consultationForm.follow_up_note}
                                        onChange={e => setConsultationForm({...consultationForm, follow_up_note: e.target.value})}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    />
                                </div>

                                <button 
                                    onClick={handleSaveConsultation}
                                    disabled={savingConsultation || !consultationForm.notes.trim()}
                                    className="w-full py-3 bg-slate-900 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingConsultation ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    Simpan Catatan Konsultasi
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {lead?.consultations?.length > 0 ? (
                                lead.consultations.map((c) => (
                                    <div key={c.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm relative overflow-hidden group hover:border-red-100 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                                    <Calendar size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 tracking-tight">{c.formatted_date}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">By {c.consultant_name}</p>
                                                </div>
                                            </div>
                                            {c.recommended_level && (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                    {c.recommended_level}
                                                </span>
                                            )}
                                        </div>
                                        <div className="pl-11 space-y-3">
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.notes}</p>
                                            {c.follow_up_note && (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                                                    <Zap size={10} className="text-amber-500 mt-0.5" />
                                                    <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">Next: {c.follow_up_note}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed text-center">
                                    <StickyNote size={24} className="mx-auto text-slate-200 mb-3" />
                                    <p className="italic text-slate-400 text-[10px] font-bold uppercase tracking-widest">Belum ada catatan konsultasi recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </PhaseSection>

                {/* 4. Placement Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={Target} 
                    title="Placement" 
                    subtitle="English proficiency evaluation"
                    codes={['placement-test']}
                >
                    <LeadPlacementTestTab 
                        lead={lead} 
                        loading={false} 
                        availableExams={availableExams}
                        onRefresh={onRefresh}
                        isMinimal={true}
                    />
                </PhaseSection>

                {/* 5. Pre-Enrollment Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={FileCheck} 
                    title="Pre-Enrollment" 
                    subtitle="Data completion & registration"
                    codes={['pre-enrollment']}
                >
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
                                            onChange={e => setPlottingForm({...plottingForm, study_class_id: e.target.value})}
                                            className="w-full bg-white border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all py-3.5 px-5 shadow-sm"
                                        >
                                            <option value="">-- Pilih Kelas Tersedia --</option>
                                            {availableClasses.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} 
                                                    {cls.schedule_days ? ` (${cls.schedule_days.map(d => d.substring(0,3)).join(', ')})` : ''} 
                                                    - {cls.instructor?.name || 'No Instructor'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Rencana Masuk</label>
                                        <DatePicker 
                                            value={plottingForm.join_date}
                                            onChange={val => setPlottingForm({...plottingForm, join_date: val})}
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
                                                    onChange={e => setPlottingForm({...plottingForm, estimated_cost: e.target.value})}
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
                                </div>

                                <div className="space-y-6">
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
                                        <div className="h-full flex flex-col items-center justify-center p-8 bg-white/50 border border-dashed border-slate-200 rounded-[2rem] text-center">
                                            <Compass size={32} className="text-slate-200 mb-3" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pilih kelas untuk melihat<br/>estimasi sisa pertemuan</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Khusus Plotting</label>
                                        <textarea 
                                            rows={2}
                                            value={plottingForm.notes}
                                            onChange={e => setPlottingForm({...plottingForm, notes: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all shadow-sm resize-none"
                                            placeholder="Misal: Request minta pengajar"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSavePlotting}
                                disabled={savingPlotting || !plottingForm.study_class_id}
                                className="w-full mt-8 py-4 bg-slate-900 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
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
                            <InfoItem 
                                label="Self-Reg Token" 
                                value={lead?.self_registration_token?.substring(0, 8) + '...'} 
                                icon={Zap} 
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
                </PhaseSection>

                {/* 6. Invoice Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={CreditCard} 
                    title="Invoice" 
                    subtitle="Financial arrangements"
                    codes={['invoice']}
                >
                    <div className="space-y-3">
                        {lead?.invoices?.length > 0 ? (
                            lead.invoices.map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs uppercase tracking-tighter shadow-inner">INV</div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 tracking-tight">{inv.invoice_number}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rp {new Intl.NumberFormat('id-ID').format(inv.total_amount)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {inv.status}
                                        </span>
                                        <button 
                                            onClick={() => handleSendInvoiceWA(inv)}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                            title="Kirim via WhatsApp"
                                        >
                                            <MessageCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-[10px] text-slate-400 text-center font-bold">No invoices generated yet.</div>
                        )}
                    </div>
                </PhaseSection>

                {/* 7. Enrollment Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={Trophy} 
                    title="Enrollment" 
                    subtitle="Final closing & conversion"
                    codes={['enrollment', 'enrolled']}
                >
                    {lead?.enrolled_at ? (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50/50">
                                    <Trophy size={28} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-emerald-900 tracking-tight leading-none mb-2">Student Enrolled</h4>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                        Officially closed on {lead.formatted_enrolled_at}
                                    </p>
                                </div>
                            </div>
                            
                            {lead?.student?.study_classes?.length > 0 && (
                                <div className="grid grid-cols-1 gap-4">
                                    {lead.student.study_classes.map((cls, i) => (
                                        <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <GraduationCap size={18} className="text-slate-400" />
                                                <span className="text-sm font-black text-slate-800">{cls.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Class</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Waiting for final conversion</p>
                        </div>
                    )}
                </PhaseSection>

                {/* 8. Cold Leads Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={Snowflake} 
                    title="Cold Leads" 
                    subtitle="Inactive or unresponded"
                    codes={['cold-leads']}
                >
                    <div className="text-center py-10 bg-blue-50/30 rounded-[2.5rem] border border-blue-100/50">
                        <Snowflake size={32} className="mx-auto text-blue-300 mb-3 opacity-50" />
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Lead state: Cooling Down</p>
                    </div>
                </PhaseSection>

                {/* 9. DO Phase */}
                <PhaseSection 
                    {...sectionProps}
                    icon={LogOut} 
                    title="Dropped Out" 
                    subtitle="Lead has exited pipeline"
                    codes={['dropout-leads']}
                >
                    <div className="text-center py-10 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed">
                        <LogOut size={32} className="mx-auto text-slate-300 mb-3 opacity-50" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead has Dropped Out</p>
                    </div>
                </PhaseSection>
            </div>
        </div>
    );
}

