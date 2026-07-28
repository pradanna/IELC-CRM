import React from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import Button from '@/Components/ui/Button';

/**
 * ExportButtons — Reusable export action group (PDF + Excel).
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
    const sizeClass = size === 'sm'
        ? 'text-[10px] font-black uppercase rounded-full px-3 py-2 shadow-md'
        : 'text-xs font-bold uppercase rounded-full shadow-lg px-5 py-2.5';

    const pdfLabel   = label ? `Export PDF (${label})`   : 'Export PDF';
    const excelLabel = label ? `Export Excel (${label})` : 'Export Excel';

    const handlePdf = () => {
        if (typeof onPdf === 'string') {
            window.open(onPdf, '_blank');
        } else if (typeof onPdf === 'function') {
            onPdf();
        }
    };

    const handleExcel = () => {
        if (typeof onExcel === 'string') {
            // CSV downloads — open in same tab so browser triggers download
            const a = document.createElement('a');
            a.href = onExcel;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else if (typeof onExcel === 'function') {
            onExcel();
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={handlePdf}
                disabled={disabled}
                icon={FileText}
                className={`bg-red-600 hover:bg-red-700 text-white ${sizeClass} shadow-red-600/20`}
            >
                {pdfLabel}
            </Button>
            <Button
                onClick={handleExcel}
                disabled={disabled}
                icon={FileSpreadsheet}
                className={`!bg-emerald-600 hover:!bg-emerald-700 text-white ${sizeClass} shadow-emerald-600/20`}
            >
                {excelLabel}
            </Button>
        </div>
    );
}
