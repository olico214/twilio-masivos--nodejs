"use client";
import React, { useEffect, useState } from 'react';

interface Template {
    sid: string;
    friendlyName: string;
    language: string;
    body: string;
    types: string[];
}

export default function TemplatesGallery({ userId }: { userId: string }) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) fetchTemplates();
    }, [userId]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/${userId}/templates`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al cargar templates');
            }

            setTemplates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 w-full max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Mis Plantillas de WhatsApp</h2>
                <button
                    onClick={fetchTemplates}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                    ↻ Actualizar
                </button>
            </div>

            {/* Estado de Carga */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            )}

            {/* Estado de Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Lista vacía */}
            {!isLoading && !error && templates.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No se encontraron plantillas en tu cuenta de Twilio.</p>
                    <p className="text-sm text-gray-400 mt-2">Asegúrate de haberlas creado en el "Content Editor" de Twilio.</p>
                </div>
            )}

            {/* Grid de Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!isLoading && templates.map((tpl) => (
                    <div key={tpl.sid} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">

                        {/* Cabecera de la tarjeta */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-700 truncate" title={tpl.friendlyName}>
                                {tpl.friendlyName}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-200 px-2 py-1 rounded">
                                {tpl.language}
                            </span>
                        </div>

                        {/* Cuerpo del mensaje (Preview) */}
                        <div className="p-4 flex-grow">
                            <div className="bg-green-50 p-3 rounded-lg rounded-tl-none text-sm text-gray-800 relative">
                                <p className="whitespace-pre-wrap font-sans">{tpl.body}</p>
                                {/* Triangulito de mensaje tipo WhatsApp */}
                                <div className="absolute top-0 left-[-8px] w-0 h-0 
                                    border-t-[10px] border-t-green-50
                                    border-l-[10px] border-l-transparent">
                                </div>
                            </div>
                        </div>

                        {/* Footer con detalles técnicos */}
                        <div className="px-4 py-3 bg-white border-t border-gray-50 text-xs text-gray-400 flex justify-between">
                            <span className="font-mono">{tpl.sid}...</span>
                            <span className="capitalize">{tpl.types.join(', ').replace('twilio/', '')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}