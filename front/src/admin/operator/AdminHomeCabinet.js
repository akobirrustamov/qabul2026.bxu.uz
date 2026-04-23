import React, { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../config";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

function AdminHomeCabinet() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchAdmin();
  }, []);

  const handleDownloadFile = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/file/getFile/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Faylni yuklab bo'lmadi");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `file_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Faylni yuklashda xatolik yuz berdi");
    }
  };

  const fetchAdmin = async () => {
    try {
      const response = await ApiCall(
        `/api/v1/auth/me/` + token,
        "GET",
        null,
        null,
        true,
      );
      fetchStudents(response.data.id);
    } catch (error) {
      localStorage.removeItem("access_token");
      navigate("/admin/login");
    }
  };

  const fetchStudents = async (id) => {
    try {
      setLoading(true);
      const response = await ApiCall(
        `/api/v1/abuturient-operator/operator/${id}`,
        "GET",
        null,
        null,
        true,
      );
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>

      {/* Blur overlay — sidebar kengayganda */}
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}

      {/* Main content */}
      <div className="flex-1 ml-20">
        <div className="p-6 md:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Operatorga birikkan talabalar
            </h1>
            <p className="text-gray-600">
              Jami: {filteredStudents.length} ta talaba
            </p>
          </div>

          {/* Qidiruv */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
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
              </div>
            </div>
          </div>

          {/* Jadval */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "#",
                      "Ism Familiya",
                      "Telefon",
                      "JSHSHIR",
                      "Yo'nalish",
                      "Holati",
                      "Operator biriktirilgan sana",
                      "Amallar",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.lastName} {student.firstName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.passportNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.passportPin}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {student.educationField?.name || "Ma'lumot yo'q"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {
                              student.educationField?.educationForm
                                ?.educationType?.name
                            }
                            , {student.educationField?.educationForm?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.status === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {student.status === 1
                              ? "Ro'yxatdan o'tgan"
                              : "Ko'rib chiqilmoqda"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.operatorCreatedAt
                            ? new Date(
                                student.operatorCreatedAt,
                              ).toLocaleString("uz-UZ")
                            : "Ma'lumot yo'q"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleDownloadFile(student.operatorChek?.id)
                            }
                            className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 12V4m0 8l-4-4m4 4 4-4" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        {searchTerm
                          ? "Qidiruv bo'yicha hech narsa topilmadi"
                          : "Ma'lumot topilmadi"}
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
  );
}

export default AdminHomeCabinet;
