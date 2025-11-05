// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          if (session?.user) {
            console.log('✅ Sesión encontrada:', session.user.email);
            setUser(session.user);
            
            // Guardar en localStorage para consistencia
            localStorage.setItem('supabase_user', JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username
            }));
          } else {
            console.log('ℹ️ No hay sesión activa');
            setUser(null);
            localStorage.removeItem('supabase_user');
          }
        }
      } catch (err) {
        console.error('❌ Error inicializando auth:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ Usuario firmó sesión:', session.user.email);
            setUser(session.user);
            localStorage.setItem('supabase_user', JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username
            }));
            break;

          case 'SIGNED_OUT':
            console.log('🚪 Usuario cerró sesión');
            setUser(null);
            localStorage.removeItem('supabase_user');
            localStorage.removeItem('user'); // Limpiar el antiguo si existe
            break;

          case 'USER_UPDATED':
            console.log('📝 Usuario actualizado');
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem('supabase_user', JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username
              }));
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refrescado');
            break;

          case 'INITIAL_SESSION':
            console.log('🎬 Sesión inicial');
            break;

          default:
            console.log('❓ Evento no manejado:', event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};