import React, { Fragment } from 'react';
import { User, Phone, Mail, MapPin, Building2, Globe, Users, Link as LinkIcon, ChevronDown, Check } from 'lucide-react';
import { SectionHeader, InfoItem } from '../components/DrawerUI';
import { Menu, Transition } from '@headlessui/react';

export default function LeadDetailTab({ lead, loading, getPhaseStyle, phases = [], onUpdatePhase }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-5 outline-none py-4">
            {/* Personal Info */}
            <div className="space-y-4">
                <div className="">
                    <SectionHeader icon={User} title="Contact Information" />
                    <div className="">
                        <InfoItem label="WhatsApp/Phone" value={lead?.phone} icon={Phone} />
                        <InfoItem label="Email Address" value={lead?.email || 'No email provided'} icon={Mail} />
                        <InfoItem label="Address Details" value={`${lead?.city || '---'}, ${lead?.province || '---'}`} icon={MapPin} />
                    </div>
                </div>

                <div className="">
                    <SectionHeader icon={Building2} title="Assignment" />
                    <div className="">
                        <InfoItem label="Target Branch" value={lead?.branch?.name} icon={Building2} />
                        <InfoItem label="Lead Owner" value={lead?.owner?.name} icon={User} />
                        <InfoItem label="Created By" value={lead?.creator?.name} icon={User} />
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
                <div className="">
                    <SectionHeader icon={Globe} title="Classification" />
                    <div className="">
                        <InfoItem label="Source" value={lead?.lead_source?.name} />
                        <InfoItem label="Lead Type" value={lead?.lead_type?.name} />
                        <div className="pt-4 pl-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">Status Pipeline</p>
                            
                            <Menu as="div" className="relative inline-block text-left">
                                <Menu.Button className="outline-none focus:outline-none">
                                    {(() => {
                                        const style = getPhaseStyle(lead?.lead_phase?.code);
                                        return (
                                            <div className={`group inline-flex items-center gap-3 px-6 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:shadow-lg active:scale-95 ${style.bg} ${style.color} ${style.border}`}>
                                                <style.icon size={14} />
                                                {lead?.lead_phase?.name}
                                                <ChevronDown size={14} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        );
                                    })()}
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
                                    <Menu.Items className="absolute left-0 mt-3 w-56 origin-top-left divide-y divide-slate-100 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-slate-100">
                                        <div className="py-2">
                                            {phases.map((phase) => {
                                                const isActive = lead?.lead_phase_id === phase.id;
                                                const style = getPhaseStyle(phase.code);
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
                                                                    <div className={`w-2 h-2 rounded-full ${style.color.replace('text-', 'bg-')}`} />
                                                                    <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
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
                </div>

                <div className="p-8 bg-slate-50/80 rounded-[2.5rem] border border-slate-200 mt-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Inquiry Channel</p>
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                            {lead?.is_online ? 'Online Channel' : 'Offline / Walk-in'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Relations & Contacts - Full Width */}
            <div className="col-span-2 border-t border-slate-100 pt-4">
                {/* Guardians Section */}
                <div className="">
                    <SectionHeader icon={Users} title="Guardians & Contacts" />
                    <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lead?.guardians?.length > 0 ? (
                            lead.guardians.map((guardian, i) => (
                                <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{guardian.role}</p>
                                    <p className="text-sm font-bold text-slate-900 mb-3">{guardian.name}</p>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <Phone size={12} className="text-slate-400" />
                                            {guardian.phone}
                                        </div>
                                        {guardian.email && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Mail size={12} className="text-slate-400" />
                                                {guardian.email}
                                            </div>
                                        )}
                                        {guardian.occupation && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Building2 size={12} className="text-slate-400" />
                                                {guardian.occupation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs font-medium text-slate-400 col-span-2">No guardian data linked to this lead.</p>
                        )}
                    </div>
                </div>

                {/* Relatives/Siblings Section */}
                <div className="mt-8">
                    <SectionHeader icon={LinkIcon} title="Related Leads (Siblings / Family)" />
                    <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-6 ">
                        {lead?.lead_relationships?.length > 0 ? (
                            lead.lead_relationships.map((rel, i) => (
                                <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rel.type}</p>
                                        <p className="text-sm font-bold text-slate-900">{rel.related_lead?.name || 'Unknown Lead'}</p>
                                        {rel.is_main_contact && <p className="text-[10px] font-black text-red-500 mt-1 uppercase">Main Decision Maker</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs font-medium text-slate-400 col-span-2">No siblings or relatives linked.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
