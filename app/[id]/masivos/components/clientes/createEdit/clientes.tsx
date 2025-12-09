"use client";
import { useState } from "react";
import ClientManagerModal from "./ClientManagerModal";

export default function ClientsComponent({ id }: { id: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex items-center justify-center p-6">

            {/* --- TARJETA PRINCIPAL --- */}
            <div className="group relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

                {/* Fondo decorativo superior (Gradiente Azul) */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

                {/* Contenido de la tarjeta */}
                <div className="px-8 pb-8">

                    {/* Ícono Flotante */}
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
                            <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                {/* Icono de Usuarios SVG */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Textos */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Directorio de Clientes
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Gestiona tu base de datos de contactos. Puedes agregar uno a uno o importar listas masivas desde Excel/CSV.
                        </p>
                    </div>

                    {/* Botón de Acción */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                        </svg>
                        Gestionar Clientes
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
            <ClientManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={id}
            />
        </div>
    );
}