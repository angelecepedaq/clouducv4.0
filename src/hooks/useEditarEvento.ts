// Hook para editar un evento propio en Supabase
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Categoria } from '@/types/types';

type CategoriaEvento = Exclude<Categoria, 'Todos'>;

// Avatares por defecto según categoría
const avataresPorCategoria: Record<CategoriaEvento, string[]> = {
  Académicos: ['#3B82F6', '#06B6D4', '#8B5CF6'],
  Culturales: ['#D946EF', '#A855F7', '#FF6B9D'],
  Deportivos: ['#10B981', '#F59E0B', '#34D399'],
  Comerciales: ['#F59E0B', '#F97316', '#EF4444'],
};

// Imágenes por defecto según categoría
const imagenesPorCategoria: Record<CategoriaEvento, string> = {
  Académicos:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8d9b64f4-18b1-4183-8598-a0520a34a4e0.jpg',
  Culturales:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8424ffc3-1547-4313-a45c-92085ea3273a.jpg',
  Deportivos:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e25eaacf-0471-4668-aa28-7624012722eb.jpg',
  Comerciales:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a1f9e2b4-5c6d-4e7f-8a9b-0c1d2e3f4a5b.jpg', // Placeholder
};

export interface EditarEventoInput {
  id: string;
  titulo: string;
  categoria: CategoriaEvento;
  fecha: string;
  hora: string;
  descripcion: string;
  asistentes: number;
  imagen?: string;
  direccion?: string;
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

    const imagenFinal = datos.imagen?.trim() || imagenesPorCategoria[datos.categoria];
    const avataresFinal = avataresPorCategoria[datos.categoria];

    const { error: supabaseError } = await supabase
      .from('eventos')
      .update({
        titulo: datos.titulo.trim(),
        categoria: datos.categoria,
        fecha: datos.fecha.trim(),
        hora: datos.hora.trim(),
        descripcion: datos.descripcion.trim(),
        asistentes: datos.asistentes,
        imagen: imagenFinal,
        avatares: avataresFinal,
        direccion: datos.direccion?.trim() || null,
      })
      // RLS garantiza que solo el dueño (user_id = auth.uid()) puede hacer UPDATE
      .eq('id', datos.id)
      .eq('user_id', user.id);

    setGuardando(false);

    if (supabaseError) {
      setError('Error al actualizar el evento. Intenta nuevamente.');
      return false;
    }

    return true;
  };

  const resetError = () => setError(null);

  return { guardando, error, editarEvento, resetError };
}
