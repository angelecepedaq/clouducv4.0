// Bandeja de correos simulados del usuario
import { useState, type FC } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedEmails } from '@/hooks/useSimulatedEmails';
import type { SimulatedEmail } from '@/types/types';

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

const BandejaCorreosSimulados: FC = () => {
  const { user } = useAuth();
  const { emails, cargando } = useSimulatedEmails(user?.email);
  const [emailSeleccionado, setEmailSeleccionado] = useState<SimulatedEmail | null>(null);

  if (!user) return null;

  if (emailSeleccionado) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setEmailSeleccionado(null)}
          className="flex items-center gap-2 text-lavender text-sm font-medium active:scale-95 transition-transform self-start"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a la bandeja
        </button>

        <div
          className="rounded-2xl p-4 flex flex-col gap-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div>
            <p className="text-lavender text-[10px] uppercase tracking-wide font-medium">Para: {emailSeleccionado.to_email}</p>
            <h3 className="text-white font-bold text-base mt-1">{emailSeleccionado.subject}</h3>
            <p className="text-lavender text-xs mt-1">{formatFecha(emailSeleccionado.created_at)}</p>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />

          <pre className="text-white/85 text-sm whitespace-pre-wrap leading-relaxed font-sans">
            {emailSeleccionado.body}
          </pre>

          {emailSeleccionado.qr_data && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-lavender text-xs font-medium">Código QR de confirmación</p>
              <div
                className="p-3 rounded-2xl"
                style={{ backgroundColor: '#fff' }}
              >
                <Image
                  src={emailSeleccionado.qr_data}
                  alt="QR de confirmación"
                  width={160}
                  height={160}
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(217,70,239,0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#d946ef" strokeWidth="1.8"/>
            <polyline points="22,6 12,13 2,6" stroke="#d946ef" strokeWidth="1.8"/>
          </svg>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Mi Bandeja de Correos</h3>
          <p className="text-lavender text-[10px]">{user.email}</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-lavender text-xs">No tienes correos simulados aún</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setEmailSeleccionado(email)}
              className="flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: email.qr_data ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #d946ef, #a855f7)' }}
              >
                {email.qr_data ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="white" strokeWidth="1.8"/>
                    <rect x="14" y="3" width="7" height="7" stroke="white" strokeWidth="1.8"/>
                    <rect x="3" y="14" width="7" height="7" stroke="white" strokeWidth="1.8"/>
                    <rect x="14" y="14" width="3" height="3" stroke="white" strokeWidth="1.8"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth="1.8"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{email.subject}</p>
                <p className="text-lavender text-xs truncate mt-0.5">{email.body.split('\n')[0]}</p>
                <p className="text-white/30 text-[10px] mt-1">{formatFecha(email.created_at)}</p>
              </div>
              {email.qr_data && (
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                >
                  QR
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BandejaCorreosSimulados;
