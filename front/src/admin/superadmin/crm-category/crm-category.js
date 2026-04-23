import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // for navigation
import ApiCall from '../../../config';
import Sidebar from '../Sidebar';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragHandle } from 'react-icons/md'; // optional, for drag handle icon

// Simple loading spinner
const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
);

// Sortable row component
const SortableCategoryRow = ({ category, onEdit, onDelete, onNavigate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        cursor: 'pointer',
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-gray-50 transition duration-150 group"
            onClick={() => onNavigate(category.id)} // navigate on row click
        >
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                    {/* Drag handle – prevent click from triggering navigation */}
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-move p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <MdDragHandle className="h-4 w-4" />
                    </div>
                    <span>{category.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {category.description || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
        <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                category.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
          {category.status ? 'Faol' : 'No faol'}
        </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {category.sortOrder}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // prevent row click
                        onEdit(category);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition"
                >
                    Tahrirlash
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // prevent row click
                        onDelete(category.id);
                    }}
                    className="text-red-600 hover:text-red-900 transition"
                >
                    O‘chirish
                </button>
            </td>
        </tr>
    );
};

const CrmCategory = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: true,
        sortOrder: 0,
    });

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // drag starts after moving 5px
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch all categories
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ApiCall('/api/v1/crm/categories', 'GET', null, null, true);
            if (response && !response.error && response.data) {
                // Sort by sortOrder ascending
                const sorted = response.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setCategories(sorted);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Kategoriyalarni yuklashda xatolik yuz berdi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Open modal for create
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedCategory(null);
        setFormData({
            name: '',
            description: '',
            status: true,
            sortOrder: categories.length + 1,
        });
        setShowModal(true);
    };

    // Open modal for edit
    const openEditModal = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            status: category.status,
            sortOrder: category.sortOrder,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Submit create or update
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await ApiCall('/api/v1/crm/categories', 'POST', formData, null, true);
            } else {
                await ApiCall(`/api/v1/crm/categories/${selectedCategory.id}`, 'PUT', formData, null, true);
            }
            fetchCategories(); // refresh list
            closeModal();
        } catch (err) {
            console.error('Error saving category:', err);
            alert('Kategoriyani saqlashda xatolik yuz berdi.');
        }
    };

    // Delete category
    const handleDelete = async (id) => {
        if (window.confirm('Ushbu kategoriyani oʻchirishni xohlaysizmi?')) {
            try {
                await ApiCall(`/api/v1/crm/categories/${id}`, 'DELETE', null, null, true);
                fetchCategories();
            } catch (err) {
                console.error('Error deleting category:', err);
                alert('Kategoriyani oʻchirishda xatolik yuz berdi.');
            }
        }
    };

    // Handle drag end – update sortOrder
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = categories.findIndex((c) => c.id === active.id);
            const newIndex = categories.findIndex((c) => c.id === over.id);

            const newCategories = arrayMove(categories, oldIndex, newIndex);

            // Update sortOrder for all affected categories
            const updatedCategories = newCategories.map((cat, idx) => ({
                ...cat,
                sortOrder: idx + 1,
            }));

            // Optimistically update UI
            setCategories(updatedCategories);

            // Persist changes to backend
            try {
                // Send only the moved category's new sortOrder (or all updates)
                // Simpler: update all categories in the background
                await Promise.all(
                    updatedCategories.map((cat) =>
                        ApiCall(`/api/v1/crm/categories/${cat.id}`, 'PUT', {
                            name: cat.name,
                            description: cat.description,
                            sortOrder: cat.sortOrder,
                            status: cat.status,
                        }, null, true)
                    )
                );
            } catch (error) {
                console.error('Error updating sort order:', error);
                alert('Tartibni saqlashda xatolik yuz berdi. Sahifani yangilang.');
                fetchCategories(); // revert to server state
            }
        }
    };

    const handleNavigate = (categoryId) => {
        navigate(`/crm/categories/${categoryId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex items-center justify-center h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <LoadingSpinner />
                        <p className="text-gray-600">Boshqaruv paneli yuklanmoqda...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="ml-64 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Kategoriyalar</h1>
                        <p className="text-gray-500 text-sm">CRM kategoriyalarini boshqaring</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-200 flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Yangi kategoriya
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Table with DnD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nomi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tavsif
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Holati
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tartib
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amallar
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={categories.map((c) => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {categories.map((category) => (
                                        <SortableCategoryRow
                                            key={category.id}
                                            category={category}
                                            onEdit={openEditModal}
                                            onDelete={handleDelete}
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Hech qanday kategoriya topilmadi.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal (same as before) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {modalMode === 'create' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tavsif
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tartib raqami
                                </label>
                                <input
                                    type="number"
                                    id="sortOrder"
                                    name="sortOrder"
                                    min="1"
                                    value={formData.sortOrder}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Kategoriyalarni tartiblash uchun ishlatiladi.</p>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="status"
                                    name="status"
                                    checked={formData.status}
                                    onChange={handleFormChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
                                    Faol
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrmCategory;