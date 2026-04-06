import React from "react";
import { Eye, Pencil, Trash2, PhoneCall, CreditCard } from "lucide-react";

const TableIconButton = ({ type, onClick }) => {
    // Konfigurasi dinamis berdasarkan tipe tombol
    const config = {
        detail: {
            icon: Eye,
            tooltip: "Lihat Detail",
            // Background biru soft (100), text biru agak gelap (600)
            style: "text-blue-600 bg-blue-100 hover:bg-blue-200",
        },
        edit: {
            icon: Pencil,
            tooltip: "Edit Data",
            // Background kuning/amber soft (100), text amber (600)
            style: "text-amber-600 bg-amber-100 hover:bg-amber-200",
        },
        delete: {
            icon: Trash2,
            tooltip: "Hapus Data",
            // Background merah soft (100), text merah (600)
            style: "text-red-600 bg-red-100 hover:bg-red-200",
        },
        followup: {
            icon: PhoneCall,
            tooltip: "Follow-up",
            // Background hijau soft (100), text hijau (600)
            style: "text-green-600 bg-green-100 hover:bg-green-200",
        },
        payment: {
            icon: CreditCard,
            tooltip: "Proses Siswa ke Pembayaran",
            // Background ungu soft (100), text ungu (600)
            style: "text-purple-600 bg-purple-100 hover:bg-purple-200",
        },
    };

    // Default fallback ke 'detail' jika tipe tidak sesuai
    const currentConfig = config[type] || config.detail;
    const Icon = currentConfig.icon;

    return (
        <div className="relative group inline-flex items-center justify-center">
            <button
                onClick={onClick}
                className={`p-1.5 rounded-md cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 ${currentConfig.style}`}
                aria-label={currentConfig.tooltip}
            >
                {/* Ukuran icon diset ke 16px agar terlihat kecil dan rapi di dalam tabel */}
                <Icon size={16} strokeWidth={2.5} />
            </button>

            {/* Tooltip Component (muncul saat di-hover) */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-gray-800 text-white text-[11px] font-medium py-1 px-2.5 rounded-md whitespace-nowrap shadow-sm">
                    {currentConfig.tooltip}
                </div>
                {/* Segitiga panah kecil di bawah tooltip (disesuaikan posisinya agar tetap di tengah tombol) */}
                <div className="w-2 h-2 bg-gray-800 rotate-45 absolute -bottom-1 right-[10px]"></div>
            </div>
        </div>
    );
};

export default TableIconButton;
