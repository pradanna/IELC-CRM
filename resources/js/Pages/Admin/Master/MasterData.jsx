import React from 'react';
import { Head } from '@inertiajs/react';
import { Tab } from '@headlessui/react';
import { Tag, Layers, Radio, MessageSquare, HardDrive, Calendar } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import LeadTypesTab from './master/tabs/LeadTypesTab';
import LeadPhasesTab from './master/tabs/LeadPhasesTab';
import LeadSourcesTab from './master/tabs/LeadSourcesTab';
import ChatTemplatesTab from './master/tabs/ChatTemplatesTab';
import MediaLibraryTab from './master/tabs/MediaLibraryTab';
import MonthlyTargetsTab from './master/tabs/MonthlyTargetsTab';

const TABS = [
    { name: 'Lead Types',       icon: Tag,          component: LeadTypesTab,       prop: 'leadTypes'       },
    { name: 'Lead Phases',      icon: Layers,       component: LeadPhasesTab,      prop: 'leadPhases'      },
    { name: 'Lead Sources',     icon: Radio,        component: LeadSourcesTab,     prop: 'leadSources'     },
    { name: 'Monthly Target',  icon: Calendar,     component: MonthlyTargetsTab,  prop: 'monthlyTargets', extra: ['branches'] },
    { name: 'Chat Templates',   icon: MessageSquare, component: ChatTemplatesTab,   prop: 'chatTemplates'   },
    { name: 'Media Library',    icon: HardDrive,    component: MediaLibraryTab,    prop: 'mediaAssets'     },
];

export default function MasterData({ leadTypes, leadPhases, leadSources, chatTemplates, mediaAssets, monthlyTargets, branches }) {
    const props = { leadTypes, leadPhases, leadSources, chatTemplates, mediaAssets, monthlyTargets, branches };

    return (
        <AuthenticatedLayout>
            <Head title="Master Data" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Page Header */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Configuration</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Data</h1>
                </div>

                {/* Tabs */}
                <Tab.Group>
                    <Tab.List className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                        {TABS.map(tab => (
                            <Tab
                                key={tab.name}
                                className={({ selected }) =>
                                    `flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all outline-none ${
                                        selected
                                            ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <tab.icon size={14} className={selected ? 'text-red-500' : ''} />
                                        {tab.name}
                                    </>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels>
                        {TABS.map(tab => (
                            <Tab.Panel key={tab.name} className="outline-none pt-4">
                                <tab.component 
                                    items={props[tab.prop]} 
                                    {...(tab.extra ? Object.fromEntries(tab.extra.map(key => [key, props[key]])) : {})}
                                />
                            </Tab.Panel>
                        ))}
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </AuthenticatedLayout>
    );
}
