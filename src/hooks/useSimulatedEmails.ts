// Hook para gestionar correos electrónicos simulados en la base de datos
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { SimulatedEmail } from '@/types/types';

interface UseSimulatedEmailsResult {
  emails: SimulatedEmail[];
  cargando: boolean;
  error: string | null;
  enviarEmailSimulado: (toEmail: string, subject: string, body: string, qrData?: string | null) => Promise<boolean>;
  marcarLeidoLocal: () => void;
  recargar: () => void;
}

export function useSimulatedEmails(destinatarioEmail?: string | null): UseSimulatedEmailsResult {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contador, setContador] = useState(0);

  const fetchEmails = useCallback(async () => {
    if (!destinatarioEmail) {
      setEmails([]);
      return;
    }
    
    setCargando(true);
    setError(null);
    
    const { data, error: sbError } = await supabase
      .from('simulated_emails')
      .select('*')
      .eq('to_email', destinatarioEmail)
      .order('created_at', { ascending: false });

    setCargando(false);
    if (sbError) {
      console.error('Error fetching simulated emails:', sbError);
      setError('Error al obtener correos simulados.');
    } else {
      setEmails(data || []);
    }
  }, [destinatarioEmail]);

  useEffect(() => {
    fetchEmails();
  }, [destinatarioEmail, contador, fetchEmails]);

  // Suscripción en tiempo real a nuevos correos
  useEffect(() => {
    if (!destinatarioEmail) return;

    const channel = supabase
      .channel(`simulated_emails_${destinatarioEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'simulated_emails',
          filter: `to_email=eq.${destinatarioEmail}`
        },
        (payload) => {
          const nuevoEmail = payload.new as SimulatedEmail;
          setEmails((prev) => {
            if (prev.some((e) => e.id === nuevoEmail.id)) return prev;
            return [nuevoEmail, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [destinatarioEmail]);

  const enviarEmailSimulado = async (
    toEmail: string,
    subject: string,
    body: string,
    qrData?: string | null
  ): Promise<boolean> => {
    setError(null);
    const { error: sbError } = await supabase
      .from('simulated_emails')
      .insert({
        id: crypto.randomUUID(),
        to_email: toEmail,
        subject,
        body,
        qr_data: qrData || null
      });

    if (sbError) {
      console.error('Error sending simulated email:', sbError);
      setError(sbError.message);
      return false;
    }
    return true;
  };

  const marcarLeidoLocal = () => {
    // Estado local opcional para simular lectura
  };

  const recargar = () => setContador(prev => prev + 1);

  return {
    emails,
    cargando,
    error,
    enviarEmailSimulado,
    marcarLeidoLocal,
    recargar
  };
}
