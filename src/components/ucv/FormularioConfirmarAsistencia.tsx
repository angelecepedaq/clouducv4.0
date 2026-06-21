// Modal para confirmar asistencia a un evento privado
import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsistentes } from '@/hooks/useAsistentes';

interface FormularioConfirmarAsistenciaProps {
  abierto: boolean;
  eventoId: string;
  eventoTitulo: string;
  onCerrar: () => void;
  onExito: (codigo: string) => void;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
  borderRadius: '0.75rem',
};

const inputClass =
  'w-full px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/35 focus:border-purple-400/60';

const FormularioConfirmarAsistencia: FC<FormularioConfirmarAsistenciaProps> = ({
  abierto,
  eventoId,
  eventoTitulo,
  onCerrar,
  onExito,
}) => {
  const { user, profile } = useAuth();
  const { confirmarAsistencia, guardando, error } = useAsistentes();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [errores, setErrores] = useState<{ nombre?: string; email?: string }>({});

  useEffect(() => {
    if (abierto) {
      setNombre(profile?.full_name || profile?.username || '');
      setEmail(user?.email || '');
      setErrores({});
    }
  }, [abierto, user, profile]);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [abierto, onCerrar]);

  const validar = (): boolean => {
    const nuevos: typeof errores = {};
    if (!nombre.trim()) nuevos.nombre = 'El nombre es requerido';
    if (!email.trim()) nuevos.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nuevos.email = 'Correo inválido';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    const codigo = await confirmarAsistencia({
      eventoId,
      nombre: nombre.trim(),
      email: email.trim(),
      userId: user?.id ?? null,
    });

    if (codigo) {
      onExito(codigo);
      onCerrar();
    }
  };

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center py-0 md:py-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        className="w-full md:max-w-[390px] rounded-t-3xl md:rounded-3xl flex flex-col"
        style={{ maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-t-3xl md:rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'hsl(258 62% 22%)' }}
        >
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
          </div>

          <div className="flex items-center justify-between px-5 py-4 shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">Confirmar Asistencia</h2>
              <p className="text-lavender text-xs mt-0.5 truncate max-w-[260px]">{eventoTitulo}</p>
            </div>
            <button
              onClick={onCerrar}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-90"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />

          <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(217,70,239,0.1)', border: '1px solid rgba(217,70,239,0.25)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#d946ef" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-white/80 text-xs leading-relaxed">
                Al confirmar, recibirás un correo con tu código de confirmación y un QR para el evento.
              </p>
            </div>

            {error && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-normal text-white/80 mb-1.5">
                Nombre completo <span style={{ color: '#d946ef' }}>*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
                placeholder="Tu nombre completo"
                className={inputClass}
                style={inputStyle}
                maxLength={100}
              />
              {errores.nombre && <p className="text-red-400 text-xs mt-1">{errores.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-normal text-white/80 mb-1.5">
                Correo electrónico <span style={{ color: '#d946ef' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: undefined })); }}
                placeholder="tu@correo.com"
                className={inputClass}
                style={inputStyle}
              />
              {errores.email && <p className="text-red-400 text-xs mt-1">{errores.email}</p>}
            </div>

            <div className="flex gap-3 pt-2 pb-4">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: guardando ? 'rgba(217,70,239,0.4)' : 'linear-gradient(135deg, #d946ef, #a855f7)',
                  opacity: guardando ? 0.8 : 1,
                }}
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.6)', borderTopColor: 'transparent' }} />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Confirmar Asistencia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioConfirmarAsistencia;
