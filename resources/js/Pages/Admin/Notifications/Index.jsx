import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import { 
    Bell, 
    Check, 
    CheckCircle2, 
    Clock, 
    ExternalLink, 
    Inbox, 
    Info, 
    AlertCircle,
    CheckCheck
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
            case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'error': return <AlertCircle className="text-red-500" size={20} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
            default: return <Info className="text-red-500" size={20} />;
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

    const getLinkLabel = (title = '', link = '') => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('invoice') || lowerTitle.includes('pembayaran')) {
            return 'Lihat Lead & Invoice';
        }
        if (lowerTitle.includes('placement test')) {
            return 'Lihat Hasil Placement Test';
        }
        if (lowerTitle.includes('pendaftaran') || lowerTitle.includes('registrasi')) {
            return 'Lihat Inbox Pendaftaran';
        }
        if (lowerTitle.includes('pembaruan data')) {
            return 'Lihat Detail Lead';
        }
        return 'Lihat Detail';
    };

    const unreadCount = notifications?.data?.filter(n => !n.read_at).length || 0;

    return (
        <AdminLayout>
            <Head title="Notifications Inbox" />

            <AdminPageLayout
                title="Notifications Inbox"
                subtitle="Manage your system alerts, lead activity, and real-time updates."
                actions={
                    <button 
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-full font-bold text-sm shadow-sm transition-all active:scale-95"
                    >
                        <CheckCheck size={18} className="text-slate-500" />
                        Tandai Dibaca Semua
                    </button>
                }
            >
                {/* Notifications Card Container */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Notification</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-48">Time</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {notifications?.data?.length > 0 ? (
                                    notifications.data.map((notification) => (
                                        <tr 
                                            key={notification.id} 
                                            className={`group transition-colors ${!notification.read_at ? 'bg-red-50/20' : 'hover:bg-slate-50/60'}`}
                                        >
                                            <td className="px-6 py-5 align-top text-center">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105 ${!notification.read_at ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                    {getIcon(notification.data?.type)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="space-y-1.5 max-w-3xl">
                                                    <div className="flex items-center gap-2.5">
                                                        <h4 className={`text-base font-bold tracking-tight ${!notification.read_at ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                                                            {notification.data?.title || 'System Notification'}
                                                        </h4>
                                                        {!notification.read_at && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600">
                                                                Baru
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                        {notification.data?.message}
                                                    </p>
                                                    {notification.data?.link && (
                                                        <div className="pt-1.5">
                                                            <Link 
                                                                href={notification.data.link}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
                                                                onClick={() => markAsRead(notification.id)}
                                                            >
                                                                {getLinkLabel(notification.data?.title, notification.data?.link)} <ExternalLink size={13} />
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                                                    <Clock size={14} />
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top text-right">
                                                {!notification.read_at && (
                                                    <button 
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Tandai dibaca"
                                                    >
                                                        <Check size={18} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                                                    <Bell size={36} />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Kotak Masuk Kosong</h3>
                                                <p className="text-xs font-medium text-slate-400 mt-2">
                                                    Tidak ada notifikasi saat ini. Semua pembaruan sistem akan tampil di sini.
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
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Menampilkan {notifications.from || 0}-{notifications.to || 0} dari {notifications.total || 0} notifikasi
                            </p>
                            <div className="flex gap-1.5">
                                {notifications.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                link.active 
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-100 text-slate-300 cursor-not-allowed"
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </AdminPageLayout>
        </AdminLayout>
    );
}

