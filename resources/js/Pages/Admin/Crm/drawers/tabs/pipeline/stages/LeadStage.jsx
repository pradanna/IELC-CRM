import React from 'react';
import { User, Users, Globe, MapPin, ChevronDown, Calendar } from 'lucide-react';
import { InfoItem } from '../../../components/DrawerUI';

export default function LeadStage({
    lead,
    leadName,
    setLeadName,
    leadNickname,
    setLeadNickname,
    leadProvince,
    setLeadProvince,
    leadCity,
    setLeadCity,
    leadAddress,
    setLeadAddress,
    cities,
    loadingCities,
    updatingQualification,
    handleUpdateQualification,
    normalizedLeadTypes,
    normalizedLeadSources,
    normalizedProvinces,
    FieldStatus
}) {
    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            {/* Editable Nama Lengkap */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Nama Lengkap</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <User size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <input
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        onBlur={() => handleUpdateQualification({ name: leadName }, 'name')}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateQualification({ name: leadName }, 'name')}
                        disabled={updatingQualification}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none focus:ring-0"
                        placeholder="Nama Lengkap..."
                    />
                </div>
                <FieldStatus name="name" />
            </div>

            {/* Editable Nama Panggilan */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Nama Panggilan</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <User size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <input
                        type="text"
                        value={leadNickname}
                        onChange={(e) => setLeadNickname(e.target.value)}
                        onBlur={() => handleUpdateQualification({ nickname: leadNickname }, 'nickname')}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateQualification({ nickname: leadNickname }, 'nickname')}
                        disabled={updatingQualification}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none focus:ring-0"
                        placeholder="Nama Panggilan..."
                    />
                </div>
                <FieldStatus name="nickname" />
            </div>

            {/* Editable Program Minat Dropdown */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Program Minat</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <Users size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={lead?.lead_type_id || ''}
                            onChange={(e) => handleUpdateQualification({ lead_type_id: e.target.value || null, is_online: lead.is_online }, 'lead_type_id')}
                            disabled={updatingQualification}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="">Pilih Tipe...</option>
                            {normalizedLeadTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="lead_type_id" />
            </div>

            {/* Editable Marketing Source Dropdown */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Lead Source</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <Globe size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={lead?.lead_source_id || ''}
                            onChange={(e) => handleUpdateQualification({ lead_source_id: e.target.value || null }, 'lead_source_id')}
                            disabled={updatingQualification}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="">Pilih Sumber...</option>
                            {normalizedLeadSources.map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="lead_source_id" />
            </div>

            {/* Provinsi Dropdown */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Provinsi</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <MapPin size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={leadProvince}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLeadProvince(val);
                                setLeadCity('');
                                handleUpdateQualification({ province: val, city: '' }, 'province');
                            }}
                            disabled={updatingQualification}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="">Pilih Provinsi...</option>
                            {normalizedProvinces.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="province" />
            </div>

            {/* Kota Dropdown */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Kota</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <MapPin size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={leadCity}
                            onChange={(e) => {
                                const val = e.target.value;
                                setLeadCity(val);
                                handleUpdateQualification({ city: val }, 'city');
                            }}
                            disabled={updatingQualification || !leadProvince || loadingCities}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="">{!leadProvince ? 'Pilih Provinsi...' : 'Pilih Kota...'}</option>
                            {cities.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="city" />
            </div>

            {/* Alamat Lengkap */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative group col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Alamat Lengkap</label>
                <div className="flex items-start gap-3 mt-1.5 relative">
                    <MapPin size={16} className="text-slate-300 flex-shrink-0 mt-0.5 group-hover:text-red-400 transition-colors" />
                    <textarea
                        value={leadAddress}
                        onChange={(e) => setLeadAddress(e.target.value)}
                        onBlur={() => handleUpdateQualification({ address: leadAddress }, 'address')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleUpdateQualification({ address: leadAddress }, 'address');
                            }
                        }}
                        disabled={updatingQualification}
                        rows={2}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none focus:ring-0 resize-none"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan..."
                    />
                </div>
                <FieldStatus name="address" />
            </div>

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
    );
}
