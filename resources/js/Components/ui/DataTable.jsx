import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import Pagination from "./Pagination";
import { Table, THead, TBody, TR, TH, TD } from "./Table";

const DataTable = ({
    data = [],
    columns = [],
    itemsPerPage = 10,
    filterSection,
    onRowClick,
    isLoading = false,
    pagination = null,
    noPanel = false,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // --- Pagination Logic ---
    const isServerSide = !!pagination;
    const currentData = isServerSide ? data : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalEntries = isServerSide ? (pagination.total || data.length) : data.length;
    const totalPages = isServerSide ? (pagination.last_page || 1) : Math.ceil(data.length / itemsPerPage);
    const startIndex = isServerSide ? (pagination.from || 1) : ((currentPage - 1) * itemsPerPage + 1);
    const endIndex = isServerSide ? (pagination.to || data.length) : Math.min(currentPage * itemsPerPage, data.length);

    const handlePrevPage = () => {
        if (!isServerSide) {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
        }
    };

    const handleNextPage = () => {
        if (!isServerSide) {
            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
        }
    };

    return (
        <div className="p-0 overflow-hidden">
            {/* --- Filter Section Slot --- */}
            {filterSection && (
                <div className="p-2 bg-white border-b border-gray-200 mb-4">
                    {filterSection}
                </div>
            )}

            {/* --- Table --- */}
            <Table noPanel={noPanel}>
                <THead className={noPanel ? "!bg-transparent border-b-2 border-slate-200" : ""}>
                    <TR hover={false}>
                        {columns.map((col) => (
                            <TH
                                key={col.header}
                                className={col.className || ""}
                            >
                                {col.header}
                            </TH>
                        ))}
                    </TR>
                </THead>
                <TBody>
                    {isLoading ? (
                        <TR hover={false}>
                            <TD
                                colSpan={columns.length}
                                className="text-center p-8"
                            >
                                <div className="flex justify-center items-center gap-2 text-gray-500">
                                    <Loader2
                                        className="animate-spin"
                                        size={20}
                                    />
                                    <span>Loading data...</span>
                                </div>
                            </TD>
                        </TR>
                    ) : currentData.length > 0 ? (
                        currentData.map((row, rowIndex) => (
                            <TR
                                key={row.id || rowIndex}
                                onClick={() =>
                                    onRowClick && onRowClick(row)
                                }
                                className={onRowClick ? "cursor-pointer" : ""}
                                hover={!!onRowClick}
                            >
                                {columns.map((col, colIndex) => (
                                    <TD
                                        key={`${col.accessor || col.header || colIndex}-${row.id || rowIndex}`}
                                        className={`align-top ${col.className || ""}`}
                                    >
                                        {col.render
                                            ? col.render(row, rowIndex)
                                            : row[col.accessor]}
                                    </TD>
                                ))}
                            </TR>
                        ))
                    ) : (
                        <TR hover={false}>
                            <TD
                                colSpan={columns.length}
                                className="px-6 py-8 text-center text-gray-500"
                            >
                                Tidak ada data ditemukan.
                            </TD>
                        </TR>
                    )}
                </TBody>
            </Table>

            {/* --- Pagination Footer --- */}
            {(isServerSide || data.length > 0) && (
                <div className="p-4 mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <span>
                        Showing{" "}
                        <span className="font-black text-slate-900">{startIndex}</span> ke{" "}
                        <span className="font-black text-slate-900">{endIndex}</span> dari{" "}
                        <span className="font-black text-slate-900">{totalEntries}</span>{" "}
                        data
                    </span>
                    
                    {isServerSide ? (
                        <Pagination links={pagination.links} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 h-auto"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <span className="text-[10px] font-black text-slate-900">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 h-auto"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataTable;
