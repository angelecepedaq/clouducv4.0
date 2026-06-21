// Hook para crear nuevos eventos en Supabase
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Categoria } from '@/types/types';

export interface NuevoEventoInput {
  title: string;
  category: Exclude<Categoria, 'Todos'>;
  fecha: string;   // YYYY-MM-DD (del input date del formulario)
  hora: string;    // HH:MM (del input time del formulario)
  description: string;
  location?: string;
  id?: string;
  imagen?: string | null;
  is_private?: boolean;
  max_attendees?: number | null;
  is_published?: boolean;
}

interface UseCrearEventoResult {
  guardando: boolean;
  error: string | null;
  crearEvento: (datos: NuevoEventoInput) => Promise<boolean>;
  resetError: () => void;
}

export function useCrearEvento(): UseCrearEventoResult {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearEvento = async (datos: NuevoEventoInput): Promise<boolean> => {
    setGuardando(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Debes iniciar sesión para crear un evento.');
      setGuardando(false);
      return false;
    }

    const isPrivate = datos.is_private ?? false;

    if (isPrivate) {
      if (!datos.max_attendees || datos.max_attendees < 1) {
        setError('Los eventos privados requieren un número máximo de asistentes confirmados (mínimo 1).');
        setGuardando(false);
        return false;
      }
    }

    // Combinar fecha + hora en un timestamp ISO para start_date
    const startDate = new Date(`${datos.fecha}T${datos.hora}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas

    const eventId = datos.id ?? crypto.randomUUID();

    const insertPayload: Record<string, unknown> = {
      id: eventId,
      title: datos.title.trim(),
      category: datos.category,
      description: datos.description.trim(),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      user_id: user.id,
      location: datos.location?.trim() || null,
      imagen: datos.imagen ?? '/images/logo/imgucv.png',
      is_private: isPrivate,
      max_attendees: isPrivate ? datos.max_attendees : null,
      is_published: datos.is_published ?? true,
    };

    const { error: supabaseError } = await supabase.from('eventos').insert(insertPayload);

    if (supabaseError) {
      console.error('Error Supabase (Insert):', supabaseError);
      setError(supabaseError.message || 'Error al crear el evento en la base de datos.');
      setGuardando(false);
      return false;
    }

    setGuardando(false);
    return true;
  };

  const resetError = () => setError(null);

  return { guardando, error, crearEvento, resetError };
}
