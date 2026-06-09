
-- Tabla principal de eventos universitarios
CREATE TABLE eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('Académicos', 'Culturales', 'Deportivos')),
  fecha text NOT NULL,
  hora text NOT NULL,
  asistentes integer NOT NULL DEFAULT 0,
  imagen text NOT NULL,
  avatares text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública sin autenticación
CREATE POLICY "lectura_publica_eventos" ON eventos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Publicar en Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE eventos;
