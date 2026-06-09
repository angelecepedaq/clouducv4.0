// Sección de comentarios públicos para eventos
import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import type { MensajeEvento } from '@/types/types';
import { useMensajesEvento } from '@/hooks/useMensajesEvento';
import { useAuth } from '@/contexts/AuthContext';

interface SeccionMensajesProps {
  eventoId: string;
  creadorId: string | null | undefined;
  onAbrirLogin: () => void;
}

// Tiempo relativo legible
function tiempoRelativo(fechaStr: string): string {
  const ahora = Date.now();
  const fecha = new Date(fechaStr).getTime();
  const diff = Math.floor((ahora - fecha) / 1000);
  if (diff < 60) return 'ahora mismo';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ayer';
  return new Date(fechaStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Avatar con iniciales o imagen
const AvatarMensaje: FC<{ username: string; avatarUrl?: string | null }> = ({ username, avatarUrl }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden"
    style={!avatarUrl ? { background: 'linear-gradient(135deg, #d946ef, #a855f7)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }}
  >
    {avatarUrl ? (
      <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
    ) : (
      username.slice(0, 2).toUpperCase()
    )}
  </div>
);

const BurbujaMensaje: FC<{ 
  mensaje: MensajeEvento; 
  esMio: boolean; 
  onReply: (m: MensajeEvento) => void;
  onLike: (id: string) => Promise<boolean>;
  getLikes: (id: string) => Promise<{count: number, userLiked: boolean}>;
}> = ({ mensaje, esMio, onReply, onLike, getLikes }) => {
  const username = mensaje.profiles?.username ?? 'Usuario';
  const avatarUrl = mensaje.profiles?.avatar_url;
  
  const [likesCount, setLikesCount] = useState(mensaje.likes?.[0]?.count || 0);
  const [userLiked, setUserLiked] = useState(false);
  
  useEffect(() => {
    getLikes(mensaje.id).then(res => {
      setLikesCount(res.count);
      setUserLiked(res.userLiked);
    });
  }, [mensaje.id, getLikes]);

  const handleLike = async () => {
    // Optimistic UI
    setUserLiked(!userLiked);
    setLikesCount(prev => userLiked ? Math.max(0, prev - 1) : prev + 1);
    
    const ok = await onLike(mensaje.id);
    if (!ok) {
      // Revert if failed
      setUserLiked(!userLiked);
      setLikesCount(prev => !userLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  return (
    <div className={`flex gap-2.5 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
      <AvatarMensaje username={username} avatarUrl={avatarUrl} />
      <div className={`flex flex-col gap-1 max-w-[85%] ${esMio ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-white/60 text-[10px] font-medium">{username}</span>
          <span className="text-white/35 text-[10px]">{tiempoRelativo(mensaje.created_at)}</span>
        </div>
        
        <div className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
          <div
            className="px-3 py-2 rounded-2xl text-sm text-white leading-relaxed text-pretty relative group"
            style={
              esMio
                ? { background: 'linear-gradient(135deg, #d946ef88, #a855f788)', border: '1px solid rgba(217,70,239,0.3)', borderTopRightRadius: '4px' }
                : { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: '4px' }
            }
          >
            {mensaje.reply_to_id && (
              <div className="text-[10px] text-white/50 mb-1 pb-1 border-b border-white/10 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Respuesta a {mensaje.reply_to?.profiles?.username || 'usuario'}
              </div>
            )}
            {mensaje.contenido}
            
            {/* Acciones flotantes */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${esMio ? 'right-[calc(100%+8px)] flex-row-reverse' : 'left-[calc(100%+8px)]'}`}>
              <button onClick={() => onReply(mensaje)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Responder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 mt-1 px-1 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
            <button onClick={handleLike} className={`flex items-center gap-1 text-[11px] ${userLiked ? 'text-pink-400' : 'text-white/40 hover:text-white/70'} transition-colors`}>
              {userLiked ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button onClick={() => onReply(mensaje)} className="text-[11px] text-white/40 hover:text-white/70 transition-colors font-medium">
              Responder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SeccionMensajes: FC<SeccionMensajesProps> = ({ eventoId, creadorId, onAbrirLogin }) => {
  const { user } = useAuth();
  const { mensajes, cargando, enviando, error, enviarMensaje, toggleLikeMensaje, getMensajeLikes, resetError } = useMensajesEvento(eventoId);
  const [texto, setTexto] = useState('');
  const [replyTo, setReplyTo] = useState<MensajeEvento | null>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esCreador = !!user && user.id === creadorId;

  // Scroll al último mensaje nuevo
  useEffect(() => {
    if (mensajes.length > 0) {
      finalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes.length]);

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    const ok = await enviarMensaje(texto, replyTo?.id);
    if (ok) {
      setTexto('');
      setReplyTo(null);
    }
  };

  const handleReply = (mensaje: MensajeEvento) => {
    setReplyTo(mensaje);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnviar();
    }
  };

  // ——— NO AUTENTICADO ———
  if (!user) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="rgba(217,70,239,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm text-balance">
            Comentarios del evento
          </p>
          <p className="text-lavender text-xs mt-1 text-pretty">
            Inicia sesión para dejar un comentario o hacer una pregunta
          </p>
        </div>
        <button
          onClick={onAbrirLogin}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)' }}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  // ——— AUTENTICADO ———
  return (
    <div className="flex flex-col gap-3">
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="rgba(217,70,239,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 className="text-white font-bold text-sm">
          Comentarios
        </h3>
        {mensajes.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(217,70,239,0.2)', color: '#e879f9' }}
          >
            {mensajes.length}
          </span>
        )}
      </div>

      {/* Lista de mensajes */}
      <div
        className="rounded-2xl overflow-y-auto flex flex-col gap-3 p-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '280px',
          minHeight: '80px',
        }}
      >
        {cargando && (
          <div className="flex items-center justify-center py-6 gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(217,70,239,0.5)', borderTopColor: 'transparent' }}
            />
            <span className="text-lavender text-xs">Cargando mensajes...</span>
          </div>
        )}

        {!cargando && mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-lavender text-xs text-center">
              Sé el primero en dejar un comentario
            </p>
          </div>
        )}

        {!cargando && mensajes.map((m) => (
          <BurbujaMensaje
            key={m.id}
            mensaje={m}
            esMio={m.remitente_id === user.id}
            onReply={handleReply}
            onLike={toggleLikeMensaje}
            getLikes={getMensajeLikes}
          />
        ))}
        <div ref={finalRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p className="text-red-300 text-xs flex-1">{error}</p>
          <button onClick={resetError} className="text-red-300/60 text-xs hover:text-red-300">✕</button>
        </div>
      )}

      {/* Campo para escribir */}
      <div className="flex flex-col gap-2">
        {replyTo && (
          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-xs text-lavender border border-white/10">
            <span className="truncate flex-1">
              Respondiendo a <span className="font-semibold text-white">{replyTo.profiles?.username || 'usuario'}</span>: {replyTo.contenido}
            </span>
            <button onClick={() => setReplyTo(null)} className="ml-2 p-1 hover:text-white transition-colors" title="Cancelar respuesta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
        <div
          className="rounded-2xl overflow-hidden flex items-center bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => { setTexto(e.target.value); if (error) resetError(); }}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? "Escribe tu respuesta..." : "Añade un comentario..."}
            maxLength={500}
            className="flex-1 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none bg-transparent"
          />
          <div className="pr-2 shrink-0 flex items-center gap-2">
            <span className={`text-[10px] hidden sm:inline-block ${texto.length > 450 ? 'text-amber-400' : 'text-white/30'}`}>
              {texto.length}/500
            </span>
            <button
              onClick={handleEnviar}
              disabled={enviando || !texto.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)' }}
            >
              {enviando ? (
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeccionMensajes;
