import React, { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { toast } from "react-toastify";
import {
  X,
  Calendar,
  User,
  Users,
  Filter,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";

export function isFilterActive(filter) {
  if (!filter) return false;
  return !!(
    filter.fromDate ||
    filter.toDate ||
    filter.operatorId ||
    filter.agentId
  );
}

const EMPTY = { fromDate: "", toDate: "", operatorId: "", agentId: "" };

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilter,
  colName,
}) {
  const [form, setForm] = useState(EMPTY);
  const [operators, setOperators] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      fromDate: currentFilter?.fromDate || "",
      toDate: currentFilter?.toDate || "",
      operatorId: currentFilter?.operatorId || "",
      agentId: currentFilter?.agentId || "",
    });

    // Operators
    setLoadingOps(true);
    ApiCall("/api/v1/operator", "GET")
      .then((res) => setOperators(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOperators([]))
      .finally(() => setLoadingOps(false));

    // Agents
    setLoadingAgents(true);
    ApiCall("/api/v1/agent", "GET")
      .then((res) => setAgents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAgents([]))
      .finally(() => setLoadingAgents(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const toDateTime = (date, end = false) => {
    if (!date) return null;
    return end ? `${date}T23:59:59` : `${date}T00:00:00`;
  };

  const handleApply = async () => {
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      toast.error("Sana noto‘g‘ri tanlangan");
      return;
    }

    setApplying(true);

    try {
      await onApply({
        fromDate: toDateTime(form.fromDate),
        toDate: toDateTime(form.toDate, true),
        operatorId: form.operatorId || null,
        agentId: form.agentId || null,
      });

      onClose();
    } catch (err) {
      toast.error("Filter qo‘llashda xatolik");
    } finally {
      setApplying(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY);
    onApply({
      fromDate: null,
      toDate: null,
      operatorId: null,
      agentId: null,
    });
    onClose();
  };

  const activeCount = [
    form.fromDate || form.toDate,
    form.operatorId,
    form.agentId,
  ].filter(Boolean).length;

  const getActiveFiltersText = () => {
    const filters = [];
    if (form.fromDate || form.toDate) filters.push("sana");
    if (form.operatorId) filters.push("operator");
    if (form.agentId) filters.push("agent");
    return filters.join(", ");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 animate-in fade-in zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Filtrlash
                  </h3>
                  <p className="mt-0.5 text-sm text-blue-100">
                    Ustun: <span className="font-medium">{colName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-white/80 transition-all hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Active filters badge */}
            {activeCount > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  {activeCount}
                </div>
                <span className="text-xs text-white/90">
                  Faol filtr{activeCount > 1 ? "lar" : ""}:{" "}
                  {getActiveFiltersText()}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Date Range */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Sana oralig‘i
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Boshlanish
                    </label>
                    <input
                      type="date"
                      value={form.fromDate}
                      onChange={(e) => set("fromDate", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Tugash
                    </label>
                    <input
                      type="date"
                      value={form.toDate}
                      min={form.fromDate || undefined}
                      onChange={(e) => set("toDate", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!form.fromDate}
                    />
                  </div>
                </div>
                {form.fromDate && !form.toDate && (
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Tugash sanasini ham tanlang
                  </p>
                )}
              </div>

              {/* Operator Select */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 text-gray-400" />
                  Operator
                </label>
                <div className="relative">
                  <select
                    value={form.operatorId}
                    onChange={(e) => set("operatorId", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Barcha operatorlar</option>
                    {loadingOps ? (
                      <option disabled>Yuklanmoqda...</option>
                    ) : (
                      operators.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name || op.phone || `Operator ${op.id}`}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {operators.length === 0 && !loadingOps && (
                  <p className="mt-2 text-xs text-orange-600">
                    ⚠️ Operatorlar topilmadi
                  </p>
                )}
              </div>

              {/* Agent Select */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 text-gray-400" />
                  Agent
                </label>
                <div className="relative">
                  <select
                    value={form.agentId}
                    onChange={(e) => set("agentId", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Barcha agentlar</option>
                    {loadingAgents ? (
                      <option disabled>Yuklanmoqda...</option>
                    ) : (
                      agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name || ag.phone || `Agent ${ag.id}`}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {agents.length === 0 && !loadingAgents && (
                  <p className="mt-2 text-xs text-orange-600">
                    ⚠️ Agentlar topilmadi
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-5">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <Trash2 className="h-4 w-4" />
              Tozalash
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Qo‘llanmoqda...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Qo‘llash
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-in {
          animation-duration: 0.2s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fade-in;
        }

        .zoom-in {
          animation-name: zoom-in;
        }
      `}</style>
    </>
  );
}
