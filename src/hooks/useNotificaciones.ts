import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { NotificacionRow } from '@/types/types'

export function useNotificaciones() {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState<NotificacionRow[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [cargando, setCargando] = useState(true)

  const fetchNotificaciones = useCallback(async () => {
    if (!user) {
      setNotificaciones([])
      setNoLeidas(0)
      setCargando(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('id, user_id, actor_id, evento_id, title, body, read, created_at, evento:eventos(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const filasRaw = Array.isArray(data) ? (data as unknown[]) : []
      const filas: NotificacionRow[] = filasRaw.map((item) => {
        const obj = item as Record<string, unknown>
        const evtRaw = obj.evento
        let evento: { title: string } | null = null
        if (Array.isArray(evtRaw) && evtRaw.length > 0) {
          const first = evtRaw[0] as Record<string, unknown>
          if (first && typeof first.title === 'string') evento = { title: first.title }
        } else if (evtRaw && typeof (evtRaw as Record<string, unknown>).title === 'string') {
          evento = { title: (evtRaw as Record<string, unknown>).title as string }
        }

        return {
          id: String(obj.id ?? ''),
          user_id: String(obj.user_id ?? ''),
          actor_id: obj.actor_id == null ? null : String(obj.actor_id),
          evento_id: String(obj.evento_id ?? ''),
          title: String(obj.title ?? ''),
          body: obj.body == null ? null : String(obj.body),
          read: Boolean(obj.read),
          created_at: String(obj.created_at ?? ''),
          actor: undefined,
          evento,
        }
      })
      const actorIds = Array.from(new Set(filas.map((n) => n.actor_id).filter(Boolean)))

      const actoresMap: Record<string, { username: string } | undefined> = {}
      if (actorIds.length > 0) {
        const { data: actores } = await supabase.from('profiles').select('id, username').in('id', actorIds as string[])
        if (Array.isArray(actores)) {
          (actores as { id: string; username?: string }[]).forEach((a) => {
            if (a?.id && typeof a.username === 'string') actoresMap[a.id] = { username: a.username }
          })
        }
      }
      const transformed: NotificacionRow[] = filas.map((n) => ({
        ...n,
        actor: actoresMap[n.actor_id ?? ''] ?? null,
      }))

      setNotificaciones(transformed)
      setNoLeidas(transformed.filter((t) => !t.read).length)
    } catch (err) {
      console.error('Error fetching notificaciones:', err)
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotificaciones()

    if (!user) return

    const channel = supabase
      .channel('notificaciones-cambios')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${user.id}` }, () => fetchNotificaciones())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotificaciones((prev) => prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n)))
        setNoLeidas((prev) => {
          const oldValue = payload.old?.read ?? false
          const newValue = payload.new?.read ?? false
          if (!oldValue && newValue) return Math.max(0, prev - 1)
          if (oldValue && !newValue) return prev + 1
          return prev
        })
      })

    try {
      channel.subscribe()
    } catch (err) {
      console.error('subscribe error', err)
    }

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [user, fetchNotificaciones])

  const marcarComoLeidas = async () => {
    if (!user || noLeidas === 0) return
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })))
    setNoLeidas(0)
    const unreadIds = notificaciones.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notificaciones').update({ read: true }).in('id', unreadIds)
    }
  }

  return { notificaciones, noLeidas, cargando, marcarComoLeidas, recargar: fetchNotificaciones }
}
