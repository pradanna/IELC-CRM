import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { User, Shield, Building2, Phone, MapPin, Edit, Trash2, Plus, Search, Mail, Loader2 } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateEditUserModal from './modals/CreateEditUserModal';

export default function UserManagement({ users, roles, branches }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            router.delete(route('admin.master.users.destroy', id));
        }
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'superadmin': return 'bg-red-50 text-red-600 border-red-100';
            case 'marketing': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'teacher': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'frontdesk': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'finance': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Administration</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            User Management
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-500 font-bold">{users.length}</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedUser(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/10 active:scale-95"
                    >
                        <Plus size={16} />
                        Add New User
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari user berdasarkan nama, email, atau role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User & Contact</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Permissions</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                                    <User size={32} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 italic">Tidak ditemukan user yang cocok.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-black text-lg border border-red-100 shadow-sm group-hover:scale-105 transition-transform">
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">{user.name}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                                                <Mail size={12} className="text-slate-300" />
                                                                {user.email}
                                                            </div>
                                                            {user.phone && (
                                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                                                    <Phone size={12} className="text-slate-300" />
                                                                    {user.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getRoleColor(user.role)}`}>
                                                    <Shield size={12} />
                                                    {user.role}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                    <Building2 size={14} className="text-slate-300" />
                                                    {user.branch_name || 'No Branch'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CreateEditUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                roles={roles}
                branches={branches}
            />
        </AuthenticatedLayout>
    );
}
