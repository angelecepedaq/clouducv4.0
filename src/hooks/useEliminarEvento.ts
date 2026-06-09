// Hook para eliminar un evento propio en Supabase
import { useState } from 'react';
import { supabase } from '@/db/supabase';

interface UseEliminarEventoResult {
  eliminando: boolean;
  error: string | null;
  eliminarEvento: (id: string) => Promise<boolean>;
  resetError: () => void;
}

export function useEliminarEvento(): UseEliminarEventoResult {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminarEvento = async (id: string): Promise<boolean> => {
    setEliminando(true);
    setError(null);

    // Verificar sesión activa en el cliente
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Debes iniciar sesión para eliminar un evento.');
      setEliminando(false);
      return false;
    }

    const { error: supabaseError } = await supabase
      .from('eventos')
      .delete()
      // RLS garantiza que solo el dueño (user_id = auth.uid()) puede hacer DELETE
      .eq('id', id)
      .eq('user_id', user.id);

    setEliminando(false);

    if (supabaseError) {
      setError('Error al eliminar el evento. Intenta nuevamente.');
      return false;
    }

    return true;
  };

  const resetError = () => setError(null);

  return { eliminando, error, eliminarEvento, resetError };
}
