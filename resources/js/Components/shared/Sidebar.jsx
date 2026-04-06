import React, { createContext, useContext, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    ChevronFirst,
    ChevronLast,
    LogOut,
    MoreVertical,
} from "lucide-react";

const SidebarContext = createContext();

export default function Sidebar({ menuItems, user }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <aside className="h-screen">
            <nav className="h-full flex flex-col bg-gray-900 border-r border-gray-700 shadow-sm">
                <div
                    className={`p-4 pb-2 flex justify-between items-center ${
                        expanded ? "" : "pb-4"
                    }`}
                >
                    <img
                        src={"/assets/images/ielc-logo-white.png"}
                        className={`overflow-hidden transition-all ${
                            expanded ? "w-32" : "w-0"
                        }`}
                        alt="IELC Logo"
                    />
                    <button
                        onClick={() => setExpanded((curr) => !curr)}
                        className="p-1.5 rounded-lg text-gray-400 bg-gray-800 hover:bg-gray-700"
                    >
                        {expanded ? (
                            <ChevronFirst size={20} />
                        ) : (
                            <ChevronLast size={20} />
                        )}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3">
                        {menuItems.map((group, index) => (
                            <React.Fragment key={index}>
                                {group.category && expanded && (
                                    <li className="px-3 pt-5 pb-2 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                                        {group.category}
                                    </li>
                                )}
                                {group.items.map((item, itemIndex) => (
                                    <SidebarItem
                                        key={itemIndex}
                                        icon={item.icon}
                                        text={item.text}
                                        href={item.href}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </ul>
                </SidebarContext.Provider>

                <div className="border-t border-gray-700 flex p-3">
                    <img
                        src={`https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=${user.name.replace(
                            " ",
                            "+"
                        )}`}
                        alt=""
                        className="w-10 h-10 rounded-md"
                    />
                    <div
                        className={`
                            flex justify-between items-center
                            overflow-hidden transition-all ${
                                expanded ? "w-52 ml-3" : "w-0"
                            }
                        `}
                    >
                        <div className="leading-4">
                            <h4 className="font-semibold text-sm text-white">
                                {user.name}
                            </h4>
                            <span className="text-xs text-gray-400">
                                {user.email}
                            </span>
                        </div>
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="text-gray-400 hover:text-white"
                        >
                            <LogOut size={20} />
                        </Link>
                    </div>
                </div>
            </nav>
        </aside>
    );
}

export function SidebarItem({ icon, text, href }) {
    const { expanded } = useContext(SidebarContext);
    const { url } = usePage();
    const isActive = href ? url.startsWith(href) : false;

    return (
        <Link
            href={href}
            className={`
                relative flex items-center py-2 px-3 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                ${
                    isActive
                        ? "bg-primary-900/40 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }
            `}
        >
            {React.cloneElement(icon, { size: 20 })}
            <span
                className={`overflow-hidden transition-all text-sm ${
                    expanded ? "w-52 ml-3" : "w-0"
                }`}
            >
                {text}
            </span>

            {!expanded && (
                <div
                    className={`
                        absolute left-full rounded-md px-2 py-1 ml-6
                        bg-gray-800 text-white text-sm
                        invisible opacity-20 -translate-x-3 transition-all
                        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    `}
                >
                    {text}
                </div>
            )}
        </Link>
    );
}
