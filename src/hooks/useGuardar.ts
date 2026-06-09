import { useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useGuardar() {
  const { user } = useAuth();
  const [cargando, setCargando] = useState<Record<string, boolean>>({});

  const toggleGuardado = useCallback(async (eventoId: string): Promise<boolean | null> => {
    if (!user) return null; // No autenticado

    if (cargando[eventoId]) return null;
    
    setCargando(prev => ({ ...prev, [eventoId]: true }));
    
    try {
      const { data, error } = await supabase.rpc('toggle_guardado', { p_evento_id: eventoId });
      
      if (error) {
        console.error('Error al hacer toggle de guardado:', error);
        toast.error('No se pudo actualizar el estado del evento');
        return null;
      }
      
      return data as boolean; // Devuelve true si se guardó, false si se quitó
    } catch (e) {
      console.error('Excepción al hacer toggle de guardado:', e);
      return null;
    } finally {
      setCargando(prev => ({ ...prev, [eventoId]: false }));
    }
  }, [user, cargando]);

  return { toggleGuardado, guardadoCargando: cargando };
}