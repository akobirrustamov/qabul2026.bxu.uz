import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import React, { useEffect, useMemo, useState } from "react";
import ApiCall from "../../../config/index";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar";

// ── Harakat kodlari: 1–8 ─────────────────────────────────
const STATUS_STYLE = {
  1: { bg: "bg-sky-500/20", text: "text-sky-400", label: "Lead almashdi" },
  2: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Comment yozildi" },
  3: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "Qo'ng'iroq (sipuni)",
  },
  4: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    label: "Sayt avtomatik qabul",
  },
  5: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    label: "Qo'lda qo'shildi",
  },
  6: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    label: "Budilnik qo'yildi",
  },
  7: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    label: "Budilnik olib tashlandi",
  },
  8: {
    bg: "bg-teal-500/20",
    text: "text-teal-400",
    label: "Shartnoma olib berdi",
  },
};
const getStatusStyle = (status) => {
  const key = String(status ?? "").trim();
  return (
    STATUS_STYLE[key] ?? {
      bg: "bg-slate-500/20",
      text: "text-slate-400",
      label: key || "Noma'lum",
    }
  );
};

// statsByStatus har xil formatda kelishi mumkin:
//   { "NEW": 5 }                        → oddiy son
//   { "NEW": { label: "Yangi", count: 5 } } → obyekt
//   [{ label: "Yangi", count: 5 }, ...]  → array
// Barchasini [ { statusKey, count } ] ga normallashtiradi
// statsByStatus formatlarini normallashtiradi:
//   { "1": { label: "...", count: 5 } }  ← hozirgi format
//   { "1": 5 }                            ← oddiy son
//   [{ label: "...", count: 5 }]          ← array
const normalizeStats = (statsByStatus) => {
  if (!statsByStatus) return [];
  if (Array.isArray(statsByStatus)) {
    return statsByStatus.map((item) => ({
      statusKey: String(item.key ?? item.status ?? item.name ?? "—"),
      label: item.label ?? null,
      count: item.count ?? item.value ?? 0,
    }));
  }
  return Object.entries(statsByStatus).map(([key, val]) => ({
    statusKey: key,
    label: typeof val === "object" && val !== null ? (val.label ?? null) : null,
    count:
      typeof val === "object" && val !== null
        ? (val.count ?? val.value ?? 0)
        : val,
  }));
};

// ── Yordamchi funksiyalar ──────────────────────────────────
const getToday = () => new Date().toISOString().split("T")[0];
const get7DaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};
const fmtDateDot = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
const fmtSeconds = (sec) => {
  if (!sec) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

const fmtDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).replace("T", " ");
  return d.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// ── Sana validatsiyasi ─────────────────────────────────────
const validateDateRange = (from, to) => {
  if (!from || !to) {
    toast.warning("Sanani tanlang");
    return false;
  }
  if (new Date(from) > new Date(to)) {
    toast.warning("Boshlanish sanasi tugash sanasidan katta bo'lmasin");
    return false;
  }
  return true;
};

