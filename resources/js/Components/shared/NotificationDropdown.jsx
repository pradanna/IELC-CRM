import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Bell, Check, X, ExternalLink, Inbox, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get(route('admin.notifications.index'));
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, []);

    useEffect(() => {
        // fetchNotifications();
        
        if (window.Echo) {
            const channel = window.Echo.private(`App.Models.User.${user.id}`);
            
            // Listen for Laravel Notifications
            channel.notification((notification) => {
                console.log("REAL-TIME NOTIFICATION RECEIVED:", notification);
                
                // Normalisasi agar formatnya sama dengan yang diambil dari DB (Auth::user()->unreadNotifications)
                // Laravel's broadcast notification format is the raw payload, 
                // but we wrap it in 'data' to match database structure.
                const normalizedNotification = {
                    id: notification.id || `temp-${Date.now()}`,
                    data: notification.data || notification, // Handle double data wrapping if present
                    created_at: new Date().toISOString(),
                    read_at: null,
                    type: notification.type || 'App\\Notifications\\SystemNotification'
                };
                
                setNotifications(prev => [normalizedNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            // Connection debugging (Useful for dev)
            window.Echo.connector.pusher.connection.bind('state_change', (states) => {
                setIsConnected(states.current === 'connected');
                console.log("ECHO CONNECTION STATE:", states.current);
            });

            // Standard Listeners for common events if needed
            channel.listen('.test.event', (e) => {
                console.warn("BROADCAST PING RECEIVED:", e);
                // Kita bisa tampilkan toast di sini jika ada sistem toast global
            });

            return () => {
                window.Echo.leave(`App.Models.User.${user.id}`);
            };
        }
    }, [user.id, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await axios.post(route('admin.notifications.read', id));
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route('admin.notifications.read-all'));
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={16} />;
            case 'error': return <AlertCircle className="text-red-500" size={16} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
            default: return <Info className="text-primary-500" size={16} />;
        }
    };

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all group">
                <Bell size={20} className={isConnected ? "" : "opacity-30"} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></div>
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                                    {isConnected ? 'Real-time active' : 'Connecting...'}
                                </span>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <Menu.Item key={n.id}>
                                    {({ active }) => (
                                        <div className={`px-4 py-3 border-b border-gray-50 flex gap-3 transition-colors ${active ? 'bg-gray-50' : 'bg-white'}`}>
                                            <div className="shrink-0 mt-0.5">
                                                <div className={`w-8 h-8 rounded-lg ${n.data?.type === 'error' ? 'bg-red-50' : (n.data?.type === 'success' ? 'bg-green-50' : 'bg-primary-50')} flex items-center justify-center`}>
                                                    {getIcon(n.data?.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                                                        {n.data?.title || 'Notification'}
                                                    </p>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(n.id);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-snug">
                                                    {n.data?.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </span>
                                                    {n.data?.link && (
                                                        <a 
                                                            href={n.data.link} 
                                                            className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:text-primary-700 bg-primary-50 px-2 py-0.5 rounded transition-all"
                                                            onClick={() => markAsRead(n.id)}
                                                        >
                                                            View detail <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Menu.Item>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-3">
                                    <Bell size={24} />
                                </div>
                                <p className="text-sm font-semibold text-gray-900">All caught up!</p>
                                <p className="text-xs text-gray-500 mt-1">No new notifications for you right now.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-2.5 bg-gray-50/50 border-t border-gray-100 text-center">
                         <button className="text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 tracking-wider transition-colors py-1 px-4">
                            See recent activity
                         </button>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

