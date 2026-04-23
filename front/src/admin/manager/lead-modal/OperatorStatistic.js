import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import React, { useEffect, useMemo, useState } from "react";
import ApiCall from "../../../config/index";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar";

function OperatorStatistic() {
  const [statistic, setStatistic] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const excludedFields = ["#", "operator", "sipuni raqami"];

  const exportToExcel = () => {
    if (!statistic || statistic.length === 0) {
      toast.warning("Export qilish uchun ma'lumot yo'q");
      return;
    }

    // JSON → worksheet
    const worksheet = XLSX.utils.json_to_sheet(statistic);

    // workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistika");

    // Excel file yaratish
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, `operator_statistika_${fromDate}_${toDate}.xlsx`);
  };

  const getTodayForInput = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const get7DaysAgoForInput = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    setFromDate(get7DaysAgoForInput());
    setToDate(getTodayForInput());
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fetchStatistic = async () => {
    if (!fromDate || !toDate) {
      toast.warning("Sanani tanlang");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.warning("Boshlanish sanasi tugash sanasidan katta bo'lmasin");
      return;
    }

    try {
      setIsLoading(true);

      const from = formatDate(fromDate);
      const to = formatDate(toDate);

      const res = await ApiCall(
        `/api/v1/operator/sipuni-statistic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        "GET",
      );
      console.log(res.data);

      const data = Array.isArray(res?.data) ? res.data : [];
      setStatistic(data);

      if (data.length === 0) {
        toast.info("Bu oraliqda ma'lumot topilmadi");
      }
    } catch (e) {
      console.error(e);
      setStatistic([]);
      toast.error("Statistikani olishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const headers = useMemo(() => {
    if (!Array.isArray(statistic) || statistic.length === 0) return [];
    return Object.keys(statistic[0] || {});
  }, [statistic]);

  const totalRows = statistic.length;

  const detectOperator = (row) => {
    const fromNumber = String(row.fromNumber || "").trim();
    const toAnswer = String(row.toAnswer || "").trim();
    const toNumber = String(row.toNumber || "").trim();
    const numbersInvolved = String(row.numbersInvolved || "").trim();

    if (toAnswer === "201" || toAnswer === "202") return toAnswer;
    if (fromNumber === "201" || fromNumber === "202") return fromNumber;
    if (numbersInvolved.includes("201")) return "201";
    if (numbersInvolved.includes("202")) return "202";
    if (toNumber === "201" || toNumber === "202") return toNumber;

    return "Aniqlanmadi";
  };

  const totals = useMemo(() => {
    if (!statistic.length) return {};

    const total = {};

    statistic.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const lowerKey = key.toLowerCase();

        // ❌ kerakmas ustunlarni skip qilamiz
        if (
          lowerKey.includes("operator") ||
          lowerKey.includes("sipuni") ||
          lowerKey === "#"
        ) {
          return;
        }

        const val = row[key];

        // number lar
        if (!isNaN(val)) {
          total[key] = (total[key] || 0) + Number(val);
        }

        // vaqtlar
        if (typeof val === "string" && val.includes(":")) {
          const parts = val.split(":").map(Number);

          let sec = 0;
          if (parts.length === 3) {
            sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            sec = parts[0] * 60 + parts[1];
          }

          total[key] = (total[key] || 0) + sec;
        }
      });
    });

    return total;
  }, [statistic]);

  const formatSeconds = (sec) => {
    if (!sec) return "00:00:00";

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#020817]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Outfit:wght@400;600;700;800&display=swap');

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #0F172A;
        }

        ::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 999px;
        }
      `}</style>

      <div className="fixed left-0 top-0 z-40 h-screen">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>

      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}

      <div className="ml-[72px] flex min-h-screen flex-1 flex-col overflow-hidden px-6 pt-8 pb-10 font-[Outfit] md:px-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[11px] tracking-[0.15em] text-emerald-400">
              ● JONLI MA&apos;LUMOT
            </p>
            <h1 className="m-0 text-[28px] font-extrabold leading-tight text-blue-500">
              Operatorlar statistikasi
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sipuni dan tanlangan sana oralig&apos;idagi
              qo&apos;ng&apos;iroqlar ro&apos;yxati
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-[#0F172A] p-4 shadow-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">
                Boshlanish sanasi
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#020817] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">
                Tugash sanasi
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#020817] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchStatistic}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Yuklanmoqda..." : "Yuklash"}
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tanlangan oraliq
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {fromDate || "—"} → {toDate || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jami yozuvlar
            </div>
            <div className="mt-2 text-lg font-bold text-emerald-400">
              {totalRows}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Excel yuklab olish
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {isLoading
                ? "Yuklanmoqda..."
                : totalRows > 0
                  ? "Ma'lumot topildi"
                  : "Bo'sh"}

              {isLoading == false ? (
                <button
                  onClick={exportToExcel}
                  disabled={isLoading || statistic.length === 0}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Excel yuklab olish
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] shadow-2xl">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-base font-bold text-white">
              Sipuni ma&apos;lumotlari
            </h2>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm font-medium text-emerald-400">
              Yuklanmoqda...
            </div>
          ) : statistic.length === 0 ? (
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
                    {headers.map((header) => (
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
                  {statistic.map((row, index) => (
                    <tr
                      key={index}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-300">
                        {index + 1}
                      </td>

                      {headers.map((header) => (
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

                    {headers.map((header) => {
                      const lower = header.toLowerCase();

                      if (
                        lower.includes("operator") ||
                        lower.includes("sipuni") ||
                        lower === "#"
                      ) {
                        return <td key={header}>—</td>;
                      }

                      const value = totals[header];

                      return (
                        <td
                          key={header}
                          className="px-4 py-3 text-sm text-emerald-300 whitespace-nowrap"
                        >
                          {typeof value === "number"
                            ? header.toLowerCase().includes("vaqt")
                              ? formatSeconds(value)
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
      </div>
    </div>
  );
}

export default OperatorStatistic;
