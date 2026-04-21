import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function useWhatsappNotification() {
    const [notifications, setNotifications] = useState([]);
    const { auth } = usePage().props;
    const user = auth.user;

    useEffect(() => {
        if (!window.Echo) {
            console.warn('⚠️ [WA-NOTIF] Echo is not initialized yet. Waiting...');
            return;
        }

        console.log(`🚀 [WA-NOTIF] Listening on public channel: whatsapp-messages (User: ${user.name}, Role: ${user.role})`);

        window.Echo.connector.pusher.connection.bind('state_change', (states) => {
            console.log('📡 [WA-NOTIF] Reverb Connection State:', states.current);
        });

        const channel = window.Echo.channel('whatsapp-messages')
            .listen('.message.received', (e) => {
                console.log('📩 [WA-NOTIF] Event received from server:', e);
                
                // --- FILTER LOGIC ---
                // 1. Jika Superadmin, munculkan semua.
                // 2. Jika bukan Superadmin, hanya munculkan jika branch_id cocok.
                const isSuperadmin = user.role === 'superadmin';
                const isSameBranch = e.lead?.branch_id === user.branch_id;

                if (!isSuperadmin && !isSameBranch) {
                    console.log(`🙈 [WA-NOTIF] Message ignored. Lead Branch (${e.lead?.branch_id}) doesn't match User Branch (${user.branch_id})`);
                    return;
                }

                console.log('✨ [WA-NOTIF] Notification accepted and displaying.');

                const newNotification = {
                    id: Date.now(),
                    lead: e.lead,
                    message: e.message,
                    time: new Date().toLocaleTimeString()
                };

                setNotifications(prev => [...prev, newNotification]);

                // Play sound if possible
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(err => console.log('🔊 [WA-NOTIF] Audio play failed (browser policy?):', err));
            });

        return () => {
            console.log('🔌 [WA-NOTIF] Stopping listener on: whatsapp-messages');
            channel.stopListening('.message.received');
        };
    }, [user.id]); // Re-run if user changes

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return { notifications, removeNotification };
}
