import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useDroppable } from "@dnd-kit/core";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { connectLeadSocket } from "../../../config/websocket/leadSocket";
import Sidebar from "./Sidebar";
import {
  DndContext,
  closestCorners,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ApiCall from "../../../config/index";
import { GoSearch } from "react-icons/go";
import LeadModal from "./LeadModal";

// ─── Constants ───────────────────────────────────────────────────────────────
const LOCKED_COLUMN_NAMES = [];
const PAGE_SIZE = 100;

function isLockedColumn(colName = "") {
  return LOCKED_COLUMN_NAMES.some(
    (name) => name.toLowerCase() === colName.trim().toLowerCase(),
  );
}

function customCollision(args) {
  const hits = pointerWithin(args);
  if (hits.length > 0) return hits;
  return closestCorners(args);
}

// ─── LeadCard ────────────────────────────────────────────────────────────────
const LeadCard = React.memo(function LeadCard({
  lead,
  isDragging,
  onCardClick,
  locked,
  selectMode,
  isSelected,
  onToggleSelect,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: lead.id,
      data: { type: "lead", lead },
      disabled: locked || selectMode,
    });

  const style = {
    cursor: selectMode ? "pointer" : "move",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const agentName =
    lead?.applicant?.agent == null
      ? "BXU"
      : lead?.applicant?.agent?.name?.toUpperCase();

  const fullName =
    (lead.applicant
      ? `${lead.applicant.firstName || ""} ${lead.applicant.lastName || ""}`.trim()
      : "") || "ISM KIRITILMAGAN";

  const phone = lead.phone || lead.applicant?.phone;

  const operatorName = lead?.operator?.name || null;

  const formattedDate = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString("ru-RU")
    : "";

  return (
    <div
      data-lead-card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(locked || selectMode ? {} : listeners)}
      onClick={selectMode ? () => onToggleSelect(lead.id) : undefined}
      className={`mb-2 rounded-md border p-3 hover:shadow-sm transition-colors ${
        selectMode && isSelected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
          : "border-gray-200 bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          {selectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(lead.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
            />
          )}
          <p className="truncate font-medium text-gray-800">{fullName}</p>
        </div>
        <p className="text-xs text-gray-400">{formattedDate}</p>
      </div>
      <div className="flex justify-between items-center">
        {phone && (
          <p
            onClick={(e) => {
              e.stopPropagation();
              if (!selectMode) onCardClick(lead);
            }}
            className="text-xs text-gray-500 hover:text-blue-500 hover:cursor-pointer transition-colors flex-shrink-0"
          >
            {phone}
          </p>
        )}
        {agentName && (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 truncate max-w-[90px]">
            <svg
              className="h-2.5 w-2.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            <span className="truncate">{agentName}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
        {operatorName && (
          <span className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600 truncate max-w-[100px]">
            <svg
              className="h-2.5 w-2.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate">{operatorName}</span>
          </span>
        )}
      </div>
    </div>
  );
});

// ─── DropPlaceholder ─────────────────────────────────────────────────────────
function DropPlaceholder() {
  return (
    <div className="mt-2 h-[72px] rounded-md border-2 border-dashed border-blue-500 bg-blue-100/80" />
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────
const Column = React.memo(function Column({
  col,
  leads,
  activeId,
  overId,
  onCardClick,
  loadingMore,
  hasMore,
  onAddLead,
  totalElements,
  selectMode,
  selectedLeadIds,
  onToggleSelect,
  onSelectAllInColumn,
}) {
  const locked = isLockedColumn(col.name);
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: "column", colId: col.id },
    disabled: locked || selectMode,
  });

  const itemIds = leads.map((l) => l.id);

  const isTarget =
    !locked &&
    !selectMode &&
    !!activeId &&
    (overId === col.id || leads.some((l) => l.id === overId));

  // Select all logic for this column
  const allSelected =
    selectMode &&
    leads.length > 0 &&
    leads.every((l) => selectedLeadIds.has(l.id));
  const someSelected =
    selectMode && !allSelected && leads.some((l) => selectedLeadIds.has(l.id));

  return (
    <div
      ref={setNodeRef}
      className="flex w-[290px] flex-shrink-0 flex-col bg-gray-100 px-3"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-100 py-2 text-center">
        <div className="border-b-4 border-blue-400">
          <div className="flex items-center justify-center gap-1.5">
            {selectMode && (
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => onSelectAllInColumn(col.id, leads)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                title="Hammasini tanlash"
              />
            )}
            <h2 className="text-xs font-bold uppercase tracking-wider text-black">
              {col.name}
            </h2>
            {col.name.toLowerCase() === "nomer kiritdi" && !selectMode && (
              <button
                onClick={() => onAddLead(col)}
                className="ml-1 flex items-center justify-center rounded-full bg-green-100 p-1 text-green-600 hover:bg-green-200 hover:scale-110 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Jami: {totalElements ?? leads.length}
            {selectMode && (
              <span className="ml-1 text-blue-600 font-medium">
                ({leads.filter((l) => selectedLeadIds.has(l.id)).length}{" "}
                tanlangan)
              </span>
            )}
          </p>
        </div>
        {/* Drop zone indicator — yuqorida, sticky header ichida */}
        <div
          className={`rounded-md border-2 border-dashed border-blue-500 bg-blue-100/80 transition-all duration-150 ${
            isTarget
              ? "mt-4 h-[72px] opacity-100"
              : "h-0 opacity-0 pointer-events-none overflow-hidden"
          }`}
        />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="min-h-[200px]">
            {leads.map((lead) => (
              <React.Fragment key={lead.id}>
                {/* Placeholder — lead ustiga drag kelganda */}
                {!!activeId &&
                  !locked &&
                  !selectMode &&
                  overId === lead.id &&
                  lead.id !== activeId}
                <LeadCard
                  lead={lead}
                  isDragging={activeId === lead.id}
                  onCardClick={onCardClick}
                  locked={locked}
                  selectMode={selectMode}
                  isSelected={selectedLeadIds.has(lead.id)}
                  onToggleSelect={onToggleSelect}
                />
              </React.Fragment>
            ))}
          </div>
        </SortableContext>

        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
            <span className="ml-2 text-xs text-gray-400">Yuklanmoqda...</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── DragOverlayCard ─────────────────────────────────────────────────────────
function DragOverlayCard({ lead }) {
  if (!lead) return null;
  const fullName =
    (lead.applicant
      ? `${lead.applicant.firstName || ""} ${lead.applicant.lastName || ""}`.trim()
      : "") || "ISM KIRITILMAGAN";
  const phone = lead.phone || lead.applicant?.phone;
  const formattedDate = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString("ru-RU")
    : "";
  const agentName =
    lead?.applicant?.agent == null
      ? "BXU"
      : lead?.applicant?.agent?.name?.toUpperCase();
  const operatorName = lead?.operator?.name || null;

  return (
    <div className="w-[274px] rotate-1 cursor-move rounded-md border border-blue-200 bg-white p-3 shadow-2xl ring-2 ring-blue-400">
      <div className="flex justify-between items-center">
        <p className="truncate font-medium text-gray-800">{fullName}</p>
        <p className="text-xs text-gray-400">{formattedDate}</p>
      </div>
      <div className="flex justify-between items-center">
        {phone && (
          <p className="text-xs text-gray-500 flex-shrink-0">{phone}</p>
        )}
        {agentName && (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 truncate max-w-[90px]">
            <svg
              className="h-2.5 w-2.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            <span className="truncate">{agentName}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
        {operatorName && (
          <span className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600 truncate max-w-[100px]">
            <svg
              className="h-2.5 w-2.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate">{operatorName}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MiniMap ─────────────────────────────────────────────────────────────────
function MiniMap({ columns, boardRef }) {
  const miniMapRef = useRef(null);
  const [scrollInfo, setScrollInfo] = useState({
    pos: 0,
    visible: 0,
    total: 0,
  });
  const isDraggingMap = useRef(false);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const update = () =>
      setScrollInfo({
        pos: board.scrollLeft,
        visible: board.clientWidth,
        total: board.scrollWidth,
      });
    update();
    board.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      board.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [boardRef]);

  const scrollTo = useCallback(
    (clientX) => {
      const board = boardRef.current;
      const map = miniMapRef.current;
      if (!board || !map) return;
      const rect = map.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      board.scrollLeft = pct * (board.scrollWidth - board.clientWidth);
    },
    [boardRef],
  );

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingMap.current) scrollTo(e.clientX);
    };
    const onUp = () => {
      isDraggingMap.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scrollTo]);

  const { pos, visible, total } = scrollInfo;
  const widthPct = total > visible ? (visible / total) * 100 : 100;
  const leftPct =
    total > visible ? (pos / (total - visible)) * (100 - widthPct) : 0;

  return (
    <div className="fixed bottom-4 right-6 z-50 w-[160px]">
      <div
        ref={miniMapRef}
        onMouseDown={(e) => {
          isDraggingMap.current = true;
          scrollTo(e.clientX);
        }}
        className="relative flex h-8 cursor-pointer items-center overflow-hidden rounded-lg border bg-gray-200 p-1 shadow"
      >
        <div className="flex h-full w-full gap-[2px]">
          {columns.map((col) => (
            <div key={col.id} className="flex-1 rounded bg-gray-300" />
          ))}
        </div>
        <div
          className="absolute bottom-1 top-1 rounded border border-blue-400 bg-blue-500/40"
          style={{ width: `${widthPct}%`, left: `${leftPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Index (main) ─────────────────────────────────────────────────────────────
function Index() {
  const { id: categoryId } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [user, setUser] = useState(null);
  const [columns, setColumns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeLead, setActiveLead] = useState(null);
  const [overId, setOverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnData, setColumnData] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [phone, setPhone] = useState("+998");

  // ── Select Mode State ─────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [operators, setOperators] = useState([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [assigningOperator, setAssigningOperator] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const boardRef = useRef(null);
  const panRef = useRef({ isPanning: false, startX: 0, scrollLeft: 0 });
  const audioRef = useRef(null);
  const audioUnlocked = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const columnDataRef = useRef(columnData);
  const columnsRef = useRef(columns);
  const userRef = useRef(null);
  const scrollRafRef = useRef(null);
  const searchTimerRef = useRef(null);
  const searchTermRef = useRef("");

  // WebSocket handler refs — qayta ulanishning oldini oladi
  const handleLeadUpdateRef = useRef(null);
  const handleNewLeadRef = useRef(null);
  const handleLeadCommentRef = useRef(null);
  const suppressNewLeadToastRef = useRef(false);

  // Ref'larni har render'da yangilab turish
  useEffect(() => {
    columnDataRef.current = columnData;
  }, [columnData]);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // ── Yordamchi: columnData ni surgical yangilash ───────────────────────────
  const updateColData = useCallback((colId, updater) => {
    setColumnData((prev) => {
      if (!prev[colId]) return prev;
      return { ...prev, [colId]: updater(prev[colId]) };
    });
  }, []);

  // ── Category nomi ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!categoryId) return;
    ApiCall(`/api/v1/crm/categories/${categoryId}`, "GET")
      .then((res) => setCategoryName(res.data?.name || ""))
      .catch(() => setCategoryName(""));
  }, [categoryId]);

  // ── User ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    ApiCall("/api/v1/auth/decode", "GET")
      .then((res) => {
        setUser(res.data);
        userRef.current = res.data;
      })
      .catch(() => setUser(null));
  }, []);

  // ── Audio unlock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current && !audioUnlocked.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioUnlocked.current = true;
          })
          .catch(() => {});
      }
    };
    document.addEventListener("click", unlockAudio, { once: true });
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  // ── WebSocket handlers (ref orqali — stale closure yo'q) ─────────────────
  // handleLeadUpdate
  handleLeadUpdateRef.current = useCallback((updatedLead) => {
    setColumnData((prev) => {
      const updated = { ...prev };
      let oldColId = null;
      Object.keys(updated).forEach((colId) => {
        if (updated[colId].leads.some((l) => l.id === updatedLead.id)) {
          oldColId = colId;
        }
        updated[colId] = {
          ...updated[colId],
          leads: updated[colId].leads.filter((l) => l.id !== updatedLead.id),
        };
      });
      const newColId = updatedLead.crmSubCategory?.id;
      if (newColId && updated[newColId]) {
        updated[newColId] = {
          ...updated[newColId],
          leads: [updatedLead, ...updated[newColId].leads],
          // totalElements kolonnalar orasida harakat — o'zgarishsiz
          totalElements:
            oldColId && oldColId !== String(newColId)
              ? (updated[newColId].totalElements ?? 0) + 1
              : updated[newColId].totalElements,
        };
        if (oldColId && oldColId !== String(newColId) && updated[oldColId]) {
          updated[oldColId] = {
            ...updated[oldColId],
            totalElements: Math.max(
              0,
              (updated[oldColId].totalElements ?? 1) - 1,
            ),
          };
        }
      }
      return updated;
    });
  }, []);

  // handleNewLead
  handleNewLeadRef.current = useCallback((newLead) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setColumnData((prev) => {
      const colId = newLead.crmSubCategory?.id;
      if (!colId || !prev[colId]) return prev;
      return {
        ...prev,
        [colId]: {
          ...prev[colId],
          leads: [newLead, ...prev[colId].leads],
          totalElements: (prev[colId].totalElements ?? 0) + 1,
        },
      };
    });
    if (!suppressNewLeadToastRef.current) {
      toast.success("Yangi lead qo'shildi!", { toastId: newLead.id });
    }
    suppressNewLeadToastRef.current = false;
  }, []);

  // handleLeadComment
  handleLeadCommentRef.current = useCallback((comment) => {
    setSelectedLead((prev) => {
      if (!prev || prev.id !== comment.crmLead?.id) return prev;
      return { ...prev, comments: [...(prev.comments || []), comment] };
    });
  }, []);

  // ── WebSocket — faqat bir marta ulanadi, qayta ulanmaydi ─────────────────
  useEffect(() => {
    const disconnect = connectLeadSocket(
      (lead) => handleLeadUpdateRef.current(lead),
      (lead) => handleNewLeadRef.current(lead),
      (comment) => handleLeadCommentRef.current(comment),
    );
    return () => disconnect();
  }, []); // bo'sh dependency — faqat mount/unmount

  // ── Sensors ───────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const loadNextPage = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    const currentData = columnDataRef.current;
    const currentCols = columnsRef.current;
    if (!currentCols.some((col) => currentData[col.id]?.hasMore)) return;

    isLoadingMoreRef.current = true;

    // loadingMore flagni yoq
    setColumnData((prev) => {
      const updated = { ...prev };
      currentCols.forEach((col) => {
        if (updated[col.id]?.hasMore)
          updated[col.id] = { ...updated[col.id], loadingMore: true };
      });
      return updated;
    });

    try {
      await Promise.all(
        currentCols.map(async (col) => {
          const data = currentData[col.id];
          if (!data || !data.hasMore) return;
          const nextPage = data.page + 1;
          const query = searchTermRef.current?.trim() || "";
          try {
            let url = `/api/v1/crm/leads/sub-category/${col.id}/paged?page=${nextPage}&size=${PAGE_SIZE}`;
            if (query) url += `&query=${encodeURIComponent(query)}`;
            const r = await ApiCall(url, "GET");
            const content = Array.isArray(r.data?.content)
              ? r.data.content
              : [];
            const isLast = r.data?.last ?? content.length < PAGE_SIZE;
            setColumnData((prev) => {
              if (!prev[col.id]) return prev;
              return {
                ...prev,
                [col.id]: {
                  ...prev[col.id],
                  leads: [...prev[col.id].leads, ...content],
                  page: nextPage,
                  hasMore: !isLast,
                  loadingMore: false,
                  // totalElements o'zgarmaydi
                },
              };
            });
          } catch {
            setColumnData((prev) => {
              if (!prev[col.id]) return prev;
              return {
                ...prev,
                [col.id]: { ...prev[col.id], loadingMore: false },
              };
            });
          }
        }),
      );
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, []);

  const maybeLoadMore = useCallback(() => {
    const board = boardRef.current;
    if (!board || isLoadingMoreRef.current) return;
    if (board.scrollHeight - board.scrollTop - board.clientHeight <= 300) {
      loadNextPage();
    }
  }, [loadNextPage]);

  const handleBoardScroll = useCallback(() => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(maybeLoadMore);
  }, [maybeLoadMore]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // ── Fetch columns (faqat boshlang'ich yuklash va manual refresh) ──────────
  const fetchColumns = useCallback(async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      const res = await ApiCall(
        `/api/v1/crm/sub-categories/by-category/${categoryId}`,
        "GET",
      );
      const sorted = (res.data || []).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
      setColumns(sorted);

      const initialData = {};
      sorted.forEach((col) => {
        initialData[col.id] = {
          leads: [],
          page: 0,
          hasMore: true,
          loadingMore: false,
        };
      });
      setColumnData(initialData);

      await Promise.all(
        sorted.map(async (col) => {
          try {
            const r = await ApiCall(
              `/api/v1/crm/leads/sub-category/${col.id}/paged?page=0&size=${PAGE_SIZE}`,
              "GET",
            );
            if (!r?.data) return;
            const content = Array.isArray(r.data?.content)
              ? r.data.content
              : [];
            const isLast = r.data?.last ?? content.length < PAGE_SIZE;
            setColumnData((prev) => ({
              ...prev,
              [col.id]: {
                leads: content,
                page: 0,
                hasMore: !isLast,
                loadingMore: false,
                totalElements: r.data?.totalElements ?? content.length,
              },
            }));
          } catch {
            setColumnData((prev) => ({
              ...prev,
              [col.id]: {
                leads: [],
                page: 0,
                hasMore: false,
                loadingMore: false,
                totalElements: 0,
              },
            }));
          }
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  // ── Helper: build API URL with optional query ─────────────────────────────
  const buildApiUrl = useCallback((colId, page, query = "") => {
    let url = `/api/v1/crm/leads/sub-category/${colId}/paged?page=${page}&size=${PAGE_SIZE}`;
    if (query.trim()) url += `&query=${encodeURIComponent(query.trim())}`;
    return url;
  }, []);

  // ── Debounced backend search ──────────────────────────────────────────────
  useEffect(() => {
    searchTermRef.current = searchTerm;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      if (columns.length === 0) return;
      const query = searchTerm.trim();

      await Promise.all(
        columns.map(async (col) => {
          try {
            const r = await ApiCall(buildApiUrl(col.id, 0, query), "GET");
            if (!r?.data) return;
            const content = Array.isArray(r.data?.content)
              ? r.data.content
              : [];
            const isLast = r.data?.last ?? content.length < PAGE_SIZE;
            if (searchTermRef.current.trim() !== query) return;
            setColumnData((prev) => ({
              ...prev,
              [col.id]: {
                leads: content,
                page: 0,
                hasMore: !isLast,
                loadingMore: false,
                totalElements: r.data?.totalElements ?? content.length,
              },
            }));
          } catch {
            // ignore search errors
          }
        }),
      );
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm, columns, buildApiUrl]);

  // ── Sipuni import ─────────────────────────────────────────────────────────
  const sipuni = async () => {
    try {
      setLoading(true);
      await ApiCall(`/sipuni/import-today`, "GET");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const savedScrollRef = useRef({ top: 0, left: 0 });

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    setActiveLead(event.active.data?.current?.lead || null);
    setOverId(null);
    if (boardRef.current) {
      savedScrollRef.current = {
        top: boardRef.current.scrollTop,
        left: boardRef.current.scrollLeft,
      };
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveLead(null);
    setOverId(null);
    requestAnimationFrame(() => {
      if (boardRef.current) {
        boardRef.current.scrollTop = savedScrollRef.current.top;
        boardRef.current.scrollLeft = savedScrollRef.current.left;
      }
    });
  }, []);

  const handleDragOver = useCallback((event) => {
    setOverId(event.over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);
    setOverId(null);

    requestAnimationFrame(() => {
      if (boardRef.current) {
        boardRef.current.scrollTop = savedScrollRef.current.top;
        boardRef.current.scrollLeft = savedScrollRef.current.left;
      }
    });

    if (!over) return;

    const leadId = active.id;
    const leadData = active.data?.current?.lead;
    if (!leadData) return;

    const currentCols = columnsRef.current;
    const overType = over.data?.current?.type;
    let newColumnId = null;

    if (overType === "column") {
      newColumnId = over.data.current.colId;
    } else if (overType === "lead") {
      newColumnId = over.data.current.lead?.crmSubCategory?.id;
      if (!newColumnId) {
        for (const col of currentCols) {
          if (
            columnDataRef.current[col.id]?.leads.some((l) => l.id === over.id)
          ) {
            newColumnId = col.id;
            break;
          }
        }
      }
    } else {
      if (currentCols.some((c) => c.id === over.id)) {
        newColumnId = over.id;
      } else {
        for (const col of currentCols) {
          if (
            columnDataRef.current[col.id]?.leads.some((l) => l.id === over.id)
          ) {
            newColumnId = col.id;
            break;
          }
        }
      }
    }

    if (!newColumnId) return;

    const targetCol = currentCols.find((c) => c.id === newColumnId);
    if (targetCol && isLockedColumn(targetCol.name)) return;

    const currentColumnId = leadData.crmSubCategory?.id;
    if (currentColumnId === newColumnId) return;

    // Optimistic update — scroll yo'q, faqat state o'zgaradi
    setColumnData((prev) => {
      const updated = { ...prev };

      // Eski kolonnadan olib tashla
      if (currentColumnId && updated[currentColumnId]) {
        updated[currentColumnId] = {
          ...updated[currentColumnId],
          leads: updated[currentColumnId].leads.filter((l) => l.id !== leadId),
          totalElements: Math.max(
            0,
            (updated[currentColumnId].totalElements ?? 1) - 1,
          ),
        };
      }

      // Yangi kolonnaga qo'sh
      if (
        updated[newColumnId] &&
        !updated[newColumnId].leads.some((l) => l.id === leadId)
      ) {
        updated[newColumnId] = {
          ...updated[newColumnId],
          leads: [
            {
              ...leadData,
              crmSubCategory: {
                ...(leadData.crmSubCategory || {}),
                id: newColumnId,
              },
            },
            ...updated[newColumnId].leads,
          ],
          totalElements: (updated[newColumnId].totalElements ?? 0) + 1,
        };
      }

      return updated;
    });

    // API ga yuborish — muvaffaqiyatsiz bo'lsa rollback (fetchColumns yo'q!)
    try {
      await ApiCall(
        `/api/v1/crm/leads/${leadId}/${userRef.current?.id}`,
        "PUT",
        {
          crmSubCategoryId: newColumnId,
          status: 1,
        },
      );
    } catch (err) {
      console.error("Update error:", err);

      // Rollback — faqat bu leadni qaytarish (fetchColumns emas!)
      setColumnData((prev) => {
        const updated = { ...prev };

        // Yangi kolonnadan olib tashla
        if (updated[newColumnId]) {
          updated[newColumnId] = {
            ...updated[newColumnId],
            leads: updated[newColumnId].leads.filter((l) => l.id !== leadId),
            totalElements: Math.max(
              0,
              (updated[newColumnId].totalElements ?? 1) - 1,
            ),
          };
        }

        // Eski kolonnaga qaytarish
        if (currentColumnId && updated[currentColumnId]) {
          updated[currentColumnId] = {
            ...updated[currentColumnId],
            leads: [leadData, ...updated[currentColumnId].leads],
            totalElements: (updated[currentColumnId].totalElements ?? 0) + 1,
          };
        }

        return updated;
      });

      toast.error("Xatolik yuz berdi, lead qaytarildi");
    }
  }, []);

  // ── Pan (sichqoncha bilan gorizontal scroll) ───────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest("[data-lead-card]")) return;
    const board = boardRef.current;
    if (!board) return;
    panRef.current = {
      isPanning: true,
      startX: e.pageX - board.offsetLeft,
      scrollLeft: board.scrollLeft,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!panRef.current.isPanning) return;
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;
    board.scrollLeft =
      panRef.current.scrollLeft -
      (e.pageX - board.offsetLeft - panRef.current.startX) * 1.5;
  }, []);

  const handleMouseUp = useCallback(() => {
    panRef.current.isPanning = false;
  }, []);

  // ── Modal handlers ────────────────────────────────────────────────────────
  const openLeadModal = useCallback((lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  }, []);

  // Modal yopilganda barcha leadlarni yangilash
  const handleCloseModal = useCallback(() => {
    setShowLeadModal(false);
    setSelectedLead(null);
  }, []);

  const handleLeadSaved = useCallback((updatedLead) => {
    if (!updatedLead) return;

    setColumnData((prev) => {
      const updated = { ...prev };
      let oldColId = null;

      // Eski joyidan top
      for (const colId of Object.keys(updated)) {
        if (updated[colId].leads.some((l) => l.id === updatedLead.id)) {
          oldColId = colId;
        }
        updated[colId] = {
          ...updated[colId],
          leads: updated[colId].leads.filter((l) => l.id !== updatedLead.id),
        };
      }

      // Yangi joyiga qo'sh
      const newColId = String(updatedLead.crmSubCategory?.id);
      if (newColId && updated[newColId]) {
        updated[newColId] = {
          ...updated[newColId],
          leads: [updatedLead, ...updated[newColId].leads],
          totalElements:
            oldColId && oldColId !== newColId
              ? (updated[newColId].totalElements ?? 0) + 1
              : updated[newColId].totalElements,
        };

        if (oldColId && oldColId !== newColId && updated[oldColId]) {
          updated[oldColId] = {
            ...updated[oldColId],
            totalElements: Math.max(
              0,
              (updated[oldColId].totalElements ?? 1) - 1,
            ),
          };
        }
      }

      return updated;
    });

    setSelectedLead((prev) =>
      prev?.id === updatedLead.id
        ? { ...updatedLead, comments: prev.comments }
        : prev,
    );
  }, []);

  // ── Add lead modal ────────────────────────────────────────────────────────
  const handleAddLead = useCallback((col) => {
    setShowAddModal(true);
  }, []);

  // ── Select Mode ──────────────────────────────────────────────────────────
  const showSelects = useCallback(() => {
    setSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        // Exiting select mode — clear selection
        setSelectedLeadIds(new Set());
        setSelectedOperatorId("");
      } else {
        // Entering select mode — fetch operators
        ApiCall("/api/v1/operator", "GET")
          .then((res) => {
            if (res?.data && Array.isArray(res.data)) {
              setOperators(res.data);
            }
          })
          .catch(() => toast.error("Operatorlarni yuklashda xatolik"));
      }
      return next;
    });
  }, []);

  const handleToggleSelect = useCallback((leadId) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  const handleSelectAllInColumn = useCallback((colId, filteredLeads) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredLeads.every((l) => next.has(l.id));
      if (allSelected) {
        // Deselect all in this column
        filteredLeads.forEach((l) => next.delete(l.id));
      } else {
        // Select all in this column
        filteredLeads.forEach((l) => next.add(l.id));
      }
      return next;
    });
  }, []);

  const handleAssignOperator = useCallback(async () => {
    if (!selectedOperatorId || selectedLeadIds.size === 0) {
      toast.warn("Operator va kamida bitta lead tanlang");
      return;
    }
    setAssigningOperator(true);
    try {
      await ApiCall("/api/v1/crm/leads/change-operator", "PUT", {
        operatorId: selectedOperatorId,
        leadIds: Array.from(selectedLeadIds),
      });
      toast.success(`${selectedLeadIds.size} ta leadga operator biriktirildi!`);
      // Exit select mode and clear selection
      setSelectMode(false);
      setSelectedLeadIds(new Set());
      setSelectedOperatorId("");
      // Refresh data
      fetchColumns();
    } catch (err) {
      console.error(err);
      toast.error("Operator biriktirishda xatolik yuz berdi");
    } finally {
      setAssigningOperator(false);
    }
  }, [selectedOperatorId, selectedLeadIds, fetchColumns]);

  const handleSaveLead = async () => {
    try {
      const response = await ApiCall("/api/v1/abuturient/without-sms", "POST", {
        phone,
        agent: user?.id,
        isDtm: false,
        commenterId: user?.id,
      });
      if (typeof response.data === "string") {
        // Phone already exists — show warning, keep modal open
        suppressNewLeadToastRef.current = true;
        toast.warning(response.data, { autoClose: 6000 });
      } else {
        toast.success("Lead muvaffaqiyatli qo'shildi!");
        setShowAddModal(false);
        setPhone("+998");
        // WebSocket orqali yangi lead keladi — fetchColumns kerak emas
      }
    } catch (err) {
      console.error(err);
      toast.error("Lead qo'shishda xatolik");
    }
  };

  const isLoadingMore = Object.values(columnData).some((d) => d.loadingMore);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-500">Maʼlumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen select-none overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>

      {/* Blur overlay */}
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col ml-[72px] overflow-hidden">
        {/* Header */}
        <header className="flex w-full flex-shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="whitespace-nowrap text-lg font-normal uppercase text-gray-700">
              {categoryName || "CRM"}
            </h1>
            <button
              className={`px-3 py-1 rounded-xl text-white text-sm transition-colors ${
                selectMode
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              onClick={showSelects}
            >
              {selectMode ? "Bekor qilish ✕" : "Tanlash rejimi"}
            </button>
          </div>
          <div className="max-w-sm flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Qidirish va filter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-transparent bg-gray-100 py-1.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              <GoSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Board */}
        <div
          ref={boardRef}
          onScroll={handleBoardScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 overflow-auto"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={customCollision}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            autoScroll={true} // ✅ drag paytida scroll yo'q
          >
            <div className="min-h-full w-max min-w-full">
              <div className="flex items-stretch h-full bg-gray-100">
                {columns.map((col) => {
                  const data = columnData[col.id] || {
                    leads: [],
                    hasMore: false,
                    loadingMore: false,
                    totalElements: 0,
                  };
                  return (
                    <Column
                      key={col.id}
                      col={col}
                      leads={data.leads}
                      hasMore={data.hasMore}
                      loadingMore={data.loadingMore}
                      totalElements={data.totalElements}
                      activeId={activeId}
                      overId={overId}
                      onCardClick={openLeadModal}
                      onAddLead={handleAddLead}
                      selectMode={selectMode}
                      selectedLeadIds={selectedLeadIds}
                      onToggleSelect={handleToggleSelect}
                      onSelectAllInColumn={handleSelectAllInColumn}
                    />
                  );
                })}
              </div>
              {isLoadingMore && (
                <div className="flex w-full items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  <span className="ml-2 text-xs text-gray-400">
                    Yuklanmoqda...
                  </span>
                </div>
              )}
            </div>

            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
              {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <MiniMap columns={columns} boardRef={boardRef} />

      {/* Lead modal */}
      {showLeadModal && (
        <LeadModal
          show={showLeadModal}
          onClose={handleCloseModal} // ✅ fetchColumns yo'q
          lead={selectedLead}
          userId={user?.id}
          onSaved={handleLeadSaved}
          locked={isLockedColumn(selectedLead?.crmSubCategory?.name)}
          commentsFromSocket={selectedLead?.comments || []}
        />
      )}

      {/* Add lead modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[300px] rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold">
              Telefon raqam kiriting
            </h3>
            <input
              value={phone}
              onChange={(e) => {
                let value = e.target.value.replace(/[^\d+]/g, "");
                if (!value.startsWith("+998")) value = "+998";
                if (value.length > 13) return;
                setPhone(value);
              }}
              className="w-full border p-2 rounded"
              placeholder="+998901234567"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPhone("+998");
                }}
                className="px-3 py-1 text-sm text-gray-500"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveLead}
                className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator assignment floating toolbar */}
      {selectMode && selectedLeadIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {selectedLeadIds.size}
              </span>
              <span className="text-sm font-medium text-gray-700">
                lead tanlandi
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Operator tanlang...</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name || op.phone}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignOperator}
              disabled={!selectedOperatorId || assigningOperator}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors ${
                selectedOperatorId && !assigningOperator
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-400"
              }`}
            >
              {assigningOperator ? (
                <span className="flex items-center gap-1">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Yuklanmoqda...
                </span>
              ) : (
                "Operatorga biriktirish"
              )}
            </button>
            <button
              onClick={() => setSelectedLeadIds(new Set())}
              className="ml-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Tanlovni tozalash"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/sounds/lead.mp3" preload="auto" />
    </div>
  );
}

export default Index;
