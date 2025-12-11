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

    // Buscador
    const [searchTerm, setSearchTerm] = useState('');

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
            setSearchTerm(''); // Resetear busqueda
            setViewMode('LIST');
        }
    }, [isOpen, userId]);

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

    // --- LÓGICA DEL PREFIJO 521 ---
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

    // --- FILTRADO DE CLIENTES ---
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    // --- SUBMIT INDIVIDUAL ---
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

    // --- LÓGICA CSV ---
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
            const data = await res.json();
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
            {/* Modal Container: Más ancho (max-w-[90vw]) y con altura fija (h-[90vh]) */}
            <div className="bg-white w-full max-w-[90vw] h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

                {/* --- HEADER (Fijo) --- */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <div className="flex items-center gap-6">
                        <h3 className="text-xl font-bold text-gray-900">Gestión de Clientes</h3>

                        {/* Selector de Vistas */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Lista & Registro
                            </button>
                            <button
                                onClick={() => setViewMode('IMPORT')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'IMPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Importar CSV
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* --- BODY (Contenedor Flexible) --- */}
                <div className="flex-1 overflow-hidden bg-gray-50/50">
                    {viewMode === 'LIST' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">

                            {/* --- ZONA IZQUIERDA: FORMULARIO (Scroll Independiente) --- */}
                            <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar border-r border-gray-100 bg-white p-6">
                                <div className={`p-6 rounded-2xl border transition-all duration-300 ${editingId ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                        {editingId ? <span className="text-blue-600">✏️ Editando Cliente</span> : <span>➕ Nuevo Cliente</span>}
                                    </h4>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre Completo</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleTextChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                                placeholder="Ej. Juan Pérez"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teléfono</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleTextChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                                placeholder="Ej. 55 1234 5678"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Se agregará '521' si son 10 dígitos.
                                            </p>
                                        </div>

                                        {/* Chips de Categorías */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">Asignar Categorías:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {availableCategories.length === 0 && <span className="text-xs text-gray-400 italic">Sin categorías creadas.</span>}
                                                {availableCategories.map(cat => (
                                                    <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 select-none flex items-center gap-1.5
                                                        ${formData.categoryIds.includes(cat.id)
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <input type="checkbox" className="hidden" checked={formData.categoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} />
                                                        {formData.categoryIds.includes(cat.id) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                        {cat.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            {editingId && (
                                                <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                                    Cancelar
                                                </button>
                                            )}
                                            <button type="submit" className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-black'}`}>
                                                {editingId ? 'Guardar Cambios' : 'Crear Cliente'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* --- ZONA DERECHA: TABLA (Scroll Independiente) --- */}
                            <div className="lg:col-span-8 h-full flex flex-col bg-gray-50/50">

                                {/* BUSCADOR (Fijo arriba de la tabla) */}
                                <div className="p-6 pb-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm shadow-sm"
                                            placeholder="Buscar cliente por nombre o teléfono..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500 font-medium px-1">
                                        Mostrando {filteredClients.length} de {clients.length} clientes
                                    </div>
                                </div>

                                {/* Contenedor Tabla con Scroll */}
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
                                                {isLoading && clients.length === 0 && (
                                                    <tr><td colSpan={3} className="p-8 text-center text-gray-400 animate-pulse">Cargando directorio...</td></tr>
                                                )}

                                                {filteredClients.map((client) => (
                                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-white shadow-sm shrink-0">
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
                                                                    <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200">
                                                                        {catName}
                                                                    </span>
                                                                )) : <span className="text-gray-300 text-xs italic">--</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleEditClick(client)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(client.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {!isLoading && filteredClients.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="p-12 text-center text-gray-400">
                                                            {searchTerm ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-2xl mb-2">🔍</span>
                                                                    No se encontraron clientes con "{searchTerm}"
                                                                </div>
                                                            ) : (
                                                                "No hay clientes registrados."
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- VISTA IMPORTAR CSV (Scroll Propio) ---
                        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
                                <div className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${csvPreview.length > 0 ? 'border-green-300 bg-green-50/30' : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50'}`}>
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Sube tu archivo CSV</h4>
                                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">El archivo debe contener columnas como "nombre" y "telefono". Nosotros detectaremos y limpiaremos los datos automáticamente.</p>

                                    <div className="relative inline-block">
                                        <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition active:scale-95 pointer-events-none">
                                            Seleccionar Archivo
                                        </button>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {csvPreview.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6 space-y-6">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">1</span>
                                                Asignar categorías a este grupo:
                                            </p>
                                            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                {availableCategories.map(cat => (
                                                    <label key={cat.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 select-none flex items-center gap-1.5
                                                        ${csvCategoryIds.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                        <input type="checkbox" className="hidden" checked={csvCategoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id, true)} />
                                                        {csvCategoryIds.includes(cat.id) && <span>✓</span>} {cat.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                                                    Vista Previa
                                                </p>
                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">Total: {csvPreview.length} contactos</span>
                                            </div>
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                                        <tr><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Teléfono</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {csvPreview.slice(0, 5).map((row, i) => (
                                                            <tr key={i} className="bg-white"><td className="px-4 py-2">{row.name}</td><td className="px-4 py-2 font-mono text-blue-600">{row.phone}</td></tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p className="text-xs text-center text-gray-400 mt-2">Mostrando primeros 5 registros</p>
                                        </div>

                                        <button onClick={handleCsvSubmit} disabled={isImporting} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 ${isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                            {isImporting ? 'Procesando...' : `Confirmar Importación`}
                                        </button>
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