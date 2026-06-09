-- Add descripcion column to eventos
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS descripcion text NOT NULL DEFAULT '';

-- Create likes_evento table
CREATE TABLE IF NOT EXISTS likes_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES eventos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

-- RLS policies for likes_evento
ALTER TABLE likes_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public likes_evento select" ON likes_evento
  FOR SELECT USING (true);

CREATE POLICY "Users can like" ON likes_evento
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON likes_evento
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable Realtime for likes_evento
alter publication supabase_realtime add table likes_evento;

-- RPC for toggling likes to prevent race conditions
CREATE OR REPLACE FUNCTION toggle_like(p_evento_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_likes integer;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM likes_evento 
    WHERE evento_id = p_evento_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM likes_evento WHERE evento_id = p_evento_id AND user_id = v_user_id;
    UPDATE eventos SET likes = GREATEST(likes - 1, 0) WHERE id = p_evento_id RETURNING likes INTO v_likes;
  ELSE
    INSERT INTO likes_evento (evento_id, user_id) VALUES (p_evento_id, v_user_id);
    UPDATE eventos SET likes = COALESCE(likes, 0) + 1 WHERE id = p_evento_id RETURNING likes INTO v_likes;
  END IF;

  RETURN v_likes;
END;
$$;