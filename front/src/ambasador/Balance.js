import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ApiCall from "../config/index";
import { Loader, DollarSign, Users, X, Wallet } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Balance() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0);
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [description, setDescription] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [inProgress, setInProgress] = useState(false); // 🔹 новое состояние

    // Получение пользователя
    useEffect(() => {
        const getUser = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    setError("Token topilmadi. Iltimos, qayta kiring.");
                    setLoading(false);
                    return;
                }
                const res = await ApiCall(`/api/v1/agent/me/${token}`, "GET", null, null, true);
                if (res.data) {
                    setUser(res.data.id);
                } else {
                    setError("Foydalanuvchi topilmadi.");
                }
            } catch (err) {
                setError("Foydalanuvchini olishda xatolik.");
                console.error(err);
            }
        };
        getUser();
    }, []);

    // Проверка in progress
    useEffect(() => {
        const checkInProgress = async () => {
            if (!user) return;
            try {
                const response = await ApiCall(`/api/v1/ambassador/inprogres/${user}`, "GET", null, null, true);

                setInProgress(response.data.length > 0 ? true : false); // 🔹 если API вернёт true, значит есть вывод
                console.log("inProgress:", response.data);

            } catch (err) {
                console.error("Ошибка при проверке in progress:", err);
            }
        };
        checkInProgress();
    }, [user]);

    // Получение баланса
    useEffect(() => {
        const fetchBalance = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const response = await ApiCall(`/api/v1/ambassador/not-payed/${user}`, "GET", null, null, true);
                const payments = response.data || [];
                // console.log(payments);


                let total = 0;
                const mapped = payments.map((item) => {
                    const ab = item.abuturient || {};
                    let reason = "";
                    let sum = item.amount || 0;

                    if (!ab.passportNumber) {
                        reason = "Passport yo‘q";
                        sum = 0;
                    } else if (!ab.passportPin) {
                        reason = "PIN yo‘q";
                        sum = 0;
                    } else if (!ab.ball || ab.ball < 50) {
                        reason = "Ball past";
                        sum = 0;
                    }

                    if (!reason) total += sum;
                    return { ...item, abuturient: ab, sum, reason };
                });

                setStudents(mapped);
                setBalance(total);
            } catch (err) {
                setError("Balansni yuklashda xatolik yuz berdi.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, [user]);

    // Вывод средств
    const handleWithdraw = async () => {
        if (!user) return;
        setWithdrawing(true);
        try {
            const validAbuturientIds = students
                .filter((s) => !s.reason)
                .map((s) => s.abuturient?.id);

            const payload = {
                abuturientIds: validAbuturientIds,
                description,
            };

            await ApiCall(`/api/v1/payment/withdraw/${user}`, "POST", payload, null, true);

            toast.success("Pulni yechib olish muvaffaqiyatli amalga oshirildi!");

            const remaining = students.filter((s) => s.reason);
            setStudents(remaining);

            const total = remaining.reduce((sum, s) => sum + (s.sum || 0), 0);
            setBalance(total);

            setShowModal(false);
            setDescription("");
        } catch (err) {
            console.error(err);
            toast.error("❌ Pulni yechib olishda xatolik yuz berdi.");
        } finally {
            setWithdrawing(false);
        }
    };

    const hasReason = students.some((s) => s.reason);

    if (loading)
        return (
            <div className="min-h-screen flex">
                <Sidebar />
                <div className="flex-1 p-6 flex justify-center items-center">
                    <Loader size={48} className="animate-spin text-blue-600" />
                </div>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64">
                <div className="max-w-6xl mt-6 lg:mt-0 mx-auto space-y-6">
                    {/* Верхний блок */}
                    <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Wallet className="text-green-600" size={28} />
                            <span className="text-lg lg:text-2xl font-bold text-gray-900">
                                {balance.toLocaleString()} so'm
                            </span>
                        </div>

                        {/* 🔹 Проверка inProgress */}
                        {inProgress && students.length > 0 ? (
                            <span className="text-red-600 font-medium text-sm">
                                Avvalgi tolov yakunlanishi kerak
                            </span>
                        ) : (
                            <button
                                onClick={() => setShowModal(true)}
                                disabled={balance === 0}
                                className={`lg:px-4 lg:py-2 px-2 py-1 rounded-lg lg:text-sm font-medium transition ${balance === 0
                                    ? "bg-gray-400 cursor-not-allowed text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                            >
                                Pulni yechib olish
                            </button>
                        )}
                    </div>

                    {/* Таблица студентов */}
                    <div className="bg-white shadow rounded-lg overflow-x-auto">
                        <table className="w-full table-auto text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left">Talaba</th>
                                    <th className="px-3 py-2 text-left">Kontakt</th>
                                    <th className="px-3 py-2 text-left">Ball</th>
                                    <th className="px-3 py-2 text-left">Summa</th>
                                    {hasReason && <th className="px-3 py-2 text-left">Sabab</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.length > 0 ? (
                                    students.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                {s.abuturient?.firstName} {s.abuturient?.lastName}
                                                <div className="text-xs text-gray-500">{s.abuturient?.fatherName}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                {s.abuturient?.phone}
                                                <div className="text-xs text-gray-500">{s.abuturient?.passportNumber || "—"}</div>
                                            </td>
                                            <td className="px-3 py-2">{s.abuturient?.ball ?? "—"}</td>
                                            <td className="px-3 py-2 font-semibold">{s.sum.toLocaleString()} so‘m</td>
                                            {hasReason && (
                                                <td className="px-3 py-2 text-red-500">{s.reason || "—"}</td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={hasReason ? 5 : 4} className="px-3 py-4 text-center text-gray-500">
                                            <Users size={32} className="mx-auto mb-2 text-gray-300" />
                                            Hech qanday talaba topilmadi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Модалка */}
            {showModal && !inProgress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Ishonchingiz komilmi?</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Pulni yechib olishni tasdiqlash uchun quyida matn kiriting.
                        </p>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tasdiqlash matni..."
                            className="w-full px-3 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={!description || withdrawing}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${!description || withdrawing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {withdrawing ? "Yuborilmoqda..." : "Tasdiqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
    );
}

export default Balance;
