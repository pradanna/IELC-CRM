import React from "react";

const Badge = ({ children, type = "default" }) => {
    // Mapping warna status
    const styles = {
        success: "bg-green-100 text-green-700 border-green-200", // Paid, Active, Converted
        warning: "bg-yellow-100 text-yellow-700 border-yellow-200", // Pending, Scheduled
        danger: "bg-red-100 text-red-700 border-red-200", // Unpaid, Overdue, Lost
        info: "bg-blue-100 text-blue-700 border-blue-200", // New, Contacted
        default: "bg-gray-100 text-gray-700 border-gray-200",
    };

    // Logic simple untuk deteksi warna otomatis berdasarkan teks (Opsional)
    let appliedType = type;
    const text = children ? children.toString().toLowerCase() : "";

    if (["paid", "active", "converted", "hadir"].includes(text))
        appliedType = "success";
    if (["pending", "scheduled", "trial"].includes(text))
        appliedType = "warning";
    if (["unpaid", "overdue", "lost", "alpa"].includes(text))
        appliedType = "danger";
    if (["new", "contacted", "izin"].includes(text)) appliedType = "info";

    return (
        <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[appliedType]}`}
        >
            {children}
        </span>
    );
};

export default Badge;
