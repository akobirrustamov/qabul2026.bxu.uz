import React, { useState, useEffect, useCallback, useRef } from "react";
import ApiCall, { baseUrl } from "../../config";
import Sidebar from "./Sidebar";
import {
  FiUser, FiPhone, FiLock, FiEye, FiEyeOff, FiSave,
  FiSearch, FiChevronLeft, FiChevronRight, FiUsers,
  FiCreditCard, FiCheckCircle, FiClock,
  FiDownload, FiRefreshCw, FiLogOut, FiShare2, FiLink, FiCopy,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const PAGE_SIZE = 20;

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-2 h-12 w-12 rounded-full bg-white/10" />
      <div className="relative">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl">
          {icon}
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const AgentHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("abuturients");
  const [agent, setAgent]         = useState(null);

  const [abuturients, setAbuturients]     = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [currentPage, setCurrentPage]     = useState(0);
  const [query, setQuery]                 = useState("");
  const [loadingAb, setLoadingAb]         = useState(false);
  const searchTimerRef                    = useRef(null);

  const [agentPath, setAgentPath]   = useState(null);
  const [payment, setPayment] = useState([]);

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError]     = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading]             = useState(false);

  useEffect(() => { fetchAgent(); }, []);

  const fetchAgent = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await ApiCall("/api/v1/auth/me/" + token, "GET");
      setAgent(res.data);
      fetchPayment(res.data.id);
      fetchAgentPath(res.data.id);
    } catch {
      toast.error("Agent ma'lumotlarini yuklashda xato yuz berdi");
    }
  };

  const fetchAgentPath = async (agentId) => {
    try {
      const res = await ApiCall("/api/v1/agent", "GET");
      const found = (res.data || []).find((a) => a.agent?.id === agentId);
      if (found) setAgentPath(found);
    } catch {}
  };

  const fetchAbuturients = useCallback(async (agentId, page, q) => {
    if (!agentId) return;
    setLoadingAb(true);
    try {
      let url = `/api/v1/agent/abuturient/${agentId}?page=${page}&size=${PAGE_SIZE}`;
      if (q?.trim()) url += `&query=${encodeURIComponent(q.trim())}`;
      const res = await ApiCall(url, "GET");
      setAbuturients(res.data?.content || []);
      setTotalElements(res.data?.totalElements ?? 0);
      setTotalPages(res.data?.totalPages ?? 0);
    } catch {
      toast.error("Abituriyentlarni yuklashda xatolik");
    } finally {
      setLoadingAb(false);
    }
  }, []);

  useEffect(() => {
    if (agent?.id) fetchAbuturients(agent.id, currentPage, query);
  }, [agent, currentPage, fetchAbuturients]);

  useEffect(() => {
    if (!agent?.id) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(0);
      fetchAbuturients(agent.id, 0, query);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [query]);

  const fetchPayment = async (id) => {
    try {
      const res = await ApiCall("/api/v1/payment-agents/" + id, "GET");
      setPayment(res.data || []);
    } catch {
      toast.error("To'lovlarni yuklashda xato yuz berdi");
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await ApiCall(`/api/v1/payment-agents/is-accepted/${paymentId}`, "GET");
      toast.success("✅ To'lov muvaffaqiyatli tasdiqlandi!");
      if (agent) fetchPayment(agent.id);
    } catch {
      toast.error("Tasdiqlashda xato yuz berdi!");
    }
  };
  const handleDownloadPDF = async (phone) => {
    try {
      const response = await fetch(
          `${baseUrl}/api/v1/abuturient/contract/${phone}`,
          { method: "GET" },
      );
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Contract_${phone}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };




  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const validatePassword = () => {
    if (password.length < 8) { setPasswordError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return false; }
    if (password !== confirmPassword) { setPasswordError("Parollar mos kelmadi"); return false; }
    setPasswordError(""); return true;
  };

  const handlePasswordChange = async () => {
    setIsLoading(true);
    if (!validatePassword()) { setIsLoading(false); return; }
    const token = localStorage.getItem("access_token");
    try {
      const res = await ApiCall(`/api/v1/auth/password/${token}`, "POST", { phone: "", password });
      if (res.data) {
        toast.success("Parol muvaffaqiyatli o'zgartirildi!");
        setPassword(""); setConfirmPassword("");
      }
    } catch {
      toast.error("Parolni o'zgartirishda xato yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPay     = payment.reduce((s, p) => s + (p.amount || 0), 0);
  const confirmedPay = payment.filter((p) => p.isAccepted).reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPay   = payment.filter((p) => !p.isAccepted).reduce((s, p) => s + (p.amount || 0), 0);

  const TABS = [
    { key: "abuturients", label: "Abituriyentlar", icon: <FiUsers /> },
    { key: "profile",     label: "Profil",          icon: <FiUser /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 shadow-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white shadow-inner backdrop-blur-sm">
              {agent?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <p className="text-sm font-medium text-blue-200">Xush kelibsiz 👋</p>
              <h1 className="text-xl font-bold text-white">{agent?.name || "Agent"}</h1>
              {agent?.phone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-200">
                  <FiPhone className="h-3 w-3" /> {agent.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchAgent(); if (agent) fetchAbuturients(agent.id, currentPage, query); }}
              className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Yangilash</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors backdrop-blur-sm"
            >
              <FiLogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* ── Stat Cards ────────────────────────────────────────────────────── */}


        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="mb-5 flex gap-1 rounded-2xl bg-white p-1.5 shadow-md border border-gray-100 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════ ABUTURIENTS TAB ══════════════════════════════════ */}
        {activeTab === "abuturients" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FiUsers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Abituriyentlar ro'yxati</h2>
                  <p className="text-xs text-gray-400">Jami: {totalElements} ta</p>
                </div>
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ism, familiya, telefon..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72"
                />
              </div>
            </div>

            {/* Table body */}
            {loadingAb ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
                <p className="text-sm">Yuklanmoqda...</p>
              </div>
            ) : abuturients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <FiUsers className="h-8 w-8" />
                </div>
                <p className="font-medium text-gray-400">Abituriyentlar topilmadi</p>
                <p className="mt-1 text-xs text-gray-300">Qidiruv shartlarini o'zgartiring</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      {["#","F.I.O","Telefon","Yo'nalish","Tuman","Ball","Shartnoma 📥","Sana"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {abuturients.map((a, i) => (
                      <tr key={a.id} className="group border-b border-gray-50 transition-colors hover:bg-blue-50/50">
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-400">
                          {currentPage * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-800">
                            {[a.lastName, a.firstName, a.fatherName].filter(Boolean).join(" ") || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-700">{a.phone || "—"}</span>
                          {a.additionalPhone && (
                            <div className="text-xs text-gray-400">{a.additionalPhone}</div>
                          )}
                        </td>
                        <td className="max-w-[150px] truncate px-4 py-3.5 text-sm text-gray-600">
                          {a.educationField?.name || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600">{a.district?.name || "—"}</td>
                        <td className="px-4 py-3.5">
                          {a.ball ? (
                            <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                              Number(a.ball) >= 45
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {a.ball}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {a.contractNumber && a.ball ? (
                            <button
                              onClick={() => handleDownloadPDF(a.phone)}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Shartnomani yuklab olish"
                            >
                              <FiDownload className="h-3.5 w-3.5" />
                              shartnoma
                            </button>
                          ) : a.contractNumber ? (
                            <span className="text-xs text-gray-500"></span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-400">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString("ru-RU") : "—"}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)}</span> / {totalElements} ta
                </p>
                <div className="flex items-center gap-1">
                  <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page = i;
                    if (totalPages > 7) {
                      let start = Math.max(0, currentPage - 3);
                      let end = start + 6;
                      if (end >= totalPages) { end = totalPages - 1; start = end - 6; }
                      page = start + i;
                    }
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200"
                            : "border border-gray-200 text-gray-500 hover:bg-white hover:shadow-sm"
                        }`}>
                        {page + 1}
                      </button>
                    );
                  })}
                  <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all">
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PROFILE TAB ════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="grid gap-5 md:grid-cols-2">
            {/* Profile Info */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <FiUser className="h-4 w-4" /> Asosiy ma'lumotlar
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white shadow-lg">
                    {agent?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{agent?.name || "—"}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <FiPhone className="h-3.5 w-3.5 text-blue-400" /> {agent?.phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                    <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Abituriyentlar</p>
                    <p className="mt-1 text-2xl font-black text-blue-700">{totalElements}</p>
                  </div>
                  {agentPath && (
                    <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
                      <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Agent raqami</p>
                      <p className="mt-1 text-2xl font-black text-indigo-700">{agentPath.agentNumber}</p>
                    </div>
                  )}
                </div>

                {/* Agent Link Card */}
                {agentPath && (() => {
                  const link = `https://qabul.bxu.uz/${agentPath.agentNumber}`;
                  const telegramText = encodeURIComponent(`🎓 Qabul uchun havola:\n${link}`);
                  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("🎓 Qabul uchun havola:")}`;

                  const handleCopy = () => {
                    navigator.clipboard.writeText(link);
                    toast.success("Havola nusxalandi!");
                  };

                  const handleDownloadQR = () => {
                    const canvas = document.getElementById("agent-qr-canvas");
                    if (!canvas) return;
                    const url = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `agent-qr-${agentPath.agentNumber}.png`;
                    a.click();
                  };

                  return (
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                        <FiLink className="h-3.5 w-3.5" /> Agent havola
                      </p>
                      <div className="flex items-center gap-2 rounded-xl bg-white border border-indigo-200 px-3 py-2">
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">{link}</span>
                        <button onClick={handleCopy} className="text-indigo-500 hover:text-indigo-700 transition-colors" title="Nusxalash">
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center gap-3 pt-1">
                        <div className="rounded-2xl bg-white p-3 shadow-md border border-indigo-100">
                          <QRCodeCanvas
                            id="agent-qr-canvas"
                            value={link}
                            size={160}
                            bgColor="#ffffff"
                            fgColor="#3730a3"
                            level="H"
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={handleDownloadQR}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 transition-colors shadow-md shadow-indigo-200"
                          >
                            <FiDownload className="h-3.5 w-3.5" /> QR yuklab olish
                          </button>
                          <a
                            href={telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-colors shadow-md"
                            style={{ background: "linear-gradient(135deg,#229ED9,#1a7bbf)" }}
                          >
                            <FiShare2 className="h-3.5 w-3.5" /> Telegram
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                  <FiLogOut className="h-4 w-4" /> Tizimdan chiqish
                </button>
              </div>
            </div>

            {/* Password Change */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <FiLock className="h-4 w-4" /> Parolni o'zgartirish
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Yangi parol</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Yangi parol kiriting" value={password}
                      onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="mt-1.5 text-xs text-red-500">⚠ Kamida 8 ta belgi kerak</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Parolni tasdiqlash</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Parolni qayta kiriting" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1.5 text-xs text-red-500">⚠ {passwordError}</p>}
                </div>

                <button disabled={isLoading} onClick={handlePasswordChange}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200 hover:shadow-lg"
                  }`}>
                  {isLoading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Jarayonda...</>
                  ) : (
                    <><FiSave className="h-4 w-4" /> Parolni yangilash</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentHome;
