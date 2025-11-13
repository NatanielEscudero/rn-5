// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

// AuthContext centraliza la sesión: persistencia y acciones (signIn/signOut)
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar sesión
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Intentar recuperar sesión desde Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('supabase_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username
          }));
        } else {
          // Fallback a localStorage si existe
          const stored = localStorage.getItem('supabase_user');
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch (e) {
              localStorage.removeItem('supabase_user');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error inicializando AuthProvider:', err);
        setError(err.message || 'Error inicializando autenticación');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem('supabase_user', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username
              }));
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            localStorage.removeItem('supabase_user');
            break;

          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem('supabase_user', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username
              }));
            }
            break;

          case 'INITIAL_SESSION':
            // Fired by Supabase on initial session detection
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem('supabase_user', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username
              }));
            }
            break;

          default:
            break;
        }
      } finally {
        // Ensure loading is cleared once Supabase reports an auth event
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('supabase_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username
        }));
      }
      return { data, error: null };
    } catch (err) {
      console.error('Auth signIn error:', err);
      setError(err.message || 'Error en inicio de sesión');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // onAuthStateChange se encargará de limpiar user/localStorage
      return { error: null };
    } catch (err) {
      console.error('Auth signOut error:', err);
      setError(err.message || 'Error al cerrar sesión');
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};