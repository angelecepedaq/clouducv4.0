
-- Política: inserción pública sin autenticación
CREATE POLICY "insercion_publica_eventos" ON eventos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
