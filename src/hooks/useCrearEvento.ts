// Hook para crear nuevos eventos en Supabase
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Categoria } from '@/types/types';

// Imágenes por defecto según categoría
const imagenesPorCategoria: Record<Exclude<Categoria, 'Todos'>, string> = {
  Académicos:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8d9b64f4-18b1-4183-8598-a0520a34a4e0.jpg',
  Culturales:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8424ffc3-1547-4313-a45c-92085ea3273a.jpg',
  Deportivos:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e25eaacf-0471-4668-aa28-7624012722eb.jpg',
  Comerciales:
    'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a1f9e2b4-5c6d-4e7f-8a9b-0c1d2e3f4a5b.jpg', // Placeholder
};

// Avatares por defecto según categoría
const avataresPorCategoria: Record<Exclude<Categoria, 'Todos'>, string[]> = {
  Académicos: ['#3B82F6', '#06B6D4', '#8B5CF6'],
  Culturales: ['#D946EF', '#A855F7', '#FF6B9D'],
  Deportivos: ['#10B981', '#F59E0B', '#34D399'],
  Comerciales: ['#F59E0B', '#F97316', '#EF4444'],
};

export interface NuevoEventoInput {
  titulo: string;
  categoria: Exclude<Categoria, 'Todos'>;
  fecha: string;
  hora: string;
  descripcion: string;
  asistentes: number;
  imagen?: string;
  direccion?: string;
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

    // Obtener el usuario autenticado para el user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Debes iniciar sesión para crear un evento.');
      setGuardando(false);
      return false;
    }

    const imagenFinal =
      datos.imagen?.trim() || imagenesPorCategoria[datos.categoria];
    const avataresFinal = avataresPorCategoria[datos.categoria];

    const { error: supabaseError } = await supabase.from('eventos').insert({
      titulo: datos.titulo.trim(),
      categoria: datos.categoria,
      fecha: datos.fecha.trim(),
      hora: datos.hora.trim(),
      descripcion: datos.descripcion.trim(),
      asistentes: datos.asistentes,
      imagen: imagenFinal,
      avatares: avataresFinal,
      user_id: user.id,
      direccion: datos.direccion?.trim() || null,
      likes: 0
    });

    setGuardando(false);

    if (supabaseError) {
      setError('Error al crear el evento. Intenta nuevamente.');
      return false;
    }

    return true;
  };

  const resetError = () => setError(null);

  return { guardando, error, crearEvento, resetError };
}
