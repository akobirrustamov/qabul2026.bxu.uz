import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaInstagram, FaPhone } from "react-icons/fa";
import {
    User,
    Plus,
    Users,
    Tag,
    DollarSign,
    Link2,
    LogOut,
    Menu,
    X,
} from "lucide-react";

function Sidebar() {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const menu = [
        { name: "Profil", path: "/ref/profile", icon: <User size={18} /> },
        { name: "Talaba qo'shish", path: "/ref/add-student", icon: <Plus size={18} /> },
        { name: "Qo'shilgan talabalar", path: "/ref/students", icon: <Users size={18} /> },
        { name: "To'lovlar", path: "/ref/payment", icon: <Tag size={18} /> },
        {
            name: "Balansdan pul chiqarish",
            path: "/ref/balance",
            icon: <DollarSign size={18} />,
        },
        { name: "Yo'naltiruvchi havolangiz", path: "/ref/link", icon: <Link2 size={18} /> },
        { name: "Instagram", path: "/ref/instagram", icon: <FaInstagram size={18} /> },
        { name: "Aloqa", path: "/ref/support", icon: <FaPhone size={18} /> },
        { name: "Akkountdan chiqish", path: "/admin/login", icon: <LogOut size={18} /> },
    ];

    return (
        <>
            {/* Mobil menyu tugmasi */}
            <div className="lg:hidden items-center pl-2 pt-2 bg-white fixed top-0 left-0 w-full shadow-md z-50">
                <button onClick={() => setOpen(true)}>
                    <Menu size={28} className="text-gray-800" />
                </button>
            </div>

            {/* Sidebar (desktop uchun) */}
            <div className="hidden lg:flex fixed top-0 left-0 w-64 h-screen bg-white shadow-lg p-4 flex-col gap-2 z-40">
                {menu.map((item, idx) => (
                    <Link
                        key={idx}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
                            ${location.pathname === item.path
                                ? "bg-blue-100 text-blue-800"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>

            {/* Mobil sidebar (chiqadigan) */}
            {open && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Qora fon */}
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setOpen(false)}
                    />

                    {/* Sidebar menyu */}
                    <div className="w-64 h-screen bg-white shadow-lg p-4 flex flex-col gap-2 relative z-50">
                        <button
                            className="absolute top-4 right-4"
                            onClick={() => setOpen(false)}
                        >
                            <X size={24} className="text-gray-800" />
                        </button>

                        {menu.map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.path}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
                                    ${location.pathname === item.path
                                        ? "bg-blue-100 text-blue-800"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
