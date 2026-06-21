// Hook para editar un evento propio en Supabase
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Categoria } from '@/types/types';

type CategoriaEvento = Exclude<Categoria, 'Todos'>;

export interface EditarEventoInput {
  id: string;
  title: string;
  category: CategoriaEvento;
  fecha: string;   // YYYY-MM-DD
  hora: string;    // HH:MM
  description: string;
  location?: string;
  imagen?: string | null; // public URL to the uploaded image (optional)
}

interface UseEditarEventoResult {
  guardando: boolean;
  error: string | null;
  editarEvento: (datos: EditarEventoInput) => Promise<boolean>;
  resetError: () => void;
}

export function useEditarEvento(): UseEditarEventoResult {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editarEvento = async (datos: EditarEventoInput): Promise<boolean> => {
    setGuardando(true);
    setError(null);

    // Verificar sesión activa en el cliente
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Debes iniciar sesión para editar un evento.');
      setGuardando(false);
      return false;
    }

    // Combinar fecha + hora en un timestamp ISO para start_date
    const startDate = new Date(`${datos.fecha}T${datos.hora}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const payload: Record<string, unknown> = {
      title: datos.title.trim(),
      category: datos.category,
      description: datos.description.trim(),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      location: datos.location?.trim() || null,
    };

    // Only include imagen if provided (so we don't accidentally null existing image)
    if (Object.prototype.hasOwnProperty.call(datos, 'imagen')) {
      payload.imagen = datos.imagen ?? '/images/logo/imgucv.png';
    }

    const { error: supabaseError } = await supabase
      .from('eventos')
      .update(payload)
      // RLS garantiza que solo el dueño (user_id = auth.uid()) puede hacer UPDATE
      .eq('id', datos.id)
      .eq('user_id', user.id);

    setGuardando(false);

    if (supabaseError) {
      console.error('Error Supabase (Update):', supabaseError);
      setError(supabaseError.message || 'Error al actualizar el evento en la base de datos.');
      return false;
    }

    return true;
  };

  const resetError = () => setError(null);

  return { guardando, error, editarEvento, resetError };
}
