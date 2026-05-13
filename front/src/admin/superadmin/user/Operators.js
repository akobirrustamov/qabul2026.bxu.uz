import React, { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "../Sidebar";

// Backend URL. Agar Nginx proxy orqali ishlasangiz "" qoldiring.
// Localda alohida backend ishlasa: "http://localhost:8080"
const BASE_URL = "http://localhost:8080";

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';

  return (
      <div className={`fixed bottom-6 right-6 z-50 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up`}>
        <span>{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
      </div>
  );
};

// Confirmation Dialog component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Bekor qilish
            </button>
            <button
                onClick={() => { onConfirm(); onClose(); }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition shadow-md"
            >
              O‘chirish
            </button>
          </div>
        </div>
      </div>
  );
};

// Loading Skeleton for Table Rows
const TableSkeleton = ({ columns = 6 }) => {
  return (
      <>
        {[...Array(3)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="border-b border-gray-100 px-4 py-3"><div className="h-5 bg-gray-200 rounded w-8 mx-auto"></div></td>
              <td className="border-b border-gray-100 px-4 py-3"><div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div></td>
              <td className="border-b border-gray-100 px-4 py-3"><div className="h-5 bg-gray-200 rounded w-32"></div></td>
              <td className="border-b border-gray-100 px-4 py-3"><div className="h-5 bg-gray-200 rounded w-40"></div></td>
              <td className="border-b border-gray-100 px-4 py-3"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td>
              <td className="border-b border-gray-100 px-4 py-3"><div className="flex justify-center gap-2"><div className="h-8 w-16 bg-gray-200 rounded"></div><div className="h-8 w-16 bg-gray-200 rounded"></div></div></td>
            </tr>
        ))}
      </>
  );
};

