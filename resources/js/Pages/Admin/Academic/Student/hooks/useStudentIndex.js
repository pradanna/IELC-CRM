import { useState } from 'react';
import { router } from '@inertiajs/react';

export const useStudentIndex = (filters) => {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.academic.students.index'), { search }, { preserveState: true });
    };

    return {
        search,
        setSearch,
        handleSearch
    };
};
