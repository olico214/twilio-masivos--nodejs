"use client";
import React, { useState, useEffect } from 'react';

interface Template {
    sid: string;
    friendlyName: string;
    body: string;
}

interface Category {
    id: number;
    name: string;
}

interface Client {
    id: number;
    name: string;
    phone: string;
}

// --- ICONOS SVG SIMPLES (Para no depender de librerías externas) ---
const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform duration-700 ${spinning ? 'animate-spin' : ''}`}
    >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

export default function CampaignManager({ userId }: { userId: string }) {
    // --- ESTADOS DE DATOS ---
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // --- ESTADOS DE SELECCIÓN ---
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [audienceType, setAudienceType] = useState<'CATEGORY' | 'CLIENT'>('CATEGORY');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // --- ESTADOS DE UI ---
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Cargar todo al inicio
    useEffect(() => {
        if (userId) loadAll();
    }, [userId]);

    const loadAll = async () => {
        setIsLoadingData(true);
        try {
            const resTemp = await fetch(`/api/${userId}/templates`);
            if (resTemp.ok) setTemplates(await resTemp.json());

            const resCat = await fetch(`/api/${userId}/categories`);
            if (resCat.ok) setCategories(await resCat.json());

            const resCli = await fetch(`/api/${userId}/clients`);
            if (resCli.ok) setClients(await resCli.json());

        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // --- BORRAR PROYECTO (TEMPLATE) ---
    const handleDeleteTemplate = async (sid: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que el click seleccione la tarjeta
        if (!confirm("¿Estás seguro de que deseas eliminar este proyecto/template?")) return;

        try {
            // Asumiendo endpoint DELETE. Ajusta la URL según tu backend real.
            const res = await fetch(`/api/${userId}/templates`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateSid: sid })
            });

            if (res.ok) {
                // Actualizar estado local eliminando el item
                setTemplates(prev => prev.filter(t => t.sid !== sid));
                // Si el eliminado estaba seleccionado, deseleccionar
                if (selectedTemplate === sid) setSelectedTemplate(null);
                setStatusMsg({ type: 'success', text: 'Proyecto eliminado correctamente.' });
            } else {
                throw new Error("No se pudo eliminar");
            }
        } catch (error) {
            alert("Error al eliminar el proyecto");
        }
    };

    // Manejar Checkboxes
    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // --- ENVIAR CAMPAÑA ---
    const handleSend = async () => {
        if (!selectedTemplate) return alert("Selecciona un template");
        if (selectedIds.length === 0) return alert("Selecciona al menos un destinatario");

        setIsSending(true);
        setStatusMsg(null);

        try {
            const res = await fetch(`/api/${userId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateSid: selectedTemplate,
                    audienceType: audienceType,
                    audienceIds: selectedIds
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatusMsg({
                    type: 'success',
                    text: `¡Enviado! Éxitos: ${data.details.sent}, Fallos: ${data.details.failed}`
                });
                setSelectedIds([]);
            } else {
                throw new Error(data.message || "Error al enviar");
            }

        } catch (error: any) {
            setStatusMsg({ type: 'error', text: error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingData && templates.length === 0) return <div className="p-10 text-center animate-pulse">Cargando dashboard...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* CABECERA */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4'>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Nueva Campaña</h1>
                    <p className="text-gray-500 text-sm">Gestiona tus proyectos y audiencias</p>
                </div>

                {/* BOTÓN ACTUALIZAR ESTILIZADO */}
                <button
                    onClick={loadAll}
                    disabled={isLoadingData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-70"
                >
                    <RefreshIcon spinning={isLoadingData} />
                    <span>{isLoadingData ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
            </div>

            {/* PASO 1: SELECCIONAR TEMPLATE (PROYECTOS) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Selecciona el Proyecto (Template)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                    {templates.length === 0 && !isLoadingData && (
                        <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                            No hay proyectos disponibles.
                        </div>
                    )}

                    {templates.map(tpl => (
                        <div
                            key={tpl.sid}
                            onClick={() => setSelectedTemplate(tpl.sid)}
                            className={`group relative cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md
                                ${selectedTemplate === tpl.sid
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300 bg-white'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-gray-700 text-sm pr-6">{tpl.friendlyName}</div>

                                {/* BOTÓN DE BORRAR (SOLO APARECE EN HOVER O SI ESTÁ SELECCIONADO) */}
                                <button
                                    onClick={(e) => handleDeleteTemplate(tpl.sid, e)}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                    title="Borrar proyecto"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-3 italic bg-gray-50 p-2 rounded border border-gray-100">
                                "{tpl.body}"
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PASO 2: SELECCIONAR AUDIENCIA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Selecciona Destinatarios
                </h2>

                {/* Tabs */}
                <div className="flex gap-4 mb-4 border-b">
                    <button
                        onClick={() => { setAudienceType('CATEGORY'); setSelectedIds([]); }}
                        className={`pb-2 px-4 font-medium transition ${audienceType === 'CATEGORY' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Por Categorías
                    </button>
                    <button
                        onClick={() => { setAudienceType('CLIENT'); setSelectedIds([]); }}
                        className={`pb-2 px-4 font-medium transition ${audienceType === 'CLIENT' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Por Clientes
                    </button>
                </div>

                {/* Lista de Selección */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                    {audienceType === 'CATEGORY' ? (
                        categories.map(cat => (
                            <label key={cat.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer select-none transition-colors ${selectedIds.includes(cat.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={selectedIds.includes(cat.id)}
                                    onChange={() => toggleSelection(cat.id)}
                                />
                                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                            </label>
                        ))
                    ) : (
                        clients.map(cli => (
                            <label key={cli.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer select-none transition-colors ${selectedIds.includes(cli.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={selectedIds.includes(cli.id)}
                                    onChange={() => toggleSelection(cli.id)}
                                />
                                <div className="text-sm overflow-hidden">
                                    <div className="font-medium text-gray-700 truncate">{cli.name}</div>
                                    <div className="text-xs text-gray-400">{cli.phone}</div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                {selectedIds.length === 0 && <p className="text-sm text-gray-400 mt-3 italic text-center">Selecciona al menos una opción para continuar.</p>}
            </div>

            {/* PASO 3: ACCIÓN */}
            <div className="flex flex-col items-end gap-4 pb-10">
                {statusMsg && (
                    <div className={`px-4 py-3 rounded-lg w-full text-center font-medium animate-fadeIn ${statusMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {statusMsg.text}
                    </div>
                )}

                <button
                    onClick={handleSend}
                    disabled={isSending || !selectedTemplate || selectedIds.length === 0}
                    className={`
                        px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 text-lg
                        ${isSending || !selectedTemplate || selectedIds.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02]'}
                    `}
                >
                    {isSending ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        <>
                            🚀 Enviar Campaña
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}