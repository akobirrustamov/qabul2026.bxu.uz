import React, { useState, useEffect } from 'react';
import ApiCall from "../../config";
import Sidebar from "./Sidebar";
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function WithDrawPage() {
    const { id } = useParams();
    const [payment, setPayment] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ambassadorPayments, setAmbassadorPayments] = useState([]);
    const [expandedRow, setExpandedRow] = useState(false);
    const [ambassadorLoading, setAmbassadorLoading] = useState(false);
    // Bitta ambassador to‘lovini tasdiqlash
    // Orqaga qaytarish
    const handleRollback = async (id) => {
        try {
            await ApiCall(`/api/v1/admin-ambassador/${id}`, "PUT");
            fetchAmbassadorPayments(payment.ambassador.id);
        } catch (err) {
            console.error("Rollback error:", err);
        }
    };

    // Rad etish
    const handleDecline = async (id) => {
        try {
            await ApiCall(`/api/v1/admin-ambassador/decline/${id}`, "PUT");
            fetchAmbassadorPayments(payment.ambassador.id);
        } catch (err) {
            console.error("Decline error:", err);
        }
    };

    // Delete
    const handleDelete = async (id) => {
        try {
            await ApiCall(`/api/v1/admin-ambassador/${id}`, "DELETE");
            fetchAmbassadorPayments(payment.ambassador.id);
        } catch (err) {
            console.error("Delete error:", err);
        }
    };
    const handleFileUpload = async (file) => {
        if (!file) return;
        // faqat PDF tekshirish
        if (file.type !== "application/pdf") {
            toast.error("Faqat PDF hujjatlarini yuklash mumkin");
            return null;
        }
        try {
            const formData = new FormData();
            formData.append("photo", file);   // 👈 controller param nomi = photo
            formData.append("prefix", "/payment");

            const res = await ApiCall("/api/v1/file/upload", "POST", formData, { "Content-Type": "multipart/form-data" }
            );
            console.log("Upload result:", res);

            // Ehtimoliy formatlarni tekshirish
            if (res?.data) return res.data;


            console.error("Attachment upload javobida ID topilmadi:", res);
            return null;
        } catch (err) {
            console.error("Fayl yuklashda xatolik:", err);
            toast.error("Fayl yuklashda xatolik yuz berdi");
            return null;
        }
    };



    const handleApproveAll = async (paymentId, file) => {
        try {
            const fileId = await handleFileUpload(file);

            if (!fileId) {
                toast.error("Fayl yuklanmadi ❌");
                return;
            }

            await ApiCall(`/api/v1/payment/pay/${paymentId}/${fileId}`, "PUT");

            toast.success("Barcha talabalar tasdiqlandi ✅");
            fetchAmbassadorPayments(payment.ambassador.id);
        } catch (err) {
            console.error("Approve All error:", err);
            toast.error("Tasdiqlashda xatolik ❌");
        }
    };



    const fetchPayment = async () => {
        try {
            setLoading(true);
            const response = await ApiCall(`/api/v1/payment/${id}`, "GET");
            setPayment(response.data || {});
            setError(null);
        } catch (error) {
            console.error("Error fetching payment:", error);
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const fetchAmbassadorPayments = async (ambassadorId) => {
        try {
            setAmbassadorLoading(true);
            const response = await ApiCall(`/api/v1/ambassador/inprogres/${ambassadorId}`, "GET");
            setAmbassadorPayments(response.data || []);
        } catch (error) {
            console.error("Error fetching ambassador payments:", error);
            setError("Ambassador to'lovlarini yuklashda xatolik");
        } finally {
            setAmbassadorLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
    }, [id]);

    const toggleRow = () => {
        if (expandedRow) {
            setExpandedRow(false);
        } else {
            setExpandedRow(true);
            if (payment.ambassador?.id) {
                fetchAmbassadorPayments(payment.ambassador.id);
            }
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1: return "Jarayonda";
            case 2: return "To'langan";
            case 0: return "Rad etilgan";
            default: return "Noma'lum";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 1: return "bg-yellow-100 text-yellow-800";
            case 2: return "bg-green-100 text-green-800";
            case 0: return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <div className="p-10 sm:ml-64 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Yuklanmoqda...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="p-6 sm:ml-64">
                <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">To'lov Ma'lumotlari</h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {payment.id ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">№</th>
                                        <th className="px-4 py-2 text-left">Ismi</th>
                                        <th className="px-4 py-2 text-left">To'lov Miqdori</th>
                                        <th className="px-4 py-2 text-left">Tasdiqlash Matni</th>
                                        <th className="px-4 py-2 text-left">Holati</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={toggleRow}
                                    >
                                        <td className="px-4 py-2">1</td>
                                        <td className="px-4 py-2">{payment.ambassador?.name || "Noma'lum"}</td>
                                        <td className="px-4 py-2">{payment.amount} so'm</td>
                                        <td className="px-4 py-2">{payment.description || "-"}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                                {getStatusText(payment.status)}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {expandedRow && (
                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-semibold">Jarayondagi Talabalar</h3>
                                        <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer">
                                            Barchasini Tasdiqlash
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files[0]) {
                                                        handleApproveAll(payment.id, e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {ambassadorLoading ? (
                                        <p>Yuklanmoqda...</p>
                                    ) : (
                                        <table className="min-w-full border border-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">№</th>
                                                    <th className="px-4 py-2 text-left">Ismi</th>
                                                    <th className="px-4 py-2 text-left">JSHSHIR</th>
                                                    <th className="px-4 py-2 text-left">Pasport</th>
                                                    <th className="px-4 py-2 text-left">Telefon</th>
                                                    <th className="px-4 py-2 text-left">Yo‘nalish</th>
                                                    <th className="px-4 py-2 text-left">To‘lov Miqdori</th>
                                                    <th className="px-4 py-2 text-left">Amallar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ambassadorPayments.map((pmt, index) => (
                                                    <tr key={pmt.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{index + 1}</td>
                                                        <td className="px-4 py-2">
                                                            {pmt.abuturient
                                                                ? `${pmt.abuturient.firstName} ${pmt.abuturient.lastName}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-2">{pmt.abuturient?.passportPin || "-"}</td>
                                                        <td className="px-4 py-2">{pmt.abuturient?.passportNumber || "-"}</td>
                                                        <td className="px-4 py-2">{pmt.abuturient?.phone || "-"}</td>
                                                        <td className="px-4 py-2">{pmt.abuturient?.educationField?.name || "-"}</td>
                                                        <td className="px-4 py-2">{pmt.amount} so'm</td>

                                                        {/* Amallar */}
                                                        <td className="px-4 py-2 space-x-2">
                                                            {/* Orqaga qaytarish */}
                                                            <button
                                                                onClick={() => handleRollback(pmt.id)}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                                            >
                                                                Orqaga qaytarish
                                                            </button>

                                                            {/* Rad etish */}
                                                            <button
                                                                onClick={() => handleDecline(pmt.id)}
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                                                            >
                                                                Rad etish
                                                            </button>

                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => handleDelete(pmt.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                        </div>
                    ) : (
                        <p className="text-gray-500">To'lov ma'lumotlari topilmadi</p>
                    )}
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default WithDrawPage;
