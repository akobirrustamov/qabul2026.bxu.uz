import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../config";
import { Loader, Search, Filter, RefreshCw } from "lucide-react";
import Sidebar from "./Sidebar";

function AmbassadorStatistika() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await ApiCall("/api/v1/ambassador", "GET", null, null, true);
            setData(res.data || []);
            setFilteredData(res.data || []);
        } catch (err) {
            setError("Xatolik yuz berdi, ma’lumotlarni olib bo‘lmadi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Qidiruv funksiyasi
    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(data);
        } else {
            const filtered = data.filter(item =>
                item.agentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.agent?.name && item.agent.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.agent?.phone && item.agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, data]);

    // Saralash funksiyasi
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            if (key === 'agentNumber') {
                return direction === 'ascending'
                    ? a.agentNumber.localeCompare(b.agentNumber)
                    : b.agentNumber.localeCompare(a.agentNumber);
            }
            if (key === 'name') {
                const nameA = a.agent?.name || '';
                const nameB = b.agent?.name || '';
                return direction === 'ascending'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
            if (key === 'phone') {
                const phoneA = a.agent?.phone || '';
                const phoneB = b.agent?.phone || '';
                return direction === 'ascending'
                    ? phoneA.localeCompare(phoneB)
                    : phoneB.localeCompare(phoneA);
            }
            return 0;
        });

        setFilteredData(sortedData);
    };

    // Jadval qatorini bosilganda ishlaydigan funksiya
    const handleRowClick = (id) => {
        localStorage.removeItem("access_token");
        navigate(`/main/ambassador-statistik/${id}`);
    };

    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex justify-center items-center h-screen">
                    <Loader className="animate-spin h-8 w-8 text-blue-500" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col justify-center items-center h-screen">
                    <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
                        {error}
                    </div>
                    <button
                        onClick={fetchData}
                        className="mt-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Qayta urinish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 sm:pl-64 pl-0 ">
                <div className="max-w-6xl mx-auto">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Ambassador Statistikasi</h1>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Qidirish..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    <Filter className="h-4 w-4" />
                                    <span>Filter</span>
                                </button>

                                <button
                                    onClick={fetchData}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    title="Yangilash"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('index')}
                                        >
                                            №
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('agentNumber')}
                                        >
                                            Agent Number
                                            {sortConfig.key === 'agentNumber' && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('name')}
                                        >
                                            Ism
                                            {sortConfig.key === 'name' && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('phone')}
                                        >
                                            Telefon
                                            {sortConfig.key === 'phone' && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                                onClick={() => handleRowClick(item.agent.id)}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {item.agentNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.agent?.name || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.agent?.phone || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                                {searchTerm ? "Qidiruv bo‘yicha hech narsa topilmadi" : "Ma’lumot topilmadi"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            Jami: {filteredData.length} ta Ambassador
                            {searchTerm && ` ("${searchTerm}" bo'yicha qidiruv natijasi)`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AmbassadorStatistika;