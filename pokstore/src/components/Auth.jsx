import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = isRegister
        ? await supabase.auth.signUp({
            email,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) throw error;
      if (data?.user) {
        onAuth(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-yellow-50 to-red-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-red-600 mb-6">
          {isRegister ? 'Créer un compte' : 'Connexion'} PokéStore
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading
              ? '⏳ Chargement...'
              : isRegister
              ? 'Créer un compte'
              : 'Se connecter'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-red-600 hover:text-red-700"
        >
          {isRegister
            ? 'Déjà un compte ? Se connecter'
            : 'Pas de compte ? S\'inscrire'}
        </button>
      </div>
    </div>
  );
} 