import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { X, User, History, MessageSquare, Phone, Mail, MapPin, Building2, Globe, Calendar, Clock, ArrowRight, LinkIcon, Edit2, GraduationCap, CheckCircle } from 'lucide-react';
import axios from 'axios';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';
import useWhatsapp from '@/Hooks/useWhatsapp';

import LeadDetailTab from './tabs/LeadDetailTab';
import LeadActivityTab from './tabs/LeadActivityTab';
import LeadWhatsappTab from './tabs/LeadWhatsappTab';

export default function LeadDetailDrawer({ 
    leadId, 
    isOpen, 
    onClose, 
    onEditLead,
    onOpenWhatsapp,
    chatTemplates = [], 
    mediaAssets = [],
    phases = [],
    initialTabIndex = 0
}) {
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(initialTabIndex);
    const { getPhaseStyle } = useLeadPhaseStyle();
    
    // Sync tab index when drawer opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(initialTabIndex);
        }
    }, [isOpen, initialTabIndex]);

    useEffect(() => {
        if (isOpen && leadId) {
            fetchLeadDetails();
        }
    }, [isOpen, leadId]);

    const fetchLeadDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.crm.leads.show', leadId));
            setLead(response.data.lead);
        } catch (error) {
            console.error('Error fetching lead details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePhase = async (newPhaseId) => {
        try {
            const response = await axios.patch(route('admin.crm.leads.update-phase', leadId), {
                lead_phase_id: newPhaseId
            });
            // Update local state and trigger side effects if needed
            setLead(response.data.lead);
            // Reload the parent page state (List view or Dashboard)
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Error updating lead phase:', error);
        }
    };

    const handlePromoteToStudent = async () => {
        if (confirm(`Convert ${lead.name} to a registered student?`)) {
            try {
                await axios.post(route('admin.academic.students.promote', leadId));
                fetchLeadDetails(); // Refresh local state
                router.reload({ preserveScroll: true });
            } catch (error) {
                console.error('Error promoting lead:', error);
                alert(error.response?.data?.message || 'Failed to promote lead.');
            }
        }
    };

    const tabs = [
        { name: 'Detail Lead', icon: User, component: LeadDetailTab },
        { name: 'History Activity', icon: History, component: LeadActivityTab },
        { name: 'WhatsApp History', icon: MessageSquare, component: LeadWhatsappTab },
    ];

    return (
        <Transition.Root show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {}}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={React.Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                                    <div className="flex h-full flex-col bg-white shadow-2xl border-l border-slate-100 overflow-hidden">
                                        {/* Header */}
                                        <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                                                    <User size={28} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                                            {loading ? 'Loading...' : lead?.name}
                                                        </h2>
                                                        {!loading && lead && (
                                                            <div className="flex items-center gap-1 ml-2">
                                                                <button 
                                                                    onClick={() => onEditLead && onEditLead(lead)}
                                                                    title="Edit Lead Data"
                                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => onOpenWhatsapp(lead)}
                                                                    title="Open WhatsApp"
                                                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all"
                                                                >
                                                                    <MessageSquare size={14} />
                                                                </button>
                                                                {/* Promote and Student Verified states hidden - Now handled in Finance module */}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                                                        {lead?.lead_number || '---'} • {lead?.formatted_at}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <Tab.Group 
                                            selectedIndex={selectedIndex} 
                                            onChange={setSelectedIndex}
                                            className="flex flex-col flex-1 overflow-hidden"
                                        >
                                            {/* Tab List */}
                                            <Tab.List className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex gap-10">
                                                {tabs.map((tab) => (
                                                    <Tab
                                                        key={tab.name}
                                                        className={({ selected }) => `
                                                            flex items-center gap-2.5 pb-4 text-xs font-black uppercase tracking-widest transition-all outline-none relative
                                                            ${selected ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}
                                                        `}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <tab.icon size={14} />
                                                                <span>{tab.name}</span>
                                                                {selected && (
                                                                    <div className="absolute bottom-[-17px] left-0 right-0 h-1 bg-red-600 rounded-full" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Tab>
                                                ))}
                                            </Tab.List>

                                            {/* Tab Panels */}
                                            <Tab.Panels className="flex-1 overflow-y-auto p-10 bg-white">
                                                <Tab.Panel className="outline-none">
                                                    <LeadDetailTab 
                                                        lead={lead} 
                                                        loading={loading} 
                                                        getPhaseStyle={getPhaseStyle} 
                                                        phases={phases}
                                                        onUpdatePhase={handleUpdatePhase}
                                                    />
                                                </Tab.Panel>

                                                <Tab.Panel className="outline-none">
                                                    <LeadActivityTab leadId={lead?.id} />
                                                </Tab.Panel>

                                                <Tab.Panel className="outline-none">
                                                    <LeadWhatsappTab 
                                                        lead={lead} 
                                                        chatTemplates={chatTemplates}
                                                        mediaAssets={mediaAssets}
                                                    />
                                                </Tab.Panel>
                                            </Tab.Panels>
                                        </Tab.Group>

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
