import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, LogIn, Smartphone } from 'lucide-react';

export const Login = () => {
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, login } = useAuth();
  const navigate = useNavigate();

  // Si ya tiene token, redirigir al inicio automáticamente
  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(require2FA ? { password, totpToken } : { password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (data.require2FA) {
        setRequire2FA(true);
        setLoading(false);
        return;
      }

      login(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">FCT Manager</h1>
          <p className="text-indigo-100">Área de acceso restringido</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!require2FA ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña Maestra
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full mx-auto mb-4">
                  <Smartphone className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-center font-bold text-slate-900 mb-2">Verificación en dos pasos</h3>
                <p className="text-center text-sm text-slate-500 mb-6">Abre tu aplicación Authenticator e introduce el código de 6 dígitos.</p>
                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                  Código de verificación
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => { setRequire2FA(false); setTotpToken(''); setPassword(''); }} className="mt-4 text-sm text-indigo-600 hover:underline w-full text-center">
                  Volver a introducir la contraseña
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-70"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
