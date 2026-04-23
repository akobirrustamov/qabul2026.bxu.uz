import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiCall from "../../config";
import Sidebar from "./Sidebar";

function AdminHomeCabinet() {
    const { id } = useParams(); // operatorId
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [id]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await ApiCall(`/api/v1/abuturient-operator/operator/${id}`, "GET", null, null, true);
            console.log("Response data:", response.data);
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    // Ma'lumotlarni formatlash funksiyalari
    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uz-UZ');
    };

    // Filtrlash funksiyasi
    const filteredStudents = students.filter(student => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const phone = student.phone ? student.phone.toLowerCase() : "";
        const searchLower = searchTerm.toLowerCase();

        return fullName.includes(searchLower) || phone.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Sidebar />
            <div className="flex min-h-screen bg-gray-100">
                {/* Mobile menu button */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg"
                >
                    <i className="fas fa-bars"></i>
                </button>

                {/* Sidebar */}
                <div className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-blue-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-300 ease-in-out`}>
                    <Sidebar />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden absolute top-4 right-4 text-white"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Main content */}
                <div className="flex-1 md:ml-0 min-h-screen">
                    <div className="p-6 md:p-10">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Operatorga birikkan talabalar</h1>
                            <p className="text-gray-600">Jami: {filteredStudents.length} ta talaba</p>
                        </div>

                        {/* Filter va qidiruv */}
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Ism, familiya yoki telefon bo‘yicha qidirish..."
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center">
                                        <i className="fas fa-filter mr-2"></i> Filtr
                                    </button>
                                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center">
                                        <i className="fas fa-download mr-2"></i> Yuklab olish
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Jadval */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism Familiya</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yo'nalish</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student, index) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {student.lastName} {student.firstName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {student.passportNumber}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.phone}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {student.educationField?.name || "Ma'lumot yo'q"}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.educationField?.educationForm?.educationType?.name}, {student.educationField?.educationForm?.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {student.status === 1 ? "Ro'yxatdan o'tgan" : "Ko'rib chiqilmoqda"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900 mr-3" title="Ko'rish">
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button className="text-green-600 hover:text-green-900 mr-3" title="Tahrirlash">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900" title="O'chirish">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    {searchTerm ? "Qidiruv bo'yicha hech narsa topilmadi" : "Ma'lumot topilmadi"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminHomeCabinet;