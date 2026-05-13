import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import ApiCall from "../../../config";

function Users() {
    // Existing state
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        callCenterNumber: "",
        roles: [],
    });

    // New state for the two views
    const [activeView, setActiveView] = useState("users"); // "users" or "activity"
    const [timetableSummary, setTimetableSummary] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Modal for user session history
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedUserHistory, setSelectedUserHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const roleOptions = [
        "ROLE_ADMIN",
        "ROLE_OPERATOR",
        "ROLE_ACCOUNTANT",
        "ROLE_DATA_MANAGER",
        "ROLE_USER",
    ];

    // Utility
    const getRoleNames = (roles) => {
        if (!roles || !Array.isArray(roles)) return [];
        return roles
            .map((role) => (typeof role === "string" ? role : role.name))
            .filter(Boolean);
    };

    // Fetch users (CRUD)
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await ApiCall("/api/v1/users", "GET", null, null, true);
            setUsers(response.data || []);
        } catch (error) {
            console.error("Users fetch error:", error);
            alert("Foydalanuvchilarni olishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    // Fetch timetable summary (all users activity)
    const fetchTimetableSummary = async () => {
        try {
            setSummaryLoading(true);
            const response = await ApiCall("/api/v1/timetable/summary", "GET", null, null, true);
            setTimetableSummary(response.data || []);
        } catch (error) {
            console.error("Summary fetch error:", error);
            alert("Faoliyat jadvalini olishda xatolik");
        } finally {
            setSummaryLoading(false);
        }
    };

    // Fetch detailed session history for one user
    const fetchUserSessionHistory = async (userId) => {
        try {
            setHistoryLoading(true);
            const response = await ApiCall(`/api/v1/timetable/user/${userId}/summary`, "GET", null, null, true);
            setSelectedUserHistory(response.data);
            setHistoryModalOpen(true);
        } catch (error) {
            console.error("User history error:", error);
            alert(error?.response?.data || "Foydalanuvchi tarixini olishda xatolik");
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeView === "activity") {
            fetchTimetableSummary();
        }
    }, [activeView]);

    // Client-side filtering for users view
    const filteredUsers = users.filter((user) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(query);
        const phoneMatch = user.phone?.includes(query);
        return nameMatch || phoneMatch;
    });

    const getUserImageUrl = (userId) => `/api/v1/users/${userId}/image?v=${imageRefreshKey}`;

    // CRUD handlers (unchanged from original)
    const resetForm = () => {
        setFormData({ name: "", phone: "", password: "", callCenterNumber: "", roles: [] });
        setEditingId(null);
        setSelectedImage(null);
        setPreviewImage(null);
    };
    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleRoleChange = (role) => {
        const exists = formData.roles.includes(role);
        setFormData({
            ...formData,
            roles: exists ? formData.roles.filter((item) => item !== role) : [...formData.roles, role],
        });
    };
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Faqat rasm fayl yuklang");
            return;
        }
        setSelectedImage(file);
        setPreviewImage(URL.createObjectURL(file));
    };
    const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
    const uploadImageAndAttachToUser = async (userId) => {
        if (!selectedImage || !userId) return;
        const token = getToken();
        const formDataImage = new FormData();
        formDataImage.append("photo", selectedImage);
        formDataImage.append("prefix", "/profile");
        const uploadRes = await fetch("/api/v1/file/upload", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formDataImage,
        });
        if (!uploadRes.ok) throw new Error("Rasm serverga yuklanmadi");
        const attachmentId = await uploadRes.json();
        await ApiCall(`/api/v1/users/${userId}/image?attachmentId=${attachmentId}`, "PUT", null, null, true);
        setImageRefreshKey(Date.now());
    };
    const validateForm = () => {
        if (!formData.name.trim()) { alert("Ism kiriting"); return false; }
        if (!formData.phone.trim()) { alert("Telefon raqam kiriting"); return false; }
        if (!editingId && !formData.password.trim()) { alert("Yangi user uchun parol kiriting"); return false; }
        if (!formData.roles.length) { alert("Kamida bitta rol tanlang"); return false; }
        return true;
    };
    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                callCenterNumber: formData.callCenterNumber ? Number(formData.callCenterNumber) : null,
                roles: formData.roles,
            };
            let userId = editingId;
            if (editingId) {
                const response = await ApiCall(`/api/v1/users/${editingId}`, "PUT", payload, null, true);
                userId = response?.data?.id || editingId;
            } else {
                const response = await ApiCall("/api/v1/users", "POST", payload, null, true);
                userId = response?.data?.id;
            }
            if (selectedImage && userId) await uploadImageAndAttachToUser(userId);
            closeModal();
            await fetchUsers();
        } catch (error) {
            console.error("Save user error:", error);
            alert(error?.response?.data || error?.message || "Foydalanuvchini saqlashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };
    const handleEdit = (user) => {
        setFormData({
            name: user.name || "",
            phone: user.phone || "",
            password: "",
            callCenterNumber: user.callCenterNumber || "",
            roles: getRoleNames(user.roles),
        });
        setEditingId(user.id);
        setSelectedImage(null);
        setPreviewImage(getUserImageUrl(user.id));
        setIsModalOpen(true);
    };
    const handleDelete = async (userId) => {
        if (!window.confirm("Rostdan ham ushbu foydalanuvchini o‘chirmoqchimisiz?")) return;
        try {
            await ApiCall(`/api/v1/users/${userId}`, "DELETE", null, null, true);
            await fetchUsers();
        } catch (error) {
            console.error("Delete user error:", error);
            alert("Foydalanuvchini o‘chirishda xatolik yuz berdi");
        }
    };
    const handleDeleteImage = async (userId) => {
        if (!window.confirm("Rostdan ham ushbu foydalanuvchi rasmini o‘chirmoqchimisiz?")) return;
        try {
            await ApiCall(`/api/v1/users/${userId}/image`, "DELETE", null, null, true);
            setImageRefreshKey(Date.now());
            await fetchUsers();
        } catch (error) {
            console.error("Delete image error:", error);
            alert("Rasmni o‘chirishda xatolik yuz berdi");
        }
    };
    const handleQuickPasswordChange = async (userId) => {
        const password = window.prompt("Yangi parolni kiriting");
        if (!password || !password.trim()) return;
        try {
            await ApiCall(`/api/v1/users/${userId}/password`, "PATCH", { password: password.trim() }, null, true);
            alert("Parol muvaffaqiyatli o‘zgartirildi");
        } catch (error) {
            console.error("Password change error:", error);
            alert("Parolni o‘zgartirishda xatolik yuz berdi");
        }
    };

    // Helper to format date
    const formatDate = (isoString) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleString();
    };

    return (
        <div>
            <Sidebar />
            <div className="p-6 sm:ml-64">
                {/* Header with toggle buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView("users")}
                            className={`px-5 py-2 rounded-lg font-medium transition ${
                                activeView === "users"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            👥 Foydalanuvchilar
                        </button>
                        <button
                            onClick={() => setActiveView("activity")}
                            className={`px-5 py-2 rounded-lg font-medium transition ${
                                activeView === "activity"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            📊 Faoliyat jadvali
                        </button>
                    </div>
                    {activeView === "users" && (
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
                        >
                            + Yangi foydalanuvchi
                        </button>
                    )}
                </div>

                {/* ========== USERS VIEW ========== */}
                {activeView === "users" && (
                    <>
                        {/* Search bar */}
                        <div className="bg-white rounded-xl shadow p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block mb-2 text-sm font-medium">Ism yoki telefon bo‘yicha qidirish</label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Ali yoki +998..."
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full"
                                    >
                                        Tozalash
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl shadow overflow-x-auto">
                            <table className="min-w-full border border-gray-200">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-4 py-3">#</th>
                                    <th className="border px-4 py-3">Rasm</th>
                                    <th className="border px-4 py-3">Ism</th>
                                    <th className="border px-4 py-3">Telefon</th>
                                    <th className="border px-4 py-3">Call Center</th>
                                    <th className="border px-4 py-3">Rollar</th>
                                    <th className="border px-4 py-3">Harakatlar</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-8">Yuklanmoqda...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8">Hech qanday foydalanuvchi topilmadi</td></tr>
                                ) : (
                                    filteredUsers.map((user, idx) => {
                                        const userRoles = getRoleNames(user.roles);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="border px-4 py-3 text-center">{idx + 1}</td>
                                                <td className="border px-4 py-3 text-center">
                                                    <img
                                                        src={getUserImageUrl(user.id)}
                                                        alt={user.name}
                                                        className="w-14 h-14 rounded-full object-cover mx-auto border"
                                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                                    />
                                                </td>
                                                <td className="border px-4 py-3">
                                                    <button
                                                        onClick={() => fetchUserSessionHistory(user.id)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                    >
                                                        {user.name}
                                                    </button>
                                                </td>
                                                <td className="border px-4 py-3">{user.phone}</td>
                                                <td className="border px-4 py-3 text-center">{user.callCenterNumber || "-"}</td>
                                                <td className="border px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {userRoles.map(role => (
                                                            <span key={role} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{role}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="border px-4 py-3">
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        <button onClick={() => handleEdit(user)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                                                        <button onClick={() => handleDelete(user.id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                                                        <button onClick={() => handleDeleteImage(user.id)} className="bg-gray-700 text-white px-3 py-1 rounded">Del Image</button>
                                                        <button onClick={() => handleQuickPasswordChange(user.id)} className="bg-purple-600 text-white px-3 py-1 rounded">Password</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ========== ACTIVITY LOG VIEW ========== */}
                {activeView === "activity" && (
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="min-w-full border border-gray-200">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="border px-4 py-3">#</th>
                                <th className="border px-4 py-3">Foydalanuvchi</th>
                                <th className="border px-4 py-3">Telefon</th>
                                <th className="border px-4 py-3">Kirishlar soni</th>
                                <th className="border px-4 py-3">Jami so‘rovlar</th>
                                <th className="border px-4 py-3">Oxirgi faollik</th>
                            </tr>
                            </thead>
                            <tbody>
                            {summaryLoading ? (
                                <tr><td colSpan="6" className="text-center py-8">Yuklanmoqda...</td></tr>
                            ) : timetableSummary.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8">Hali hech qanday faoliyat qayd etilmagan</td></tr>
                            ) : (
                                timetableSummary.map((item, idx) => (
                                    <tr key={item.userId} className="hover:bg-gray-50 cursor-pointer" onClick={() => fetchUserSessionHistory(item.userId)}>
                                        <td className="border px-4 py-3 text-center">{idx + 1}</td>
                                        <td className="border px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-medium">
                                                {item.name || item.userId}
                                            </button>
                                        </td>
                                        <td className="border px-4 py-3">{item.phone || "-"}</td>
                                        <td className="border px-4 py-3 text-center">{item.loginCount}</td>
                                        <td className="border px-4 py-3 text-center">{item.totalRequests}</td>
                                        <td className="border px-4 py-3">{formatDate(item.lastSeen)}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal for User CRUD (unchanged) */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                        <div className="bg-white w-[440px] max-w-[95%] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between mb-5">
                                <h2 className="text-xl font-bold">{editingId ? "Tahrirlash" : "Yangi foydalanuvchi"}</h2>
                                <button onClick={closeModal} className="text-2xl text-gray-500 hover:text-red-600">×</button>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Rasm</label>
                                <div className="flex items-center gap-4">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full border flex items-center justify-center text-gray-400">No image</div>
                                    )}
                                    <label className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer">Yuklash
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Ism</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Telefon</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Call Center raqami</label>
                                <input type="number" name="callCenterNumber" value={formData.callCenterNumber} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Parol</label>
                                <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" placeholder={editingId ? "Parolni o‘zgartirmasangiz bo‘sh qoldiring" : "Parol"} />
                            </div>
                            <div className="mb-5">
                                <label className="block mb-2 font-medium">Rollar</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {roleOptions.map(role => (
                                        <label key={role} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                                            <input type="checkbox" checked={formData.roles.includes(role)} onChange={() => handleRoleChange(role)} />
                                            <span>{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={closeModal} disabled={saving} className="w-1/2 bg-gray-200 py-2 rounded-lg">Bekor qilish</button>
                                <button onClick={handleSave} disabled={saving} className="w-1/2 bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-300">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal for User Session History */}
                {historyModalOpen && selectedUserHistory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUserHistory.name}</h3>
                                    <p className="text-gray-500 text-sm">{selectedUserHistory.phone}</p>
                                </div>
                                <button onClick={() => setHistoryModalOpen(false)} className="text-2xl text-gray-500 hover:text-red-600">×</button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                                    <div><span className="font-semibold">Kirishlar soni:</span> {selectedUserHistory.loginCount}</div>
                                    <div><span className="font-semibold">Jami so‘rovlar:</span> {selectedUserHistory.totalRequests}</div>
                                    <div><span className="font-semibold">Foydalanuvchi ID:</span> <span className="text-xs">{selectedUserHistory.userId}</span></div>
                                </div>
                                <h4 className="font-semibold text-lg mb-3">Sessiyalar tarixi</h4>
                                {selectedUserHistory.sessions?.length === 0 ? (
                                    <p className="text-gray-500">Hech qanday sessiya topilmadi</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border text-sm">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2">Sana</th>
                                                <th className="border p-2">IP manzil</th>
                                                <th className="border p-2">Birinchi kirish</th>
                                                <th className="border p-2">Oxirgi faollik</th>
                                                <th className="border p-2">So‘rovlar soni</th>
                                                <th className="border p-2">Davomiylik</th>
                                                <th className="border p-2">Token prefiksi</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedUserHistory.sessions.map((session, idx) => (
                                                <tr key={idx}>
                                                    <td className="border p-2">{session.date}</td>
                                                    <td className="border p-2">{session.ip}</td>
                                                    <td className="border p-2">{formatDate(session.firstSeen)}</td>
                                                    <td className="border p-2">{formatDate(session.lastSeen)}</td>
                                                    <td className="border p-2 text-center">{session.requestCount}</td>
                                                    <td className="border p-2">{session.sessionDurationFormatted}</td>
                                                    <td className="border p-2 font-mono text-xs break-all">{session.tokenPrefix}...</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {historyLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl">Yuklanmoqda...</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Users;