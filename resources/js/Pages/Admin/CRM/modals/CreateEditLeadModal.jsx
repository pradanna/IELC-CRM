import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, User, Phone, Mail, Building2, MapPin, Globe, Loader2, Save, Search } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import DatePicker from '@/Components/form/DatePicker';
import { Calendar } from 'lucide-react';

export default function CreateEditLeadModal({ 
    isOpen, 
    onClose,
    onSaveSuccess, 
    lead = null, // The lead being edited, if any
    branches = [], 
    sources = [], 
    types = [], 
    provinces = [] 
}) {
    const { auth } = usePage().props;
    const phoneInputRef = React.useRef(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        email: '',
        birth_date: '',
        branch_id: '',
        lead_source_id: '',
        lead_type_id: '',
        is_online: false,
        province: '',
        city: '',
        guardians: [], // Array of { name, phone, role, occupation, is_main_contact }
        relationships: [], // Array of { related_lead_id, related_lead_name, type, is_main_contact }
    });

    const [relatableOptions, setRelatableOptions] = useState([]);
    const [loadingRelatables, setLoadingRelatables] = useState(false);

    const fetchRelatables = (search = '') => {
        setLoadingRelatables(true);
        axios.get(route('admin.crm.leads.relatables', { search }))
            .then(response => {
                setRelatableOptions(response.data);
                setLoadingRelatables(false);
            })
            .catch(error => {
                console.error('Error fetching relatables:', error);
                setLoadingRelatables(false);
            });
    };

    // Fetch initial relatables on open
    useEffect(() => {
        if (isOpen) fetchRelatables();
    }, [isOpen]);

    const addRelationship = (relId, relName) => {
        if (!relId || data.relationships.find(r => r.related_lead_id === relId)) return;
        setData('relationships', [
            ...data.relationships,
            { related_lead_id: relId, related_lead_name: relName, type: 'sibling', is_main_contact: false }
        ]);
    };

    const removeRelationship = (relId) => {
        setData('relationships', data.relationships.filter(r => r.related_lead_id !== relId));
    };

    const updateRelationship = (relId, field, value) => {
        setData('relationships', data.relationships.map(r => 
            r.related_lead_id === relId ? { ...r, [field]: value } : r
        ));
    };

    const addGuardian = () => {
        setData('guardians', [
            ...data.guardians,
            { name: '', phone: '', role: 'ibu', occupation: '', is_main_contact: false }
        ]);
    };

    const removeGuardian = (index) => {
        setData('guardians', data.guardians.filter((_, i) => i !== index));
    };

    const updateGuardian = (index, field, value) => {
        const newGuardians = [...data.guardians];
        newGuardians[index][field] = value;
        setData('guardians', newGuardians);
    };

    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    // Initial defaults for New Lead OR Prefill for Edit
    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (lead) {
                // Formatting guardians and relationships if needed
                const initialGuardians = lead?.guardians?.length > 0 ? lead.guardians.map(g => ({
                    role: g.role || 'ibu',
                    name: g.name || '',
                    phone: g.phone || '',
                    occupation: g.occupation || '',
                    is_main_contact: g.is_main_contact || false
                })) : [];
                
                const initialRelationships = lead?.lead_relationships?.length > 0 ? lead.lead_relationships.map(r => ({
                    related_lead_id: r.related_lead_id,
                    related_lead_name: r.related_lead?.name || 'Unknown', // assuming relation is loaded
                    type: r.type || 'sibling',
                    is_main_contact: r.is_main_contact || false
                })) : [];

                setData({
                    name: lead.name || '',
                    phone: lead.phone || '',
                    email: lead.email || '',
                    birth_date: lead.birth_date || '',
                    branch_id: lead.branch_id || '',
                    lead_source_id: lead.lead_source_id || '',
                    lead_type_id: lead.lead_type_id || '',
                    is_online: lead.is_online || false,
                    province: lead.province || '',
                    city: lead.city || '',
                    guardians: initialGuardians,
                    relationships: initialRelationships,
                });
            } else if (!data.name && !data.phone) { 
                const now = new Date();
                const year = String(now.getFullYear()).slice(-2);
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                setData(d => ({
                    ...d,
                    name: `lead${year}${month}${day}${hours}${minutes}`,
                    branch_id: auth.user.branch_id || d.branch_id,
                }));

                setTimeout(() => {
                    phoneInputRef.current?.focus();
                }, 100);
            }
        }
    }, [isOpen, lead]);

    // Fetch cities when province changes
    useEffect(() => {
        if (data.province) {
            setLoadingCities(true);
            axios.get(route('admin.crm.cities', { province: data.province }))
                .then(response => {
                    setCities(response.data);
                    setLoadingCities(false);
                })
                .catch(error => {
                    console.error('Error fetching cities:', error);
                    setLoadingCities(false);
                });
        } else {
            setCities([]);
        }
    }, [data.province]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const options = {
            onSuccess: (page) => {
                reset();
                onClose();
                if (onSaveSuccess && page.props.flash?.newLeadId) {
                    onSaveSuccess(page.props.flash.newLeadId);
                }
            },
        };

        if (lead) {
            put(route('admin.crm.leads.update', lead.id), options);
        } else {
            post(route('admin.crm.leads.store'), options);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/20 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-7xl border border-slate-200">
                                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                                    {/* Minimalist Header */}
                                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                                        <div>
                                            <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight">
                                                {lead ? 'Edit Lead Data' : 'Create New Lead'}
                                            </Dialog.Title>
                                            <p className="text-[11px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">Silakan lengkapi formulir di bawah ini dengan benar.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="text-slate-400 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-slate-100"
                                            onClick={onClose}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Balanced Form Content */}
                                    <div className="max-h-[75vh] overflow-y-auto px-8 py-10 bg-white">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
                                            {/* Column 1 & 2: Primary Data */}
                                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-r border-slate-100 pr-12">
                                                {/* Column 1: Personal Details */}
                                                <div className="space-y-8">
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <User size={14} className="text-red-500" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Data Personal</h3>
                                                        </div>
                                                        
                                                        <div className="space-y-5">
                                                            <div>
                                                                <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Nama Lengkap <span className="text-red-500">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    value={data.name}
                                                                    onChange={e => setData('name', e.target.value)}
                                                                    className={`w-full px-4 py-3.5 bg-white border ${errors.name ? 'border-red-500 shadow-sm' : 'border-slate-300'} rounded-2xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                    placeholder="Masukkan nama lengkap..."
                                                                />
                                                                {errors.name && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.name}</p>}
                                                            </div>

                                                            <div className="space-y-5">
                                                                <div>
                                                                    <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">WhatsApp <span className="text-red-500">*</span></label>
                                                                    <input
                                                                        type="tel"
                                                                        ref={phoneInputRef}
                                                                        value={data.phone}
                                                                        onChange={e => setData('phone', e.target.value)}
                                                                        className={`w-full px-4 py-3.5 bg-white border ${errors.phone ? 'border-red-500' : 'border-slate-300'} rounded-2xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                        placeholder="08..."
                                                                    />
                                                                    {errors.phone && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.phone}</p>}
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Email</label>
                                                                    <input
                                                                        type="email"
                                                                        value={data.email}
                                                                        onChange={e => setData('email', e.target.value)}
                                                                        className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm"
                                                                        placeholder="user@mail.com"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider text-slate-900">Date of Birth</label>
                                                                    <DatePicker
                                                                        value={data.birth_date}
                                                                        onChange={val => setData('birth_date', val)}
                                                                        placeholder="Pilih Tanggal Lahir"
                                                                        inputClassName="!py-3.5 !px-4 !rounded-2xl !border-slate-300 !font-bold !text-sm text-slate-800 shadow-sm"
                                                                    />
                                                                    {errors.birth_date && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.birth_date}</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Building2 size={14} className="text-red-500" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Assignment</h3>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Target Branch <span className="text-red-500">*</span></label>
                                                            <PremiumSearchableSelect
                                                                options={branches.map(b => ({ value: b.id, label: b.name }))}
                                                                value={data.branch_id}
                                                                onChange={val => setData('branch_id', val)}
                                                                placeholder="Pilih Cabang"
                                                                icon={Building2}
                                                            />
                                                            {errors.branch_id && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.branch_id}</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Context & Geography */}
                                                <div className="space-y-8">
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Globe size={14} className="text-red-500" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Context</h3>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Source</label>
                                                                <PremiumSearchableSelect
                                                                    options={sources.map(s => ({ value: s.id, label: s.name }))}
                                                                    value={data.lead_source_id}
                                                                    onChange={val => setData('lead_source_id', val)}
                                                                    placeholder="Pilih Sumber"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Lead Type</label>
                                                                <PremiumSearchableSelect
                                                                    options={types.map(t => ({ value: t.id, label: t.name }))}
                                                                    value={data.lead_type_id}
                                                                    onChange={val => setData('lead_type_id', val)}
                                                                    placeholder="Pilih Tipe"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="p-5 bg-slate-50/80 rounded-3xl border border-slate-200">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-4">Inquiry Channel</p>
                                                            <div className="flex gap-10 mt-1">
                                                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="is_online" 
                                                                        checked={!data.is_online} 
                                                                        onChange={() => setData('is_online', false)}
                                                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" 
                                                                    />
                                                                    <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">Offline</span>
                                                                </label>
                                                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="is_online" 
                                                                        checked={data.is_online} 
                                                                        onChange={() => setData('is_online', true)}
                                                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" 
                                                                    />
                                                                    <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">Online</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <MapPin size={14} className="text-red-500" />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Geography</h3>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Provinsi</label>
                                                                <PremiumSearchableSelect
                                                                    options={provinces.map(p => ({ value: p.name, label: p.name }))}
                                                                    value={data.province}
                                                                    onChange={val => setData(d => ({ ...d, province: val, city: '' }))}
                                                                    placeholder="Pilih Provinsi"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">Kota / Kabupaten</label>
                                                                <PremiumSearchableSelect
                                                                    options={cities.map(c => ({ value: c.name, label: c.name }))}
                                                                    value={data.city}
                                                                    onChange={val => setData('city', val)}
                                                                    placeholder={!data.province ? "Pilih Provinsi Dulu" : "Pilih Kota"}
                                                                    className={!data.province || loadingCities ? "opacity-50" : ""}
                                                                    disabled={!data.province || loadingCities}
                                                                />
                                                                {loadingCities && (
                                                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 mt-3">
                                                                        <Loader2 className="animate-spin text-red-500" size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Guardian / Sibling Section */}
                                            <div className="lg:col-span-4 space-y-10">
                                                {/* Guardians Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <User className="text-red-500" size={14} />
                                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Guardians (Non-Lead)</h3>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={addGuardian}
                                                            className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {data.guardians.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                                                                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">No additional guardians</p>
                                                            </div>
                                                        ) : (
                                                            data.guardians.map((guardian, index) => (
                                                                <div key={index} className="group relative p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                                                    <button type="button" onClick={() => removeGuardian(index)} className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:text-red-600 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <PremiumSearchableSelect 
                                                                                options={[
                                                                                    { value: 'ayah', label: 'Ayah' },
                                                                                    { value: 'ibu', label: 'Ibu' },
                                                                                    { value: 'wali', label: 'Wali' }
                                                                                ]}
                                                                                value={guardian.role}
                                                                                onChange={val => updateGuardian(index, 'role', val)}
                                                                                placeholder="Role"
                                                                            />
                                                                            <div className="flex items-center gap-2 pl-2 hidden">
                                                                                <input type="checkbox" checked={guardian.is_main_contact} onChange={e => updateGuardian(index, 'is_main_contact', e.target.checked)} className="w-3.5 h-3.5 text-red-600 rounded" />
                                                                                <span className="text-[9px] font-black text-slate-400 uppercase">Main</span>
                                                                            </div>
                                                                        </div>
                                                                        <input type="text" value={guardian.name} onChange={e => updateGuardian(index, 'name', e.target.value)} placeholder="Nama Guardian" className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold" />
                                                                        <input type="tel" value={guardian.phone} onChange={e => updateGuardian(index, 'phone', e.target.value)} placeholder="Phone" className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold" />
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lead Relationships Section */}
                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="text-red-500" size={14} />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Lead Relationships</h3>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <PremiumSearchableSelect 
                                                            options={relatableOptions}
                                                            onChange={(val) => {
                                                                const label = relatableOptions.find(o => o.value === val)?.label;
                                                                addRelationship(val, label);
                                                            }}
                                                            placeholder="Search other Leads to link..."
                                                            icon={Search}
                                                        />

                                                        <div className="space-y-3">
                                                            {data.relationships.length === 0 ? (
                                                                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide py-4 border-2 border-dashed border-slate-100 rounded-2xl">No siblings/parents linked</p>
                                                            ) : (
                                                                data.relationships.map((rel) => (
                                                                    <div key={rel.related_lead_id} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between group">
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-black text-slate-800">{rel.related_lead_name}</p>
                                                                            <div className="flex items-center gap-4 mt-2">
                                                                                <select label="Role" value={rel.type} onChange={(e) => updateRelationship(rel.related_lead_id, 'type', e.target.value)} className="bg-transparent border-none p-0 text-[9px] font-black text-red-500 uppercase tracking-widest outline-none cursor-pointer">
                                                                                    <option value="sibling">Sibling</option>
                                                                                    <option value="parent">Parent</option>
                                                                                    <option value="child">Child</option>
                                                                                </select>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input type="checkbox" checked={rel.is_main_contact} onChange={e => updateRelationship(rel.related_lead_id, 'is_main_contact', e.target.checked)} className="w-3 h-3 text-red-600 rounded" />
                                                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Main Link</span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                        <button type="button" onClick={() => removeRelationship(rel.related_lead_id)} className="text-red-300 hover:text-red-600 transition-colors">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest"
                                            onClick={onClose}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-600/10 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            <span>Simpan Lead</span>
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
