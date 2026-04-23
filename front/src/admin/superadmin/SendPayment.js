import React, { useState, useEffect } from "react";
import ApiCall from "../../config";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SendPayment() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // 🔹 Загружаем историю при монтировании
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await ApiCall("/api/v1/amount-payment", "GET");
            console.log("history", response.data);
            setHistory(response.data || []);
        } catch (error) {
            console.error("Error fetching payment history:", error);
        }
    };
    const formatDate = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };


    // 🔹 Отправка нового платежа
    const fetchPayment = async () => {
        if (!amount || amount <= 0) {
            toast.warning("⚠️ Iltimos, summani kiriting!");
            return;
        }

        try {
            setLoading(true);
            const response = await ApiCall(`/api/v1/amount-payment/${amount}`, "GET");
            console.log("Payment response:", response.data);

            toast.success("✅ To‘lov muvaffaqiyatli yuborildi!");
            setAmount(""); // очищаем инпут

            // 🔹 Обновляем историю после отправки
            fetchHistory();
        } catch (error) {
            console.error("Error fetching payment:", error);
            toast.error("❌ Xatolik yuz berdi, qayta urinib ko‘ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Sidebar />
            <div className="p-10 sm:ml-64">
                <h2 className="text-3xl md:text-4xl xl:text-5xl mb-6">Summani Yuborish</h2>

                {/* Forma */}
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
                    <label className="block mb-2 text-gray-700 font-medium">
                        To'lov summasini kiriting
                    </label>

                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Summani yozing"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchPayment}
                            disabled={loading}
                            className={`${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                                } text-white px-4 py-2 rounded-lg transition`}
                        >
                            {loading ? "Yuborilmoqda..." : "Jo‘natish"}
                        </button>
                    </div>
                </div>

                {/* Tarix */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        To'lovlar tarixi
                    </h3>

                    {history.length > 0 ? (
                        <>
                            {/* Desktop-table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">#</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Miqdor</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Sana</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((p, index) => (
                                            <tr key={p.id || index} className="border-t">
                                                <td className="px-4 py-2">{index + 1}</td>
                                                <td className="px-4 py-2">{p.amount} so‘m</td>
                                                <td className="px-4 py-2">{formatDate(p.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>

                            {/* Mobile-cards */}
                            <div className="block md:hidden space-y-3">
                                {history.map((p, index) => (
                                    <div key={p.id || index} className="border rounded-lg p-3 shadow-sm bg-gray-50">
                                        <p className="text-sm text-gray-600"># {index + 1}</p>
                                        <p className="font-medium text-gray-900">Miqdor: {p.amount} so‘m</p>
                                        <p className="text-xs text-gray-500">{formatDate(p.createdAt)}</p>
                                    </div>

                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">Hozircha to‘lovlar mavjud emas.</p>
                    )}
                </div>
            </div>

            {/* Toast konteyneri */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
    );
}

export default SendPayment;
