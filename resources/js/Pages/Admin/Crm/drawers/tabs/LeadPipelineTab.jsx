import React, { Fragment, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Menu, Transition } from '@headlessui/react';
import axios from 'axios';
import {
    ChevronDown,
    Check,
    Zap,
    GraduationCap,
    Target,
    Trophy,
    UserPlus,
    Compass,
    FileCheck,
    CreditCard,
    Snowflake,
    LogOut,
    Loader2,
    ArrowDown
} from 'lucide-react';
import useLeadPlotting from './hooks/useLeadPlotting';
import PlotAndInvoiceModal from '../../../Finance/modals/PlotAndInvoiceModal';

// Modularized pipeline components
import PhaseSection from './pipeline/PhaseSection';
import LeadStage from './pipeline/stages/LeadStage';
import ProspectStage from './pipeline/stages/ProspectStage';
import ConsultationStage from './pipeline/stages/ConsultationStage';
import PlacementTestStage from './pipeline/stages/PlacementTestStage';
import PreEnrollmentStage from './pipeline/stages/PreEnrollmentStage';
import InvoiceStage from './pipeline/stages/InvoiceStage';
import EnrollmentStage from './pipeline/stages/EnrollmentStage';

/**
 * Normalizes a collection that might be a raw array or a wrapped resource object.
 */
const normalizeCollection = (collection) => {
    if (Array.isArray(collection)) return collection;
    if (collection && Array.isArray(collection.data)) return collection.data;
    return [];
};

