import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificacionRow } from '@/types/types';

export function useNotificaciones() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionRow[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);

  const fetchNotificaciones = async () => {
    if (!user) {
      setNotificaciones([]);
      setNoLeidas(0);
      setCargando(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select(`
          id, user_id, actor_id, evento_id, tipo, leida, created_at,
          actor:profiles!actor_id(username),
          evento:eventos(titulo)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transformar datos para aplanar las relaciones si es necesario
      const notifsTransformadas = (data || []).map((n: any) => ({
        ...n,
        actor: Array.isArray(n.actor) ? n.actor[0] : n.actor,
        evento: Array.isArray(n.evento) ? n.evento[0] : n.evento,
      })) as NotificacionRow[];

      setNotificaciones(notifsTransformadas);
      setNoLeidas(notifsTransformadas.filter(n => !n.leida).length);
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();

    if (!user) return;

    // Suscribirse a cambios en tiempo real en la tabla notificaciones
    const channel = supabase
      .channel('notificaciones-cambios')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Recargar las notificaciones cuando hay un INSERT
          // Se podría agregar directamente al array local, pero recargar garantiza obtener
          // los datos con los JOINs actualizados (actor y evento).
          fetchNotificaciones();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotificaciones((prev) => 
            prev.map((n) => n.id === payload.new.id ? { ...n, ...payload.new } : n)
          );
          // Recalcular noLeidas
          setNoLeidas((prev) => {
            const oldValue = payload.old?.leida ?? false;
            const newValue = payload.new?.leida ?? false;
            if (!oldValue && newValue) return Math.max(0, prev - 1);
            if (oldValue && !newValue) return prev + 1;
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const marcarComoLeidas = async () => {
    if (!user || noLeidas === 0) return;

    // Actualización optimista
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);

    const unreadIds = notificaciones.filter(n => !n.leida).map(n => n.id);
    
    if (unreadIds.length > 0) {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .in('id', unreadIds);
    }
  };

  return { notificaciones, noLeidas, cargando, marcarComoLeidas, recargar: fetchNotificaciones };
}
