import { Building2, Globe, LinkIcon, Mail, MapPin, Phone, User, Users } from 'lucide-react';
import { InfoItem, SectionHeader } from '../components/DrawerUI';
import MagicLinkBanner from '../components/MagicLinkBanner';

export default function LeadDetailTab({ lead, loading, getPhaseStyle, phases = [], onUpdatePhase }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="outline-none py-4">
            {/* Standardized Magic Link Section */}
            <MagicLinkBanner lead={lead} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column: Contact & Identity */}
                <div className="space-y-10">
                    <div className="">
                        <SectionHeader icon={User} title="Contact Information" />
                        <div className="">
                            <InfoItem label="Full Name" value={lead?.name} icon={User} />
                            <InfoItem label="Nickname" value={lead?.nickname || '---'} icon={User} />
                            <InfoItem label="Gender" value={lead?.gender === 'L' ? 'Laki-laki' : (lead?.gender === 'P' ? 'Perempuan' : '---')} icon={User} />
                            <InfoItem label="WhatsApp/Phone" value={lead?.phone} icon={Phone} />
                            <InfoItem label="Email Address" value={lead?.email || 'No email provided'} icon={Mail} />
                        </div>
                    </div>

                    <div className="">
                        <SectionHeader icon={MapPin} title="Address & Location" />
                        <div className="">
                            <InfoItem label="Full Address" value={lead?.address || '---'} icon={MapPin} />
                            <InfoItem label="Location" value={`${lead?.city || '---'}, ${lead?.province || '---'}`} icon={Globe} />
                            <InfoItem label="Postal Code" value={lead?.postal_code || '---'} icon={MapPin} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Academic & Assignment */}
                <div className="space-y-10">
                    <div className="">
                        <SectionHeader icon={Building2} title="Academic Details" />
                        <div className="">
                            <InfoItem label="School" value={lead?.school || '---'} icon={Building2} />
                            <InfoItem label="Grade / Level" value={lead?.grade || '---'} icon={Building2} />
                        </div>
                    </div>

                    <div className="">
                        <SectionHeader icon={Building2} title="Assignment" />
                        <div className="">
                            <InfoItem label="Target Branch" value={lead?.branch?.name} icon={Building2} />
                            <InfoItem label="Lead Owner" value={lead?.owner?.name} icon={User} />
                        </div>
                    </div>

                    <div className="">
                        <SectionHeader icon={LinkIcon} title="Link & Sources" />
                        <div className="">
                            <InfoItem label="Lead Source" value={lead?.lead_source?.name || '---'} icon={LinkIcon} />
                            <InfoItem label="Lead Type" value={lead?.lead_type?.name || '---'} icon={LinkIcon} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Relations & Contacts - Full Width */}
            <div className="mt-12 pt-10 border-t border-slate-100">
                <SectionHeader icon={Users} title="Guardians & Contacts" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {lead?.guardians?.length > 0 ? (
                        lead.guardians.map((guardian, i) => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={40} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{guardian.role}</p>
                                <p className="text-base font-black text-slate-900 mb-4 tracking-tight">{guardian.name}</p>
                                
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                            <Phone size={14} />
                                        </div>
                                        {guardian.phone}
                                    </div>
                                    {guardian.email && (
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                                <Mail size={14} />
                                            </div>
                                            {guardian.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <Users className="text-slate-300 mb-3" size={32} />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No guardian information available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Leads Section - Full Width */}
            <div className="mt-12 pt-10 border-t border-slate-100">
                <SectionHeader icon={LinkIcon} title="Related Leads (Siblings / Family)" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {lead?.lead_relationships?.length > 0 ? (
                        lead.lead_relationships.map((rel, i) => (
                            <div key={i} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{rel.type}</p>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{rel.related_lead?.name || 'Unknown Lead'}</p>
                                    {rel.is_main_contact && <p className="text-[10px] font-black text-red-500 mt-1 uppercase">Main Decision Maker</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <LinkIcon className="text-slate-300 mb-3" size={32} />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No siblings or relatives linked</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
