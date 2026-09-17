import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';

export function useUserManagement(users, currentStatus = 'active') {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        
        const query = searchQuery.toLowerCase();
        return users.filter(u => 
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.role?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menonaktifkan akun staff ini (soft delete)? Riwayat data tetap aman.')) {
            router.delete(route('admin.master.users.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const handleRestore = (id) => {
        if (confirm('Pulihkan akun user ini agar dapat aktif dan login kembali?')) {
            router.patch(route('admin.master.users.restore', id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('PERINGATAN: Tindakan ini akan menghapus akun secara permanen dari database. Lanjutkan?')) {
            router.delete(route('admin.master.users.force-delete', id), {
                preserveScroll: true,
            });
        }
    };

    const handleStatusChange = (status) => {
        router.get(route('admin.master.users.index'), { status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    return {
        isModalOpen,
        setIsModalOpen,
        selectedUser,
        setSelectedUser,
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
    };
}
