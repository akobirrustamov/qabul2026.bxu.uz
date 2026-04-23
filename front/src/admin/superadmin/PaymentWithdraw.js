import React, { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import ApiCall from "../../config"
import { useNavigate } from 'react-router-dom'

function PaymentWithdraw() {
    const [history, setHistory] = useState([])
    const navigate = useNavigate()

    const fetchHistory = async () => {
        try {
            const response = await ApiCall("/api/v1/payment", "GET");
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

    const handleRowClick = (id) => {
        navigate(`/main/payment-withdraw/${id}`)
    }

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className='min-h-screen'>
            <Sidebar />
            <div className='p-10 sm:ml-64'>
                {/* Tarix */}
                <div className="p-6">
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
                                            <tr
                                                key={p.id || index}
                                                className="border-t hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleRowClick(p.id)}
                                            >
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
                                    <div
                                        key={p.id || index}
                                        className="border rounded-lg p-3 shadow-sm bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleRowClick(p.id)}
                                    >
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
        </div>
    )
}

export default PaymentWithdraw