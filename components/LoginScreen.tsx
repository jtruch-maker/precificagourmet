import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChefHat, ArrowRight, Loader2, UtensilsCrossed } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error('Nome é obrigatório');
        await register(formData.name, formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-stone-200 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-600 p-3 rounded-xl text-white mb-4 shadow-lg shadow-orange-200">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Precificador Gourmet</h1>
          <p className="text-stone-500 text-sm mt-1">Gestão inteligente para sua cozinha</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Nome do Restaurante</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none transition-all bg-stone-50"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none transition-all bg-stone-50"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none transition-all bg-stone-50"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Entrar na Cozinha' : 'Criar Conta Grátis'}
                {!isLoading && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-stone-100">
          <p className="text-sm text-stone-600">
            {isLogin ? 'Novo por aqui?' : 'Já possui cadastro?'}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-2 font-semibold text-orange-700 hover:underline hover:text-orange-800"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};