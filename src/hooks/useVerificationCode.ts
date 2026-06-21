// Hook para solicitar y validar códigos de verificación por correo al crear eventos
import { useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';

interface UseVerificationCodeResult {
  enviando: boolean;
  error: string | null;
  codigoEnviado: boolean;
  solicitarCodigo: (userEmail?: string, userId?: string) => Promise<boolean>;
  validarCodigo: (userId: string, code: string) => Promise<boolean>;
  reset: () => void;
}

function generarCodigo(): string {
  // Código fijo para pruebas: 123456789
  return '123456789';
}

export function useVerificationCode(): UseVerificationCodeResult {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const solicitarCodigo = useCallback(async (userEmail?: string, userId?: string): Promise<boolean> => {
    setEnviando(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = userId ?? user?.id;
      const currentUserEmail = userEmail ?? user?.email;

      if (!currentUserEmail) {
        throw new Error('El correo es requerido para enviar el código.');
      }
      if (!currentUserId) {
        throw new Error('Debes iniciar sesión para solicitar el código de verificación.');
      }

      const code = generarCodigo();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from('event_verification_codes')
        .insert({
          user_id: currentUserId,
          code,
          expires_at: expiresAt,
          used: false,
        });

      if (insertError) {
        console.error('Supabase insert error (event_verification_codes):', insertError);
        throw insertError;
      }

      const subject = 'Código de verificación — Cloud UCV';
      const body =
        `¡Hola!\n\n` +
        `Has solicitado crear un evento en Cloud UCV.\n\n` +
        `Tu código de verificación es: ${code}\n\n` +
        `Este código expira en 15 minutos.\n\n` +
        `Si no solicitaste esto, ignora este mensaje.\n\n` +
        `Cloud UCV`;

      const { error: emailError } = await supabase
        .from('simulated_emails')
        .insert({
          to_email: currentUserEmail,
          subject,
          body,
        });

      if (emailError) {
        console.error('Supabase insert error (simulated_emails):', emailError);
        throw emailError;
      }

      setCodigoEnviado(true);
      return true;
    } catch (err: unknown) {
      console.error('Error requesting verification code:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el código de verificación');
      return false;
    } finally {
      setEnviando(false);
    }
  }, []);

  const validarCodigo = useCallback(async (userId: string, code: string): Promise<boolean> => {
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('event_verification_codes')
        .select('id, code, expires_at, used')
        .eq('user_id', userId)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('No se encontró un código de verificación. Solicita uno nuevo.');
        return false;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('El código ha expirado. Solicita uno nuevo.');
        return false;
      }

      if (data.code !== code.trim()) {
        setError('Código de verificación incorrecto.');
        return false;
      }

      const { error: updateError } = await supabase
        .from('event_verification_codes')
        .update({ used: true })
        .eq('id', data.id);

      if (updateError) throw updateError;
      return true;
    } catch (err: unknown) {
      console.error('Error validating verification code:', err);
      setError(err instanceof Error ? err.message : 'Error al validar el código');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setCodigoEnviado(false);
  }, []);

  return { enviando, error, codigoEnviado, solicitarCodigo, validarCodigo, reset };
}
