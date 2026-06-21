// Tipos para Cloud UCV - Eventos Universitarios

export type Categoria = 'Todos' | 'Académicos' | 'Culturales' | 'Deportivos' | 'Comerciales';

// Tipo para la tabla profiles de Supabase
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  rol: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

// Tipo que mapea exactamente la estructura de la tabla Supabase
export interface EventoRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  imagen: string | null;
  is_private: boolean;
  max_attendees: number | null;
  is_published: boolean;
}

// Tipo usado en la UI (extiende EventoRow con estado local de bookmark y like)
export interface Evento extends EventoRow {
  guardado: boolean;
  like_local?: boolean;
  likes_count?: number;
}


// Tipo para mensajes privados al administrador del evento
export interface MensajeEvento {
  id: string;
  evento_id: string;
  remitente_id: string;
  contenido: string;
  created_at: string;
  reply_to_id?: string | null;
  // JOIN con profiles para mostrar username y avatar del remitente
  profiles?: { username: string; avatar_url?: string | null } | null;
  // Conteo de likes
  likes?: { count: number }[];
  // Mensaje al que se responde (JOIN recursivo opcional)
  reply_to?: { profiles?: { username: string } | null } | null;
}

export type TabNavegacion = 'inicio' | 'explorar' | 'calendario' | 'perfil';

export interface NotificacionRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  evento_id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  
  // Relaciones
  actor?: { username: string } | null;
  evento?: { title: string } | null;
}

export interface AsistenteEvento {
  id: string;
  evento_id: string;
  user_id: string | null;
  nombre: string;
  email: string;
  codigo_confirmacion: string;
  created_at: string;
}

export interface SimulatedEmail {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  qr_data?: string | null;
  created_at: string;
}

export interface EventVerificationCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}
