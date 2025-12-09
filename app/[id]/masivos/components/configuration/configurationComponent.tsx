"use client";
import React, { useState } from 'react';
import ConfigModal from './ConfigModal';

export default function ConfigurationComponent({ id }: { id: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex items-center justify-center p-6">

            {/* --- TARJETA PRINCIPAL --- */}
            <div className="group relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

                {/* Fondo decorativo superior (Gradiente Rojo Twilio) */}
                <div className="h-32 bg-gradient-to-r from-red-600 to-rose-500"></div>

                {/* Contenido de la tarjeta */}
                <div className="px-8 pb-8">

                    {/* Ícono Flotante */}
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
                            <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                {/* Icono de Ajustes/API */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.175 1.059c.991.028 1.902.57 2.443 1.453l.937-.506a.999.999 0 011.162.22l.775.776c.32.32.428.79.284 1.207l-.442 1.272c.883.541 1.425 1.453 1.453 2.443l1.059.175c.542.09.94.56.94 1.11v1.093c0 .55-.398 1.02-.94 1.11l-1.06.176c-.027.99-.569 1.901-1.452 2.443l.442 1.272c.144.417.037.887-.284 1.207l-.775.776a.999.999 0 01-1.162.22l-.937-.507c-.541.882-1.452 1.424-2.443 1.452l-.175 1.059c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.176-1.059c-.99-.028-1.901-.57-2.443-1.453l-.936.506a.999.999 0 01-1.162-.22l-.776-.776a.999.999 0 01-.284-1.207l.442-1.272c-.882-.541-1.424-1.453-1.452-2.443l-1.059-.175a.999.999 0 01-.94-1.11V9.907c0-.55.398-1.02.94-1.11l1.06-.176c.027-.99.569-1.902 1.452-2.443L6.85 4.906c-.144-.417-.037-.887.284-1.207l.776-.776a.999.999 0 011.162-.22l.936.507c.541-.883 1.452-1.425 2.443-1.453l.175-1.06z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Textos */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Integración Twilio
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Conecta tu cuenta para habilitar el envío de mensajes. Necesitarás tu Account SID y Auth Token.
                        </p>
                    </div>

                    {/* Botón de Acción */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        Configurar Credenciales
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
            <ConfigModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={id}
            />
        </div>
    );
}