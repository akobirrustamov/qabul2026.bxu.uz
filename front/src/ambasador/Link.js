import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ApiCall from "../config/index";
import { QRCodeCanvas } from "qrcode.react";

function LinkPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchProfilePath();
    }, []);

    const fetchProfilePath = async () => {
        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                setError("Token topilmadi. Iltimos, tizimga qayta kiring.");
                setLoading(false);
                return;
            }

            const res = await ApiCall(
                `/api/v1/ambassador/agent-path/${token}`,
                "GET",
                null,
                null,
                true
            );
            if (res.data) {
                setUser(res.data);
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

    const referralLink = user ? `https://qabul.bxu.uz/${user.agentNumber}` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById("qrCode");
        const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `referral_${user.agentNumber}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const handleShareTelegram = () => {
        const text = `Mening referral havolam: ${referralLink}`;
        const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-md text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Xatolik</h2>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-4 lg:p-6 lg:p-8 ml-0 lg:ml-64">
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                            <h1 className="text-2xl font-bold">Sizning Referral Havolangiz</h1>
                            <p className="opacity-90 mt-2">Do'stlaringizni taklif qiling va mukofotlarga ega bo'ling</p>
                        </div>

                        <div className="p-6 lg:p-8">
                            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-between">
                                <p className="text-blue-700 font-medium truncate">
                                    <a href={referralLink} target="_blank" rel="noopener noreferrer">
                                        {referralLink}
                                    </a>
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className={`ml-3 flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg transition-all ${copied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                                        } text-white`}
                                >
                                    {copied ? (
                                        <>
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Nusxalandi!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                            </svg>
                                            Nusxalash
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                                    <QRCodeCanvas
                                        id="qrCode"
                                        value={referralLink}
                                        size={200}
                                        includeMargin={true}
                                    />
                                </div>
                                <p className="text-gray-600 mt-4">QR kodni skaner qiling yoki yuklab oling</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    QR kodni yuklab olish
                                </button>

                                <button
                                    onClick={handleShareTelegram}
                                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                                    </svg>
                                    Telegramda ulashish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LinkPage;