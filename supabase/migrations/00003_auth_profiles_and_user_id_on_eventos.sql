
-- 1. Enum de roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- 2. Tabla profiles sincronizada con auth.users
CREATE TABLE public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username  text UNIQUE NOT NULL,
  email     text,
  role      public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper anti-recursión
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan su propio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM public.get_user_role(auth.uid()));

-- Vista pública de perfiles (info no sensible)
CREATE VIEW public.public_profiles AS
  SELECT id, username, role FROM public.profiles;

-- 4. Trigger para sincronizar auth.users → profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user'::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Añadir columna user_id a eventos (nullable para datos existentes)
ALTER TABLE public.eventos
  ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 6. Eliminar política INSERT pública anterior y crear una restrictiva para autenticados
DROP POLICY IF EXISTS "insercion_publica_eventos" ON public.eventos;

CREATE POLICY "solo_autenticados_insertan_eventos" ON public.eventos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Política SELECT pública (mantener existente si aplica, de lo contrario crear)
DROP POLICY IF EXISTS "lectura_publica_eventos" ON public.eventos;

CREATE POLICY "lectura_publica_eventos" ON public.eventos
  FOR SELECT TO anon, authenticated
  USING (true);
