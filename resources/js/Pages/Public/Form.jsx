import { Head, Link } from '@inertiajs/react';
import { 
    User, Mail, Phone, MapPin, Building2, 
    GraduationCap, Calendar, ArrowRight, 
    ChevronDown, Loader2, CheckCircle2,
    Shield,
    ChevronLeft,
    Users
} from 'lucide-react';
import axios from 'axios';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import DatePicker from '@/Components/form/DatePicker';
import { usePublicRegistration } from './hooks/usePublicRegistration';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';

export default function Form({ branch, provinces, leadSources = [], initialData = null, token = null }) {
    const { 
        data, setData, errors, processing, wasSuccessful, 
        cities, loadingCities, handleSubmit 
    } = usePublicRegistration(branch, initialData, token);

    if (wasSuccessful) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                    <CheckCircle2 className="text-green-600" size={48} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Terima Kasih!</h1>
                <p className="text-slate-500 max-w-md font-medium mb-12">
                    Pendaftaran Anda di <strong>IELC {branch.name}</strong> telah berhasil kami terima. <br />
                    .
                </p>
                {token ? (
                    <a 
                        href="https://ielc.co.id/"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all"
                    >
                        Kembali ke Beranda
                    </a>
                ) : (
                    <Link 
                        href={route('public.join.welcome', branch.name.toLowerCase())}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all"
                    >
                        Kembali ke Beranda
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-red-100 selection:text-red-900 overflow-x-hidden">
            <Head title={`Pendaftaran IELC ${branch.name}`} />

            {/* Layout Container */}
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Header Link */}
                {token ? (
                    <a 
                        href="https://ielc.co.id/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors mb-12 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Kembali</span>
                    </a>
                ) : (
                    <Link 
                        href={route('public.join.welcome', branch.name.toLowerCase())}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors mb-12 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Kembali</span>
                    </Link>
                )}

                <div className="flex flex-col md:items-center justify-center gap-8 mb-16 text-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-red-100">
                            <Shield size={12} />
                            Official Enrollment Portal
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
                            {token ? (
                                <>Update Your <br /> <span className="text-red-600">IELC Profile.</span></>
                            ) : (
                                <>Join the <br /> <span className="text-red-600">Circle of Excellence.</span></>
                            )}
                        </h1>
                        <p className="text-slate-500 font-medium tracking-tight max-w-2xl mx-auto">
                            {token 
                                ? "Mohon lengkapi atau perbarui data diri Anda agar kami dapat memberikan pelayanan terbaik."
                                : `Lengkapi data diri Anda untuk memulai perjalanan akademik yang luar biasa bersama IELC ${branch.name}.`
                            }
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Identitas */}
                    <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-100/50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                <User size={16} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-red-600 decoration-4 underline-offset-8">Data Identitas</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Row 1: Name & Nickname */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <InputLabel value="Nama Lengkap *" className="mb-3 ml-1" />
                                        <input 
                                            type="text" 
                                            required 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Nama Lengkap"
                                        />
                                        <InputError message={errors.name} className="mt-2 ml-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Nama Panggilan" className="mb-3 ml-1" />
                                        <input 
                                            type="text" 
                                            value={data.nickname}
                                            onChange={e => setData('nickname', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Nickname"
                                        />
                                    </div>
                            </div>

                            {/* Row 2: WhatsApp & Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <InputLabel value="WhatsApp Anda *" className="mb-3 ml-1" />
                                        <input 
                                            type="tel" 
                                            required 
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Contoh: 0812..."
                                        />
                                        <InputError message={errors.phone} className="mt-2 ml-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Email Anda" className="mb-3 ml-1" />
                                        <input 
                                            type="email" 
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="nama@email.com"
                                        />
                                    </div>
                            </div>

                            {/* Row 3: Gender & Birth Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <InputLabel value="Jenis Kelamin" className="mb-3 ml-1" />
                                        <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-300 h-[56px] items-center">
                                            <button 
                                                type="button" 
                                                onClick={() => setData('gender', 'L')}
                                                className={`flex-1 h-full rounded-xl text-xs font-black transition-all ${data.gender === 'L' ? 'bg-red-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                            >L (Laki-laki)</button>
                                            <button 
                                                type="button" 
                                                onClick={() => setData('gender', 'P')}
                                                className={`flex-1 h-full rounded-xl text-xs font-black transition-all ${data.gender === 'P' ? 'bg-red-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                            >P (Perempuan)</button>
                                        </div>
                                    </div>
                                    <div>
                                        <InputLabel value="Tgl Lahir" className="mb-3 ml-1" />
                                        <DatePicker 
                                            value={data.birth_date}
                                            onChange={val => setData('birth_date', val)}
                                            inputClassName="h-[56px] px-6 py-4 bg-slate-50 border-slate-300 rounded-2xl text-sm font-bold text-slate-900"
                                            placeholder="Pilih Tanggal"
                                        />
                                    </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Domisili & Akademik */}
                    <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-100/50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                <MapPin size={16} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-red-600 decoration-4 underline-offset-8">Akademik & Domisili</h2>
                        </div>

                        <div className="space-y-8">
                            {/* Row 1: Comprehensive Geography (8-column grid) */}
                            <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
                                <div className="md:col-span-3">
                                    <InputLabel value="Alamat Lengkap" className="mb-3 ml-1" />
                                    <input 
                                        type="text" 
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Jl. Merdeka No. 123"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <InputLabel value="Provinsi" className="mb-3 ml-1" />
                                    <select 
                                        value={data.province}
                                        onChange={e => setData('province', e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all"
                                    >
                                        <option value="">Pilih Provinsi</option>
                                        {provinces.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2 relative">
                                    <InputLabel value="Kota / Kabupaten" className="mb-3 ml-1" />
                                    <select 
                                        value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                        disabled={!data.province || loadingCities}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all disabled:opacity-50"
                                    >
                                        <option value="">{!data.province ? "Pilih Provinsi Dulu" : "Pilih Kota"}</option>
                                        {cities.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    {loadingCities && <div className="absolute right-12 top-[62%]"><Loader2 className="animate-spin text-red-600" size={16} /></div>}
                                </div>
                                <div className="md:col-span-1">
                                    <InputLabel value="Kode Pos" className="mb-3 ml-1 text-center" />
                                    <input 
                                        type="text" 
                                        value={data.postal_code}
                                        onChange={e => setData('postal_code', e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all text-center"
                                        placeholder="57..."
                                    />
                                </div>
                            </div>

                            {/* Row 2: Academic (1/2 split) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <InputLabel value="Nama Sekolah" className="mb-3 ml-1" />
                                    <div className="relative">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            type="text" 
                                            value={data.school}
                                            onChange={e => setData('school', e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Nama Sekolah / 'diisi UMUM jika sudah tidak dalam fase sekolah'"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Kelas / Level" className="mb-3 ml-1" />
                                    <select 
                                        value={data.grade}
                                        onChange={e => setData('grade', e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all"
                                    >
                                        <option value="">Pilih Jenjang</option>
                                        <option value="PG">Playgroup (PG)</option>
                                        <option value="TK">TK</option>
                                        <option value="SD">SD</option>
                                        <option value="SMP">SMP</option>
                                        <option value="SMA">SMA</option>
                                        <option value="KULIAH">Kuliah</option>
                                        <option value="UMUM">Umum</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Lead Source Selection */}
                    <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-100/50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                <ArrowRight size={16} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-red-600 decoration-4 underline-offset-8">Information Source</h2>
                        </div>

                        <div className="space-y-6">
                            <InputLabel value="Kira-kira, Anda tahu IELC dari mana? *" className="mb-6 ml-1 !text-sm" />
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {leadSources.map((source) => (
                                    <label 
                                        key={source.value}
                                        className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            data.lead_source_id === source.value
                                            ? 'border-red-600 bg-red-50/50 ring-4 ring-red-500/5'
                                            : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <input 
                                            type="radio"
                                            name="lead_source_id"
                                            value={source.value}
                                            checked={data.lead_source_id === source.value}
                                            onChange={() => setData('lead_source_id', source.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                data.lead_source_id === source.value
                                                ? 'border-red-600'
                                                : 'border-slate-300 bg-white'
                                            }`}>
                                                {data.lead_source_id === source.value && (
                                                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                                                )}
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${
                                                data.lead_source_id === source.value
                                                ? 'text-red-600'
                                                : 'text-slate-500'
                                            }`}>
                                                {source.label}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.lead_source_id} className="mt-4 ml-1" />
                        </div>
                    </div>

                    {/* Section 4: Orang Tua (Optional) */}
                    <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-100/50">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                <Users size={16} />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 underline decoration-red-600 decoration-4 underline-offset-8">Data Wali (Informasi Tambahan)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <InputLabel value="Nama Ayah / Wali" className="mb-3 ml-1" />
                                    <input 
                                        type="text" 
                                        value={data.guardian_data.father_name}
                                        onChange={e => setData('guardian_data', {...data.guardian_data, father_name: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Nama Ayah"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="WhatsApp Ayah" className="mb-3 ml-1" />
                                    <input 
                                        type="tel" 
                                        value={data.guardian_data.father_phone}
                                        onChange={e => setData('guardian_data', {...data.guardian_data, father_phone: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <InputLabel value="Nama Ibu" className="mb-3 ml-1" />
                                    <input 
                                        type="text" 
                                        value={data.guardian_data.mother_name}
                                        onChange={e => setData('guardian_data', {...data.guardian_data, mother_name: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Nama Ibu"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="WhatsApp Ibu" className="mb-3 ml-1" />
                                    <input 
                                        type="tel" 
                                        value={data.guardian_data.mother_phone}
                                        onChange={e => setData('guardian_data', {...data.guardian_data, mother_phone: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-red-500/5 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Area */}
                    <div className="pt-10 flex flex-col items-center">
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="group relative w-full md:w-auto px-16 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-red-600 hover:scale-[1.02] shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-4">
                                {processing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Sedang Mengirim...
                                    </>
                                ) : (
                                    <>
                                        {token ? 'Ajukan Perubahan Data' : 'Simpan & Daftar Sekarang'}
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendaftaran Anda akan segera diproses oleh tim Frontdesk.</p>
                    </div>
                </form>
            </div>

            {/* Subtle Gradient Footer */}
            <div className="py-12 border-t border-slate-100 text-center">
                 <div className="flex items-center justify-center gap-3 mb-4 opacity-20">
                    <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">IELC <span className="text-red-600">CRM</span></span>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Official Portal &bull; Branch {branch.name}</p>
            </div>
        </div>
    );
}