// ── DateFilter komponenti (har blok uchun qayta ishlatiladi) ─
function DateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onLoad,
  loading,
  label,
  color,
}) {
  const colorMap = {
    blue: {
      btn: "bg-blue-600 hover:bg-blue-700",
      ring: "focus:border-blue-500",
    },
    purple: {
      btn: "bg-purple-600 hover:bg-purple-700",
      ring: "focus:border-purple-500",
    },
    emerald: {
      btn: "bg-emerald-600 hover:bg-emerald-700",
      ring: "focus:border-emerald-500",
    },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-[#0F172A] px-4 py-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-400">
          Boshlanish
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className={`rounded-lg border border-slate-700 bg-[#020817] px-3 py-1.5 text-sm text-white outline-none transition ${c.ring}`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-400">Tugash</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className={`rounded-lg border border-slate-700 bg-[#020817] px-3 py-1.5 text-sm text-white outline-none transition ${c.ring}`}
        />
      </div>
      <button
        onClick={onLoad}
        disabled={loading}
        className={`rounded-lg px-4 py-1.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${c.btn}`}
      >
        {loading ? "Yuklanmoqda..." : (label ?? "Yuklash")}
      </button>
    </div>
  );
}

// ── Blok sarlavhasi ───────────────────────────────────────
function BlockHeader({ num, colorClass, title, badge }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
      >
        {num}
      </span>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {badge !== undefined && (
        <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs text-slate-400">
          {badge}
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function OperatorStatistic() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // ── Blok 1: Barcha operatorlar ────────────────────────
  const [b1From, setB1From] = useState(get7DaysAgo());
  const [b1To, setB1To] = useState(getToday());
  const [allStats, setAllStats] = useState([]);
  const [b1Loading, setB1Loading] = useState(false);

  // ── Blok 2: Tanlangan operator detali ────────────────
  const [b2From, setB2From] = useState(get7DaysAgo());
  const [b2To, setB2To] = useState(getToday());
  const [selectedOpId, setSelectedOpId] = useState(null);
  const [selectedOpName, setSelectedOpName] = useState("");
  const [opDetail, setOpDetail] = useState(null);
  const [b2Loading, setB2Loading] = useState(false);

  // ── Blok 3: Sipuni ────────────────────────────────────
  const [b3From, setB3From] = useState(get7DaysAgo());
  const [b3To, setB3To] = useState(getToday());
  const [sipuni, setSipuni] = useState([]);
  const [b3Loading, setB3Loading] = useState(false);

  // ── Modal: Operator faolligi (/api/v1/timetable/user/{userId}/summary)
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityDetail, setActivityDetail] = useState(null);

  // ── Blok 1: yuklash ───────────────────────────────────
  const fetchAllStats = async () => {
    if (!validateDateRange(b1From, b1To)) return;
    try {
      setB1Loading(true);
      const res = await ApiCall(
        `/api/v1/operator-statistics/all?startDate=${b1From}&endDate=${b1To}`,
        "GET",
      );
      setAllStats(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Statistikani olishda xatolik");
    } finally {
      setB1Loading(false);
    }
  };

  // ── Blok 2: operator kartasiga bosilganda ─────────────
  const fetchOperatorDetail = async (id, name, from = b2From, to = b2To) => {
    if (!id || !validateDateRange(from, to)) return;
    try {
      setB2Loading(true);
      setSelectedOpId(id);
      setSelectedOpName(name);
      setOpDetail(null);
      const res = await ApiCall(
        `/api/v1/operator-statistics/operator/${id}?startDate=${from}&endDate=${to}`,
        "GET",
      );
      setOpDetail(res?.data ?? null);
    } catch {
      toast.error("Operator ma'lumotini olishda xatolik");
    } finally {
      setB2Loading(false);
    }
  };

  // Blok 2 ning "Yuklash" tugmasi — tanlangan operator uchun yangi sana
  const reloadDetail = () => {
    if (!selectedOpId) {
      toast.info("Avval operator tanlang (blok 1 dan)");
      return;
    }
    fetchOperatorDetail(selectedOpId, selectedOpName, b2From, b2To);
  };

  // ── Modal: operator faolligini olish ──────────────────
  const openActivityModal = async (op) => {
    if (!op?.id) {
      toast.warning("Operator ID topilmadi");
      return;
    }

    try {
      setActivityModalOpen(true);
      setActivityLoading(true);
      setActivityDetail(null);

      const res = await ApiCall(
        `/api/v1/timetable/user/${op.id}/summary`,
        "GET",
      );

      setActivityDetail(res?.data ?? null);
    } catch (error) {
      setActivityDetail(null);
      toast.error("Operator faolligini olishda xatolik");
    } finally {
      setActivityLoading(false);
    }
  };

  const closeActivityModal = () => {
    setActivityModalOpen(false);
    setActivityDetail(null);
  };

  // ── Blok 3: Sipuni ───────────────────────────────────
  const fetchSipuni = async () => {
    if (!validateDateRange(b3From, b3To)) return;
    try {
      setB3Loading(true);
      const from = fmtDateDot(b3From);
      const to = fmtDateDot(b3To);
      const res = await ApiCall(
        `/api/v1/operator/sipuni-statistic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        "GET",
      );
      const data = Array.isArray(res?.data) ? res.data : [];
      setSipuni(data);
      if (data.length === 0) toast.info("Bu oraliqda ma'lumot topilmadi");
    } catch {
      setSipuni([]);
      toast.error("Sipuni statistikani olishda xatolik");
    } finally {
      setB3Loading(false);
    }
  };

  // ── Boshlang'ich yuklash ──────────────────────────────
  useEffect(() => {
    fetchAllStats();
  }, []);

  // ── Sipuni jadval hisob-kitob ─────────────────────────
  const sipuniHeaders = useMemo(
    () => (sipuni.length ? Object.keys(sipuni[0]) : []),
    [sipuni],
  );

  const sipuniTotals = useMemo(() => {
    if (!sipuni.length) return {};
    const t = {};
    sipuni.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower.includes("operator") ||
          lower.includes("sipuni") ||
          lower === "#"
        )
          return;
        const val = row[key];
        if (val !== "" && !isNaN(val)) {
          t[key] = (t[key] || 0) + Number(val);
        } else if (typeof val === "string" && val.includes(":")) {
          const parts = val.split(":").map(Number);
          const sec =
            parts.length === 3
              ? parts[0] * 3600 + parts[1] * 60 + parts[2]
              : parts[0] * 60 + parts[1];
          t[key] = (t[key] || 0) + sec;
        }
      });
    });
    return t;
  }, [sipuni]);

  // ── Excel export ──────────────────────────────────────
  const exportToExcel = () => {
    if (!sipuni.length) {
      toast.warning("Export qilish uchun ma'lumot yo'q");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(sipuni);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistika");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `sipuni_${b3From}_${b3To}.xlsx`,
    );
  };

  // ═══════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen overflow-hidden bg-[#020817]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 999px; }
      `}</style>

      <div className="fixed left-0 top-0 z-40 h-screen">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}

      <div className="ml-[72px] flex min-h-screen flex-1 flex-col gap-10 overflow-hidden px-6 pt-8 pb-16 font-[Outfit] md:px-10">
        {/* ── Sahifa bosh sarlavhasi ─────────────────────── */}
        <div>
          <p className="mb-1 font-mono text-[11px] tracking-[0.15em] text-emerald-400">
            ● JONLI MA&apos;LUMOT
          </p>
          <h1 className="m-0 text-[28px] font-extrabold leading-tight text-blue-500">
            Operatorlar statistikasi 6-maydan ishga tushdi!
          </h1>
        </div>

        {/* ════════════════════════════════════════════════
     BLOK 1 — BARCHA OPERATORLAR — TABLE VARIANT
   ════════════════════════════════════════════════ */}
        <section>
          <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
    .op-row { transition: background 0.15s; cursor: pointer; }
    .op-row:hover { background: #0D1A2C !important; }
    .op-row.op-active { background: #0D1A2E !important; border-left: 2px solid #3B82F6; }
    .op-arrow { width:26px;height:26px;border-radius:7px;background:#0E1826;display:inline-flex;align-items:center;justify-content:center;color:#1E3A5A;font-size:14px;transition:background 0.15s,color 0.15s; }
    .op-row:hover .op-arrow { background:#1A2D48;color:#60A5FA; }
    .op-row.op-active .op-arrow { background:#1D3A6A;color:#93C5FD; }
    .op-pill { font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;font-family:'JetBrains Mono',monospace;white-space:nowrap; }
    .op-bar-bg { height:5px;background:#0E1826;border-radius:4px;overflow:hidden; }
  `}</style>

          {/* Sarlavha */}
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
              1
            </span>
            <h2 className="text-lg font-bold text-white">
              Barcha operatorlar statistikasi
            </h2>
            <span className="ml-auto rounded-full border border-slate-800 bg-[#0D1625] px-3 py-0.5 font-mono text-xs text-slate-500">
              {allStats.length} ta operator
            </span>
          </div>

          <DateFilter
            from={b1From}
            to={b1To}
            onFromChange={setB1From}
            onToChange={setB1To}
            onLoad={fetchAllStats}
            loading={b1Loading}
            label="Yuklash"
            color="blue"
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#141E2E] bg-[#080F1C]">
            {b1Loading ? (
              <div className="flex h-32 items-center justify-center text-blue-400">
                Yuklanmoqda...
              </div>
            ) : allStats.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-slate-500">
                Ma&apos;lumot topilmadi. Sana oralig&apos;ini tanlab yuklang.
              </div>
            ) : (
              (() => {
                const ACCENTS = [
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#8B5CF6",
                  "#EF4444",
                  "#06B6D4",
                  "#EC4899",
                  "#F97316",
                ];
                const PILL_STYLES = [
                  { bg: "rgba(14,165,233,0.13)", text: "#38BDF8" },
                  { bg: "rgba(59,130,246,0.13)", text: "#60A5FA" },
                  { bg: "rgba(16,185,129,0.13)", text: "#34D399" },
                  { bg: "rgba(139,92,246,0.13)", text: "#A78BFA" },
                  { bg: "rgba(245,158,11,0.13)", text: "#FCD34D" },
                  { bg: "rgba(249,115,22,0.13)", text: "#FB923C" },
                  { bg: "rgba(239,68,68,0.13)", text: "#F87171" },
                  { bg: "rgba(20,184,166,0.13)", text: "#2DD4BF" },
                ];
                const maxTotal = Math.max(
                  ...allStats.map((o) => o.totalComments ?? 0),
                  1,
                );
                const grandTotal = allStats.reduce(
                  (s, o) => s + (o.totalComments ?? 0),
                  0,
                );
                const getInit = (name) =>
                  (name ?? "—")
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();

                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-[#0A1525]">
                          {[
                            "#",
                            "Operator",
                            "Jami",
                            "Faollik",
                            "Harakatlar",
                            "Operator faolligi",
                          ].map((h, i) => (
                            <th
                              key={i}
                              className="border-b border-[#141E2E] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#2E4A6A] whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {allStats.map((op, i) => {
                          const accent = ACCENTS[i % ACCENTS.length];
                          const pct = Math.round(
                            ((op.totalComments ?? 0) / maxTotal) * 100,
                          );
                          const entries = normalizeStats(op.statsByStatus);
                          const isActive = selectedOpId === op.id;
                          const rankLabel = i === 0 ? "★" : i + 1;
                          const rankColor =
                            i === 0
                              ? "#F59E0B"
                              : i === 1
                                ? "#9CA3AF"
                                : i === 2
                                  ? "#B45309"
                                  : "#1E3050";

                          return (
                            <tr
                              key={op.id}
                              onClick={() =>
                                fetchOperatorDetail(op.id, op.name ?? op.phone)
                              }
                              className={`op-row border-b border-[#0E1826] last:border-0 ${isActive ? "op-active" : ""}`}
                            >
                              {/* Rank */}
                              <td
                                className="px-4 py-3 text-center font-mono text-xs font-semibold"
                                style={{ color: rankColor }}
                              >
                                {rankLabel}
                              </td>

                              {/* Operator */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                                    style={{
                                      background: `${accent}18`,
                                      color: accent,
                                      border: `1px solid ${accent}28`,
                                    }}
                                  >
                                    {getInit(op.name)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-300">
                                      {op.name ?? "—"}
                                    </div>
                                    <div className="font-mono text-[11px] text-[#2E4060]">
                                      {op.phone ?? "—"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Jami */}
                              <td
                                className="px-4 py-3 text-center font-mono text-sm font-bold"
                                style={{ color: accent }}
                              >
                                {op.totalComments ?? 0}
                              </td>

                              {/* Bar */}
                              <td
                                className="px-4 py-3"
                                style={{ minWidth: 130 }}
                              >
                                <div className="op-bar-bg">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      background: `${accent}99`,
                                      height: 5,
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Harakatlar pills */}
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {entries.map(({ statusKey, count }, j) => {
                                    const ps =
                                      PILL_STYLES[j % PILL_STYLES.length];
                                    const label =
                                      getStatusStyle(statusKey).label;
                                    const short =
                                      label.length > 12
                                        ? label.slice(0, 11) + "…"
                                        : label;
                                    return (
                                      <span
                                        key={statusKey}
                                        className="op-pill"
                                        style={{
                                          background: ps.bg,
                                          color: ps.text,
                                        }}
                                      >
                                        {short}: {count}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Operator faolligi modal */}
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActivityModal(op);
                                  }}
                                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 hover:text-cyan-200 whitespace-nowrap"
                                >
                                  Operator faolligini ko&apos;rish
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot>
                        <tr className="border-t border-[#141E2E] bg-[#060D18]">
                          <td
                            colSpan={2}
                            className="px-4 py-2.5 font-mono text-[11px] font-bold text-[#1E3050]"
                          >
                            JAMI
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-sm font-bold text-blue-400">
                            {grandTotal}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
             BLOK 2 — TANLANGAN OPERATOR DETALI (/operator/{id})
           ════════════════════════════════════════════════ */}
        <section>
          <BlockHeader
            num="2"
            colorClass="bg-purple-600"
            title={
              selectedOpId
                ? `Operator detali — ${selectedOpName}`
                : "Operator detali"
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <DateFilter
              from={b2From}
              to={b2To}
              onFromChange={setB2From}
              onToChange={setB2To}
              onLoad={reloadDetail}
              loading={b2Loading}
              label="Qayta yuklash"
              color="purple"
            />
            {!selectedOpId && (
              <p className="text-sm text-slate-500 italic">
                Operator tanlash uchun yuqoridagi kartaga bosing
              </p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-purple-500/30 bg-[#0F172A] p-6">
            {b2Loading ? (
              <div className="flex h-24 items-center justify-center text-purple-400">
                Yuklanmoqda...
              </div>
            ) : !selectedOpId ? (
              <div className="flex h-24 items-center justify-center text-slate-500">
                Blok 1 dan operator tanlang
              </div>
            ) : opDetail ? (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-6">
                  <div>
                    <div className="text-xl font-extrabold text-white">
                      {opDetail.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {opDetail.phone}
                    </div>
                  </div>
                  <span className="rounded-xl bg-purple-500/20 px-4 py-2 text-lg font-bold text-purple-300">
                    Jami: {opDetail.totalComments}
                  </span>
                </div>

                {(() => {
                  const entries = normalizeStats(opDetail.statsByStatus);
                  if (!entries.length) return null;
                  return (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {entries.map(({ statusKey, count }) => {
                        const s = getStatusStyle(statusKey);
                        return (
                          <div
                            key={statusKey}
                            className={`rounded-xl border border-white/10 p-4 ${s.bg}`}
                          >
                            <div
                              className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}
                            >
                              {s.label}
                            </div>
                            <div className="mt-1 text-2xl font-extrabold text-white">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex h-24 items-center justify-center text-slate-500">
                Ma&apos;lumot topilmadi
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
             BLOK 3 — SIPUNI STATISTIKA (asl struktura saqlangan)
           ════════════════════════════════════════════════ */}
        <section>
          <BlockHeader
            num="3"
            colorClass="bg-emerald-600"
            title="Sipuni qo'ng'iroqlari"
            badge={`${sipuni.length} ta yozuv`}
          />

          {/* Blok 3 ning o'z date filtri + Excel tugmasi */}
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <DateFilter
              from={b3From}
              to={b3To}
              onFromChange={setB3From}
              onToChange={setB3To}
              onLoad={fetchSipuni}
              loading={b3Loading}
              label="Yuklash"
              color="emerald"
            />
            <button
              onClick={exportToExcel}
              disabled={b3Loading || sipuni.length === 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Excel yuklab olish
            </button>
          </div>

          {/* Jadval — asl struktura saqlanadi */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] shadow-2xl">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="text-base font-bold text-white">
                Sipuni ma&apos;lumotlari
              </h2>
            </div>

            {b3Loading ? (
              <div className="flex h-64 items-center justify-center text-sm font-medium text-emerald-400">
                Yuklanmoqda...
              </div>
            ) : sipuni.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-6 text-center">
                <div className="text-lg font-bold text-slate-200">
                  Ma&apos;lumot topilmadi
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  Sana oralig&apos;ini tanlab, qayta yuklab ko&apos;ring
                </div>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#111C30]">
                    <tr>
                      <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        #
                      </th>
                      {sipuniHeaders.map((header) => (
                        <th
                          key={header}
                          className="border-b border-slate-800 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {sipuni.map((row, index) => (
                      <tr
                        key={index}
                        className="transition hover:bg-slate-800/40"
                      >
                        <td className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-300">
                          {index + 1}
                        </td>
                        {sipuniHeaders.map((header) => (
                          <td
                            key={`${index}-${header}`}
                            className="border-b border-slate-800 px-4 py-3 text-sm text-slate-200 whitespace-nowrap"
                          >
                            {row?.[header] !== undefined &&
                            row?.[header] !== null &&
                            row?.[header] !== ""
                              ? String(row[header])
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="sticky bottom-0 bg-[#020817]">
                    <tr className="bg-slate-900 font-bold">
                      <td className="px-4 py-3 text-emerald-400">JAMI</td>
                      {sipuniHeaders.map((header) => {
                        const lower = header.toLowerCase();
                        if (
                          lower.includes("operator") ||
                          lower.includes("sipuni") ||
                          lower === "#"
                        ) {
                          return (
                            <td
                              key={header}
                              className="px-4 py-3 text-sm text-slate-500"
                            >
                              —
                            </td>
                          );
                        }
                        const value = sipuniTotals[header];
                        return (
                          <td
                            key={header}
                            className="px-4 py-3 text-sm text-emerald-300 whitespace-nowrap"
                          >
                            {typeof value === "number"
                              ? lower.includes("vaqt")
                                ? fmtSeconds(value)
                                : value
                              : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {activityModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#080F1C] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Operator faolligi
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-white">
                  {activityDetail?.name ?? "Operator faoliyati"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {activityDetail?.phone ?? "Ma'lumot yuklanmoqda..."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeActivityModal}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {activityLoading ? (
              <div className="flex h-72 items-center justify-center text-cyan-300">
                Yuklanmoqda...
              </div>
            ) : activityDetail ? (
              <div className="overflow-auto p-6">
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Login soni
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-cyan-300">
                      {activityDetail.loginCount ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Jami so&apos;rovlar
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-300">
                      {activityDetail.totalRequests ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sessionlar
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-purple-300">
                      {activityDetail.sessions?.length ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      User ID
                    </div>
                    <div className="mt-2 break-all font-mono text-xs text-slate-300">
                      {activityDetail.userId ?? "—"}
                    </div>
                  </div>
                </div>

                {!activityDetail.sessions?.length ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-[#0F172A] text-slate-500">
                    Bu operator uchun session ma&apos;lumoti topilmadi
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <div className="max-h-[55vh] overflow-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#111C30]">
                          <tr>
                            {[
                              "#",
                              "Sana",
                              "IP",
                              "Birinchi kirish",
                              "Oxirgi faollik",
                              "So'rovlar",
                              "Davomiylik",
                              "Token",
                            ].map((h) => (
                              <th
                                key={h}
                                className="border-b border-slate-800 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {activityDetail.sessions.map((session, index) => (
                            <tr
                              key={`${session.date}-${session.ip}-${index}`}
                              className="transition hover:bg-slate-800/40"
                            >
                              <td className="border-b border-slate-800 px-4 py-3 text-sm font-bold text-slate-300">
                                {index + 1}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                                {session.date ?? "—"}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                                {session.ip ?? "—"}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 text-sm text-slate-200 whitespace-nowrap">
                                {fmtDateTime(session.firstSeen)}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 text-sm text-cyan-300 whitespace-nowrap">
                                {fmtDateTime(session.lastSeen)}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 text-center font-mono text-sm font-bold text-emerald-300">
                                {session.requestCount ?? 0}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 font-mono text-xs text-purple-300 whitespace-nowrap">
                                {session.sessionDurationFormatted ??
                                  fmtSeconds(
                                    session.sessionDurationSeconds ?? 0,
                                  )}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                                {session.tokenPrefix ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center px-6 text-center text-slate-500">
                Ma&apos;lumot topilmadi yoki backend javob qaytarmadi
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorStatistic;
