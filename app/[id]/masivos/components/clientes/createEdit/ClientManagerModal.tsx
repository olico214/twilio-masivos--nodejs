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

    // 1. CORRECCIÓN DE TIPO: Usamos HTMLTableRowElement porque se aplica a un <tr>
    const observerTarget = useRef<HTMLTableRowElement>(null);

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

    useEffect(() => {
        setVisibleCount(20);
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

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.includes(searchTerm);
        const matchesCategory = selectedCategoryFilter === null ||
            client.categoryIds.includes(selectedCategoryFilter);
        return matchesSearch && matchesCategory;
    });

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
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

                {/* --- HEADER --- */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Gestión de Clientes</h3>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setViewMode('LIST')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lista & Registro</button>
                            <button onClick={() => setViewMode('IMPORT')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${viewMode === 'IMPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Importar CSV</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 min-h-0 w-full bg-gray-50/50 flex flex-col">
                    {viewMode === 'LIST' ? (
                        // 2. CORRECCIÓN DE LAYOUT: Usamos flex-col para mobile y flex-row para desktop
                        // Esto asegura que la tabla siempre ocupe el espacio restante (flex-1)
                        <div className="flex flex-col lg:flex-row h-full overflow-hidden">

                            {/* --- ZONA 1: FORMULARIO --- */}
                            {/* En mobile, tiene max-height para no comerse toda la pantalla. En desktop es sidebar */}
                            <div className="shrink-0 max-h-[40vh] lg:max-h-full lg:w-1/3 lg:h-full overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-gray-100 bg-white p-5">
                                <div className={`p-5 rounded-2xl border transition-all duration-300 ${editingId ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                        {editingId ? <span className="text-blue-600">✏️ Editando</span> : <span>➕ Nuevo Cliente</span>}
                                    </h4>
                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">NOMBRE</label>
                                            <input type="text" name="name" required value={formData.name} onChange={handleTextChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Juan Pérez" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">TELÉFONO</label>
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handleTextChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. 55 1234 5678" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 mb-1">CATEGORÍAS</label>
                                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                                {availableCategories.map(cat => (
                                                    <label key={cat.id} className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold border select-none ${formData.categoryIds.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                        <input type="checkbox" className="hidden" checked={formData.categoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} />
                                                        {cat.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            {editingId && <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50">Cancelar</button>}
                                            <button type="submit" className={`flex-1 py-2 rounded-lg text-xs font-bold text-white shadow-md ${editingId ? 'bg-blue-600' : 'bg-gray-900'}`}>{editingId ? 'Guardar' : 'Crear'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* --- ZONA 2: TABLA Y BÚSQUEDA --- */}
                            {/* flex-1 min-h-0 es CRUCIAL para que el scroll funcione dentro de este contenedor */}
                            <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50">

                                {/* Header de filtros (Fijo) */}
                                <div className="p-4 shrink-0 space-y-3 bg-white border-b border-gray-100">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar-horizontal">
                                        <button onClick={() => setSelectedCategoryFilter(null)} className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${selectedCategoryFilter === null ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>Todas</button>
                                        {availableCategories.map(cat => (
                                            <button key={cat.id} onClick={() => setSelectedCategoryFilter(cat.id === selectedCategoryFilter ? null : cat.id)} className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${selectedCategoryFilter === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex justify-between px-1">
                                        <span>Total: {filteredClients.length}</span>
                                        <span>Visibles: {visibleClients.length}</span>
                                    </div>
                                </div>

                                {/* Tabla Scrollable */}
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3">Cliente</th>
                                                    <th className="px-4 py-3 hidden sm:table-cell">Categorías</th>
                                                    <th className="px-4 py-3 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {visibleClients.map((client) => (
                                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                    {client.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900 text-xs sm:text-sm">{client.name}</div>
                                                                    <div className="text-[10px] text-gray-400 font-mono">{client.phone}</div>
                                                                    {/* Mostrar categorías en mobile debajo del nombre */}
                                                                    <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                                                                        {client.categoryNames?.split(', ').slice(0, 2).map((cat, i) => (
                                                                            <span key={i} className="bg-gray-100 text-[9px] px-1 rounded border">{cat}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.categoryNames ? client.categoryNames.split(', ').map((catName, idx) => (
                                                                    <span key={idx} className="bg-gray-100 text-gray-600 text-[9px] font-semibold px-2 py-1 rounded border border-gray-200">{catName}</span>
                                                                )) : <span className="text-gray-300 text-[10px]">--</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => handleEditClick(client)} className="text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 rounded-md"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                                <button onClick={() => handleDeleteClick(client.id)} className="text-gray-400 hover:text-red-600 p-1.5 bg-gray-50 rounded-md"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* ELEMENTO CENTINELA CORREGIDO */}
                                                {visibleClients.length < filteredClients.length && (
                                                    <tr ref={observerTarget}>
                                                        <td colSpan={3} className="p-4 text-center">
                                                            <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {!isLoading && filteredClients.length === 0 && (
                                                    <tr><td colSpan={3} className="p-8 text-center text-xs text-gray-400">Sin resultados.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // VISTA IMPORTAR CSV (Con ajustes de scroll)
                        <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${csvPreview.length > 0 ? 'border-green-300 bg-green-50/30' : 'border-blue-300 bg-blue-50/30'}`}>
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 text-blue-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 mb-2">Importar CSV</h4>
                                    <div className="relative inline-block">
                                        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-lg pointer-events-none">Seleccionar Archivo</button>
                                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                                {csvPreview.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-5 space-y-4">
                                        <p className="text-xs font-bold uppercase text-gray-500">Categorías para este lote:</p>
                                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                                            {availableCategories.map(cat => (
                                                <label key={cat.id} className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${csvCategoryIds.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                    <input type="checkbox" className="hidden" checked={csvCategoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id, true)} />
                                                    {cat.name}
                                                </label>
                                            ))}
                                        </div>
                                        <button onClick={handleCsvSubmit} disabled={isImporting} className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-md text-sm">{isImporting ? 'Procesando...' : `Importar ${csvPreview.length} Clientes`}</button>
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