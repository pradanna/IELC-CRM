import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import Pagination from "./Pagination";

const DataTable = ({
    data = [],
    columns = [],
    itemsPerPage = 10,
    filterSection,
    onRowClick,
    isLoading = false,
    pagination = null,
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
        <div className="p-0 overflow-hidden border border-gray-100 rounded-lg">
            {/* --- Filter Section Slot --- */}
            {filterSection && (
                <div className="p-2 bg-white border-b border-gray-200">
                    {filterSection}
                </div>
            )}

            {/* --- Table --- */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.header}
                                    className={`px-6 py-4 ${col.className || ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td
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
                                </td>
                            </tr>
                        ) : currentData.length > 0 ? (
                            currentData.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    onClick={() =>
                                        onRowClick && onRowClick(row)
                                    }
                                    className={`transition-colors ${
                                        onRowClick
                                            ? "cursor-pointer hover:bg-gray-50"
                                            : ""
                                    }`}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={`${col.accessor}-${row.id}`}
                                            className={`px-6 py-4 align-top ${col.className || ""}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    Tidak ada data ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Footer --- */}
            {(isServerSide || data.length > itemsPerPage) && (
                <div className="p-4 flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 bg-white">
                    <span>
                        Showing{" "}
                        <span className="font-medium text-gray-900">{startIndex}</span> ke{" "}
                        <span className="font-medium text-gray-900">{endIndex}</span> dari{" "}
                        <span className="font-medium text-gray-900">{totalEntries}</span>{" "}
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
                            <span className="text-sm font-medium">
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
