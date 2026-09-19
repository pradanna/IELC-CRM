import React from 'react';
import { Head } from '@inertiajs/react';
import { User, Building2, Phone, Edit, Trash2, Mail, RotateCcw, AlertTriangle } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateEditUserModal from './modals/CreateEditUserModal';
import { useUserManagement } from './hooks/useUserManagement';
import { Table, THead, TBody, TR, TH, TD } from '@/Components/ui/Table';
import UserRoleBadge from '@/Components/ui/UserRoleBadge';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';

export default function UserManagement({ users, roles, branches, currentStatus = 'active', counts = { active: 0, trashed: 0 } }) {
    const {
        isModalOpen,
        selectedUser,
        searchQuery,
        setSearchQuery,
        filteredUsers,
        handleAdd,
        handleEdit,
        handleDelete,
        handleRestore,
        handleForceDelete,
        handleStatusChange,
        closeModal
    } = useUserManagement(users, currentStatus);

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Administration</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            User Management
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-500 font-bold">
                                {currentStatus === 'trashed' ? counts.trashed : counts.active}
                            </span>
                        </h1>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleAdd}
                        icon={User}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/20"
                    >
                        Add New User
                    </Button>
                </div>

                {/* Status Filter Tabs & Search */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Status Toggle Tabs */}
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => handleStatusChange('active')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                currentStatus === 'active'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Active Users</span>
                            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-100 text-slate-600 font-bold">
                                {counts.active}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('trashed')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                currentStatus === 'trashed'
                                    ? 'bg-red-50 text-red-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Non-aktif / Trashed</span>
                            {counts.trashed > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-red-100 text-red-700 font-bold">
                                    {counts.trashed}
                                </span>
                            )}
                        </button>
                    </div>

                    <SearchInput
                        placeholder="Cari user berdasarkan nama, email, atau role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:flex-1 md:max-w-md"
                    />
                </div>

                {/* Users Table */}
                <Table>
                    <THead>
                        <TR hover={false}>
                            <TH>User & Contact</TH>
                            <TH>Role & Permissions</TH>
                            <TH>Branch</TH>
                            <TH className="text-right">Actions</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {filteredUsers.length === 0 ? (
                            <TR hover={false}>
                                <TD colSpan="4" className="py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                            <User size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">
                                            {currentStatus === 'trashed' 
                                                ? 'Tidak ada akun staf di tempat sampah.' 
                                                : 'Tidak ditemukan user yang cocok.'}
                                        </p>
                                    </div>
                                </TD>
                            </TR>
                        ) : (
                            filteredUsers.map((user) => (
                                <TR key={user.id} className={user.is_deleted ? 'bg-slate-50/50 opacity-80' : ''}>
                                    <TD>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-sm transition-transform ${
                                                user.is_deleted 
                                                    ? 'bg-slate-100 text-slate-400 border-slate-200' 
                                                    : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900">{user.name}</p>
                                                    {user.is_deleted && (
                                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-red-100 text-red-600">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
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
                                    </TD>
                                    <TD>
                                        <UserRoleBadge role={user.role} />
                                    </TD>
                                    <TD>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                            <Building2 size={14} className="text-slate-300" />
                                            {user.branch_name || 'No Branch'}
                                        </div>
                                    </TD>
                                    <TD>
                                        <div className="flex items-center justify-end gap-2">
                                            {user.is_deleted ? (
                                                <button
                                                    onClick={() => handleRestore(user.id)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                                                    title="Pulihkan Akun User"
                                                >
                                                    <RotateCcw size={14} />
                                                    <span>Pulihkan Akun</span>
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                        title="Nonaktifkan User (Soft Delete)"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </TD>
                                </TR>
                            ))
                        )}
                    </TBody>
                </Table>
            </div>

            <CreateEditUserModal
                isOpen={isModalOpen}
                onClose={closeModal}
                user={selectedUser}
                roles={roles}
                branches={branches}
            />
        </AuthenticatedLayout>
    );
}
