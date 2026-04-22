import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    CircleDollarSign,
    Tag,
    Receipt,
    ChevronFirst,
    ChevronLast,
} from "lucide-react";
import Navbar from "@/Components/shared/Navbar";
import Toast from "@/Components/ui/Toast";
import NotificationToast from "@/Components/ui/NotificationToast";
import useWhatsappNotification from "@/Hooks/useWhatsappNotification";

const logoUrl = "/assets/images/local/IELC-Logo.webp";

const menuItems = [
    {
        category: "Finance",
        items: [
            {
                icon: <LayoutDashboard size={20} />,
                text: "Dashboard",
                name: "admin.finance.dashboard",
                href: route("admin.finance.dashboard"),
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
        ],
    },
];

const SidebarContext = React.createContext();

export default function FinanceLayout({ children }) {
    const [expanded, setExpanded] = React.useState(true);
    const { notifications, removeNotification } = useWhatsappNotification();
    const { auth } = usePage().props;

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
                            {menuItems.map((group, index) => (
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
