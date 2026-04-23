import React, { useEffect, useState } from 'react';
import ApiCall, { baseUrl } from '../config/index';
import Sidebar from './Sidebar';
import {
    Download,
    Eye,
    Search,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

function Payment() {
    const [user, setUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);
    const handleDownload = async (fileId, fileName) => {
        try {
            const response = await fetch(`${baseUrl}/api/v1/file/getFile/${fileId}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || "file";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Yuklab olishda xatolik:", err);
        }
    };

    const fetchPayments = async (ambassadorId) => {
        try {
            const res = await ApiCall(`/api/v1/payment/payment-ambasador/${ambassadorId}`, "GET");
            if (res.data) setPayments(res.data);
            console.log(res.data);

        } catch {
            console.log("To'lov ma'lumotlari topilmadi.");
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setError("Token topilmadi. Iltimos, qayta kiring.");
                setLoading(false);
                return;
            }
            const res = await ApiCall(`/api/v1/agent/me/${token}`, "GET", null, null, true);
            if (res.data) {
                setUser(res.data);
                fetchPayments(res.data.id);
            } else {
                setError("Foydalanuvchi ma'lumotlari topilmadi.");
            }
        } catch (error) {
            console.error("Profil ma'lumotlarini olishda xatolik:", error);
            setError("Profil ma'lumotlarini yuklashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Format date DD.MM.YYYY HH:mm
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const d = new Date(dateString);
        return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const formatAmount = (amount) => new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";

    // ✅ Status info
    const getStatusInfo = (status) => {
        switch (status) {
            case 1:
                return { text: 'Rad etilgan', color: 'red', icon: <XCircle size={16} /> };
            case 2:
                return { text: 'Kutilmoqda', color: 'yellow', icon: <Clock size={16} /> };
            case 3:
                return { text: 'Tasdiqlangan', color: 'green', icon: <CheckCircle size={16} /> };
            default:
                return { text: 'Noma\'lum', color: 'gray', icon: <AlertCircle size={16} /> };
        }
    };

    const filteredPayments = payments
        .filter(payment => {
            const matchesSearch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.amount?.toString().includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || payment.status === parseInt(statusFilter);
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => sortBy === 'newest'
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)
        );

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='flex'>
                <Sidebar />
                <div className='flex-1 p-3 sm:p-4 lg:p-6 lg:p-8 ml-0 lg:ml-64'>
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 lg:mb-0">To'lovlar</h1>
                            {user && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User size={16} />
                                    <span>{user.name}</span>
                                </div>
                            )}
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
                        <div className={`bg-white rounded-xl shadow-sm p-4 mb-4 lg:mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Qidirish..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="all">Barcha statuslar</option>
                                    <option value="1">Rad etilgan</option>
                                    <option value="2">Kutilmoqda</option>
                                    <option value="3">Tasdiqlangan</option>
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="newest">Yangilari oldin</option>
                                    <option value="oldest">Eskilari oldin</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                        ) : (
                            <>
                                {/* ✅ Statistics */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
                                    <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs lg:text-sm text-gray-600">Jami to'lovlar</p>
                                                <p className="text-lg lg:text-xl font-bold text-gray-800">{payments.length}</p>
                                            </div>
                                            <DollarSign className="text-blue-500" size={20} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs lg:text-sm text-gray-600">Tasdiqlangan</p>
                                                <p className="text-lg lg:text-xl font-bold text-gray-800">
                                                    {payments.filter(p => p.status === 3).length}
                                                </p>
                                            </div>
                                            <CheckCircle className="text-green-500" size={20} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs lg:text-sm text-gray-600">Kutilmoqda</p>
                                                <p className="text-lg lg:text-xl font-bold text-gray-800">
                                                    {payments.filter(p => p.status === 2).length}
                                                </p>
                                            </div>
                                            <Clock className="text-yellow-500" size={20} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border-l-4 border-red-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs lg:text-sm text-gray-600">Rad etilgan</p>
                                                <p className="text-lg lg:text-xl font-bold text-gray-800">
                                                    {payments.filter(p => p.status === 1).length}
                                                </p>
                                            </div>
                                            <XCircle className="text-red-500" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tavsif</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summa</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harakatlar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredPayments.map((payment) => {
                                                    const statusInfo = getStatusInfo(payment.status);
                                                    return (
                                                        <tr key={payment.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-4 py-4">{payment.description || "—"}</td>
                                                            <td className="px-4 py-4 font-bold">{formatAmount(payment.amount)}</td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                    <Calendar size={14} />
                                                                    {formatDate(payment.createdAt)}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                                    {statusInfo.icon}
                                                                    {statusInfo.text}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex gap-2">
                                                                    {payment.file && (
                                                                        <button
                                                                            onClick={() => handleDownload(payment.file.id, payment.file.name)} className="p-1 text-blue-600 hover:text-blue-800 transition"
                                                                            title="Yuklab olish"
                                                                        >
                                                                            <Download size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button className="p-1 text-gray-600 hover:text-gray-800 transition" title="Ko'rish">
                                                                        <Eye size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile / Tablet Cards */}
                                <div className="block lg:hidden space-y-3">
                                    {filteredPayments.map((payment) => {
                                        const statusInfo = getStatusInfo(payment.status);
                                        return (
                                            <div key={payment.id} className="bg-white rounded-xl shadow-sm p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">{payment.description || "—"}</h3>
                                                        <p className="text-lg font-bold text-gray-800 mt-1">{formatAmount(payment.amount)}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                        {statusInfo.icon}
                                                        {statusInfo.text}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatDate(payment.createdAt)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {payment.file && (
                                                            <button
                                                                onClick={() => handleDownload(payment.file.id, payment.file.name)} className="p-1 text-blue-600 hover:text-blue-800 transition"
                                                                title="Yuklab olish"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        )}


                                                        <button className="p-1 text-gray-600 hover:text-gray-800 transition" title="Ko'rish">
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Payment;