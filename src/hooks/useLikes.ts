import { useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useLikes() {
  const { user } = useAuth();
  const [cargando, setCargando] = useState<Record<string, boolean>>({});

  const toggleLike = useCallback(async (eventoId: string): Promise<boolean> => {
    if (!user) return false;

    // Evitar múltiples clicks simultáneos
    if (cargando[eventoId]) return false;
    
    setCargando(prev => ({ ...prev, [eventoId]: true }));
    
    try {
      // Usar la función RPC para evitar condiciones de carrera
      const { data, error } = await supabase.rpc('toggle_like', { p_evento_id: eventoId });
      
      if (error) {
        console.error('Error al hacer toggle de like:', error);
        return false;
      }
      
      return true; // Se procesó correctamente (el estado optimista ya se aplicó en el componente)
    } catch (e) {
      console.error('Excepción al hacer toggle de like:', e);
      return false;
    } finally {
      setCargando(prev => ({ ...prev, [eventoId]: false }));
    }
  }, [user, cargando]);

  return { toggleLike, likesCargando: cargando };
}