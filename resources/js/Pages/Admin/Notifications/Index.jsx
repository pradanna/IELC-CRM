import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bell, 
    Check, 
    CheckCircle2, 
    Clock, 
    ExternalLink, 
    Inbox, 
    Info, 
    AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function Index({ notifications }) {
    const markAsRead = (notificationId) => {
        if (!notificationId) return;
        router.post(route('admin.notifications.read', notificationId), {}, {
            preserveScroll: true,
        });
    };

    const markAllAsRead = () => {
        router.post(route('admin.notifications.read-all'), {}, {
            preserveScroll: true,
        });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'error': return <AlertCircle className="text-red-500" size={20} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
            default: return <Info className="text-primary-500" size={20} />;
        }
    };

    const formatTime = (dateString) => {
        try {
            if (!dateString) return 'recently';
            return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
        } catch (e) {
            return 'recently';
        }
    };

    return (
        <AdminLayout>
            <Head title="Notifications Inbox" />
            
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-xl text-white">
                                <Inbox size={24} />
                            </div>
                            Notifications Inbox
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Manage your system alerts and real-time updates.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Check size={18} />
                            Mark All as Read
                        </button>
                    </div>
                </div>

                {/* Notifications List/Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest w-16">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Notification</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest w-40">Time</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {notifications?.data?.length > 0 ? (
                                    notifications.data.map((notification) => (
                                        <tr 
                                            key={notification.id} 
                                            className={`group transition-all hover:bg-gray-50/50 ${!notification.read_at ? 'bg-primary-50/30' : ''}`}
                                        >
                                            <td className="px-6 py-5 align-top">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${!notification.read_at ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {getIcon(notification.data?.type)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`text-sm font-bold tracking-tight ${!notification.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {notification.data?.title || 'System Notification'}
                                                        </h4>
                                                        {!notification.read_at && (
                                                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                                                        {notification.data?.message}
                                                    </p>
                                                    {notification.data?.link && (
                                                        <div className="pt-2">
                                                            <Link 
                                                                href={notification.data.link}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                                                                onClick={() => markAsRead(notification.id)}
                                                            >
                                                                View related item <ExternalLink size={12} />
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Clock size={14} />
                                                    <span className="text-xs font-medium">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top text-right">
                                                {!notification.read_at && (
                                                    <button 
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                        title="Mark as Read"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                                                    <Bell size={40} />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Your inbox is empty</h3>
                                                <p className="text-sm text-gray-400 mt-2 font-medium">
                                                    You don't have any notifications at the moment. All system updates will appear here.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {notifications?.links && notifications.data?.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Showing {notifications.from || 0}-{notifications.to || 0} of {notifications.total || 0} notifications
                            </p>
                            <div className="flex gap-2">
                                {notifications.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                link.active 
                                                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' 
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="px-3 py-1 rounded-lg text-xs font-bold bg-white border border-gray-100 text-gray-300 cursor-not-allowed"
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

