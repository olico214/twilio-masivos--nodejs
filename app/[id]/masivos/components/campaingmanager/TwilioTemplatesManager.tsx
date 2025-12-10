"use client";
import React, { useState, useEffect } from 'react';

interface TwilioTemplate {
    sid: string;
    friendlyName: string;
    language: string;
    body: string;
    status: string; // "approved" | "pending" | "rejected"
}

export default function TwilioTemplatesManager({ userId }: { userId: string }) {
    const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({
        name: '',
        category: 'UTILITY', // Default
        language: 'es',
        text: ''
    });

    // Cargar templates al iniciar
    useEffect(() => {
        if (userId) fetchTemplates();
    }, [userId]);

    const fetchTemplates = async () => {
        try {
            // Reutilizamos tu API de lectura existente o creamos una nueva que devuelva también el status
            const res = await fetch(`/api/${userId}/templates`);
            if (res.ok) {
                // Asumimos que tu API GET devuelve los templates de Twilio
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`/api/${userId}/templates/twilio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("¡Plantilla enviada a revisión!");
                setIsModalOpen(false);
                setFormData({ name: '', category: 'MARKETING', language: 'es', text: '' });
                fetchTemplates(); // Recargar para ver la nueva (aunque tardará en aprobarse)
            } else {
                const err = await res.json();
                alert("Error: " + err.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full">

            {/* --- TARJETA PRINCIPAL (ESTILO WHATSAPP) --- */}
            <div className="group relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-32 bg-gradient-to-r from-green-500 to-teal-600"></div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
                            <div className="w-full h-full bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                {/* Icono WhatsApp */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.029.662 1.954 1.229 3.299 1.229 3.182 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.768-5.766-5.768zm4.95 8.138c-.191.536-1.092.986-1.516 1.022-.249.02-.577.108-2.012-.486-1.742-.719-2.872-2.508-2.961-2.624-.09-.116-.709-.94-.709-1.793s.448-1.273.607-1.446c.159-.173.418-.219.557-.219.139 0 .278.001.398.02.119.019.278-.046.437.337.159.384.557 1.353.607 1.452.05.1.08.217.01.346-.07.129-.109.208-.219.346-.109.138-.228.307-.328.411-.109.115-.224.24-.095.462.129.221.572.946 1.233 1.535.856.762 1.576.998 1.796 1.107.219.109.347.09.476-.05.129-.139.557-.645.707-.866.149-.221.298-.184.498-.109.199.075 1.262.594 1.481.703.219.109.367.164.417.254.05.09.05.524-.14 1.06z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Plantillas WhatsApp</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Crea plantillas oficiales que se envían a Meta para aprobación. Necesarias para iniciar conversaciones (Marketing/Utilidad).
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span>✨</span> Nueva Plantilla Oficial
                    </button>
                </div>
            </div>

            {/* --- MODAL CREACIÓN --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">

                        {/* Header */}
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Crear Plantilla WhatsApp</h3>
                                <p className="text-xs text-gray-500">Se enviará a revisión a Meta inmediatamente.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                        </div>

                        {/* Form */}
                        <div className="p-8 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre (Interno)</label>
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                            placeholder="Ej. promo_verano_2024"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Solo letras minúsculas y guiones bajos.</p>
                                    </div>

                                    {/* Idioma */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Idioma</label>
                                        <select
                                            value={formData.language}
                                            onChange={e => setFormData({ ...formData, language: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                                        >
                                            <option value="es">Español</option>
                                            <option value="en">Inglés</option>

                                        </select>
                                    </div>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoría (Meta)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['UTILITY'].map(cat => (
                                            <label key={cat} className={`cursor-pointer text-center px-2 py-2 rounded-lg text-xs font-bold border transition-all ${formData.category === cat ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                <input type="radio" className="hidden" name="category" value={cat} checked={formData.category === cat} onChange={() => setFormData({ ...formData, category: cat })} />
                                                {cat}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Cuerpo */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                                    <div className="relative">
                                        <textarea
                                            required rows={4}
                                            value={formData.text}
                                            onChange={e => setFormData({ ...formData, text: e.target.value })}
                                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none font-sans"
                                            placeholder="Hola {{1}}, te invitamos a unirte nuevamente con nosotros."
                                        />
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, text: prev.text + ' {{1}}' }))} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold text-gray-600 border border-gray-300">
                                                + Variable
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Usa {"{{1}}"} para insertar el nombre.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isLoading ? 'Enviando a Meta...' : 'Crear y Solicitar Aprobación'}
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}