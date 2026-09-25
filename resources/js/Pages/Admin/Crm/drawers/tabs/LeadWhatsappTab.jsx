import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { MessageSquare, QrCode, Loader2, FileText, ImageIcon, Video, Headset, Download, Layout, Image as ImageIconLucide, Check, Link as LinkIcon, Search, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { EmptyState } from '../components/DrawerUI';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

export default function LeadWhatsappTab({ lead, chatTemplates = [], mediaAssets = [] }) {
    const { waServerUrl, auth } = usePage().props;
    const user = auth?.user;
    const [waStatus, setWaStatus] = useState('initializing');
    const [statusError, setStatusError] = useState(null);
    const [historyError, setHistoryError] = useState(null);
    const [qrImage, setQrImage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Search States
    const [templateSearch, setTemplateSearch] = useState('');
    const [mediaSearch, setMediaSearch] = useState('');
    
    const scrollRef = useRef(null);
    const branchCode = 'solo'; // WhatsApp terpusat 1 pintu untuk seluruh cabang

    // Filter templates based on lead phase/type (Mirrors Modal Logic)
    const filteredTemplates = useMemo(() => {
        if (!lead) return [];
        return chatTemplates.filter(template => {
            // 1. PHASE/TYPE FILTER
            const hasPhases = template.lead_phases?.length > 0;
            const hasTypes = template.lead_types?.length > 0;

            if (hasPhases || hasTypes) {
                const currentPhaseId = lead.lead_phase_id || lead.lead_phase?.id;
                const currentTypeId = lead.lead_type_id || lead.lead_type?.id;

                // Jika template memiliki tipe khusus dan lead sudah memiliki tipe, harus cocok
                if (hasTypes && currentTypeId) {
                    const typeMatch = template.lead_types.some(t => t.id === currentTypeId);
                    if (!typeMatch) return false;
                }

                // Jika template memiliki phase khusus dan lead sudah memiliki phase, harus cocok
                if (hasPhases && currentPhaseId) {
                    const phaseMatch = template.lead_phases.some(p => p.id === currentPhaseId);
                    if (!phaseMatch) return false;
                }
            }

            // 2. SEARCH FILTER
            if (!templateSearch) return true;
            const query = templateSearch.toLowerCase();
            return (
                template.title?.toLowerCase().includes(query) || 
                template.message?.toLowerCase().includes(query)
            );
        });
    }, [chatTemplates, lead, templateSearch]);

    // Media Search
    const filteredMedia = useMemo(() => {
        let results = mediaAssets;
        if (mediaSearch) {
            results = results.filter(asset => 
                asset.name?.toLowerCase().includes(mediaSearch.toLowerCase())
            );
        }
        return results.slice(0, 10);
    }, [mediaAssets, mediaSearch]);

    // 1. WhatsApp Message Parser (New SQLite Flat Format)
    const parseWaMessage = (raw) => {
        const timestamp = raw.timestamp
            ? new Date(raw.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';

        // Deteksi tipe berdasarkan media_url
        let type = 'text';
        let mediaUrl = null;

        if (raw.media_url) {
            type = 'image';
            mediaUrl = raw.media_url;
        }

        return {
            id: raw.id,
            fromMe: Boolean(raw.fromMe), // SQLite simpan 0/1 integer
            body: raw.content || '',
            type,
            timestamp,
            rawTimestamp: raw.timestamp,
            mediaUrl,
            localImageUrl: mediaUrl, // Alias untuk kompabilitas render
        };
    };

    // Utilitas format nomor HP ke 62...
    const formatPhone = (phone) => {
        if (!phone) return '';
        let clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) return '62' + clean.slice(1);
        if (clean.startsWith('8')) return '62' + clean;
        return clean;
    };

    // 2. Cek Status Koneksi (Interval)
    useEffect(() => {
        let timeoutId;

        const checkWaStatus = async () => {
            try {
                // Pointing to absolute Laravel route via Ziggy
                const res = await axios.get(route('admin.whatsapp.status', branchCode));
                const currentStatus = res.data.status;
                setWaStatus(currentStatus);
                if (res.data.error) {
                    setStatusError(res.data.error);
                } else if (currentStatus === 'connected') {
                    setStatusError(null);
                } else if (currentStatus === 'disconnected') {
                    setStatusError("Gateway WhatsApp offline atau belum terhubung.");
                } else {
                    setStatusError(null);
                }

                if (currentStatus === 'waiting_for_scan') {
                    setQrImage(res.data.qr_image_url);
                }
                const nextCheckInterval = (currentStatus === 'connected') ? 30000 : 3000;
                timeoutId = setTimeout(checkWaStatus, nextCheckInterval);
            } catch (error) {
                setWaStatus('disconnected');
                setStatusError("Gagal menghubungi server WhatsApp Baileys (Server offline / port tidak aktif).");
                timeoutId = setTimeout(checkWaStatus, 5000); 
            }
        };

        checkWaStatus();
        return () => clearTimeout(timeoutId);
    }, [branchCode]);

    // 3. Ambil Riwayat Chat jika Connected
    useEffect(() => {
        if (waStatus === 'connected' && lead?.phone) {
            setMessages([]);
            setHasMore(true);
            setIsInitialLoad(true);
            fetchHistory(false, null);
        }
    }, [waStatus, lead?.id]); // Re-fetch jika ganti lead

    // 4. Real-time Message Listener (Laravel Echo)
    useEffect(() => {
        if (!lead?.id) return;

        const channel = window.Echo.channel('whatsapp-messages')
            .listen('.message.received', (e) => {
                // Pastikan pesan ini untuk lead yang sedang dibuka
                if (e.lead && e.lead.id === lead.id) {
                    console.log('Real-time message received for current lead, refetching...');
                    fetchHistory(false, null);
                }
            });

        return () => {
            window.Echo.leaveChannel('whatsapp-messages');
        };
    }, [lead?.id]);

    const fetchHistory = async (isLoadMore = false, before = null) => {
        if (isLoadingHistory || (!hasMore && isLoadMore)) return;

        setIsLoadingHistory(true);
        const prevScrollHeight = scrollRef.current?.scrollHeight;

        try {
            const cleanPhone = formatPhone(lead.phone);
            const url = route('admin.whatsapp.history', [branchCode, cleanPhone]);
            const params = before ? { before } : {};
            
            const res = await axios.get(url, { params });
            if (res.data?.error) {
                setHistoryError(res.data.error);
            } else {
                setHistoryError(null);
            }
            const rawMessages = res.data.data || [];
            const parsed = rawMessages.map(parseWaMessage);

            // AUTO-RESET LOGIC: Jika pesan terakhir adalah dari Lead (bukan fromMe), reset FUP counter.
            if (!isLoadMore && parsed.length > 0) {
                const latestMsg = parsed[parsed.length - 1]; // Pesan terbaru di array (paling bawah di chat)
                if (!latestMsg.fromMe && lead.follow_up_count > 0) {
                    try {
                        await axios.patch(route('admin.crm.leads.reset-followup', lead.id));
                    } catch (err) {
                        console.error('Gagal reset FUP otomatis:', err);
                    }
                }
            }

            if (isLoadMore) {
                setMessages(prev => {
                    const combined = [...parsed, ...prev];
                    // Deduplicate by ID
                    const seen = new Set();
                    return combined.filter(msg => {
                        if (!msg.id) return true;
                        if (seen.has(msg.id)) return false;
                        seen.add(msg.id);
                        return true;
                    });
                });
                
                // Jika data yang datang kurang dari biasanya (misal limit 20), berarti sudah habis
                if (rawMessages.length < 10) setHasMore(false);
                
                // Pertahankan posisi scroll setelah data bertambah di atas
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight;
                    }
                }, 0);
            } else {
                // Deduplicate for initial load too
                const seen = new Set();
                const unique = parsed.filter(msg => {
                    if (!msg.id) return true;
                    if (seen.has(msg.id)) return false;
                    seen.add(msg.id);
                    return true;
                });
                
                setMessages(unique);
                if (rawMessages.length < 10) setHasMore(false);
                
                // Scroll ke paling bawah untuk load pertama kali
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                    setIsInitialLoad(false);
                }, 100);
            }
        } catch (error) {
            console.error('Gagal mengambil riwayat chat:', error);
            setHistoryError("Gagal mengambil riwayat chat dari server WhatsApp (Koneksi terputus atau server error).");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleScroll = (e) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0 && hasMore && !isLoadingHistory) {
            const oldestMessage = messages[0];
            if (oldestMessage?.rawTimestamp) {
                fetchHistory(true, oldestMessage.rawTimestamp);
            }
        }
    };

    const parseTemplateMessage = (text) => {
        if (!text) return '';
        return text
            .replace(/{{name}}/g, lead?.name || 'Kak')
            .replace(/{{nickname}}/g, lead?.nickname || lead?.name || 'Kak')
            .replace(/{{lead_number}}/g, lead?.lead_number || '')
            .replace(/{{admin_name}}/g, user?.name || '');
    };

    const openWaWeb = (msg) => {
        const parsedMsg = parseTemplateMessage(msg);
        const cleanPhone = formatPhone(lead.phone);
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(parsedMsg)}`;
        window.open(url, '_blank');
    };

    const executeSendMessage = async (msg) => {
        if (!msg.trim() || isSending) return false;

        setIsSending(true);
        const parsedMsg = parseTemplateMessage(msg);
        try {
            const cleanPhone = formatPhone(lead.phone);
            const response = await axios.post(route('admin.whatsapp.send'), {
                branch: branchCode,
                phone: cleanPhone,
                message: parsedMsg
            });

            if (response.data.success) {
                // Record follow-up
                try {
                    await axios.patch(route('admin.crm.leads.record-followup', lead.id), {
                        message: msg
                    });
                } catch (err) {
                    console.error("Gagal mencatat follow-up di CRM:", err);
                }
                fetchHistory(false); 
                return true;
            }
            return false;
        } catch (error) {
            console.error("Gagal kirim pesan:", error);
            const errMsg = error.response?.data?.error || error.message || "Unknown error";
            if (confirm(`Gagal kirim via sistem: ${errMsg}\n\nApakah Anda ingin mencoba kirim via WhatsApp Web?`)) {
                openWaWeb(msg);
            }
            return false;
        } finally {
            setIsSending(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const success = await executeSendMessage(inputText);
        if (success) setInputText("");
    };

    const handleTemplateClick = async (templateMessage) => {
        const success = await executeSendMessage(templateMessage);
        if (!success) {
            setInputText(templateMessage); // Fill input if failed so they can retry or edit
        }
    };

    // -----------------------------------------
    // RENDER LOGIC
    // -----------------------------------------

    if (waStatus === 'disconnected') {
        return (
            <div className="outline-none flex flex-col items-center justify-center p-8 bg-amber-50/40 rounded-[2.5rem] border border-amber-200/80 text-center">
                <div className="w-16 h-16 bg-amber-100/80 rounded-3xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Server WhatsApp Baileys Tidak Jalan / Terputus</h3>
                <p className="text-sm text-slate-600 max-w-md font-medium leading-relaxed mb-4">
                    Koneksi ke gateway WhatsApp tidak aktif atau server Baileys belum dijalankan. Pesan tidak dapat dikirim/diterima secara otomatis.
                </p>

                {statusError && (
                    <div className="px-4 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100 mb-5 max-w-md break-words">
                        Detail: {statusError}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Refresh Status
                    </button>
                    {lead?.phone && (
                        <button 
                            onClick={() => openWaWeb('')}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                        >
                            Buka WhatsApp Web Manual
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (waStatus === 'waiting_for_scan' || waStatus === 'initializing') {
        return (
            <div className="outline-none flex flex-col items-center justify-center p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-200 border-dashed">
                <div className="mb-6 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 relative">
                    {qrImage ? (
                        <img src={qrImage} alt="Scan QR WhatsApp" className="w-64 h-64" />
                    ) : (
                        <div className="flex items-center justify-center w-64 h-64 bg-slate-50 rounded-2xl">
                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">Tautkan WhatsApp IELC</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm font-medium leading-relaxed">
                    Scan QR Code ini menggunakan HP Admin untuk mengaktifkan fitur chat real-time. 
                </p>
                <div className="mt-6 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Sistem Global per Cabang</span>
                </div>
            </div>
        );
    }

    // TAMPILAN CHAT UTAMA
    return (
        <div className="outline-none flex flex-col h-[600px] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            {/* Chat Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                            {lead?.name?.charAt(0) || 'S'}
                        </div>
                        <span 
                            title={waStatus === 'connected' ? 'WhatsApp Gateway Connected' : 'WhatsApp Gateway Disconnected/Offline'}
                            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                                waStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800 leading-none">{lead?.name}</h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                waStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                                {waStatus === 'connected' ? 'Gateway Online' : 'Gateway Offline'}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{lead?.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLoadingHistory && !isInitialLoad && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memuat Pesan Lama...</span>
                        </div>
                    )}
                    <button 
                        onClick={() => fetchHistory(false)}
                        disabled={isLoadingHistory}
                        className="p-2.5 bg-white border border-slate-200 hover:border-red-500 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    >
                        <Loader2 className={`w-4 h-4 text-slate-500 ${isLoadingHistory && isInitialLoad ? 'animate-spin text-red-500' : ''}`} />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30 relative"
            >
                {historyError && (
                    <div className="p-3 mb-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                            <span>{historyError}</span>
                        </div>
                        <button 
                            onClick={() => fetchHistory(false)}
                            className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shrink-0 text-[10px] uppercase font-black tracking-wider"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {messages.length === 0 && !isLoadingHistory ? (
                    <div className="h-full flex items-center justify-center text-center">
                        {historyError ? (
                            <EmptyState 
                                icon={AlertTriangle} 
                                title="Gagal Memuat Percakapan" 
                                desc="Server WhatsApp Baileys tidak merespon atau sedang gangguan. Pastikan server aktif." 
                            />
                        ) : (
                            <EmptyState 
                                icon={MessageSquare} 
                                title="Belum ada chat" 
                                desc="Belum ada riwayat percakapan. Mulai kirim pesan pertama Anda." 
                            />
                        )}
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={msg.id || index} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`group relative max-w-[80%] rounded-2xl p-3 shadow-sm border transition-all ${
                                msg.fromMe 
                                ? 'bg-red-500 border-red-500 text-white rounded-br-none' 
                                : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                            }`}>
                                <div className="flex flex-col">
                                    {/* 📸 LOGIKA MENAMPILKAN GAMBAR: Jika ada link gambar, tampilkan elemen <img> */}
                                    {msg.localImageUrl && (
                                        <img 
                                            src={msg.localImageUrl} 
                                            alt="Bukti Gambar" 
                                            className="w-64 rounded-xl mb-2 object-cover border border-black/5 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                            onClick={() => window.open(msg.localImageUrl, '_blank')}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/400x300?text=Gambar+Kadaluarsa';
                                            }}
                                        />
                                    )}

                                    {/* Jika ada dokumen */}
                                    {msg.type === 'document' && (
                                        <div className="flex items-center gap-3 py-1 mb-2">
                                            <div className={`p-2 rounded-xl ${msg.fromMe ? 'bg-red-600' : 'bg-slate-100'}`}>
                                                <FileText size={20} className={msg.fromMe ? 'text-white' : 'text-slate-50' } />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className={`text-sm font-bold truncate ${msg.fromMe ? 'text-white' : 'text-slate-800'}`}>{msg.body}</p>
                                                <p className={`text-[10px] font-medium ${msg.fromMe ? 'text-red-100' : 'text-slate-400'}`}>Dokumen WhatsApp</p>
                                            </div>
                                            {msg.mediaUrl && (
                                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" 
                                                   className={`p-2 rounded-lg hover:bg-black/5 transition-all ${msg.fromMe ? 'text-white' : 'text-slate-400'}`}>
                                                    <Download size={18} />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Teks Pesan / Caption */}
                                    {msg.body && (
                                        <p className="text-sm font-medium leading-relaxed break-words">
                                            {msg.body}
                                        </p>
                                    )}
                                    
                                    <div className={`flex items-center justify-end mt-1.5 gap-1 text-[9px] font-bold uppercase tracking-widest ${msg.fromMe ? 'text-red-100' : 'text-slate-400'}`}>
                                        {msg.timestamp}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <form 
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/5 transition-all"
                >
                    {/* SHORTCUTS: TEMPLATES & MEDIA */}
                    <div className="flex items-center gap-1 pl-1">
                        {/* Quick Templates */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Quick Templates">
                                <Layout size={20} />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute bottom-full left-0 mb-4 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Template</h4>
                                        <div className="relative">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={templateSearch}
                                                onChange={(e) => setTemplateSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all pl-9 placeholder:italic placeholder:font-medium"
                                                placeholder="Cari template..."
                                            />
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            {templateSearch && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setTemplateSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-2">
                                        {filteredTemplates.length === 0 ? (
                                            <div className="px-4 py-10 text-center space-y-2">
                                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                                    <Search size={20} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 italic">Tidak ditemukan template.</p>
                                            </div>
                                        ) : (
                                            filteredTemplates.map(t => (
                                                <Menu.Item key={t.id}>
                                                    {({ active }) => (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTemplateClick(t.message)}
                                                            className={`w-full text-left p-3 rounded-xl transition-all ${active ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-wider mb-1">{t.title}</p>
                                                            <p className="text-xs font-medium line-clamp-2 opacity-70">{t.message}</p>
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            ))
                                        )}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>

                        {/* Media Library */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Media Library">
                                <ImageIconLucide size={20} />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute bottom-full left-0 mb-4 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Media Link</h4>
                                        <div className="relative">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={mediaSearch}
                                                onChange={(e) => setMediaSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all pl-9 placeholder:italic placeholder:font-medium"
                                                placeholder="Cari brosur/aset..."
                                            />
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            {mediaSearch && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setMediaSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-2">
                                        {filteredMedia.length === 0 ? (
                                            <div className="px-4 py-10 text-center space-y-2">
                                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                                    <Search size={20} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 italic">Media tidak ditemukan.</p>
                                            </div>
                                        ) : (
                                            filteredMedia.map(m => {
                                                const url = `${window.location.origin}/storage/${m.file_path}`;
                                                return (
                                                    <Menu.Item key={m.id}>
                                                        {({ active }) => (
                                                            <button
                                                                type="button"
                                                                onClick={() => setInputText(prev => prev + (prev ? '\n' : '') + url)}
                                                                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${active ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                                    <LinkIcon size={14} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate leading-tight">{m.name}</p>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-0.5">{m.mime_type}</p>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                );
                                            })
                                        )}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>

                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ketik pesan..." 
                        disabled={isSending}
                        className="flex-1 border-none focus:ring-0 focus:outline-none text-sm font-medium px-4 bg-transparent disabled:opacity-50"
                    />
                    <button 
                        type="submit"
                        disabled={isSending || !inputText.trim()}
                        className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:bg-slate-300 min-w-[100px] flex items-center justify-center"
                    >
                        {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Kirim'}
                    </button>
                </form>
            </div>
        </div>
    );
}