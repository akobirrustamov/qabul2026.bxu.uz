import React, { useState, useEffect } from "react";
import ApiCall, { baseUrl } from "../../../config/index";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

// ── Weekly Chart ──────────────────────────────────────────────────────────────
function WeeklyChart({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-[90px] relative ">
      {data.map((item, i) => {
        const barH = Math.max((item.count / max) * 70, item.count > 0 ? 10 : 4);
        const dateLabel = new Date(item.date).toLocaleDateString("uz-UZ", {
          weekday: "short",
        });

        return (
          <div
            key={item.date}
            className="flex flex-col items-center flex-1 relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            {hovered === i && (
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-1 whitespace-nowrap text-xs text-emerald-300 font-bold z-20 pointer-events-none shadow-xl font-mono">
                {item.count} lead
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-emerald-500/40" />
              </div>
            )}

            {/* Bar */}
            <div
              className="w-full rounded-t-sm transition-all duration-200"
              style={{
                height: `${barH}px`,
                background:
                  item.count > 0
                    ? hovered === i
                      ? "linear-gradient(180deg,#A7F3D0,#10B981)"
                      : "linear-gradient(180deg,#6EE7B7,#10B981)"
                    : hovered === i
                      ? "#334155"
                      : "#1E293B",
                boxShadow:
                  item.count > 0
                    ? hovered === i
                      ? "0 0 16px #10B981bb"
                      : "0 0 8px #10B98155"
                    : "none",
              }}
            />

            {/* Day label */}
            <span
              className={`text-[9px] mt-1 font-mono transition-colors duration-200 ${
                hovered === i ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {dateLabel.slice(0, 2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Subcategory Card ──────────────────────────────────────────────────────────
function SubCategoryCard({ name, count, max, index, total }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const totalPct = total > 0 ? Math.round((count / total) * 100) : 0;

  const colors = [
    {
      text: "#6EE7B7",
      bg: "#6EE7B718",
      border: "#6EE7B744",
      glow: "#6EE7B788",
    },
    {
      text: "#38BDF8",
      bg: "#38BDF818",
      border: "#38BDF844",
      glow: "#38BDF888",
    },
    {
      text: "#A78BFA",
      bg: "#A78BFA18",
      border: "#A78BFA44",
      glow: "#A78BFA88",
    },
    {
      text: "#FB923C",
      bg: "#FB923C18",
      border: "#FB923C44",
      glow: "#FB923C88",
    },
    {
      text: "#F472B6",
      bg: "#F472B618",
      border: "#F472B644",
      glow: "#F472B688",
    },
    {
      text: "#FBBF24",
      bg: "#FBBF2418",
      border: "#FBBF2444",
      glow: "#FBBF2488",
    },
  ];
  const c = colors[index % colors.length];

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-2 cursor-default transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "linear-gradient(135deg,#0F172A,#1E293B)",
        border: `1px solid ${c.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${c.bg}`;
        e.currentTarget.style.borderColor = c.text + "66";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = c.border;
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle,${c.bg},transparent 70%)`,
        }}
      />

      {/* Step badge */}
      <span
        className="inline-block text-xs font-bold font-mono px-2 py-0.5 rounded-md mb-2.5 tracking-wider"
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
        }}
      >
        #{index + 1} BOSQICH
      </span>

      {/* Name */}
      <p className="text-xl text-slate-400 mb-3 leading-snug min-h-[36px]">
        {name}
      </p>

      {/* Count */}
      <p
        className="text-[34px] font-extrabold font-mono mb-3.5 leading-none"
        style={{ color: c.text }}
      >
        {count}
        <span className="text-xs font-normal text-slate-500 ml-1.5">lead</span>
      </p>

      {/* Progress bar */}
      <div className="bg-slate-950 rounded h-1.5 overflow-hidden mb-2">
        <div
          className="h-full rounded transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: c.text,
            boxShadow: `0 0 8px ${c.glow}`,
          }}
        />
      </div>

      <p className="text-[11px] text-slate-500 font-mono m-0">
        Jami leadlarning{" "}
        <span className="font-bold" style={{ color: c.text }}>
          {totalPct}%
        </span>
      </p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col gap-2"
      style={{
        background: "linear-gradient(135deg,#0F172A,#1E293B)",
        border: `1px solid ${accent}33`,
      }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle,${accent}33,transparent 70%)`,
        }}
      />
      <span className="text-[26px]">{icon}</span>
      <span
        className="text-[36px] font-extrabold font-mono leading-none"
        style={{ color: accent }}
      >
        {value}
      </span>
      <span className="text-[11px] text-slate-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ── Excel SVG Icon ────────────────────────────────────────────────────────────
function ExcelIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function CrmStatistic() {
  const [statistic, setStatistic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const navigate = useNavigate();
  const fetchStatistic = async () => {
    try {
      setIsLoading(true);
      const response = await ApiCall(
        "/api/v1/crm/statistic",
        "GET",
        null,
        null,
        true,
      );
      setStatistic(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Statisticni olishda xatolik yuz berdi!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    try {
      setExcelLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${baseUrl}/api/v1/crm/statistic/export-excel`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Server error");

      const blob = await response.blob();
      const file = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-statistic-${new Date().toLocaleDateString("uz-UZ")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel muvaffaqiyatli yuklandi!");
    } catch (error) {
      console.error(error);
      toast.error("Excel yuklab olishda xatolik!");
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExcelDownloadSubCategory = async (subCategoryId) => {
    try {
      setExcelLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${baseUrl}/api/v1/crm/statistic/export-excel-sub/${subCategoryId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Server error");

      const blob = await response.blob();
      const file = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-statistic-${new Date().toLocaleDateString("uz-UZ")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel muvaffaqiyatli yuklandi!");
    } catch (error) {
      console.error(error);
      toast.error("Excel yuklab olishda xatolik!");
    } finally {
      setExcelLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistic();
  }, []);

  const totalSubCategories = statistic?.totalSubCategories ?? 0;
  const totalLeads = statistic?.totalLeads ?? 0;
  const todayLeads = statistic?.todayLeads ?? 0;
  const totalCategories = statistic?.totalCategories ?? 0;
  const weeklyStats = statistic?.weeklyStats ?? [];
  const categoryTree = statistic?.categoryTree ?? [];

  const maxSubCount = categoryTree[0]?.subCategories
    ? Math.max(...categoryTree[0].subCategories.map((s) => s.leadCount), 1)
    : 1;
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="overflow-hidden bg-[#020817] flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>

      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>
      {/* Blur overlay */}
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}
      <div className="px-10 pt-8 pb-12 font-[Outfit] flex flex-1 flex-col ml-[72px] overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] text-emerald-400 font-mono tracking-[0.15em] mb-1">
              ● JONLI MA'LUMOT
            </p>
            <h1 className="text-[28px]  underline font-extrabold text-blue-600 m-0 leading-tight">
              CRM Statistika
            </h1>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            {/* Excel button */}
            <button
              onClick={handleExcelDownload}
              disabled={excelLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-emerald-200 border border-emerald-500/25 transition-opacity duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#14532D,#166534)" }}
            >
              {excelLoading ? (
                <span className="spin inline-block">↻</span>
              ) : (
                <ExcelIcon />
              )}
              {excelLoading ? "Yuklanmoqda..." : "Excel yuklab olish"}
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchStatistic}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none transition-opacity duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "#1E293B"
                  : "linear-gradient(135deg,#10B981,#059669)",
              }}
            >
              <span
                className={isLoading ? "spin inline-block" : "inline-block"}
              >
                ↻
              </span>
              {isLoading ? "Yuklanmoqda..." : "Yangilash"}
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && !statistic ? (
          <div className="flex justify-center items-center h-60 text-emerald-400 text-sm font-mono">
            Yuklanmoqda...
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              <StatCard
                label="Jami Leadlar"
                value={totalLeads}
                icon="👥"
                accent="#6EE7B7"
              />
              <StatCard
                label="Bugungi Leadlar"
                value={todayLeads}
                icon="📅"
                accent="#38BDF8"
              />
              <StatCard
                label="Kategoriyalar"
                value={totalCategories}
                icon="🗂️"
                accent="#A78BFA"
              />
              <StatCard
                label="Subkategoriyalar"
                value={totalSubCategories}
                icon="📌"
                accent="#FB923C"
              />
            </div>

            {/* ── Weekly Chart ── */}
            <div
              className="rounded-2xl p-6 mb-7 border border-slate-800"
              style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}
            >
              <div className="flex justify-between items-start mb-5 flex-wrap gap-2">
                <div>
                  <p className="text-[11px] text-slate-500 font-mono tracking-widest uppercase mb-1">
                    Haftalik faollik
                  </p>
                  <p className="text-xl font-bold text-slate-100 m-0">
                    So'nggi 7 kun
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500 font-mono mb-0.5">
                    Hafta jami
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-300 font-mono m-0">
                    {weeklyStats.reduce((s, d) => s + d.count, 0)}
                  </p>
                </div>
              </div>
              <WeeklyChart data={weeklyStats} />
            </div>

            {/* ── Category Tree ── */}
            {categoryTree.map((cat) => (
              <div key={cat.id} className="mb-7">
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div
                    className="w-1 h-6 rounded-full flex-shrink-0"
                    style={{
                      background: "linear-gradient(180deg,#6EE7B7,#10B981)",
                    }}
                  />

                  <h2 className="text-lg font-bold text-slate-100 m-0">
                    {cat.name}
                  </h2>

                  <span className="text-[11px] font-bold font-mono px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {cat.subCategories.length} bosqich
                  </span>

                  {/* Per-category Excel button */}
                  <button
                    onClick={() => handleExcelDownloadSubCategory(cat.id)}
                    disabled={excelLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-200 border border-emerald-500/25 transition-opacity duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ml-auto "
                    style={{
                      background: "linear-gradient(135deg,#14532D,#166534)",
                    }}
                  >
                    <ExcelIcon />
                    Excel
                  </button>
                </div>

                {/* Subcategory Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 ">
                  {cat.subCategories.map((sub, idx) => (
                    <SubCategoryCard
                      key={sub.id}
                      name={sub.name}
                      count={sub.leadCount}
                      max={maxSubCount}
                      index={idx}
                      total={totalLeads}
                    />
                  ))}
                </div>
                
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default CrmStatistic;
