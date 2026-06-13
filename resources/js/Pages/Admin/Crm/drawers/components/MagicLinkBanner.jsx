import React, { useState } from 'react';
import { Link as LinkIcon, Check, Copy, MessageSquare, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function MagicLinkBanner({ lead }) {
    const [copied, setCopied] = useState(false);
    const [sendingWa, setSendingWa] = useState(false);

    const magicLink = `${window.location.origin}/fill-data/${lead?.self_registration_token}`;

    const handleCopy = () => {
        if (!lead?.self_registration_token) return;
        
        navigator.clipboard.writeText(magicLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSendWa = async () => {
        if (!lead?.self_registration_token || !lead?.phone) return;
        
        if (!confirm(`Kirim magic link pengisian data mandiri ke ${lead.name} via WhatsApp?`)) return;

        setSendingWa(true);
        try {
            const branchCode = (lead?.branch?.code || lead?.branch_code || 'solo').toLowerCase();
            const message = `Halo ${lead.name}, harap lengkapi data pribadi kamu melalui link ini ya agar data profil kamu di IELC tetap up-to-date: ${magicLink}\n\nTerima kasih!`;
            
            await axios.post(route('admin.whatsapp.send'), {
                branch: branchCode,
                phone: lead.phone,
                message: message
            });
            
            alert('Magic link pengisian data berhasil dikirim via WhatsApp!');
        } catch (error) {
            console.error('Error sending enrichment WA:', error);
            alert('Gagal mengirim WhatsApp: ' + (error.response?.data?.error || 'Server error'));
        } finally {
            setSendingWa(false);
        }
    };

    if (!lead?.self_registration_token) return null;

    return (
        <div className="mb-8 p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] shadow-sm overflow-hidden relative group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-55/10 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform border border-indigo-100">
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-black text-slate-800 tracking-tight leading-none mb-1.5 uppercase">Lengkapi Data Mandiri</h4>
                        <p className="text-[12px] font-bold text-slate-500 normal-case mt-1.5 leading-relaxed max-w-lg">
                            Kirim tautan khusus ke nomor WhatsApp calon siswa agar mereka dapat mengisi dan melengkapi data profil mereka sendiri.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleSendWa}
                        disabled={sendingWa}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-green-200/50"
                    >
                        {sendingWa ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                        Kirim Link WA
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Tersalin' : 'Salin Link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
