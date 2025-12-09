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

export default function CampaignManager({ userId }: { userId: string }) {
    // --- ESTADOS DE DATOS ---
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // --- ESTADOS DE SELECCIÓN ---
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [audienceType, setAudienceType] = useState<'CATEGORY' | 'CLIENT'>('CATEGORY');
    const [selectedIds, setSelectedIds] = useState<number[]>([]); // IDs de categorias o clientes seleccionados

    // --- ESTADOS DE UI ---
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Cargar todo al inicio
    useEffect(() => {
        const loadAll = async () => {
            setIsLoadingData(true);
            try {
                // 1. Cargar Templates
                const resTemp = await fetch(`/api/${userId}/templates`);
                if (resTemp.ok) setTemplates(await resTemp.json());

                // 2. Cargar Categorias
                const resCat = await fetch(`/api/${userId}/categories`);
                if (resCat.ok) setCategories(await resCat.json());

                // 3. Cargar Clientes (Solo nombres y ids para lista)
                const resCli = await fetch(`/api/${userId}/clients`);
                if (resCli.ok) setClients(await resCli.json());

            } catch (error) {
                console.error("Error cargando datos", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        if (userId) loadAll();
    }, [userId]);

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
                setSelectedIds([]); // Limpiar selección
            } else {
                throw new Error(data.message || "Error al enviar");
            }

        } catch (error: any) {
            setStatusMsg({ type: 'error', text: error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingData) return <div className="p-10 text-center">Cargando datos...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            <h1 className="text-3xl font-bold text-gray-800">Nueva Campaña</h1>

            {/* PASO 1: SELECCIONAR TEMPLATE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Selecciona el Mensaje (Template)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                    {templates.map(tpl => (
                        <div
                            key={tpl.sid}
                            onClick={() => setSelectedTemplate(tpl.sid)}
                            className={`cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md
                                ${selectedTemplate === tpl.sid
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'}
                            `}
                        >
                            <div className="font-bold text-gray-700 text-sm mb-1">{tpl.friendlyName}</div>
                            <div className="text-xs text-gray-500 line-clamp-3 italic">{tpl.body}</div>
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
                        className={`pb-2 px-4 font-medium transition ${audienceType === 'CATEGORY' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Por Categorías
                    </button>
                    <button
                        onClick={() => { setAudienceType('CLIENT'); setSelectedIds([]); }}
                        className={`pb-2 px-4 font-medium transition ${audienceType === 'CLIENT' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        Por Clientes
                    </button>
                </div>

                {/* Lista de Selección */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {audienceType === 'CATEGORY' ? (
                        // MODO CATEGORÍAS
                        categories.map(cat => (
                            <label key={cat.id} className={`flex items-center gap-3 p-3 border rounded cursor-pointer select-none ${selectedIds.includes(cat.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600"
                                    checked={selectedIds.includes(cat.id)}
                                    onChange={() => toggleSelection(cat.id)}
                                />
                                <span className="text-sm font-medium">{cat.name}</span>
                            </label>
                        ))
                    ) : (
                        // MODO CLIENTES
                        clients.map(cli => (
                            <label key={cli.id} className={`flex items-center gap-3 p-3 border rounded cursor-pointer select-none ${selectedIds.includes(cli.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600"
                                    checked={selectedIds.includes(cli.id)}
                                    onChange={() => toggleSelection(cli.id)}
                                />
                                <div className="text-sm">
                                    <div className="font-medium">{cli.name}</div>
                                    <div className="text-xs text-gray-400">{cli.phone}</div>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                {selectedIds.length === 0 && <p className="text-sm text-gray-400 mt-2 italic">Selecciona al menos una opción.</p>}
            </div>

            {/* PASO 3: ACCIÓN */}
            <div className="flex flex-col items-end gap-4">
                {statusMsg && (
                    <div className={`px-4 py-3 rounded-lg w-full text-center ${statusMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMsg.text}
                    </div>
                )}

                <button
                    onClick={handleSend}
                    disabled={isSending || !selectedTemplate || selectedIds.length === 0}
                    className={`
                        px-8 py-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                        ${isSending || !selectedTemplate || selectedIds.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 hover:scale-105'}
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