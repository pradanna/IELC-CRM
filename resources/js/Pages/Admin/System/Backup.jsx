import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Database, 
    Download, 
    Trash2, 
    Clock, 
    HardDrive, 
    Table as TableIcon, 
    Server, 
    ShieldCheck, 
    AlertCircle, 
    FileArchive, 
    FileCode, 
    RefreshCw, 
    CheckCircle2, 
    Info,
    Sparkles
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Table, THead, TBody, TR, TH, TD } from '@/Components/ui/Table';
import Button from '@/Components/ui/Button';

export default function Backup({ backups = [], stats = {} }) {
    const [format, setFormat] = useState('sql');
    const [downloadNow, setDownloadNow] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, filename: null });
    const [confirmModal, setConfirmModal] = useState(false);

    const handleTriggerBackup = () => {
        setConfirmModal(true);
    };

    const handleExecuteBackup = () => {
        setConfirmModal(false);
        setIsGenerating(true);

        if (downloadNow) {
            // Direct download via GET request
            window.location.href = route('admin.system.backup.generate', {
                format,
                download_now: 1,
            });

            // Reset loading state and reload backup table after file starts downloading
            setTimeout(() => {
                setIsGenerating(false);
                router.reload({ only: ['backups', 'stats'] });
            }, 2500);
        } else {
            router.post(route('admin.system.backup.generate'), {
                format,
                download_now: false,
            }, {
                preserveScroll: true,
                onFinish: () => setIsGenerating(false),
            });
        }
    };

    const handleDelete = (filename) => {
        setDeleteModal({ open: true, filename });
    };

    const confirmDelete = () => {
        if (!deleteModal.filename) return;

        router.delete(route('admin.system.backup.destroy', { filename: deleteModal.filename }), {
            preserveScroll: true,
            onSuccess: () => setDeleteModal({ open: false, filename: null }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Database Backup" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                System Maintenance
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-100">
                                <ShieldCheck size={12} />
                                IT Staff & Superadmin Only
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Database Backup
                            <span className="px-3 py-1 bg-slate-100 rounded-xl text-sm text-slate-500 font-bold">
                                {stats.total_backups || 0} Tersimpan
                            </span>
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                            Cadangkan seluruh skema tabel dan data database aplikasi ke file format SQL atau arsip terkompresi.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            onClick={handleTriggerBackup}
                            disabled={isGenerating}
                            icon={isGenerating ? RefreshCw : Download}
                            className={`px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/20 transition-all ${
                                isGenerating ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="animate-spin" size={18} />
                                    Sedang Mengekspor...
                                </span>
                            ) : (
                                <span>Download Backup SQL</span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Database Name */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Database</span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <Server size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-xl font-black text-slate-800 truncate" title={stats.database_name}>
                                {stats.database_name || 'MySQL'}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-1">
                                Driver: MySQL / MariaDB
                            </p>
                        </div>
                    </div>

                    {/* Total Tables */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Tabel</span>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <TableIcon size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-slate-800">
                                {stats.table_count || 0}
                            </p>
                            <p className="text-xs font-bold text-emerald-600 mt-1">
                                Semua tabel sistem
                            </p>
                        </div>
                    </div>

                    {/* Database Size */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Ukuran di MySQL</span>
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <HardDrive size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-black text-slate-800">
                                {stats.database_size || '0 B'}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 mt-1">
                                Data: {stats.data_size || '0 B'} • Index: {stats.index_size || '0 B'}
                            </p>
                        </div>
                    </div>

                    {/* Last Backup */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Backup Terakhir</span>
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-black text-slate-800 truncate" title={stats.last_backup || 'Belum ada backup'}>
                                {stats.last_backup || 'Belum pernah'}
                            </p>
                            <p className="text-xs font-bold text-purple-600 mt-1">
                                {stats.total_backups ? `${stats.total_backups} file tersimpan` : 'Siap dicadangkan'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Control Panel: Options & Direct Action */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Opsi Ekspor Database</h2>
                            <p className="text-xs font-bold text-slate-400">Pilih format dan metode unduh yang Anda butuhkan.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Format Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                                Format File
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormat('sql')}
                                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                                        format === 'sql'
                                            ? 'border-cyan-500 bg-cyan-50/40 text-cyan-950 ring-2 ring-cyan-500/20 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                    }`}
                                >
                                    <FileCode className={format === 'sql' ? 'text-cyan-600' : 'text-slate-400'} size={22} />
                                    <div>
                                        <p className="text-sm font-black">Plain .SQL</p>
                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">Teks SQL langsung, mudah dibuka di text editor</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormat('sql.gz')}
                                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                                        format === 'sql.gz'
                                            ? 'border-cyan-500 bg-cyan-50/40 text-cyan-950 ring-2 ring-cyan-500/20 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                    }`}
                                >
                                    <FileArchive className={format === 'sql.gz' ? 'text-cyan-600' : 'text-slate-400'} size={22} />
                                    <div>
                                        <p className="text-sm font-black">Compressed .GZ</p>
                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">Kompresi Gzip, ukuran 80-90% lebih kecil</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Direct Download Toggle & Info */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                                Aksi Setelah Dibuat
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50/60 transition-all cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={downloadNow}
                                    onChange={(e) => setDownloadNow(e.target.checked)}
                                    className="w-5 h-5 rounded-lg text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                                />
                                <div>
                                    <p className="text-sm font-black text-slate-800">
                                        Langsung Download ke Komputer
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                        Browser akan otomatis mendownload file hasil backup (dan tetap disimpan di server).
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold">
                        <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
                        <div>
                            <span>Database backup memuat seluruh struktur tabel dan data riwayat sistem (Siswa, CRM Leads, Tagihan Invoice, Pengaturan Master). Proses ini aman dan tidak mengganggu data yang sedang berjalan.</span>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Riwayat File Backup</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                                File cadangan yang tersimpan di direktori server local storage.
                            </p>
                        </div>
                    </div>

                    <Table>
                        <THead>
                            <TR>
                                <TH>Nama File</TH>
                                <TH>Ukuran File</TH>
                                <TH>Tanggal Dibuat</TH>
                                <TH className="text-right">Aksi</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {backups.length === 0 ? (
                                <TR hover={false}>
                                    <TD colSpan="4" className="py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                                                <Database size={28} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">Belum ada file backup yang dibuat</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Klik tombol "Download Backup SQL" di atas untuk membuat backup pertama Anda.
                                            </p>
                                        </div>
                                    </TD>
                                </TR>
                            ) : (
                                backups.map((file) => {
                                    const isGzipFile = file.name.endsWith('.gz');
                                    return (
                                        <TR key={file.name}>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                                                        isGzipFile 
                                                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                                            : 'bg-cyan-50 text-cyan-600 border-cyan-100'
                                                    }`}>
                                                        {isGzipFile ? <FileArchive size={18} /> : <FileCode size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 font-mono">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-slate-400">
                                                            {isGzipFile ? 'Gzip Compressed SQL Archive' : 'Plain SQL Dump Script'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD>
                                                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700">
                                                    {file.size}
                                                </span>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {file.created_at}
                                                </div>
                                            </TD>
                                            <TD className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={file.download_url}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-all cursor-pointer shadow-xs"
                                                        title="Download File Backup"
                                                    >
                                                        <Download size={14} />
                                                        <span>Download</span>
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(file.name)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                                        title="Hapus File Backup"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </TD>
                                        </TR>
                                    );
                                })
                            )}
                        </TBody>
                    </Table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 border border-cyan-100">
                            <Database size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                Konfirmasi Backup Database
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
                                Sistem akan membaca seluruh {stats.table_count || ''} tabel dan data database ({stats.database_name}) dan membuat file backup dalam format <span className="font-black text-slate-800">{format === 'sql' ? '.SQL (Plain)' : '.SQL.GZ (Compressed)'}</span>.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(false)}
                                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteBackup}
                                className="px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/25 cursor-pointer flex items-center gap-2"
                            >
                                <Download size={14} />
                                Ya, Ekspor Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                Hapus File Backup?
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mt-2">
                                Apakah Anda yakin ingin menghapus file backup <span className="font-mono font-black text-slate-800">{deleteModal.filename}</span>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ open: false, filename: null })}
                                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/25 cursor-pointer"
                            >
                                Ya, Hapus File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
