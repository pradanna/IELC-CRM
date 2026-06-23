import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function InvoiceStage({ lead, handleSendInvoiceWA }) {
    return (
        <div className="space-y-3">
            {lead?.invoices?.length > 0 ? (
                lead.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs uppercase tracking-tighter shadow-inner">
                                INV
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 tracking-tight">{inv.invoice_number}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    Rp {new Intl.NumberFormat('id-ID').format(inv.total_amount)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                inv.status === 'paid' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                                {inv.status}
                            </span>
                            <button 
                                onClick={() => handleSendInvoiceWA(inv)}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                title="Kirim via WhatsApp"
                            >
                                <MessageCircle size={14} />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-[10px] text-slate-400 text-center font-bold">
                    No invoices generated yet.
                </div>
            )}
        </div>
    );
}
