import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Building2,
    BookCopy,
    Package,
    Users,
    Settings,
    ChevronFirst,
    ChevronLast,
    Headset,
    PhoneCall,
    FileText,
    CircleDollarSign,
    GraduationCap,
    Tag,
    Receipt,
    Gift,
    BarChart3,
} from "lucide-react";
import Navbar from "@/Components/shared/Navbar";
import Toast from "@/Components/ui/Toast";
import NotificationToast from "@/Components/ui/NotificationToast";
import useWhatsappNotification from "@/Hooks/useWhatsappNotification";
import LeadDetailDrawer from "@/Pages/Admin/Crm/drawers/LeadDetailDrawer";

// IELC Logo
const logoUrl = "/assets/images/local/IELC-Logo.webp";

const menuItems = [
    {
        category: "CRM & Leads",
        items: [
            {
                icon: <LayoutDashboard size={20} />,
                text: "CRM Dashboard",
                href: route("admin.crm.leads.index"),
                name: "admin.crm.leads.index",
            },
            {
                icon: <Users size={20} />,
                text: "Leads List",
                href: route("admin.crm.leads.list"),
                name: "admin.crm.leads.list",
            },
            {
                icon: <Building2 size={20} />,
                text: "Kanban Pipeline",
                href: route("admin.crm.leads.kanban"),
                name: "admin.crm.leads.kanban",
            },
            {
                icon: <FileText size={20} />,
                text: "Placement Tests",
                href: route("admin.placement-tests.index"),
                name: "admin.placement-tests.*",
            },
            {
                icon: <FileText size={20} />,
                text: "CRM Reports",
                href: route("admin.crm.reports.index"),
                name: "admin.crm.reports.*",
            },
        ],
    },
    {
        category: "Academic",
        items: [
            {
                icon: <Users size={20} />,
                text: "Students",
                href: route("admin.academic.students.index"),
                name: "admin.academic.students.*",
            },
            {
                icon: <BookCopy size={20} />,
                text: "Study Classes",
                href: route("admin.academic.study-classes.index"),
                name: "admin.academic.study-classes.*",
            },
        ],
    },
    {
        category: "Finance",
        items: [
            {
                icon: <CircleDollarSign size={20} />,
                text: "Billing Center",
                href: route("admin.finance.dashboard"),
                name: "admin.finance.dashboard",
            },
            {
                icon: <Receipt size={20} />,
                text: "Invoices",
                href: route("admin.finance.invoices.index"),
                name: "admin.finance.invoices.*",
            },
            {
                icon: <Tag size={20} />,
                text: "Price Master",
                href: route("admin.finance.price-masters.index"),
                name: "admin.finance.price-masters.*",
            },
            {
                icon: <Gift size={20} />,
                text: "Diskon",
                href: route("admin.finance.loyalty-settings.index"),
                name: "admin.finance.loyalty-settings.*",
            },
            {
                icon: <BarChart3 size={20} />,
                text: "Laporan",
                href: route("admin.finance.reports.index"),
                name: "admin.finance.reports.index",
            },
        ],
    },
    {
        category: "Management",
        items: [
            {
                icon: <BookCopy size={20} />,
                text: "Master",
                href: route("admin.master.index"),
                name: "admin.master.index",
            },
            // {
            //     icon: <LayoutDashboard size={20} />,
            //     text: "Schedule",
            //     href: route("admin.schedules.index"),
            //     name: "admin.schedules.*",
            // },
            {
                icon: <GraduationCap size={20} />,
                text: "Academic",
                href: route("admin.academic.students.index"),
                name: "admin.academic.students.*",
            },
        ],
    },
    {
        category: "Users",
        items: [
            {
                icon: <Users size={20} />,
                text: "Teachers",
                href: route("admin.teachers.index"),
                name: "admin.teachers.*",
            },
        ],
    },
    {
        category: "System",
        items: [
            {
                icon: <Settings size={20} />,
                text: "Settings",
                href: route("admin.crm.settings.index"),
                name: "admin.crm.settings.*",
            },
            {
                icon: <PhoneCall size={20} />,
                text: "WhatsApp",
                href: route("admin.whatsapp.index"),
                name: "admin.whatsapp.*",
            },
            {
                icon: <Users size={20} />,
                text: "Staff Accounts",
                href: route("admin.master.users.index"),
                name: "admin.master.users.*",
            },
        ],
    },
];

const SidebarContext = React.createContext();

