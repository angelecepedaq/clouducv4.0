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
      // Verificar si ya existe el like
      const { data: existingLike } = await supabase
        .from('likes_evento')
        .select('id')
        .eq('evento_id', eventoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Quitar like
        const { error } = await supabase
          .from('likes_evento')
          .delete()
          .eq('evento_id', eventoId)
          .eq('user_id', user.id);
        return !error;
      } else {
        // Agregar like
        const { error } = await supabase
          .from('likes_evento')
          .insert({ id: crypto.randomUUID(), evento_id: eventoId, user_id: user.id });
        if (error) console.error('Error insertando like_evento:', error);
        return !error;
      }
    } catch (e) {
      console.error('Excepción al hacer toggle de like:', e);
      return false;
    } finally {
      setCargando(prev => ({ ...prev, [eventoId]: false }));
    }
  }, [user, cargando]);

  return { toggleLike, likesCargando: cargando };
}