export default function LeadPipelineTab({
    lead,
    loading,
    updatingPhase = false,
    getPhaseStyle,
    phases = [],
    onUpdatePhase,
    availableExams = [],
    availableClasses = [],
    chatTemplates = [],
    priceMasters = [],
    onRefresh,
    leadTypes = [],
    leadSources = [],
    provinces = []
}) {
    if (loading && !lead) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const normalizedPhases = normalizeCollection(phases);
    const normalizedLeadTypes = normalizeCollection(leadTypes);
    const normalizedLeadSources = normalizeCollection(leadSources);
    const normalizedProvinces = normalizeCollection(provinces);

    const currentPhaseCode = lead?.lead_phase?.code;
    const style = getPhaseStyle(currentPhaseCode);

    // Helpers to determine phase focus
    const isStageActive = (codes) => codes.includes(currentPhaseCode);
    const getSectionStyle = (codes) => isStageActive(codes)
        ? "border-red-500/30 bg-white ring-1 ring-red-500/10 shadow-[0_20px_50px_rgba(239,68,68,0.15)] scale-[1.02] border-l-8 border-l-red-500"
        : "border-slate-100 bg-slate-50/50 grayscale-[0.3] opacity-80 hover:opacity-100 transition-all duration-300";

    const { auth } = usePage().props;
    const user = auth?.user;
    const [sendingTemplateId, setSendingTemplateId] = useState(null);
    const [savingConsultation, setSavingConsultation] = useState(false);
    const [consultationForm, setConsultationForm] = useState({
        consultation_date: new Date().toISOString().split('T')[0]
    });
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [updatingQualification, setUpdatingQualification] = useState(false);

    const [leadName, setLeadName] = useState(lead?.name || '');
    const [leadNickname, setLeadNickname] = useState(lead?.nickname || '');
    const [leadProvince, setLeadProvince] = useState(lead?.province || '');
    const [leadCity, setLeadCity] = useState(lead?.city || '');
    const [leadAddress, setLeadAddress] = useState(lead?.address || '');
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const [savingFields, setSavingFields] = useState({});
    const [successFields, setSuccessFields] = useState({});

    // Listen for enrollment added from EnrollmentStage and refresh lead data
    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.leadId === lead?.id && onRefresh) {
                onRefresh();
            }
        };
        window.addEventListener('lead-enrollment-added', handler);
        return () => window.removeEventListener('lead-enrollment-added', handler);
    }, [lead?.id, onRefresh]);



    const FieldStatus = ({ name }) => {
        if (savingFields[name]) {
            return (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 animate-in fade-in duration-300">
                    <Loader2 size={12} className="animate-spin text-red-500" />
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none animate-pulse">Saving</span>
                </div>
            );
        }
        if (successFields[name]) {
            return (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 animate-in zoom-in duration-300">
                    <Check size={12} className="text-emerald-500 font-bold" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Saved</span>
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        setLeadName(lead?.name || '');
        setLeadNickname(lead?.nickname || '');
        setLeadProvince(lead?.province || '');
        setLeadCity(lead?.city || '');
        setLeadAddress(lead?.address || '');
    }, [lead]);

    useEffect(() => {
        if (leadProvince) {
            setLoadingCities(true);
            axios.get(route('admin.crm.cities', { province: leadProvince }))
                .then(res => {
                    setCities(res.data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingCities(false));
        } else {
            setCities([]);
        }
    }, [leadProvince]);

    const handleUpdateQualification = async (updates, fieldName = null) => {
        if (fieldName) {
            setSavingFields(prev => ({ ...prev, [fieldName]: true }));
        }
        setUpdatingQualification(true);
        try {
            await axios.patch(route('admin.crm.leads.update-qualification', lead.id), updates);
            onRefresh(true);

            if (fieldName) {
                setSuccessFields(prev => ({ ...prev, [fieldName]: true }));
                setTimeout(() => {
                    setSuccessFields(prev => ({ ...prev, [fieldName]: false }));
                }, 2000);
            }
        } catch (err) {
            console.error('Gagal memperbarui kualifikasi:', err);
            alert('Gagal memperbarui kualifikasi: ' + (err.response?.data?.message || err.message));
        } finally {
            setUpdatingQualification(false);
            if (fieldName) {
                setSavingFields(prev => ({ ...prev, [fieldName]: false }));
            }
        }
    };

    const handleSendInvoiceWA = async (invoice) => {
        const name = lead.nickname || lead.name;
        const publicUrl = invoice.download_url || route('public.invoice.download', invoice.id);
        const isPaid = invoice.status === 'paid';

        let typeLabel = 'pendaftaran';
        if (invoice.type === 'placement_test') {
            typeLabel = 'placement test';
        } else if (invoice.type === 'rejoin') {
            typeLabel = 'rejoin';
        } else if (invoice.type === 'paket_lanjut') {
            typeLabel = 'paket lanjut';
        }

        let message = `Halo *${name}*,\n\n`;
        if (isPaid) {
            message += `Berikut adalah bukti pembayaran ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                `${publicUrl}\n\n` +
                `Terima kasih! 🙏`;
        } else {
            message += `Berikut adalah tagihan ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                `${publicUrl}\n\n` +
                `Silakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        }

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

    const formatPhone = (phone) => {
        if (!phone) return '';
        let clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) return '62' + clean.slice(1);
        if (clean.startsWith('8')) return '62' + clean;
        return clean;
    };

    const parseTemplateMessage = (text) => {
        if (!text) return '';
        return text
            .replace(/{{name}}/g, lead?.name || 'Kak')
            .replace(/{{nickname}}/g, lead?.nickname || lead?.name || 'Kak')
            .replace(/{{lead_number}}/g, lead?.lead_number || '')
            .replace(/{{admin_name}}/g, user?.name || '');
    };

    const openWaWeb = (msg) => {
        const parsedMsg = parseTemplateMessage(msg);
        const cleanPhone = formatPhone(lead.phone);
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(parsedMsg)}`;
        window.open(url, '_blank');
    };

    const handleSendTemplate = async (template) => {
        if (!window.confirm(`Kirim template "${template.title}" ke ${lead.name}?`)) {
            return;
        }

        setSendingTemplateId(template.id);
        try {
            await axios.post(route('admin.crm.leads.send-template', lead.id), {
                chat_template_id: template.id
            });
            onRefresh(true);
        } catch (err) {
            console.error('Gagal mengirim template:', err);
            const errMsg = err.response?.data?.error || err.message || "Unknown error";
            if (confirm(`Gagal kirim via sistem: ${errMsg}\n\nApakah Anda ingin mencoba kirim via WhatsApp Web?`)) {
                openWaWeb(template.message);
            }
        } finally {
            setSendingTemplateId(null);
        }
    };

    const handleSaveConsultation = async () => {
        setSavingConsultation(true);
        try {
            await axios.post(route('admin.crm.leads.store-consultation', lead.id), consultationForm);
            setConsultationForm({
                consultation_date: new Date().toISOString().split('T')[0]
            });
            onRefresh(true);
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
        phases: normalizedPhases,
        handleSendTemplate,
        sendingTemplateId,
        onUpdatePhase
    };

    const scrollToCurrentStage = () => {
        const element = document.getElementById('current-stage-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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

                    <div className="flex items-center gap-2">
                        <button
                            onClick={scrollToCurrentStage}
                            className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all active:scale-95 shadow-sm"
                            title="Scroll to Current Stage"
                        >
                            <ArrowDown size={14} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </button>

                        <Menu as="div" className="relative">
                            <Menu.Button
                                disabled={updatingPhase}
                                className="flex items-center gap-2 pl-6 pr-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-75 disabled:cursor-wait"
                            >
                                {updatingPhase ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin text-white" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Update Phase</span>
                                        <ChevronDown size={12} className="opacity-60" />
                                    </>
                                )}
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
                                        {normalizedPhases.map((phase) => {
                                            const isActive = lead?.lead_phase_id === phase.id;
                                            const pStyle = getPhaseStyle(phase.code);
                                            const isOptionDisabled = phase.code === 'enrollment' && !lead?.invoices?.some(inv => inv.status === 'paid');
                                            return (
                                                <Menu.Item key={phase.id}>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => {
                                                                if (!isOptionDisabled) {
                                                                    onUpdatePhase(phase.id);
                                                                }
                                                            }}
                                                            disabled={isOptionDisabled || updatingPhase}
                                                            className={`
                                                            ${active && !isOptionDisabled ? 'bg-slate-50' : ''} 
                                                            group flex w-full items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-colors
                                                            ${isOptionDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                                        `}
                                                            title={isOptionDisabled ? "Invoice belum lunas" : undefined}
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

                {updatingPhase && (
                    <div className="mt-3 py-2 px-4 bg-red-500 text-white rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Loader2 size={12} className="animate-spin" />
                            <span>Memperbarui Phase Lead...</span>
                        </div>
                        <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">Scroll Tetap Aktif</span>
                    </div>
                )}
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
                    <LeadStage
                        lead={lead}
                        leadName={leadName}
                        setLeadName={setLeadName}
                        leadNickname={leadNickname}
                        setLeadNickname={setLeadNickname}
                        leadProvince={leadProvince}
                        setLeadProvince={setLeadProvince}
                        leadCity={leadCity}
                        setLeadCity={setLeadCity}
                        leadAddress={leadAddress}
                        setLeadAddress={setLeadAddress}
                        cities={cities}
                        loadingCities={loadingCities}
                        updatingQualification={updatingQualification}
                        handleUpdateQualification={handleUpdateQualification}
                        normalizedLeadTypes={normalizedLeadTypes}
                        normalizedLeadSources={normalizedLeadSources}
                        normalizedProvinces={normalizedProvinces}
                        FieldStatus={FieldStatus}
                    />
                </PhaseSection>

                {/* 2. Prospect Phase */}
                <PhaseSection
                    {...sectionProps}
                    icon={Compass}
                    title="Prospect"
                    subtitle="Qualified and interested"
                    codes={['prospect']}
                >
                    <ProspectStage
                        lead={lead}
                        updatingQualification={updatingQualification}
                        handleUpdateQualification={handleUpdateQualification}
                        normalizedLeadTypes={normalizedLeadTypes}
                        FieldStatus={FieldStatus}
                    />
                </PhaseSection>

                {/* 3. Consultation Phase */}
                <PhaseSection
                    {...sectionProps}
                    icon={GraduationCap}
                    title="Consultation"
                    subtitle="Academic review & advice"
                    codes={['consultation']}
                >
                    <ConsultationStage
                        lead={lead}
                        isStageActive={isStageActive}
                        consultationForm={consultationForm}
                        setConsultationForm={setConsultationForm}
                        handleSaveConsultation={handleSaveConsultation}
                        savingConsultation={savingConsultation}
                    />
                </PhaseSection>

                {/* 4. Placement Phase */}
                <PhaseSection
                    {...sectionProps}
                    icon={Target}
                    title="Placement"
                    subtitle="English proficiency evaluation"
                    codes={['placement-test']}
                >
                    <PlacementTestStage
                        lead={lead}
                        availableExams={availableExams}
                        onRefresh={onRefresh}
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
                    <PreEnrollmentStage
                        lead={lead}
                        plottingForm={plottingForm}
                        setPlottingForm={setPlottingForm}
                        availableClasses={availableClasses}
                        selectedClass={selectedClass}
                        remainingMeetings={remainingMeetings}
                        savingPlotting={savingPlotting}
                        handleSavePlotting={handleSavePlotting}
                        openWaWeb={openWaWeb}
                    />
                </PhaseSection>

                {/* 6. Invoice Phase */}
                <PhaseSection
                    {...sectionProps}
                    icon={CreditCard}
                    title="Invoice"
                    subtitle="Financial arrangements"
                    codes={['invoice']}
                >
                    <InvoiceStage
                        lead={lead}
                        handleSendInvoiceWA={handleSendInvoiceWA}
                    />
                </PhaseSection>

                {/* 7. Enrollment Phase */}
                <PhaseSection
                    {...sectionProps}
                    icon={Trophy}
                    title="Enrollment"
                    subtitle="Final closing & conversion"
                    codes={['enrollment', 'enrolled']}
                >
                    <EnrollmentStage
                        lead={lead}
                        availableClasses={availableClasses}
                        priceMasters={priceMasters}
                        setIsInvoiceModalOpen={setIsInvoiceModalOpen}
                    />
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

            <PlotAndInvoiceModal
                show={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                lead={lead}
                student={lead?.student}
                classes={availableClasses}
                priceMasters={priceMasters}
            />
        </div>
    );
}

