"use client";
import React, { useState } from 'react';
import CategoryManagerModal from './CategoryModal';

export default function CategoriesComponent({ id }: { id: string }) {
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    return (
        <div className="flex items-center justify-center p-6">

            {/* --- TARJETA PRINCIPAL --- */}
            <div className="group relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

                {/* Fondo decorativo superior (Gradiente) */}
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>

                {/* Contenido de la tarjeta */}
                <div className="px-8 pb-8">

                    {/* Ícono Flotante */}
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
                            <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                {/* Icono de Folder SVG */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Textos */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Categorías
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Organiza tus contactos en grupos (Ej: Ropa, VIP, Pendientes) para enviar campañas segmentadas.
                        </p>
                    </div>

                    {/* Botón de Acción */}
                    <button
                        onClick={() => setIsManagerOpen(true)}
                        className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Administrar Categorías
                    </button>

                    {/* Info pequeña del ID */}
                    <div className="mt-4 text-center">
                        <span className="inline-block px-3 py-1 bg-gray-50 text-gray-400 text-xs font-mono rounded-full border border-gray-100">
                            ID: {id}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal Lógico */}
            <CategoryManagerModal
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                userId={id}
            />
        </div>
    );
}