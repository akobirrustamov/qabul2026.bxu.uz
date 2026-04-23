import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ApiCall, { baseUrl } from "../config";
import {
    Users,
    Search,
    User,
    Phone,
    MapPin,
    Calendar,
    BadgeCheck,
    XCircle,
    Loader,
    Download,
    ChevronDown,
    ChevronUp,
    Filter
} from 'lucide-react';

function StudentTable() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [user, setUser] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const endpoints = {
        all: (id) => `/api/v1/ambassador/all/${id}`,
        new: (id) => `/api/v1/ambassador/not-payed/${id}`,
        inprogress: (id) => `/api/v1/ambassador/inprogres/${id}`,
        payed: (id) => `/api/v1/ambassador/payed/${id}`
    };

    useEffect(() => {
        const getUser = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    setError("Token topilmadi. Iltimos, tizimga qayta kiring.");
                    setLoading(false);
                    return;
                }
                const res = await ApiCall(`/api/v1/agent/me/${token}`, "GET", null, null, true);
                if (res.data) {
                    setUser(res.data.id);
                } else {
                    setError("Foydalanuvchi ma'lumotlari topilmadi.");
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                setError("Foydalanuvchi ma'lumotlarini olishda xatolik yuz berdi.");
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        if (user) fetchStudents(selectedStatus, user);
    }, [selectedStatus, user]);

    const fetchStudents = async (status, userId) => {
        try {
            setLoading(true);
            let url = endpoints[status](userId);
            const response = await ApiCall(url, "GET", null, null, true);
            setStudents(response.data || []);
        } catch (err) {
            console.error("Xatolik:", err);
            setError("Talabalar ma'lumotlarini yuklashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(payment => {
        const ab = payment.abuturient || {};
        return (
            ab.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ab.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ab.phone?.includes(searchTerm) ||
            ab.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Sort function
    const sortedStudents = React.useMemo(() => {
        let sortableItems = [...filteredStudents];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'name') {
                    aValue = `${a.abuturient?.firstName || ''} ${a.abuturient?.lastName || ''}`.toLowerCase();
                    bValue = `${b.abuturient?.firstName || ''} ${b.abuturient?.lastName || ''}`.toLowerCase();
                } else if (sortConfig.key === 'ball') {
                    aValue = a.abuturient?.ball || 0;
                    bValue = b.abuturient?.ball || 0;
                } else if (sortConfig.key === 'date') {
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                } else if (sortConfig.key === 'amount') {
                    aValue = a.amount || 0;
                    bValue = b.amount || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredStudents, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const currentStudents = sortedStudents;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
            .toString().padStart(2, "0")}.${d.getFullYear()} ${d.getHours()
                .toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    const getStatusBadge = (status) => {
        if (status === 3) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"><BadgeCheck size={14} className="mr-1" />To'langan</span>;
        }
        if (status === 2) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"><XCircle size={14} className="mr-1" />Jarayonda</span>;
        }
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Yangi</span>;
    };

    const handleDownload = async (appeal) => {
        if (appeal.passportPin) {
            let phone = appeal.phone;
            try {
                const response = await fetch(`${baseUrl}/api/v1/abuturient/contract/${phone}`, { method: "GET" });

                if (!response.ok) throw new Error("Failed to download file");

                const blob = await response.blob();
                if (!blob.size) throw new Error("Empty file");

                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = `Contract_${phone}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error("Error downloading PDF:", error);
            }
        } else {
            alert("Passport JSHSHIR mavjud emas, yuklab bo'lmaydi.");
        }
    };

    if (loading) return (
        <div className='min-h-screen flex'>
            <Sidebar />
            <div className='flex-1 p-6 flex justify-center items-center'>
                <Loader size={48} className="animate-spin text-blue-600" />
            </div>
        </div>
    );

    if (error) return (
        <div className='min-h-screen flex'>
            <Sidebar />
            <div className='flex-1 p-6'>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            </div>
        </div>
    );

    return (
        <div className='min-h-screen flex'>
            <Sidebar />
            <div className='flex-1 p-3 sm:p-4 lg:p-6 lg:p-8 ml-0 lg:ml-64'>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mt-4 mb-4">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                            <Users className="mr-2 text-blue-600" size={28} /> Qo'shilgan Talabalar
                        </h1>
                        <p className="text-sm lg:text-base text-gray-600">Jami: {students.length} ta</p>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border"
                        >
                            <span className="flex items-center">
                                <Filter size={18} className="mr-2" />
                                Filtrlarni ko'rsatish
                            </span>
                            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>

                    {/* Filters */}
                    <div className={`bg-white rounded-lg shadow-md p-3 lg:p-4 mb-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Qidirish</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Ism, telefon, passport..."
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="all">Barchasi</option>
                                    <option value="new">Yangi</option>
                                    <option value="inprogress">Jarayonda</option>
                                    <option value="payed">To'langan</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Responsive Table */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full table-auto text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th
                                            className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition"
                                            onClick={() => requestSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Talaba
                                                {sortConfig.key === 'name' && (
                                                    sortConfig.direction === 'ascending' ?
                                                        <ChevronUp size={14} className="ml-1" /> :
                                                        <ChevronDown size={14} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-left">Kontakt</th>
                                        <th className="px-3 py-3 text-left hidden lg:table-cell">Hudud</th>
                                        <th
                                            className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition hidden sm:table-cell"
                                            onClick={() => requestSort('ball')}
                                        >
                                            <div className="flex items-center">
                                                Ball
                                                {sortConfig.key === 'ball' && (
                                                    sortConfig.direction === 'ascending' ?
                                                        <ChevronUp size={14} className="ml-1" /> :
                                                        <ChevronDown size={14} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-left hidden xl:table-cell">Yo‘nalish</th>
                                        <th className="px-3 py-3 text-left hidden 2xl:table-cell">Shakl / Turi</th>
                                        <th
                                            className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition hidden lg:table-cell"
                                            onClick={() => requestSort('amount')}
                                        >
                                            <div className="flex items-center">
                                                Summa
                                                {sortConfig.key === 'amount' && (
                                                    sortConfig.direction === 'ascending' ?
                                                        <ChevronUp size={14} className="ml-1" /> :
                                                        <ChevronDown size={14} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-left">Status</th>
                                        <th
                                            className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition hidden lg:table-cell"
                                            onClick={() => requestSort('date')}
                                        >
                                            <div className="flex items-center">
                                                Sana
                                                {sortConfig.key === 'date' && (
                                                    sortConfig.direction === 'ascending' ?
                                                        <ChevronUp size={14} className="ml-1" /> :
                                                        <ChevronDown size={14} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 text-left">Harakat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {currentStudents.length > 0 ? currentStudents.map((payment) => {
                                        const ab = payment.abuturient || {};
                                        return (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition">
                                                <td className="px-3 py-3">
                                                    <div className="font-medium">{ab.firstName} {ab.lastName}</div>
                                                    <div className="text-xs text-gray-500">{ab.fatherName}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="font-medium">{ab.phone}</div>
                                                    <div className="text-xs text-gray-500">{ab.passportNumber}</div>
                                                </td>
                                                <td className="px-3 py-3 hidden lg:table-cell">
                                                    {ab.district?.name || "—"}, {ab.district?.region?.name || "—"}
                                                </td>
                                                <td className="px-3 py-3 hidden sm:table-cell">
                                                    <span className={`font-medium ${ab.ball > 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {ab.ball ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 hidden xl:table-cell">{ab.educationField?.name || "—"}</td>
                                                <td className="px-3 py-3 hidden 2xl:table-cell">
                                                    <div>{ab.educationField?.educationForm?.name || "—"}</div>
                                                    <div className="text-xs text-gray-500">{ab.educationField?.educationForm?.educationType?.name || "—"}</div>
                                                </td>
                                                <td className="px-3 py-3 hidden lg:table-cell font-medium">{payment.amount?.toLocaleString()} so'm</td>
                                                <td className="px-3 py-3">{getStatusBadge(payment.status)}</td>
                                                <td className="px-3 py-3 hidden lg:table-cell">
                                                    <div className="text-xs">{formatDate(payment.createdAt)}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {ab.ball > 50 ? (
                                                        <button
                                                            onClick={() => handleDownload(ab)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 transition"
                                                            title="Shartnoma yuklab olish"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Ball 50 dan kam</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="10" className="px-3 py-6 text-center text-gray-500">
                                                <Users size={40} className="mx-auto mb-2 text-gray-300" />
                                                Hech qanday talaba topilmadi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards - Improved */}
                    <div className="block lg:hidden space-y-3 mt-4">
                        {currentStudents.length > 0 ? currentStudents.map((payment) => {
                            const ab = payment.abuturient || {};
                            return (
                                <div key={payment.id} className="bg-white shadow rounded-lg p-4 text-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="font-semibold text-base">{ab.firstName} {ab.lastName}</div>
                                            <div className="text-xs text-gray-500">{ab.fatherName}</div>
                                        </div>
                                        <div className="text-right">
                                            {getStatusBadge(payment.status)}
                                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                                                <Calendar size={12} className="mr-1" />
                                                {formatDate(payment.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Telefon</div>
                                            <div className="text-sm flex items-center">
                                                <Phone size={14} className="mr-1 text-gray-400" />
                                                {ab.phone}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Passport</div>
                                            <div className="text-sm">{ab.passportNumber}</div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-xs text-gray-500 mb-1">Hudud</div>
                                        <div className="text-sm flex items-center">
                                            <MapPin size={14} className="mr-1 text-gray-400" />
                                            {ab.district?.name || "—"}, {ab.district?.region?.name || "—"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Ball</div>
                                            <div className={`text-sm font-medium ${ab.ball > 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                {ab.ball ?? "—"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Summa</div>
                                            <div className="text-sm font-medium">{payment.amount?.toLocaleString()} so'm</div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-xs text-gray-500 mb-1">Yo'nalish</div>
                                        <div className="text-sm">{ab.educationField?.name || "—"}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Shakl</div>
                                            <div className="text-sm">{ab.educationField?.educationForm?.name || "—"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Turi</div>
                                            <div className="text-sm">{ab.educationField?.educationForm?.educationType?.name || "—"}</div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t flex justify-center">
                                        {ab.ball > 50 ? (
                                            <button
                                                onClick={() => handleDownload(ab)}
                                                className="flex items-center justify-center w-full bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                                            >
                                                <Download size={16} className="mr-2" />
                                                Shartnoma yuklab olish
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Ball 50 dan kam, yuklab bo'lmaydi</span>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                                <Users size={40} className="mx-auto mb-3 text-gray-300" />
                                <p>Hech qanday talaba topilmadi</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentTable;