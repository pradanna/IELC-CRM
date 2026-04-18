import { useEffect, useState } from 'react';

export default function useWhatsappNotification() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!window.Echo) {
            console.error('Echo is not initialized!');
            return;
        }

        console.log('Listening for WA messages on public channel: whatsapp-messages');

        const channel = window.Echo.channel('whatsapp-messages')
            .listen('.message.received', (e) => {
                console.log('✅ WA EVENT RECEIVED:', e);
                
                const newNotification = {
                    id: Date.now(),
                    lead: e.lead,
                    message: e.message,
                    time: new Date().toLocaleTimeString()
                };

                setNotifications(prev => [...prev, newNotification]);



                // Play sound if possible
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(err => console.log('Audio play failed:', err));
            });

        return () => {
            channel.stopListening('.message.received');
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return { notifications, removeNotification };
}
