"use client";
import React, { useState, useEffect } from 'react';

export interface Category {
    id: number;
    name: string;
    userId: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function CategoryManagerModal({ isOpen, onClose, userId }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);

    // Estado del Formulario
    const [formData, setFormData] = useState({ name: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cargar datos
    useEffect(() => {
        if (isOpen && userId) {
            setIsLoading(true);
            fetch(`/api/${userId}/categories`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setCategories(data);
                })
                .catch(err => console.error("Error cargando categorías:", err))
                .finally(() => setIsLoading(false));
        }
        if (!isOpen) resetForm();
    }, [isOpen, userId]);

    const resetForm = () => {
        setFormData({ name: '' });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            if (editingId) {
                // --- EDITAR ---
                const res = await fetch(`/api/categories/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formData.name })
                });

                if (res.ok) {
                    setCategories(prev => prev.map(cat =>
                        cat.id === editingId ? { ...cat, name: formData.name } : cat
                    ));
                }
            } else {
                // --- CREAR ---
                const res = await fetch(`/api/${userId}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formData.name })
                });

                if (res.ok) {
                    const newCat = await res.json();
                    setCategories(prev => [newCat, ...prev]);
                }
            }
            resetForm();
        } catch (error) {
            console.error("Error guardando:", error);
        }
    };

    const handleEditClick = (category: Category) => {
        setFormData({ name: category.name });
        setEditingId(category.id);
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                setCategories(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error eliminando:", error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
            {/* Modal Container */}
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">

                {/* --- HEADER --- */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Administrar Categorías</h3>
                        <p className="text-sm text-gray-400 mt-1">Crea etiquetas para organizar a tus clientes.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="p-8 overflow-y-auto custom-scrollbar">

                    {/* 1. TARJETA DE FORMULARIO */}
                    <div className={`p-6 rounded-2xl mb-8 border transition-all duration-300 
                        ${editingId
                            ? 'bg-indigo-50 border-indigo-200 shadow-inner'
                            : 'bg-white border-dashed border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`p-1.5 rounded-lg ${editingId ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                {editingId ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                )}
                            </span>
                            <h4 className={`text-sm font-bold uppercase tracking-wider ${editingId ? 'text-indigo-700' : 'text-gray-500'}`}>
                                {editingId ? 'Editando Categoría' : 'Agregar Nueva Categoría'}
                            </h4>
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                            <div className="flex-grow relative">
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow shadow-sm text-gray-700 placeholder-gray-400"
                                    placeholder="Ej. Clientes VIP, Pendientes..."
                                />
                            </div>
                            <button
                                type="submit"
                                className={`px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2
                                    ${editingId
                                        ? 'bg-indigo-600 hover:bg-indigo-700'
                                        : 'bg-gray-900 hover:bg-black'
                                    }`}
                            >
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                        </form>
                    </div>

                    {/* 2. LISTA DE CATEGORÍAS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lista de Categorías</span>
                            <span className="text-xs font-medium text-gray-400">{categories.length} registros</span>
                        </div>

                        {isLoading && (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>)}
                            </div>
                        )}

                        <div className="grid gap-3">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{cat.name}</p>
                                            <p className="text-xs text-gray-400 font-mono">ID: {cat.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(cat)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(cat.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!isLoading && categories.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium">No hay categorías registradas</p>
                                <p className="text-gray-400 text-sm">Crea una nueva arriba para empezar</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}