import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import {
    Calculator,
    Receipt,
    User,
    CheckCircle,
    History,
    BookOpen,
    CheckCircle2,
    Clock,
    Search,
    Download,
    MessageCircle,
    ExternalLink,
    ArrowUpRight,
    CreditCard,
} from "lucide-react";
import axios from "axios";
import PlotAndInvoiceModal from "./modals/PlotAndInvoiceModal";
import PayInvoiceModal from "./modals/PayInvoiceModal";
import PriceSimulatorModal from "./modals/PriceSimulatorModal";
import DataTable from "@/Components/ui/DataTable";
import SearchInput from "@/Components/ui/SearchInput";
import Button from "@/Components/ui/Button";
import Modal from "@/Components/Modal";

export default function Index({
    leads,
    placementTestLeads = [],
    rejoinStudents = [],
    paketLanjutStudents = [],
    classes,
    priceMasters,
    recentInvoices = [],
    expiringClasses,
    pendingClassRequests = [],
    stats = {},
    paymentAccounts = [],
}) {
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [bulkConfirmClass, setBulkConfirmClass] = useState(null);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null); // Can be lead or student
    const [entityType, setEntityType] = useState("lead"); // 'lead' or 'student'
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState(
        pendingClassRequests?.length > 0 ? "class_requests" : "placement_test",
    );

    const expiringClassesList = useMemo(() => {
        if (!expiringClasses) return [];
        if (Array.isArray(expiringClasses)) return expiringClasses;
        if (expiringClasses.data && Array.isArray(expiringClasses.data))
            return expiringClasses.data;
        return [];
    }, [expiringClasses]);

    const classList = useMemo(() => {
        if (!classes) return [];
        if (Array.isArray(classes)) return classes;
        if (classes.data && Array.isArray(classes.data)) return classes.data;
        return [];
    }, [classes]);

    const filteredPlacementTestLeads = useMemo(() => {
        return (placementTestLeads || []).filter(
            (lead) =>
                lead.name.toLowerCase().includes(search.toLowerCase()) ||
                lead.phone?.includes(search) ||
                lead.branch?.name?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [placementTestLeads, search]);

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState(null);

    const openPlotModal = (entity, type = "lead") => {
        setSelectedEntity(entity);
        setEntityType(type);
        setIsPlotModalOpen(true);
    };

    const handleOpenPayModal = (invoice) => {
        setSelectedInvoiceToPay(invoice);
        setIsPayModalOpen(true);
    };

    const handleConfirmPay = (paymentMethod, callback) => {
        if (!selectedInvoiceToPay) return;
        router.post(
            route("admin.finance.invoices.pay", selectedInvoiceToPay.id),
            { payment_method: paymentMethod },
            {
                onFinish: () => {
                    if (callback) callback();
                    setIsPayModalOpen(false);
                    setSelectedInvoiceToPay(null);
                },
            },
        );
    };

    const handleSendInvoiceWA = async (invoice) => {
        const lead = invoice.lead || invoice.student?.lead;
        if (!lead) {
            alert("Data siswa / lead tidak ditemukan untuk invoice ini.");
            return;
        }

        const publicUrl = route("public.invoice.download", invoice.id);
        const name = lead.nickname || lead.name;
        const isPaid = invoice.status === "paid";

        let typeLabel = "pendaftaran";
        if (invoice.type === "placement_test") {
            typeLabel = "placement test";
        } else if (invoice.type === "rejoin") {
            typeLabel = "rejoin";
        } else if (invoice.type === "paket_lanjut") {
            typeLabel = "paket lanjut";
        }

        let message = `Halo *${name}*,\n\n`;
        if (isPaid) {
            message +=
                `Berikut adalah bukti pembayaran ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                `${publicUrl}\n\n` +
                `Terima kasih!`;
        } else {
            message +=
                `Berikut adalah tagihan ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                `${publicUrl}\n\n` +
                `Silakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih!`;
        }

        if (
            window.confirm(
                `Kirim invoice ${invoice.invoice_number} via WhatsApp?`,
            )
        ) {
            try {
                // Use LeadController's endpoint to ensure logging to LeadChatLog
                await axios.post(
                    route("admin.crm.leads.send-whatsapp", lead.id),
                    {
                        message: message,
                    },
                );
                alert("Invoice berhasil dikirim via WhatsApp.");
            } catch (err) {
                alert(
                    "Gagal mengirim WhatsApp: " +
                        (err.response?.data?.error || err.response?.data?.message || err.message),
                );
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "paid":
                return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "pending":
                return "bg-amber-50 text-amber-600 border-amber-100";
            case "cancelled":
                return "bg-red-50 text-red-600 border-red-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const filteredLeads = (leads || []).filter(
        (lead) =>
            lead.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.includes(search) ||
            lead.branch?.name?.toLowerCase().includes(search.toLowerCase()),
    );

    const leadColumns = [
        {
            header: "Entity Name",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">
                            {activeTab === "new" ||
                            activeTab === "placement_test"
                                ? row.name
                                : row.lead?.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {activeTab === "new" ||
                            activeTab === "placement_test"
                                ? row.branch?.name
                                : row.lead?.branch?.name}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header:
                activeTab === "new"
                    ? "Lead Type / Kelas"
                    : activeTab === "placement_test"
                        ? "Lead Type"
                        : "Last Class",
            render: (row) => {
                if (activeTab === "placement_test") {
                    return (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                            {row.lead_type?.name || "General"}
                        </span>
                    );
                }
                if (activeTab === "new") {
                    const plottedClassName =
                        row.plotting?.class_name ||
                        (row.plotting?.study_class_id
                            ? classList.find(
                                  (c) => c.id === row.plotting?.study_class_id,
                              )?.name
                            : null);
                    return (
                        <div className="space-y-1">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100 inline-block">
                                {row.lead_type?.name || "General"}
                            </span>
                            {plottedClassName && (
                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                    {plottedClassName}
                                    {row.plotting?.remaining_meetings ? (
                                        <span className="text-slate-400 font-bold ml-1 text-[10px]">
                                            ({row.plotting.remaining_meetings} Sesi)
                                        </span>
                                    ) : null}
                                </p>
                            )}
                        </div>
                    );
                }
                return (
                    <span className="text-xs font-bold text-slate-600">
                        {row.study_classes?.[0]?.name || "No history"}
                    </span>
                );
            },
        },
        {
            header: "Status",
            render: (row) => {
                if (activeTab === "placement_test") {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Placement Test
                            </span>
                        </div>
                    );
                }
                if (activeTab === "new") {
                    const isPlotted = !!(row.plotting?.study_class_id);
                    return (
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${isPlotted ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}
                            />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isPlotted ? "text-emerald-700" : "text-slate-400"}`}>
                                {isPlotted ? "Plotting Selesai" : "Awaiting Plotting"}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Inactive (Rejoin)
                        </span>
                    </div>
                );
            },
        },
        {
            header: "Invoice Status",
            render: (row) => {
                const invoiceCount = row.pending_invoices_count ?? null;
                if (invoiceCount === null) return null;

                if (invoiceCount > 0) {
                    const pendingInvoice =
                        row.invoices?.find((inv) => inv.status === "pending") ||
                        row.lead?.invoices?.find((inv) => inv.status === "pending");
                    const latestInvoice =
                        pendingInvoice ||
                        row.invoices?.[0] ||
                        row.lead?.invoices?.[0];
                    const searchKey =
                        latestInvoice?.invoice_number ||
                        row.name ||
                        row.lead?.name ||
                        "";

                    return (
                        <Link
                            href={route("admin.finance.invoices.index", {
                                search: searchKey,
                            })}
                            className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1.5 w-fit transition-all group cursor-pointer shadow-xs"
                            title={`Lihat invoice ${latestInvoice?.invoice_number || searchKey} di Buku Invoice`}
                        >
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Invoiced</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    );
                }

                return (
                    <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Not Yet
                    </span>
                );
            },
        },
        {
            header: "Actions",
            className: "text-right",
            render: (row) => {
                const alreadyInvoiced = (row.pending_invoices_count ?? 0) > 0;

                if (alreadyInvoiced) {
                    const pendingInvoice =
                        row.invoices?.find((inv) => inv.status === "pending") ||
                        row.lead?.invoices?.find((inv) => inv.status === "pending");
                    const latestInvoice =
                        pendingInvoice ||
                        row.invoices?.[0] ||
                        row.lead?.invoices?.[0];
                    const searchKey =
                        latestInvoice?.invoice_number ||
                        row.name ||
                        row.lead?.name ||
                        "";

                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={route("admin.finance.invoices.index", {
                                    search: searchKey,
                                })}
                                className="inline-flex items-center gap-1.5 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs hover:shadow active:scale-95 group cursor-pointer"
                                title={`Buka invoice ${latestInvoice?.invoice_number || searchKey} di Buku Invoice`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoice Sent</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>

                            {latestInvoice && latestInvoice.status === "pending" && (
                                <Button
                                    onClick={() => handleOpenPayModal(latestInvoice)}
                                    variant="primary"
                                    icon={CreditCard}
                                    className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95"
                                    title="Catat Pembayaran Langsung"
                                >
                                    Bayar
                                </Button>
                            )}

                            <Button
                                onClick={() => openPlotModal(row, "lead")}
                                variant="ghost"
                                icon={Calculator}
                                className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-slate-700 border border-slate-200 active:scale-95"
                                title="Re-generate invoice"
                            >
                                Re-Invoice
                            </Button>
                        </div>
                    );
                }

                return (
                    <Button
                        onClick={() =>
                            openPlotModal(
                                row,
                                activeTab === "placement_test" ||
                                    activeTab === "new"
                                    ? "lead"
                                    : "student",
                            )
                        }
                        variant="primary"
                        icon={Calculator}
                        className="inline-flex py-2 px-4 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/10 active:scale-95"
                    >
                        Generate Invoice
                    </Button>
                );
            },
        },
    ];

    const filteredExpiringClasses = useMemo(() => {
        return expiringClassesList.filter(
            (studyClass) =>
                studyClass.name.toLowerCase().includes(search.toLowerCase()) ||
                studyClass.branch?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase()) ||
                studyClass.instructor?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase()),
        );
    }, [expiringClassesList, search]);

    const filteredRejoinStudents = useMemo(() => {
        return rejoinStudents.filter(
            (student) =>
                (student.lead?.name || "")
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                (student.student_number || "")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
        );
    }, [rejoinStudents, search]);

    const filteredClassRequests = useMemo(() => {
        return (pendingClassRequests || []).filter((req) => {
            const name = req.lead?.name || req.student?.lead?.name || "";
            const className = req.study_class?.name || "";
            return (
                name.toLowerCase().includes(search.toLowerCase()) ||
                className.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [pendingClassRequests, search]);

    const classRequestColumns = [
        {
            header: "Entity Name",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-50 flex items-center justify-center rounded-xl text-sky-600">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">
                            {row.lead?.name ||
                                row.student?.lead?.name ||
                                "Unknown Lead"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {row.lead?.branch?.name || "Unknown Branch"}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Requested Class (CS)",
            render: (row) => (
                <div className="space-y-0.5">
                    <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-sky-100">
                        {row.study_class?.name || "Class Request"}
                    </span>
                    {row.notes && (
                        <p className="text-[9px] font-bold text-slate-400 italic">
                            "{row.notes}"
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: "Status",
            render: () => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                        Needs Invoice (CS Request)
                    </span>
                </div>
            ),
        },
        {
            header: "Actions",
            className: "text-right",
            render: (row) => (
                <Button
                    onClick={() => openPlotModal(row.lead || row, "lead")}
                    variant="primary"
                    icon={Calculator}
                    className="inline-flex py-2 px-4 bg-sky-600 hover:bg-sky-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-sky-600/10"
                >
                    Terbitkan Invoice
                </Button>
            ),
        },
    ];

    const formatIndoDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getRemainingDays = (endDateStr) => {
        if (!endDateStr) return "";
        const end = new Date(endDateStr);
        const today = new Date();
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} hari yang lalu`;
        } else if (diffDays === 0) {
            return "Hari ini";
        } else {
            return `${diffDays} hari lagi`;
        }
    };

    const handleOpenBulkInvoiceModal = (studyClass) => {
        setBulkConfirmClass(studyClass);
    };

    const handleConfirmBulkInvoice = () => {
        if (!bulkConfirmClass) return;
        setIsBulkSubmitting(true);
        router.post(
            route("admin.finance.classes.bulk-invoice", bulkConfirmClass.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBulkConfirmClass(null);
                },
                onError: (errs) => {
                    alert(Object.values(errs).flat().join('\n') || 'Gagal menerbitkan invoice.');
                },
                onFinish: () => {
                    setIsBulkSubmitting(false);
                },
            }
        );
    };

    const expiringClassColumns = [
        {
            header: "Class Details",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">
                            {row.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {row.branch?.name} •{" "}
                            {row.instructor?.name || "No Instructor"}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Students & Rate",
            render: (row) => {
                const studentCount = row.students?.length || 0;
                return (
                    <div className="space-y-1">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
                            {studentCount} Active Students
                        </span>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                            {row.price_master
                                ? formatCurrency(
                                      row.price_master.price_per_session,
                                  )
                                : "No price master rate"}
                        </p>
                    </div>
                );
            },
        },
        {
            header: "Invoice Status",
            render: (row) => {
                const studentCount = row.students?.length || 0;
                const invoiceCount = row.pending_bulk_invoices_count ?? null;
                const paidCount = row.paid_bulk_invoices_count ?? 0;

                if (invoiceCount === null) return null;

                if (invoiceCount > 0) {
                    return (
                        <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Invoiced ({invoiceCount}/{studentCount})
                            </span>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">
                                <span
                                    className={
                                        paidCount > 0
                                            ? "text-emerald-600 font-extrabold"
                                            : "text-slate-400"
                                    }
                                >
                                    {paidCount} siswa sudah bayar
                                </span>
                            </p>
                        </div>
                    );
                }

                return (
                    <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Belum Terbit
                    </span>
                );
            },
        },
        {
            header: "Ends On / Urgency",
            render: (row) => {
                const remainingDays = row.end_session_date
                    ? Math.ceil(
                          (new Date(row.end_session_date).setHours(0, 0, 0, 0) -
                              new Date().setHours(0, 0, 0, 0)) /
                              (1000 * 60 * 60 * 24),
                      )
                    : 0;
                const isUrgent = remainingDays <= 5;
                return (
                    <div className="space-y-1">
                        <span
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border ${
                                isUrgent
                                    ? "bg-rose-50 text-rose-700 border-rose-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                        >
                            {getRemainingDays(row.end_session_date)}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {formatIndoDate(row.end_session_date)}
                        </p>
                    </div>
                );
            },
        },
        {
            header: "Actions",
            className: "text-right",
            render: (row) => {
                const studentCount = row.students?.length || 0;
                const hasPriceMaster = !!row.price_master;
                const isDisabled = studentCount === 0 || !hasPriceMaster;
                const alreadyInvoiced =
                    (row.pending_bulk_invoices_count ?? 0) > 0;

                if (alreadyInvoiced) {
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={route("admin.finance.invoices.index", {
                                    search: row.name,
                                })}
                                className="inline-flex items-center gap-1.5 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs hover:shadow active:scale-95 group cursor-pointer"
                                title={`Buka invoice kelas ${row.name} di Buku Invoice`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoice Sent</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                            <Button
                                onClick={() => handleOpenBulkInvoiceModal(row)}
                                variant="ghost"
                                icon={Receipt}
                                className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-slate-700 border border-slate-200 cursor-pointer active:scale-95"
                                title="Re-generate bulk invoice"
                            >
                                Re-Invoice
                            </Button>
                        </div>
                    );
                }

                return (
                    <Button
                        onClick={() => handleOpenBulkInvoiceModal(row)}
                        variant="primary"
                        icon={Receipt}
                        disabled={isDisabled}
                        className={`inline-flex py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                            isDisabled
                                ? "bg-slate-200 text-slate-400 border-slate-200 shadow-none cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/10 cursor-pointer active:scale-95"
                        }`}
                        title={
                            studentCount === 0
                                ? "No active students to invoice"
                                : !hasPriceMaster
                                  ? "No price master assigned to class"
                                  : "Generate invoices for all students in this class"
                        }
                    >
                        Bulk Invoice
                    </Button>
                );
            },
        },
    ];
    const rejoinStudentColumns = [
        {
            header: "Siswa Rejoin",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">
                            {row.lead?.name || "Unknown Student"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {row.student_number} • Join {row.rejoin_count || 0}x
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Kelas Terakhir",
            render: (row) => {
                const lastClass = row.study_classes?.[0];
                return (
                    <div>
                        <p className="font-black text-slate-700 tracking-tight uppercase">
                            {lastClass?.name || "Belum Ada Kelas"}
                        </p>
                        {lastClass && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Stop Tanggal:{" "}
                                {formatIndoDate(
                                    row.stopped_at ||
                                        lastClass?.end_session_date,
                                )}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            header: "Paket Selesai",
            render: (row) => (
                <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100">
                    {row.rejoin_count || 0} Paket
                </span>
            ),
        },
        {
            header: "Invoice Status",
            render: (row) => {
                const invoiceCount = row.pending_invoices_count ?? null;
                if (invoiceCount === null) return null;

                if (invoiceCount > 0) {
                    const pendingInvoice =
                        row.invoices?.find((inv) => inv.status === "pending") ||
                        row.lead?.invoices?.find((inv) => inv.status === "pending");
                    const latestInvoice =
                        pendingInvoice ||
                        row.invoices?.[0] ||
                        row.lead?.invoices?.[0];
                    const searchKey =
                        latestInvoice?.invoice_number ||
                        row.lead?.name ||
                        "";

                    return (
                        <Link
                            href={route("admin.finance.invoices.index", {
                                search: searchKey,
                            })}
                            className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1.5 w-fit transition-all group cursor-pointer shadow-xs"
                            title={`Lihat invoice ${latestInvoice?.invoice_number || searchKey} di Buku Invoice`}
                        >
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Invoiced</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    );
                }

                return (
                    <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Not Yet
                    </span>
                );
            },
        },
        {
            header: "Actions",
            className: "text-right",
            render: (row) => {
                const alreadyInvoiced = (row.pending_invoices_count ?? 0) > 0;

                if (alreadyInvoiced) {
                    const pendingInvoice =
                        row.invoices?.find((inv) => inv.status === "pending") ||
                        row.lead?.invoices?.find((inv) => inv.status === "pending");
                    const latestInvoice =
                        pendingInvoice ||
                        row.invoices?.[0] ||
                        row.lead?.invoices?.[0];
                    const searchKey =
                        latestInvoice?.invoice_number ||
                        row.lead?.name ||
                        "";

                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={route("admin.finance.invoices.index", {
                                    search: searchKey,
                                })}
                                className="inline-flex items-center gap-1.5 py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs hover:shadow active:scale-95 group cursor-pointer"
                                title={`Buka invoice ${latestInvoice?.invoice_number || searchKey} di Buku Invoice`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoice Sent</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>

                            {latestInvoice && latestInvoice.status === "pending" && (
                                <Button
                                    onClick={() => handleOpenPayModal(latestInvoice)}
                                    variant="primary"
                                    icon={CreditCard}
                                    className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95"
                                    title="Catat Pembayaran Langsung"
                                >
                                    Bayar
                                </Button>
                            )}

                            <Button
                                onClick={() => openPlotModal(row, "student")}
                                variant="ghost"
                                icon={Calculator}
                                className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-slate-700 border border-slate-200 active:scale-95"
                                title="Re-generate invoice"
                            >
                                Re-Invoice
                            </Button>
                        </div>
                    );
                }

                return (
                    <Button
                        onClick={() => openPlotModal(row, "student")}
                        variant="primary"
                        icon={Calculator}
                        className="inline-flex py-2 px-4 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/10 active:scale-95"
                    >
                        Generate Invoice
                    </Button>
                );
            },
        },
    ];

    let currentData = [];
    let currentColumns = [];

    if (activeTab === "class_requests") {
        currentData = filteredClassRequests;
        currentColumns = classRequestColumns;
    } else if (activeTab === "placement_test") {
        currentData = filteredPlacementTestLeads;
        currentColumns = leadColumns;
    } else if (activeTab === "new") {
        currentData = filteredLeads;
        currentColumns = leadColumns;
    } else if (activeTab === "paket_lanjut") {
        currentData = filteredExpiringClasses;
        currentColumns = expiringClassColumns;
    } else if (activeTab === "rejoin") {
        currentData = filteredRejoinStudents;
        currentColumns = rejoinStudentColumns;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Billing Center" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Billing <span className="text-red-600">Center</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                            System Overview & Invoice Control Center
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSimulatorOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                            <Calculator size={14} className="text-red-600" />
                            Simulasi Hitung Harga
                        </button>
                        <Link
                            href={route("admin.finance.invoices.index")}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            <Receipt size={14} />
                            Buka Buku Invoice
                            <ArrowUpRight
                                size={14}
                                className="text-slate-400"
                            />
                        </Link>
                    </div>
                </div>

                {/* KPI Summary Cards (Compact & Refined) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Tagihan Pending */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Tagihan Pending
                                </span>
                                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                    <Clock size={15} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {formatCurrency(stats.pending_amount || 0)}
                            </h3>
                            <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
                                {stats.pending_count || 0} invoice belum lunas
                            </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                            <Link
                                href={route("admin.finance.invoices.index", {
                                    status: "pending",
                                })}
                                className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                            >
                                Kelola Invoices <ExternalLink size={10} />
                            </Link>
                        </div>
                    </div>

                    {/* 2. Penerimaan Bulan Ini */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Lunas Bulan Ini
                                </span>
                                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 size={15} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {formatCurrency(stats.paid_month_amount || 0)}
                            </h3>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                {stats.paid_month_count || 0} transaksi lunas
                            </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                            <Link
                                href={route("admin.finance.invoices.index", {
                                    status: "paid",
                                })}
                                className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                            >
                                Riwayat Pembayaran <ExternalLink size={10} />
                            </Link>
                        </div>
                    </div>

                    {/* 3. Antrean Placement Test */}
                    <div
                        onClick={() => setActiveTab("placement_test")}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Antrean Placement Test
                                </span>
                                <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                    <Calculator size={15} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {(placementTestLeads || []).length} Siswa
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                Menunggu tagihan tes
                            </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900">
                                Buka Antrean Tab →
                            </span>
                        </div>
                    </div>

                    {/* 4. Potensi Rejoin & Lanjut */}
                    <div
                        onClick={() =>
                            setActiveTab(
                                expiringClassesList.length > 0
                                    ? "paket_lanjut"
                                    : "rejoin",
                            )
                        }
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Siswa Stop & Berakhir
                                </span>
                                <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                    <User size={15} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {(rejoinStudents || []).length} Siswa Stop
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                {expiringClassesList.length} kelas mendekati
                                selesai
                            </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900">
                                Kelola Renewal & Rejoin →
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Invoicing Queue (Full-Width) */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl overflow-x-auto max-w-full scrollbar-none">
                            {pendingClassRequests?.length > 0 && (
                                <Button
                                    onClick={() =>
                                        setActiveTab("class_requests")
                                    }
                                    variant="ghost"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-none shrink-0 ${
                                        activeTab === "class_requests"
                                            ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black hover:bg-red-600"
                                            : "text-slate-500 font-extrabold hover:text-red-600 hover:bg-red-50/50"
                                    }`}
                                >
                                    Class Requests (
                                    {(pendingClassRequests || []).length})
                                </Button>
                            )}
                            <Button
                                onClick={() => setActiveTab("placement_test")}
                                variant="ghost"
                                className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-none shrink-0 ${
                                    activeTab === "placement_test"
                                        ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black hover:bg-red-600"
                                        : "text-slate-500 font-extrabold hover:text-red-600 hover:bg-red-50/50"
                                }`}
                            >
                                Placement Test (
                                {(placementTestLeads || []).length})
                            </Button>
                            <Button
                                onClick={() => setActiveTab("new")}
                                variant="ghost"
                                className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-none shrink-0 ${
                                    activeTab === "new"
                                        ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black hover:bg-red-600"
                                        : "text-slate-500 font-extrabold hover:text-red-600 hover:bg-red-50/50"
                                }`}
                            >
                                New Leads ({leads.length})
                            </Button>
                            <Button
                                onClick={() => setActiveTab("paket_lanjut")}
                                variant="ghost"
                                className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-none shrink-0 ${
                                    activeTab === "paket_lanjut"
                                        ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black hover:bg-red-600"
                                        : "text-slate-500 font-extrabold hover:text-red-600 hover:bg-red-50/50"
                                }`}
                            >
                                Paket Lanjut ({expiringClassesList.length})
                            </Button>
                            <Button
                                onClick={() => setActiveTab("rejoin")}
                                variant="ghost"
                                className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-none shrink-0 ${
                                    activeTab === "rejoin"
                                        ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-black hover:bg-red-600"
                                        : "text-slate-500 font-extrabold hover:text-red-600 hover:bg-red-50/50"
                                }`}
                            >
                                Rejoin ({rejoinStudents.length})
                            </Button>
                        </div>

                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search in this list..."
                            className="!max-w-xs"
                        />
                    </div>

                    <DataTable
                        data={currentData}
                        columns={currentColumns}
                        itemsPerPage={10}
                        isLoading={false}
                    />

                    {currentData.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                            <Search className="w-12 h-12 text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                {search
                                    ? `No results found for "${search}"`
                                    : "No items available in this category"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <PlotAndInvoiceModal
                show={isPlotModalOpen}
                onClose={() => setIsPlotModalOpen(false)}
                lead={
                    entityType === "lead"
                        ? selectedEntity
                        : selectedEntity?.lead
                }
                student={entityType === "student" ? selectedEntity : null}
                classes={classes}
                priceMasters={priceMasters}
            />
            <PriceSimulatorModal
                show={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                classes={classes}
                priceMasters={priceMasters}
            />
            <PayInvoiceModal
                isOpen={isPayModalOpen}
                onClose={() => {
                    setIsPayModalOpen(false);
                    setSelectedInvoiceToPay(null);
                }}
                onConfirm={handleConfirmPay}
                invoiceNumber={selectedInvoiceToPay?.invoice_number}
                totalAmount={selectedInvoiceToPay?.total_amount}
                paymentAccounts={paymentAccounts}
            />

            {/* Bulk Invoice Confirmation Modal */}
            <Modal
                show={!!bulkConfirmClass}
                onClose={() => !isBulkSubmitting && setBulkConfirmClass(null)}
                maxWidth="md"
            >
                <div className="p-6 sm:p-7 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                Terbitkan Bulk Invoice
                            </h3>
                            <p className="text-xs font-semibold text-slate-500">
                                Renewal paket lanjut untuk seluruh siswa aktif di kelas ini.
                            </p>
                        </div>
                    </div>

                    {bulkConfirmClass && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Nama Kelas</span>
                                <span className="font-black text-slate-800 uppercase">{bulkConfirmClass.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Cabang</span>
                                <span className="font-black text-slate-700">{bulkConfirmClass.branch?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Total Siswa Aktif</span>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-black text-[11px] border border-blue-100">
                                    {bulkConfirmClass.students?.length || 0} Siswa
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tarif Master Harga</span>
                                <span className="font-black text-slate-900 text-sm">
                                    {bulkConfirmClass.price_master ? formatCurrency(bulkConfirmClass.price_master.price_per_session) : 'Belum Ada'}
                                </span>
                            </div>
                        </div>
                    )}

                    {(!bulkConfirmClass?.students?.length || !bulkConfirmClass?.price_master) ? (
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
                            {!bulkConfirmClass?.students?.length 
                                ? "Kelas ini belum memiliki siswa aktif, sehingga invoice tidak dapat dibuat."
                                : "Kelas ini belum memiliki Price Master yang valid."}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Invoice baru berstatus <span className="font-bold text-amber-600">Pending</span> akan diterbitkan secara otomatis untuk seluruh siswa aktif. Siswa yang sudah melunasi invoice renewal pada siklus ini akan dilewati secara otomatis.
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isBulkSubmitting}
                            onClick={() => setBulkConfirmClass(null)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={isBulkSubmitting || !bulkConfirmClass?.students?.length || !bulkConfirmClass?.price_master}
                            onClick={handleConfirmBulkInvoice}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                            {isBulkSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Ya, Terbitkan Invoice</span>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
