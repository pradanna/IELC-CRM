import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, User, Phone, Mail, Building2, MapPin, Globe, Loader2, Save, Search, Users } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import DatePicker from '@/Components/form/DatePicker';
import { Calendar } from 'lucide-react';

export default function CreateEditLeadModal({ 
    isOpen, 
    onClose,
    onSaveSuccess, 
    lead = null,
    ...customProps
}) {
    const { props: pageProps } = usePage();
    const phoneInputRef = React.useRef(null);

    /**
     * Normalizes a collection that might be a raw array or a wrapped resource object.
     */
    const normalizeCollection = (collection) => {
        if (Array.isArray(collection)) return collection;
        if (collection && Array.isArray(collection.data)) return collection.data;
        return [];
    };

    // Prioritize props passed manually, then page props
    const branches = normalizeCollection(customProps.branches || pageProps.branches);
    const sources = normalizeCollection(customProps.sources || pageProps.sources);
    const types = normalizeCollection(customProps.types || pageProps.types);
    const provinces = normalizeCollection(customProps.provinces || pageProps.provinces);
    const { auth } = pageProps;

    const normalizedSources = sources;
    const normalizedTypes = types;
    const normalizedBranches = branches;
    const normalizedProvinces = provinces;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        nickname: '',
        gender: '',
        phone: '',
        email: '',
        birth_date: '',
        school: '',
        grade: '',
        branch_id: '',
        lead_source_id: '',
        lead_type_id: '',
        is_online: false,
        province: '',
        city: '',
        address: '',
        postal_code: '',
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
                    nickname: lead.nickname || '',
                    gender: lead.gender || '',
                    phone: lead.phone || '',
                    email: lead.email || '',
                    birth_date: lead.birth_date || '',
                    school: lead.school || '',
                    grade: lead.grade || '',
                    branch_id: lead.branch_id || '',
                    lead_source_id: lead.lead_source_id || '',
                    lead_type_id: lead.lead_type_id || '',
                    is_online: lead.is_online || false,
                    province: lead.province || '',
                    city: lead.city || '',
                    address: lead.address || '',
                    postal_code: lead.postal_code || '',
                    guardians: initialGuardians,
                    relationships: initialRelationships,
                });
            } else {
                // Formatting for New Lead (reset or default values)
                
                setData({
                    name: '',
                    nickname: '',
                    gender: '',
                    phone: '',
                    email: '',
                    birth_date: '',
                    school: '',
                    grade: '',
                    branch_id: auth.user.branch_id || '',
                    lead_source_id: '',
                    lead_type_id: '',
                    is_online: false,
                    province: '',
                    city: '',
                    address: '',
                    postal_code: '',
                    guardians: [],
                    relationships: [],
                });

                // Smooth Auto-focus for WhatsApp field
                setTimeout(() => {
                    phoneInputRef.current?.focus();
                }, 400);
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
                const savedId = lead?.id || page.props.flash?.newLeadId;
                reset();
                onClose();
                if (onSaveSuccess) {
                    onSaveSuccess(savedId);
                }
            },
        };

        if (lead) {
            put(route('admin.crm.leads.update', lead.id), options);
        } else {
            post(route('admin.crm.leads.store'), options);
        }
    };

    const gradeOptions = [
        { value: 'PG', label: 'PG' },
        { value: 'TK', label: 'TK' },
        { value: 'SD', label: 'SD' },
        { value: 'SMP', label: 'SMP' },
        { value: 'SMA', label: 'SMA' },
        { value: 'KULIAH', label: 'KULIAH' },
        { value: 'UMUM', label: 'UMUM' }
    ];

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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-4 sm:w-full sm:max-w-[98%] border border-slate-200">
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                                            {/* Column 1: Personal Details */}
                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <User size={14} className="text-red-500" />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Data Personal</h3>
                                                    </div>
                                                    
                                                    <div className="space-y-5">
                                                        <PremiumFormGroup label="Nama Lengkap" error={errors.name} required>
                                                            <input
                                                                type="text"
                                                                value={data.name}
                                                                onChange={e => setData('name', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.name ? 'border-red-500 shadow-sm' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="Nama Lengkap"
                                                            />
                                                        </PremiumFormGroup>

                                                        <PremiumFormGroup label="Nama Panggilan" error={errors.nickname}>
                                                            <input
                                                                type="text"
                                                                value={data.nickname}
                                                                onChange={e => setData('nickname', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.nickname ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="Panggilan"
                                                            />
                                                        </PremiumFormGroup>

                                                        <div className={`p-5 rounded-xl border transition-all ${errors.gender ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/80 border-slate-200'}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Jenis Kelamin</p>
                                                                {errors.gender && <AlertCircle className="w-3 h-3 text-red-500" />}
                                                            </div>
                                                            <div className="flex gap-10">
                                                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="gender" 
                                                                        checked={data.gender === 'L'} 
                                                                        onChange={() => setData('gender', 'L')}
                                                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" 
                                                                    />
                                                                    <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">Laki-laki</span>
                                                                </label>
                                                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                                                    <input 
                                                                        type="radio" 
                                                                        name="gender" 
                                                                        checked={data.gender === 'P'} 
                                                                        onChange={() => setData('gender', 'P')}
                                                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300" 
                                                                    />
                                                                    <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">Perempuan</span>
                                                                </label>
                                                            </div>
                                                            {errors.gender && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.gender}</p>}
                                                        </div>

                                                        <PremiumFormGroup label="WhatsApp" error={errors.phone} required>
                                                            <input
                                                                type="tel"
                                                                ref={phoneInputRef}
                                                                value={data.phone}
                                                                onChange={e => setData('phone', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.phone ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="08..."
                                                            />
                                                        </PremiumFormGroup>

                                                        <PremiumFormGroup label="Email" error={errors.email}>
                                                            <input
                                                                type="email"
                                                                value={data.email}
                                                                onChange={e => setData('email', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="user@mail.com"
                                                            />
                                                        </PremiumFormGroup>

                                                        <PremiumFormGroup label="Tanggal Lahir" error={errors.birth_date}>
                                                            <DatePicker
                                                                value={data.birth_date}
                                                                onChange={val => setData('birth_date', val)}
                                                                placeholder="Pilih Tanggal Lahir"
                                                                inputClassName={`!py-3 !px-5 !rounded-xl ${errors.birth_date ? '!border-red-500' : '!border-slate-300'} !font-bold !text-sm text-slate-800 shadow-sm`}
                                                            />
                                                        </PremiumFormGroup>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Context & Geography */}
                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Globe size={14} className="text-red-500" />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Context & Geography</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <PremiumFormGroup label="Source" error={errors.lead_source_id}>
                                                            <PremiumSearchableSelect
                                                                options={normalizedSources.map(s => ({ value: s.id, label: s.name }))}
                                                                value={data.lead_source_id}
                                                                onChange={val => setData('lead_source_id', val)}
                                                                placeholder="Pilih Sumber"
                                                                className={`rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.lead_source_id ? 'border-red-500' : ''}`}
                                                            />
                                                        </PremiumFormGroup>
                                                        <PremiumFormGroup label="Lead Type" error={errors.lead_type_id}>
                                                            <PremiumSearchableSelect
                                                                options={normalizedTypes.map(t => ({ value: t.id, label: t.name }))}
                                                                value={data.lead_type_id}
                                                                onChange={val => setData('lead_type_id', val)}
                                                                placeholder="Pilih Tipe"
                                                                className={`rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.lead_type_id ? 'border-red-500' : ''}`}
                                                            />
                                                        </PremiumFormGroup>
                                                    </div>

                                                    <div className={`p-5 rounded-xl border transition-all ${errors.is_online ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/80 border-slate-200'}`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Inquiry Channel</p>
                                                            {errors.is_online && <AlertCircle className="w-3 h-3 text-red-500" />}
                                                        </div>
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
                                                        {errors.is_online && <p className="mt-2 text-[11px] font-bold text-red-500">{errors.is_online}</p>}
                                                    </div>

                                                    <div className="space-y-5 pt-4 border-t border-slate-100">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <PremiumFormGroup label="Provinsi" error={errors.province}>
                                                                <PremiumSearchableSelect
                                                                    options={normalizedProvinces.map(p => ({ value: p.name, label: p.name }))}
                                                                    value={data.province}
                                                                    onChange={val => setData(d => ({ ...d, province: val, city: '' }))}
                                                                    placeholder="Provinsi"
                                                                    className={`rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.province ? 'border-red-500' : ''}`}
                                                                />
                                                            </PremiumFormGroup>
                                                            <div className="relative">
                                                                <PremiumFormGroup label="Kota" error={errors.city}>
                                                                    <PremiumSearchableSelect
                                                                        options={cities.map(c => ({ value: c.name, label: c.name }))}
                                                                        value={data.city}
                                                                        onChange={val => setData('city', val)}
                                                                        placeholder={!data.province ? "---" : "Kota"}
                                                                        className={`${!data.province || loadingCities ? "opacity-50" : ""} rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.city ? 'border-red-500' : ''}`}
                                                                        disabled={!data.province || loadingCities}
                                                                    />
                                                                    {loadingCities && (
                                                                        <div className="absolute right-10 top-1/2 translate-y-[2px]">
                                                                            <Loader2 className="animate-spin text-red-500" size={14} />
                                                                        </div>
                                                                    )}
                                                                </PremiumFormGroup>
                                                            </div>
                                                        </div>

                                                        <PremiumFormGroup label="Alamat Lengkap" error={errors.address}>
                                                            <input
                                                                type="text"
                                                                value={data.address}
                                                                onChange={e => setData('address', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.address ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="Nama Jalan / Blok..."
                                                            />
                                                        </PremiumFormGroup>

                                                        <PremiumFormGroup label="Kode Pos" error={errors.postal_code}>
                                                            <input
                                                                type="text"
                                                                value={data.postal_code}
                                                                onChange={e => setData('postal_code', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.postal_code ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="57..."
                                                            />
                                                        </PremiumFormGroup>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Academic & Assignment */}
                                            <div className="space-y-10">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Building2 size={14} className="text-red-500" />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Academic & Assignment</h3>
                                                    </div>
                                                    <div className="space-y-5">
                                                        <PremiumFormGroup label="Sekolah" error={errors.school}>
                                                            <input
                                                                type="text"
                                                                value={data.school}
                                                                onChange={e => setData('school', e.target.value)}
                                                                className={`w-full px-5 py-3 bg-white border ${errors.school ? 'border-red-500' : 'border-slate-300'} rounded-xl text-sm font-bold text-slate-800 transition-all focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none placeholder:text-slate-400 shadow-sm`}
                                                                placeholder="Nama Sekolah 'diisi UMUM jika sudah tidak dalam fase sekolah'"
                                                            />
                                                        </PremiumFormGroup>
                                                        <PremiumFormGroup label="Kelas" error={errors.grade}>
                                                            <PremiumSearchableSelect
                                                                options={gradeOptions}
                                                                value={data.grade}
                                                                onChange={val => setData('grade', val)}
                                                                placeholder="Pilih Kelas"
                                                                className={`rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.grade ? 'border-red-500' : ''}`}
                                                            />
                                                        </PremiumFormGroup>
                                                    </div>

                                                    <div className="pt-6 border-t border-slate-100">
                                                        <PremiumFormGroup label="Target Branch" error={errors.branch_id} required>
                                                            <PremiumSearchableSelect
                                                                options={normalizedBranches.map(b => ({ value: b.id, label: b.name }))}
                                                                value={data.branch_id}
                                                                onChange={val => setData('branch_id', val)}
                                                                placeholder="Pilih Cabang"
                                                                icon={Building2}
                                                                className={`rounded-xl overflow-hidden shadow-sm h-[46px] ${errors.branch_id ? 'border-red-500' : ''}`}
                                                            />
                                                        </PremiumFormGroup>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 4: Guardians & Connections */}
                                            <div className="space-y-10">
                                                {/* Guardians Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <Users className="text-red-500" size={14} />
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
                                                                        </div>
                                                                        <input type="text" value={guardian.name} onChange={e => updateGuardian(index, 'name', e.target.value)} placeholder="Nama Guardian" className="w-full px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold" />
                                                                        <input type="tel" value={guardian.phone} onChange={e => updateGuardian(index, 'phone', e.target.value)} placeholder="Phone" className="w-full px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold" />
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
                                                            placeholder="Search other Leads..."
                                                            icon={Search}
                                                            className="h-[46px]"
                                                        />

                                                        <div className="space-y-3">
                                                            {data.relationships.length === 0 ? (
                                                                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide py-4 border-2 border-dashed border-slate-100 rounded-2xl">No linked leads</p>
                                                            ) : (
                                                                data.relationships.map((rel) => (
                                                                    <div key={rel.related_lead_id} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between group">
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-black text-slate-800">{rel.related_lead_name}</p>
                                                                            <div className="flex items-center gap-4 mt-2">
                                                                                <select label="Role" value={rel.type} onChange={(e) => updateRelationship(rel.related_lead_id, 'type', e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black text-red-500 uppercase tracking-widest outline-none cursor-pointer">
                                                                                    <option value="sibling">Sibling</option>
                                                                                    <option value="parent">Parent</option>
                                                                                    <option value="child">Child</option>
                                                                                </select>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input type="checkbox" checked={rel.is_main_contact} onChange={e => updateRelationship(rel.related_lead_id, 'is_main_contact', e.target.checked)} className="w-3 h-3 text-red-600 rounded" />
                                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Main</span>
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
