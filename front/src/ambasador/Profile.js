import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ApiCall from "../config/index";
import logo1 from "./logo.png"
import {
    User,
    Phone,
    Shield,
    XCircle,
    CreditCard,
    Save,
    X,
    Edit3,
    Plus,
    BarChart3,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState("");
    const [plasticNumber, setPlasticNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [cardData, setCardData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statistics, setStatistics] = useState({
        totalAmount: 0,
        status2Amount: 0,
        status3Count: 0,
        totalCount: 0,
        status1Count: 0,
        status3Amount: 0,
        status2Count: 0,
        status1Amount: 0
    });

    useEffect(() => {
        fetchProfile();
        fetchCardDataStatistic();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setError("Token topilmadi. Iltimos, tizimga qayta kiring.");
                setLoading(false);
                return;
            }

            const res = await ApiCall(`/api/v1/agent/me/${token}`, "GET", null, null, true);
            if (res.data) {
                setUser(res.data);
                fetchCardData(res.data.id);
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

    const fetchCardDataStatistic = async (ambassadorId) => {
        try {
            const res = await ApiCall(`/api/v1/ambassador/statistic/${ambassadorId}`, "GET");
            if (res.data) {
                setStatistics(res.data);
            }
        } catch (e) {
            console.log("Statistika ma'lumotlari topilmadi.");
        }
    };


    const fetchCardData = async (ambassadorId) => {
        try {
            const res = await ApiCall(`/api/v1/ambassador-payment-data/${ambassadorId}`, "GET");

            if (res.data) {
                setCardData(res.data);
                setName(res.data.name || "");
                setPlasticNumber(res.data.plasticNumber || "");
            }
        } catch (e) {
            console.log("Karta ma'lumotlari topilmadi.");
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };


    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg("");
        try {
            const body = {
                ambassador: { id: user.id },
                name,
                plasticNumber,
            };

            let res;
            if (cardData && cardData.id) {
                res = await ApiCall(`/api/v1/ambassador-payment-data/${user.id}`, "PUT", body);
            } else {
                res = await ApiCall(`/api/v1/ambassador-payment-data`, "POST", body);
            }

            if (res.data) {
                setSuccessMsg("Karta ma'lumotlari muvaffaqiyatli saqlandi ✅");
                setCardData(res.data);
                closeModal();

                // Xabarni 3 soniyadan keyin yo'q qilish
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (error) {
            console.error("Saqlashda xatolik:", error);
            setError("Karta ma'lumotlarini saqlashda xatolik yuz berdi.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-4 lg:p-6 lg:p-8 ml-0 lg:ml-64">
                    <div className="max-w-6xl mt-4 lg:mt-1 mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Profil
                            </h1>
                            {cardData && (
                                <button
                                    onClick={openModal}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit3 size={18} />
                                    Karta ma'lumotlarini tahrirlash
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                                <XCircle className="mr-2" size={20} />
                                {error}
                            </div>
                        ) : user ? (


                            <div className="bg-white shadow-lg rounded-2xl overflow-hidden p-6">

                                <div className="mb-4">
                                    <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-2">
                                        <BarChart3 className="text-blue-600" size={20} />
                                        To'lovlar statistikasi
                                    </h2>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                                        {/* Jami to'lovlar */}
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs lg:text-sm text-blue-600 font-medium">Jami to'lovlar</p>
                                                    <p className="text-lg lg:text-xl font-bold text-blue-800">{formatNumber(statistics.totalCount)}</p>
                                                </div>
                                                <div className="p-1 lg:p-2 bg-blue-100 rounded-md lg:rounded-lg">
                                                    <DollarSign className="text-blue-600" size={16} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] lg:text-xs text-blue-500 mt-1 lg:mt-2">
                                                Summa: {formatNumber(statistics.totalAmount)} so'm
                                            </p>
                                        </div>

                                        {/* Tasdiqlangan to'lovlar */}
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs lg:text-sm text-green-600 font-medium">Tasdiqlangan</p>
                                                    <p className="text-lg lg:text-xl font-bold text-green-800">{formatNumber(statistics.status3Count)}</p>
                                                </div>
                                                <div className="p-1 lg:p-2 bg-green-100 rounded-md lg:rounded-lg">
                                                    <CheckCircle className="text-green-600" size={16} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] lg:text-xs text-green-500 mt-1 lg:mt-2">
                                                Summa: {formatNumber(statistics.status3Amount)} so'm
                                            </p>
                                        </div>

                                        {/* Kutilayotgan to'lovlar */}
                                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-yellow-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs lg:text-sm text-yellow-600 font-medium">Kutilayotgan</p>
                                                    <p className="text-lg lg:text-xl font-bold text-yellow-800">{formatNumber(statistics.status2Count)}</p>
                                                </div>
                                                <div className="p-1 lg:p-2 bg-yellow-100 rounded-md lg:rounded-lg">
                                                    <Clock className="text-yellow-600" size={16} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] lg:text-xs text-yellow-500 mt-1 lg:mt-2">
                                                Summa: {formatNumber(statistics.status2Amount)} so'm
                                            </p>
                                        </div>

                                        {/* Rad etilgan to'lovlar */}
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-red-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs lg:text-sm text-red-600 font-medium">Rad etilgan</p>
                                                    <p className="text-lg lg:text-xl font-bold text-red-800">{formatNumber(statistics.status1Count)}</p>
                                                </div>
                                                <div className="p-1 lg:p-2 bg-red-100 rounded-md lg:rounded-lg">
                                                    <AlertCircle className="text-red-600" size={16} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] lg:text-xs text-red-500 mt-1 lg:mt-2">
                                                Summa: {formatNumber(statistics.status1Amount)} so'm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Profil header */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <User size={24} className="text-blue-600" /> {user.name || "Foydalanuvchi"}
                                    </h2>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <Phone size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Telefon raqam</p>
                                                <p className="font-medium">{user.phone || "Mavjud emas"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <Shield size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Username</p>
                                                <p className="font-medium">{user.username || "Mavjud emas"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Karta ma'lumotlari bo'limi */}
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <CreditCard size={24} className="text-blue-600" />
                                        Plastik karta ma'lumotlari
                                    </h3>

                                    {cardData ? (
                                        <div className="w-full lg:w-1/2 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                                            <div className="absolute top-5 right-5 text-2xl opacity-80">
                                                <i className="fa-solid fa-credit-card"></i>
                                            </div>

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-16 flex items-center justify-center backdrop-blur-sm">
                                                        <img src={logo1} alt="Logo" />
                                                    </div>
                                                    <div className="h-6 w-px bg-white/30 mx-2"></div>
                                                    <div className="text-lg text-white/80 font-medium tracking-wider">BUXORO XALQARO UNIVERSITETI</div>
                                                </div>
                                                <div className="text-3xl text-white/90 drop-shadow-lg">
                                                    <i className="fa-brands fa-cc-visa"></i>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mb-3">
                                                <div className="text-xs text-blue-100 opacity-80 mb-1 font-medium">KARTA RAQAMI</div>
                                                <div className="text-xl tracking-widest font-mono font-semibold">
                                                    {plasticNumber.replace(/(\d{4})/g, '$1 ').replace(/(\s+)/g, '$1')}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">

                                                <div>
                                                    <div className="text-xs text-blue-100 mb-1">Karta egasi</div>
                                                    <div className="text-sm uppercase tracking-wide font-medium">{name}</div>
                                                </div>
                                                <button
                                                    onClick={openModal}
                                                    className="text-white bg-blue-500 bg-opacity-30 hover:bg-opacity-40 p-2 rounded-lg transition-colors"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <CreditCard size={48} className="mb-4" />
                                                <p className="text-lg mb-2">Karta ma'lumotlari mavjud emas</p>
                                                <p className="text-sm mb-4">To'lovlarni qabul qilish uchun karta qo'shing</p>
                                                <button
                                                    onClick={openModal}
                                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    <Plus size={18} />
                                                    Karta qo'shish
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Modal oyna */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800">
                                {cardData ? "Karta ma'lumotlarini tahrirlash" : "Yangi karta qo'shish"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Karta ko'rinishi */}
                            <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-5 text-white shadow-lg">
                                <div className="absolute right-5 text-xl opacity-80">
                                    <i className="fa-solid fa-credit-card"></i>
                                </div>
                                <div className="card-chip bg-gradient-to-b from-yellow-300 to-yellow-500 w-12 h-10 rounded-md mb-6"></div>
                                <div className="card-number text-lg tracking-widest mb-6 font-mono">
                                    {plasticNumber ? plasticNumber.padEnd(16, '•').match(/.{1,4}/g)?.join(' ') : '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-blue-100 mb-1">Karta egasi</div>
                                        <div className="text-sm uppercase tracking-wide">{name || 'ISM FAMILIYA'}</div>
                                    </div>
                                    <div className="text-xl opacity-80">
                                        <i className="fa-brands fa-cc-visa"></i>
                                    </div>
                                </div>
                            </div>

                            {/* Input maydonlari */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism Familiya</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ism Familiya"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Karta raqami</label>
                                    <input
                                        type="text"
                                        maxLength={16}
                                        value={plasticNumber}
                                        onChange={(e) => setPlasticNumber(e.target.value.replace(/\D/g, ""))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest font-mono"
                                        placeholder="0000 0000 0000 0000"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !name || !plasticNumber || plasticNumber.length !== 16}
                                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                            Saqlanmoqda...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {cardData ? "Yangilash" : "Qo'shish"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success xabari */}
            {successMsg && (
                <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn">
                    <i className="fa-solid fa-circle-check text-green-500"></i>
                    {successMsg}
                </div>
            )}
        </div>
    );
}

export default Profile;