import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ApiCall from "../../config";
import { MdHome, MdCategory, MdLogout, MdMenu, MdInbox, MdNotifications } from "react-icons/md";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Category Item ───────────────────────────────────────────────────

const SortableCategoryItem = ({ category, isActive, isCollapsed }) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : "auto",
      }}
      className={isDragging ? "cursor-grabbing" : ""}
    >
      <Link
        to={`/operator/leads/${category.id}`}
        title={isCollapsed ? category.name : ""}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200
          ${
            isActive
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
              : "text-slate-400 hover:bg-blue-500/10 hover:text-blue-400"
          }
          ${isCollapsed ? "justify-center px-0" : ""}`}
      >
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/60" />
        )}
        <MdCategory
          className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110
            ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"}`}
        />
        {!isCollapsed && (
          <span className="flex-1 truncate text-sm font-medium">
            {category.name}
          </span>
        )}
      </Link>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onHoverChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleMouseEnter = () => {
    setIsCollapsed(false);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(true);
    onHoverChange?.(false);
  };

  // ✅ Sahifa o'zgarganda sidebar yopiladi va blur ketadi
  useEffect(() => {
    setIsCollapsed(true);
    onHoverChange?.(false);
  }, [location.pathname]);

  const fetchCategories = async () => {
    try {
      const res = await ApiCall("/api/v1/crm/categories", "GET");
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCategories((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const isActive = (path) => {
    if (path === "/operator") return currentPath === "/operator";
    return currentPath.startsWith(path);
  };

  const staticRoutes = [
    {
      name: "Bosh sahifa",
      path: "/operator",
      icon: <MdHome className="h-5 w-5 flex-shrink-0" />,
    },
    {
      name: "Kelib tushgan arizalar",
      path: "/operator/appeal",
      icon: <MdInbox className="h-5 w-5 flex-shrink-0" />,
    },
    {
      name: "Eslatmalar",
      path: "/operator/crm-remider",
      icon: <MdNotifications className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[72px]" : "w-64"}`}
      style={{
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f2040 100%)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Blue glow top */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        }}
      />
      {/* Navigation */}
      <nav
        className="flex flex-1 flex-col overflow-y-auto px-3 py-4"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Static routes */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Menyu
            </p>
          )}
          {staticRoutes.map((route) => {
            const active = isActive(route.path);
            return (
              <Link
                key={route.path}
                to={route.path}
                title={isCollapsed ? route.name : ""}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200
                  ${
                    active
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-400 hover:bg-blue-500/10 hover:text-blue-400"
                  }
                  ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                {active && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/60" />
                )}
                <span
                  className={`transition-transform duration-200 group-hover:scale-110
                  ${active ? "text-white" : "text-slate-500 group-hover:text-blue-400"}`}
                >
                  {route.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-medium">
                      {route.name}
                    </span>
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-white/5" />

        {/* Categories */}
        <div className="flex-1">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Kategoriyalar
            </p>
          )}
          {loading ? (
            <div className="space-y-2 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div
                    className={`h-9 rounded-xl bg-white/5 ${isCollapsed ? "mx-auto w-9" : "w-full"}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {categories.filter((c) => c.status).length > 0
                    ? categories
                        .filter((c) => c.status)
                        .map((category) => {
                          const active =
                            currentPath === `/operator/leads/${category.id}` ||
                            currentPath.startsWith(
                              `/operator/leads/${category.id}/`,
                            );
                          return (
                            <SortableCategoryItem
                              key={category.id}
                              category={category}
                              isActive={active}
                              isCollapsed={isCollapsed}
                            />
                          );
                        })
                    : !isCollapsed && (
                        <p className="px-3 py-2 text-xs text-slate-500">
                          Kategoriya topilmadi
                        </p>
                      )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Tizimdan chiqish" : ""}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-all duration-200
            hover:bg-red-500/10 hover:text-red-400
            ${isCollapsed ? "justify-center px-0" : ""}`}
        >
          <MdLogout className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Tizimdan chiqish</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
