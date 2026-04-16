import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export function usePublicRegistration(branch, initialData = null, token = null) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: initialData?.name || '',
        nickname: initialData?.nickname || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        gender: initialData?.gender || 'L',
        birth_date: initialData?.birth_date || '',
        branch_id: initialData?.branch_id || branch.id,
        school: initialData?.school || '',
        grade: initialData?.grade || '',
        province: initialData?.province || '',
        city: initialData?.city || '',
        address: initialData?.address || '',
        postal_code: initialData?.postal_code || '',
        guardian_data: initialData?.guardian_data || {
            father_name: '',
            father_phone: '',
            mother_name: '',
            mother_phone: ''
        },
        lead_source_id: initialData?.lead_source_id || '',
    });

    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    // Fetch cities when province changes
    useEffect(() => {
        if (data.province) {
            setLoadingCities(true);
            // Use the new public API for cities
            axios.get(route('public.join.cities', { province: data.province }))
                .then(res => {
                    setCities(res.data || []);
                    setLoadingCities(false);
                })
                .catch(() => {
                    setLoadingCities(false);
                });
        } else {
            setCities([]);
        }
    }, [data.province]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const targetRoute = token 
            ? route('public.join.filling.submit', token)
            : route('public.join.store');

        post(targetRoute, {
            onSuccess: () => !token && reset(), // Jangan reset jika cuma update agar user bisa lihat success state
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        wasSuccessful,
        cities,
        loadingCities,
        handleSubmit
    };
}