function Operators() {
  const [operators, setOperators] = useState([]);
  const [imageUrls, setImageUrls] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState(null);

  // Toast and Dialog states
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, operatorId: null, type: 'delete' });

  const [form, setForm] = useState({
    name: "",
    login: "",
    password: "",
    callCenterNumber: "",
  });

  useEffect(() => {
    fetchOperators();

    return () => {
      Object.values(imageUrls).forEach((url) => URL.revokeObjectURL(url));
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const getToken = () => {
    return localStorage.getItem("access_token") || localStorage.getItem("authToken") || "";
  };

  const api = async (url, method = "GET", body = null) => {
    const token = getToken();
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Server error");
    }

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const fetchImageAsBlob = async (operatorId) => {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/api/v1/operator/${operatorId}/image`, {
      method: "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const loadOperatorImages = async (list) => {
    const urls = {};
    await Promise.all(
        list.map(async (operator) => {
          try {
            const imageUrl = await fetchImageAsBlob(operator.id);
            if (imageUrl) urls[operator.id] = imageUrl;
          } catch { /* ignore */ }
        })
    );
    setImageUrls((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return urls;
    });
  };

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const data = await api("/api/v1/operator", "GET");
      const list = Array.isArray(data) ? data : [];
      setOperators(list);
      await loadOperatorImages(list);
    } catch (error) {
      console.error(error);
      showToast("Operatorlarni olishda xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", login: "", password: "", callCenterNumber: "" });
    setEditingId(null);
    setSelectedImage(null);
    if (selectedPreviewUrl) {
      URL.revokeObjectURL(selectedPreviewUrl);
      setSelectedPreviewUrl(null);
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (operator) => {
    resetForm();
    setEditingId(operator.id);
    setForm({
      name: operator.name || "",
      login: operator.phone || operator.login || "",
      password: "",
      callCenterNumber: operator.callCenterNumber || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Faqat rasm fayl yuklang", "error");
      return;
    }
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    setSelectedImage(file);
    setSelectedPreviewUrl(URL.createObjectURL(file));
  };

  const uploadFile = async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("prefix", "/profile");
    const response = await fetch(`${BASE_URL}/api/v1/file/upload`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Rasm yuklanmadi");
    }
    const text = await response.text();
    return text.replaceAll('"', "").trim();
  };

  const attachImageToOperator = async (operatorId, attachmentId) => {
    await api(`/api/v1/operator/${operatorId}/image?attachmentId=${attachmentId}`, "PUT");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showToast("Ism kiriting", "error");
      return false;
    }
    if (!form.login.trim()) {
      showToast("Login yoki telefon kiriting", "error");
      return false;
    }
    if (!editingId && !form.password.trim()) {
      showToast("Yangi operator uchun parol kiriting", "error");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        login: form.login.trim(),
        password: form.password,
        callCenterNumber: form.callCenterNumber ? Number(form.callCenterNumber) : null,
      };
      let operatorId = editingId;
      if (editingId) {
        await api(`/api/v1/operator/${editingId}`, "PUT", payload);
        showToast("Operator muvaffaqiyatli yangilandi", "success");
      } else {
        const createdOperator = await api("/api/v1/operator", "POST", payload);
        operatorId = createdOperator?.id;
        showToast("Operator muvaffaqiyatli qo‘shildi", "success");
      }
      if (selectedImage && operatorId) {
        const attachmentId = await uploadFile(selectedImage);
        await attachImageToOperator(operatorId, attachmentId);
        showToast("Rasm muvaffaqiyatli yuklandi", "success");
      }
      closeModal();
      await fetchOperators();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Saqlashda xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (operatorId) => {
    setConfirmDialog({ isOpen: true, operatorId, type: 'delete' });
  };

  const confirmDelete = async () => {
    const operatorId = confirmDialog.operatorId;
    if (!operatorId) return;
    try {
      await api(`/api/v1/operator/${operatorId}`, "DELETE");
      showToast("Operator o‘chirildi", "success");
      await fetchOperators();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Operatorni o‘chirishda xatolik yuz berdi", "error");
    }
  };

  const handleDeleteImage = async (operatorId) => {
    setConfirmDialog({ isOpen: true, operatorId, type: 'deleteImage' });
  };

  const confirmDeleteImage = async () => {
    const operatorId = confirmDialog.operatorId;
    if (!operatorId) return;
    try {
      await api(`/api/v1/operator/${operatorId}/image`, "DELETE");
      showToast("Rasm o‘chirildi", "success");
      await fetchOperators();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Rasmni o‘chirishda xatolik yuz berdi", "error");
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'delete') {
      confirmDelete();
    } else if (confirmDialog.type === 'deleteImage') {
      confirmDeleteImage();
    }
    setConfirmDialog({ isOpen: false, operatorId: null, type: 'delete' });
  };

  const modalImageUrl = selectedPreviewUrl || (editingId ? imageUrls[editingId] : null);

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />

        <div className="p-6 sm:ml-64 transition-all duration-300">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Operatorlar
              </h1>
              <p className="text-gray-500 mt-1">Boshqaruv paneli — operatorlarni boshqaring</p>
            </div>
            <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium hover:scale-105"
            >
              <span className="text-xl">+</span> Yangi Operator
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rasm</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login / Telefon</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Center</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <TableSkeleton columns={6} />
                ) : operators.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-4xl">📞</div>
                          <p className="text-gray-400 font-medium">Operatorlar topilmadi</p>
                          <button onClick={openAddModal} className="text-indigo-500 hover:text-indigo-700 text-sm font-medium mt-2">
                            + Birinchi operatorni qo‘shing
                          </button>
                        </div>
                      </td>
                    </tr>
                ) : (
                    operators.map((operator, index) => (
                        <tr key={operator.id} className="hover:bg-gray-50/80 transition-colors duration-150 group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                              {imageUrls[operator.id] ? (
                                  <img src={imageUrls[operator.id]} alt={operator.name} className="h-full w-full object-cover" />
                              ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs uppercase font-bold bg-gradient-to-br from-gray-100 to-gray-200">
                                    {operator.name?.charAt(0) || '?'}
                                  </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{operator.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{operator.phone || operator.login}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-md">{operator.callCenterNumber || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                  onClick={() => openEditModal(operator)}
                                  className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-200"
                                  title="Tahrirlash"
                              >
                                ✏️
                              </button>
                              <button
                                  onClick={() => handleDelete(operator.id)}
                                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                                  title="O‘chirish"
                              >
                                🗑️
                              </button>
                              <button
                                  onClick={() => handleDeleteImage(operator.id)}
                                  disabled={!imageUrls[operator.id]}
                                  className={`p-2 rounded-xl transition-all duration-200 ${
                                      imageUrls[operator.id]
                                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                                  }`}
                                  title="Rasmni o‘chirish"
                              >
                                🖼️
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-slide-up overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                      {editingId ? "Operatorni tahrirlash" : "Yangi operator qo‘shish"}
                    </h2>
                    <button onClick={closeModal} className="text-white/80 hover:text-white text-2xl transition">×</button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      {modalImageUrl ? (
                          <img src={modalImageUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl" />
                      ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-3xl shadow-inner">
                            📷
                          </div>
                      )}
                      <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">Rasm yuklash uchun bosing</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ism</label>
                    <input type="text" name="name" value={form.name} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" placeholder="Operator ismi" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Login / Telefon</label>
                    <input type="text" name="login" value={form.login} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" placeholder="+998 90 123 45 67" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Call Center raqami</label>
                    <input type="number" name="callCenterNumber" value={form.callCenterNumber} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" placeholder="Masalan: 201" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parol {editingId && <span className="text-xs text-gray-400">(o‘zgartirish uchun to‘ldiring)</span>}</label>
                    <input type="password" name="password" value={form.password} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" placeholder={editingId ? "Yangi parol" : "Parol"} />
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  <button onClick={closeModal} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition font-medium">Bekor qilish</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50">
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog({ isOpen: false, operatorId: null, type: 'delete' })}
            onConfirm={handleConfirmAction}
            title={confirmDialog.type === 'delete' ? "Operatorni o‘chirish" : "Rasmni o‘chirish"}
            message={confirmDialog.type === 'delete' ? "Ushbu operatorni o‘chirishni xohlaysizmi? Bu amalni qaytarib bo‘lmaydi." : "Operator rasmini o‘chirishni xohlaysizmi?"}
        />

        {/* Toast Notifications */}
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'info' })} />}

        <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      </div>
  );
}

export default Operators;