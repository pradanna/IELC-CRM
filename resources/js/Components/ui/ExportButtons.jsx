import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2, CheckCircle2, Download, X } from 'lucide-react';
import Button from '@/Components/ui/Button';
import axios from 'axios';

/**
 * ExportButtons — Reusable export action group (PDF + Excel) with interactive Loading Progress Bar.
 *
 * Props:
 *   onPdf    {function|string}  — onClick handler OR direct href URL for PDF export
 *   onExcel  {function|string}  — onClick handler OR direct href URL for Excel/CSV export
 *   label    {string}           — Optional suffix label shown in brackets, e.g. "Ringkasan"
 *   size     {'sm'|'md'}        — Button size. 'sm' = compact, 'md' = standard (default: 'md')
 *   disabled {boolean}          — Disable both buttons
 */
export default function ExportButtons({
    onPdf,
    onExcel,
    label = '',
    size = 'md',
    disabled = false,
}) {
    const [exportingType, setExportingType] = useState(null); // 'pdf' | 'excel' | null
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [isDone, setIsDone] = useState(false);

    const sizeClass = size === 'sm'
        ? 'text-[10px] font-black uppercase rounded-full px-3 py-2 shadow-md'
        : 'text-xs font-bold uppercase rounded-full shadow-lg px-5 py-2.5';

    const pdfLabel   = label ? `Export PDF (${label})`   : 'Export PDF';
    const excelLabel = label ? `Export Excel (${label})` : 'Export Excel';

    const triggerDownload = async (url, type, filenamePrefix = 'export') => {
        setExportingType(type);
        setProgress(15);
        setIsDone(false);
        setStatusMessage(type === 'pdf' ? 'Mempersiapkan & mengompilasi dokumen PDF...' : 'Menyusun tabel & mengumpulkan data Excel...');

        // Smooth progress simulation while backend generates the file
        let currentProgress = 15;
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 6) + 2;
            if (currentProgress >= 88) {
                currentProgress = 88;
                setStatusMessage(type === 'pdf' ? 'Membuat layout halaman PDF...' : 'Memformat file Excel/CSV...');
            }
            setProgress(currentProgress);
        }, 400);

        try {
            const response = await axios.get(url, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        if (percentCompleted > currentProgress) {
                            setProgress(percentCompleted);
                        }
                    }
                }
            });

            clearInterval(interval);
            setProgress(100);
            setIsDone(true);
            setStatusMessage('Download selesai!');

            // Extract filename from header or fallback
            let filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${type === 'pdf' ? 'pdf' : 'xls'}`;
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Create blob url and trigger native browser download
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            // Auto close modal after download
            setTimeout(() => {
                setExportingType(null);
                setProgress(0);
                setIsDone(false);
            }, 1200);

        } catch (err) {
            clearInterval(interval);
            console.error('Export error:', err);
            setStatusMessage('Terjadi kesalahan saat memproses ekspor data.');
            setTimeout(() => {
                setExportingType(null);
                setProgress(0);
            }, 2500);
        }
    };

    const handlePdf = () => {
        if (typeof onPdf === 'string') {
            triggerDownload(onPdf, 'pdf', label ? `daftar_siswa_${label}` : 'daftar_siswa');
        } else if (typeof onPdf === 'function') {
            onPdf();
        }
    };

    const handleExcel = () => {
        if (typeof onExcel === 'string') {
            triggerDownload(onExcel, 'excel', label ? `daftar_siswa_${label}` : 'daftar_siswa');
        } else if (typeof onExcel === 'function') {
            onExcel();
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                <Button
                    onClick={handlePdf}
                    disabled={disabled || exportingType !== null}
                    icon={exportingType === 'pdf' ? Loader2 : FileText}
                    className={`bg-red-600 hover:bg-red-700 text-white ${sizeClass} shadow-red-600/20`}
                >
                    {exportingType === 'pdf' ? 'Mengekspor...' : pdfLabel}
                </Button>
                <Button
                    onClick={handleExcel}
                    disabled={disabled || exportingType !== null}
                    icon={exportingType === 'excel' ? Loader2 : FileSpreadsheet}
                    className={`!bg-emerald-600 hover:!bg-emerald-700 text-white ${sizeClass} shadow-emerald-600/20`}
                >
                    {exportingType === 'excel' ? 'Mengekspor...' : excelLabel}
                </Button>
            </div>

            {/* Modal / Overlay Progress Bar */}
            {exportingType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                        {/* Icon Header */}
                        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${
                                exportingType === 'pdf' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                            }`}>
                                {isDone ? (
                                    <CheckCircle2 size={32} className="text-emerald-600 animate-in zoom-in duration-300" />
                                ) : exportingType === 'pdf' ? (
                                    <FileText size={28} className="animate-pulse" />
                                ) : (
                                    <FileSpreadsheet size={28} className="animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div className="space-y-1">
                            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                {isDone ? 'Ekspor Berhasil!' : `Mengekspor Dokumen ${exportingType.toUpperCase()}`}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                                {statusMessage}
                            </p>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-xs font-black text-slate-700">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <Loader2 size={13} className={`animate-spin ${exportingType === 'pdf' ? 'text-red-500' : 'text-emerald-500'}`} />
                                    Progress
                                </span>
                                <span className="font-mono text-sm font-black text-slate-900">{progress}%</span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ease-out ${
                                        exportingType === 'pdf'
                                            ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-sm shadow-red-500/50'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/50'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 font-medium italic">
                            Mohon tunggu sebentar, file akan otomatis diunduh ke perangkat Anda.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
