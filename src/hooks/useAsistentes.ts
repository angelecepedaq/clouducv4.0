// Hook para gestionar asistentes y confirmaciones de eventos privados
import { useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { AsistenteEvento } from '@/types/types';
import QRCode from 'qrcode';

interface ConfirmarAsistenciaInput {
  eventoId: string;
  nombre: string;
  email: string;
  userId: string | null;
}

interface UseAsistentesResult {
  asistentes: AsistenteEvento[];
  cargando: boolean;
  guardando: boolean;
  error: string | null;
  confirmarAsistencia: (input: ConfirmarAsistenciaInput) => Promise<string | null>;
  obtenerAsistentes: (eventoId: string) => Promise<AsistenteEvento[]>;
  enviarMensajeAsistentes: (eventoId: string, subject: string, body: string) => Promise<boolean>;
}

export function useAsistentes(): UseAsistentesResult {
  const [asistentes, setAsistentes] = useState<AsistenteEvento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerAsistentes = useCallback(async (eventoId: string): Promise<AsistenteEvento[]> => {
    setCargando(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('asistentes_evento')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      const list = (data || []) as AsistenteEvento[];
      setAsistentes(list);
      return list;
    } catch (err: unknown) {
      console.error('Error fetching event attendees:', err);
      const msg = err instanceof Error ? err.message : 'Error al obtener asistentes';
      setError(msg);
      return [];
    } finally {
      setCargando(false);
    }
  }, []);

  const confirmarAsistencia = async (input: ConfirmarAsistenciaInput): Promise<string | null> => {
    setGuardando(true);
    setError(null);

    try {
      // 1. Obtener detalles del evento (para verificar cupo y enviar info en correo)
      const { data: evento, error: evError } = await supabase
        .from('eventos')
        .select('title, is_private, max_attendees, start_date, location')
        .eq('id', input.eventoId)
        .maybeSingle();

      if (evError || !evento) {
        throw new Error('No se pudo encontrar el evento.');
      }

      // 2. Si es privado, validar límite de asistentes
      if (evento.is_private && evento.max_attendees !== null) {
        const { count, error: countError } = await supabase
          .from('asistentes_evento')
          .select('id', { count: 'exact', head: true })
          .eq('evento_id', input.eventoId);

        if (countError) throw countError;
        const currentCount = count || 0;
        if (currentCount >= evento.max_attendees) {
          throw new Error('Lo sentimos, no quedan cupos disponibles para este evento.');
        }
      }

      // 3. Generar código de confirmación aleatorio
      const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codigoConfirmacion = `CONF-${randHex}`;

      // 4. Registrar en la base de datos
      const assistantId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('asistentes_evento')
        .insert({
          id: assistantId,
          evento_id: input.eventoId,
          user_id: input.userId || null,
          nombre: input.nombre.trim(),
          email: input.email.trim(),
          codigo_confirmacion: codigoConfirmacion,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Ya has confirmado asistencia a este evento con este correo electrónico.');
        }
        throw insertError;
      }

      // 5. Generar código QR en base64 usando la librería qrcode
      const qrPayload = JSON.stringify({
        evento: evento.title,
        asistente: input.nombre.trim(),
        codigo: codigoConfirmacion,
      });
      const qrDataUrl = await QRCode.toDataURL(qrPayload);

      // 6. Enviar correo simulado
      const fechaFormateada = new Date(evento.start_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const subject = `Confirmación de asistencia: ${evento.title}`;
      const body = `¡Hola, ${input.nombre.trim()}!\n\n` +
        `Usted ha confirmado asistencia al evento "${evento.title}".\n\n` +
        `Detalles del evento:\n` +
        `- Fecha y Hora: ${fechaFormateada}\n` +
        `- Ubicación: ${evento.location || 'No especificada'}\n` +
        `- Código de confirmación: ${codigoConfirmacion}\n\n` +
        `Por favor, presenta el código QR adjunto en la entrada del evento.\n\n` +
        `¡Gracias por acompañarnos!\n` +
        `Cloud UCV`;

      await supabase
        .from('simulated_emails')
        .insert({
          id: crypto.randomUUID(),
          to_email: input.email.trim(),
          subject,
          body,
          qr_data: qrDataUrl,
        });

      return codigoConfirmacion;
    } catch (err: unknown) {
      console.error('Error confirming attendance:', err);
      const msg = err instanceof Error ? err.message : 'Error al confirmar la asistencia';
      setError(msg);
      return null;
    } finally {
      setGuardando(false);
    }
  };

  const enviarMensajeAsistentes = async (
    eventoId: string,
    subject: string,
    body: string
  ): Promise<boolean> => {
    setGuardando(true);
    setError(null);

    try {
      // 1. Obtener detalles del evento
      const { data: evento, error: evError } = await supabase
        .from('eventos')
        .select('title')
        .eq('id', eventoId)
        .maybeSingle();

      if (evError || !evento) throw new Error('No se pudo encontrar el evento.');

      // 2. Obtener lista de asistentes
      const { data: asistentesList, error: asisError } = await supabase
        .from('asistentes_evento')
        .select('nombre, email')
        .eq('evento_id', eventoId);

      if (asisError) throw asisError;
      if (!asistentesList || asistentesList.length === 0) {
        throw new Error('No hay asistentes confirmados registrados para enviarles información.');
      }

      // 3. Crear correos simulados en lote
      const emailInserts = asistentesList.map((asis) => ({
        id: crypto.randomUUID(),
        to_email: asis.email,
        subject: `[Anuncio] ${subject} - Evento: ${evento.title}`,
        body: `Hola, ${asis.nombre}!\n\n` +
          `El organizador del evento "${evento.title}" ha enviado la siguiente actualización:\n` +
          `----------------------------------------------------------------------\n\n` +
          `${body}\n\n` +
          `----------------------------------------------------------------------\n` +
          `Cloud UCV`,
      }));

      const { error: insertError } = await supabase
        .from('simulated_emails')
        .insert(emailInserts);

      if (insertError) throw insertError;
      return true;
    } catch (err: unknown) {
      console.error('Error broadcasting message to attendees:', err);
      const msg = err instanceof Error ? err.message : 'Error al enviar comunicados';
      setError(msg);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    asistentes,
    cargando,
    guardando,
    error,
    confirmarAsistencia,
    obtenerAsistentes,
    enviarMensajeAsistentes,
  };
}
