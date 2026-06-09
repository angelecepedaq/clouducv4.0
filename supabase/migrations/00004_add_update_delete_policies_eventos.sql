
-- Política UPDATE: solo el dueño puede actualizar su evento
CREATE POLICY "solo_dueno_actualiza_evento" ON public.eventos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: solo el dueño puede eliminar su evento
CREATE POLICY "solo_dueno_elimina_evento" ON public.eventos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
