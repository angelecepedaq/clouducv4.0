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
      // Verificar si ya está guardado
      const { data: existing } = await supabase
        .from('eventos_guardados')
        .select('id')
        .eq('evento_id', eventoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Quitar de guardados
        const { error } = await supabase
          .from('eventos_guardados')
          .delete()
          .eq('evento_id', eventoId)
          .eq('user_id', user.id);
        
        if (error) {
          toast.error('No se pudo actualizar el estado del evento');
          return null;
        }
        return false; // Se quitó
      } else {
        // Guardar
        const { error } = await supabase
          .from('eventos_guardados')
          .insert({ id: crypto.randomUUID(), evento_id: eventoId, user_id: user.id });
        
        if (error) {
          toast.error('No se pudo actualizar el estado del evento');
          return null;
        }
        return true; // Se guardó
      }
    } catch (e) {
      console.error('Excepción al hacer toggle de guardado:', e);
      return null;
    } finally {
      setCargando(prev => ({ ...prev, [eventoId]: false }));
    }
  }, [user, cargando]);

  return { toggleGuardado, guardadoCargando: cargando };
}