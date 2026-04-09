import React, { useState, Fragment } from 'react';
import { MessageSquare, ExternalLink, X, Inbox } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { formatDistanceToNow } from 'date-fns';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';

export default function WhatsappNotificationDropdown({ notifications, onRemove }) {
    const unreadCount = notifications.length;
    const { openDrawer } = useLeadDrawer();

    const handleReply = (e, notification) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(notification.id);
        openDrawer(notification.lead.id, 2);
    };

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="relative p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all group">
                <MessageSquare size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] font-bold text-white items-center justify-center">
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
                            <h3 className="text-sm font-bold text-emerald-900">WhatsApp Messages</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                                    Real-time WA Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <Menu.Item key={n.id}>
                                    {({ active }) => (
                                        <div className={`px-4 py-3 border-b border-gray-50 flex gap-3 transition-colors ${active ? 'bg-emerald-50/30' : 'bg-white'}`}>
                                            <div className="shrink-0 mt-0.5">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <MessageSquare size={16} />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                                                        {n.lead?.name || 'Incoming Message'}
                                                    </p>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemove(n.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 p-0.5 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-snug">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {n.time}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => handleReply(e, n)}
                                                        className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-all"
                                                    >
                                                        Reply Now <ExternalLink size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Menu.Item>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-200 mb-3">
                                    <Inbox size={24} />
                                </div>
                                <p className="text-sm font-semibold text-gray-900">No new messages</p>
                                <p className="text-xs text-gray-500 mt-1">Waiting for incoming WhatsApp messages...</p>
                            </div>
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
