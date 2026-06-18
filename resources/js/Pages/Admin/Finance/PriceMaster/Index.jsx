import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Tag, Package, DollarSign } from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';
import Button from '@/Components/ui/Button';
import CreateEditPriceMasterModal from './modals/CreateEditPriceMasterModal';

export default function Index({ priceMasters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    const [search, setSearch] = useState('');

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
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <Button 
                        variant="secondary"
                        onClick={() => openModal(row)} 
                        className="p-2.5 rounded-xl hover:scale-110 active:scale-95 bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none border-none"
                        title="Edit Price"
                    >
                        <Edit2 size={16} />
                    </Button>
                    <Button 
                        variant="danger"
                        onClick={() => handleDelete(row.id)} 
                        className="p-2.5 rounded-xl hover:scale-110 active:scale-95 shadow-none"
                        title="Delete Price"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
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
                            Global session rates management
                        </p>
                    </div>

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
                </div>

                {/* Table Section */}
                <DataTable 
                    data={filteredPriceMasters}
                    columns={columns}
                    itemsPerPage={10}
                    isLoading={false}
                />

                {filteredPriceMasters.length === 0 && search && (
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
