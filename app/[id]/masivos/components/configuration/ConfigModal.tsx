import React, { useState, useEffect } from 'react';

interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phone: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function ConfigModal({ isOpen, onClose, userId }: Props) {
    const [config, setConfig] = useState<TwilioConfig>({
        accountSid: '',
        authToken: '',
        phone: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Cargar configuración existente
    useEffect(() => {
        if (isOpen && userId) {
            setIsLoading(true);
            setMessage(null);
            fetch(`/api/${userId}/configuration`)
                .then(res => {
                    if (res.ok) return res.json();
                    return null;
                })
                .then(data => {
                    if (data) {
                        setConfig({
                            accountSid: data.accountSid,
                            authToken: data.authToken,
                            phone: data.phone
                        });
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!config.accountSid || !config.authToken || !config.phone) {
            setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/${userId}/configuration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '¡Credenciales guardadas correctamente!' });
                setTimeout(() => {
                    onClose();
                    setMessage(null);
                }, 1500);
            } else {
                setMessage({ type: 'error', text: 'Error al guardar configuración' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">

            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

                {/* Cabecera */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Configuración API</h3>
                        <p className="text-sm text-gray-400 mt-1">Ingresa tus llaves de Twilio.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account SID</label>
                            <input
                                type="text"
                                name="accountSid"
                                value={config.accountSid}
                                onChange={handleChange}
                                placeholder="AC..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Auth Token</label>
                            <input
                                type="password"
                                name="authToken"
                                value={config.authToken}
                                onChange={handleChange}
                                placeholder="••••••••••••"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono (Sender)</label>
                            <input
                                type="text"
                                name="phone"
                                value={config.phone}
                                onChange={handleChange}
                                placeholder="+1 415 523 8886"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all placeholder-gray-400"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">El número de WhatsApp Sandbox o tu número verificado.</p>
                        </div>
                    </div>

                    {/* Mensajes de Estado */}
                    {message && (
                        <div className={`text-sm text-center p-3 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
                                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
                            `}
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Credenciales'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}