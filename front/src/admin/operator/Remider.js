import React, { useEffect, useState, useCallback, useRef } from "react";
import ApiCall from "../../config/index";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar";
import LeadModal from "./LeadModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(dt) {
  if (!dt) return null;
  const diff = new Date(dt) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d} kun ${h % 24} soat`;
  }
  if (h > 0) return `${h} soat ${m} daqiqa`;
  return `${m} daqiqa`;
}

function urgencyLevel(dt) {
  if (!dt) return "none";
  const h = (new Date(dt) - new Date()) / 3600000;
  if (h < 0) return "overdue";
  if (h < 2) return "urgent";
  if (h < 24) return "today";
  return "later";
}

const URGENCY_STYLES = {
  overdue: {
    ring: "#dc2626",
    glow: "rgba(220,38,38,0.08)",
    badge: "#fee2e2",
    text: "#991b1b",
    dot: "#ef4444",
    label: "Muddati o'tgan",
    labelBg: "#fee2e2",
    labelColor: "#991b1b",
  },
  urgent: {
    ring: "#f97316",
    glow: "rgba(249,115,22,0.08)",
    badge: "#ffedd5",
    text: "#9a3412",
    dot: "#fb923c",
    label: "Shoshilinch",
    labelBg: "#ffedd5",
    labelColor: "#9a3412",
  },
  today: {
    ring: "#eab308",
    glow: "rgba(234,179,8,0.06)",
    badge: "#fef9c3",
    text: "#854d0e",
    dot: "#facc15",
    label: "Bugun",
    labelBg: "#fef9c3",
    labelColor: "#854d0e",
  },
  later: {
    ring: "#22c55e",
    glow: "rgba(34,197,94,0.05)",
    badge: "#dcfce7",
    text: "#166534",
    dot: "#4ade80",
    label: "Keyingi",
    labelBg: "#dcfce7",
    labelColor: "#166534",
  },
  none: {
    ring: "#cbd5e1",
    glow: "rgba(0,0,0,0)",
    badge: "#f1f5f9",
    text: "#64748b",
    dot: "#94a3b8",
    label: "—",
    labelBg: "#f1f5f9",
    labelColor: "#64748b",
  },
};

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({ lead, onClick, index, handleComplete }) {
  const level = urgencyLevel(lead.reminderTime);
  const s = URGENCY_STYLES[level];
  const until = timeUntil(lead.reminderTime);

  const fullName = lead.applicant
    ? `${lead.applicant.firstName || ""} ${lead.applicant.lastName || ""}`.trim()
    : lead.phone || "Noma'lum";

  const operatorName = (
    lead.operator?.username ||
    lead.operator?.name ||
    ""
  ).toUpperCase();

  return (
    <div
      onClick={() => onClick(lead)}
      className="group relative cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border transition-all duration-200"
        style={{
          background: "#ffffff",
          borderColor: "#e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = s.ring;
          e.currentTarget.style.boxShadow = `0 8px 20px ${s.glow}, 0 0 0 1px ${s.ring}40`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Urgency side bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ background: s.ring }}
        />

        {/* Glow bg */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)`,
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="pl-4 pr-4 py-3.5 relative">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
                />
                <p
                  className="text-sm font-bold text-gray-800 truncate"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {fullName}
                </p>
              </div>
              <p className="text-[11px] text-gray-500 pl-4">{lead.phone}</p>
            </div>

            {/* Time block */}
            <div className="flex-shrink-0 text-right">
              <p
                className="text-xs font-semibold tabular-nums"
                style={{
                  color: s.text,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {formatDateTime(lead.reminderTime)}
              </p>
              {until && (
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: s.badge, color: s.text }}
                >
                  ⏳ {until} qoldi
                </span>
              )}
              {level === "overdue" && (
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: s.badge, color: s.text }}
                >
                  ⚠ Muddati o'tdi
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {lead.reminderDescription && (
            <div
              className="mb-2.5 rounded-xl px-3 py-2 text-xs text-gray-600 leading-relaxed line-clamp-2"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              {lead.reminderDescription}
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: s.labelBg, color: s.labelColor }}
              >
                {s.label}
              </span>

              {lead.crmSubCategory && (
                <>
                  <span className="text-gray-400 text-[10px]">›</span>
                  <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                    {lead.crmSubCategory.crmCategory?.name}
                  </span>
                  <span className="text-gray-400 text-[10px]">›</span>
                  <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                    {lead.crmSubCategory.name}
                  </span>
                </>
              )}

              {operatorName && (
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] text-blue-700">
                  👤 {operatorName}
                </span>
              )}
            </div>

            {!lead.completed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(lead.id);
                }}
                className="flex-shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
                style={{
                  background: "#22c55e",
                  border: "1px solid #16a34a",
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#22c55e";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Bajarildi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ count, label, color, dot }) {
  if (!count) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-3 py-1.5"
      style={{ background: "#ffffff", border: `1px solid ${color}40` }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
      />
      <span className="text-xs font-semibold" style={{ color }}>
        {count} {label}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function Reminder() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const [user, setUser] = useState(null);
  const userRef = useRef(null);

  useEffect(() => {
    ApiCall("/api/v1/auth/decode", "GET")
      .then((res) => {
        setUser(res.data);
        userRef.current = res.data;
      })
      .catch(() => setUser(null));
  }, []);

  // ── Fetch — operator-specific endpoint (original API) ──────────────────────
  const fetchReminders = useCallback(async () => {
    const userId = userRef.current?.id;
    if (!userId) return;
    try {
      setLoading(true);
      const res = await ApiCall(
        `/api/v1/crm/leads/operator/${userId}/reminders`,
        "GET",
      );
      setReminders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Eslatmalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [user, fetchReminders]);

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleCardClick = useCallback((lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowLeadModal(false);
    setSelectedLead(null);
  }, []);

  const handleLeadSaved = useCallback((updatedLead) => {
    if (!updatedLead) return;
    setReminders((prev) =>
      prev.map((r) => (r.id === updatedLead.id ? { ...r, ...updatedLead } : r)),
    );
  }, []);

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = async (leadId) => {
    const userId = userRef.current?.id;
    if (!userId) {
      toast.error("User topilmadi ❌");
      return;
    }
    try {
      await ApiCall(`/api/v1/crm/leads/${leadId}/${userId}/complete`, "PUT");
      toast.success("Lead completed ✅");
      fetchReminders();
    } catch {
      toast.error("Xatolik yuz berdi ❌");
    }
  };

  // ── Counts ─────────────────────────────────────────────────────────────────
  const counts = {
    overdue: reminders.filter((r) => urgencyLevel(r.reminderTime) === "overdue")
      .length,
    urgent: reminders.filter((r) => urgencyLevel(r.reminderTime) === "urgent")
      .length,
    today: reminders.filter((r) => urgencyLevel(r.reminderTime) === "today")
      .length,
    later: reminders.filter((r) => urgencyLevel(r.reminderTime) === "later")
      .length,
  };

  const filtered = reminders.filter((r) => {
    const q = search.toLowerCase();
    const name = r.applicant
      ? `${r.applicant.firstName || ""} ${r.applicant.lastName || ""}`.toLowerCase()
      : "";
    const matchSearch =
      name.includes(q) ||
      (r.phone || "").includes(q) ||
      (r.operator?.username || r.operator?.name || "")
        .toLowerCase()
        .includes(q) ||
      (r.reminderDescription || "").toLowerCase().includes(q);
    const matchFilter =
      filterLevel === "all" || urgencyLevel(r.reminderTime) === filterLevel;
    return matchSearch && matchFilter;
  });

  const FILTER_TABS = [
    { key: "all", label: "Barchasi", count: reminders.length },
    {
      key: "overdue",
      label: "O'tgan",
      count: counts.overdue,
      color: "#dc2626",
    },
    {
      key: "urgent",
      label: "Shoshilinch",
      count: counts.urgent,
      color: "#f97316",
    },
    { key: "today", label: "Bugun", count: counts.today, color: "#eab308" },
    { key: "later", label: "Keyingi", count: counts.later, color: "#22c55e" },
  ];

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ background: "#f8fafc" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .r-spin { animation: spin 0.9s linear infinite; }

        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .r-card { animation: fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes shimmer-light {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .r-shimmer {
          background: linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%);
          background-size: 200% 100%;
          animation: shimmer-light 1.5s infinite;
        }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#f1f5f9; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:999px; }
        ::-webkit-scrollbar-thumb:hover { background:#94a3b8; }
      `}</style>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-40 h-screen">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/5 backdrop-blur-sm" />
      )}

      {/* Lead Modal */}
      {showLeadModal && selectedLead && (
        <LeadModal
          show={showLeadModal}
          onClose={handleCloseModal}
          lead={selectedLead}
          userId={user?.id}
          onSaved={handleLeadSaved}
          locked={false}
          commentsFromSocket={[]}
        />
      )}

      {/* Main */}
      <div
        className="ml-[72px] flex flex-1 flex-col min-h-screen"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* ─── Header ───────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-20 border-b px-6 py-4"
          style={{
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(16px)",
            borderColor: "#e2e8f0",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
                  boxShadow: "0 4px 12px rgba(251,191,36,0.15)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#b45309"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">
                  Eslatmalar
                </h1>
                <p className="text-[11px] text-gray-500">
                  {reminders.length} ta eslatma
                </p>
              </div>
            </div>

            {/* Stats + Refresh */}
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-2">
                <StatPill
                  count={counts.overdue}
                  label="o'tgan"
                  color="#991b1b"
                  dot="#ef4444"
                />
                <StatPill
                  count={counts.urgent}
                  label="shoshilinch"
                  color="#9a3412"
                  dot="#fb923c"
                />
                <StatPill
                  count={counts.today}
                  label="bugun"
                  color="#854d0e"
                  dot="#facc15"
                />
                <StatPill
                  count={counts.later}
                  label="keyingi"
                  color="#166534"
                  dot="#4ade80"
                />
              </div>

              <button
                onClick={fetchReminders}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#ffffff";
                }}
                title="Yangilash"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3.5 w-3.5 text-gray-600 ${loading ? "r-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Tabs + Search */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
          

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ism, telefon, operator..."
                className="w-full rounded-xl py-2 pl-9 pr-9 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-all"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(203,213,225,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Cards ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
          {loading ? (
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl r-shimmer"
                  style={{ opacity: 1 - i * 0.1 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {search || filterLevel !== "all"
                    ? "Natija topilmadi"
                    : "Hozircha eslatmalar yo'q"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {search
                    ? "Boshqa kalit so'z bilan qidiring"
                    : "Eslatmalar qo'shilganda bu yerda ko'rinadi"}
                </p>
              </div>
              {(search || filterLevel !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterLevel("all");
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 transition-all"
                  style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.color = "#1e293b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          ) : (
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              }}
            >
              {filtered.map((lead, i) => (
                <div
                  key={lead.id}
                  className="r-card"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <ReminderCard
                    lead={lead}
                    onClick={handleCardClick}
                    index={i}
                    handleComplete={handleComplete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div
            className="border-t px-6 py-2.5 text-xs text-gray-500"
            style={{ borderColor: "#e2e8f0", background: "#ffffff" }}
          >
            {filtered.length} ta ko'rsatilmoqda · {reminders.length} ta jami
          </div>
        )}
      </div>
    </div>
  );
}

export default Reminder;