export default function AdminLayout({ children }) {
    const [expanded, setExpanded] = React.useState(true);
    const { notifications, removeNotification } = useWhatsappNotification();
    const { auth } = usePage().props;
    const userRole = auth.user.role?.toLowerCase(); // Ensure case-insensitivity
    const isSuperAdmin = userRole === 'superadmin' || userRole === 'super-admin' || !!auth.user.superadmin;
    const isFrontdesk = userRole === 'frontdesk' || !!auth.user.frontdesk;
    const isFinance = userRole === 'finance' || !!auth.user.finance;
    const isMarketing = userRole === 'marketing' || !!auth.user.marketing;
    const isTeacher = userRole === 'teacher' || !!auth.user.teacher;

    const filteredMenu = menuItems.filter(group => {
        if (isSuperAdmin) return true;
        
        if (isFrontdesk) {
            return ['CRM & Leads', 'Academic', 'Management', 'Users'].includes(group.category);
        }

        if (isFinance) {
            return ['Main', 'Finance', 'System'].includes(group.category);
        }

        if (isMarketing) {
            return ['Main', 'Management'].includes(group.category);
        }

        if (isTeacher) {
            return ['Users'].includes(group.category);
        }

        return false;
    }).map(group => {
        if (isSuperAdmin) return group;

        return {
            ...group,
            items: group.items.filter(item => {
                if (isFrontdesk) {
                    const allowed = ['CRM Dashboard', 'Leads List', 'Kanban Pipeline', 'Placement Tests', 'CRM Reports', 'Academic Dashboard', 'Students', 'Study Classes', 'Master', 'Academic'];
                    return allowed.includes(item.text);
                }
                if (isFinance) {
                    const allowed = ['Dashboard', 'Invoices', 'Price Master', 'Staff Accounts', 'WhatsApp'];
                    return allowed.includes(item.text);
                }
                if (isMarketing) {
                    const allowed = ['Dashboard', 'Crm'];
                    return allowed.includes(item.text);
                }
                if (isTeacher) {
                    const allowed = ['Students'];
                    return allowed.includes(item.text);
                }
                return true;
            })
        };
    }).filter(group => group.items.length > 0);

    return (
        <div className="flex">
            <aside className="h-screen sticky top-0 z-50">
                <nav className="h-full flex flex-col bg-black border-r border-gray-700 shadow-sm">
                    <div
                        className={`p-4 pb-2 flex justify-between items-center ${
                            expanded ? "" : "pb-4"
                        }`}
                    >
                        <img
                            src={logoUrl}
                            className={`overflow-hidden transition-all ${
                                expanded ? "w-32" : "w-0"
                            }`}
                            alt="IELC Logo"
                        />
                        <button
                            onClick={() => setExpanded((curr) => !curr)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                        >
                            {expanded ? <ChevronFirst /> : <ChevronLast />}
                        </button>
                    </div>

                    <SidebarContext.Provider value={{ expanded }}>
                        <ul className="flex-1 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                            {filteredMenu.map((group, index) => (
                                <React.Fragment key={index}>
                                    {group.category && expanded && (
                                        <li className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-gray-400">
                                            {group.category}
                                        </li>
                                    )}
                                    {group.items.map((item, itemIndex) => (
                                        <SidebarItem
                                            key={itemIndex}
                                            {...item}
                                            active={route().current(item.name)}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </ul>
                    </SidebarContext.Provider>
                </nav>
            </aside>
            <main className="flex-1 bg-gray-50">
                <Navbar 
                    user={auth.user} 
                    waNotifications={notifications}
                    onWaRemove={removeNotification}
                />
                <Toast />
                <NotificationToast 
                    notifications={notifications} 
                    onRemove={removeNotification} 
                />
                <div className="p-4">{children}</div>
            </main>
            <LeadDetailDrawer />
        </div>
    );
}

export function SidebarItem({ icon, text, active, alert, href }) {
    const { expanded } = React.useContext(SidebarContext);

    return (
        <Link
            href={href}
            className={`
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                ${
                    active
                        ? "bg-primary-800 text-white"
                        : "hover:bg-primary-900 text-gray-400 hover:text-gray-200"
                }
            `}
        >
            {icon}
            <span
                className={`overflow-hidden transition-all ${
                    expanded ? "w-52 ml-3" : "w-0"
                }`}
            >
                {text}
            </span>
            {alert && (
                <div
                    className={`absolute right-2 w-2 h-2 rounded bg-primary-400 ${
                        expanded ? "" : "top-2"
                    }`}
                />
            )}
        </Link>
    );
}

