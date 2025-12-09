import React, { useState } from 'react';

interface Props {
    id?: string;
    setValidateSession: (value: boolean) => void;
}

export default function IniciarSessionComponent({ id, setValidateSession }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        usuario: '',
        password: ''
    });

    // Manejar cambios en los inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const dataToSend = {
            id: id,
            email: formData.usuario,
            password: formData.password
        };

        console.log('Enviando datos al backend:', dataToSend);

        const res = await fetch('/api/users/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        const result = await res.json();
        console.log('Respuesta del backend:', result);

        if (res.status !== 200) {
            alert(result.message || 'Error en la autenticación');
            return;
        }
        setIsOpen(false);
        // 2. Avisamos al padre que la sesión es válida para que cambie de vista
        setValidateSession(true);
    };

    return (
        <>
            {/* Botón disparador */}
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Iniciar Sesión
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">

                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Acceder a la cuenta
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                Autenticando para ID: <span className="font-mono font-bold">{id || 'N/A'}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuario
                                </label>
                                <input
                                    type="text"
                                    name="usuario"
                                    required
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej. juan.perez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                                >
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}