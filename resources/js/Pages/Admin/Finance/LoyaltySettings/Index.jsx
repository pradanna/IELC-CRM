import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Award, Gift, Coffee, Tag, Settings, MoreVertical, Eye, Search, Save, Loader2 } from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';
import Button from '@/Components/ui/Button';
import TableActionDropdown from '@/Components/ui/TableActionDropdown';
import Checkbox from '@/Components/form/Checkbox';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import CreateEditLoyaltySettingModal from './modals/CreateEditLoyaltySettingModal';

export default function Index({ settings = [], siblingSettings = { use_sibling_discount: false, sibling_discount_percent: 0 } }) {
    const [activeTab, setActiveTab] = useState('loyalty');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');

    const siblingForm = useForm({
        use_sibling_discount: siblingSettings.use_sibling_discount,
        sibling_discount_percent: siblingSettings.sibling_discount_percent,
    });

    const openModal = (item = null, readOnly = false) => {
        setEditingItem(item);
        setIsReadOnly(readOnly);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setIsReadOnly(false);
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus tingkatan loyalty ini?')) {
            router.delete(route('admin.finance.loyalty-settings.destroy', id));
        }
    };

    const handleSiblingSubmit = (e) => {
        e.preventDefault();
        siblingForm.post(route('admin.finance.loyalty-settings.sibling'), {
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const filteredSettings = settings.filter(item => 
        item.tier_name.toLowerCase().includes(search.toLowerCase()) ||
        item.voucher_name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: 'Nama Tier',
            accessor: 'tier_name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight">{row.tier_name}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Voucher yang Didapat',
            accessor: 'voucher_name',
            render: (row) => (
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                    <Gift className="w-3.5 h-3.5 text-red-500" />
                    {row.voucher_name}
                </div>
            )
        },
        {
            header: 'Min Rejoins',
            accessor: 'min_rejoin_count',
            render: (row) => (
                <div className="text-xs font-black text-slate-700">
                    {row.min_rejoin_count}x Rejoin
                </div>
            )
        },
        {
            header: 'Diskon Tagihan',
            accessor: 'discount_amount',
            render: (row) => (
                <div className="inline-flex items-center px-3 py-1 bg-violet-50 text-violet-700 rounded-xl font-black text-xs border border-violet-100">
                    {formatCurrency(row.discount_amount)}
                </div>
            )
        },
        {
            header: 'Voucher Cafe',
            accessor: 'cafe_points',
            render: (row) => (
                <div className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-xl font-black text-xs border border-amber-100 gap-1.5">
                    <Coffee className="w-3.5 h-3.5" />
                    {formatCurrency(row.cafe_points)}
                </div>
            )
        },
        {
            header: 'Batas Gabung',
            accessor: 'use_join_date_limit',
            render: (row) => (
                <div className="text-xs">
                    {row.use_join_date_limit ? (
                        <div className="flex flex-col">
                            <span className="font-black text-red-600 uppercase text-[9px] tracking-wider">
                                {row.join_date_operator === 'before' ? 'Sebelum' : 'Mulai/Setelah'}
                            </span>
                            <span className="font-bold text-slate-700">
                                {new Date(row.join_date_limit).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    ) : (
                        <span className="text-slate-400 font-bold italic">Semua Siswa</span>
                    )}
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row, index) => {
                const isNearBottom = index >= filteredSettings.length - 2 && filteredSettings.length > 2;
                return (
                    <div className="flex justify-end">
                        <TableActionDropdown align={isNearBottom ? "top-right" : "right"}>
                            <TableActionDropdown.Item 
                                onClick={() => openModal(row, true)}
                                icon={Eye}
                            >
                                Lihat Detail
                            </TableActionDropdown.Item>
                            <TableActionDropdown.Item 
                                onClick={() => openModal(row, false)}
                                icon={Edit2}
                            >
                                Edit Tier
                            </TableActionDropdown.Item>
                            <TableActionDropdown.Item 
                                onClick={() => handleDelete(row.id)}
                                icon={Trash2}
                                variant="danger"
                            >
                                Hapus Tier
                            </TableActionDropdown.Item>
                        </TableActionDropdown>
                    </div>
                );
            }
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Diskon" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Pengaturan <span className="text-red-600">Diskon</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" />
                            Kelola voucher loyalty dan diskon sibling siswa
                        </p>
                    </div>

                    {activeTab === 'loyalty' && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <SearchInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari tier atau voucher..."
                                className="!max-w-md w-full"
                            />
                            <Button 
                                onClick={() => openModal()}
                                variant="primary"
                                icon={Plus}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-sm font-bold rounded-full shadow-lg shadow-red-600/20 whitespace-nowrap"
                            >
                                Tambah Tier Baru
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('loyalty')}
                            className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === 'loyalty'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Loyalty Voucher
                        </button>
                        <button
                            onClick={() => setActiveTab('sibling')}
                            className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === 'sibling'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Diskon Sibling
                        </button>
                    </nav>
                </div>

                {activeTab === 'loyalty' ? (
                    <>
                        {/* Table Section */}
                        <DataTable 
                            data={filteredSettings}
                            columns={columns}
                            itemsPerPage={10}
                            isLoading={false}
                        />

                        {filteredSettings.length === 0 && search && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="p-8 bg-slate-50 rounded-full">
                                    <Search className="w-12 h-12 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No results found</h3>
                                    <p className="text-slate-400 max-w-xs font-medium italic">Try adjusting your search criteria for "{search}"</p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-2xl">
                        <form onSubmit={handleSiblingSubmit} className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">PENGATURAN DISKON SIBLING</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi diskon otomatis untuk siswa bersaudara</p>
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-start gap-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                    <Checkbox
                                        id="use_sibling_discount"
                                        checked={siblingForm.data.use_sibling_discount}
                                        onChange={(e) => siblingForm.setData('use_sibling_discount', e.target.checked)}
                                        className="h-5 w-5 mt-0.5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                    <div>
                                        <InputLabel htmlFor="use_sibling_discount" value="Aktifkan Diskon Sibling" className="uppercase text-[10px] tracking-widest font-black text-slate-700 cursor-pointer select-none" />
                                        <p className="text-xs text-slate-400 font-medium mt-1">Bila diaktifkan, invoice baru untuk siswa yang memiliki saudara kandung (sibling) akan otomatis mendapatkan potongan diskon.</p>
                                    </div>
                                </div>
                                <InputError message={siblingForm.errors.use_sibling_discount} />

                                {siblingForm.data.use_sibling_discount && (
                                    <div className="space-y-2">
                                        <InputLabel htmlFor="sibling_discount_percent" value="Persentase Diskon Sibling (%)" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                                        <div className="relative">
                                            <TextInput
                                                id="sibling_discount_percent"
                                                type="number"
                                                value={siblingForm.data.sibling_discount_percent}
                                                onChange={(e) => siblingForm.setData('sibling_discount_percent', e.target.value)}
                                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 pr-12 font-bold text-slate-900 shadow-sm focus:ring-red-500"
                                                placeholder="0"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        </div>
                                        <InputError message={siblingForm.errors.sibling_discount_percent} />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex items-center justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={siblingForm.processing}
                                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-sm font-bold rounded-full shadow-lg shadow-red-600/20"
                                >
                                    {siblingForm.processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Simpan Pengaturan
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Loyalty Modal */}
            <CreateEditLoyaltySettingModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                settingItem={editingItem}
                isReadOnly={isReadOnly}
            />
        </AuthenticatedLayout>
    );
}
