// Panel del creador: lista de asistentes confirmados y envío de comunicados
import { useState, useEffect, type FC, type FormEvent } from 'react';
import type { AsistenteEvento } from '@/types/types';
import { useAsistentes } from '@/hooks/useAsistentes';
import { toast } from 'sonner';

interface PanelAsistentesCreadorProps {
  eventoId: string;
  eventoTitulo: string;
  maxAttendees: number | null;
  isPublished: boolean;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
  borderRadius: '0.75rem',
};

const inputClass =
  'w-full px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/35 focus:border-purple-400/60';

const PanelAsistentesCreador: FC<PanelAsistentesCreadorProps> = ({
  eventoId,
  eventoTitulo,
  maxAttendees,
  isPublished,
}) => {
  const { asistentes, cargando, guardando, obtenerAsistentes, enviarMensajeAsistentes } = useAsistentes();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    obtenerAsistentes(eventoId);
  }, [eventoId, obtenerAsistentes]);

  const handleEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) {
      toast.error('Completa el asunto y el mensaje');
      return;
    }

    const ok = await enviarMensajeAsistentes(eventoId, asunto.trim(), mensaje.trim());
    if (ok) {
      toast.success(`Comunicado enviado a ${asistentes.length} asistente(s)`);
      setAsunto('');
      setMensaje('');
      setMostrarFormulario(false);
    } else {
      toast.error('Error al enviar el comunicado');
    }
  };

  const progreso = maxAttendees ? Math.min(100, Math.round((asistentes.length / maxAttendees) * 100)) : 0;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Asistentes Confirmados</h3>
          <p className="text-lavender text-xs mt-0.5">
            {asistentes.length}{maxAttendees ? ` / ${maxAttendees}` : ''} confirmados
          </p>
        </div>
        {!isPublished && maxAttendees && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            Pendiente de publicar
          </span>
        )}
        {isPublished && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            Publicado
          </span>
        )}
      </div>

      {maxAttendees && !isPublished && (
        <div>
          <div className="flex justify-between text-xs text-lavender mb-1.5">
            <span>Progreso para publicar</span>
            <span>{progreso}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #d946ef, #a855f7)' }}
            />
          </div>
          <p className="text-lavender text-[10px] mt-1.5">
            Se publicará al alcanzar {maxAttendees} confirmaciones
          </p>
        </div>
      )}

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : asistentes.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(217,70,239,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#d946ef" strokeWidth="1.8"/>
              <circle cx="9" cy="7" r="4" stroke="#d946ef" strokeWidth="1.8"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#d946ef" strokeWidth="1.8"/>
            </svg>
          </div>
          <p className="text-lavender text-xs">Aún no hay asistentes confirmados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto hide-scrollbar">
          {asistentes.map((asis: AsistenteEvento) => (
            <div
              key={asis.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)' }}
              >
                {asis.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{asis.nombre}</p>
                <p className="text-lavender text-[10px] truncate">{asis.email}</p>
              </div>
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399' }}
              >
                {asis.codigo_confirmacion}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setMostrarFormulario((p) => !p)}
        disabled={asistentes.length === 0}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="white" strokeWidth="1.8"/>
          <polyline points="22,6 12,13 2,6" stroke="white" strokeWidth="1.8"/>
        </svg>
        Enviar información a asistentes
      </button>

      {mostrarFormulario && (
        <form onSubmit={handleEnviar} className="flex flex-col gap-3 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-lavender text-xs">
            Enviar comunicado sobre &quot;{eventoTitulo}&quot; a {asistentes.length} asistente(s)
          </p>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto del mensaje"
            className={inputClass}
            style={inputStyle}
            maxLength={150}
          />
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe la información del evento..."
            className={inputClass + ' resize-none min-h-[80px]'}
            style={inputStyle}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: guardando ? 'rgba(217,70,239,0.4)' : 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {guardando ? 'Enviando...' : 'Enviar comunicado'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PanelAsistentesCreador;
