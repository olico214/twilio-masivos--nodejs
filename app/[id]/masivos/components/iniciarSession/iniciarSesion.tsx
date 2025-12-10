"use client";
import React, { useState } from 'react';

interface Props {
    id?: string;
    setValidateSession: (value: boolean) => void;
}

export default function IniciarSessionComponent({ id, setValidateSession }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        usuario: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrorMsg(null); // Limpiar error al escribir
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        const dataToSend = {
            id: id,
            email: formData.usuario,
            password: formData.password
        };

        try {
            const res = await fetch('/api/users/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            const result = await res.json();

            if (res.status !== 200) {
                setErrorMsg(result.message || 'Credenciales incorrectas');
            } else {
                setIsOpen(false);
                setValidateSession(true);
            }
        } catch (error) {
            setErrorMsg('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* --- TARJETA DE BLOQUEO (TRIGGER) --- */}
            <div className="group relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">

                {/* Fondo Superior (Gradiente Oscuro/Seguridad) */}
                <div className="h-32 bg-gradient-to-r from-gray-800 to-slate-900 flex items-center justify-center">
                    <div className="text-white/20">
                        <svg className="w-64 h-64 absolute -top-10 -right-10 opacity-10 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" /></svg>
                    </div>
                </div>

                <div className="px-8 pb-8">
                    {/* Ícono Flotante de Candado */}
                    <div className="relative -mt-12 mb-6 flex justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
                            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Requerido</h2>
                        <p className="text-gray-500 text-sm">
                            Esta sesión está protegida. Por favor, ingresa tus credenciales para administrar la cuenta.
                        </p>

                        {/* Badge del ID */}
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                            <span className="text-xs font-mono text-gray-600">ID: {id || 'Desconocido'}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <span>🔐</span> Iniciar Sesión
                    </button>
                </div>
            </div>

            {/* --- MODAL DE LOGIN --- */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 transition-all duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

                        {/* Header Modal */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Autenticación</h3>
                                <p className="text-xs text-gray-400">Ingresa tus datos de acceso</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Usuario / Email</label>
                                    <input
                                        type="text"
                                        name="usuario"
                                        required
                                        value={formData.usuario}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all placeholder-gray-400"
                                        placeholder="usuario@ejemplo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all placeholder-gray-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Mensaje de Error */}
                            {errorMsg && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-shake">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-medium text-red-600">{errorMsg}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2
                                    ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Validando...
                                    </>
                                ) : (
                                    'Acceder al Panel'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}