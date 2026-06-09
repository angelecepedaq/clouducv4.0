CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias notificaciones" 
ON notificaciones FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones" 
ON notificaciones FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Habilitar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

-- Función para insertar notificaciones automáticamente al dar like
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    v_evento_owner UUID;
BEGIN
    SELECT user_id INTO v_evento_owner FROM eventos WHERE id = NEW.evento_id;
    
    -- Solo notificar si el dueño del evento no es el mismo que da el like
    IF v_evento_owner IS NOT NULL AND v_evento_owner != NEW.user_id THEN
        INSERT INTO notificaciones (user_id, actor_id, evento_id, tipo)
        VALUES (v_evento_owner, NEW.user_id, NEW.evento_id, 'like');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_like_evento ON likes_evento;
CREATE TRIGGER on_like_evento
    AFTER INSERT ON likes_evento
    FOR EACH ROW EXECUTE FUNCTION handle_new_like();
