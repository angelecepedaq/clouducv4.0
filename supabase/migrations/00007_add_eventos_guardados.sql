CREATE TABLE IF NOT EXISTS eventos_guardados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES eventos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

ALTER TABLE eventos_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved events" ON eventos_guardados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save events" ON eventos_guardados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave events" ON eventos_guardados
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
