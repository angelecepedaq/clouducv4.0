
-- 1. Agregar columna direccion a la tabla eventos
ALTER TABLE public.eventos ADD COLUMN direccion text;

-- 2. Crear tabla mensajes_evento
CREATE TABLE public.mensajes_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  remitente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contenido text NOT NULL CHECK (char_length(contenido) <= 500 AND char_length(contenido) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX mensajes_evento_evento_id_idx ON public.mensajes_evento(evento_id);
CREATE INDEX mensajes_evento_remitente_id_idx ON public.mensajes_evento(remitente_id);

-- 4. Habilitar RLS
ALTER TABLE public.mensajes_evento ENABLE ROW LEVEL SECURITY;

-- 5. Función auxiliar: verifica si el usuario es el creador del evento
CREATE OR REPLACE FUNCTION public.can_see_mensajes_evento(p_evento_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eventos WHERE id = p_evento_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.mensajes_evento WHERE evento_id = p_evento_id AND remitente_id = auth.uid()
  );
$$;

-- 6. Función auxiliar: verifica que el usuario no sea el creador del evento (para INSERT)
CREATE OR REPLACE FUNCTION public.can_insert_mensaje(p_evento_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.eventos WHERE id = p_evento_id AND user_id = auth.uid()
  );
$$;

-- 7. Política SELECT: el creador del evento ve todos; el remitente ve los suyos
CREATE POLICY "ver_mensajes_propios_o_de_mi_evento" ON public.mensajes_evento
  FOR SELECT TO authenticated
  USING (can_see_mensajes_evento(evento_id));

-- 8. Política INSERT: autenticado, remitente_id = auth.uid(), no puede ser creador del evento
CREATE POLICY "insertar_mensaje_evento_ajeno" ON public.mensajes_evento
  FOR INSERT TO authenticated
  WITH CHECK (
    remitente_id = auth.uid()
    AND can_insert_mensaje(evento_id)
  );

-- 9. Habilitar Realtime en mensajes_evento
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_evento;
