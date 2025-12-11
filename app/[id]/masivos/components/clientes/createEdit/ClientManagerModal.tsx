"use client";
import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

// Tipos
export interface Category {
    id: number;
    name: string;
}

export interface Client {
    id: number;
    name: string;
    phone: string;
    categoryIds: number[];
    categoryNames: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function ClientManagerModal({ isOpen, onClose, userId }: Props) {
    const [clients, setClients] = useState<Client[]>([]);
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [viewMode, setViewMode] = useState<'LIST' | 'IMPORT'>('LIST');

    // --- ESTADOS DE FILTRO Y BUSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

    // --- ESTADOS DE LAZY LOAD ---
    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Formulario Individual
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        categoryIds: [] as number[]
    });

    // Formulario CSV
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvPreview, setCsvPreview] = useState<any[]>([]);
    const [csvCategoryIds, setCsvCategoryIds] = useState<number[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- CARGAR DATOS INICIALES ---
    useEffect(() => {
        if (isOpen && userId) {
            loadData();
        } else {
            resetForm();
            setCsvPreview([]);
            setCsvCategoryIds([]);
            setSearchTerm('');
            setSelectedCategoryFilter(null);
            setViewMode('LIST');
            setVisibleCount(20);
        }
    }, [isOpen, userId]);

    // --- RESETEAR LAZY LOAD AL FILTRAR ---
    // Cada vez que el usuario busca o cambia de categoría, volvemos a mostrar solo los primeros 20
    useEffect(() => {
        setVisibleCount(20);
        // Scroll al top de la tabla (opcional, requiere ref a la tabla)
    }, [searchTerm, selectedCategoryFilter]);

    // --- INTERSECTION OBSERVER (LAZY LOAD) ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, clients, searchTerm, selectedCategoryFilter]);


    const loadData = async () => {
        setIsLoading(true);
        try {
            const resCats = await fetch(`/api/${userId}/categories`);
            const catsData = await resCats.json();
            if (Array.isArray(catsData)) setAvailableCategories(catsData);

            const resClients = await fetch(`/api/${userId}/clients`);
            const clientsData = await resClients.json();
            if (Array.isArray(clientsData)) setClients(clientsData);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', categoryIds: [] });
        setEditingId(null);
    };

    const normalizePhone = (phone: string): string => {
        let clean = phone.replace(/[\s\-\+]/g, '');
        if (clean.length === 10) return `521${clean}`;
        if (clean.startsWith('52') && !clean.startsWith('521') && clean.length === 12) {
            return `521${clean.substring(2)}`;
        }
        return clean;
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCategoryToggle = (catId: number, isCsv = false) => {
        if (isCsv) {
            setCsvCategoryIds(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
        } else {
            setFormData(prev => ({
                ...prev,
                categoryIds: prev.categoryIds.includes(catId)
                    ? prev.categoryIds.filter(id => id !== catId)
                    : [...prev.categoryIds, catId]
            }));
        }
    };

    // --- LÓGICA DE FILTRADO COMBINADA ---
    const filteredClients = clients.filter(client => {
        // 1. Filtro por Texto
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.includes(searchTerm);

        // 2. Filtro por Categoría (Chips)
        const matchesCategory = selectedCategoryFilter === null ||
            client.categoryIds.includes(selectedCategoryFilter);

        return matchesSearch && matchesCategory;
    });

    // --- CLIENTES VISIBLES (Lazy Load) ---
    const visibleClients = filteredClients.slice(0, visibleCount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, phone: normalizePhone(formData.phone) };
        try {
            if (editingId) {
                const res = await fetch(`/api/clients/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData)
                });
                if (res.ok) loadData();
            } else {
                const res = await fetch(`/api/${userId}/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData)
                });
                if (res.ok) loadData();
            }
            resetForm();
        } catch (error) { console.error("Error:", error); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data.map((row: any) => ({
                    name: row.nombre || row.name || row.Nombre || 'Sin nombre',
                    phone: normalizePhone(row.telefono || row.phone || row.celular || row.cel || ''),
                })).filter((r: any) => r.phone.length >= 10);
                setCsvPreview(parsed);
            }
        });
    };

    const handleCsvSubmit = async () => {
        if (csvPreview.length === 0) return alert("No hay datos válidos");
        setIsImporting(true);
        try {
            const res = await fetch(`/api/${userId}/clients/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: csvPreview, categoryIds: csvCategoryIds })
            });
            if (res.ok) {
                setCsvPreview([]);
                setCsvCategoryIds([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setViewMode('LIST');
                loadData();
            }
        } catch (error) { console.error(error); } finally { setIsImporting(false); }
    };

    const handleEditClick = (client: Client) => {
        setFormData({ name: client.name, phone: client.phone, categoryIds: client.categoryIds });
        setEditingId(client.id);
        setViewMode('LIST');
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm('¿Eliminar cliente?')) {
            try {
                await fetch(`/api/clients/${id}`, { method: 'DELETE' });
                setClients(prev => prev.filter(c => c.id !== id));
            } catch (error) { console.error(error); }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white w-full max-w-[90vw] h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

                {/* --- HEADER --- */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <div className="flex items-center gap-6">
                        <h3 className="text-xl font-bold text-gray-900">Gestión de Clientes</h3>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setViewMode('LIST')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lista & Registro</button>
                            <button onClick={() => setViewMode('IMPORT')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'IMPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Importar CSV</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 min-h-0 w-full bg-gray-50/50">
                    {viewMode === 'LIST' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">

                            {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
                            <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar border-r border-gray-100 bg-white p-6">
                                <div className={`p-6 rounded-2xl border transition-all duration-300 ${editingId ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                        {editingId ? <span className="text-blue-600">✏️ Editando Cliente</span> : <span>➕ Nuevo Cliente</span>}
                                    </h4>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre Completo</label>
                                            <input type="text" name="name" required value={formData.name} onChange={handleTextChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Ej. Juan Pérez" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teléfono</label>
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handleTextChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Ej. 55 1234 5678" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">Asignar Categorías:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableCategories.map(cat => (
                                                    <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 select-none flex items-center gap-1.5 ${formData.categoryIds.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                                        <input type="checkbox" className="hidden" checked={formData.categoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} />
                                                        {formData.categoryIds.includes(cat.id) && <span>✓</span>} {cat.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            {editingId && <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">Cancelar</button>}
                                            <button type="submit" className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-black'}`}>{editingId ? 'Guardar Cambios' : 'Crear Cliente'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* --- COLUMNA DERECHA: TABLA --- */}
                            <div className="lg:col-span-8 h-full flex flex-col bg-gray-50/50 overflow-hidden">

                                {/* HEADER FILTROS (Buscador + Chips) */}
                                <div className="p-6 pb-2 shrink-0 space-y-4">

                                    {/* Buscador */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                            placeholder="Buscar cliente por nombre o teléfono..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Chips de Categoría (Scroll horizontal si hay muchas) */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                                        <button
                                            onClick={() => setSelectedCategoryFilter(null)}
                                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategoryFilter === null ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            Todas
                                        </button>
                                        {availableCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategoryFilter(cat.id === selectedCategoryFilter ? null : cat.id)}
                                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategoryFilter === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="text-xs text-gray-500 font-medium px-1 flex justify-between">
                                        <span>Resultados: {filteredClients.length}</span>
                                        <span>Mostrando: {visibleClients.length}</span>
                                    </div>
                                </div>

                                {/* TABLA CON SCROLL + LAZY LOAD */}
                                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50/90 backdrop-blur text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4">Cliente</th>
                                                    <th className="px-6 py-4">Categorías</th>
                                                    <th className="px-6 py-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {visibleClients.map((client) => (
                                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                                    {client.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{client.name}</div>
                                                                    <div className="text-xs text-gray-400 font-mono">{client.phone}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.categoryNames ? client.categoryNames.split(', ').map((catName, idx) => (
                                                                    <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200">{catName}</span>
                                                                )) : <span className="text-gray-300 text-xs italic">--</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleEditClick(client)} className="text-gray-400 hover:text-blue-600 p-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                                <button onClick={() => handleDeleteClick(client.id)} className="text-gray-400 hover:text-red-600 p-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* ELEMENTO CENTINELA PARA LAZY LOAD */}
                                                {visibleClients.length < filteredClients.length && (
                                                    <tr ref={observerTarget}>
                                                        <td colSpan={3} className="p-4 text-center">
                                                            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {!isLoading && filteredClients.length === 0 && (
                                                    <tr><td colSpan={3} className="p-12 text-center text-gray-400">No se encontraron clientes.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // VISTA IMPORTAR CSV (Sin cambios mayores, solo scroll)
                        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                            {/* ... (Código de importación CSV se mantiene igual) ... */}
                            {/* Para abreviar, el código de CSV es idéntico al anterior */}
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${csvPreview.length > 0 ? 'border-green-300 bg-green-50/30' : 'border-blue-300 bg-blue-50/30'}`}>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Sube tu archivo CSV</h4>
                                    <div className="relative inline-block mt-4">
                                        <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg pointer-events-none">Seleccionar Archivo</button>
                                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                                {csvPreview.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6 space-y-6">
                                        <p className="text-sm font-bold">Asignar categorías:</p>
                                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
                                            {availableCategories.map(cat => (
                                                <label key={cat.id} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${csvCategoryIds.includes(cat.id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
                                                    <input type="checkbox" className="hidden" checked={csvCategoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id, true)} />
                                                    {cat.name}
                                                </label>
                                            ))}
                                        </div>
                                        <button onClick={handleCsvSubmit} disabled={isImporting} className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-xl">{isImporting ? 'Procesando...' : 'Confirmar Importación'}</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}