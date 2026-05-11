import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';

export function useUserManagement(users) {
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
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            router.delete(route('admin.master.users.destroy', id));
        }
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
        closeModal
    };
}
