-- Make mensajes_evento a public comment section
ALTER TABLE public.mensajes_evento ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.mensajes_evento(id) ON DELETE CASCADE;

-- Drop old policies
DROP POLICY IF EXISTS "insertar_mensaje_evento_ajeno" ON public.mensajes_evento;
DROP POLICY IF EXISTS "ver_mensajes_propios_o_de_mi_evento" ON public.mensajes_evento;

-- Everyone can see messages of an event
CREATE POLICY "ver_mensajes_publico" ON public.mensajes_evento
FOR SELECT USING (true);

-- Authenticated users can insert messages
CREATE POLICY "insertar_mensaje_publico" ON public.mensajes_evento
FOR INSERT TO authenticated WITH CHECK (remitente_id = auth.uid());

-- Allow deleting own messages
CREATE POLICY "eliminar_mensaje_propio" ON public.mensajes_evento
FOR DELETE TO authenticated USING (remitente_id = auth.uid());

-- Create likes_mensaje table
CREATE TABLE IF NOT EXISTS public.likes_mensaje (
    mensaje_id uuid REFERENCES public.mensajes_evento(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (mensaje_id, user_id)
);

ALTER TABLE public.likes_mensaje ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver_likes_mensaje_publico" ON public.likes_mensaje
FOR SELECT USING (true);

CREATE POLICY "insertar_like_mensaje" ON public.likes_mensaje
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "eliminar_like_mensaje" ON public.likes_mensaje
FOR DELETE TO authenticated USING (user_id = auth.uid());
