import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiCall from "../../../config";
import {
  MdEdit,
  MdDelete,
  MdAdd,
  MdRefresh,
  MdSearch,
  MdClose,
  MdSave,
  MdDragHandle,
  MdMoreVert,
  MdVisibility,
  MdVisibilityOff,
  MdArrowDropDown,
} from "react-icons/md";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Sidebar from '../Sidebar';

// Searchable Select Component
const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 "
      >
        <span
          className={
            selectedOption
              ? "text-gray-900 "
              : "text-gray-500 "
          }
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <MdArrowDropDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 p-2 dark:border-gray-700">
              <div className="relative">
                <MdSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Qidirish..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      opt.id === value
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.name}</span>
                      {!opt.status && (
                        <span className="text-[10px] text-gray-400">
                          (Nofaol)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  Kategoriya topilmadi
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Sortable SubCategory Card Component
const SortableSubCategoryCard = ({
  subCategory,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subCategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex w-[260px] flex-shrink-0 flex-col rounded-lg border ${
        subCategory.status
          ? "border-gray-200 bg-white hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          : "border-gray-200 bg-gray-50 opacity-75 dark:border-gray-700 dark:bg-gray-800/50"
      } transition-all duration-200 ${
        isDragging ? "shadow-xl" : "hover:-translate-y-0.5"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MdDragHandle className="h-4 w-4" />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            #{subCategory.sortOrder || 0}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onToggleStatus(subCategory)}
            className={`rounded p-0.5 transition-colors ${
              subCategory.status
                ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title={subCategory.status ? "Nofaol qilish" : "Faol qilish"}
          >
            {subCategory.status ? (
              <MdVisibility className="h-3.5 w-3.5" />
            ) : (
              <MdVisibilityOff className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => onEdit(subCategory)}
            className="rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            title="Tahrirlash"
          >
            <MdEdit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(subCategory)}
            className="rounded p-0.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            title="O'chirish"
          >
            <MdDelete className="h-3.5 w-3.5" />
          </button>
          <button className="rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <MdMoreVert className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3">
        <div className="mb-1 flex items-start justify-between">
          <h4 className="text-sm font-semibold text-gray-800 ">
            {subCategory.name}
          </h4>
          <span
            className={`ml-2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${
              subCategory.status
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {subCategory.status ? "Faol" : "Nofaol"}
          </span>
        </div>

        <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {subCategory.description || "Tavsif mavjud emas"}
        </p>

        {/* Category info */}
        {/*<div className="mt-2 space-y-1">*/}
        {/*  <div className="flex items-center justify-between text-[10px]">*/}
        {/*    <span className="text-gray-500 dark:text-gray-400">*/}
        {/*      Kategoriya:*/}
        {/*    </span>*/}
        {/*    <span className="font-medium text-gray-700 dark:text-gray-300">*/}
        {/*      {subCategory.crmCategory?.name || "—"}*/}
        {/*    </span>*/}
        {/*  </div>*/}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 dark:text-gray-400">Источник:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Онлайн чат
            </span>
          </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 dark:text-gray-400">Leads:</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {subCategory.leadCount || 0}
          </span>
        </div>
        {/*</div>*/}

        {/* Quick action hint */}
        <button className="mt-2 w-full rounded border border-dashed border-gray-300 py-1 text-[10px] text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400">
          + Добавить подсказки
        </button>
      </div>

      {/* Progress bar */}
      {subCategory.leadCount > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden rounded-b-lg bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500"
            style={{
              width: `${Math.min((subCategory.leadCount / 100) * 100, 100)}%`,
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default function CrmCategories({ categoryId, categoryName }) {
  const { id } = useParams();
  const actualCategoryId = categoryId || id;

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    status: true,
    crmCategory: { id: actualCategoryId },
  });
  const [formErrors, setFormErrors] = useState({});

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAllCategories();
    fetchCategoryDetails();
    fetchSubCategories();
  }, [actualCategoryId]);

  useEffect(() => {
    // Filter subcategories based on search and status filter
    let filtered = subCategories;

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!showInactive) {
      filtered = filtered.filter((sub) => sub.status);
    }

    setFilteredSubCategories(filtered);
  }, [subCategories, searchTerm, showInactive]);

  const fetchAllCategories = async () => {
    try {
      const res = await ApiCall("/api/v1/crm/categories", "GET");
      const sorted = (res.data || []).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      setAllCategories(sorted);
    } catch (error) {
      console.error("Error fetching all categories:", error);
    }
  };

  const fetchCategoryDetails = async () => {
    try {
      const res = await ApiCall(
        `/api/v1/crm/categories/${actualCategoryId}`,
        "GET"
      );
      setCategory(res.data);
    } catch (error) {
      console.error("Error fetching category:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const res = await ApiCall(
        `/api/v1/crm/sub-categories/by-category/${actualCategoryId}`,
        "GET"
      );
      // Sort by sortOrder
      const sorted = (res.data || []).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      setSubCategories(sorted);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      showNotification("error", "Subkategoriyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      3000
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Nomi majburiy";
    if (!formData.description.trim()) errors.description = "Tavsif majburiy";
    if (!formData.crmCategory?.id)
      errors.category = "Kategoriya tanlanishi kerak";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setEditingSubCategory(null);
    setFormData({
      name: "",
      description: "",
      sortOrder: subCategories.length + 1,
      status: true,
      crmCategory: { id: actualCategoryId },
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingSubCategory) {
        // Update subcategory
        await ApiCall(
          `/api/v1/crm/sub-categories/${editingSubCategory.id}`,
          "PUT",
          formData
        );
        showNotification("success", "Subkategoriya muvaffaqiyatli yangilandi");
      } else {
        // Create subcategory
        await ApiCall("/api/v1/crm/sub-categories", "POST", formData);
        showNotification("success", "Subkategoriya muvaffaqiyatli qo'shildi");
      }

      // If category changed, refetch both old and new category's subcategories
      if (
        editingSubCategory &&
        editingSubCategory.crmCategory?.id !== formData.crmCategory.id
      ) {
        // Refetch both categories
        await fetchSubCategories(); // Current category
        if (formData.crmCategory.id !== actualCategoryId) {
          // Also need to notify parent to refresh if we implement that
          console.log("Subcategory moved to different category");
        }
      } else {
        await fetchSubCategories();
      }

      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving subcategory:", error);
      showNotification("error", "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    try {
      await ApiCall(`/api/v1/crm/sub-categories/${id}`, "DELETE");
      await fetchSubCategories();
      setDeleteConfirm(null);
      showNotification("success", "Subkategoriya muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      showNotification("error", "O'chirishda xatolik yuz berdi");
    }
  };

  const handleToggleStatus = async (subCategory) => {
    try {
      const updated = {
        ...subCategory,
        status: !subCategory.status,
        crmCategory: { id: subCategory.crmCategory?.id },
      };
      await ApiCall(
        `/api/v1/crm/sub-categories/${subCategory.id}`,
        "PUT",
        updated
      );
      await fetchSubCategories();
      showNotification(
        "success",
        `Subkategoriya ${updated.status ? "faollashtirildi" : "nofaol qilindi"}`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      showNotification("error", "Holatni o'zgartirishda xatolik");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filteredSubCategories.findIndex(
        (c) => c.id === active.id
      );
      const newIndex = filteredSubCategories.findIndex((c) => c.id === over.id);

      const newSubCategories = arrayMove(
        filteredSubCategories,
        oldIndex,
        newIndex
      );

      // Update sortOrder for all subcategories
      const updatedSubCategories = newSubCategories.map((sub, index) => ({
        ...sub,
        sortOrder: index + 1,
      }));

      setFilteredSubCategories(updatedSubCategories);
      setSubCategories((prev) => {
        const updated = [...prev];
        updatedSubCategories.forEach((updatedSub, index) => {
          const prevIndex = updated.findIndex((s) => s.id === updatedSub.id);
          if (prevIndex !== -1) {
            updated[prevIndex] = updatedSub;
          }
        });
        return updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      });

      // Update on server
      try {
        const movedSub = updatedSubCategories.find((s) => s.id === active.id);
        await ApiCall(`/api/v1/crm/sub-categories/${active.id}`, "PUT", {
          name: movedSub.name,
          description: movedSub.description,
          sortOrder: movedSub.sortOrder,
          status: movedSub.status,
          crmCategory: { id: movedSub.crmCategory?.id || actualCategoryId },
        });
        showNotification("success", "Tartib muvaffaqiyatli yangilandi");
      } catch (error) {
        console.error("Error updating sort order:", error);
        showNotification("error", "Tartibni saqlashda xatolik");
        fetchSubCategories();
      }
    }
  };

  const openEditModal = (subCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || "",
      sortOrder: subCategory.sortOrder || 0,
      status: subCategory.status,
      crmCategory: subCategory.crmCategory || { id: actualCategoryId },
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="border-3 border-r-transparent inline-block h-6 w-6 animate-spin rounded-full border-solid border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="ml-64 p-6 text-black">
        <Sidebar/>
        <div className="space-y-4">
          {/* Notification */}
          {notification.show && (
              <div
                  className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white shadow-lg ${
                      notification.type === "success" ? "bg-green-500" : "bg-red-500"
                  }`}
              >
                <span>{notification.message}</span>
              </div>
          )}


          {/* Category Header */}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 ">
                {categoryName || category?.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {category?.description || "Kategoriya tafsilotlari"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5">
              <button
                  onClick={fetchSubCategories}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <MdRefresh className="h-3.5 w-3.5" />
                <span>Yangilash</span>
              </button>
              <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700"
              >
                <MdAdd className="h-3.5 w-3.5" />
                <span>Subkategoriya qo'shish</span>
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Subkategoriyalarni qidirish..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    showInactive
                        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                }`}
            >
              <MdVisibility className="h-3.5 w-3.5" />
              <span>{showInactive ? "Barchasi" : "Faol"}</span>
            </button>
          </div>

          {/* SubCategories Horizontal Scroll Container */}
          <div className="relative">
            {/* Gradient fade on edges */}
            {/*<div className="to-transparent pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-white dark:from-gray-900"></div>*/}
            {/*<div className="to-transparent pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-white dark:from-gray-900"></div>*/}

            {/* Horizontal Scroll Area */}
            <div className="overflow-x-auto pb-2">
              {filteredSubCategories.length > 0 ? (
                  <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                        items={filteredSubCategories.map((s) => s.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex gap-3">
                        {filteredSubCategories.map((subCategory) => (
                            <SortableSubCategoryCard
                                key={subCategory.id}
                                subCategory={subCategory}
                                onEdit={openEditModal}
                                onDelete={(sub) => setDeleteConfirm(sub)}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}

                        {/* Add Card */}
                        <button
                            onClick={() => {
                              resetForm();
                              setShowAddModal(true);
                            }}
                            className="flex w-[260px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 transition-all hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                        >
                          <MdAdd className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Yangi subkategoriya
                    </span>
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
              ) : (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm dark:text-gray-400">
                        {searchTerm
                            ? "Hech qanday subkategoriya topilmadi"
                            : "Hozircha subkategoriyalar mavjud emas"}
                      </p>
                      <button
                          onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                          }}
                          className="mt-3 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700"
                      >
                        <MdAdd className="h-3.5 w-3.5" />
                        <span>Birinchi subkategoriyani qo'shish</span>
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>



          {/* Add/Edit Modal */}
          {showAddModal && (
              <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 ">
                      {editingSubCategory
                          ? "Subkategoriyani tahrirlash"
                          : "Yangi subkategoriya qo'shish"}
                    </h3>
                    <button
                        onClick={() => {
                          setShowAddModal(false);
                          resetForm();
                        }}
                        className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <MdClose className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Category Select */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 ">
                        Kategoriya *
                      </label>
                      <SearchableSelect
                          value={formData.crmCategory?.id}
                          onChange={(categoryId) => {
                            const selectedCategory = allCategories.find(
                                (c) => c.id === categoryId
                            );
                            setFormData({
                              ...formData,
                              crmCategory: {
                                id: categoryId,
                                name: selectedCategory?.name,
                              },
                            });
                          }}
                          options={allCategories}
                          placeholder="Kategoriya tanlang"
                      />
                      {formErrors.category && (
                          <p className="mt-1 text-xs text-red-500">
                            {formErrors.category}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 ">
                        Nomi *
                      </label>
                      <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                          }
                          className={`w-full rounded-lg border ${
                              formErrors.name ? "border-red-500" : "border-gray-300"
                          } bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 `}
                          placeholder="Subkategoriya nomi"
                      />
                      {formErrors.name && (
                          <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 ">
                        Tavsifi *
                      </label>
                      <textarea
                          value={formData.description}
                          onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                          }
                          className={`w-full rounded-lg border ${
                              formErrors.description
                                  ? "border-red-500"
                                  : "border-gray-300"
                          } bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 `}
                          placeholder="Subkategoriya tavsifi"
                          rows="2"
                      />
                      {formErrors.description && (
                          <p className="mt-1 text-xs text-red-500">
                            {formErrors.description}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 ">
                        Tartib raqami
                      </label>
                      <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                sortOrder: parseInt(e.target.value) || 0,
                              })
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 "
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Holati
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5">
                          <input
                              type="radio"
                              checked={formData.status === true}
                              onChange={() =>
                                  setFormData({ ...formData, status: true })
                              }
                              className="h-3.5 w-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                      Faol
                    </span>
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                              type="radio"
                              checked={formData.status === false}
                              onChange={() =>
                                  setFormData({ ...formData, status: false })
                              }
                              className="h-3.5 w-3.5 text-blue-600"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                      Nofaol
                    </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                          type="submit"
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <MdSave className="mr-1 inline h-3.5 w-3.5" />
                        {editingSubCategory ? "Yangilash" : "Saqlash"}
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            resetForm();
                          }}
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
              <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
                  <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                    Subkategoriyani o'chirish
                  </h3>
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    "{deleteConfirm.name}" subkategoriyasini o'chirishni
                    tasdiqlaysizmi?
                  </p>
                  <div className="flex gap-2">
                    <button
                        onClick={() => handleDelete(deleteConfirm.id)}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                    >
                      O'chirish
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}
