import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Tag, Package, Save, CheckCircle2 } from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';
import Button from '@/Components/ui/Button';
import TableActionDropdown from '@/Components/ui/TableActionDropdown';
import CreateEditPriceMasterModal from './modals/CreateEditPriceMasterModal';

export default function Index({ priceMasters, initialFeeSettings = {} }) {
    const [activeTab, setActiveTab] = useState('session_rates');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    const [search, setSearch] = useState('');

    const initialFeeForm = useForm({
        registration_fee: initialFeeSettings.registration_fee || 25000,
        placement_test_fee: initialFeeSettings.placement_test_fee || 100000,
    });

    const handleSaveInitialFees = (e) => {
        e.preventDefault();
        initialFeeForm.post(route('admin.finance.price-masters.initial-fees'), {
            preserveScroll: true,
        });
    };

    const openModal = (priceItem = null) => {
        setEditingPrice(priceItem);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPrice(null);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this price master?')) {
            router.delete(route('admin.finance.price-masters.destroy', id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const filteredPriceMasters = priceMasters.filter(pm => 
        pm.name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: 'Product / Track Name',
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight">{row.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate per session</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Price per Session',
            accessor: 'price_per_session',
            render: (row) => (
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm border border-emerald-100">
                    {formatCurrency(row.price_per_session)}
                </div>
            )
        },
        {
            header: 'Last Updated',
            accessor: 'updated_at',
            render: (row) => (
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(row.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row, index) => {
                const total = filteredPriceMasters.length;
                const isNearBottom = total > 1 && index >= total - (total <= 2 ? 1 : 2);
                return (
                    <div className="flex justify-end">
                        <TableActionDropdown align={isNearBottom ? "top-right" : "right"}>
                            <TableActionDropdown.Item 
                                onClick={() => openModal(row)}
                                icon={Edit2}
                            >
                                Edit Price
                            </TableActionDropdown.Item>
                            <TableActionDropdown.Item 
                                onClick={() => handleDelete(row.id)}
                                icon={Trash2}
                                variant="danger"
                            >
                                Delete Price
                            </TableActionDropdown.Item>
                        </TableActionDropdown>
                    </div>
                );
            }
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Price Master" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Price <span className="text-red-600">Master</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            Global rates & initial fees management
                        </p>
                    </div>

                    {activeTab === 'session_rates' && (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <SearchInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search price tracks..."
                                className="!max-w-md w-full"
                            />
                            <Button 
                                onClick={() => openModal()}
                                variant="primary"
                                icon={Plus}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-sm font-bold rounded-full shadow-lg shadow-red-600/20 whitespace-nowrap"
                            >
                                Create New Price
                            </Button>
                        </div>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-8">
                    <button
                        onClick={() => setActiveTab('session_rates')}
                        className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
                            activeTab === 'session_rates'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Paket Kelas (Session Rates)
                    </button>
                    <button
                        onClick={() => setActiveTab('initial_fees')}
                        className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
                            activeTab === 'initial_fees'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Initial Placement Test & Registrasi
                    </button>
                </div>

                {/* Tab 1: Session Rates */}
                {activeTab === 'session_rates' && (
                    <>
                        <DataTable 
                            data={filteredPriceMasters}
                            columns={columns}
                            itemsPerPage={10}
                            isLoading={false}
                        />

                        {filteredPriceMasters.length === 0 && search && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="p-8 bg-slate-50 rounded-full">
                                    <Tag className="w-12 h-12 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No results found</h3>
                                    <p className="text-slate-400 max-w-xs font-medium italic">Try adjusting your search criteria for "{search}"</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Tab 2: Initial Fees */}
                {activeTab === 'initial_fees' && (
                    <div className="max-w-2xl bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pengaturan Harga Initial Fees</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                                Nilai default untuk tombol Addon pada pembuatan Invoice (Plotting Lead / Rejoin)
                            </p>
                        </div>

                        <form onSubmit={handleSaveInitialFees} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                    Harga Placement Test Fee (Rp)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={initialFeeForm.data.placement_test_fee}
                                        onChange={(e) => initialFeeForm.setData('placement_test_fee', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                        placeholder="100000"
                                    />
                                </div>
                                {initialFeeForm.errors.placement_test_fee && (
                                    <p className="text-xs font-bold text-red-600">{initialFeeForm.errors.placement_test_fee}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                    Harga Registration Fee (Rp)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={initialFeeForm.data.registration_fee}
                                        onChange={(e) => initialFeeForm.setData('registration_fee', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                        placeholder="25000"
                                    />
                                </div>
                                {initialFeeForm.errors.registration_fee && (
                                    <p className="text-xs font-bold text-red-600">{initialFeeForm.errors.registration_fee}</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                <Button
                                    type="submit"
                                    disabled={initialFeeForm.processing}
                                    variant="primary"
                                    icon={Save}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-sm font-bold rounded-2xl shadow-lg shadow-red-600/20"
                                >
                                    {initialFeeForm.processing ? 'Saving...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Price Modal */}
            <CreateEditPriceMasterModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                priceItem={editingPrice}
            />
        </AuthenticatedLayout>
    );
}
